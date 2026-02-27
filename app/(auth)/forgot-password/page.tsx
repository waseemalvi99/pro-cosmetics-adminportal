"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2, Mail, CheckCircle2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/lib/api/auth";

const forgotSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotForm = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (data: ForgotForm) => {
    try {
      await authApi.forgotPassword({ email: data.email });
      setSubmittedEmail(data.email);
      setSent(true);
    } catch {
      toast.error("Something went wrong", {
        description: "Unable to process your request. Please try again.",
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
              <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#c8a97e]">Account Recovery</span>
            </div>
            <h2 className="font-display text-4xl font-bold leading-[1.15] tracking-tight text-white">
              Don&apos;t worry,
              <br />
              <span className="bg-gradient-to-r from-[#c8a97e] to-[#e8d5b5] bg-clip-text text-transparent">
                we&apos;ve got you
              </span>
            </h2>
            <p className="mt-5 text-[15px] leading-relaxed text-[#9a8e7e]">
              Happens to the best of us. We&apos;ll send a reset code to your email so you can get back to managing your business in no time.
            </p>

            <div className="mt-10 space-y-4">
              {["Check your inbox for a reset code", "Use the code to set a new password", "Back in business in under a minute"].map((step) => (
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

          {sent ? (
            <div className="text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 ring-1 ring-emerald-100">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              </div>
              <h1 className="font-display text-[28px] font-bold tracking-tight text-[#2d2316]">Check your email</h1>
              <p className="mt-3 text-[14px] leading-relaxed text-[#8a7a68]">
                We&apos;ve sent a password reset code to <span className="font-medium text-[#2d2316]">{submittedEmail}</span>. Check your inbox and use the code to reset your password.
              </p>
              <div className="mt-8 space-y-3">
                <Button asChild className="h-11 w-full rounded-xl bg-gradient-to-r from-[#c8a97e] to-[#b8956a] text-[13px] font-semibold text-white shadow-lg shadow-[#c8a97e]/25 transition-all hover:from-[#b8956a] hover:to-[#a8855a] hover:shadow-[#c8a97e]/40">
                  <Link href="/reset-password">Enter Reset Code</Link>
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setSent(false)}
                  className="h-10 w-full rounded-xl text-[13px] text-[#8a7a68] hover:text-[#2d2316]"
                >
                  Didn&apos;t receive it? Send again
                </Button>
              </div>
              <Link
                href="/login"
                className="mt-6 inline-flex items-center gap-1.5 text-[13px] text-[#8a7a68] transition-colors hover:text-[#2d2316]"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#c8a97e]/10 ring-1 ring-[#c8a97e]/20">
                  <Mail className="h-5 w-5 text-[#c8a97e]" />
                </div>
                <h1 className="font-display text-[28px] font-bold tracking-tight text-[#2d2316]">Forgot password?</h1>
                <p className="mt-2 text-[14px] text-[#8a7a68]">
                  No worries. Enter your email and we&apos;ll send you a reset code.
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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

                <div className="pt-1">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-11 w-full rounded-xl bg-gradient-to-r from-[#c8a97e] to-[#b8956a] text-[13px] font-semibold text-white shadow-lg shadow-[#c8a97e]/25 transition-all hover:from-[#b8956a] hover:to-[#a8855a] hover:shadow-[#c8a97e]/40 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Send Reset Code"
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
