'use client';
import { useMemo, useRef, useState } from 'react';
import { Camera, ChevronRight, Contact, DoorOpen, LockKeyhole, UserRound, BriefcaseBusiness, X, KeyRound } from 'lucide-react';
import { guardarEmpleados, leerEmpleados } from '@/store/employeeStore';
import { crearCorreccion, leerNotificacionesEmpleado } from '@/store/correctionStore';
import { useAuth } from '@/hooks/useAuth';
type Sec = 'personal' | 'contacto' | 'laboral' | 'seguridad' | 'cambiarClave' | 'foto' | 'salir' | null;
type Perfil = {
  nombre: string;
  telefono: string;
  correo: string;
  foto: string;
};
const inputClass = 'w-full rounded-xl border border-[#D9D5CC] bg-white px-3 py-2.5 text-[#18345C] outline-none transition focus:border-[#B58B2A] focus:ring-2 focus:ring-[#D8B94E]/20';
export default function StaffProfileModal({ open, onClose, name, role, email }: {
  open: boolean;
  onClose: () => void;
  name: string;
  role: string;
  email: string;
}) {
  const { logout } = useAuth();
  const area = useMemo(() => role.split('·')[0].trim().replace('Encargado de mantenimiento', 'Mantenimiento'), [role]);
  const empleadoCentral = leerEmpleados().find(e => e.correo === email) || leerEmpleados().find(e => e.nombre === name);
  const codigo = empleadoCentral?.codigoEmpleado ?? '—';
  const key = `vs-perfil-personal-${email.toLowerCase()}`;
  const base: Perfil = {
    nombre: empleadoCentral?.nombre ?? name,
    telefono: empleadoCentral?.telefono ?? '',
    correo: empleadoCentral?.correo ?? email,
    foto: empleadoCentral?.foto ?? ''
  };
  let stored = base;
  try {
    if (typeof window !== 'undefined')
      stored = { ...base, ...JSON.parse(localStorage.getItem(key) || '{}') };
  }
  catch { }
  const [perfil, setPerfil] = useState<Perfil>(stored),
    [modal, setModal] = useState<Sec>(null),
    [editNombre, setEditNombre] = useState(stored.nombre),
    [editTelefono, setEditTelefono] = useState(stored.telefono),
    [editCorreo, setEditCorreo] = useState(stored.correo),
    [clave, setClave] = useState({ actual: '', nueva: '', confirmar: '' }),
    [mensajeClave, setMensajeClave] = useState(''),
    [motivo, setMotivo] = useState(''),
    [confirmacion, setConfirmacion] = useState('');
  const ref = useRef<HTMLInputElement>(null);
  const esAdmin = area.toLowerCase().includes('administración');
  const notif = empleadoCentral ? leerNotificacionesEmpleado().find(n => (n.empleadoId && n.empleadoId === empleadoCentral.id) || n.codigo === codigo) : undefined;
  if (!open)
    return null;
  const iniciales = perfil.nombre.split(/\s+/).map(x => x[0]).slice(0, 2).join('').toUpperCase();
  function guardar(p: Perfil) {
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
    if (s === 'contacto') {
      setEditTelefono(perfil.telefono);
      setEditCorreo(perfil.correo);
    }
    if (s === 'seguridad') {
      setMensajeClave('');
      setClave({ actual: '', nueva: '', confirmar: '' });
    }
  }
  function guardarPersonal() {
    const n = editNombre.trim();
    if (!n)
      return;
    guardar({ ...perfil, nombre: n });
    setModal(null);
  }
  function guardarContacto() {
    const c = editCorreo.trim();
    if (!c)
      return;
    guardar({ ...perfil, telefono: editTelefono.trim(), correo: c });
    setModal(null);
  }
  function solicitar(dato: string,
    actual: string,
    nuevo: string) {
      if (!empleadoCentral || !nuevo.trim() || nuevo.trim() === actual.trim())
        return;
    crearCorreccion({ empleadoId: empleadoCentral.id, empleado: perfil.nombre, area, codigo, dato, actual, nuevo: nuevo.trim(), motivo: motivo.trim() || undefined });
    setConfirmacion('Tu solicitud de corrección fue enviada a Administración para su revisión.');
    setMotivo('');
    window.setTimeout(() => setConfirmacion(''), 4500);
  }
  function actualizarClave() {
    const ok = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(clave.nueva);
    if (!clave.actual) {
      setMensajeClave('Ingresa tu contraseña actual.');
      return;
    }
    if (!ok) {
      setMensajeClave('La nueva contraseña no cumple los requisitos.');
      return;
    }
    if (clave.nueva !== clave.confirmar) {
      setMensajeClave('La confirmación no coincide con la nueva contraseña.');
      return;
    }
    localStorage.setItem(`vs-password-updated-${email.toLowerCase()}`, new Date().toISOString());
    setClave({ actual: '', nueva: '', confirmar: '' });
    setMensajeClave('Contraseña actualizada correctamente.');
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
      {notif && <div className="mb-3 rounded-xl border border-[#D8B94E]/40 bg-[#FFF9E8] p-3 text-sm text-[#18345C]">
        <b>
          {notif.titulo}
        </b>
        <p>
          {notif.mensaje}
        </p>
        {notif.motivo && <p className="mt-1 text-[#71839B]">Motivo: {notif.motivo}</p>}
      </div>}
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
      t={modal === 'personal' ? 'Información personal' : modal === 'contacto' ? 'Datos de contacto' : modal === 'laboral' ? 'Información laboral' : modal === 'seguridad' ? 'Seguridad' : modal === 'cambiarClave' ? 'Cambiar contraseña' : modal === 'foto' ? 'Cambiar foto' : 'Cerrar sesión'}
      close={() => setModal(null)}>
      {modal === 'personal' && <div className="space-y-4">
        <Campo l="Nombre completo">
          <input value={editNombre} onChange={e => setEditNombre(e.target.value)} className={inputClass} />
        </Campo>
        {!esAdmin && <Campo l="Motivo o comentario (opcional)">
          <textarea value={motivo} onChange={e => setMotivo(e.target.value)} className={inputClass} />
        </Campo>}
        {confirmacion && <p className="rounded-lg bg-[#ECFDF3] p-3 text-sm text-[#067647]">
          <b>Solicitud enviada</b>
          <br />
          {confirmacion}
        </p>}
        <Acciones
          cancel={() => setModal(null)}
          ok={() => esAdmin ? guardarPersonal() : solicitar('Nombre completo', perfil.nombre, editNombre)}
          text={esAdmin ? 'Guardar cambios' : 'Solicitar corrección'} />
      </div>}
      {modal === 'contacto' && <div className="space-y-4">
        <Campo l="Teléfono">
          <input value={editTelefono} onChange={e => setEditTelefono(e.target.value)} className={inputClass} />
        </Campo>
        <Campo l="Correo electrónico">
          <input type="email" value={editCorreo} onChange={e => setEditCorreo(e.target.value)} className={inputClass} />
        </Campo>
        {!esAdmin && <Campo l="Motivo o comentario (opcional)">
          <textarea value={motivo} onChange={e => setMotivo(e.target.value)} className={inputClass} />
        </Campo>}
        {confirmacion && <p className="rounded-lg bg-[#ECFDF3] p-3 text-sm text-[#067647]">
          <b>Solicitud enviada</b>
          <br />
          {confirmacion}
        </p>}
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button onClick={() => setModal(null)} className="rounded-lg border border-[#D9D5CC] px-4 py-2 text-sm font-semibold text-[#18345C]">Cancelar</button>
          {esAdmin ? <button onClick={guardarContacto} className="rounded-lg bg-[#18345C] px-4 py-2 text-sm font-semibold text-white">Guardar cambios</button> : <><button
            onClick={() => solicitar('Teléfono', perfil.telefono, editTelefono)}
            className="rounded-lg border border-[#18345C] px-4 py-2 text-sm font-semibold text-[#18345C]">Solicitar teléfono</button><button
              onClick={() => solicitar('Correo electrónico', perfil.correo, editCorreo)}
              className="rounded-lg bg-[#18345C] px-4 py-2 text-sm font-semibold text-white">Solicitar correo</button></>}
        </div>
      </div>}
      {modal === 'laboral' && <><Dato l="Área" v={area} /><Dato l="Código de empleado" v={codigo} /><p className="mt-4 text-xs text-[#71839B]">La información laboral es informativa y corresponde al registro del empleado.</p></>}
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
          setMensajeClave('');
          setModal('cambiarClave');
        }} className="rounded-lg bg-[#18345C] px-4 py-2.5 font-semibold text-white">Cambiar contraseña</button>
      </div>}
      {modal === 'cambiarClave' && <div className="space-y-3">
        <Campo l="Contraseña actual">
          <input type="password" value={clave.actual} onChange={e => setClave({ ...clave, actual: e.target.value })} className={inputClass} />
        </Campo>
        <Campo l="Nueva contraseña">
          <input type="password" value={clave.nueva} onChange={e => setClave({ ...clave, nueva: e.target.value })} className={inputClass} />
        </Campo>
        <Campo l="Confirmar nueva contraseña">
          <input type="password" value={clave.confirmar} onChange={e => setClave({ ...clave, confirmar: e.target.value })} className={inputClass} />
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
      {modal === 'salir' && <><p>¿Deseas cerrar tu sesión?</p><Acciones cancel={() => setModal(null)} ok={() => {
        logout();
        onClose();
        window.location.href = '/login';
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
