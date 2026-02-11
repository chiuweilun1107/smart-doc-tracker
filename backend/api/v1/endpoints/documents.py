
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from typing import List
from sqlalchemy.orm import Session
from backend.core import deps
from backend.core.config import settings
from backend.services.parser import parser_service
from backend.models import Project, Document, DeadlineEvent
from supabase import create_client, Client
import uuid
import os

# Initialize Supabase Client with Service Role Key (bypasses RLS for backend operations)
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY) if settings.SUPABASE_URL and settings.SUPABASE_SERVICE_ROLE_KEY else None

router = APIRouter()

# Simple dependency to get DB session if we were using direct DB access
# But here we are using Supabase Client for DB operations mostly to pass RLS context?
# Actually, for backend operations, we might want to use the SERVICE_ROLE key or 
# pass the user's JWT to Supabase client to respect RLS.
# Since we are verifying the token in `deps.get_current_user`, we have the User object.
# To perform DB writes that respect RLS, we should ideally instantiate a Supabase client *with the user's token*.

def get_supabase_user_client(token: str) -> Client:
    """Helper to get a supabase client authenticated as the user"""
    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
        raise HTTPException(500, "Supabase credentials not configured")
    client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
    client.auth.set_session(token, "ref_token_placeholder") # We only need access token for requests usually
    # Actually set_session takes access_token and refresh_token. 
    # A cleaner way is just passing headers to postgrest, but the python client manages state.
    # Alternative: Use the Service Role Key to bypass RLS for background tasks, 
    # but for user actions, we should respect permissions.
    return client

