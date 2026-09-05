"use client";

import { useActionState } from "react";
import { useParams } from "next/navigation";
import { EVENT_TYPE_LABELS } from "@/lib/events/labels";
import { submitEvent, type SubmitEventState } from "./actions";

const inputClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-black shadow-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";
const labelClass =
  "block text-sm font-medium text-zinc-700 dark:text-zinc-300";
const errorClass = "text-sm text-red-600 dark:text-red-400";

export default function SubmitForm() {
  const params = useParams<{ locale: string }>();
  const locale = params.locale;

  const [state, formAction, pending] = useActionState<
    SubmitEventState,
    FormData
  >(submitEvent.bind(null, locale), undefined);

  return (
    <form action={formAction} className="w-full max-w-lg space-y-4">
      <div>
        <label htmlFor="title" className={labelClass}>
          제목
        </label>
        <input id="title" name="title" className={inputClass} />
        {state?.errors?.title && (
          <p className={errorClass}>{state.errors.title}</p>
        )}
      </div>

      <div>
        <label htmlFor="type" className={labelClass}>
          종류
        </label>
        <select id="type" name="type" defaultValue="" className={inputClass}>
          <option value="" disabled>
            선택하세요
          </option>
          {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {state?.errors?.type && (
          <p className={errorClass}>{state.errors.type}</p>
        )}
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <label htmlFor="startDate" className={labelClass}>
            시작일
          </label>
          <input
            id="startDate"
            name="startDate"
            type="date"
            className={inputClass}
          />
          {state?.errors?.startDate && (
            <p className={errorClass}>{state.errors.startDate}</p>
          )}
        </div>
        <div className="flex-1">
          <label htmlFor="endDate" className={labelClass}>
            종료일 (선택, 여러 날짜 행사인 경우)
          </label>
          <input
            id="endDate"
            name="endDate"
            type="date"
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <label htmlFor="city" className={labelClass}>
            도시
          </label>
          <input id="city" name="city" className={inputClass} />
          {state?.errors?.city && (
            <p className={errorClass}>{state.errors.city}</p>
          )}
        </div>
        <div className="w-28">
          <label htmlFor="state" className={labelClass}>
            주(State)
          </label>
          <input id="state" name="state" className={inputClass} />
          {state?.errors?.state && (
            <p className={errorClass}>{state.errors.state}</p>
          )}
        </div>
        <div className="w-24">
          <label htmlFor="nat" className={labelClass}>
            국가(NAT)
          </label>
          <select id="nat" name="nat" defaultValue="US" className={inputClass}>
            <option value="US">US</option>
            <option value="CA">CA</option>
          </select>
          {state?.errors?.nat && (
            <p className={errorClass}>{state.errors.nat}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="address" className={labelClass}>
          주소
        </label>
        <input id="address" name="address" className={inputClass} />
        {state?.errors?.address && (
          <p className={errorClass}>{state.errors.address}</p>
        )}
      </div>

      <div>
        <label htmlFor="venue" className={labelClass}>
          장소명 (선택)
        </label>
        <input id="venue" name="venue" className={inputClass} />
      </div>

      <div>
        <label htmlFor="description" className={labelClass}>
          설명
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          className={inputClass}
        />
        {state?.errors?.description && (
          <p className={errorClass}>{state.errors.description}</p>
        )}
      </div>

      <div>
        <label htmlFor="websiteUrl" className={labelClass}>
          웹사이트 URL (선택)
        </label>
        <input
          id="websiteUrl"
          name="websiteUrl"
          type="url"
          placeholder="https://"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="price" className={labelClass}>
          가격 (선택)
        </label>
        <input id="price" name="price" placeholder="$15 또는 무료" className={inputClass} />
      </div>

      {state?.message && <p className={errorClass}>{state.message}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-black"
      >
        {pending ? "등록 중..." : "이벤트 등록하기"}
      </button>

      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        등록한 이벤트는 관리자 승인 후 목록에 표시됩니다.
      </p>
    </form>
  );
}
