"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getAdminUser } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";

async function updateStatus(
  locale: string,
  formData: FormData,
  status: "approved" | "rejected"
) {
  const admin = await getAdminUser();
  if (!admin) return;

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = createAdminClient();
  await supabase.from("events").update({ status }).eq("id", id);

  revalidatePath(`/${locale}/admin`);
  redirect(`/${locale}/admin`);
}

export async function approveEvent(locale: string, formData: FormData) {
  await updateStatus(locale, formData, "approved");
}

export async function rejectEvent(locale: string, formData: FormData) {
  await updateStatus(locale, formData, "rejected");
}
