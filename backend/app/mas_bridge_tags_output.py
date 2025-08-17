#deployment ver - complete with tag parsing and error handling
import asyncio
import os
import re
import json
from pathlib import Path
from datetime import datetime
from typing import Optional, Dict, Any, List, Callable
from dotenv import load_dotenv

load_dotenv()

# Configuration for MAS repository
MAS_REPO_PATH = os.environ.get("MAS_REPO_PATH", "../blackRabbit")
MAS_PYTHON_PATH = os.environ.get("MAS_PYTHON_PATH", "python")

class TagParser:
    """Parser for MAS structured output tags"""
    
    # Define tag patterns
    TAG_PATTERNS = {
        'EXECUTOR_TOOL_CALL': r'<<<EXECUTOR_TOOL_CALL>>>(.*?)<<<END_EXECUTOR_TOOL_CALL>>>',
        'EXECUTOR_TOOL_RESULT': r'<<<EXECUTOR_TOOL_RESULT>>>(.*?)<<<END_EXECUTOR_TOOL_RESULT>>>',
        'AGENT': r'<<<AGENT>>>(.*?)<<<END_AGENT>>>',
        'USER_INPUT': r'<<<USER_INPUT>>>(.*?)<<<END_USER_INPUT>>>',
        'SYSTEM': r'<<<SYSTEM>>>(.*?)<<<END_SYSTEM>>>',
        'ERROR': r'<<<ERROR>>>(.*?)<<<END_ERROR>>>',
        'PLANNER': r'<<<PLANNER>>>(.*?)<<<END_PLANNER>>>',
        'EXECUTOR': r'<<<EXECUTOR>>>(.*?)<<<END_EXECUTOR>>>',
        'VALIDATOR': r'<<<VALIDATOR>>>(.*?)<<<END_VALIDATOR>>>',
        'SUMMARY': r'<<<SUMMARY>>>(.*?)<<<END_SUMMARY>>>',
    }
    
    def __init__(self):
        self.buffer = ""
        self.current_tag = None
        self.tag_content = ""
        self.non_tag_buffer = ""  # Buffer for non-tagged content
        
    def process_chunk(self, chunk: str, error_state: bool = False):
        """
        Process a chunk of text and extract complete tags
        Returns list of parsed tags
        """
        self.buffer += chunk
        results = []
        
        # Keep processing buffer while we find complete tags
        while True:
            # If we're currently in a tag, look for its end
            if self.current_tag:
                end_pattern = f'<<<END_{self.current_tag}>>>'
                end_pos = self.buffer.find(end_pattern)
                
                if end_pos != -1:
                    # Found end of current tag
                    content = self.buffer[:end_pos]
                    self.tag_content += content
                    
                    # Parse the complete tag content
                    parsed = self._parse_tag_content(self.current_tag, self.tag_content)
                    if parsed:
                        results.append(parsed)
                    
                    # Move buffer past the end tag
                    self.buffer = self.buffer[end_pos + len(end_pattern):]
                    self.current_tag = None
                    self.tag_content = ""
                else:
                    # Still waiting for end tag, accumulate content
                    self.tag_content += self.buffer
                    self.buffer = ""
                    break
            else:
                # Look for start of any tag
                earliest_pos = len(self.buffer)
                found_tag = None
                
                for tag_name in self.TAG_PATTERNS.keys():
                    start_pattern = f'<<<{tag_name}>>>'
                    pos = self.buffer.find(start_pattern)
                    if pos != -1 and pos < earliest_pos:
                        earliest_pos = pos
                        found_tag = tag_name
                
                if found_tag:
                    # Store any content before the tag
                    before_tag = self.buffer[:earliest_pos]
                    if before_tag:
                        self.non_tag_buffer += before_tag
                        
                        # Check for error patterns in non-tag content
                        if error_state and self.non_tag_buffer:
                            # In error state, we might want to send some non-tag content
                            if "GRAPH_RECURSION_LIMIT" in self.non_tag_buffer or "Run another MAS?" in self.non_tag_buffer:
                                results.append({
                                    "type": "error-output",
                                    "data": {"content": self.non_tag_buffer}
                                })
                                self.non_tag_buffer = ""
                    
                    # Start processing the found tag
                    self.buffer = self.buffer[earliest_pos + len(f'<<<{found_tag}>>>'):]
                    self.current_tag = found_tag
                    self.tag_content = ""
                else:
                    # No tags found, accumulate in non-tag buffer
                    self.non_tag_buffer += self.buffer
                    
                    # Special handling for error state or "Run another MAS?" prompt
                    if error_state or "Run another MAS?" in self.non_tag_buffer:
                        if "GRAPH_RECURSION_LIMIT" in self.non_tag_buffer or \
                           ("Run another MAS?" in self.non_tag_buffer and 
                            (self.non_tag_buffer.strip().endswith(":") or "(y/N)" in self.non_tag_buffer)):
                            # Send this special content
                            results.append({
                                "type": "error-output" if "GRAPH_RECURSION_LIMIT" in self.non_tag_buffer else "prompt",
                                "data": {"content": self.non_tag_buffer.strip()}
                            })
                            self.non_tag_buffer = ""
                    
                    self.buffer = ""
                    break
        
        return results
    
    def _parse_tag_content(self, tag_type: str, content: str):
        """Parse the content based on tag type"""
        try:
            # Try to parse as JSON
            content = content.strip()
            if content.startswith('{') and content.endswith('}'):
                data = json.loads(content)
            else:
                data = {"content": content}
            
            return {
                "type": tag_type.lower().replace('_', '-'),  # Convert to kebab-case for WebSocket
                "data": data,
                "tag_type": tag_type
            }
        except json.JSONDecodeError:
            # If not valid JSON, return as raw content
            return {
                "type": tag_type.lower().replace('_', '-'),
                "data": {"content": content},
                "tag_type": tag_type
            }
    
    def flush(self):
        """Return any incomplete tag data (for debugging)"""
        if self.current_tag and self.tag_content:
            return {
                "type": "incomplete-tag",
                "data": {
                    "tag": self.current_tag,
                    "partial_content": self.tag_content
                }
            }
        return None

