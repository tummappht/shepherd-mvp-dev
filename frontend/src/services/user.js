import { get } from "./utils";

export const serviceUserSessions = async (params) => {
  return get(`/user/sessions`, { params });
};

export const serviceUserSessionByRunId = async (runId) => {
  return get(`/user/sessions/${runId}`);
};
