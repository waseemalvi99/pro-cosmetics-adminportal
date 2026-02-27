import { apiClient } from "@/lib/api-client";
import type { SendEmailRequest } from "@/types";

export const emailsApi = {
  send: (data: SendEmailRequest) =>
    apiClient.post<string>("/api/emails/send", data),
};