class PromptDetector:
    """Legacy prompt detector for fallback cases"""
    def __init__(self):
        self.recent_lines = []
        self.max_history = 10
        self.seen_prompts = set()
        
    def add_line(self, line: str):
        """Add a line to history"""
        self.recent_lines.append(line)
        if len(self.recent_lines) > self.max_history:
            self.recent_lines.pop(0)
    
    def is_run_another_mas_prompt(self, text: str) -> bool:
        """Check if this is a "Run another MAS?" prompt"""
        if "Run another MAS?" in text or "▶️" in text:
            if text.strip().endswith(":") or "(y/N)" in text:
                return True
        return False

class TagAwareOutputBuffer:
    """Buffer that primarily streams tagged content with special error handling"""
    
    def __init__(self, ws_manager, run_id):
        self.ws_manager = ws_manager
        self.run_id = run_id
        self.parser = TagParser()
        self.prompt_detector = PromptDetector()
        self.raw_buffer = ""  # For logging/debugging
        self.error_state = False
        self.seen_prompts = set()
        
    async def add_chunk(self, chunk: str):
        """Add a chunk of output and process tags"""
        self.raw_buffer += chunk
        
        # Check for error state
        if "GRAPH_RECURSION_LIMIT" in chunk:
            self.error_state = True
            
        # Process chunk through tag parser
        tags = self.parser.process_chunk(chunk, self.error_state)
        
        # Send each parsed tag via WebSocket with appropriate type
        for tag_data in tags:
            # Special handling for prompts
            if tag_data["type"] == "prompt":
                prompt_text = tag_data["data"].get("content", "")
                if prompt_text not in self.seen_prompts:
                    self.seen_prompts.add(prompt_text)
                    if self.ws_manager:
                        await self.ws_manager.send_log(self.run_id, tag_data)
            elif self.ws_manager:
                await self.ws_manager.send_log(self.run_id, tag_data)
        
        # Add lines to prompt detector for fallback
        for line in chunk.split('\n'):
            if line.strip():
                self.prompt_detector.add_line(line.strip())
    
    def check_for_prompt(self, buffer: str) -> Optional[str]:
        """Check if buffer contains a prompt that needs user input"""
        # Check for "Run another MAS?" prompt
        if self.prompt_detector.is_run_another_mas_prompt(buffer):
            return buffer.strip()
        return None
    
    def reset_for_new_mas(self):
        """Reset state when user chooses to run another MAS"""
        self.seen_prompts.clear()
        self.error_state = False
        
    async def flush(self):
        """Flush any remaining incomplete tags"""
        incomplete = self.parser.flush()
        if incomplete and self.ws_manager:
            await self.ws_manager.send_log(self.run_id, incomplete)

    def _filter_sensitive_content(self, text):
        """Filter out lines containing sensitive information"""
        FILTER_PATTERNS = [
            r'API_KEY:\s*[a-zA-Z0-9\-_]{20,}'
        ]
        
        lines = text.split('\n')
        filtered_lines = []
        
        for line in lines:
            # Check if this line should be filtered
            should_filter = False
            for pattern in FILTER_PATTERNS:
                if re.search(pattern, line, re.IGNORECASE):
                    should_filter = True
                    break
            
            if not should_filter:
                filtered_lines.append(line)
        
        # Reconstruct the text, preserving newlines
        result = '\n'.join(filtered_lines)
        
        # Handle edge case where original text ended with newline
        if text.endswith('\n') and not result.endswith('\n'):
            result += '\n'
        
        return result

