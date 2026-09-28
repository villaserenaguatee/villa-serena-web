"use client";
import { UiText } from "@/i18n/UiText";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import VillaSerenaLogo from "@/components/common/VillaSerenaLogo";
import PublicLanguageToggle, { usePublicLanguage, } from "@/components/common/PublicLanguageToggle";
export default function Nosotros() {
  const r = useRouter();
  const { en } = usePublicLanguage();
  return (<main className="about-page">
    <header className="reserve-nav">
      <button className="icon-back" aria-label={en ? "Back" : "Volver"} title={en ? "Back" : "Volver"} onClick={() => r.back()}>
        <ArrowLeft />
      </button>
      <VillaSerenaLogo />
    </header>
    <section className="about-page-hero">
      <img src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1800&q=90" alt="Villa Serena" />
      <div>
        <span className="section-kicker">
          {en ? "ABOUT US" : "ACERCA DE NOSOTROS"}
        </span>
        <h1>
          {en ? "Discover Villa Serena" : "Conoce Villa Serena"}
        </h1>
        <p>
          {en
            ? "A hospitality concept that brings together rest, warm service and experiences designed to accompany every stay."
            : "Un concepto de hospitalidad que reúne descanso, atención cercana y experiencias pensadas para acompañar cada estancia."}
        </p>
      </div>
    </section>
    <section className="about-story-page">
      <div>
        <span className="section-kicker">
          {en ? "OUR STORY" : "NUESTRA HISTORIA"}
        </span>
        <h2>
          {en
            ? "A place created to feel at ease"
            : "Un espacio creado para sentirse bien"}
        </h2>
        <p>
          {en
            ? "Villa Serena is a hotel concept focused on providing a peaceful, comfortable and personalized experience. Every space combines functionality, warmth and attentive service to make each guest’s stay easier."
            : "Villa Serena nace como una propuesta de hotel enfocada en brindar una experiencia tranquila, cómoda y personalizada. Cada espacio busca combinar funcionalidad, calidez y una atención que haga más sencilla la estancia de nuestros huéspedes."}
        </p>
      </div>
      <img
        src="https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=88"
        alt={en ? "Villa Serena room" : "Habitación Villa Serena"} />
    </section>
    <section className="mission-vision-page">
      <article>
        <span>
          <UiText text="01 — " />
          {en ? "OUR MISSION" : "NUESTRA MISIÓN"}
        </span>
        <h2>
          {en ? "Warm hospitality" : "Hospitalidad cercana"}
        </h2>
        <p>
          {en
            ? "To provide a warm, comfortable and personalized experience, caring for every detail and making each stage of the stay easier."
            : "Brindar una experiencia cálida, cómoda y personalizada, cuidando los detalles y facilitando cada etapa de la estancia."}
        </p>
      </article>
      <article>
        <span>
          <UiText text="02 — " />
          {en ? "OUR VISION" : "NUESTRA VISIÓN"}
        </span>
        <h2>
          {en
            ? "An experience to remember"
            : "Una experiencia que se recuerda"}
        </h2>
        <p>
          {en
            ? "To build a hotel experience recognized for service quality, innovation and genuine care."
            : "Consolidar una propuesta hotelera reconocida por la calidad del servicio, la innovación y una atención genuina."}
        </p>
      </article>
    </section>
    <section className="values-page">
      <span className="section-kicker">
        {en ? "OUR VALUES" : "NUESTROS VALORES"}
      </span>
      <h2>
        {en
          ? "What guides the way we welcome you"
          : "Lo que guía nuestra forma de recibirte"}
      </h2>
      <div>
        {[
          [
            en ? "Hospitality" : "Hospitalidad",
            en ? "Warm and friendly service." : "Atención amable y cercana.",
          ],
          [
            en ? "Quality" : "Calidad",
            en ? "Care in every detail." : "Cuidado en cada detalle.",
          ],
          [
            en ? "Tranquility" : "Tranquilidad",
            en
              ? "Spaces designed for rest."
              : "Espacios pensados para descansar.",
          ],
          [
            en ? "Respect" : "Respeto",
            en
              ? "Thoughtful treatment for every guest."
              : "Un trato considerado para cada huésped.",
          ],
          [
            en ? "Personalized service" : "Atención personalizada",
            en
              ? "A stay tailored to your needs."
              : "Una estancia pensada según tus necesidades.",
          ],
        ].map((x) => (<article key={x[0]}>
          <b>
            {x[0]}
          </b>
          <p>
            {x[1]}
          </p>
        </article>))}
      </div>
    </section>

    <section className="about-final-cta">
      <h2>
        {en
          ? "Discover your next stay at Villa Serena"
          : "Descubre tu próxima estancia en Villa Serena"}
      </h2>
      <Link href="/catalogo" className="gold-button">
        {en ? "VIEW ROOMS" : "VER HABITACIONES"}
        <ArrowRight size={16} />
      </Link>
    </section>
  </main>);
}
