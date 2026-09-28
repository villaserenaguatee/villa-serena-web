"use client";
import { ArrowRight, Camera, CreditCard, DoorOpen, Globe2, IdCard, LockKeyhole, Shield, UserRound, X, } from "lucide-react";
import { useRef, useState } from "react";
type Seccion = null | "personal" | "contacto" | "idioma" | "pago" | "privacidad" | "seguridad";
interface PerfilHuespedProps {
  documento?: string;
  nombre: string;
  telefono: string;
  correo: string;
  foto?: string | null;
  idioma?: string;
  onVolver: () => void;
  onCerrarSesion?: () => void;
  onFoto?: (foto: string | null) => void;
  onTelefono?: (telefono: string) => void;
  onCorreo?: (correo: string) => void;
  onIdioma?: (idioma?: string) => void;
  onAviso?: (mensaje: string) => void;
  onSolicitarCorreccion?: (datos: unknown) => void;
}
export default function PerfilHuesped({ nombre, correo, telefono, foto: fotoInicial = null, onVolver, onCerrarSesion, onFoto, }: PerfilHuespedProps) {
  const [seccion, setSeccion] = useState<Seccion>(null);
  const [foto, setFoto] = useState<string | null>(fotoInicial);
  const inputFoto = useRef<HTMLInputElement>(null);
  const iniciales = nombre
    .split(" ")
    .map((x) => x[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  function cargarFoto(file?: File) {
    if (!file)
      return;
    const reader = new FileReader();
    reader.onload = () => {
      const nuevaFoto = String(reader.result);
      setFoto(nuevaFoto);
      onFoto?.(nuevaFoto);
    };
    reader.readAsDataURL(file);
  }
  const items = [
    {
      key: "personal" as const,
      titulo: "Información personal",
      sub: nombre,
      icono: UserRound,
    },
    {
      key: "contacto" as const,
      titulo: "Datos de contacto",
      sub: telefono || correo,
      icono: IdCard,
    },
    {
      key: "idioma" as const,
      titulo: "Idioma",
      sub: "Español",
      icono: Globe2,
    },
    {
      key: "pago" as const,
      titulo: "Métodos de pago",
      sub: "Sin tarjetas guardadas",
      icono: CreditCard,
    },
    {
      key: "privacidad" as const,
      titulo: "Privacidad",
      sub: "Datos y comunicaciones",
      icono: Shield,
    },
    {
      key: "seguridad" as const,
      titulo: "Seguridad",
      sub: "Contraseña",
      icono: LockKeyhole,
    },
  ];
  return (<div
    className="fixed inset-0 z-[120] bg-[#071D34]/25"
    onMouseDown={(e) => {
      if (e.target === e.currentTarget) {
        onVolver();
      }
    }}>
    <aside className="h-full w-[min(430px,94vw)] overflow-y-auto bg-[#F8F6F0] p-4 shadow-2xl sm:p-6" onMouseDown={(e) => e.stopPropagation()}>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[26px] font-semibold text-[#17365D]">
            Perfil
          </h1>

          <p className="mt-1 text-sm text-[#72829A]">
            Administra tus datos, preferencias y seguridad.
          </p>
        </div>

        <button
          type="button"
          onClick={onVolver}
          className="grid h-11 w-11 place-items-center rounded-full border border-[#17365D] text-[#17365D] transition hover:bg-white"
          aria-label="Cerrar perfil">
          <X size={24} />
        </button>
      </div>

      <div className="mt-6 rounded-2xl border border-[#E6E0D7] bg-white p-5">
        <div className="flex items-center gap-4">
          <div className="grid h-[88px] w-[88px] shrink-0 place-items-center overflow-hidden rounded-full bg-[#E6C54A] text-lg font-semibold text-[#17365D]">
            {foto ? (<img src={foto} alt="Foto de perfil" className="h-full w-full object-cover" />) : (iniciales)}
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="truncate text-[18px] font-semibold text-[#17365D]">
              {nombre}
            </h2>

            <p className="text-sm text-[#72829A]">Huésped</p>
          </div>

          <button
            type="button"
            onClick={() => inputFoto.current?.click()}
            className="flex shrink-0 items-center gap-2 rounded-lg border border-[#17365D] px-3 py-2 text-sm font-semibold text-[#17365D] transition hover:bg-[#F8F6F0]">
            <Camera size={17} />
            Cambiar foto
          </button>

          <input ref={inputFoto} type="file" accept="image/*" className="hidden" onChange={(e) => cargarFoto(e.target.files?.[0])} />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {items.map((item) => {
          const Icono = item.icono;
          return (<button
            key={item.key}
            type="button"
            onClick={() => setSeccion(item.key)}
            className="flex min-h-[112px] items-center gap-3 rounded-2xl border border-[#E6E0D7] bg-white p-4 text-left transition hover:border-[#C99B21] hover:shadow-sm">
            <Icono size={22} className="shrink-0 text-[#C79300]" />

            <div className="min-w-0 flex-1">
              <p className="font-semibold leading-6 text-[#17365D]">
                {item.titulo}
              </p>

              <p className="mt-0.5 truncate text-sm text-[#72829A]">
                {item.sub}
              </p>
            </div>

            <ArrowRight size={18} className="shrink-0 text-[#91A0B1]" />
          </button>);
        })}
      </div>

      <button
        type="button"
        onClick={() => onCerrarSesion?.()}
        className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-3 font-semibold text-red-600 transition hover:bg-red-50">
        <DoorOpen size={20} />
        Cerrar sesión
      </button>
    </aside>

    {seccion === "personal" && (<Modal titulo="Información personal" onClose={() => setSeccion(null)}>
      <Campo label="Nombre completo" valor={nombre} />
      <Campo label="Tipo de usuario" valor="Huésped" />
    </Modal>)}

    {seccion === "contacto" && (<Modal titulo="Datos de contacto" onClose={() => setSeccion(null)}>
      <Campo label="Correo electrónico" valor={correo} />
      <Campo label="Teléfono" valor={telefono} />
    </Modal>)}

    {seccion === "idioma" && (<Modal titulo="Idioma" onClose={() => setSeccion(null)}>
      <label className="text-sm font-semibold text-[#17365D]">
        Idioma preferido
      </label>

      <select className="mt-2 w-full rounded-xl border border-[#D9D3CA] bg-white px-4 py-3 text-[#17365D] outline-none">
        <option>Español</option>
        <option>English</option>
      </select>
    </Modal>)}

    {seccion === "pago" && (<Modal titulo="Métodos de pago" onClose={() => setSeccion(null)}>
      <p className="text-sm leading-6 text-[#72829A]">
        No tienes tarjetas guardadas.
      </p>

      <button type="button" className="mt-4 rounded-xl bg-[#17365D] px-4 py-3 font-semibold text-white">
        Agregar método de pago
      </button>
    </Modal>)}

    {seccion === "privacidad" && (<Modal titulo="Privacidad" onClose={() => setSeccion(null)}>
      <p className="text-sm leading-6 text-[#72829A]">
        Consulta y administra tus preferencias de privacidad y
        comunicaciones durante tu estancia.
      </p>
    </Modal>)}

    {seccion === "seguridad" && (<Modal titulo="Seguridad" onClose={() => setSeccion(null)}>
      <div className="rounded-2xl border border-[#E3DDD3] bg-[#FCFBF8] p-5">
        <div className="flex items-center gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#F8E9B4] text-[#B98708]">
            <LockKeyhole size={24} />
          </div>

          <div>
            <h3 className="text-[17px] font-semibold text-[#17365D]">
              Contraseña
            </h3>

            <p className="mt-1 text-[15px] text-[#72829A]">
              Administra la contraseña de acceso a tu cuenta.
            </p>
          </div>
        </div>
      </div>

      <button type="button" className="mt-5 rounded-xl bg-[#17365D] px-5 py-3.5 font-semibold text-white transition hover:bg-[#102A4A]">
        Cambiar contraseña
      </button>
    </Modal>)}
  </div>);
}
function Modal({ titulo, children, onClose, }: {
  titulo: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (<div
    className="fixed inset-0 z-[140] grid place-items-center bg-[#071D34]/50 p-4"
    onMouseDown={(e) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    }}>
    <section className="w-full max-w-[520px] rounded-2xl bg-white shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between border-b border-[#E6E0D7] px-6 py-5">
        <h2 className="text-xl font-semibold text-[#17365D]">
          {titulo}
        </h2>

        <button
          type="button"
          onClick={onClose}
          className="grid h-9 w-9 place-items-center rounded-full text-[#17365D] transition hover:bg-[#F8F6F0]"
          aria-label="Cerrar">
          <X size={23} />
        </button>
      </div>

      <div className="p-6">
        {children}
      </div>
    </section>
  </div>);
}
function Campo({ label, valor, }: {
  label: string;
  valor: string;
}) {
  return (<div className="mb-4">
    <label className="text-xs font-semibold uppercase tracking-[0.08em] text-[#8794A5]">
      {label}
    </label>

    <div className="mt-1 rounded-xl border border-[#E2DDD5] bg-[#FAF9F6] px-4 py-3 text-[#17365D]">
      {valor || "—"}
    </div>
  </div>);
}
