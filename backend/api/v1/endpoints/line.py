
from fastapi import APIRouter, Header, Request, HTTPException, Depends
from linebot import WebhookParser
from linebot.exceptions import InvalidSignatureError
from linebot.models import MessageEvent, TextMessage, FollowEvent, PostbackEvent
from sqlalchemy.orm import Session

from backend.core.config import settings
from backend.core.database import get_db
from backend.services.line_bot import LineBotService

router = APIRouter()
line_bot_service = LineBotService()

# Initialize parser
parser = None
if settings.LINE_CHANNEL_SECRET:
    parser = WebhookParser(settings.LINE_CHANNEL_SECRET)

@router.post("/webhook")
async def line_webhook(
    request: Request,
    x_line_signature: str = Header(None),
    db: Session = Depends(get_db)
):
    if not parser:
        raise HTTPException(status_code=500, detail="Line Channel Secret not configured")
        
    if not x_line_signature:
        raise HTTPException(status_code=400, detail="Missing X-Line-Signature header")

    # Get body as bytes
    body_bytes = await request.body()
    body = body_bytes.decode('utf-8')

    try:
        events = parser.parse(body, x_line_signature)
    except InvalidSignatureError:
        raise HTTPException(status_code=400, detail="Invalid signature")

    for event in events:
        try:
            if isinstance(event, FollowEvent):
                line_bot_service.handle_follow(db, event)
            elif isinstance(event, MessageEvent) and isinstance(event.message, TextMessage):
                line_bot_service.handle_message(db, event)
            elif isinstance(event, PostbackEvent):
                line_bot_service.handle_postback(db, event)
        except Exception as e:
            print(f"Error handling event: {e}")
            # Don't raise error to Line server, just log it
            
    return "OK"
