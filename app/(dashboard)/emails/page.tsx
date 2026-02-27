"use client";

import { useState, useRef, type KeyboardEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Send, X, Loader2 } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { emailsApi } from "@/lib/api/emails";

const sendEmailSchema = z.object({
  to: z
    .array(z.string().email("Invalid email address"))
    .min(1, "At least one recipient is required"),
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Body is required"),
});

type SendEmailFormValues = z.infer<typeof sendEmailSchema>;

export default function SendEmailPage() {
  const [emailInput, setEmailInput] = useState("");
  const emailInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<SendEmailFormValues>({
    resolver: zodResolver(sendEmailSchema),
    defaultValues: { to: [], subject: "", body: "" },
  });

  const recipients = watch("to");

  const mutation = useMutation({
    mutationFn: emailsApi.send,
    onSuccess: () => {
      toast.success("Email sent successfully");
      reset({ to: [], subject: "", body: "" });
      setEmailInput("");
    },
    onError: (error: Error & { message?: string }) => {
      toast.error(error.message || "Failed to send email");
    },
  });

  const addEmail = (raw: string) => {
    const email = raw.trim().toLowerCase();
    if (!email) return;

    const result = z.string().email().safeParse(email);
    if (!result.success) {
      toast.error(`Invalid email address: ${email}`);
      return;
    }

    if (recipients.includes(email)) {
      toast.error("Email already added");
      return;
    }

    setValue("to", [...recipients, email], { shouldValidate: true });
    setEmailInput("");
  };

  const removeEmail = (email: string) => {
    setValue(
      "to",
      recipients.filter((e) => e !== email),
      { shouldValidate: true }
    );
  };

  const handleEmailKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "," || e.key === "Tab") {
      e.preventDefault();
      addEmail(emailInput);
    }
    if (e.key === "Backspace" && !emailInput && recipients.length > 0) {
      removeEmail(recipients[recipients.length - 1]);
    }
  };

  const handleEmailPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text");
    const emails = pasted.split(/[,;\s]+/).filter(Boolean);
    for (const email of emails) {
      addEmail(email);
    }
  };

  const onSubmit = (data: SendEmailFormValues) => {
    mutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Send Email"
        description="Compose and send an email to one or more recipients"
      />

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="to">Recipients</Label>
              <div
                className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-md border border-input bg-transparent px-3 py-2 shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50"
                onClick={() => emailInputRef.current?.focus()}
              >
                {recipients.map((email) => (
                  <Badge
                    key={email}
                    variant="secondary"
                    className="gap-1 pr-1"
                  >
                    {email}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeEmail(email);
                      }}
                      className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                <input
                  ref={emailInputRef}
                  type="text"
                  id="to"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyDown={handleEmailKeyDown}
                  onPaste={handleEmailPaste}
                  onBlur={() => {
                    if (emailInput.trim()) addEmail(emailInput);
                  }}
                  placeholder={
                    recipients.length === 0 ? "Type email and press Enter" : ""
                  }
                  className="min-w-[200px] flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>
              {errors.to && (
                <p className="text-sm text-destructive">{errors.to.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="Email subject"
                {...register("subject")}
                aria-invalid={!!errors.subject}
              />
              {errors.subject && (
                <p className="text-sm text-destructive">
                  {errors.subject.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="body">Body</Label>
              <Textarea
                id="body"
                placeholder="Write your email content here..."
                className="min-h-[200px]"
                {...register("body")}
                aria-invalid={!!errors.body}
              />
              <p className="text-xs text-muted-foreground">
                The content will be wrapped in a branded email template
                automatically.
              </p>
              {errors.body && (
                <p className="text-sm text-destructive">
                  {errors.body.message}
                </p>
              )}
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Email
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
