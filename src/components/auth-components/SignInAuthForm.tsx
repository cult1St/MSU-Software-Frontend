"use client";

import React, { useState } from "react";
import type { SubmitHandler } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import FormField from "../FormField";
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "../ui/button";
import { Form } from "../ui/form";
import { Home } from "lucide-react";
import Link from "next/link";
import { toast } from "react-toastify";
import authService from "@src/services/auth.service";
import { useAuth } from "@src/context/auth-context";
import { getApiErrorMessage } from "@src/utils/api-error";
import { canAccessRoute, homeRouteForRole } from "@src/utils/roles";

const authFormSchema = () => {
  return z.object({
    email: z.string().email(),
    password: z.string().min(3),
  });
};

function SignInAuthForm() {
  const [isPassword, setIsPassword] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();
  const formSchema = authFormSchema();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmitHandler: SubmitHandler<z.infer<typeof formSchema>> = async (
    data
  ) => {
    setIsSubmitting(true);
    try {
      await authService.login(data);
      await refreshUser();
      const user = authService.getStoredUser();
      toast.success("Signed in successfully");
      const next = searchParams.get("next");
      const home = homeRouteForRole(user?.role);
      if (next && canAccessRoute(user?.role, next)) {
        router.replace(next);
      } else {
        router.replace(home);
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to sign in"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 p-6 sm:p-8">
      <div className="space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-red">
          Staff Access
        </p>
        <h1 className="text-2xl font-bold text-ink">Welcome. Sign In</h1>
        <p className="text-xs text-surface-muted">
          Sign in with your staff email to open your station.
        </p>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmitHandler)}
          className="w-full space-y-5 mt-4 form"
        >
          <FormField
            label="Email"
            type="email"
            name="email"
            placeholder="Enter your email"
            cStyle=""
            control={form.control}
          />

          <FormField
            label="Password"
            type={isPassword ? "password" : "text"}
            name="password"
            isPassword={isPassword}
            handlePasswordView={() => setIsPassword(!isPassword)}
            placeholder="Enter your password"
            cStyle="w-full focus:outline-none"
            control={form.control}
          />

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-10 bg-[#172554] hover:bg-[#1e3a8a] text-white"
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </Button>

          <div className="flex flex-col justify-center items-center gap-3 pt-1">
            <p className="text-xs text-surface-muted text-center">
              Accounts are created by a Registrar in Administration.
            </p>
            <Link
              href="/"
              className="flex flex-col justify-center items-center text-surface-muted hover:text-ink transition-colors"
            >
              <Home className="size-6" />
              <p className="text-xs mt-1">Homepage</p>
            </Link>
          </div>
        </form>
      </Form>
    </div>
  );
}

export default SignInAuthForm;
