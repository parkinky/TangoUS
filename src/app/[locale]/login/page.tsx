import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import LoginForm from "./login-form";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LoginPage({
  params,
}: PageProps<"/[locale]/login">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Auth.login");

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-6 py-16 dark:bg-black">
      <h1 className="mb-8 text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
        {t("title")}
      </h1>
      <LoginForm />
    </div>
  );
}
