
import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from typing import List
from sqlalchemy.orm import Session
from backend.core import deps
from backend.core.config import settings
from backend.core.permissions import verify_project_access
from backend.services.parser import parser_service
from backend.models import Project, Document, DeadlineEvent
from backend.schemas.document import EventUpdate, DocumentUpdate
from supabase import create_client, Client

logger = logging.getLogger(__name__)

# Initialize Supabase Client with Service Role Key (bypasses RLS for backend operations)
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY) if settings.SUPABASE_URL and settings.SUPABASE_SERVICE_ROLE_KEY else None

router = APIRouter()


def get_supabase_user_client(token: str) -> Client:
    """Helper to get a supabase client authenticated as the user"""
    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
        raise HTTPException(500, "Supabase credentials not configured")
    client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
    client.auth.set_session(token, "ref_token_placeholder")
    return client


async def process_document_background(document_id: str, file_content: bytes, user_id: str, file_type: str = "pdf"):
    """
    Background task to process document:
    1. Extract text from document (PDF/DOCX/DOC)
    2. Analyze with LLM to find deadlines
    3. Save results to database
    """
    if not supabase:
        logger.error("Supabase client not initialized")
        return

    logger.info(f"Starting background processing for doc {document_id} (type: {file_type})")

    try:
        # 1. Extract text from document
        text = parser_service.extract_text(file_content, file_type)

        if not text:
            logger.warning(f"Failed to extract text for doc {document_id}")
            supabase.table("documents").update({
                "status": "error",
                "raw_content": "Failed to extract text from PDF"
            }).eq("id", document_id).execute()
            return

        # Save extracted text
        supabase.table("documents").update({
            "raw_content": text[:10000]
        }).eq("id", document_id).execute()

        # 2. Analyze text with LLM to find deadlines
        events_data = parser_service.analyze_text_with_llm(text)
        logger.info(f"Extracted {len(events_data)} events for doc {document_id}")

        # 3. Save deadline events
        if events_data:
            events_to_insert = []
            for event in events_data:
                event_data = {
                    "id": str(uuid.uuid4()),
                    "document_id": document_id,
                    "title": event.get("title", "Untitled Event"),
                    "due_date": event.get("due_date"),
                    "status": "pending",
                    "confidence_score": event.get("confidence_score", 0),
                    "source_text": event.get("source_text", "")[:500],
                    "description": event.get("description")
                }
                events_to_insert.append(event_data)

            supabase.table("deadline_events").insert(events_to_insert).execute()
            logger.info(f"Inserted {len(events_to_insert)} deadline events")

        # Update document status to completed
        supabase.table("documents").update({
            "status": "completed"
        }).eq("id", document_id).execute()

        logger.info(f"Successfully completed processing for doc {document_id}")

    except Exception as e:
        logger.error(f"Error processing document {document_id}: {e}")
        try:
            supabase.table("documents").update({
                "status": "error",
                "raw_content": f"Processing error: {str(e)}"
            }).eq("id", document_id).execute()
        except Exception as update_error:
            logger.error(f"Failed to update error status: {update_error}")


