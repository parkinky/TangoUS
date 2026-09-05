"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hashSecurityAnswer } from "@/lib/security-hints";
import { validateSignup, type SignupFieldErrors } from "@/lib/auth/validation";

export type SignupState =
  | {
      errors?: SignupFieldErrors;
      message?: string;
    }
  | undefined;

export async function signup(
  locale: string,
  _prevState: SignupState,
  formData: FormData
): Promise<SignupState> {
  const input = {
    username: String(formData.get("username") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    address: String(formData.get("address") ?? ""),
    phoneNumber: String(formData.get("phoneNumber") ?? ""),
    name: String(formData.get("name") ?? ""),
    gender: String(formData.get("gender") ?? ""),
    tangoRole: String(formData.get("tangoRole") ?? ""),
    hints: [1, 2, 3].map((i) => ({
      question: String(formData.get(`hint_question_${i}`) ?? ""),
      answer: String(formData.get(`hint_answer_${i}`) ?? ""),
    })),
  };

  const errors = validateSignup(input);
  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  const admin = createAdminClient();

  const { data: existingUsername } = await admin
    .from("profiles")
    .select("id")
    .eq("username", input.username)
    .maybeSingle();

  if (existingUsername) {
    return { errors: { username: "이미 사용 중인 아이디입니다." } };
  }

  // Create the auth user directly via the admin API (email pre-confirmed).
  // This app has no email-confirmation flow, so going through the regular
  // signUp() call would only add an unnecessary confirmation email (and
  // Supabase's default mailer has a very low rate limit).
  const { data: createdUser, error: createError } =
    await admin.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
    });

  if (createError || !createdUser.user) {
    return {
      message:
        createError?.code === "email_exists"
          ? "이미 가입된 이메일입니다."
          : "회원가입 중 오류가 발생했습니다. 다시 시도해주세요.",
    };
  }

  const userId = createdUser.user.id;

  const { error: profileError } = await admin.from("profiles").insert({
    id: userId,
    username: input.username,
    email: input.email,
    address: input.address,
    phone_number: input.phoneNumber,
    name: input.name,
    gender: input.gender,
    tango_role: input.tangoRole,
  });

  if (profileError) {
    await admin.auth.admin.deleteUser(userId);
    return {
      message: "회원가입 중 오류가 발생했습니다. 다시 시도해주세요.",
    };
  }

  const { error: hintsError } = await admin.from("security_hints").insert({
    user_id: userId,
    hint_question_1: input.hints[0].question,
    hint_answer_1: hashSecurityAnswer(input.hints[0].answer),
    hint_question_2: input.hints[1].question,
    hint_answer_2: hashSecurityAnswer(input.hints[1].answer),
    hint_question_3: input.hints[2].question,
    hint_answer_3: hashSecurityAnswer(input.hints[2].answer),
  });

  if (hintsError) {
    await admin.from("profiles").delete().eq("id", userId);
    await admin.auth.admin.deleteUser(userId);
    return {
      message: "회원가입 중 오류가 발생했습니다. 다시 시도해주세요.",
    };
  }

  const supabase = await createClient();
  await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });

  redirect(`/${locale}`);
}
