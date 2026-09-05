"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateLogin } from "@/lib/auth/validation";

export type LoginState =
  | {
      errors?: Partial<Record<"identifier" | "password", string>>;
      message?: string;
    }
  | undefined;

const INVALID_CREDENTIALS_MESSAGE =
  "아이디/이메일 또는 비밀번호가 올바르지 않습니다.";

export async function login(
  locale: string,
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const identifier = String(formData.get("identifier") ?? "");
  const password = String(formData.get("password") ?? "");

  const errors = validateLogin(identifier, password);
  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  let email = identifier;

  if (!identifier.includes("@")) {
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("email")
      .eq("username", identifier)
      .maybeSingle();

    if (!profile?.email) {
      return { message: INVALID_CREDENTIALS_MESSAGE };
    }
    email = profile.email;
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { message: INVALID_CREDENTIALS_MESSAGE };
  }

  redirect(`/${locale}`);
}
