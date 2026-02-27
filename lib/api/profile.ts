import { apiClient } from "@/lib/api-client";
import type {
  UserDto,
  UpdateProfileRequest,
  ChangePasswordRequest,
} from "@/types";

export const profileApi = {
  getProfile: () =>
    apiClient.get<UserDto>("/api/profile"),

  updateProfile: (data: UpdateProfileRequest) =>
    apiClient.put<UserDto>("/api/profile", data),

  changePassword: (data: ChangePasswordRequest) =>
    apiClient.put<null>("/api/profile/password", data),

  uploadPicture: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.upload<string>("/api/profile/picture", formData);
  },

  removePicture: () =>
    apiClient.delete<null>("/api/profile/picture"),
};
