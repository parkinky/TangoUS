"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { verifySecurityAnswer } from "@/lib/security-hints";
import { createRecoveryToken, verifyRecoveryToken } from "@/lib/auth/recovery-token";

const NOT_FOUND_MESSAGE = "일치하는 계정을 찾을 수 없습니다.";
const EXPIRED_MESSAGE = "요청이 만료되었습니다. 처음부터 다시 시도해주세요.";

export type LookupState =
  | {
      questions?: [string, string, string];
      token?: string;
      message?: string;
    }
  | undefined;

export async function lookupHints(
  _prevState: LookupState,
  formData: FormData
): Promise<LookupState> {
  const identifier = String(formData.get("identifier") ?? "").trim();
  if (!identifier) {
    return { message: "아이디 또는 이메일을 입력해주세요." };
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq(identifier.includes("@") ? "email" : "username", identifier)
    .maybeSingle();

  if (!profile) {
    return { message: NOT_FOUND_MESSAGE };
  }

  const { data: hints } = await admin
    .from("security_hints")
    .select("hint_question_1, hint_question_2, hint_question_3")
    .eq("user_id", profile.id)
    .maybeSingle();

  if (!hints) {
    return { message: NOT_FOUND_MESSAGE };
  }

  return {
    questions: [
      hints.hint_question_1,
      hints.hint_question_2,
      hints.hint_question_3,
    ],
    token: createRecoveryToken(profile.id, "answer"),
  };
}

export type VerifyState =
  | {
      verified?: boolean;
      username?: string;
      resetToken?: string;
      message?: string;
    }
  | undefined;

export async function verifyHints(
  _prevState: VerifyState,
  formData: FormData
): Promise<VerifyState> {
  const token = String(formData.get("token") ?? "");
  const userId = verifyRecoveryToken(token, "answer");
  if (!userId) {
    return { message: EXPIRED_MESSAGE };
  }

  const admin = createAdminClient();
  const { data: hints } = await admin
    .from("security_hints")
    .select("hint_answer_1, hint_answer_2, hint_answer_3")
    .eq("user_id", userId)
    .maybeSingle();

  if (!hints) {
    return { message: EXPIRED_MESSAGE };
  }

  const answers = [1, 2, 3].map((i) =>
    String(formData.get(`answer_${i}`) ?? "")
  );

  const allMatch =
    verifySecurityAnswer(answers[0], hints.hint_answer_1) &&
    verifySecurityAnswer(answers[1], hints.hint_answer_2) &&
    verifySecurityAnswer(answers[2], hints.hint_answer_3);

  if (!allMatch) {
    return { message: "답변이 일치하지 않습니다." };
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("username")
    .eq("id", userId)
    .maybeSingle();

  return {
    verified: true,
    username: profile?.username ?? "",
    resetToken: createRecoveryToken(userId, "reset"),
  };
}

export type ResetState =
  | {
      success?: boolean;
      message?: string;
    }
  | undefined;

export async function resetPassword(
  _prevState: ResetState,
  formData: FormData
): Promise<ResetState> {
  const token = String(formData.get("resetToken") ?? "");
  const userId = verifyRecoveryToken(token, "reset");
  if (!userId) {
    return { message: EXPIRED_MESSAGE };
  }

  const password = String(formData.get("password") ?? "");
  if (password.length < 8) {
    return { message: "비밀번호는 8자 이상이어야 합니다." };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, {
    password,
  });

  if (error) {
    return { message: "비밀번호 변경 중 오류가 발생했습니다. 다시 시도해주세요." };
  }

  return { success: true };
}
