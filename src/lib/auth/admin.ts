import { createClient } from "@/lib/supabase/server";

// A single hard-coded admin, identified by email via env var. Simple on
// purpose: there is exactly one admin (the site owner) for now.
export async function getAdminUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!user || !adminEmail || user.email !== adminEmail) {
    return null;
  }
  return user;
}
