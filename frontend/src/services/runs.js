import { del, get, post } from "./utils";

export const serviceStartRun = async (runId, formData) => {
  return post(`/runs/${runId}`, formData);
};

export const serviceStartRunChallenge = async (runId, challengeName, data) => {
  return post(`/runs/${challengeName}/${runId}`, data);
};

export const serviceCancelRun = async (runId) => {
  return del(`/runs/${runId}/cancel`);
};

export const serviceGetRunStatus = async (runId) => {
  return get(`/runs/${runId}/status`);
};

export const serviceSaveWaitlistEmail = async (email) => {
  return post(`/save-waitlist-email`, { email });
};
