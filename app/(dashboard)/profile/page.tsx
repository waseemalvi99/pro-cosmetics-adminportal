"use client";

import { useState, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  User,
  Camera,
  Trash2,
  Loader2,
  Lock,
  Eye,
  EyeOff,
  Check,
  X,
  Shield,
  Mail,
  Calendar,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { PageHeader } from "@/components/shared/page-header";
import { profileApi } from "@/lib/api/profile";
import { useAuth } from "@/contexts/auth-context";
import { getImageUrl } from "@/lib/utils";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5089";

const profileSchema = z.object({
  fullName: z.string().min(1, "Name is required").max(100, "Name is too long"),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(6, "Minimum 6 characters")
      .regex(/[A-Z]/, "Must include an uppercase letter")
      .regex(/[a-z]/, "Must include a lowercase letter")
      .regex(/[0-9]/, "Must include a digit"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

function getProfilePictureUrl(profilePicture: string | null | undefined): string | undefined {
  if (!profilePicture) return undefined;
  if (profilePicture.startsWith("http")) return profilePicture;
  if (profilePicture.startsWith("/")) return `${API_BASE_URL}${profilePicture}`;
  return `${API_BASE_URL}/uploads/profiles/${profilePicture}`;
}

function PasswordRequirement({ met, label }: { met: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      {met ? (
        <Check className="h-3.5 w-3.5 text-emerald-500" />
      ) : (
        <X className="h-3.5 w-3.5 text-muted-foreground/40" />
      )}
      <span className={`text-xs ${met ? "text-emerald-600" : "text-muted-foreground/60"}`}>
        {label}
      </span>
    </div>
  );
}

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await profileApi.getProfile();
      if (res.success && res.data) {
        updateUser(res.data);
        return res.data;
      }
      throw new Error(res.message || "Failed to load profile");
    },
  });

  const currentUser = profile || user;

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: { fullName: currentUser?.fullName || "" },
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const watchNewPassword = passwordForm.watch("newPassword");

  const updateProfileMutation = useMutation({
    mutationFn: (data: ProfileForm) => profileApi.updateProfile(data),
    onSuccess: (res) => {
      if (res.success && res.data) {
        updateUser(res.data);
        queryClient.invalidateQueries({ queryKey: ["profile"] });
        setIsEditingName(false);
        toast.success("Profile updated", { description: "Your name has been changed." });
      } else {
        toast.error("Update failed", { description: res.message || "Could not update profile." });
      }
    },
    onError: () => toast.error("Connection error", { description: "Please try again." }),
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: PasswordForm) =>
      profileApi.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      }),
    onSuccess: (res) => {
      if (res.success) {
        passwordForm.reset();
        toast.success("Password changed", { description: "Your password has been updated." });
      } else {
        toast.error("Password change failed", { description: res.message || "Please check your current password." });
      }
    },
    onError: () => toast.error("Connection error", { description: "Please try again." }),
  });

  const uploadPictureMutation = useMutation({
    mutationFn: (file: File) => profileApi.uploadPicture(file),
    onSuccess: (res) => {
      if (res.success && res.data) {
        const filename = res.data.split("/").pop() || res.data;
        updateUser({ profilePicture: filename });
        queryClient.invalidateQueries({ queryKey: ["profile"] });
        toast.success("Picture updated", { description: "Your profile picture has been changed." });
      } else {
        toast.error("Upload failed", { description: res.message || "Could not upload picture." });
      }
    },
    onError: () => toast.error("Upload error", { description: "Please try again." }),
  });

  const removePictureMutation = useMutation({
    mutationFn: () => profileApi.removePicture(),
    onSuccess: (res) => {
      if (res.success) {
        updateUser({ profilePicture: null });
        queryClient.invalidateQueries({ queryKey: ["profile"] });
        toast.success("Picture removed", { description: "Your profile picture has been removed." });
      } else {
        toast.error("Failed", { description: res.message || "Could not remove picture." });
      }
    },
    onError: () => toast.error("Connection error", { description: "Please try again." }),
  });

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (!validTypes.includes(file.type)) {
        toast.error("Invalid file type", { description: "Please use JPG, PNG, or WebP images." });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File too large", { description: "Maximum file size is 5MB." });
        return;
      }

      uploadPictureMutation.mutate(file);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [uploadPictureMutation]
  );

  const profilePictureUrl = getProfilePictureUrl(currentUser?.profilePicture);
  const initials = currentUser?.fullName
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

  return (
    <div className="space-y-8">
      <PageHeader
        title="My Profile"
        description="Manage your personal information and security settings"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Profile Card */}
        <div className="lg:col-span-1">
          <Card className="overflow-hidden">
            <div className="relative h-28 bg-gradient-to-br from-[#c8a97e]/30 via-primary/10 to-[#c8a97e]/20">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M0%200h20v20H0z%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M10%200v20M0%2010h20%22%20stroke%3D%22rgba(200%2C169%2C126%2C0.08)%22%20stroke-width%3D%220.5%22%2F%3E%3C%2Fsvg%3E')] opacity-60" />
            </div>
            <CardContent className="relative -mt-14 pb-6 pt-0">
              <div className="flex flex-col items-center">
                {/* Avatar with upload overlay */}
                <div className="group relative">
                  <Avatar className="h-24 w-24 border-4 border-card shadow-lg">
                    {profilePictureUrl ? (
                      <AvatarImage src={profilePictureUrl} alt={currentUser?.fullName || "Profile"} />
                    ) : null}
                    <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-lg font-semibold text-primary-foreground">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadPictureMutation.isPending}
                    className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 opacity-0 transition-all duration-200 group-hover:bg-black/40 group-hover:opacity-100"
                  >
                    {uploadPictureMutation.isPending ? (
                      <Loader2 className="h-5 w-5 animate-spin text-white" />
                    ) : (
                      <Camera className="h-5 w-5 text-white" />
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>

                {/* Name & email */}
                <h3 className="mt-4 text-lg font-semibold">{currentUser?.fullName}</h3>
                <p className="text-sm text-muted-foreground">{currentUser?.email}</p>

                {/* Roles */}
                <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                  {currentUser?.roles.map((role) => (
                    <Badge key={role} variant="secondary" className="text-[11px] font-medium">
                      <Shield className="mr-1 h-3 w-3" />
                      {role}
                    </Badge>
                  ))}
                </div>

                {/* Picture actions */}
                {currentUser?.profilePicture && (
                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadPictureMutation.isPending}
                      className="h-8 text-xs"
                    >
                      <Camera className="mr-1.5 h-3 w-3" />
                      Change
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removePictureMutation.mutate()}
                      disabled={removePictureMutation.isPending}
                      className="h-8 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      {removePictureMutation.isPending ? (
                        <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="mr-1.5 h-3 w-3" />
                      )}
                      Remove
                    </Button>
                  </div>
                )}
              </div>

              <Separator className="my-5" />

              {/* Info grid */}
              <div className="space-y-3.5">
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">Email</p>
                    <p className="truncate text-sm">{currentUser?.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">Joined</p>
                    <p className="text-sm">
                      {currentUser?.createdAt
                        ? new Date(currentUser.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        : "—"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">Status</p>
                    <Badge
                      variant={currentUser?.isActive ? "default" : "secondary"}
                      className="mt-0.5 text-[11px]"
                    >
                      {currentUser?.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Edit forms */}
        <div className="space-y-6 lg:col-span-2">
          {/* Edit Name */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Personal Information</CardTitle>
                  <CardDescription>Update your display name</CardDescription>
                </div>
                {!isEditingName && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingName(true)}
                    className="h-8 text-xs"
                  >
                    <Pencil className="mr-1.5 h-3 w-3" />
                    Edit
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isEditingName ? (
                <form onSubmit={profileForm.handleSubmit((d) => updateProfileMutation.mutate(d))} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="fullName" className="text-[13px] font-medium">
                      Full Name
                    </Label>
                    <Input
                      id="fullName"
                      placeholder="Enter your full name"
                      className="h-10"
                      {...profileForm.register("fullName")}
                    />
                    {profileForm.formState.errors.fullName && (
                      <p className="text-xs text-destructive">
                        {profileForm.formState.errors.fullName.message}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      size="sm"
                      disabled={updateProfileMutation.isPending}
                      className="h-9"
                    >
                      {updateProfileMutation.isPending && (
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      )}
                      Save Changes
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsEditingName(false);
                        profileForm.reset();
                      }}
                      className="h-9"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-3">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
                      Full Name
                    </p>
                    <p className="mt-0.5 text-sm font-medium">{currentUser?.fullName}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
                      Email Address
                    </p>
                    <p className="mt-0.5 text-sm font-medium">{currentUser?.email}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Lock className="h-4 w-4 text-muted-foreground" />
                Change Password
              </CardTitle>
              <CardDescription>Update your password to keep your account secure</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={passwordForm.handleSubmit((d) => changePasswordMutation.mutate(d))}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <Label htmlFor="currentPassword" className="text-[13px] font-medium">
                    Current Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      placeholder="Enter current password"
                      className="h-10 pr-10"
                      {...passwordForm.register("currentPassword")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 transition-colors hover:text-muted-foreground"
                    >
                      {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {passwordForm.formState.errors.currentPassword && (
                    <p className="text-xs text-destructive">
                      {passwordForm.formState.errors.currentPassword.message}
                    </p>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="newPassword" className="text-[13px] font-medium">
                      New Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        placeholder="Enter new password"
                        className="h-10 pr-10"
                        {...passwordForm.register("newPassword")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 transition-colors hover:text-muted-foreground"
                      >
                        {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {passwordForm.formState.errors.newPassword && (
                      <p className="text-xs text-destructive">
                        {passwordForm.formState.errors.newPassword.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPassword" className="text-[13px] font-medium">
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm new password"
                        className="h-10 pr-10"
                        {...passwordForm.register("confirmPassword")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 transition-colors hover:text-muted-foreground"
                      >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {passwordForm.formState.errors.confirmPassword && (
                      <p className="text-xs text-destructive">
                        {passwordForm.formState.errors.confirmPassword.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Password policy indicators */}
                {watchNewPassword && (
                  <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
                    <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
                      Password Requirements
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                      <PasswordRequirement met={watchNewPassword.length >= 6} label="At least 6 characters" />
                      <PasswordRequirement met={/[A-Z]/.test(watchNewPassword)} label="One uppercase letter" />
                      <PasswordRequirement met={/[a-z]/.test(watchNewPassword)} label="One lowercase letter" />
                      <PasswordRequirement met={/[0-9]/.test(watchNewPassword)} label="One digit" />
                    </div>
                  </div>
                )}

                <div className="pt-1">
                  <Button
                    type="submit"
                    disabled={changePasswordMutation.isPending}
                    className="h-9"
                  >
                    {changePasswordMutation.isPending && (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    )}
                    Update Password
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