async def launch_mas_interactive(
    run_id: str, 
    job: dict, 
    input_handler: Callable,
    ws_manager=None,
    log_dir: str = "./backend/logs",
) -> Dict[str, Any]:
    """
    Launch MAS subprocess with tag-based streaming and error handling
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
        if ws_manager:
            await ws_manager.send_log(run_id, {
                "type": "error",
                "data": {"error": error_msg}
            })
        return {"success": False, "error": error_msg}
    
    # Prepare environment variables
    env = os.environ.copy()
    env["PYTHONPATH"] = str(mas_repo / "src")
    
    # Copy over API keys
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
        
        # Send start notification
        if ws_manager:
            await ws_manager.send_log(run_id, {
                "type": "system",
                "data": {
                    "message": "Starting MAS process",
                    "command": ' '.join(cmd),
                    "working_dir": str(mas_repo)
                }
            })
        
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
        
        # Initialize tag-aware output buffer
        output_buffer = TagAwareOutputBuffer(ws_manager, run_id)
        
        # Send process started notification
        if ws_manager:
            await ws_manager.send_log(run_id, {
                "type": "system",
                "data": {
                    "message": "Process started",
                    "pid": process.pid
                }
            })
        
        # Start stderr monitoring
        async def monitor_stderr():
            while True:
                try:
                    if process.stderr:
                        stderr_line = await process.stderr.readline()
                        if not stderr_line:
                            break
                        stderr_text = stderr_line.decode('utf-8', errors='ignore')
                        print(f"[STDERR] {stderr_text}", end='')
                        
                        # Log stderr to file
                        with open(log_file_path.with_suffix('.stderr.log'), 'a') as stderr_log:
                            stderr_log.write(stderr_text)
                        
                        # Send stderr via WebSocket
                        if ws_manager:
                            await ws_manager.send_log(run_id, {
                                "type": "stderr",
                                "data": {"content": stderr_text}
                            })
                except Exception as e:
                    print(f"[STDERR MONITOR ERROR] {e}")
                    break
        
        # Start stderr monitoring in background
        stderr_task = asyncio.create_task(monitor_stderr())
        
        # Main output processing loop
        with open(log_file_path, 'w', encoding='utf-8') as log_file:
            all_output = []
            accumulator = ""
            no_output_count = 0
            
            while True:
                try:
                    # Read chunks for efficiency
                    data = await asyncio.wait_for(process.stdout.read(1024), timeout=0.1)
                    no_output_count = 0
                except asyncio.TimeoutError:
                    no_output_count += 1
                    
                    # Check for prompts in accumulator during timeout
                    if accumulator:
                        prompt = output_buffer.check_for_prompt(accumulator)
                        if prompt and prompt not in output_buffer.seen_prompts:
                            output_buffer.seen_prompts.add(prompt)
                            
                            # Send prompt via WebSocket
                            if ws_manager:
                                await ws_manager.send_log(run_id, {
                                    "type": "prompt",
                                    "data": {"prompt": prompt, "multiline": False}
                                })
                            
                            # Get input from handler
                            user_input = await input_handler(prompt)
                            
                            if user_input is not None and process.returncode is None:
                                try:
                                    process.stdin.write((user_input + '\n').encode())
                                    await process.stdin.drain()
                                    
                                    # If user chose to run another MAS, reset state
                                    if user_input.lower() == 'y':
                                        output_buffer.reset_for_new_mas()
                                    
                                    accumulator = ""
                                    
                                    # Send user response via WebSocket
                                    if ws_manager:
                                        await ws_manager.send_log(run_id, {
                                            "type": "user-response",
                                            "data": {"prompt": prompt, "response": user_input}
                                        })
                                except (BrokenPipeError, RuntimeError) as e:
                                    print(f"[SHEPHERD] Process terminated while sending input: {e}")
                                    break
                    
                    # Check if process has ended
                    if process.returncode is not None:
                        break
                    continue
                
                if not data:
                    if process.returncode is not None:
                        break
                    continue
                
                # Decode chunk
                chunk = data.decode('utf-8', errors='ignore')
                
                # Filter sensitive content
                chunk = output_buffer._filter_sensitive_content(chunk)
                
                # Log to file (keep raw output for debugging)
                log_file.write(chunk)
                log_file.flush()
                all_output.append(chunk)
                
                # For debugging - print to console
                print(chunk, end='', flush=True)
                
                # Add to accumulator for prompt detection
                accumulator += chunk
                
                # Process through tag-aware buffer
                await output_buffer.add_chunk(chunk)
                
                # Check for USER_INPUT tags that require interaction
                if '<<<USER_INPUT>>>' in chunk:
                    # Wait for complete USER_INPUT tag
                    while output_buffer.parser.current_tag == 'USER_INPUT':
                        try:
                            more_data = await asyncio.wait_for(process.stdout.read(100), timeout=0.5)
                            if more_data:
                                more_chunk = more_data.decode('utf-8', errors='ignore')
                                log_file.write(more_chunk)
                                all_output.append(more_chunk)
                                accumulator += more_chunk
                                await output_buffer.add_chunk(more_chunk)
                        except asyncio.TimeoutError:
                            break
                    
                    # Parse USER_INPUT for prompt
                    if output_buffer.parser.tag_content:
                        try:
                            user_input_data = json.loads(output_buffer.parser.tag_content.strip())
                            prompt = user_input_data.get('prompt', '')
                            
                            # Skip if already seen
                            if prompt and prompt not in output_buffer.seen_prompts:
                                output_buffer.seen_prompts.add(prompt)
                                
                                # Get input from handler
                                user_response = await input_handler(prompt)
                                
                                if user_response is not None and process.returncode is None:
                                    # Send response to process
                                    process.stdin.write((user_response + '\n').encode())
                                    await process.stdin.drain()
                                    
                                    accumulator = ""
                                    
                                    # Send user response via WebSocket
                                    if ws_manager:
                                        await ws_manager.send_log(run_id, {
                                            "type": "user-response",
                                            "data": {"prompt": prompt, "response": user_response}
                                        })
                        except (json.JSONDecodeError, BrokenPipeError) as e:
                            print(f"Error handling user input: {e}")
                
                # Clear accumulator if it's getting too large and no prompt detected
                if len(accumulator) > 1000 and not output_buffer.check_for_prompt(accumulator):
                    accumulator = accumulator[-500:]  # Keep last 500 chars
        
        # Flush any remaining tags
        await output_buffer.flush()
        
        # Cancel stderr monitoring
        stderr_task.cancel()
        
        # Close stdin
        process.stdin.close()
        
        # Wait for process to complete
        return_code = await process.wait()
        
        print(f"\n[SHEPHERD] Process exited with code: {return_code}")
        
        # Send completion notification
        if ws_manager:
            await ws_manager.send_log(run_id, {
                "type": "system",
                "data": {
                    "message": "Process completed",
                    "exit_code": return_code,
                    "success": return_code == 0
                }
            })
        
        return {
            "success": return_code == 0,
            "exit_code": return_code,
            "log_file": str(log_file_path),
            "output": "".join(all_output),
            "pid": process.pid
        }
        
    except Exception as e:
        error_msg = f"Failed to launch MAS: {str(e)}"
        print(f"\n[SHEPHERD] ERROR: {error_msg}")
        import traceback
        traceback.print_exc()
        
        # Send error notification
        if ws_manager:
            await ws_manager.send_log(run_id, {
                "type": "error",
                "data": {
                    "error": str(e),
                    "traceback": traceback.format_exc()
                }
            })
        
        return {
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc()
        }

# Helper function for creating WebSocket-based input handler
def create_ws_input_handler(run_id: str, input_queue: asyncio.Queue):
    """
    Creates an async input handler that waits for input from a WebSocket queue
    """
    async def handler(prompt: str, multiline: bool = False, multiline_continuation: bool = False):
        # Wait for input from the queue
        user_input = await input_queue.get()
        return user_input
    
    return handler