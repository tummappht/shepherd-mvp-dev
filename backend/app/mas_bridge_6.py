import asyncio
import os
import re
from pathlib import Path
from datetime import datetime
from typing import Optional, Dict, Any, List
from dotenv import load_dotenv

load_dotenv()

# Configuration for MAS repository
MAS_REPO_PATH = os.environ.get("MAS_REPO_PATH", "../blackRabbit")
MAS_PYTHON_PATH = os.environ.get("MAS_PYTHON_PATH", "python")

# Global state for tracking output patterns
class PromptDetector:
    def __init__(self):
        self.recent_lines = []  # Keep track of recent output
        self.max_history = 10
        self.last_input_time = 0
        self.pending_prompt = None
        self.seen_prompts = set()  # Remember prompts we've seen
        self.waiting_for_multiline = False
        self.multiline_empty_count = 0
        
    def add_line(self, line: str):
        """Add a line to history"""
        self.recent_lines.append(line)
        if len(self.recent_lines) > self.max_history:
            self.recent_lines.pop(0)
    
    def is_progress_output(self, line: str) -> bool:
        """Check if this looks like progress/status output"""
        line_lower = line.lower().strip()
        
        # Common progress indicators
        progress_patterns = [
            r'\d+%',  # Percentage
            r'\[\d+/\d+\]',  # [1/10] style progress
            r'\(\d+/\d+\)',  # (1/10) style progress
            r'\.{3,}',  # Multiple dots ...
            r'\s{2,}\d+\s{2,}',  # Spaced numbers
            r'[│├└─═║╔╗╚╝]',  # Box drawing characters
            r'^\s*\*+\s*$',  # Lines of asterisks
            r'^\s*-+\s*$',  # Lines of dashes
            r'^\s*=+\s*$',  # Lines of equals
        ]
        
        # Check regex patterns
        for pattern in progress_patterns:
            if re.search(pattern, line):
                return True
        
        # Check for specific keywords that indicate progress
        progress_keywords = [
            'remote:', 'counting', 'compressing', 'receiving', 'resolving',
            'unpacking', 'checking', 'updating', 'downloading', 'uploading',
            'processing', 'installing', 'building', 'compiled', 'linking',
            'bytes', 'objects', 'deltas', 'done', 'complete', 'finished',
            'progress', 'status', 'info:', 'debug:', 'trace:', 'warn:',
            'writing', 'reading', 'loading', 'saving', 'fetching'
        ]
        
        for keyword in progress_keywords:
            if keyword in line_lower:
                return True
        
        return False
    
    def is_likely_prompt(self, line: str) -> bool:
        """Check if this line is likely a prompt for user input"""
        if not line or len(line) > 300:  # Increased limit for longer prompts
            return False
        
        line_stripped = line.strip()
        if not line_stripped:
            return False
        
        # First, exclude progress output
        if self.is_progress_output(line):
            return False
        
        # Check if it's a repeat of a prompt we've already answered
        if line_stripped in self.seen_prompts:
            return False
        
        # Look for specific MAS prompts (your custom prompts)
        mas_prompt_patterns = [
            r'Enter the contract name.*:$',  # Your contract name prompt
            r'Enter the specific function.*:$',  # Your function prompt
            r'Enter hypothesis.*:$',  # Your hypothesis prompt
            r'Enter your detailed vulnerability hypothesis.*:$',  # Your detailed prompt
        ]
        
        # Check MAS-specific patterns first
        for pattern in mas_prompt_patterns:
            if re.search(pattern, line_stripped, re.IGNORECASE):
                return True
        
        # Look for general question patterns
        question_patterns = [
            r'^.*\?\s*$',  # Ends with ?
            r'^.*:\s*$',   # Ends with :
            r'^>\s*',      # Starts with >
            r'^>>>\s*',    # Python-style prompt
            r'^\$\s*',     # Shell prompt
            r'^Enter\s+',  # Starts with Enter
            r'^Please\s+', # Starts with Please
            r'^Provide\s+', # Starts with Provide
            r'^Select\s+', # Starts with Select
            r'^Choose\s+', # Starts with Choose
            r'^Type\s+',   # Starts with Type
            r'^Input\s+',  # Starts with Input
            r'^What\s+',   # Starts with What
            r'^Which\s+',  # Starts with Which
            r'^Do you\s+', # Starts with Do you
            r'^Would you\s+', # Starts with Would you
            r'^Specify\s+', # Starts with Specify
        ]
        
        # Check patterns
        for pattern in question_patterns:
            if re.match(pattern, line_stripped, re.IGNORECASE):
                # Additional validation
                # Make sure it's not just a colon after numbers or progress
                if line_stripped.endswith(':'):
                    text_before = line_stripped[:-1].strip()
                    # Avoid matching "Step 1:" or "100%:" etc
                    if re.match(r'^(Step\s+)?\d+$', text_before) or re.match(r'^\d+%$', text_before):
                        return False
                    # But DO match prompts with parentheses like "Enter the contract name (e.g., Vault, BuyPurpose):"
                    if "enter" in text_before.lower() or "input" in text_before.lower():
                        return True
                return True
        
        return False
    
    def should_wait_for_input(self, current_line: str, time_since_last_char: float) -> bool:
        """Determine if we should wait for user input"""
        if not current_line:
            return False
        
        # Special case: Check if the recent output contains setup/header text
        # that typically precedes prompts
        setup_indicators = [
            "ANALYSIS SETUP",
            "VULNERABILITY HYPOTHESIS",
            "Let's focus on",
            "============"
        ]
        
        has_setup_context = any(
            any(indicator in line for indicator in setup_indicators) 
            for line in self.recent_lines[-5:]
        )
        
        # If we haven't seen output for a bit and the line looks like a prompt
        if time_since_last_char > 0.3 and self.is_likely_prompt(current_line):
            # If we have setup context, be more aggressive about detecting prompts
            if has_setup_context:
                return True
                
            # Otherwise use normal detection
            if len(self.recent_lines) >= 2:
                # If the last few lines were all progress, this probably isn't a real prompt
                recent_progress_count = sum(1 for line in self.recent_lines[-3:] 
                                          if self.is_progress_output(line))
                if recent_progress_count >= 2:
                    return False
            return True
        
        return False


