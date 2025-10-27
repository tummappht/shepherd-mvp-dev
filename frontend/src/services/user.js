import { get, patch } from "./utils";

export const serviceUserSessions = async (params) => {
  return get(`/user/sessions`, { params });
};

export const serviceUserSessionByRunId = async (runId) => {
  return get(`/user/sessions/${runId}`);
};

export const serviceUpdateUserSessionName = async (runId, name) => {
  return patch(`/user/sessions/${runId}/name`, { name });
};
