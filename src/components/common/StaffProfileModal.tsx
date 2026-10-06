'use client';
import { useMemo, useRef, useState } from 'react';
import { Camera, ChevronRight, Contact, DoorOpen, LockKeyhole, UserRound, BriefcaseBusiness, X, KeyRound, Eye, EyeOff } from 'lucide-react';
import type { ClipboardEvent, KeyboardEvent } from 'react';
import { guardarEmpleados, leerEmpleados } from '@/store/employeeStore';
import { useAuth } from '@/hooks/useAuth';
import { useTranslations } from 'next-intl';
import { esCuentaDemoArea } from '@/lib/auth/local-auth';
type Sec = 'personal' | 'contacto' | 'laboral' | 'seguridad' | 'cambiarTelefono' | 'verificarTelefono' | 'cambiarClave' | 'foto' | 'salir' | null;
type PerfilModalProps = {
  open: boolean;
  onClose: () => void;
  name: string;
  role: string;
  email: string;
  onSolicitarCodigoTelefono?: (telefono: string) => Promise<void>;
  onVerificarCodigoTelefono?: (telefono: string, codigo: string) => Promise<void>;
  onActualizarTelefono?: (telefono: string) => Promise<void>;
  onCambiarClave?: (actual: string, nueva: string) => Promise<void>;
};
type Perfil = {
  nombre: string;
  telefono: string;
  correo: string;
  foto: string;
};
const inputClass = 'w-full rounded-xl border border-[#D9D5CC] bg-white px-3 py-2.5 text-[#18345C] outline-none transition focus:border-[#B58B2A] focus:ring-2 focus:ring-[#D8B94E]/20';
export default function StaffProfileModal({ open, onClose, name, role, email, onSolicitarCodigoTelefono, onVerificarCodigoTelefono, onActualizarTelefono, onCambiarClave }: PerfilModalProps) {
  const tAuth = useTranslations("auth");
  const { user, logout } = useAuth();
  const area = useMemo(() => role.split('·')[0].trim().replace('Encargado de mantenimiento', 'Mantenimiento'), [role]);
  const empleadoCentral = user && user.role !== 'huesped' && !esCuentaDemoArea(user.id) ? leerEmpleados().find(e => e.id === user?.id && e.activo) : undefined;
  const codigo = empleadoCentral?.codigoEmpleado ?? '—';
  const key = `vs-perfil-personal-${(empleadoCentral?.correo ?? user?.email ?? '').toLowerCase()}`;
  const base: Perfil = {
    nombre: empleadoCentral?.nombre ?? user?.name ?? role,
    telefono: empleadoCentral?.telefono ?? '',
    correo: empleadoCentral?.correo ?? user?.email ?? '',
    foto: empleadoCentral?.foto ?? ''
  };
  let stored = base;
  try {
    if (empleadoCentral && typeof window !== 'undefined')
      stored = { ...base, ...JSON.parse(localStorage.getItem(key) || '{}') };
  }
  catch { }
  const [perfil, setPerfil] = useState<Perfil>(stored),
    [modal, setModal] = useState<Sec>(null),
    [editNombre, setEditNombre] = useState(stored.nombre),
    [clave, setClave] = useState({ actual: '', nueva: '', confirmar: '' }),
    [mensajeClave, setMensajeClave] = useState(''),
    [nuevoTelefono, setNuevoTelefono] = useState(''),
    [codigoTelefono, setCodigoTelefono] = useState(['', '', '', '', '', '']),
    [mensajeTelefono, setMensajeTelefono] = useState(''),
    [solicitudTelefonoOcupada, setSolicitudTelefonoOcupada] = useState(false),
    [mostrandoClaves, setMostrandoClaves] = useState({ actual: false, nueva: false, confirmar: false });
  const ref = useRef<HTMLInputElement>(null);
  const codigoTelefonoRefs = useRef<Array<HTMLInputElement | null>>([]);
  if (!open)
    return null;
  const iniciales = perfil.nombre.split(/\s+/).map(x => x[0]).slice(0, 2).join('').toUpperCase();
  function guardar(p: Perfil) {
    if (!empleadoCentral) return;
    setPerfil(p);
    localStorage.setItem(key, JSON.stringify(p));
    if (empleadoCentral) {
      guardarEmpleados(leerEmpleados().map(e => e.id === empleadoCentral.id ? { ...e, nombre: p.nombre, telefono: p.telefono, correo: p.correo, foto: p.foto } : e));
    }
    window.dispatchEvent(new CustomEvent('vs-profile-updated', { detail: { role, codigo, ...p } }));
  }
  function abrir(s: Sec) {
    setModal(s);
    if (s === 'personal')
      setEditNombre(perfil.nombre);
    if (s === 'seguridad') {
      setMensajeClave('');
      setClave({ actual: '', nueva: '', confirmar: '' });
    }
    if (s === 'cambiarTelefono') {
      setNuevoTelefono('');
      setCodigoTelefono(['', '', '', '', '', '']);
      setMensajeTelefono('');
      setSolicitudTelefonoOcupada(false);
    }
  }
  function guardarPersonal() {
    const n = editNombre.trim();
    if (!n)
      return;
    guardar({ ...perfil, nombre: n });
    setModal(null);
  }
  function validarClave(): boolean {
    if (!clave.actual) {
      setMensajeClave('Ingresa tu contraseña actual.');
      return false;
    }
    if (!clave.nueva) {
      setMensajeClave('Ingresa una nueva contraseña.');
      return false;
    }
    if (!clave.confirmar) {
      setMensajeClave('Confirma la nueva contraseña.');
      return false;
    }
    if (clave.nueva === clave.actual) {
      setMensajeClave('La nueva contraseña debe ser distinta a la actual.');
      return false;
    }
    const ok = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(clave.nueva);
    if (!ok) {
      setMensajeClave('La nueva contraseña no cumple los requisitos.');
      return false;
    }
    if (clave.nueva !== clave.confirmar) {
      setMensajeClave('La confirmación no coincide con la nueva contraseña.');
      return false;
    }
    return true;
  }
  async function actualizarClave() {
    if (!validarClave())
      return;
    if (!onCambiarClave) {
      setMensajeClave(tAuth('passwordChangeUnavailable'));
      return;
    }
    try {
      await onCambiarClave(clave.actual, clave.nueva);
      setClave({ actual: '', nueva: '', confirmar: '' });
      setMensajeClave('Contraseña actualizada correctamente.');
    }
    catch (error) {
      setMensajeClave(error instanceof Error ? error.message : 'No se pudo cambiar la contraseña.');
    }
  }
  function telefonoNuevoFormateado() {
    const digitos = nuevoTelefono.replace(/\D/g, '');
    return `+502 ${digitos}`;
  }
  async function solicitarCodigoTelefono() {
    if (solicitudTelefonoOcupada)
      return;
    const digitos = nuevoTelefono.replace(/\D/g, '');
    const telefonoActual = perfil.telefono.replace(/\D/g, '').replace(/^502/, '');
    if (!digitos) {
      setMensajeTelefono('Ingresa el nuevo número de teléfono.');
      return;
    }
    if (!/^\d{8}$/.test(digitos)) {
      setMensajeTelefono('Ingresa un número de teléfono válido.');
      return;
    }
    if (digitos === telefonoActual) {
      setMensajeTelefono('El nuevo teléfono debe ser distinto al actual.');
      return;
    }
    if (!onSolicitarCodigoTelefono) {
      setMensajeTelefono('No se pudo enviar el código.');
      return;
    }
    setSolicitudTelefonoOcupada(true);
    try {
      await onSolicitarCodigoTelefono(telefonoNuevoFormateado());
      setCodigoTelefono(['', '', '', '', '', '']);
      setMensajeTelefono('');
      setModal('verificarTelefono');
      window.setTimeout(() => codigoTelefonoRefs.current[0]?.focus(), 0);
    }
    catch (error) {
      setMensajeTelefono(error instanceof Error ? error.message : 'No se pudo enviar el código.');
    }
    finally {
      setSolicitudTelefonoOcupada(false);
    }
  }
  function cambiarCodigoTelefono(index: number, value: string) {
    const digits = value.replace(/\D/g, '');
    if (!digits) {
      setCodigoTelefono(actual => actual.map((digit, i) => i === index ? '' : digit));
      setMensajeTelefono('');
      return;
    }
    const next = [...codigoTelefono];
    digits.slice(0, 6 - index).split('').forEach((digit, offset) => {
      next[index + offset] = digit;
    });
    setCodigoTelefono(next);
    setMensajeTelefono('');
    const siguiente = Math.min(5, index + digits.length);
    window.setTimeout(() => codigoTelefonoRefs.current[siguiente]?.focus(), 0);
  }
  function pegarCodigoTelefono(event: ClipboardEvent<HTMLInputElement>) {
    const digits = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (digits.length < 2)
      return;
    event.preventDefault();
    setCodigoTelefono([...digits, ...Array(6 - digits.length).fill('')]);
    setMensajeTelefono('');
    codigoTelefonoRefs.current[Math.min(digits.length, 6) - 1]?.focus();
  }
  function manejarTeclaCodigoTelefono(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Backspace' && !codigoTelefono[index] && index > 0)
      codigoTelefonoRefs.current[index - 1]?.focus();
  }
  async function verificarCodigoTelefono() {
    const telefono = telefonoNuevoFormateado();
    const codigoIngresado = codigoTelefono.join('');
    if (!/^\d{6}$/.test(codigoIngresado)) {
      setMensajeTelefono('Ingresa el código de verificación de 6 dígitos.');
      return;
    }
    if (!onVerificarCodigoTelefono || !onActualizarTelefono) {
      setMensajeTelefono('No se pudo verificar el código.');
      return;
    }
    try {
      await onVerificarCodigoTelefono(telefono, codigoIngresado);
    }
    catch (error) {
      setMensajeTelefono(error instanceof Error ? error.message : 'El código ingresado no es válido.');
      return;
    }
    try {
      await onActualizarTelefono(telefono);
      guardar({ ...perfil, telefono });
      setMensajeTelefono('');
      setModal('contacto');
    }
    catch (error) {
      setMensajeTelefono(error instanceof Error ? error.message : 'No se pudo actualizar el teléfono.');
    }
  }
  const opciones = [['personal', 'Información personal', perfil.nombre, UserRound],
  ['contacto', 'Datos de contacto', `${perfil.telefono || 'Sin teléfono'} · ${perfil.correo}`, Contact],
  ['laboral', 'Información laboral', `${area} · ${codigo}`, BriefcaseBusiness],
  ['seguridad', 'Seguridad', 'Contraseña y acceso', LockKeyhole]] as const;
  return <div className="fixed inset-0 z-[100] bg-[#071D34]/45" onMouseDown={e => e.target === e.currentTarget && onClose()}>
    <aside className="h-full w-[min(430px,94vw)] overflow-y-auto bg-[#F8F6F0] p-4 shadow-2xl sm:p-6" onMouseDown={e => e.stopPropagation()}>
      <div className="mb-5 flex justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-[#18345C]">Perfil</h1>
          <p className="mt-1 text-sm text-[#71839B]">Administra tus datos, preferencias y seguridad.</p>
        </div>
        <button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full border border-[#D9D5CC] bg-white">
          <X size={20} />
        </button>
      </div>
      <section className="mb-4 flex items-center gap-4 rounded-2xl border border-[#D9D5CC] bg-white p-5">
        {perfil.foto ? <img src={perfil.foto} className="h-20 w-20 rounded-full object-cover" alt="" /> : <div className="grid h-20 w-20 place-items-center rounded-full bg-[#D8B94E] text-xl font-bold text-[#102747]">
          {iniciales}
        </div>}
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-semibold text-[#18345C]">
            {perfil.nombre}
          </h2>
          <p className="text-sm text-[#71839B]">
            {area}
          </p>
        </div>
        <button
          onClick={() => abrir('foto')}
          className="inline-flex items-center gap-2 rounded-lg border border-[#18345C] px-3 py-2 text-sm font-semibold text-[#18345C]"><Camera size={16} />Cambiar foto</button>
      </section>
      <div className="space-y-2">
        {opciones.map(([id, t, r, I]) => <button
          key={id}
          onClick={() => abrir(id)}
          className="flex w-full items-center gap-3 rounded-xl border border-[#D9D5CC] bg-white p-4 text-left transition hover:bg-[#FBFAF6]">
          <I size={20} className="text-[#B38719]" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-[#18345C]">
              {t}
            </p>
            <p className="truncate text-sm text-[#71839B]">
              {r}
            </p>
          </div>
          <ChevronRight size={18} />
        </button>)}
      </div>
      <button
        onClick={() => abrir('salir')}
        className="mt-4 inline-flex items-center gap-2 rounded-xl border border-[#F0C7C3] bg-white px-4 py-3 font-semibold text-[#B42318]"><DoorOpen size={19} />Cerrar sesión</button>
    </aside>
    {modal && <Modal
      t={modal === 'personal' ? 'Información personal' : modal === 'contacto' ? 'Datos de contacto' : modal === 'laboral' ? 'Información laboral' : modal === 'seguridad' ? 'Seguridad' : modal === 'cambiarTelefono' ? 'Cambiar teléfono' : modal === 'verificarTelefono' ? 'Verificar teléfono' : modal === 'cambiarClave' ? 'Cambiar contraseña' : modal === 'foto' ? 'Cambiar foto' : 'Cerrar sesión'}
      close={() => setModal(null)}>
      {modal === 'personal' && <div className="space-y-4">
        <Campo l="Nombre completo">
          <input value={editNombre} onChange={e => setEditNombre(e.target.value)} className={inputClass} />
        </Campo>
        <Acciones
          cancel={() => setModal(null)}
          ok={guardarPersonal}
          text="Guardar cambios" />
      </div>}
      {modal === 'contacto' && <div className="space-y-4">
        <div className="space-y-2">
          <Campo l="Teléfono">
            <div className="flex flex-wrap items-center gap-2">
              <input type="tel" value={perfil.telefono} readOnly className={`${inputClass} !w-0 min-w-0 flex-1`} />
              <button
                type="button"
                onClick={() => abrir('cambiarTelefono')}
                className="shrink-0 rounded-lg border border-[#18345C] px-4 py-2.5 text-sm font-semibold text-[#18345C] hover:bg-[#F8F6F0]">
                Cambiar teléfono
              </button>
            </div>
          </Campo>
        </div>
        <div className="space-y-2">
          <Campo l="Correo electrónico">
            <input type="email" value={perfil.correo} readOnly className={inputClass} />
          </Campo>
        </div>
        <div className="mt-5 flex justify-end">
          <button onClick={() => setModal(null)} className="rounded-lg border border-[#D9D5CC] px-4 py-2 text-sm font-semibold text-[#18345C]">Cerrar</button>
        </div>
      </div>}
      {modal === 'laboral' && <><Dato l="Área" v={area} /><Dato l="Código de empleado" v={codigo} /><p className="mt-4 text-xs text-[#71839B]">La información laboral es informativa y corresponde al registro del empleado.</p></>}
      {modal === 'cambiarTelefono' && <div className="space-y-3">
        <Campo l="Nuevo número de teléfono">
          <div className="flex items-center gap-2">
            <span className="rounded-xl border border-[#D9D5CC] bg-[#F8F6F0] px-3 py-2.5 text-sm text-[#18345C]">+502</span>
            <input
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              value={nuevoTelefono}
              onChange={e => {
                setNuevoTelefono(e.target.value.replace(/\D/g, '').slice(0, 8));
                setMensajeTelefono('');
              }}
              className={inputClass} />
          </div>
        </Campo>
        {mensajeTelefono && <p role="status" className="rounded-lg bg-[#FFF1F0] px-3 py-2 text-sm text-[#B42318]">{mensajeTelefono}</p>}
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button type="button" onClick={() => setModal('contacto')} className="rounded-lg border border-[#D9D5CC] px-4 py-2 text-sm font-semibold text-[#18345C]">Cancelar</button>
          <button type="button" onClick={solicitarCodigoTelefono} disabled={solicitudTelefonoOcupada} className="rounded-lg bg-[#18345C] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">Enviar código</button>
        </div>
      </div>}
      {modal === 'verificarTelefono' && <div className="space-y-3">
        <p className="text-sm text-[#71839B]">Enviamos un código de verificación a:</p>
        <p className="font-semibold text-[#18345C]">{telefonoNuevoFormateado()}</p>
        <Campo l="Código de verificación">
          <div className="otp-row !my-3">
            {codigoTelefono.map((digit, index) => <input
              key={index}
              ref={element => { codigoTelefonoRefs.current[index] = element; }}
              type="text"
              inputMode="numeric"
              autoComplete={index === 0 ? 'one-time-code' : 'off'}
              maxLength={1}
              value={digit}
              onChange={event => cambiarCodigoTelefono(index, event.target.value)}
              onKeyDown={event => manejarTeclaCodigoTelefono(index, event)}
              onPaste={pegarCodigoTelefono} />)}
          </div>
        </Campo>
        <div className="text-center">
          <button
            type="button"
            onClick={solicitarCodigoTelefono}
            disabled={solicitudTelefonoOcupada}
            className="text-sm font-semibold text-[#18345C] underline disabled:opacity-50">
            Reenviar código
          </button>
        </div>
        {mensajeTelefono && <p role="status" className="rounded-lg bg-[#FFF1F0] px-3 py-2 text-sm text-[#B42318]">{mensajeTelefono}</p>}
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button type="button" onClick={() => {
            setCodigoTelefono(['', '', '', '', '', '']);
            setMensajeTelefono('');
            setModal('cambiarTelefono');
          }} className="rounded-lg border border-[#D9D5CC] px-4 py-2 text-sm font-semibold text-[#18345C]">Volver</button>
          <button type="button" onClick={verificarCodigoTelefono} className="rounded-lg bg-[#18345C] px-4 py-2 text-sm font-semibold text-white">Verificar código</button>
        </div>
      </div>}
      {modal === 'seguridad' && <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-xl border border-[#E1DDD4] bg-[#FBFAF6] p-4">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-[#F3E7BE] text-[#9A741A]">
            <KeyRound size={19} />
          </div>
          <div>
            <p className="font-semibold text-[#18345C]">Contraseña</p>
            <p className="text-sm text-[#71839B]">Administra la contraseña de acceso a tu cuenta.</p>
          </div>
        </div>
        <button onClick={() => {
          if (user?.staff) {
            window.location.assign('/panel/cambiar-contrasena');
            return;
          }
          if (!onCambiarClave) {
            setMensajeClave(tAuth('passwordChangeUnavailable'));
            return;
          }
          setMensajeClave('');
          setModal('cambiarClave');
        }} className="rounded-lg bg-[#18345C] px-4 py-2.5 font-semibold text-white">Cambiar contraseña</button>
        {mensajeClave && <p role="status" className="text-sm text-[#71839B]">{mensajeClave}</p>}
      </div>}
      {modal === 'cambiarClave' && <div className="space-y-3">
        <Campo l="Contraseña actual">
          <CampoClave
            value={clave.actual}
            visible={mostrandoClaves.actual}
            onChange={actual => {
              setClave({ ...clave, actual });
              setMensajeClave('');
            }}
            onToggle={() => setMostrandoClaves(actual => ({ ...actual, actual: !actual.actual }))}
            inputClass={inputClass} />
        </Campo>
        <Campo l="Nueva contraseña">
          <CampoClave
            value={clave.nueva}
            visible={mostrandoClaves.nueva}
            onChange={nueva => {
              setClave({ ...clave, nueva });
              setMensajeClave('');
            }}
            onToggle={() => setMostrandoClaves(actual => ({ ...actual, nueva: !actual.nueva }))}
            inputClass={inputClass} />
        </Campo>
        <Campo l="Confirmar nueva contraseña">
          <CampoClave
            value={clave.confirmar}
            visible={mostrandoClaves.confirmar}
            onChange={confirmar => {
              setClave({ ...clave, confirmar });
              setMensajeClave('');
            }}
            onToggle={() => setMostrandoClaves(actual => ({ ...actual, confirmar: !actual.confirmar }))}
            inputClass={inputClass} />
        </Campo>
        <p className="text-xs text-[#71839B]">Mínimo 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial.</p>
        {mensajeClave && <p className={`rounded-lg px-3 py-2 text-sm ${mensajeClave.includes('correctamente') ? 'bg-[#ECFDF3] text-[#067647]' : 'bg-[#FFF1F0] text-[#B42318]'}`}>
          {mensajeClave}
        </p>}
        <Acciones cancel={() => setModal('seguridad')} ok={actualizarClave} text="Actualizar contraseña" />
      </div>}
      {modal === 'foto' && <div className="text-center">
        <div className="mx-auto grid h-24 w-24 place-items-center overflow-hidden rounded-full bg-[#D8B94E] text-2xl font-bold">
          {perfil.foto ? <img src={perfil.foto} className="h-full w-full object-cover" alt="" /> : iniciales}
        </div>
        <input
          ref={ref}
          hidden
          type="file"
          accept="image/*"
          onChange={e => {
            const f = e.target.files?.[0];
            if (!f)
              return;
            const r = new FileReader();
            r.onload = () => guardar({ ...perfil, foto: String(r.result) });
            r.readAsDataURL(f);
          }} />
        <div className="mt-4 flex justify-center gap-2">
          <button onClick={() => ref.current?.click()} className="rounded-lg bg-[#18345C] px-4 py-2 font-semibold text-white">Seleccionar una foto</button>
          {perfil.foto && <button onClick={() => guardar({ ...perfil, foto: '' })} className="rounded-lg border px-4 py-2 font-semibold text-[#B42318]">Eliminar foto actual</button>}
        </div>
      </div>}
      {modal === 'salir' && <><p>¿Deseas cerrar tu sesión?</p>{mensajeClave && <p role="alert">{mensajeClave}</p>}<Acciones cancel={() => setModal(null)} ok={async () => {
        try {
          await logout();
          onClose();
          window.location.href = '/panel/login';
        } catch (error) {
          setMensajeClave(error instanceof Error ? error.message : 'No se pudo cerrar sesión.');
        }
      }} text="Cerrar sesión" danger /></>}
    </Modal>}
  </div>;
}
function Modal({ t, close, children }: {
  t: string;
  close: () => void;
  children: React.ReactNode;
}) {
  return <div className="fixed inset-0 z-[120] grid place-items-center bg-[#071D34]/50 p-4">
    <section className="max-h-[86vh] w-full max-w-[440px] overflow-y-auto rounded-2xl bg-white shadow-2xl">
      <header className="flex justify-between border-b border-[#E5E1D8] px-5 py-4">
        <h2 className="text-xl font-semibold text-[#18345C]">
          {t}
        </h2>
        <button onClick={close}>
          <X size={20} />
        </button>
      </header>
      <div className="p-5">
        {children}
      </div>
    </section>
  </div>;
}
function Dato({ l, v }: {
  l: string;
  v: string;
}) {
  return <div className="border-b border-[#E5E1D8] py-3">
    <p className="text-xs uppercase text-[#93A3B3]">
      {l}
    </p>
    <p className="font-semibold text-[#18345C]">
      {v}
    </p>
  </div>;
}
function Campo({ l, children }: {
  l: string;
  children: React.ReactNode;
}) {
  return <label>
    <span className="mb-1 block text-sm text-[#71839B]">
      {l}
    </span>
    {children}
  </label>;
}
function CampoClave({ value, visible, onChange, onToggle, inputClass }: {
  value: string;
  visible: boolean;
  onChange: (value: string) => void;
  onToggle: () => void;
  inputClass: string;
}) {
  return <div className="relative">
    <input
      type={visible ? 'text' : 'password'}
      value={value}
      onChange={e => onChange(e.target.value)}
      className={`${inputClass} pr-11`} />
    <button
      type="button"
      onClick={onToggle}
      aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
      className="absolute inset-y-0 right-0 grid w-10 place-items-center text-[#71839B]">
      {visible ? <EyeOff size={17} /> : <Eye size={17} />}
    </button>
  </div>;
}
function Acciones({ cancel, ok, text, danger = false }: {
  cancel: () => void;
  ok: () => void;
  text: string;
  danger?: boolean;
}) {
  return <div className="mt-5 flex flex-wrap justify-end gap-2">
    <button onClick={cancel} className="rounded-lg border border-[#D9D5CC] px-4 py-2 text-sm font-semibold text-[#18345C]">Cancelar</button>
    <button onClick={ok} className={`rounded-lg px-4 py-2 text-sm font-semibold text-white ${danger ? 'bg-[#B42318]' : 'bg-[#18345C]'}`}>
      {text}
    </button>
  </div>;
}
