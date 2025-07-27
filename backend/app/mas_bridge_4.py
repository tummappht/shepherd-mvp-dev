# Launches MAS subprocess and streams logs to the frontend
# no user input
import asyncio
import os
from pathlib import Path
from datetime import datetime
from typing import Optional
from .ws_manager import WebSocketManager

# Configuration for MAS repository
MAS_REPO_PATH = os.environ.get("MAS_REPO_PATH", "../blackRabbit")  # Adjust path as needed
MAS_PYTHON_PATH = os.environ.get("MAS_PYTHON_PATH", "python")  # Could be python3, venv/bin/python, etc.
from dotenv import load_dotenv
load_dotenv()

async def launch_mas(run_id: str, job: dict, ws_manager: Optional[WebSocketManager], log_dir: str = "./backend/logs", capture_stderr: bool = True):
    """
    Launch MAS subprocess and stream logs to the frontend
    
    Args:
        run_id: Unique identifier for this run
        job: Job configuration (github_url, contracts, etc.)
        ws_manager: WebSocket manager for streaming logs (can be None for testing)
        log_dir: Directory to save log files (default: ./logs)
        capture_stderr: Whether to capture stderr output (default: True)
    """
    # Create log directory if it doesn't exist
    log_path = Path(log_dir)
    log_path.mkdir(parents=True, exist_ok=True)
    
    # Create timestamp for log files
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    
    # Prepare the MAS repository path
    mas_repo = Path(MAS_REPO_PATH).resolve()
    mas_script = mas_repo / "src" / "api" / "agents" / "mas2.py"
    
    print(f"MAS repo path: {mas_repo}")
    print(f"MAS script path: {mas_script}")
    
    if not mas_script.exists():
        error_msg = f"MAS script not found at {mas_script}"
        print(f"ERROR: {error_msg}")
        return
    
    # Prepare environment variables for subprocess
    env = os.environ.copy()
    env["PYTHONPATH"] = str(mas_repo / "src")
    
    # Pass job configuration via environment variables
    optional_env_vars = [
        "OPENAI_API_KEY",
        "QDRANT_API_KEY",
        "QDRANT_URL",
        "ETHERSCAN_API_KEY",
        "MONGO_URI",
        "WALLET_PRIVATE_KEY",
        "HUGGINGFACE_API_KEY",
        "TOGETHER_API_KEY",
        "REPLICATE_API_TOKEN",
        "KINDO_API_KEY"
    ]
  
    for var_name in optional_env_vars:
        value = os.getenv(var_name)
        if value is not None:
            env[var_name] = value
            print(f"  Setting {var_name}: {'***' if 'KEY' in var_name or 'TOKEN' in var_name else value[:20] + '...' if len(value) > 20 else value}")
        else:
            print(f"  Skipping {var_name} (not set)")  

    
    cmd = [
        MAS_PYTHON_PATH,
        str(mas_script)
    ]
    
    # You might need to add command line arguments depending on how mas2.py expects input
    # For example:
    # cmd.extend(["--github-url", job["github_url"]])
    # cmd.extend(["--contracts", ",".join(job["contracts"])])
    
    try:
        print(f"Starting MAS subprocess...")
        print(f"Command: {' '.join(cmd)}")
        print(f"Working directory: {mas_repo}")
        print(f"PYTHONPATH: {env['PYTHONPATH']}")
        
        # Create subprocess
        subprocess_kwargs = {
            "stdout": asyncio.subprocess.PIPE,
            "env": env,
            "cwd": str(mas_repo)  # Set working directory to MAS repo
        }
        
        if capture_stderr:
            subprocess_kwargs["stderr"] = asyncio.subprocess.PIPE
        
        process = await asyncio.create_subprocess_exec(
            *cmd,
            **subprocess_kwargs
        )
        
        print(f"Process started with PID: {process.pid}")
        
        # Define log file paths
        stdout_file_path = log_path / f"{run_id}_{timestamp}_stdout.log"
        combined_file_path = log_path / f"{run_id}_{timestamp}_combined.log"
        
        print(f"Logging stdout to: {stdout_file_path}")
        print(f"Logging combined to: {combined_file_path}")
        
        if capture_stderr:
            stderr_file_path = log_path / f"{run_id}_{timestamp}_stderr.log"
            print(f"Logging stderr to: {stderr_file_path}")
        
        # Read stdout and stderr concurrently
        async def read_stream(stream, stream_name, log_file_path):
            """Read from a stream line by line and save to file"""
            lines = []
            
            # Open file for writing
            with open(log_file_path, 'w', encoding='utf-8') as f:
                # Also open combined log file in append mode
                with open(combined_file_path, 'a', encoding='utf-8') as combined_f:
                    while True:
                        line = await stream.readline()
                        if not line:
                            break
                            
                        text = line.decode('utf-8').rstrip()
                        if text:  # Skip empty lines
                            # Create log entry with timestamp
                            log_timestamp = datetime.utcnow().isoformat()
                            log_entry = f"[{log_timestamp}] [{stream_name}] {text}"
                            
                            # Only print to console if not stderr, or if we want to see stderr
                            if stream_name != "stderr" or capture_stderr:
                                print(log_entry)
                            
                            # Save to stream-specific file
                            f.write(text + '\n')
                            f.flush()  # Ensure immediate write
                            
                            # Save to combined file with metadata
                            combined_f.write(log_entry + '\n')
                            combined_f.flush()
                            
                            lines.append(text)
                            
                            # If ws_manager is provided, send to websocket
                            if ws_manager:
                                try:
                                    await ws_manager.send_log(run_id, {
                                        "run_id": run_id,
                                        "timestamp": log_timestamp,
                                        "message": text,
                                        "level": "ERROR" if stream_name == "stderr" else "INFO",
                                        "stream": stream_name
                                    })
                                except Exception as e:
                                    print(f"Failed to send to websocket: {e}")
                
            return lines
        
        # Create tasks for reading stdout (and stderr if enabled)
        tasks = []
        stdout_task = asyncio.create_task(read_stream(process.stdout, "stdout", stdout_file_path))
        tasks.append(stdout_task)
        
        stderr_task = None
        if capture_stderr and process.stderr:
            stderr_task = asyncio.create_task(read_stream(process.stderr, "stderr", stderr_file_path))
            tasks.append(stderr_task)
        
        # Wait for process to complete
        returncode = await process.wait()
        print(f"Process exited with code: {returncode}")
        
        # Wait for all output to be read
        results = await asyncio.gather(*tasks)
        stdout_lines = results[0]
        stderr_lines = results[1] if len(results) > 1 else []
        
        # Prepare log files dictionary
        log_files = {
            "stdout": str(stdout_file_path),
            "combined": str(combined_file_path)
        }
        
        if capture_stderr:
            log_files["stderr"] = str(stderr_file_path)
        
        # Write summary to a separate file
        summary_file_path = log_path / f"{run_id}_{timestamp}_summary.json"
        summary = {
            "run_id": run_id,
            "timestamp": timestamp,
            "job": job,
            "success": returncode == 0,
            "exit_code": returncode,
            "stdout_lines_count": len(stdout_lines),
            "stderr_lines_count": len(stderr_lines) if capture_stderr else 0,
            "stderr_captured": capture_stderr,
            "log_files": log_files
        }
        
        # Save summary as JSON
        import json
        with open(summary_file_path, 'w') as f:
            json.dump(summary, f, indent=2)
        
        log_files["summary"] = str(summary_file_path)
        
        # Summary
        print(f"\n--- MAS Execution Summary ---")
        print(f"Exit code: {returncode}")
        print(f"Stdout lines: {len(stdout_lines)}")
        if capture_stderr:
            print(f"Stderr lines: {len(stderr_lines)}")
        print(f"\nLog files saved to:")
        print(f"  - Stdout: {stdout_file_path}")
        if capture_stderr:
            print(f"  - Stderr: {stderr_file_path}")
        print(f"  - Combined: {combined_file_path}")
        print(f"  - Summary: {summary_file_path}")
        
        if capture_stderr and returncode != 0 and stderr_lines:
            print(f"\nLast 10 error lines:")
            for line in stderr_lines[-10:]:  # Show last 10 error lines
                print(f"  {line}")
        
        result = {
            "success": returncode == 0,
            "exit_code": returncode,
            "stdout_lines": stdout_lines,
            "log_files": log_files
        }
        
        if capture_stderr:
            result["stderr_lines"] = stderr_lines
            
        return result
            
    except Exception as e:
        error_msg = f"Failed to launch MAS: {str(e)}"
        print(f"ERROR: {error_msg}")
        import traceback
        traceback.print_exc()
        
        # Save error to file
        error_file_path = log_path / f"{run_id}_{timestamp}_error.log"
        with open(error_file_path, 'w') as f:
            f.write(f"Error: {str(e)}\n")
            f.write(traceback.format_exc())
        
        print(f"Error log saved to: {error_file_path}")
        
        return {
            "success": False,
            "error": str(e),
            "error_log": str(error_file_path)
        }


# Test function for standalone testing
async def test_launch():
    """Test the launch_mas function without the full FastAPI app"""
    test_job = {
        "github_url": "https://github.com/dhruvjain2905/naive-receiver",
        "contracts": ["BasicForwarder.sol", "NaiveReceiverPool.sol", "FlashLoanReceiver.sol", "WETH.sol"],
        "challenge_name": "Naive Receiver"
    }
    
    # Test without capturing stderr
    result = await launch_mas("test-run-001", test_job, None, log_dir="./backend/test_logs", capture_stderr=False)
    print(f"\nFinal result: {result}")


if __name__ == "__main__":
    # Run the test
    asyncio.run(test_launch())