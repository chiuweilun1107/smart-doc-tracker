
import os
from pydantic import computed_field
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Force load .env from project root
# config.py is in backend/core/
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
env_path = os.path.join(project_root, '.env')
load_dotenv(env_path)

class Settings(BaseSettings):
    PROJECT_NAME: str = "Smart Doc Tracker API"
    API_V1_STR: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    
    # Supabase - We use these for auth verification
    SUPABASE_URL: str = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "") # Anon Key for auth verification
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "") # Service Role Key bypasses RLS
    
    # JWT Settings (If verifying locally without API call, need JWT_SECRET)
    # But for now we will trust Supabase client based verification or simple decoding if secret provided
    SUPABASE_JWT_SECRET: str = os.getenv("SUPABASE_JWT_SECRET", "") 

    # Azure OpenAI Settings
    AZURE_OPENAI_API_KEY: str = os.getenv("AZURE_OPENAI_API_KEY", "")
    AZURE_OPENAI_ENDPOINT: str = os.getenv("AZURE_OPENAI_ENDPOINT", "")
    AZURE_OPENAI_API_VERSION: str = os.getenv("AZURE_OPENAI_API_VERSION", "2024-02-15-preview")
    AZURE_OPENAI_DEPLOYMENT: str = os.getenv("AZURE_OPENAI_DEPLOYMENT", "gpt-4")

    # Line Messaging API
    LINE_CHANNEL_ACCESS_TOKEN: str = os.getenv("LINE_CHANNEL_ACCESS_TOKEN", "")
    LINE_CHANNEL_SECRET: str = os.getenv("LINE_CHANNEL_SECRET", "")

    # Email — supports "smtp" (Gmail) or "resend"
    EMAIL_PROVIDER: str = os.getenv("EMAIL_PROVIDER", "smtp")  # "smtp" or "resend"

    # SMTP (Gmail)
    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")  # Gmail App Password
    SMTP_FROM_NAME: str = os.getenv("SMTP_FROM_NAME", "Smart Doc Tracker")

    # Resend (alternative)
    RESEND_API_KEY: str = os.getenv("RESEND_API_KEY", "")
    RESEND_FROM_EMAIL: str = os.getenv("RESEND_FROM_EMAIL", "")

    # Redis Settings
    REDIS_HOST: str = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT: int = int(os.getenv("REDIS_PORT", "6379"))
    REDIS_DB: int = int(os.getenv("REDIS_DB", "0"))
    REDIS_PASSWORD: str = os.getenv("REDIS_PASSWORD", "")
    CACHE_TTL: int = int(os.getenv("CACHE_TTL", "300"))  # Default 5 minutes

    # App URL (used in emails, invitations, etc.)
    APP_URL: str = os.getenv("APP_URL", "https://5-78-118-41.sslip.io")

    # Admin Settings
    ADMIN_EMAILS: str = os.getenv("ADMIN_EMAILS", "chiuweilun1107@gmail.com")

    # CORS Settings (comma-separated string from env, fallback to hardcoded defaults)
    CORS_ORIGINS_STR: str = os.getenv("CORS_ORIGINS", "")

    @computed_field
    @property
    def CORS_ORIGINS(self) -> list[str]:
        if self.CORS_ORIGINS_STR:
            return [origin.strip() for origin in self.CORS_ORIGINS_STR.split(",") if origin.strip()]
        return [
            "http://localhost:3000",
            "http://localhost:3001",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:3001",
            "https://5-78-118-41.sslip.io",
            "http://5.78.118.41:3000",
        ]

    class Config:
        case_sensitive = True

settings = Settings()
