import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { getAdminUser } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { EVENT_TYPE_LABELS } from "@/lib/events/labels";
import type { EventRow } from "@/lib/events/queries";
import { approveEvent, rejectEvent } from "./actions";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type PendingEvent = EventRow & {
  status: string;
  source: string | null;
  created_at: string;
};

export default async function AdminPage({
  params,
}: PageProps<"/[locale]/admin">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const admin = await getAdminUser();
  if (!admin) {
    redirect(`/${locale}`);
  }

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("events")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  const pendingEvents = (data as PendingEvent[]) ?? [];

  return (
    <div className="flex flex-1 flex-col items-center gap-6 bg-zinc-50 px-6 py-16 dark:bg-black">
      <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
        승인 대기 이벤트
      </h1>

      {pendingEvents.length === 0 ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          승인 대기 중인 이벤트가 없습니다.
        </p>
      ) : (
        <ul className="w-full max-w-2xl space-y-3">
          {pendingEvents.map((event) => (
            <li
              key={event.id}
              className="rounded-md border border-zinc-200 p-4 dark:border-zinc-800"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-black dark:text-zinc-50">
                    {event.title_ko}
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {event.type ? EVENT_TYPE_LABELS[event.type] : ""}
                    {" · "}
                    {event.start_date}
                    {event.end_date && event.end_date !== event.start_date
                      ? ` ~ ${event.end_date}`
                      : ""}
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {event.venue ? `${event.venue} · ` : ""}
                    {event.address}, {event.city}, {event.state} ({event.nat})
                  </p>
                  {event.price && (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      가격: {event.price}
                    </p>
                  )}
                  {event.website_url && (
                    <a
                      href={event.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm underline"
                    >
                      {event.website_url}
                    </a>
                  )}
                  <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
                    {event.description_ko}
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">
                    제출 방식: {event.source === "user_submitted" ? "회원 제출" : "자동 수집"}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex gap-2">
                <form action={approveEvent.bind(null, locale)}>
                  <input type="hidden" name="id" value={event.id} />
                  <button
                    type="submit"
                    className="rounded-md bg-black px-3 py-1.5 text-sm font-medium text-white dark:bg-zinc-50 dark:text-black"
                  >
                    승인
                  </button>
                </form>
                <form action={rejectEvent.bind(null, locale)}>
                  <input type="hidden" name="id" value={event.id} />
                  <button
                    type="submit"
                    className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
                  >
                    거절
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