@router.post("/upload")
async def upload_document(
    background_tasks: BackgroundTasks,
    project_id: str,
    file: UploadFile = File(...),
    current_user = Depends(deps.get_current_user),
):
    """
    Upload a PDF document and start processing.
    Returns document metadata immediately while processing happens in background.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection error")

    # Validate file type
    allowed_types = {
        "application/pdf": "pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
        "application/msword": "doc"
    }

    if file.content_type not in allowed_types:
        raise HTTPException(
            400,
            f"Unsupported file type. Allowed: PDF, DOCX, DOC. Got: {file.content_type}"
        )

    file_type = allowed_types[file.content_type]

    # Verify project access (owner or accepted member)
    verify_project_access(project_id, str(current_user.id), supabase)

    file_content = await file.read()

    # Generate unique storage path
    file_ext = file.filename.split(".")[-1] if "." in file.filename else file_type
    doc_id = str(uuid.uuid4())
    storage_path = f"{current_user.id}/{project_id}/{doc_id}.{file_ext}"

    try:
        upload_response = supabase.storage.from_("documents").upload(
            path=storage_path,
            file=file_content,
            file_options={"content-type": file.content_type}
        )

        if not upload_response:
            raise HTTPException(status_code=500, detail="Failed to upload file to storage")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Storage upload error: {e}")
        raise HTTPException(status_code=500, detail="伺服器內部錯誤，請稍後再試")

    # Create document record in database
    try:
        document_data = {
            "id": doc_id,
            "project_id": project_id,
            "original_filename": file.filename,
            "storage_path": storage_path,
            "file_path": storage_path,
            "file_type": file_type,
            "status": "processing",
            "parsing_status": "processing",
            "raw_content": None
        }

        doc_response = supabase.table("documents").insert(document_data).execute()

        if not doc_response.data:
            raise HTTPException(status_code=500, detail="Failed to create document record")

        # Start background processing
        background_tasks.add_task(
            process_document_background,
            doc_id,
            file_content,
            str(current_user.id),
            file_type
        )

        return {
            "id": doc_id,
            "filename": file.filename,
            "status": "processing",
            "message": "Document uploaded successfully and processing started"
        }

    except HTTPException:
        raise
    except Exception as e:
        # Cleanup: Try to delete uploaded file if DB insert failed
        try:
            supabase.storage.from_("documents").remove([storage_path])
        except:
            pass

        logger.error(f"Document creation error: {e}")
        raise HTTPException(status_code=500, detail="伺服器內部錯誤，請稍後再試")


@router.get("/{id}")
def read_document(
    id: uuid.UUID,
    current_user = Depends(deps.get_current_user),
):
    """
    Get document by ID, including its parsed events.
    """
    if not supabase:
         raise HTTPException(status_code=500, detail="Database connection error")

    try:
        # Fetch Document
        doc_response = supabase.table("documents").select("*").eq("id", str(id)).single().execute()
        if not doc_response.data:
            raise HTTPException(status_code=404, detail="Document not found")

        doc = doc_response.data

        # Verify access via project (owner or accepted member)
        verify_project_access(doc["project_id"], str(current_user.id), supabase)

        # Fetch Events
        events_response = supabase.table("deadline_events").select("*").eq("document_id", str(id)).execute()

        return {
            "document": doc,
            "events": events_response.data if events_response.data else []
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching document: {e}")
        raise HTTPException(status_code=500, detail="伺服器內部錯誤，請稍後再試")

@router.put("/events/{event_id}")
def update_event(
    event_id: uuid.UUID,
    event_in: EventUpdate,
    current_user = Depends(deps.get_current_user),
):
    """
    Update a deadline event (e.g. confirm date, change title).
    """
    if not supabase:
         raise HTTPException(status_code=500, detail="Database connection error")

    try:
        # Get event -> doc_id
        event_res = supabase.table("deadline_events").select("document_id").eq("id", str(event_id)).single().execute()
        if not event_res.data:
            raise HTTPException(status_code=404, detail="Event not found")

        doc_id = event_res.data["document_id"]

        # Get doc -> project_id
        doc_res = supabase.table("documents").select("project_id").eq("id", doc_id).single().execute()
        if not doc_res.data:
             raise HTTPException(status_code=404, detail="Document not found")

        project_id = doc_res.data["project_id"]

        # Verify access (owner or accepted member)
        verify_project_access(project_id, str(current_user.id), supabase)

        # Build update dict from Pydantic model, excluding unset fields
        update_data = event_in.model_dump(exclude_unset=True)

        if not update_data:
            return {"message": "No fields to update"}

        response = supabase.table("deadline_events").update(update_data).eq("id", str(event_id)).execute()
        return response.data[0] if response.data else {}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating event: {e}")
        raise HTTPException(status_code=500, detail="伺服器內部錯誤，請稍後再試")

@router.delete("/{id}")
def delete_document(
    id: uuid.UUID,
    current_user = Depends(deps.get_current_user),
):
    """
    Delete a document and its associated events.
    Also removes the file from storage.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection error")

    try:
        # Fetch document to get storage path
        doc_response = supabase.table("documents").select("*, project_id").eq("id", str(id)).single().execute()
        if not doc_response.data:
            raise HTTPException(status_code=404, detail="Document not found")

        doc = doc_response.data

        # Verify access (owner or accepted member)
        verify_project_access(doc["project_id"], str(current_user.id), supabase)

        # Delete from storage (if storage_path exists)
        if doc.get("storage_path"):
            try:
                supabase.storage.from_("documents").remove([doc["storage_path"]])
            except Exception as storage_error:
                logger.warning(f"Failed to delete file from storage: {storage_error}")

        # Delete deadline_events
        supabase.table("deadline_events").delete().eq("document_id", str(id)).execute()

        # Delete document record
        supabase.table("documents").delete().eq("id", str(id)).execute()

        return {"message": "Document deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting document: {e}")
        raise HTTPException(status_code=500, detail="伺服器內部錯誤，請稍後再試")

@router.patch("/{id}")
def update_document(
    id: uuid.UUID,
    update_data: DocumentUpdate,
    current_user = Depends(deps.get_current_user),
):
    """
    Update document metadata (e.g., filename).
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection error")

    try:
        # Fetch document to verify access
        doc_response = supabase.table("documents").select("project_id").eq("id", str(id)).single().execute()
        if not doc_response.data:
            raise HTTPException(status_code=404, detail="Document not found")

        # Verify access (owner or accepted member)
        verify_project_access(doc_response.data["project_id"], str(current_user.id), supabase)

        # Build update dict from Pydantic model, excluding unset fields
        filtered_data = update_data.model_dump(exclude_unset=True)

        if not filtered_data:
            return {"message": "No valid fields to update"}

        # Update document
        response = supabase.table("documents").update(filtered_data).eq("id", str(id)).execute()

        if response.data and len(response.data) > 0:
            return response.data[0]
        else:
            raise HTTPException(status_code=500, detail="Failed to update document")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating document: {e}")
        raise HTTPException(status_code=500, detail="伺服器內部錯誤，請稍後再試")
