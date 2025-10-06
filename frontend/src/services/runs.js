import { del, get, post } from "./utils";

export const startRun = async (runId, formData) => {
  return post(`/runs/${runId}`, formData);
};

export const startRunChallenge = async (runId, challengeName, data) => {
  return post(`/runs/${challengeName}/${runId}`, data);
};

export const cancelRun = async (runId) => {
  return del(`/runs/${runId}/cancel`);
};

export const getRunStatus = async (runId) => {
  return get(`/runs/${runId}/status`);
};

export const saveWaitlistEmail = async (email) => {
  return post(`/save-waitlist-email`, { email });
};
