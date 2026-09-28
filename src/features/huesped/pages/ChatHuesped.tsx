import { UiText, useUiText } from "@/i18n/UiText";
import { useState } from "react";
import { usePublicLanguage } from "@/components/common/PublicLanguageToggle";
import type { MensajeChat } from "@/lib/pms/types";
import { formatoHoraISO } from "@/data/pms";
import { horaHotel } from "@/lib/hotel";
const PREGUNTAS_ES = [
  "Tengo una duda sobre mi habitación",
  "Necesito ayuda con mi check-in",
  "Tengo una duda sobre mi cuenta",
  "Quiero consultar horarios y servicios",
  "Necesito reportar un problema en la habitación",
  "Tengo otra consulta",
];
const PREGUNTAS_EN = [
  "I have a question about my room",
  "I need help with my check-in",
  "I have a question about my account",
  "I want to check schedules and services",
  "I need to report a problem in the room",
  "I have another question",
];
function Icono({ tipo, size = 28, }: {
  tipo: "recepcion" | "clip" | "imagen" | "enviar";
  size?: number;
}) {
  const p = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  if (tipo === "clip") {
    return (<svg {...p}>
      <path d="m21.4 11.6-8.8 8.8a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.5-8.5" />
    </svg>);
  }
  if (tipo === "imagen") {
    return (<svg {...p}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9" r="1.4" />
      <path d="m21 16-5-5-7 7" />
    </svg>);
  }
  if (tipo === "enviar") {
    return (<svg {...p}>
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>);
  }
  return (<svg {...p}>
    <circle cx="12" cy="12" r="9" fill="currentColor" stroke="none" />
    <path d="M7 15v-1.5A5 5 0 0 1 17 13.5V15M8.5 12.5V9a3.5 3.5 0 0 1 7 0v3.5M6 16h12" stroke="white" />
    <path d="M9 19h6" stroke="white" />
  </svg>);
}
export default function ChatHuesped({ nombreHuesped, mensajes, onEnviar, onEditar, onEliminar, }: {
  nombreHuesped: string;
  mensajes: MensajeChat[];
  onEnviar: (texto: string) => void | Promise<void>;
  onEditar: (id: string, texto: string) => void | Promise<void>;
  onEliminar: (id: string, paraTodos: boolean) => void;
}) {
  const ui = useUiText();
  const { en } = usePublicLanguage();
  const [texto, setTexto] = useState("");
  const [archivo, setArchivo] = useState<string | null>(null);
  const [mostrarPreguntas, setMostrarPreguntas] = useState(true);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editandoTexto, setEditandoTexto] = useState("");
  const [eliminarId, setEliminarId] = useState<string | null>(null);
  const mensajesVisibles = mensajes.filter((m) => !m.eliminadoPara?.includes("huesped"));
  function enviar(valor = texto.trim()) {
    if (!valor)
      return;
    void onEnviar(valor);
    setTexto("");
    setMostrarPreguntas(false);
  }
  function abrirEdicion(mensaje: MensajeChat) {
    setMenuId(null);
    setEditandoId(mensaje.id);
    setEditandoTexto(mensaje.textoEs ?? mensaje.texto);
  }
  function confirmarEdicion() {
    if (!editandoId || !editandoTexto.trim())
      return;
    void onEditar(editandoId, editandoTexto.trim());
    setEditandoId(null);
    setEditandoTexto("");
  }
  return (<div
    className="flex-1 overflow-hidden bg-[#F8F6F0]"
    style={{
      fontFamily: '"Afacad", "Segoe UI", Arial, sans-serif',
    }}
    onClick={() => setMenuId(null)}>
    <header className="relative border-b border-[#E5E0D8] bg-white px-6 py-6 sm:px-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#B38B2C]">
        <UiText text="Comunicación durante tu estancia" />
      </p>

      <h1 className="mt-1 text-[34px] font-semibold leading-tight text-[#18345C]">
        <UiText text="Chat con recepción" />
      </h1>

      <p className="mt-1 text-[17px] text-[#7890B0]">
        <UiText text="Comunícate con recepción durante tu estancia." />
      </p>
    </header>

    <div className="mx-auto max-w-[720px] px-4 py-4 sm:px-5 lg:py-5">
      <section className="flex h-[min(540px,calc(100vh-225px))] flex-col overflow-hidden rounded-2xl border border-[#E5E0D8] bg-white shadow-[0_8px_28px_rgba(16,39,71,0.06)]">

        <header className="flex items-center justify-between gap-3 border-b border-[#E5E0D8] px-4 py-3 sm:px-5">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#18345C] text-white">
              <Icono tipo="recepcion" size={23} />
            </div>

            <div>
              <h2 className="text-[18px] font-semibold text-[#18345C]">
                <UiText text="Recepción" />
              </h2>

              <p className="mt-0.5 flex items-center gap-2 text-[14px] text-[#188247]">
                <span className="h-3 w-3 rounded-full bg-[#159447]" />
                <UiText text="En línea" />
              </p>
            </div>
          </div>
        </header>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[#FBFAF7] px-4 py-3 sm:px-5">

          <div className="flex items-center gap-4">
            <span className="h-px flex-1 bg-[#E5E0D8]" />

            <span className="rounded-full border border-[#E5E0D8] bg-white px-5 py-1.5 text-sm text-[#18345C]">
              {en ? "Today" : "Hoy"}
            </span>

            <span className="h-px flex-1 bg-[#E5E0D8]" />
          </div>

          {mostrarPreguntas && (<div className="space-y-3">

            <div className="flex items-start gap-2">
              <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#18345C] text-white">
                <Icono tipo="recepcion" size={19} />
              </div>

              <div>
                <div className="rounded-xl rounded-bl-sm bg-[#F1F1F1] px-3 py-2 text-[14px] text-[#18345C]">
                  {en
                    ? `Hello, ${nombreHuesped}. How can we help you?`
                    : `Hola, ${nombreHuesped}. ¿En qué podemos ayudarte?`}
                </div>

                <p className="mt-1 pl-2 text-[11px] text-[#7890B0]">
                  {horaHotel()}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {(en ? PREGUNTAS_EN : PREGUNTAS_ES).map((pregunta) => (<button
                key={pregunta}
                type="button"
                onClick={() => enviar(pregunta)}
                className="flex min-h-10 items-center justify-between rounded-xl border border-[#E1E4E8] bg-white px-3 py-2 text-left text-[12px] font-medium text-[#18345C] shadow-sm transition hover:border-[#B38B2C] hover:bg-[#FFFDF7]">
                <span>
                  {pregunta}
                </span>

                <span className="ml-2 text-lg leading-none">
                  ›
                </span>
              </button>))}
            </div>
          </div>)}

          {mensajesVisibles.map((m) => {
            const mio = m.autor === "huesped";
            const contenido = m.eliminadoParaTodos
              ? en
                ? "This message was deleted"
                : "Este mensaje fue eliminado"
              : en
                ? m.textoEn ?? m.texto
                : m.textoEs ?? m.texto;
            return (<div key={m.id} className={`flex ${mio ? "justify-end" : "justify-start"}`}>
              <div className={`group relative max-w-[74%] rounded-2xl px-3.5 py-2.5 text-[14px] ${m.eliminadoParaTodos
                ? "border border-dashed border-[#C9CED5] bg-[#F2F3F4] italic text-[#7A8798]"
                : mio
                  ? "rounded-br-sm bg-[#18345C] text-white"
                  : "rounded-bl-sm border border-[#E5E0D8] bg-white text-[#18345C]"}`}>
                {editandoId === m.id ? (<div className="min-w-[260px]">
                  <textarea
                    value={editandoTexto}
                    onChange={(e) => setEditandoTexto(e.target.value)}
                    rows={3}
                    autoFocus
                    className="w-full rounded-lg border border-[#D7DCE2] bg-white p-2 text-[#18345C] outline-none" />

                  <div className="mt-2 flex justify-end gap-2">
                    <button type="button" onClick={() => setEditandoId(null)} className="rounded-md border px-3 py-1 text-xs text-[#52677F]">
                      {en ? "Cancel" : "Cancelar"}
                    </button>

                    <button type="button" onClick={confirmarEdicion} className="rounded-md bg-[#18345C] px-3 py-1 text-xs font-semibold text-white">
                      {en ? "Save" : "Guardar"}
                    </button>
                  </div>
                </div>) : (<>
                  <p>
                    {contenido}
                  </p>

                  {m.editado && (<span className={`text-[10px] ${mio
                    ? "text-[#C9D8E8]"
                    : "text-[#7890B0]"}`}>
                    {en ? "edited" : "editado"}
                  </span>)}

                  <p className={`mt-1 text-[11px] ${mio
                    ? "text-[#C9D8E8]"
                    : "text-[#7890B0]"}`}>
                    {formatoHoraISO(m.hora)}
                  </p>
                </>)}

                {!m.eliminadoParaTodos &&
                  editandoId !== m.id && (<button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuId(menuId === m.id ? null : m.id);
                    }}
                    className={`absolute -right-2 -top-3 rounded-full border bg-white px-2 py-0.5 text-[#52677F] shadow-sm opacity-0 transition group-hover:opacity-100 ${menuId === m.id
                      ? "opacity-100"
                      : ""}`}
                    aria-label={en
                      ? "Message options"
                      : "Opciones del mensaje"}>
                    ⋯
                  </button>)}

                {menuId === m.id &&
                  !m.eliminadoParaTodos && (<div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 top-6 z-20 w-44 overflow-hidden rounded-xl border border-[#E5E0D8] bg-white text-sm text-[#18345C] shadow-xl">
                    <button
                      type="button"
                      disabled={!mio}
                      onClick={() => abrirEdicion(m)}
                      className="block w-full px-4 py-2.5 text-left hover:bg-[#F8F6F0] disabled:cursor-not-allowed disabled:opacity-40">
                      {en ? "Edit" : "Editar"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setMenuId(null);
                        setEliminarId(m.id);
                      }}
                      className="block w-full px-4 py-2.5 text-left text-red-600 hover:bg-red-50">
                      {en ? "Delete" : "Eliminar"}
                    </button>
                  </div>)}
              </div>
            </div>);
          })}
        </div>

        <footer className="border-t border-[#E5E0D8] bg-white px-4 py-3 sm:px-5">

          {archivo && (<div className="mb-3 rounded-lg bg-[#F8F6F0] px-3 py-2 text-sm text-[#52677F]">
            {archivo}
          </div>)}

          <div className="flex items-center gap-3">

            <label className="cursor-pointer text-[#18345C]" title={ui("Adjuntar archivo")}>
              <input type="file" className="hidden" onChange={(e) => setArchivo(e.target.files?.[0]?.name ?? null)} />

              <Icono tipo="clip" size={29} />
            </label>

            <label className="cursor-pointer text-[#18345C]" title={ui("Adjuntar imagen")}>
              <input type="file" className="hidden" accept="image/*" onChange={(e) => setArchivo(e.target.files?.[0]?.name ?? null)} />

              <Icono tipo="imagen" size={28} />
            </label>

            <input
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" &&
                  !e.shiftKey) {
                  e.preventDefault();
                  enviar();
                }
              }}
              placeholder={ui("Escribe un mensaje...")}
              className="min-w-0 flex-1 rounded-xl border border-[#DCDCDC] bg-white px-4 py-3 text-[14px] text-[#18345C] outline-none focus:border-[#18345C]" />

            <button
              type="button"
              onClick={() => enviar()}
              disabled={!texto.trim()}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#18345C] text-white disabled:cursor-not-allowed disabled:opacity-40">
              <Icono tipo="enviar" size={31} />
            </button>
          </div>
        </footer>
      </section>
    </div>

    {eliminarId && (<div className="fixed inset-0 z-[130] grid place-items-center bg-[#071D34]/45 p-4">
      <section className="w-full max-w-[420px] rounded-2xl bg-white p-5 shadow-2xl">
        <h2 className="text-xl font-semibold text-[#18345C]">
          {en
            ? "Delete message"
            : "Eliminar mensaje"}
        </h2>

        <p className="mt-2 text-sm text-[#71839B]">
          {en
            ? "Choose where you want to remove this message."
            : "Elige dónde quieres eliminar este mensaje."}
        </p>

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              onEliminar(eliminarId, false);
              setEliminarId(null);
            }}
            className="rounded-lg border border-[#D9DDE2] px-4 py-2 text-sm font-semibold text-[#18345C]">
            {en
              ? "Delete for me"
              : "Eliminar para mí"}
          </button>

          <button
            type="button"
            onClick={() => {
              onEliminar(eliminarId, true);
              setEliminarId(null);
            }}
            className="rounded-lg bg-[#B32D2D] px-4 py-2 text-sm font-semibold text-white">
            {en
              ? "Delete for everyone"
              : "Eliminar para todos"}
          </button>

          <button
            type="button"
            onClick={() => setEliminarId(null)}
            className="rounded-lg border border-[#18345C] px-4 py-2 text-sm font-semibold text-[#18345C]">
            {en ? "Cancel" : "Cancelar"}
          </button>
        </div>
      </section>
    </div>)}
  </div>);
}
