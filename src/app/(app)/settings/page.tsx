"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { LockKeyhole, Mail, Shield, User as UserIcon } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import type { User } from "@/types";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const profileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  email: z.string().email("Enter a valid email").max(256, "Email is too long"),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different",
    path: ["newPassword"],
  });

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-destructive">{message}</p>;
}

function SettingsCard({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-start gap-4 border-b border-border px-6 py-5">
        <div className="rounded-xl bg-primary/10 p-3 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="px-6 py-5">{children}</div>
    </section>
  );
}

export default function SettingsPage() {
  const { user, updateUser } = useAuth();

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    values: {
      name: user?.name ?? "",
      email: user?.email ?? "",
    },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const profileMutation = useMutation({
    mutationFn: (data: ProfileFormData) =>
      api.put<User>("/auth/me", data).then((response) => response.data),
    onSuccess: (updatedUser) => {
      updateUser(updatedUser);
      profileForm.reset(updatedUser);
      toast.success("Profile updated");
    },
    onError: () => toast.error("Failed to update profile"),
  });

  const passwordMutation = useMutation({
    mutationFn: (data: PasswordFormData) =>
      api.post("/auth/change-password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      }),
    onSuccess: () => {
      passwordForm.reset();
      toast.success("Password changed");
    },
    onError: () => toast.error("Current password is incorrect"),
  });

  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-col gap-4 rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 px-8 py-8 text-white lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-200">
            Account
          </p>
          <h1 className="mt-3 text-3xl font-bold">Settings</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-300">
            Keep your account details accurate and rotate your password without
            leaving the workspace.
          </p>
        </div>
        {user && (
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur px-5 py-4">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Signed In As</p>
            <p className="mt-2 text-lg font-semibold">{user.name}</p>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-300">
              <span>{user.email}</span>
              <span className="rounded-full bg-blue-500/20 px-3 py-1 text-xs font-medium text-blue-100">
                {user.role}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <SettingsCard
          title="Profile"
          description="Update the name and email attached to your account."
          icon={UserIcon}
        >
          <form
            onSubmit={profileForm.handleSubmit((data) => profileMutation.mutate(data))}
            className="space-y-5"
          >
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    {...profileForm.register("name")}
                    className="w-full rounded-xl border border-input bg-background px-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50"
                    placeholder="Your name"
                  />
                </div>
                <FieldError message={profileForm.formState.errors.name?.message} />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    {...profileForm.register("email")}
                    type="email"
                    className="w-full rounded-xl border border-input bg-background px-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50"
                    placeholder="you@company.com"
                  />
                </div>
                <FieldError message={profileForm.formState.errors.email?.message} />
              </div>
            </div>

            {profileMutation.error && (
              <p className="text-sm text-destructive">
                {(profileMutation.error as { response?: { data?: { error?: string; errors?: string[] } } })
                  ?.response?.data?.error
                  ?? (profileMutation.error as { response?: { data?: { errors?: string[] } } })
                    ?.response?.data?.errors?.[0]
                  ?? "Unable to update your profile."}
              </p>
            )}

            {profileMutation.isSuccess && !profileMutation.isPending && (
              <p className="text-sm text-green-600">Profile updated successfully.</p>
            )}

            <div className="flex justify-end">
              <Button type="submit" disabled={profileMutation.isPending || !user}>
                {profileMutation.isPending ? "Saving..." : "Save Profile"}
              </Button>
            </div>
          </form>
        </SettingsCard>

        <div className="space-y-6">
          <SettingsCard
            title="Security"
            description="Change your password using your current credentials."
            icon={LockKeyhole}
          >
            <form
              onSubmit={passwordForm.handleSubmit((data) => passwordMutation.mutate(data))}
              className="space-y-5"
            >
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Current Password
                </label>
                <input
                  {...passwordForm.register("currentPassword")}
                  type="password"
                  className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50"
                  placeholder="Current password"
                />
                <FieldError message={passwordForm.formState.errors.currentPassword?.message} />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  New Password
                </label>
                <input
                  {...passwordForm.register("newPassword")}
                  type="password"
                  className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50"
                  placeholder="At least 6 characters"
                />
                <FieldError message={passwordForm.formState.errors.newPassword?.message} />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Confirm New Password
                </label>
                <input
                  {...passwordForm.register("confirmPassword")}
                  type="password"
                  className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50"
                  placeholder="Repeat new password"
                />
                <FieldError message={passwordForm.formState.errors.confirmPassword?.message} />
              </div>

              {passwordMutation.error && (
                <p className="text-sm text-destructive">
                  {(passwordMutation.error as { response?: { data?: { error?: string; errors?: string[] } } })
                    ?.response?.data?.error
                    ?? (passwordMutation.error as { response?: { data?: { errors?: string[] } } })
                      ?.response?.data?.errors?.[0]
                    ?? "Unable to change your password."}
                </p>
              )}

              {passwordMutation.isSuccess && !passwordMutation.isPending && (
                <p className="text-sm text-emerald-600 dark:text-emerald-400">Password updated successfully.</p>
              )}

              <div className="flex justify-end">
                <Button type="submit" disabled={passwordMutation.isPending || !user}>
                  {passwordMutation.isPending ? "Updating..." : "Change Password"}
                </Button>
              </div>
            </form>
          </SettingsCard>

          <SettingsCard
            title="Access Snapshot"
            description="Quick reference for your role in the current environment."
            icon={Shield}
          >
            <div className="space-y-4 text-sm text-muted-foreground">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Current Role
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-900">
                  {user?.role ?? "Unknown"}
                </p>
              </div>
              <p>
                Role-based permissions remain managed by the backend authorization
                policies. This page is limited to self-service account maintenance.
              </p>
            </div>
          </SettingsCard>
        </div>
      </div>
    </div>
  );
}
