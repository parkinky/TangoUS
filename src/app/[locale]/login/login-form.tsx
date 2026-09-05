"use client";

import { useActionState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { login, type LoginState } from "./actions";

const inputClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-black shadow-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";
const labelClass =
  "block text-sm font-medium text-zinc-700 dark:text-zinc-300";
const errorClass = "text-sm text-red-600 dark:text-red-400";

export default function LoginForm() {
  const t = useTranslations("Auth.login");
  const params = useParams<{ locale: string }>();
  const locale = params.locale;

  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    login.bind(null, locale),
    undefined
  );

  return (
    <form action={formAction} className="w-full max-w-md space-y-4">
      <div>
        <label htmlFor="identifier" className={labelClass}>
          {t("identifier")}
        </label>
        <input id="identifier" name="identifier" className={inputClass} />
        {state?.errors?.identifier && (
          <p className={errorClass}>{state.errors.identifier}</p>
        )}
      </div>
      <div>
        <label htmlFor="password" className={labelClass}>
          {t("password")}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          className={inputClass}
        />
        {state?.errors?.password && (
          <p className={errorClass}>{state.errors.password}</p>
        )}
      </div>

      {state?.message && <p className={errorClass}>{state.message}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-black"
      >
        {pending ? t("submitting") : t("submit")}
      </button>

      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        {t("noAccount")}{" "}
        <Link href="/signup" className="font-medium underline">
          {t("signupLink")}
        </Link>
      </p>
    </form>
  );
}
