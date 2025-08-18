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
        
    def process_chunk(self, chunk: str):
        """
        Process a chunk of text and extract complete tags
        Returns tuple of (parsed_tags, regular_output)
        """
        self.buffer += chunk
        results = []
        regular_output = ""
        
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
                    # Store any content before the tag as regular output
                    before_tag = self.buffer[:earliest_pos]
                    if before_tag:
                        regular_output += before_tag
                    
                    # Start processing the found tag
                    self.buffer = self.buffer[earliest_pos + len(f'<<<{found_tag}>>>'):]
                    self.current_tag = found_tag
                    self.tag_content = ""
                else:
                    # No tags found, return buffer as regular output
                    regular_output += self.buffer
                    self.buffer = ""
                    break
        
        return results, regular_output
    
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
        self.last_input_time = 0
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
        if not line or len(line) > 300:
            return False
        
        line_lower = line.lower().strip()
        if "run another mas?" in line_lower:
            return True
        if "press enter twice" in line_lower:
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
        
        # Look for specific MAS prompts
        mas_prompt_patterns = [
            r'Enter the contract name.*:$',
            r'Enter the specific function.*:$',
            r'Enter hypothesis.*:$',
            r'Enter your detailed vulnerability hypothesis.*:$',
            r'▶️\s*Run another MAS\?.*:$', 
            r'Run another MAS\?.*:$',  
            r'\(y/N\):?\s*$',  
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
                if line_stripped.endswith(':'):
                    text_before = line_stripped[:-1].strip()
                    # Avoid matching "Step 1:" or "100%:" etc
                    if re.match(r'^(Step\s+)?\d+$', text_before) or re.match(r'^\d+%$', text_before):
                        return False
                    # But DO match prompts with parentheses
                    if "enter" in text_before.lower() or "input" in text_before.lower():
                        return True
                return True
        
        return False
    
    def should_wait_for_input(self, current_line: str, time_since_last_char: float) -> bool:
        """Determine if we should wait for user input"""
        if not current_line:
            return False
        
        # Special case: Check if the recent output contains setup/header text
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
        
        # Special case: Check for hypothesis instructions
        hypothesis_indicators = [
            "Enter hypothesis (press Enter twice when done):",
            "Enter your detailed vulnerability hypothesis",
            "(press Enter twice when done)"
        ]
        
        # Check if we just saw hypothesis instructions
        for line in self.recent_lines[-3:]:
            for indicator in hypothesis_indicators:
                if indicator in line:
                    return True
        
        # If we haven't seen output for a bit and the line looks like a prompt
        if time_since_last_char > 0.3 and self.is_likely_prompt(current_line):
            if has_setup_context:
                return True
                
            # Otherwise use normal detection
            if len(self.recent_lines) >= 2:
                recent_progress_count = sum(1 for line in self.recent_lines[-3:] 
                                          if self.is_progress_output(line))
                if recent_progress_count >= 2:
                    return False
            return True
        
        return False

class TagAwareOutputBuffer:
    """Buffer that ONLY streams tagged content, ignoring regular output"""
    
    def __init__(self, ws_manager, run_id):
        self.ws_manager = ws_manager
        self.run_id = run_id
        self.parser = TagParser()
        self.prompt_detector = PromptDetector()
        self.buffer = ""
        self.hold_buffer = ""
        self.error_state = False
        self.seen_prompts = set()
        
        # New: Track if we're currently inside a tag
        self.inside_tag = False
        self.current_tag_type = None
        self.current_tag_content = ""
        self.current_stream_id = None
        self.stream_counter = 0
        
        # Track specific prompt handling
        self.handling_run_another_mas = False
        
    async def add_chunk(self, chunk: str):
        """Add a chunk of output and process ONLY tags"""
        self.buffer += chunk
        
        # Check for error state
        if "GRAPH_RECURSION_LIMIT" in chunk:
            self.error_state = True
        
        # Process chunk through tag parser
        tags, regular_output = self.parser.process_chunk(chunk)
        
        # MODIFIED: Don't send regular output at all
        # Only check if regular output contains prompts
        if regular_output:
            if self.check_for_prompt(regular_output):
                self.hold_buffer = regular_output
        
        # Send each parsed tag via WebSocket with stream info
        for tag_data in tags:
            if self.ws_manager:
                # Add stream metadata
                self.stream_counter += 1
                tag_data['stream_id'] = f"stream_{self.stream_counter}"
                tag_data['stream_complete'] = True  # Since we got the complete tag
                await self.ws_manager.send_log(self.run_id, tag_data)
        
        # Add lines to prompt detector for fallback
        for line in chunk.split('\n'):
            if line.strip():
                self.prompt_detector.add_line(line.strip())
    
    async def add_char(self, char: str):
        """Character-by-character processing - only send when inside tags"""
        self.buffer += char
        
        # Check if we're entering a tag
        for tag_name in TagParser.TAG_PATTERNS.keys():
            start_pattern = f'<<<{tag_name}>>>'
            if self.buffer.endswith(start_pattern):
                self.inside_tag = True
                self.current_tag_type = tag_name
                self.current_tag_content = ""
                self.stream_counter += 1
                self.current_stream_id = f"stream_{self.stream_counter}"
                
                # Send stream start notification
                if self.ws_manager:
                    await self.ws_manager.send_log(self.run_id, {
                        "type": "stream_start",
                        "stream_id": self.current_stream_id,
                        "tag_type": self.current_tag_type
                    })
                # Clear the tag marker from buffer
                self.buffer = self.buffer[:-len(start_pattern)]
                return
        
        # Check if we're exiting a tag
        if self.inside_tag and self.current_tag_type:
            end_pattern = f'<<<END_{self.current_tag_type}>>>'
            if self.buffer.endswith(end_pattern):
                # Remove the end pattern from buffer
                content = self.buffer[:-len(end_pattern)]
                
                # Parse and send the complete tag content
                parsed = self._parse_tag_content(self.current_tag_type, self.current_tag_content)
                if parsed and self.ws_manager:
                    parsed['stream_id'] = self.current_stream_id
                    parsed['stream_complete'] = True
                    await self.ws_manager.send_log(self.run_id, parsed)
                
                # Send stream end notification
                if self.ws_manager:
                    await self.ws_manager.send_log(self.run_id, {
                        "type": "stream_end",
                        "stream_id": self.current_stream_id,
                        "tag_type": self.current_tag_type
                    })
                
                # Reset tag tracking
                self.inside_tag = False
                self.current_tag_type = None
                self.current_tag_content = ""
                self.current_stream_id = None
                self.buffer = ""
                return
            else:
                # Accumulate content inside tag
                self.current_tag_content += char
                
                # Optional: Stream partial content while inside tag
                # Uncomment if you want real-time streaming within tags
                # if self.ws_manager and char:
                #     await self.ws_manager.send_log(self.run_id, {
                #         "type": "stream_partial",
                #         "stream_id": self.current_stream_id,
                #         "tag_type": self.current_tag_type,
                #         "data": char
                #     })
        
        # Handle prompts (keep existing logic but don't send regular output)
        if "Run another MAS?" in self.buffer or "â–¶ï¸" in self.buffer:
            if self.buffer.endswith(": "):
                self.hold_buffer = self.buffer
                self.buffer = ""
                return
            elif self.buffer.endswith(":"):
                return
            else:
                return
        
        if char == '\n':
            line = self.buffer.strip()
            
            hypothesis_patterns = [
                "Enter hypothesis (press Enter twice when done):",
                "Enter your detailed vulnerability hypothesis"
            ]
            
            is_hypothesis_prompt = any(pattern in line for pattern in hypothesis_patterns)
            
            if self.prompt_detector.is_likely_prompt(line) or is_hypothesis_prompt:
                self.hold_buffer = self.buffer
                self.buffer = ""
                return
            else:
                # MODIFIED: Don't send regular output, just clear buffer
                self.hold_buffer = ""
                self.buffer = ""
        else:
            # Clear buffer if it gets too large and we're not in a tag
            if len(self.buffer) > 500 and not self.inside_tag:
                self.buffer = ""
    
    def _parse_tag_content(self, tag_type: str, content: str):
        """Parse the content based on tag type"""
        try:
            content = content.strip()
            if content.startswith('{') and content.endswith('}'):
                data = json.loads(content)
            else:
                data = {"content": content}
            
            return {
                "type": tag_type.lower().replace('_', '-'),
                "data": data,
                "tag_type": tag_type
            }
        except json.JSONDecodeError:
            return {
                "type": tag_type.lower().replace('_', '-'),
                "data": {"content": content},
                "tag_type": tag_type
            }
    
    async def _send(self, data: str):
        """MODIFIED: Don't send regular data, only used for debugging"""
        # This method is now mostly disabled
        pass
    
    def check_for_prompt(self, buffer: str) -> Optional[str]:
        """Check if buffer contains a prompt that needs user input"""
        # Special handling for "Run another MAS?" to prevent duplicates
        if "Run another MAS?" in buffer and (buffer.strip().endswith(":") or "(y/N)" in buffer):
            if self.handling_run_another_mas:
                return None  # Already handling this specific prompt
            return buffer.strip()
            
        if self.prompt_detector.is_likely_prompt(buffer.strip()):
            return buffer.strip()
        return None
    
    def clear_prompt(self):
        """Clear held prompt buffer when we confirm it's a prompt"""
        self.hold_buffer = ""
        self.buffer = ""
        self.handling_run_another_mas = False
    
    async def flush_if_not_prompt(self):
        """Modified: Only worry about prompts, not regular output"""
        self.hold_buffer = ""
        self.buffer = ""
    
    async def force_flush(self):
        """Modified: Check if we have incomplete tag data to send"""
        if self.inside_tag and self.current_tag_content:
            # Send incomplete tag warning
            if self.ws_manager:
                await self.ws_manager.send_log(self.run_id, {
                    "type": "incomplete_tag",
                    "stream_id": self.current_stream_id,
                    "tag_type": self.current_tag_type,
                    "partial_content": self.current_tag_content
                })
        self.hold_buffer = ""
        self.buffer = ""
    
    def reset_for_new_mas(self):
        """Reset state when user chooses to run another MAS"""
        self.seen_prompts.clear()
        self.error_state = False
        self.prompt_detector.seen_prompts.clear()
        self.inside_tag = False
        self.current_tag_type = None
        self.current_tag_content = ""
        self.current_stream_id = None
        self.handling_run_another_mas = False
        
    async def flush(self):
        """Flush any remaining incomplete tags"""
        await self.force_flush()
        incomplete = self.parser.flush()
        if incomplete and self.ws_manager:
            incomplete['stream_id'] = f"stream_incomplete_{self.stream_counter + 1}"
            await self.ws_manager.send_log(self.run_id, incomplete)
    
    def _filter_sensitive_content(self, text):
        """Filter out lines containing sensitive information"""
        # Keep existing implementation but it won't be used for streaming
        FILTER_PATTERNS = [
            r'API_KEY:\s*[a-zA-Z0-9\-_]{20,}'
        ]
        
        lines = text.split('\n')
        filtered_lines = []
        
        for line in lines:
            should_filter = False
            for pattern in FILTER_PATTERNS:
                if re.search(pattern, line, re.IGNORECASE):
                    should_filter = True
                    break
            
            if not should_filter:
                filtered_lines.append(line)
        
        result = '\n'.join(filtered_lines)
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
    This version uses character-by-character processing like mas_bridge_4.py
    but also supports tag parsing
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
                "type": "start",
                "data": {
                    "pid": None,
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
        
        # Send process started notification
        if ws_manager:
            await ws_manager.send_log(run_id, {
                "type": "process_started",
                "data": {
                    "pid": process.pid,
                    "log_file": str(log_file_path)
                }
            })
        
        # Initialize output buffer with tag support
        output_buffer = TagAwareOutputBuffer(ws_manager, run_id)
        detector = output_buffer.prompt_detector
        
        # Main output processing loop (character by character like mas_bridge_4.py)
        with open(log_file_path, 'w', encoding='utf-8') as log_file:
            buffer = ""
            line_buffer = ""
            all_output = []
            last_char_time = asyncio.get_event_loop().time()
            no_output_count = 0
            error_state = False
            
            while True:
                # Read one byte at a time for better control
                try:
                    data = await asyncio.wait_for(process.stdout.read(1), timeout=0.1)
                    no_output_count = 0
                except asyncio.TimeoutError:
                    no_output_count += 1
                    
                    # Flush non-prompt buffers on timeout
                    await output_buffer.flush_if_not_prompt()
                    
                    current_buffer = buffer.strip()
                    recent_output = "".join(all_output[-100:]) if all_output else ""
                    
                    # Check for "Run another MAS?" prompt
                    if "Run another MAS?" in recent_output and recent_output.rstrip().endswith(":"):
                        lines = recent_output.split('\n')
                        for line in reversed(lines):
                            if "Run another MAS?" in line:
                                prompt_line = line.strip()
                                break
                        else:
                            prompt_line = current_buffer
                        
                        if prompt_line and prompt_line not in detector.seen_prompts:
                            if "Run another MAS?" in prompt_line:
                                output_buffer.handling_run_another_mas = True  # Only set for this specific prompt

                            output_buffer.clear_prompt()
                            detector.seen_prompts.add(prompt_line)
                            
                            if ws_manager:
                                await ws_manager.send_log(run_id, {
                                    "type": "prompt",
                                    "data": {
                                        "prompt": prompt_line,
                                        "multiline": False
                                    }
                                })
                            
                            user_input = await input_handler(prompt_line)
                            
                            if user_input is not None:
                                try:
                                    if process.returncode is None:
                                        process.stdin.write((user_input + '\n').encode())
                                        await process.stdin.drain()
                                    
                                    buffer = ""
                                    line_buffer = ""
                                    detector.last_input_time = asyncio.get_event_loop().time()
                                    
                                    if user_input.lower() == 'y':
                                        output_buffer.reset_for_new_mas()
                                    
                                except (BrokenPipeError, RuntimeError) as e:
                                    print(f"[SHEPHERD] Process terminated while sending input: {e}")
                                    break
                        
                        no_output_count = 0
                        continue
                    
                    # Check for hypothesis prompt (silent wait)
                    hypothesis_instruction_seen = False
                    for line in detector.recent_lines[-5:]:
                        if "Enter hypothesis (press Enter twice when done):" in line:
                            hypothesis_instruction_seen = True
                            break
                    
                    current_time = asyncio.get_event_loop().time()
                    time_since_last = current_time - last_char_time
                    
                    if hypothesis_instruction_seen and time_since_last > 0.5 and not detector.waiting_for_multiline:
                        if "hypothesis_silent_wait" in detector.seen_prompts:
                            continue
                        
                        detector.waiting_for_multiline = True
                        detector.seen_prompts.add("hypothesis_silent_wait")
                        output_buffer.clear_prompt()
                        
                        if ws_manager:
                            await ws_manager.send_log(run_id, {
                                "type": "prompt",
                                "data": {
                                    "prompt": "Enter your detailed vulnerability hypothesis:",
                                    "multiline": False
                                }
                            })
                        
                        user_input = await input_handler("Enter your detailed vulnerability hypothesis:")
                        
                        if user_input is not None:
                            try:
                                if process.returncode is None:
                                    process.stdin.write((user_input + '\n').encode())
                                    await process.stdin.drain()
                                    process.stdin.write('\n'.encode())
                                    await process.stdin.drain()
                                    
                                detector.waiting_for_multiline = False
                                buffer = ""
                                line_buffer = ""
                                
                            except (BrokenPipeError, RuntimeError) as e:
                                print(f"[SHEPHERD] Process terminated while sending input: {e}")
                                break
                        
                        no_output_count = 0
                        continue
                    
                    # Normal prompt detection
                    if buffer and detector.should_wait_for_input(buffer, time_since_last):
                        prompt_line = buffer.strip()
                        
                        if "press enter twice" in prompt_line.lower():
                            continue
                        if "detailed vulnerability hypothesis" in prompt_line.lower():
                            continue
                        if "hypothesis_silent_wait" in detector.seen_prompts:
                            continue
                        if prompt_line in detector.seen_prompts:
                            continue
                        
                        output_buffer.clear_prompt()
                        detector.seen_prompts.add(prompt_line)
                        
                        if ws_manager:
                            await ws_manager.send_log(run_id, {
                                "type": "prompt",
                                "data": {
                                    "prompt": prompt_line,
                                    "multiline": False
                                }
                            })
                        
                        user_input = await input_handler(prompt_line)
                        
                        if user_input is not None:
                            try:
                                if process.returncode is None:
                                    process.stdin.write((user_input + '\n').encode())
                                    await process.stdin.drain()
                                
                                buffer = ""
                                line_buffer = ""
                                detector.last_input_time = current_time
                                
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
                
                # Update last character time
                last_char_time = asyncio.get_event_loop().time()
                
                # Decode character
                char = data.decode('utf-8', errors='ignore')
                
                # Check for error state
                if "GRAPH_RECURSION_LIMIT" in "".join(all_output[-500:]):
                    if not error_state:
                        print(f"[DEBUG] ENTERING ERROR STATE - detected GRAPH_RECURSION_LIMIT")
                    error_state = True
                    output_buffer.error_state = True
                
                # Always accumulate buffer
                buffer += char
                line_buffer += char
                
                # Handle "Run another MAS?" prompt detection
                if "Run another MAS?" in buffer and ("(y/N): " in buffer or buffer.endswith(": ")):
                    lines = buffer.split('\n')
                    prompt_line = None
                    for line in lines:
                        if "Run another MAS?" in line and ("(y/N)" in line or line.endswith(":")):
                            prompt_line = line.strip()
                            break
                    
                    if not prompt_line and "Run another MAS?" in buffer and buffer.endswith(": "):
                        prompt_line = buffer.strip()
                        
                    if prompt_line and prompt_line not in detector.seen_prompts:
                        if "Run another MAS?" in prompt_line:
                            output_buffer.handling_run_another_mas = True  # Only set for this specific prompt
                        if not error_state:
                            output_buffer.clear_prompt()
                        
                        detector.seen_prompts.add(prompt_line)
                        if ws_manager:
                            await ws_manager.send_log(run_id, {
                                "type": "prompt",
                                "data": {
                                    "prompt": prompt_line,
                                    "multiline": False
                                }
                            })
                        
                        user_input = await input_handler(prompt_line)
                        if user_input is not None:
                            try:
                                if process.returncode is None:
                                    process.stdin.write((user_input + '\n').encode())
                                    await process.stdin.drain()
                                
                                buffer = ""
                                line_buffer = ""
                                error_state = False
                                output_buffer.error_state = False
                                detector.last_input_time = asyncio.get_event_loop().time()
                                
                                if user_input.lower() == 'y':
                                    output_buffer.reset_for_new_mas()
                                    
                            except (BrokenPipeError, RuntimeError) as e:
                                print(f"[SHEPHERD] Process terminated while sending input: {e}")
                                break
                        
                        continue
                
                # Process character through output buffer
                if error_state:
                    # In error state, send directly
                    log_file.write(char)
                    log_file.flush()
                    print(char, end='', flush=True)
                    all_output.append(char)
                else:
                    # Normal flow - use output buffer with tag processing
                    await output_buffer.add_char(char)
                    log_file.write(char)
                    log_file.flush()
                    print(char, end='', flush=True)
                    all_output.append(char)
                
                # Handle newlines for buffer management
                if char == '\n':
                    if buffer.strip():
                        detector.add_line(buffer.strip())
                    if "Run another MAS?" not in buffer:
                        buffer = ""
                        line_buffer = ""
        
        # Force flush any remaining data
        await output_buffer.force_flush()
        
        # Close stdin
        process.stdin.close()
        
        print(f"\n[SHEPHERD DEBUG] Main loop ended. Process returncode: {process.returncode}")
        
        # Wait for process to complete
        return_code = await process.wait()
        
        print(f"\n[SHEPHERD] Process exited with code: {return_code}")
        
        # Send completion notification
        if ws_manager:
            await ws_manager.send_log(run_id, {
                "type": "complete",
                "data": {
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