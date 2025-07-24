# Supabase client and db helper functions


from supabase import create_client, Client
import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_KEY"]
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Optional: Helper functions to insert/fetch jobs/logs
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
