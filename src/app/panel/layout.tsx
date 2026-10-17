import type {ReactNode} from 'react';
import ScopedI18nProvider from '@/i18n/ScopedI18nProvider';
export default function PanelLanguageLayout({children}:{children:ReactNode}) {
 return <ScopedI18nProvider>{children}</ScopedI18nProvider>;
}
