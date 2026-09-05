"use server";

import { cookies } from "next/headers";
import { CITY_COOKIE } from "./city-context";

export async function setCityFilter(formData: FormData) {
  const value = String(formData.get("city") ?? "");
  const cookieStore = await cookies();

  if (!value) {
    cookieStore.delete(CITY_COOKIE);
    return;
  }

  cookieStore.set(CITY_COOKIE, value, {
    path: "/",
    maxAge: 60 * 60 * 24 * 180,
  });
}
