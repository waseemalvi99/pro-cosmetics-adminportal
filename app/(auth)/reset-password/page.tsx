"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2, KeyRound, Eye, EyeOff, Check, X, CheckCircle2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/lib/api/auth";

const resetSchema = z
  .object({
    email: z.string().email("Please enter a valid email address"),
    token: z.string().min(1, "Reset code is required"),
    newPassword: z
      .string()
      .min(6, "Minimum 6 characters")
      .regex(/[A-Z]/, "Must include an uppercase letter")
      .regex(/[a-z]/, "Must include a lowercase letter")
      .regex(/[0-9]/, "Must include a digit"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetForm = z.infer<typeof resetSchema>;

function PasswordRequirement({ met, label }: { met: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      {met ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <X className="h-3.5 w-3.5 text-[#c5b9a8]" />}
      <span className={`text-xs ${met ? "text-emerald-600" : "text-[#c5b9a8]"}`}>{label}</span>
    </div>
  );
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
  });

  const watchPassword = watch("newPassword");

  const onSubmit = async (data: ResetForm) => {
    try {
      const res = await authApi.resetPassword({
        email: data.email,
        token: data.token,
        newPassword: data.newPassword,
      });
      if (res.success) {
        setSuccess(true);
      } else {
        toast.error("Reset failed", {
          description: res.message || "Invalid or expired reset code.",
        });
      }
    } catch {
      toast.error("Connection error", {
        description: "Unable to connect to the server. Please try again.",
      });
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Panel — Brand */}
      <div className="relative hidden w-1/2 overflow-hidden lg:block">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1c1814] via-[#2a2118] to-[#1a1510]" />
        <div className="absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-[#c8a97e]/8 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full bg-[#c8a97e]/10 blur-[140px]" />
        <div className="absolute top-1/3 right-1/4 h-[300px] w-[300px] rounded-full bg-[#c8a97e]/5 blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(200,169,126,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(200,169,126,0.5) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
        <div className="absolute top-0 left-[45%] h-full w-px bg-gradient-to-b from-transparent via-[#c8a97e]/20 to-transparent rotate-12 origin-top" />

        <div className="relative z-10 flex h-full flex-col justify-between p-12">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-white/10 ring-1 ring-white/10 backdrop-blur-sm">
              <Image src="/logo.png" alt="Pro Cosmetics" width={30} height={30} className="object-contain" priority />
            </div>
            <span className="text-sm font-semibold tracking-wide text-[#e8dcc8]">Pro Cosmetics</span>
          </div>

          <div className="max-w-md">
            <div className="mb-6 flex items-center gap-2">
              <div className="h-px w-8 bg-gradient-to-r from-[#c8a97e] to-transparent" />
              <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#c8a97e]">Password Reset</span>
            </div>
            <h2 className="font-display text-4xl font-bold leading-[1.15] tracking-tight text-white">
              Almost there,
              <br />
              <span className="bg-gradient-to-r from-[#c8a97e] to-[#e8d5b5] bg-clip-text text-transparent">
                set a new password
              </span>
            </h2>
            <p className="mt-5 text-[15px] leading-relaxed text-[#9a8e7e]">
              Enter the reset code from your email along with your new password. You&apos;ll be back in your account in moments.
            </p>

            <div className="mt-10 space-y-4">
              {["Paste the code from your email", "Choose a strong new password", "Sign in with your new credentials"].map((step) => (
                <div key={step} className="flex items-center gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#c8a97e]/10 ring-1 ring-[#c8a97e]/20">
                    <Sparkles className="h-3 w-3 text-[#c8a97e]" />
                  </div>
                  <span className="text-sm text-[#b0a494]">{step}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-[#5a5045]">&copy; {new Date().getFullYear()} Pro Cosmetics. All rights reserved.</p>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="relative flex w-full items-center justify-center lg:w-1/2">
        <div className="absolute inset-0 bg-gradient-to-br from-[#fdf8f0] via-[#fefcf8] to-[#f8f0e5]" />
        <div className="absolute top-0 right-0 h-[400px] w-[400px] rounded-full bg-[#c8a97e]/6 blur-[100px]" />
        <div className="absolute bottom-0 left-0 h-[300px] w-[300px] rounded-full bg-[#c8a97e]/4 blur-[80px]" />

        <div className="relative z-10 w-full max-w-[400px] px-8">
          <div className="mb-10 flex flex-col items-center lg:hidden">
            <div className="mb-4 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-lg shadow-black/5 ring-1 ring-black/5">
              <Image src="/logo.png" alt="Pro Cosmetics" width={44} height={44} className="object-contain" priority />
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-[#2d2316]">Pro Cosmetics</h1>
          </div>

          {success ? (
            <div className="text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 ring-1 ring-emerald-100">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              </div>
              <h1 className="font-display text-[28px] font-bold tracking-tight text-[#2d2316]">Password reset!</h1>
              <p className="mt-3 text-[14px] leading-relaxed text-[#8a7a68]">
                Your password has been successfully updated. You can now sign in with your new password.
              </p>
              <div className="mt-8">
                <Button
                  onClick={() => router.push("/login")}
                  className="h-11 w-full rounded-xl bg-gradient-to-r from-[#c8a97e] to-[#b8956a] text-[13px] font-semibold text-white shadow-lg shadow-[#c8a97e]/25 transition-all hover:from-[#b8956a] hover:to-[#a8855a] hover:shadow-[#c8a97e]/40"
                >
                  Continue to Sign In
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#c8a97e]/10 ring-1 ring-[#c8a97e]/20">
                  <KeyRound className="h-5 w-5 text-[#c8a97e]" />
                </div>
                <h1 className="font-display text-[28px] font-bold tracking-tight text-[#2d2316]">Reset password</h1>
                <p className="mt-2 text-[14px] text-[#8a7a68]">Enter the code from your email and choose a new password.</p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-[13px] font-medium text-[#4a3f35]">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@procosmetics.com"
                    className="h-11 rounded-xl border-[#e5ddd0] bg-white/70 text-[#2d2316] shadow-sm placeholder:text-[#c5b9a8] focus-visible:border-[#c8a97e] focus-visible:ring-[#c8a97e]/20"
                    {...register("email")}
                  />
                  {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="token" className="text-[13px] font-medium text-[#4a3f35]">Reset Code</Label>
                  <Input
                    id="token"
                    type="text"
                    placeholder="Paste the code from your email"
                    className="h-11 rounded-xl border-[#e5ddd0] bg-white/70 font-mono text-sm text-[#2d2316] shadow-sm placeholder:font-sans placeholder:text-[#c5b9a8] focus-visible:border-[#c8a97e] focus-visible:ring-[#c8a97e]/20"
                    {...register("token")}
                  />
                  {errors.token && <p className="text-xs text-red-500">{errors.token.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="newPassword" className="text-[13px] font-medium text-[#4a3f35]">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      className="h-11 rounded-xl border-[#e5ddd0] bg-white/70 pr-10 text-[#2d2316] shadow-sm placeholder:text-[#c5b9a8] focus-visible:border-[#c8a97e] focus-visible:ring-[#c8a97e]/20"
                      {...register("newPassword")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#c5b9a8] transition-colors hover:text-[#8a7a68]"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.newPassword && <p className="text-xs text-red-500">{errors.newPassword.message}</p>}
                </div>

                {watchPassword && (
                  <div className="rounded-xl border border-[#e5ddd0] bg-white/50 p-3">
                    <div className="grid grid-cols-2 gap-1.5">
                      <PasswordRequirement met={watchPassword.length >= 6} label="6+ characters" />
                      <PasswordRequirement met={/[A-Z]/.test(watchPassword)} label="Uppercase" />
                      <PasswordRequirement met={/[a-z]/.test(watchPassword)} label="Lowercase" />
                      <PasswordRequirement met={/[0-9]/.test(watchPassword)} label="Digit" />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-[13px] font-medium text-[#4a3f35]">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirm ? "text" : "password"}
                      placeholder="Confirm new password"
                      className="h-11 rounded-xl border-[#e5ddd0] bg-white/70 pr-10 text-[#2d2316] shadow-sm placeholder:text-[#c5b9a8] focus-visible:border-[#c8a97e] focus-visible:ring-[#c8a97e]/20"
                      {...register("confirmPassword")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#c5b9a8] transition-colors hover:text-[#8a7a68]"
                    >
                      {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>}
                </div>

                <div className="pt-1">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-11 w-full rounded-xl bg-gradient-to-r from-[#c8a97e] to-[#b8956a] text-[13px] font-semibold text-white shadow-lg shadow-[#c8a97e]/25 transition-all hover:from-[#b8956a] hover:to-[#a8855a] hover:shadow-[#c8a97e]/40 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Resetting...
                      </>
                    ) : (
                      "Reset Password"
                    )}
                  </Button>
                </div>
              </form>

              <div className="mt-6 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-[13px] text-[#8a7a68] transition-colors hover:text-[#2d2316]"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to sign in
                </Link>
              </div>
            </>
          )}

          <p className="mt-10 text-center text-[11px] text-[#c5b9a8] lg:hidden">Pro Cosmetics Admin Portal v1.0</p>
        </div>
      </div>
    </div>
  );
}
