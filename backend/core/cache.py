"""
Redis Cache Service
Provides caching functionality for high-frequency API endpoints.
"""
import json
import logging
from typing import Optional, Any, Callable
from functools import wraps
import redis
from redis.exceptions import RedisError
from backend.core.config import settings

logger = logging.getLogger(__name__)


class RedisCache:
    """Redis cache manager with connection pooling"""

    def __init__(self):
        self.client: Optional[redis.Redis] = None
        self._connect()

    def _connect(self):
        """Establish Redis connection"""
        try:
            self.client = redis.Redis(
                host=settings.REDIS_HOST,
                port=settings.REDIS_PORT,
                db=settings.REDIS_DB,
                password=settings.REDIS_PASSWORD if settings.REDIS_PASSWORD else None,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_keepalive=True,
                health_check_interval=30,
            )
            # Test connection
            self.client.ping()
            logger.info(f"✅ Redis connected: {settings.REDIS_HOST}:{settings.REDIS_PORT}")
        except RedisError as e:
            logger.warning(f"⚠️ Redis connection failed: {e}. Caching disabled.")
            self.client = None

    def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        if not self.client:
            return None

        try:
            value = self.client.get(key)
            if value:
                logger.debug(f"🎯 Cache HIT: {key}")
                return json.loads(value)
            logger.debug(f"❌ Cache MISS: {key}")
            return None
        except (RedisError, json.JSONDecodeError) as e:
            logger.error(f"Cache get error: {e}")
            return None

    def set(self, key: str, value: Any, ttl: int = None) -> bool:
        """Set value in cache with TTL"""
        if not self.client:
            return False

        try:
            ttl = ttl or settings.CACHE_TTL
            serialized = json.dumps(value, default=str)
            self.client.setex(key, ttl, serialized)
            logger.debug(f"💾 Cache SET: {key} (TTL: {ttl}s)")
            return True
        except (RedisError, TypeError) as e:
            logger.error(f"Cache set error: {e}")
            return False

    def delete(self, *keys: str) -> int:
        """Delete one or more keys from cache"""
        if not self.client or not keys:
            return 0

        try:
            deleted = self.client.delete(*keys)
            logger.debug(f"🗑️ Cache DELETE: {keys} ({deleted} keys)")
            return deleted
        except RedisError as e:
            logger.error(f"Cache delete error: {e}")
            return 0

    def delete_pattern(self, pattern: str) -> int:
        """Delete all keys matching pattern"""
        if not self.client:
            return 0

        try:
            keys = list(self.client.scan_iter(match=pattern))
            if keys:
                deleted = self.client.delete(*keys)
                logger.debug(f"🗑️ Cache DELETE pattern '{pattern}': {deleted} keys")
                return deleted
            return 0
        except RedisError as e:
            logger.error(f"Cache delete pattern error: {e}")
            return 0

    def clear_user_cache(self, user_id: str):
        """Clear all cache for a specific user"""
        patterns = [
            f"dashboard:stats:{user_id}",
            f"projects:list:{user_id}:*",
            f"documents:list:*:{user_id}",
            f"user:profile:{user_id}",
        ]
        for pattern in patterns:
            self.delete_pattern(pattern)
        logger.info(f"🧹 Cleared cache for user: {user_id}")

    def health_check(self) -> bool:
        """Check if Redis is healthy"""
        if not self.client:
            return False
        try:
            return self.client.ping()
        except RedisError:
            return False


# Global cache instance
cache = RedisCache()


def cached(key_prefix: str, ttl: int = None):
    """
    Decorator for caching function results.

    Usage:
        @cached(key_prefix="my_function", ttl=60)
        def my_function(user_id: str):
            # expensive operation
            return result

    The cache key will be: {key_prefix}:{arg1}:{arg2}:...
    """
    def decorator(func: Callable):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Build cache key from function arguments
            key_parts = [key_prefix]

            # Add positional args (skip 'self' if it's a method)
            start_idx = 1 if args and hasattr(args[0], '__dict__') else 0
            for arg in args[start_idx:]:
                # Convert to string, handle UUIDs and objects
                key_parts.append(str(arg))

            # Add keyword args
            for k, v in sorted(kwargs.items()):
                if k not in ['db', 'current_user', 'skip', 'limit']:  # Skip DB session and pagination
                    key_parts.append(f"{k}={v}")

            cache_key = ":".join(key_parts)

            # Try to get from cache
            cached_value = cache.get(cache_key)
            if cached_value is not None:
                return cached_value

            # Execute function and cache result
            result = func(*args, **kwargs)
            cache.set(cache_key, result, ttl=ttl)
            return result

        return wrapper
    return decorator


def invalidate_on_change(patterns: list[str]):
    """
    Decorator to invalidate cache patterns after a mutation.

    Usage:
        @invalidate_on_change(patterns=["projects:list:{user_id}:*"])
        def create_project(user_id: str, ...):
            # create project
            return project
    """
    def decorator(func: Callable):
        @wraps(func)
        def wrapper(*args, **kwargs):
            result = func(*args, **kwargs)

            # Invalidate cache patterns
            for pattern in patterns:
                # Try to format pattern with function args if possible
                try:
                    formatted_pattern = pattern.format(**kwargs)
                    cache.delete_pattern(formatted_pattern)
                except (KeyError, AttributeError):
                    # If formatting fails, use pattern as-is
                    cache.delete_pattern(pattern)

            return result

        return wrapper
    return decorator
