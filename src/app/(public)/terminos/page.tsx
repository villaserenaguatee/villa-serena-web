"use client";
import { useRouter } from 'next/navigation';
import VillaSerenaLogo from '@/components/common/VillaSerenaLogo';
import PublicLanguageToggle, { usePublicLanguage } from '@/components/common/PublicLanguageToggle';
export default function Terminos() {
  const router = useRouter();
  const { en } = usePublicLanguage();
  return <><PublicLanguageToggle /><main className="legal-page">
    <header>
      <button onClick={() => router.back()} className="icon-back legal-back" aria-label={en ? 'Back' : 'Volver'}>←</button>
      <VillaSerenaLogo />
    </header>
    <article>
      <span className="section-kicker">VILLA SERENA</span>
      <h1>
        {en ? 'Terms and conditions' : 'Términos y condiciones'}
      </h1>
      <h2>
        {en ? 'Bookings' : 'Reservaciones'}
      </h2>
      <p>
        {en ? 'Every booking is subject to room availability and the conditions of the selected rate.' : 'Toda reservación está sujeta a disponibilidad y a las condiciones de la tarifa seleccionada.'}
      </p>
      <h2>
        {en ? 'Changes, cancellations and refunds' : 'Modificaciones, cancelaciones y reembolsos'}
      </h2>
      <p>
        {en ? 'The applicable change, cancellation and refund conditions are shown before the booking is confirmed and depend on the selected rate.' : 'Las condiciones aplicables de modificación, cancelación y reembolso se muestran antes de confirmar la reservación y dependen de la tarifa seleccionada.'}
      </p>
      <h2>
        {en ? 'No-show' : 'No presentación'}
      </h2>
      <p>
        {en ? 'The no-show conditions applicable to the selected rate are displayed before confirmation.' : 'Las condiciones por no presentación aplicables a la tarifa seleccionada se muestran antes de la confirmación.'}
      </p>
      <h2>
        {en ? 'Contact' : 'Contacto'}
      </h2>
      <p>Villa Serena Hotel · Huehuetenango, Guatemala · villaserenagt@gmail.com · +502 7764-2580</p>
    </article>
  </main></>;
}
