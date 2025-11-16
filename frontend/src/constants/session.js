export const MESSAGE_TYPES = {
  PROMPT: "prompt",
  USER_INPUT: "user-input",
  DESCRIPTION: "description",
  PLANNER_STEP: "planner-step",
  EXECUTOR_TOOL_CALL: "executor-tool-call",
  EXECUTOR_TOOL_RESULT: "executor-tool-result",
  AGENT: "agent",
  OUTPUT: "output",
  STDOUT: "stdout",
  LOG: "log",
  IDLE_TIMEOUT: "idle_timeout",
  COMPLETE: "complete",
  STDERR: "stderr",
  ERROR: "error",
  END: "end",
};

export const CONTENT_TYPES = {
  INPUT: "input",
  OPTION: "option",
  HEADER: "header",
  TEXT: "text",
  TABLE: "table",
  RADIO: "radio",
  CHOICE: "choice",
};

export const MESSAGE_PATTERNS = {
  GITHUB_URL_PROMPT: "Please enter a GitHub URL",
  CONTRACT_SELECTION_PROMPT:
    "Select the contracts and functions you want to test",
  UPDATED_CHUNK_MAP_PROMPT: "Updated chunk map",
  NON_DEPLOYABLE_FILES_PROMPT:
    "file names that are not deployable like interfaces",
  WHAT_WOULD_YOU_LIKE_TO_DO_NEXT_PROMPT: "What would you like to do next?",
  RUN_ANOTHER_MAS_PROMPT: "run another mas",
  ENDING_RUN_MESSAGE: "Ending Run.",
};

export const RUN_STATUS = {
  INITIALIZING: "Initializing",
  STARTED: "Started",
  ENDED: "Ended",
  ERROR: "Error",
  AT_CAPACITY: "At capacity",
};
