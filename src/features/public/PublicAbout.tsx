"use client";
import {EditorialContentProvider,EditorialText,EditorialLink,EditorialImage,EditorialLanguageSelect,useEditorialLanguage} from './EditorialContent';
import type {EditorialDocument,EditorialLanguage,EditorialId} from '@/lib/editorial/catalog';

import { UiText } from "@/i18n/UiText";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

import VillaSerenaLogo from "@/components/common/VillaSerenaLogo";
export default function PublicAbout({editorial,language,preview=false}:{editorial?:EditorialDocument;language?:EditorialLanguage;preview?:boolean}) {return <EditorialContentProvider preview={preview} document={editorial} language={language}><AboutContent/></EditorialContentProvider>;}
function AboutContent() {
  const r = useRouter();
  const { en } = useEditorialLanguage();
  return (<main className="about-page">
    <header className="reserve-nav">
      <button className="icon-back" aria-label={en ? "Back" : "Volver"} title={en ? "Back" : "Volver"} onClick={() => r.back()}>
        <ArrowLeft />
      </button>
      <VillaSerenaLogo /><EditorialLanguageSelect/>
    </header>
    <section className="about-page-hero" data-site-section="nosotros-page">
      <EditorialImage editorialId="nosotros-page.imagen" src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1800&q=90" alt="Villa Serena" />
      <div>
        <EditorialText editorialId="nosotros-page.subtitulo" as="span" className="section-kicker">
          {en ? "ABOUT US" : "ACERCA DE NOSOTROS"}
        </EditorialText>
        <EditorialText editorialId="nosotros-page.titulo" as="h1">
          {en ? "Discover Villa Serena" : "Conoce Villa Serena"}
        </EditorialText>
        <EditorialText editorialId="nosotros-page.descripcion" as="p">
          {en
            ? "A hospitality concept that brings together rest, warm service and experiences designed to accompany every stay."
            : "Un concepto de hospitalidad que reúne descanso, atención cercana y experiencias pensadas para acompañar cada estancia."}
        </EditorialText>
      </div>
    </section>
    <section className="about-story-page" data-site-section="historia">
      <div>
        <EditorialText editorialId="historia.subtitulo" as="span" className="section-kicker">
          {en ? "OUR STORY" : "NUESTRA HISTORIA"}
        </EditorialText>
        <EditorialText editorialId="historia.titulo" as="h2">
          {en
            ? "A place created to feel at ease"
            : "Un espacio creado para sentirse bien"}
        </EditorialText>
        <EditorialText editorialId="historia.descripcion" as="p">
          {en
            ? "Villa Serena is a hotel concept focused on providing a peaceful, comfortable and personalized experience. Every space combines functionality, warmth and attentive service to make each guest’s stay easier."
            : "Villa Serena nace como una propuesta de hotel enfocada en brindar una experiencia tranquila, cómoda y personalizada. Cada espacio busca combinar funcionalidad, calidez y una atención que haga más sencilla la estancia de nuestros huéspedes."}
        </EditorialText>
      </div>
      <EditorialImage editorialId="historia.imagen"
        src="https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=88"
        alt={en ? "Villa Serena room" : "Habitación Villa Serena"} />
    </section>
    <section className="mission-vision-page" data-site-section="mision-vision">
      <article>
        <EditorialText editorialId="mision-vision.mision.subtitulo" as="span">
          <UiText text="01 — " />
          {en ? "OUR MISSION" : "NUESTRA MISIÓN"}
        </EditorialText>
        <EditorialText editorialId="mision-vision.mision.titulo" as="h2">
          {en ? "Warm hospitality" : "Hospitalidad cercana"}
        </EditorialText>
        <EditorialText editorialId="mision-vision.mision.descripcion" as="p">
          {en
            ? "To provide a warm, comfortable and personalized experience, caring for every detail and making each stage of the stay easier."
            : "Brindar una experiencia cálida, cómoda y personalizada, cuidando los detalles y facilitando cada etapa de la estancia."}
        </EditorialText>
      </article>
      <article>
        <EditorialText editorialId="mision-vision.vision.subtitulo" as="span">
          <UiText text="02 — " />
          {en ? "OUR VISION" : "NUESTRA VISIÓN"}
        </EditorialText>
        <EditorialText editorialId="mision-vision.vision.titulo" as="h2">
          {en
            ? "An experience to remember"
            : "Una experiencia que se recuerda"}
        </EditorialText>
        <EditorialText editorialId="mision-vision.vision.descripcion" as="p">
          {en
            ? "To build a hotel experience recognized for service quality, innovation and genuine care."
            : "Consolidar una propuesta hotelera reconocida por la calidad del servicio, la innovación y una atención genuina."}
        </EditorialText>
      </article>
    </section>
    <section className="values-page" data-site-section="valores">
      <EditorialText editorialId="valores.subtitulo" as="span" className="section-kicker">
        {en ? "OUR VALUES" : "NUESTROS VALORES"}
      </EditorialText>
      <EditorialText editorialId="valores.titulo" as="h2">
        {en
          ? "What guides the way we welcome you"
          : "Lo que guía nuestra forma de recibirte"}
      </EditorialText>
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
        ].map((x,index) => (<article key={x[0]}>
          <EditorialText editorialId={('valores.item'+(index+1)+'.titulo') as EditorialId} as="b">
            {x[0]}
          </EditorialText>
          <EditorialText editorialId={('valores.item'+(index+1)+'.descripcion') as EditorialId} as="p">
            {x[1]}
          </EditorialText>
        </article>))}
      </div>
    </section>

    <section className="about-final-cta">
      <EditorialText editorialId="nosotros-page.cierre.titulo" as="h2">
        {en
          ? "Discover your next stay at Villa Serena"
          : "Descubre tu próxima estancia en Villa Serena"}
      </EditorialText>
      <EditorialLink editorialId="nosotros-page.cierre.boton" href="/catalogo" className="gold-button">
        {en ? "VIEW ROOMS" : "VER HABITACIONES"}
        <ArrowRight size={16} />
      </EditorialLink>
    </section>
  </main>);
}
