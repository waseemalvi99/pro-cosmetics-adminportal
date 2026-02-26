"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/lib/api/auth";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      const response = await authApi.login(data);
      if (response.success && response.data) {
        const { token, refreshToken, user } = response.data;
        localStorage.setItem("access_token", token);
        localStorage.setItem("refresh_token", refreshToken);
        localStorage.setItem("user", JSON.stringify(user));
        toast.success("Welcome back!", {
          description: `Signed in as ${user.fullName}`,
        });
        router.push("/");
      } else {
        toast.error("Login failed", {
          description: response.message || "Invalid credentials",
        });
      }
    } catch {
      toast.error("Connection error", {
        description: "Unable to connect to the server. Please try again.",
      });
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Warm gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#f8f0e5] via-[#fdf6ee] to-[#f0e6d3]" />
      <div className="absolute top-0 right-0 h-[600px] w-[600px] rounded-full bg-gradient-to-bl from-[#c8a97e]/15 to-transparent blur-3xl" />
      <div className="absolute bottom-0 left-0 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-[#c8a97e]/10 to-transparent blur-3xl" />

      <div className="relative z-10 w-full max-w-[420px] px-6">
        <div className="mb-10 text-center">
          <div className="mb-6 flex justify-center">
            <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-lg shadow-black/5 ring-1 ring-black/5">
              <Image
                src="/logo.png"
                alt="Pro Cosmetics"
                width={56}
                height={56}
                className="object-contain"
                priority
              />
            </div>
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-[#2d2316]">
            Pro Cosmetics
          </h1>
          <p className="mt-2 text-sm text-[#8a7a68]">
            Sign in to the admin portal
          </p>
        </div>

        <div className="rounded-2xl border border-white/60 bg-white/80 p-8 shadow-xl shadow-black/5 backdrop-blur-xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-[#4a3f35]">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@procosmetics.com"
                className="h-11 rounded-xl border-[#e5ddd0] bg-white/60 text-[#2d2316] placeholder:text-[#bfb3a3] focus-visible:border-[#c8a97e] focus-visible:ring-[#c8a97e]/20"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-[#4a3f35]">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="h-11 rounded-xl border-[#e5ddd0] bg-white/60 pr-10 text-[#2d2316] placeholder:text-[#bfb3a3] focus-visible:border-[#c8a97e] focus-visible:ring-[#c8a97e]/20"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#bfb3a3] transition-colors hover:text-[#8a7a68]"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-11 w-full rounded-xl bg-gradient-to-r from-[#c8a97e] to-[#b8956a] text-sm font-semibold text-white shadow-lg shadow-[#c8a97e]/25 transition-all hover:from-[#b8956a] hover:to-[#a8855a] hover:shadow-[#c8a97e]/35 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>
        </div>

        <p className="mt-8 text-center text-xs text-[#bfb3a3]">
          Pro Cosmetics Admin Portal v1.0
        </p>
      </div>
    </div>
  );
}