async def launch_mas_interactive(run_id: str, job: dict, input_handler, log_dir: str = "./logs") -> Dict[str, Any]:
    """
    Launch MAS subprocess with interactive input/output support
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
        return {"success": False, "error": error_msg}
    
    # Prepare environment variables
    env = os.environ.copy()
    env["PYTHONPATH"] = str(mas_repo / "src")
    
    # Copy over API keys and other environment variables
    optional_env_vars = [
        "OPENAI_API_KEY", "QDRANT_API_KEY", "QDRANT_URL", 
        "ETHERSCAN_API_KEY", "MONGO_URI", "WALLET_PRIVATE_KEY",
        "HUGGINGFACE_API_KEY", "TOGETHER_API_KEY", "REPLICATE_API_TOKEN", 
        "KINDO_API_KEY"
    ]
    
    for var_name in optional_env_vars:
        value = os.getenv(var_name)
        if value is not None:
            env[var_name] = value
    
    cmd = [MAS_PYTHON_PATH, str(mas_script)]
    
    # Log file paths
    log_file_path = log_path / f"{run_id}_{timestamp}_output.log"
    
    try:
        print(f"Starting MAS subprocess...")
        print(f"Command: {' '.join(cmd)}")
        print(f"Working directory: {mas_repo}")
        
        # Create subprocess
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT,
            env=env,
            cwd=str(mas_repo)
        )
        
        print(f"Process started with PID: {process.pid}")
        print(f"Logging to: {log_file_path}")
        print("-" * 80)
        
        # Initialize prompt detector
        detector = PromptDetector()
        
        # Open log file
        with open(log_file_path, 'w', encoding='utf-8') as log_file:
            buffer = ""
            all_output = []
            last_char_time = asyncio.get_event_loop().time()
            no_output_count = 0
            
            while True:
                # Read one byte at a time for better control
                try:
                    data = await asyncio.wait_for(process.stdout.read(1), timeout=0.1)
                    no_output_count = 0  # Reset when we get data
                except asyncio.TimeoutError:
                    no_output_count += 1
                    
                    # No new data - check various conditions
                    current_time = asyncio.get_event_loop().time()
                    time_since_last = current_time - last_char_time
                    
                    # Special handling for multi-line input mode
                    if detector.waiting_for_multiline and no_output_count > 5:
                        # MAS is silently waiting for more input
                        # Get another line from user
                        user_input = input()
                        
                        # Send to MAS
                        process.stdin.write((user_input + '\n').encode())
                        await process.stdin.drain()
                        
                        if user_input.strip() == "":
                            detector.multiline_empty_count += 1
                            if detector.multiline_empty_count >= 1:
                                # User pressed enter on empty line, done with multi-line
                                detector.waiting_for_multiline = False
                                detector.multiline_empty_count = 0
                        else:
                            detector.multiline_empty_count = 0
                        
                        no_output_count = 0
                        continue
                    
                    # Normal prompt detection
                    if buffer and detector.should_wait_for_input(buffer, time_since_last):
                        prompt_line = buffer.strip()
                        detector.seen_prompts.add(prompt_line)

                        # ──── multiline hypothesis prompt ────────────────────
                        if "detailed vulnerability hypothesis" in prompt_line.lower():
                            # print("(Enter multiple lines.  Blank line to finish.)")
                            lines: list[str] = []
                            while True:
                                ln = input()
                                if ln == "":
                                    break
                                lines.append(ln.strip())
                            answer = " ".join(lines)              # one string
                            process.stdin.write((answer + "\n").encode())
                            await process.stdin.drain()
                            buffer = ""
                            continue        # go back to reading MAS output
                        # ──── all other prompts (single-line) ─────────────────
                        user_input = input_handler(prompt_line)
                        if user_input is not None:
                            process.stdin.write((user_input + '\n').encode())
                            await process.stdin.drain()
                            buffer = ""
                            detector.last_input_time = current_time

                    
                    # Check if process has ended
                    if process.returncode is not None:
                        break
                    continue
                
                if not data:
                    if process.returncode is not None:
                        break
                    continue
                
                # Update last character time
                last_char_time = asyncio.get_event_loop().time()
                
                # Decode character
                char = data.decode('utf-8', errors='ignore')
                buffer += char
                
                # Write to log and console
                log_file.write(char)
                log_file.flush()
                print(char, end='', flush=True)
                all_output.append(char)
                
                # Handle newlines
                if char == '\n':
                    # Add completed line to detector history
                    if buffer.strip():
                        detector.add_line(buffer.strip())
                    buffer = ""
        
        # Close stdin
        process.stdin.close()
        
        # Wait for process to complete
        return_code = await process.wait()
        
        print(f"\n[SHEPHERD] Process exited with code: {return_code}")
        
        return {
            "success": return_code == 0,
            "exit_code": return_code,
            "log_file": str(log_file_path),
            "output": "".join(all_output)
        }
        
    except Exception as e:
        error_msg = f"Failed to launch MAS: {str(e)}"
        print(f"\n[SHEPHERD] ERROR: {error_msg}")
        import traceback
        traceback.print_exc()
        
        return {
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc()
        }


import sys

import sys

def input_handler(prompt: str) -> str:
    """
    • For normal prompts → return one line from `input()`.
    • For the 'detailed vulnerability hypothesis' prompt → let the
      user write multiple lines and collapse them into one string.
    """
    lower = prompt.lower()

    if "detailed vulnerability hypothesis" in lower:
        # Show user instructions on a NEW line
        sys.stdout.write("\n(Enter multiple lines; blank line to finish.)\n")
        sys.stdout.flush()

        lines: list[str] = []
        while True:
            ln = input()
            if ln == "":
                break                      # blank line ends entry
            lines.append(ln.strip())

        # Join with spaces so MAS receives a single sentence
        return " ".join(lines)

    # every other prompt: simple one-liner
    return input().strip()


# Test function
async def run_mas_interactive():
    """Run MAS with interactive inputs from shepherd-mvp"""
    
    print("\n🚀 Starting Interactive MAS Session via Shepherd-MVP")
    print("=" * 80)
    
    # Generate run ID
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    run_id = f"mas_interactive_{timestamp}"
    
    # Empty job config since we'll get inputs interactively
    job = {}
    
    # Run MAS with minimal handler
    result = await launch_mas_interactive(run_id, job, input_handler)
    
    if result["success"]:
        print("\n✅ MAS completed successfully!")
    else:
        print(f"\n❌ MAS failed: {result.get('error', 'Unknown error')}")
    
    return result


if __name__ == "__main__":
    asyncio.run(run_mas_interactive())