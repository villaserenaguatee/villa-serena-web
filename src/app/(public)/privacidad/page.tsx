"use client";
import { UiText } from "@/i18n/UiText";
import { useRouter } from "next/navigation";
import VillaSerenaLogo from "@/components/common/VillaSerenaLogo";
import PublicLanguageToggle, { usePublicLanguage, } from "@/components/common/PublicLanguageToggle";
export default function Privacidad() {
  const { en } = usePublicLanguage();
  const router = useRouter();
  return (<main className="legal-page">
    <header>
      <button onClick={() => router.back()} className="icon-back legal-back" aria-label={en ? "Back" : "Volver"}>
        <UiText text="←" />
      </button>
      <VillaSerenaLogo />
    </header>
    <article>
      <span className="section-kicker">
        <UiText text="VILLA SERENA" />
      </span>
      <h1>
        {en ? "Privacy policy" : "Política de privacidad"}
      </h1>
      <p>
        {en
          ? "Villa Serena uses information provided by guests to manage bookings, provide requested services and facilitate assistance during the stay."
          : "Villa Serena utiliza la información proporcionada por sus huéspedes para gestionar reservas, prestar los servicios solicitados y facilitar la atención durante la estancia."}
      </p>
      <h2>
        <UiText text="1. " />
        {en ? "Information we collect" : "Información que recopilamos"}
      </h2>
      <p>
        {en
          ? "We may request first and last name, identification document, email, phone number, nationality and booking-related information."
          : "Podemos solicitar nombre, apellidos, documento de identificación, correo electrónico, teléfono, nacionalidad e información relacionada con la reserva."}
      </p>
      <h2>
        <UiText text="2. " />
        {en ? "Use of information" : "Uso de la información"}
      </h2>
      <p>
        {en
          ? "Data may be used to manage and confirm bookings, facilitate arrival and departure, handle requests, manage payments and maintain stay-related communication."
          : "Los datos podrán utilizarse para gestionar y confirmar reservas, facilitar procesos de llegada y salida, atender solicitudes, gestionar pagos y mantener comunicación relacionada con la estancia."}
      </p>
      <h2>
        <UiText text="3. " />
        {en ? "Information protection" : "Protección de la información"}
      </h2>
      <p>
        {en
          ? "Villa Serena seeks to maintain appropriate measures to protect personal information and prevent unauthorized access or use."
          : "Villa Serena procura mantener medidas adecuadas para proteger la información personal y prevenir accesos o usos no autorizados."}
      </p>
      <h2>
        <UiText text="4. " />
        {en ? "Payment information" : "Información de pago"}
      </h2>
      <p>
        {en
          ? "Data required to process payments will be used only to manage transactions related to the booking and contracted services."
          : "Los datos necesarios para procesar pagos se utilizarán únicamente para gestionar operaciones relacionadas con la reserva y los servicios contratados."}
      </p>
      <h2>
        <UiText text="5. " />
        {en ? "Communications" : "Comunicaciones"}
      </h2>
      <p>
        {en
          ? "The email address or phone number provided may be used for confirmations, changes and necessary booking communications."
          : "El correo electrónico o teléfono proporcionado podrá utilizarse para confirmaciones, cambios y comunicaciones necesarias sobre la reserva."}
      </p>
      <h2>
        <UiText text="6. " />
        {en ? "Guest rights" : "Derechos del huésped"}
      </h2>
      <p>
        {en
          ? "Guests may request information about their personal data and, where applicable, request that it be updated or corrected."
          : "El huésped podrá solicitar información relacionada con sus datos personales y, cuando corresponda, solicitar su actualización o corrección."}
      </p>
      <h2>
        <UiText text="7. " />
        {en ? "Contact" : "Contacto"}
      </h2>
      <div className="legal-contact">
        <p>
          <b>
            <UiText text="Villa Serena Hotel" />
          </b>
          <br />
          <UiText text="Huehuetenango, Guatemala" />
          <br />
          <a href="mailto:villaserenagt@gmail.com">
            <UiText text="villaserenagt@gmail.com" />
          </a>
        </p>
        <p>
          <b>
            <UiText text="Facebook:" />
          </b>
          <UiText text=" villaserenagt" />
          <br />
          <b>
            <UiText text="Instagram:" />
          </b>
          <UiText text=" @villaserenagt" />
        </p>
      </div>
      <small>
        {en
          ? "Last updated: September 2026."
          : "Última actualización: septiembre de 2026."}
      </small>
    </article>
  </main>);
}
