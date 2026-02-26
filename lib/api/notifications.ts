import { apiClient } from "@/lib/api-client";
import type { NotificationDto } from "@/types";

export const notificationsApi = {
  list: () =>
    apiClient.get<NotificationDto[]>("/api/notifications"),

  markAsRead: (id: number) =>
    apiClient.put<void>(`/api/notifications/${id}/read`),
};