async def process_document_background(document_id: str, file_content: bytes, user_id: str, file_type: str = "pdf"):
    """
    Background task to process document:
    1. Extract text from document (PDF/DOCX/DOC)
    2. Analyze with LLM to find deadlines
    3. Save results to database
    """
    if not supabase:
        print(f"Error: Supabase client not initialized")
        return

    print(f"Starting background processing for doc {document_id} (type: {file_type})")

    try:
        # 1. Extract text from document
        text = parser_service.extract_text(file_content, file_type)

        if not text:
            print(f"Failed to extract text for doc {document_id}")
            # Update document status to error
            supabase.table("documents").update({
                "status": "error",
                "raw_content": "Failed to extract text from PDF"
            }).eq("id", document_id).execute()
            return

        # Save extracted text
        supabase.table("documents").update({
            "raw_content": text[:10000]  # Limit to 10k chars for storage
        }).eq("id", document_id).execute()

        # 2. Analyze text with LLM to find deadlines
        events_data = parser_service.analyze_text_with_llm(text)
        print(f"Extracted {len(events_data)} events for doc {document_id}")

        # 3. Save deadline events
        if events_data:
            events_to_insert = []
            for event in events_data:
                event_data = {
                    "id": str(uuid.uuid4()),
                    "document_id": document_id,
                    "title": event.get("title", "Untitled Event"),
                    "due_date": event.get("due_date"),  # Format: YYYY-MM-DD
                    "status": "pending",
                    "confidence_score": event.get("confidence_score", 0),
                    "source_text": event.get("source_text", "")[:500],  # Limit length
                    "description": event.get("description")
                }
                events_to_insert.append(event_data)

            # Insert all events
            supabase.table("deadline_events").insert(events_to_insert).execute()
            print(f"Inserted {len(events_to_insert)} deadline events")

        # Update document status to completed
        supabase.table("documents").update({
            "status": "completed"
        }).eq("id", document_id).execute()

        print(f"Successfully completed processing for doc {document_id}")

    except Exception as e:
        print(f"Error processing document {document_id}: {e}")
        # Update document status to error
        try:
            supabase.table("documents").update({
                "status": "error",
                "raw_content": f"Processing error: {str(e)}"
            }).eq("id", document_id).execute()
        except Exception as update_error:
            print(f"Failed to update error status: {update_error}")


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

    # Verify project ownership
    project_check = supabase.table("projects")\
        .select("id")\
        .eq("id", project_id)\
        .eq("owner_id", str(current_user.id))\
        .execute()

    if not project_check.data:
        raise HTTPException(status_code=403, detail="Project not found or access denied")

    file_content = await file.read()

    # Generate unique storage path
    file_ext = file.filename.split(".")[-1] if "." in file.filename else file_type
    doc_id = str(uuid.uuid4())
    storage_path = f"{current_user.id}/{project_id}/{doc_id}.{file_ext}"

    try:
        # Upload to Supabase Storage
        # Note: This requires the 'documents' bucket to exist in Supabase Storage
        upload_response = supabase.storage.from_("documents").upload(
            path=storage_path,
            file=file_content,
            file_options={"content-type": file.content_type}
        )

        # Check if upload was successful
        if not upload_response:
            raise HTTPException(status_code=500, detail="Failed to upload file to storage")

    except Exception as e:
        print(f"Storage upload error: {e}")
        raise HTTPException(status_code=500, detail=f"Storage upload failed: {str(e)}")

    # Create document record in database
    try:
        document_data = {
            "id": doc_id,
            "project_id": project_id,
            "original_filename": file.filename,
            "storage_path": storage_path,
            "file_path": storage_path,  # Keep for backward compatibility
            "file_type": file_type,
            "status": "processing",  # Will be updated by background task
            "parsing_status": "processing",  # Match database schema
            "raw_content": None  # Will be populated by background task
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

    except Exception as e:
        # Cleanup: Try to delete uploaded file if DB insert failed
        try:
            supabase.storage.from_("documents").remove([storage_path])
        except:
            pass

        print(f"Document creation error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create document: {str(e)}")
    
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
        # Ideally we should join with project to check owner_id for security
        # supabase.table("documents").select("*, projects!inner(owner_id)").eq("id", str(id)).eq("projects.owner_id", current_user.id).single()
        # Complex joins in supabase-py might need exact syntax or just rely on RLS if authenticated.
        # For now, let's fetch doc and verify project owner separately or trust RLS if we had user context.
        # Since we use anon key + manual query, let's fetch doc first.
        
        doc_response = supabase.table("documents").select("*").eq("id", str(id)).single().execute()
        if not doc_response.data:
            raise HTTPException(status_code=404, detail="Document not found")
        
        doc = doc_response.data
        
        # Verify ownership via project
        project_response = supabase.table("projects").select("owner_id").eq("id", doc["project_id"]).single().execute()
        if not project_response.data or project_response.data["owner_id"] != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to access this document")
            
        # Fetch Events
        events_response = supabase.table("deadline_events").select("*").eq("document_id", str(id)).execute()
        
        return {
            "document": doc,
            "events": events_response.data if events_response.data else []
        }

    except Exception as e:
        print(f"Error fetching document: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/events/{event_id}")
def update_event(
    event_id: uuid.UUID,
    event_in: dict, # Should use Pydantic model
    current_user = Depends(deps.get_current_user),
):
    """
    Update a deadline event (e.g. confirm date, change title).
    """
    if not supabase:
         raise HTTPException(status_code=500, detail="Database connection error")

    try:
        # Verify ownership (Event -> Doc -> Project -> Owner)
        # This chain is long. RLS is better.
        # Manual check:
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
        
        # Get project -> owner_id
        proj_res = supabase.table("projects").select("owner_id").eq("id", project_id).single().execute()
        if not proj_res.data or proj_res.data["owner_id"] != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
            
        # Update
        # Allow updating title, due_date, status, description
        update_data = {}
        allowed_fields = ["title", "due_date", "status", "description"]
        for field in allowed_fields:
            if field in event_in:
                update_data[field] = event_in[field]
        
        if not update_data:
            return {"message": "No fields to update"}

        response = supabase.table("deadline_events").update(update_data).eq("id", str(event_id)).execute()
        return response.data[0] if response.data else {}

    except Exception as e:
        print(f"Error updating event: {e}")
        raise HTTPException(status_code=500, detail=str(e))

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
        # Fetch document to verify ownership and get storage path
        doc_response = supabase.table("documents").select("*, project_id").eq("id", str(id)).single().execute()
        if not doc_response.data:
            raise HTTPException(status_code=404, detail="Document not found")

        doc = doc_response.data

        # Verify ownership via project
        project_response = supabase.table("projects").select("owner_id").eq("id", doc["project_id"]).single().execute()
        if not project_response.data or project_response.data["owner_id"] != str(current_user.id):
            raise HTTPException(status_code=403, detail="Not authorized to delete this document")

        # Delete from storage (if storage_path exists)
        if doc.get("storage_path"):
            try:
                supabase.storage.from_("documents").remove([doc["storage_path"]])
            except Exception as storage_error:
                print(f"Warning: Failed to delete file from storage: {storage_error}")

        # Delete deadline_events (should cascade automatically if FK is set up, but let's be explicit)
        supabase.table("deadline_events").delete().eq("document_id", str(id)).execute()

        # Delete document record
        supabase.table("documents").delete().eq("id", str(id)).execute()

        return {"message": "Document deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting document: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/{id}")
def update_document(
    id: uuid.UUID,
    update_data: dict,
    current_user = Depends(deps.get_current_user),
):
    """
    Update document metadata (e.g., filename).
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection error")

    try:
        # Fetch document to verify ownership
        doc_response = supabase.table("documents").select("project_id").eq("id", str(id)).single().execute()
        if not doc_response.data:
            raise HTTPException(status_code=404, detail="Document not found")

        # Verify ownership via project
        project_response = supabase.table("projects").select("owner_id").eq("id", doc_response.data["project_id"]).single().execute()
        if not project_response.data or project_response.data["owner_id"] != str(current_user.id):
            raise HTTPException(status_code=403, detail="Not authorized to update this document")

        # Only allow updating certain fields
        allowed_fields = ["original_filename", "status"]
        filtered_data = {k: v for k, v in update_data.items() if k in allowed_fields}

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
        print(f"Error updating document: {e}")
        raise HTTPException(status_code=500, detail=str(e))

