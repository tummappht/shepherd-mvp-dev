import { del, get, post, API_BASE } from "./utils";

export const serviceStartRun = async (runId, formData) => {
  return post(`/runs/${runId}`, formData);
};

export const serviceStartRunChallenge = async (runId, challengeName, data) => {
  return post(`/runs/${challengeName}/${runId}`, data);
};

export const serviceCancelRun = async (runId, delayMs = 0) => {
  if (delayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  return del(`/runs/${runId}/cancel`);
};

export const serviceGetRunStatus = async (runId) => {
  return get(`/runs/${runId}/status`);
};

export const serviceSaveWaitlistEmail = async (email) => {
  if (!email?.trim()) return;
  return post(`/save-waitlist-email`, { email: email.trim() });
};

// WebSocket URL helper
export const getWebSocketUrl = (runId) => {
  if (!runId) return null;

  try {
    const url = new URL(API_BASE);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    url.pathname = url.pathname.replace(/\/$/, "") + `/ws/${runId}`;
    return url.toString();
  } catch (error) {
    console.error("Failed to create WebSocket URL:", error);
    return null;
  }
};

export const serviceGetContractNameList = async (formData) => {
  return post(`/get-contract-name-list`, formData);
};
