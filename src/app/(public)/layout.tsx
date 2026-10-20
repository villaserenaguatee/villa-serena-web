import PublicLanguageToggle from "@/components/common/PublicLanguageToggle";
import ScopedI18nProvider from "@/i18n/ScopedI18nProvider";
import { Suspense } from "react";
import BookingDraftLifecycle from '@/components/common/BookingDraftLifecycle';
export default function PublicLayout({ children, }: {
  children: React.ReactNode;
}) {
  return (<ScopedI18nProvider>
    <BookingDraftLifecycle />
    <PublicLanguageToggle />
    <Suspense fallback={null}>
      {children}
    </Suspense>
  </ScopedI18nProvider>);
}
