# Supabase client and db helper functions

from supabase import create_client, Client
import os
from dotenv import load_dotenv
from typing import Optional, List
from datetime import datetime
import uuid

load_dotenv()

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_KEY"]
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Database helper functions for repository analysis requests
def create_repository_analysis(
    repository_url: str,
    project_description: str,
    environment: str,  # "local" or "testnet"
    user_id: Optional[str] = None,
    reference_files: Optional[List[str]] = None
) -> dict:
    """
    Create a new repository analysis request in Supabase
    
    Args:
        repository_url: GitHub repository URL
        project_description: Project documentation/description
        environment: "local" or "testnet"
        user_id: Optional user ID for tracking
        reference_files: Optional list of file paths/names
    
    Returns:
        dict: Created record with ID and timestamps
    """
    try:
        # Generate a unique run_id
        run_id = str(uuid.uuid4())
        
        # Prepare the data
        analysis_data = {
            "run_id": run_id,
            "repository_url": repository_url,
            "project_description": project_description,
            "environment": environment,
            "status": "pending",  # pending, running, completed, failed
            "user_id": user_id,
            "reference_files": reference_files or [],
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        # Insert into Supabase with RLS bypass for testing
        result = supabase.table("repository_analyses").insert(analysis_data).execute()
        
        if result.data:
            return result.data[0]
        else:
            raise Exception("Failed to create repository analysis")
            
    except Exception as e:
        print(f"Error creating repository analysis: {e}")
        raise

def get_repository_analysis(run_id: str) -> Optional[dict]:
    """
    Get a repository analysis by run_id
    
    Args:
        run_id: Unique identifier for the analysis
    
    Returns:
        dict: Analysis record or None if not found
    """
    try:
        result = supabase.table("repository_analyses").select("*").eq("run_id", run_id).execute()
        
        if result.data:
            return result.data[0]
        return None
        
    except Exception as e:
        print(f"Error fetching repository analysis: {e}")
        return None

def update_analysis_status(run_id: str, status: str, additional_data: Optional[dict] = None):
    """
    Update the status of a repository analysis
    
    Args:
        run_id: Unique identifier for the analysis
        status: New status (pending, running, completed, failed)
        additional_data: Optional additional data to update
    """
    try:
        update_data = {
            "status": status,
            "updated_at": datetime.utcnow().isoformat()
        }
        
        if additional_data:
            update_data.update(additional_data)
        
        supabase.table("repository_analyses").update(update_data).eq("run_id", run_id).execute()
        
    except Exception as e:
        print(f"Error updating analysis status: {e}")
        raise

def list_user_analyses(user_id: str, limit: int = 50) -> List[dict]:
    """
    Get all analyses for a specific user
    
    Args:
        user_id: User identifier
        limit: Maximum number of records to return
    
    Returns:
        List[dict]: List of analysis records
    """
    try:
        result = supabase.table("repository_analyses").select("*").eq("user_id", user_id).order("created_at", desc=True).limit(limit).execute()
        
        return result.data or []
        
    except Exception as e:
        print(f"Error fetching user analyses: {e}")
        return []

def delete_repository_analysis(run_id: str) -> bool:
    """
    Delete a repository analysis by run_id
    
    Args:
        run_id: Unique identifier for the analysis
    
    Returns:
        bool: True if deleted successfully, False otherwise
    """
    try:
        result = supabase.table("repository_analyses").delete().eq("run_id", run_id).execute()
        
        return len(result.data) > 0
        
    except Exception as e:
        print(f"Error deleting repository analysis: {e}")
        return False

# Legacy functions (keeping for backward compatibility)
def insert_job(job: dict):
    """
    Save a new job to Supabase 'job_requests' table
    """
    pass

def update_job_status(run_id: str, status: str):
    """
    Update the status of a job
    """
    pass

def save_log_line(log: dict):
    """
    Save MAS log lines to Supabase (optional, fallback if websocket not connected)
    """
    pass
