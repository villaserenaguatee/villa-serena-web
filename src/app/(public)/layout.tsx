import PublicLanguageToggle from "@/components/common/PublicLanguageToggle";
import ScopedI18nProvider from "@/i18n/ScopedI18nProvider";
import { Suspense } from "react";
export default function PublicLayout({ children, }: {
  children: React.ReactNode;
}) {
  return (<ScopedI18nProvider>
    <PublicLanguageToggle />
    <Suspense fallback={null}>
      {children}
    </Suspense>
  </ScopedI18nProvider>);
}
