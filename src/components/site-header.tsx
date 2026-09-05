import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function SiteHeader() {
  const t = await getTranslations("Nav");

  return (
    <header className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
      <Link href="/" className="font-semibold text-black dark:text-zinc-50">
        {t("home")}
      </Link>
      <nav className="flex items-center gap-4 text-sm text-zinc-700 dark:text-zinc-300">
        <Link href="/events">{t("events")}</Link>
        <Link href="/calendar">{t("calendar")}</Link>
        <Link href="/login">{t("login")}</Link>
        <Link href="/signup">{t("signup")}</Link>
      </nav>
    </header>
  );
}
