"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  lookupHints,
  verifyHints,
  resetPassword,
  type LookupState,
  type VerifyState,
  type ResetState,
} from "./actions";

const inputClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-black shadow-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";
const labelClass =
  "block text-sm font-medium text-zinc-700 dark:text-zinc-300";
const errorClass = "text-sm text-red-600 dark:text-red-400";
const buttonClass =
  "w-full rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-black";

export default function FindAccountForm() {
  const t = useTranslations("Auth.findAccount");

  const [lookupState, lookupAction, lookupPending] = useActionState<
    LookupState,
    FormData
  >(lookupHints, undefined);
  const [verifyState, verifyAction, verifyPending] = useActionState<
    VerifyState,
    FormData
  >(verifyHints, undefined);
  const [resetState, resetActionFn, resetPending] = useActionState<
    ResetState,
    FormData
  >(resetPassword, undefined);

  const phase = resetState?.success
    ? "done"
    : verifyState?.verified
      ? "reset"
      : lookupState?.questions
        ? "answer"
        : "lookup";

  if (phase === "lookup") {
    return (
      <form action={lookupAction} className="w-full max-w-md space-y-4">
        <div>
          <label htmlFor="identifier" className={labelClass}>
            {t("identifier")}
          </label>
          <input id="identifier" name="identifier" className={inputClass} />
        </div>
        {lookupState?.message && (
          <p className={errorClass}>{lookupState.message}</p>
        )}
        <button type="submit" disabled={lookupPending} className={buttonClass}>
          {lookupPending ? t("submitting") : t("next")}
        </button>
        <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
          <Link href="/login" className="font-medium underline">
            {t("backToLogin")}
          </Link>
        </p>
      </form>
    );
  }

  if (phase === "answer") {
    return (
      <form action={verifyAction} className="w-full max-w-md space-y-4">
        <input type="hidden" name="token" value={lookupState?.token} />
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {t("answerIntro")}
        </p>
        {lookupState?.questions?.map((question, i) => (
          <div key={i}>
            <label className={labelClass}>{question}</label>
            <input name={`answer_${i + 1}`} className={inputClass} />
          </div>
        ))}
        {verifyState?.message && (
          <p className={errorClass}>{verifyState.message}</p>
        )}
        <button type="submit" disabled={verifyPending} className={buttonClass}>
          {verifyPending ? t("submitting") : t("verify")}
        </button>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="w-full text-center text-sm text-zinc-600 underline dark:text-zinc-400"
        >
          {t("startOver")}
        </button>
      </form>
    );
  }

  if (phase === "reset") {
    return (
      <div className="w-full max-w-md space-y-6">
        <div className="rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
          <p className={labelClass}>{t("usernameLabel")}</p>
          <p className="text-lg font-semibold text-black dark:text-zinc-50">
            {verifyState?.username}
          </p>
        </div>

        <form action={resetActionFn} className="space-y-4">
          <input
            type="hidden"
            name="resetToken"
            value={verifyState?.resetToken}
          />
          <div>
            <label htmlFor="password" className={labelClass}>
              {t("newPassword")}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              className={inputClass}
            />
          </div>
          {resetState?.message && (
            <p className={errorClass}>{resetState.message}</p>
          )}
          <button
            type="submit"
            disabled={resetPending}
            className={buttonClass}
          >
            {resetPending ? t("submitting") : t("resetPassword")}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-4 text-center">
      <p className="text-black dark:text-zinc-50">{t("resetSuccess")}</p>
      <Link
        href="/login"
        className="inline-block rounded-md bg-black px-4 py-2 text-sm font-medium text-white dark:bg-zinc-50 dark:text-black"
      >
        {t("backToLogin")}
      </Link>
    </div>
  );
}
