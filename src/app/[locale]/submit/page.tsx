import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/server";
import SubmitForm from "./submit-form";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function SubmitPage({
  params,
  searchParams,
}: PageProps<"/[locale]/submit">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const sp = await searchParams;
  const submitted = sp.submitted === "1";

  return (
    <div className="flex flex-1 flex-col items-center gap-6 bg-zinc-50 px-6 py-16 dark:bg-black">
      <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
        이벤트 등록
      </h1>
      {submitted && (
        <p className="rounded-md border border-green-300 bg-green-50 px-4 py-2 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-300">
          이벤트가 등록되었습니다. 관리자 승인 후 목록에 표시됩니다.
        </p>
      )}
      <SubmitForm />
    </div>
  );
}
