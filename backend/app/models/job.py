 # Pydantic models for job requests, Below is a potential example of how to structure the models



from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime

class JobRequest(BaseModel):
    github_url: str = Field(..., example="https://github.com/dhruvjain2905/naive-receiver")
    contracts: List[str] = Field(..., example=["BasicForwarder.sol", "NaiveReceiverPool.sol", "FlashLoanReceiver.sol", "WETH.sol"])
    challenge_name: Optional[str] = Field(None, example="Naive Receiver")
    run_id: Optional[str] = Field(None, description="(Optional) Client-supplied run/session ID")

class JobStatus(BaseModel):
    run_id: str
    status: str
    started_at: datetime
    finished_at: Optional[datetime] = None
    success: Optional[bool] = None
    error: Optional[str] = None

class MASLogLine(BaseModel):
    run_id: str
    timestamp: datetime
    message: str
    level: Optional[str] = "INFO"      # "INFO", "WARN", "ERROR", "AGENT", etc
    agent: Optional[str] = None        # "planner", "executor", "reporter", etc

class MASAgentMessage(BaseModel):
    run_id: str
    timestamp: datetime
    role: str                 # planner, executor, reporter, etc
    content: str
    tool_calls: Optional[List[Dict[str, Any]]] = None
    tool_outputs: Optional[List[Dict[str, Any]]] = None
    step: Optional[str] = None
    success: Optional[bool] = None
    tx_hash: Optional[str] = None

# You can add/expand as needed!
