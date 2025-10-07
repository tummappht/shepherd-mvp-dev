import { post } from "./utils";

export const serviceReportIssue = async (formData) => {
  return post(`/report-issue`, formData);
};
