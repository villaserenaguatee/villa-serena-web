import {render,screen} from '@testing-library/react';
import {beforeEach,expect,test,vi} from 'vitest';
import BookingSummaryCard from '@/components/public/BookingSummaryCard';
import BookingTermsContent from '@/components/common/BookingTermsContent';
import PrivacyPolicyContent from '@/components/common/PrivacyPolicyContent';
const state=vi.hoisted(()=>({en:false,replace:vi.fn()}));
vi.mock('next/navigation',()=>({useRouter:()=>({replace:state.replace}),useSearchParams:()=>new URLSearchParams('draft=draft-one')}));
vi.mock('@/components/common/PublicLanguageToggle',()=>({usePublicLanguage:()=>({en:state.en,lang:state.en?'EN':'ES'})}));
vi.mock('@/i18n/UiText',()=>({useUiText:()=>(s:string)=>s}));
beforeEach(()=>{state.en=false;state.replace.mockReset();sessionStorage.clear();});
for(const en of [false,true])test(`summary, terms and privacy have complete ${en?'English':'Spanish'} content`,async()=>{
 state.en=en;const props={name:'Habitación Estándar',category:'Estándar',arrival:'2026-11-16',departure:'2026-11-18',adults:2,childCount:0,nights:2,nightlyPrice:420,total:840};
 const summary=render(<BookingSummaryCard {...props}/>);expect(screen.getByText(en?'Price per night':'Precio por noche')).toBeVisible();expect(screen.getByText(/^Q\s*840$/)).toBeVisible();summary.unmount();
 const terms=render(<BookingTermsContent/>);expect(screen.getByText(/48/)).toHaveTextContent(en?'Reception completes the cancellation':'Recepción realiza la cancelación');expect(screen.getByText(/48/)).toHaveTextContent(en?'does not, by itself, guarantee':'no garantiza por sí mismo');expect(screen.getByRole('link')).toHaveAttribute('href','mailto:hotelvillaserena.gt@gmail.com');terms.unmount();
 const privacy=render(<PrivacyPolicyContent/>);expect(screen.getByRole('heading',{name:en?'Privacy policy':'Política de privacidad'})).toBeVisible();expect(screen.getByText(/Recurrente/)).toBeVisible();privacy.unmount();
});