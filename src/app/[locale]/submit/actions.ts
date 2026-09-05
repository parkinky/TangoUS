"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { EventType } from "@/lib/events/queries";

type SubmitEventErrors = Partial<
  Record<
    | "title"
    | "type"
    | "startDate"
    | "city"
    | "state"
    | "nat"
    | "address"
    | "description",
    string
  >
>;

export type SubmitEventState =
  | {
      errors?: SubmitEventErrors;
      message?: string;
    }
  | undefined;

const EVENT_TYPES: EventType[] = ["event", "festival", "marathon", "milonga"];

export async function submitEvent(
  locale: string,
  _prevState: SubmitEventState,
  formData: FormData
): Promise<SubmitEventState> {
  const title = String(formData.get("title") ?? "").trim();
  const type = String(formData.get("type") ?? "");
  const startDate = String(formData.get("startDate") ?? "");
  const endDate = String(formData.get("endDate") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const state = String(formData.get("state") ?? "").trim();
  const nat = String(formData.get("nat") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const venue = String(formData.get("venue") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const websiteUrl = String(formData.get("websiteUrl") ?? "").trim();
  const price = String(formData.get("price") ?? "").trim();

  const errors: SubmitEventErrors = {};

  if (!title) errors.title = "제목을 입력해주세요.";
  if (!EVENT_TYPES.includes(type as EventType)) errors.type = "종류를 선택해주세요.";
  if (!startDate) errors.startDate = "날짜를 입력해주세요.";
  if (!city) errors.city = "도시를 입력해주세요.";
  if (!state) errors.state = "주(state)를 입력해주세요.";
  if (!nat) errors.nat = "국가를 선택해주세요.";
  if (!address) errors.address = "주소를 입력해주세요.";
  if (!description) errors.description = "설명을 입력해주세요.";

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { message: "로그인이 필요합니다." };
  }

  const { error } = await supabase.from("events").insert({
    type,
    city,
    state,
    nat,
    venue: venue || null,
    address,
    start_date: startDate,
    end_date: endDate || startDate,
    price: price || null,
    website_url: websiteUrl || null,
    title_ko: title,
    description_ko: description,
    source: "user_submitted",
    submitted_by: user.id,
    status: "pending",
  });

  if (error) {
    return { message: "이벤트 등록 중 오류가 발생했습니다. 다시 시도해주세요." };
  }

  redirect(`/${locale}/submit?submitted=1`);
}
