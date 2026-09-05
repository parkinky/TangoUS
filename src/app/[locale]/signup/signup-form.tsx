"use client";

import { useActionState, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { signup, type SignupState } from "./actions";

const STEP1_FIELDS = ["username", "email", "password"] as const;
const STEP2_FIELDS = [
  "address",
  "phoneNumber",
  "name",
  "gender",
  "tangoRole",
] as const;

const inputClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-black shadow-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";
const labelClass =
  "block text-sm font-medium text-zinc-700 dark:text-zinc-300";
const errorClass = "text-sm text-red-600 dark:text-red-400";

export default function SignupForm() {
  const t = useTranslations("Auth.signup");
  const params = useParams<{ locale: string }>();
  const locale = params.locale;

  const [step, setStep] = useState(1);
  const [state, formAction, pending] = useActionState<SignupState, FormData>(
    signup.bind(null, locale),
    undefined
  );

  // Jump to whichever step holds the first field error returned by the
  // last submission. Guarded against `state` so this only runs once per
  // new action result, not on every render (see: adjusting state when
  // props change, https://react.dev/learn/you-might-not-need-an-effect).
  const [handledErrors, setHandledErrors] = useState(state?.errors);
  if (state?.errors !== handledErrors) {
    setHandledErrors(state?.errors);
    if (state?.errors) {
      const firstErrorField = Object.keys(state.errors)[0];
      if ((STEP1_FIELDS as readonly string[]).includes(firstErrorField)) {
        setStep(1);
      } else if ((STEP2_FIELDS as readonly string[]).includes(firstErrorField)) {
        setStep(2);
      } else {
        setStep(3);
      }
    }
  }

  return (
    <form action={formAction} className="w-full max-w-md space-y-6">
      <ol className="flex items-center justify-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
        {[1, 2, 3].map((s) => (
          <li
            key={s}
            className={
              s === step
                ? "font-semibold text-black dark:text-zinc-50"
                : undefined
            }
          >
            {s}. {t(`step${s}` as "step1" | "step2" | "step3")}
          </li>
        ))}
      </ol>

      <div hidden={step !== 1} className="space-y-4">
        <div>
          <label htmlFor="username" className={labelClass}>
            {t("username")}
          </label>
          <input id="username" name="username" className={inputClass} />
          {state?.errors?.username && (
            <p className={errorClass}>{state.errors.username}</p>
          )}
        </div>
        <div>
          <label htmlFor="email" className={labelClass}>
            {t("email")}
          </label>
          <input id="email" name="email" type="email" className={inputClass} />
          {state?.errors?.email && (
            <p className={errorClass}>{state.errors.email}</p>
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
      </div>

      <div hidden={step !== 2} className="space-y-4">
        <div>
          <label htmlFor="address" className={labelClass}>
            {t("address")}
          </label>
          <input id="address" name="address" className={inputClass} />
          {state?.errors?.address && (
            <p className={errorClass}>{state.errors.address}</p>
          )}
        </div>
        <div>
          <label htmlFor="phoneNumber" className={labelClass}>
            {t("phoneNumber")}
          </label>
          <input
            id="phoneNumber"
            name="phoneNumber"
            type="tel"
            className={inputClass}
          />
          {state?.errors?.phoneNumber && (
            <p className={errorClass}>{state.errors.phoneNumber}</p>
          )}
        </div>
        <div>
          <label htmlFor="name" className={labelClass}>
            {t("name")}
          </label>
          <input id="name" name="name" className={inputClass} />
          {state?.errors?.name && (
            <p className={errorClass}>{state.errors.name}</p>
          )}
        </div>
        <div>
          <span className={labelClass}>{t("gender")}</span>
          <div className="mt-1 flex gap-4 text-sm text-zinc-700 dark:text-zinc-300">
            {(["male", "female", "other"] as const).map((value) => (
              <label key={value} className="flex items-center gap-1.5">
                <input type="radio" name="gender" value={value} />
                {t(`genderOptions.${value}`)}
              </label>
            ))}
          </div>
          {state?.errors?.gender && (
            <p className={errorClass}>{state.errors.gender}</p>
          )}
        </div>
        <div>
          <span className={labelClass}>{t("tangoRole")}</span>
          <div className="mt-1 flex gap-4 text-sm text-zinc-700 dark:text-zinc-300">
            {(["leader", "follower"] as const).map((value) => (
              <label key={value} className="flex items-center gap-1.5">
                <input type="radio" name="tangoRole" value={value} />
                {t(`tangoRoleOptions.${value}`)}
              </label>
            ))}
          </div>
          {state?.errors?.tangoRole && (
            <p className={errorClass}>{state.errors.tangoRole}</p>
          )}
        </div>
      </div>

      <div hidden={step !== 3} className="space-y-4">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {t("hintIntro")}
        </p>
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2 rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
            <div>
              <label htmlFor={`hint_question_${i}`} className={labelClass}>
                {t("hintQuestion", { index: i })}
              </label>
              <input
                id={`hint_question_${i}`}
                name={`hint_question_${i}`}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor={`hint_answer_${i}`} className={labelClass}>
                {t("hintAnswer", { index: i })}
              </label>
              <input
                id={`hint_answer_${i}`}
                name={`hint_answer_${i}`}
                className={inputClass}
              />
            </div>
          </div>
        ))}
        {state?.errors?.hints && <p className={errorClass}>{state.errors.hints}</p>}
      </div>

      {state?.message && <p className={errorClass}>{state.message}</p>}

      <div className="flex items-center justify-between gap-3">
        {step > 1 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
          >
            {t("back")}
          </button>
        ) : (
          <span />
        )}

        {step < 3 ? (
          <button
            key="next"
            type="button"
            onClick={() => setStep((s) => s + 1)}
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white dark:bg-zinc-50 dark:text-black"
          >
            {t("next")}
          </button>
        ) : (
          <button
            key="submit"
            type="submit"
            disabled={pending}
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-black"
          >
            {pending ? t("submitting") : t("submit")}
          </button>
        )}
      </div>

      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        {t("haveAccount")}{" "}
        <Link href="/login" className="font-medium underline">
          {t("loginLink")}
        </Link>
      </p>
    </form>
  );
}
