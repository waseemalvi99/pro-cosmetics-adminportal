"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import { Eye, EyeOff, Loader2, Sparkles } from "lucide-react";
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
    <div className="flex min-h-screen">
      {/* Left Panel — Brand */}
      <div className="relative hidden w-1/2 overflow-hidden lg:block">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1c1814] via-[#2a2118] to-[#1a1510]" />

        {/* Decorative golden orbs */}
        <div className="absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-[#c8a97e]/8 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full bg-[#c8a97e]/10 blur-[140px]" />
        <div className="absolute top-1/3 right-1/4 h-[300px] w-[300px] rounded-full bg-[#c8a97e]/5 blur-[100px]" />

        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(200,169,126,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(200,169,126,0.5) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />

        {/* Diagonal gold accent line */}
        <div className="absolute top-0 left-[45%] h-full w-px bg-gradient-to-b from-transparent via-[#c8a97e]/20 to-transparent rotate-12 origin-top" />

        {/* Content */}
        <div className="relative z-10 flex h-full flex-col justify-between p-12">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-white/10 ring-1 ring-white/10 backdrop-blur-sm">
              <Image
                src="/logo.png"
                alt="Pro Cosmetics"
                width={30}
                height={30}
                className="object-contain"
                priority
              />
            </div>
            <span className="text-sm font-semibold tracking-wide text-[#e8dcc8]">
              Pro Cosmetics
            </span>
          </div>

          {/* Hero text */}
          <div className="max-w-md">
            <div className="mb-6 flex items-center gap-2">
              <div className="h-px w-8 bg-gradient-to-r from-[#c8a97e] to-transparent" />
              <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#c8a97e]">
                Admin Portal
              </span>
            </div>
            <h2 className="font-display text-4xl font-bold leading-[1.15] tracking-tight text-white">
              Manage your
              <br />
              <span className="bg-gradient-to-r from-[#c8a97e] to-[#e8d5b5] bg-clip-text text-transparent">
                beauty empire
              </span>
            </h2>
            <p className="mt-5 text-[15px] leading-relaxed text-[#9a8e7e]">
              Streamline inventory, sales, and deliveries with a powerful
              management system built for cosmetics professionals.
            </p>

            {/* Feature highlights */}
            <div className="mt-10 space-y-4">
              {[
                "Real-time inventory tracking",
                "Comprehensive sales analytics",
                "Delivery management & tracking",
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#c8a97e]/10 ring-1 ring-[#c8a97e]/20">
                    <Sparkles className="h-3 w-3 text-[#c8a97e]" />
                  </div>
                  <span className="text-sm text-[#b0a494]">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <p className="text-[11px] text-[#5a5045]">
            &copy; {new Date().getFullYear()} Pro Cosmetics. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="relative flex w-full items-center justify-center lg:w-1/2">
        <div className="absolute inset-0 bg-gradient-to-br from-[#fdf8f0] via-[#fefcf8] to-[#f8f0e5]" />
        <div className="absolute top-0 right-0 h-[400px] w-[400px] rounded-full bg-[#c8a97e]/6 blur-[100px]" />
        <div className="absolute bottom-0 left-0 h-[300px] w-[300px] rounded-full bg-[#c8a97e]/4 blur-[80px]" />

        <div className="relative z-10 w-full max-w-[400px] px-8">
          {/* Mobile logo (hidden on desktop) */}
          <div className="mb-10 flex flex-col items-center lg:hidden">
            <div className="mb-4 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-lg shadow-black/5 ring-1 ring-black/5">
              <Image
                src="/logo.png"
                alt="Pro Cosmetics"
                width={44}
                height={44}
                className="object-contain"
                priority
              />
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-[#2d2316]">
              Pro Cosmetics
            </h1>
          </div>

          {/* Welcome text */}
          <div className="mb-8">
            <h1 className="font-display text-[28px] font-bold tracking-tight text-[#2d2316]">
              Welcome back
            </h1>
            <p className="mt-2 text-[14px] text-[#8a7a68]">
              Enter your credentials to access the admin portal
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[13px] font-medium text-[#4a3f35]">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@procosmetics.com"
                className="h-11 rounded-xl border-[#e5ddd0] bg-white/70 text-[#2d2316] shadow-sm placeholder:text-[#c5b9a8] focus-visible:border-[#c8a97e] focus-visible:ring-[#c8a97e]/20"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-[13px] font-medium text-[#4a3f35]">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="h-11 rounded-xl border-[#e5ddd0] bg-white/70 pr-10 text-[#2d2316] shadow-sm placeholder:text-[#c5b9a8] focus-visible:border-[#c8a97e] focus-visible:ring-[#c8a97e]/20"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#c5b9a8] transition-colors hover:text-[#8a7a68]"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500">{errors.password.message}</p>
              )}
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
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </div>
          </form>

          <p className="mt-10 text-center text-[11px] text-[#c5b9a8] lg:hidden">
            Pro Cosmetics Admin Portal v1.0
          </p>
        </div>
      </div>
    </div>
  );
}
