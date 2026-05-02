"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import type { AuthResponse } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/auth-context";
import { Receipt, Eye, EyeOff } from "lucide-react";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password required"),
});

type LoginForm = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(schema) });

  const loginMutation = useMutation({
    mutationFn: (data: LoginForm) =>
      api.post<AuthResponse>("/auth/login", data).then((r) => r.data),
    onSuccess: (data) => {
      login(data.user);
      router.push("/dashboard");
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">
      <div className="w-full max-w-md space-y-8 px-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center rounded-2xl bg-primary p-3 mb-4 shadow-lg">
            <Receipt className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-extrabold text-foreground tracking-tight">Invoicely</h1>
          <p className="mt-2 text-base text-muted-foreground">Sign in to your account</p>
        </div>

        <form
          onSubmit={handleSubmit((d) => loginMutation.mutate(d))}
          className="space-y-6 bg-card p-8 rounded-2xl shadow-lg ring-1 ring-black/5"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Email
              </label>
              <Input
                {...register("email")}
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Password
              </label>
              <Input
                {...register("password")}
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                endAdornment={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              />
              {errors.password && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>
          </div>

          {loginMutation.error && (
            <p className="text-sm text-destructive text-center">
              Invalid email or password
            </p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? "Signing in..." : "Sign in"}
          </Button>

          <div className="border-t border-border pt-4">
            <p className="text-xs text-muted-foreground text-center mb-3">Demo credentials</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl border border-border bg-muted/50 px-3 py-2.5">
                <p className="font-semibold text-foreground mb-1">Admin</p>
                <p className="text-muted-foreground">admin@invoicely.com</p>
                <p className="text-muted-foreground">admin123</p>
              </div>
              <div className="rounded-xl border border-border bg-muted/50 px-3 py-2.5">
                <p className="font-semibold text-foreground mb-1">Finance Manager</p>
                <p className="text-muted-foreground">finance@invoicely.com</p>
                <p className="text-muted-foreground">finance123</p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
