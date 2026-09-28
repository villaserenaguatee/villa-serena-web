import { useEffect, useMemo, useState } from 'react';
import type { Empleado, RolPersonal, TurnoPersonal, PermisoModulo, EstadoAsistencia, } from '@/lib/pms/types';
import { generarId } from '@/data/pms';
import { guardarEmpleados } from '@/store/employeeStore';
import { Chip, Campo, INPUT_CLS, ASISTENCIA_META, PERMISO_LABEL, PlusIcon, } from '@/features/admin/pages/adminUtils';
const ROLES: RolPersonal[] = ['Recepción', 'Limpieza', 'Room Service', 'Mantenimiento', 'Administración'];
const TURNOS: TurnoPersonal[] = ['Mañana', 'Tarde', 'Noche'];
const PERMISOS: PermisoModulo[] = ['limpieza', 'roomservice', 'recepcion', 'admin', 'mantenimiento'];
const ASISTENCIAS: EstadoAsistencia[] = ['presente', 'ausente', 'descanso', 'pendiente'];
interface Props {
  empleados: Empleado[];
  onAgregar: (e: Omit<Empleado, 'id'>) => void;
  onCambiarAsistencia: (id: string, a: EstadoAsistencia) => void;
  onToggleActivo: (id: string) => void;
  onCambiarTurno: (id: string, turno: TurnoPersonal) => void;
  onTogglePermiso: (id: string, permiso: PermisoModulo) => void;
}
export default function Personal({ empleados, onAgregar, onCambiarAsistencia, onToggleActivo, onCambiarTurno, onTogglePermiso, }: Props) {
  const [filtroRol, setFiltroRol] = useState<RolPersonal | 'todos'>('todos');
  const [filtroTurno, setFiltroTurno] = useState<TurnoPersonal | 'todos'>('todos');
  const [creando, setCreando] = useState(false);
  const [seleccionado, setSeleccionado] = useState<string | null>(null);
  const [versionFotos, setVersionFotos] = useState(0);
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [verSolicitudes, setVerSolicitudes] = useState(false);
  useEffect(() => {
    const cargar = () => {
      try {
        setSolicitudes(JSON.parse(localStorage.getItem('vs-correcciones-personal') || '[]'));
      }
      catch {
        setSolicitudes([]);
      }
    };
    cargar();
    window.addEventListener('vs-correcciones-personal-updated', cargar);
    window.addEventListener('storage', cargar);
    return () => {
      window.removeEventListener('vs-correcciones-personal-updated', cargar);
      window.removeEventListener('storage', cargar);
    };
  },
    []);
  const resolverSolicitud = (id: string,
    aprobar: boolean) => {
      const req = solicitudes.find(x => x.id === id);
    if (!req)
      return;
    if (aprobar) {
      const lista = empleados.map(e => {
        if ((req.empleadoId && e.id === req.empleadoId) || (!req.empleadoId && e.codigoEmpleado === req.codigo)) {
          if (req.dato === 'Nombre completo')
            return { ...e, nombre: req.nuevo };
          if (req.dato === 'Teléfono')
            return { ...e, telefono: req.nuevo };
          if (req.dato === 'Correo electrónico')
            return { ...e, correo: req.nuevo };
        }
        return e;
      });
      guardarEmpleados(lista);
      const emp = lista.find(e => (req.empleadoId && e.id === req.empleadoId) || e.codigoEmpleado === req.codigo);
      if (emp) {
        const key = `vs-perfil-personal-${emp.correo.toLowerCase()}`;
        try {
          const old = JSON.parse(localStorage.getItem(key) || '{}');
          localStorage.setItem(key, JSON.stringify({ ...old, nombre: emp.nombre, telefono: emp.telefono, correo: emp.correo }));
        }
        catch { }
      }
    }
    const next = solicitudes.map(x => x.id === id ? { ...x, estado: aprobar ? 'aprobada' : 'rechazada', resueltaEn: new Date().toISOString() } : x);
    localStorage.setItem('vs-correcciones-personal', JSON.stringify(next));
    setSolicitudes(next);
    window.dispatchEvent(new Event('vs-correcciones-personal-updated'));
  };
  useEffect(() => {
    const actualizar = () => setVersionFotos(v => v + 1);
    window.addEventListener('vs-profile-updated', actualizar);
    window.addEventListener('storage', actualizar);
    return () => {
      window.removeEventListener('vs-profile-updated', actualizar);
      window.removeEventListener('storage', actualizar);
    };
  },
    []);
  const activos = empleados.filter(e => e.activo);
  const cuenta = (a: EstadoAsistencia) => activos.filter(e => e.asistencia === a).length;
  const cobertura = useMemo(() => TURNOS.map(t => ({
    turno: t,
    total: activos.filter(e => e.turno === t).length,
    presentes: activos.filter(e => e.turno === t && e.asistencia === 'presente').length,
  })),
    [activos]);
  const visibles = empleados
    .filter(e => (filtroRol === 'todos' || e.rol === filtroRol) && (filtroTurno === 'todos' || e.turno === filtroTurno))
    .sort((a, b) => Number(b.activo) - Number(a.activo) || a.nombre.localeCompare(b.nombre));
  return (<div className="flex-1 overflow-y-auto bg-[#F8F6F0]" style={{ fontFamily: '"Afacad", "Segoe UI", Arial, sans-serif' }}>
    <div className="px-4 sm:px-6 py-5 bg-white border-b border-[#E5E0D8]">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
        <div>
          <h1 className="text-[32px] font-semibold text-[#18345C] leading-tight">Gestión de personal</h1>
          <p className="text-[14px] text-[#AEBCC1] mt-1">{activos.length} empleados activos de {empleados.length}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setVerSolicitudes(v => !v)}
            className="relative grid h-11 w-11 place-items-center rounded-md border border-[#E5E0D8] bg-white text-[#18345C]"
            title="Solicitudes de corrección">
            <span className="text-xl">♢</span>
            {solicitudes.filter(x => x.estado === 'pendiente').length > 0 && <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-[#B42318] px-1 text-center text-xs font-bold text-white">
              {solicitudes.filter(x => x.estado === 'pendiente').length}
            </span>}
          </button>
          <button
            onClick={() => setCreando(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-[15px] font-semibold bg-[#18345C] text-white rounded-md hover:bg-[#102747] transition-colors">
            <PlusIcon /> Nuevo empleado
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Kpi valor={cuenta('presente')} label="Presentes hoy" color="#166534" />
        <Kpi valor={cuenta('ausente')} label="Ausentes" color="#991B1B" />
        <Kpi valor={cuenta('descanso')} label="En descanso" color="#1E40AF" />
        <Kpi valor={cuenta('pendiente')} label="Sin registrar" color="#78450A" />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3">
        {cobertura.map(c => (<div key={c.turno} className="bg-[#F8F6F0] border border-[#E5E0D8] rounded-lg px-3 py-2">
          <p className="text-[12px] text-[#6B7280]">Turno {c.turno}</p>
          <p className="text-[15px] font-semibold text-[#18345C]">
            {c.presentes}/{c.total} <span className="text-[12px] font-normal text-[#AEBCC1]">presentes</span>
          </p>
        </div>))}
      </div>

      <div className="flex gap-3 flex-wrap mt-4">
        <select
          value={filtroRol}
          onChange={e => setFiltroRol(e.target.value as RolPersonal | 'todos')}
          className="border border-[#E5E0D8] rounded-md px-3 py-2 text-sm bg-white text-[#1F2933] focus:outline-none focus:border-[#18345C]">
          <option value="todos">Todos los roles</option>
          {ROLES.map(r => <option key={r} value={r}>
            {r}
          </option>)}
        </select>
        <select
          value={filtroTurno}
          onChange={e => setFiltroTurno(e.target.value as TurnoPersonal | 'todos')}
          className="border border-[#E5E0D8] rounded-md px-3 py-2 text-sm bg-white text-[#1F2933] focus:outline-none focus:border-[#18345C]">
          <option value="todos">Todos los turnos</option>
          {TURNOS.map(t => <option key={t} value={t}>
            {t}
          </option>)}
        </select>
      </div>
    </div>

    {verSolicitudes && <div className="mx-4 mt-4 rounded-xl border border-[#E5E0D8] bg-white p-4 sm:mx-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold text-[#18345C]">Solicitudes de corrección</h2>
        <button onClick={() => setVerSolicitudes(false)} className="text-[#71839B]">×</button>
      </div>
      <div className="space-y-2">
        {solicitudes.length === 0 ? <p className="text-sm text-[#93A3B3]">No hay solicitudes.</p> : solicitudes.map(r => <div key={r.id} className="rounded-lg border border-[#E5E0D8] p-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-[#18345C]">
                {r.empleado}
              </p>
              <p className="text-sm text-[#52677F]">{r.dato}: <b>
                {r.actual}
              </b> → <b>
                  {r.nuevo}
                </b></p>
              <p className="mt-1 text-sm text-[#71839B]">Motivo: {r.motivo || '—'}</p>
            </div>
            <span className="text-xs font-semibold uppercase text-[#71839B]">
              {r.estado}
            </span>
          </div>
          {r.estado === 'pendiente' && <div className="mt-3 flex justify-end gap-2">
            <button onClick={() => resolverSolicitud(r.id, false)} className="rounded-lg border border-[#E5E0D8] px-3 py-2 text-sm">Rechazar</button>
            <button onClick={() => resolverSolicitud(r.id, true)} className="rounded-lg bg-[#18345C] px-3 py-2 text-sm font-semibold text-white">Aprobar</button>
          </div>}
        </div>)}
      </div>
    </div>}
    <div className="grid grid-cols-1 gap-4 px-4 py-5 sm:px-6 lg:grid-cols-2">
      {visibles.map(e => {
        const pct = e.tareasAsignadas > 0 ? Math.round((e.tareasCompletadas / e.tareasAsignadas) * 100) : 0;
        const am = ASISTENCIA_META[e.asistencia];
        const foto = fotoEmpleado(e, versionFotos);
        return (<button
          key={e.id}
          onClick={() => setSeleccionado(e.id)}
          className={`group flex items-center gap-4 rounded-xl border bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-[#B38719] hover:shadow-md ${e.activo ? 'border-[#E5E0D8]' : 'border-[#E5E0D8] opacity-60'}`}>
          <Avatar nombre={e.nombre} foto={foto} grande />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-[17px] font-semibold text-[#18345C]">
                {e.nombre}
              </h2>
              <Chip cls={am.chip}>
                {am.label}
              </Chip>
              {!e.activo && <Chip cls="bg-red-50 text-red-700 border-red-200">Inactivo</Chip>}
            </div>
            <p className="mt-1 text-sm font-medium text-[#52677F]">{e.rol} · Turno {e.turno}</p>
            <p className="mt-2 truncate text-xs text-[#93A3B3]">
              {e.correo}
            </p>
            <div className="mt-3 flex items-center gap-3">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#EEF0F2]">
                <div className="h-full rounded-full bg-[#18345C]" style={{ width: `${pct}%` }} />
              </div>
              <span className="text-xs font-semibold text-[#18345C]">{pct}%</span>
            </div>
          </div>
          <span className="text-xl text-[#AEBCC1] transition group-hover:translate-x-1 group-hover:text-[#B38719]">›</span>
        </button>);
      })}
    </div>

    {seleccionado && (() => {
      const e = empleados.find(x => x.id === seleccionado);
      if (!e)
        return null;
      return <FichaEmpleado
        empleado={e}
        foto={fotoEmpleado(e, versionFotos)}
        onCerrar={() => setSeleccionado(null)}
        onCambiarAsistencia={onCambiarAsistencia}
        onToggleActivo={onToggleActivo}
        onCambiarTurno={onCambiarTurno}
        onTogglePermiso={onTogglePermiso} />;
    })()}

    {creando && <FormNuevo onCancelar={() => setCreando(false)} onGuardar={x => {
      onAgregar(x);
      setCreando(false);
    }} />}
  </div>);
}
function FormNuevo({ onCancelar, onGuardar, }: {
  onCancelar: () => void;
  onGuardar: (e: Omit<Empleado, 'id'>) => void;
}) {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [rol, setRol] = useState<RolPersonal>('Recepción');
  const [turno, setTurno] = useState<TurnoPersonal>('Mañana');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [fechaContratacion, setFechaContratacion] = useState('');
  const [foto, setFoto] = useState('');
  const [permisos, setPermisos] = useState<PermisoModulo[]>([]);
  const [err, setErr] = useState('');
  function toggle(p: PermisoModulo) {
    setPermisos(prev => (prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]));
  }
  function guardar() {
    if (!nombre.trim() || !apellido.trim())
      return setErr('Nombre y apellido son obligatorios.');
    const prefijo: Record<RolPersonal, string> = { 'Recepción': 'REC', 'Limpieza': 'LIM', 'Room Service': 'RS', 'Mantenimiento': 'MAN', 'Administración': 'ADM' };
    const codigoEmpleado = `${prefijo[rol]}-${String(Date.now()).slice(-3)}`;
    if (!telefono.trim())
      return setErr('El teléfono es obligatorio.');
    if (!correo.trim())
      return setErr('El correo es obligatorio.');
    if (!fechaContratacion)
      return setErr('Selecciona la fecha de contratación.');
    onGuardar({
      nombre: `${nombre.trim()} ${apellido.trim()}`,
      codigoEmpleado: codigoEmpleado.trim().toUpperCase(),
      correo: correo.trim(),
      fechaContratacion,
      foto: foto || undefined,
      rol,
      turno,
      telefono: telefono.trim(),
      activo: true,
      permisos,
      tareasCompletadas: 0,
      tareasAsignadas: 0,
      puntualidadPct: 100,
      asistencia: 'pendiente',
    });
  }
  return (<div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center sm:p-4">
    <div className="absolute inset-0 bg-black/40" onClick={onCancelar} />
    <div className="relative z-10 bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[88vh] overflow-y-auto">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E0D8]">
        <h2 className="text-xl font-semibold text-[#18345C]">Nuevo empleado</h2>
        <button onClick={onCancelar} className="text-[#AEBCC1] hover:text-[#1F2933] p-1 text-lg leading-none">✕</button>
      </div>
      <div className="px-4 py-4 space-y-3">
        <div className="flex items-center gap-3 rounded-lg bg-[#F8F6F0] p-3">
          <Avatar nombre={`${nombre} ${apellido}`.trim() || 'Nuevo empleado'} foto={foto} grande />
          <div>
            <label className="inline-flex cursor-pointer rounded-lg border border-[#18345C] px-4 py-2 text-sm font-semibold text-[#18345C]">Agregar fotografía<input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={e => {
                const f = e.target.files?.[0];
                if (!f)
                  return;
                if (f.size > 2 * 1024 * 1024)
                  return setErr('La fotografía debe pesar menos de 2 MB.');
                const r = new FileReader();
                r.onload = () => setFoto(String(r.result));
                r.readAsDataURL(f);
              }} /></label>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Campo label="Nombre">
            <input type="text" value={nombre} onChange={e => {
              setNombre(e.target.value);
              setErr('');
            }} className={INPUT_CLS} />
          </Campo>
          <Campo label="Apellido">
            <input type="text" value={apellido} onChange={e => {
              setApellido(e.target.value);
              setErr('');
            }} className={INPUT_CLS} />
          </Campo>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Campo label="Área">
            <select value={rol} onChange={e => setRol(e.target.value as RolPersonal)} className={INPUT_CLS}>
              {ROLES.map(r => <option key={r} value={r}>
                {r}
              </option>)}
            </select>
          </Campo>
          <Campo label="Turno">
            <select value={turno} onChange={e => setTurno(e.target.value as TurnoPersonal)} className={INPUT_CLS}>
              {TURNOS.map(t => <option key={t} value={t}>
                {t}
              </option>)}
            </select>
          </Campo>
        </div>
        <Campo label="Teléfono">
          <input
            type="text"
            value={telefono}
            onChange={e => {
              setTelefono(e.target.value.replace(/\D/g, "").slice(0, 8));
              setErr('');
            }}
            maxLength={8}
            inputMode="numeric"
            className={INPUT_CLS} />
        </Campo>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Campo label="Correo electrónico">
            <input
              type="email"
              value={correo}
              onChange={e => {
                setCorreo(e.target.value);
                setErr('');
              }}
              placeholder="nombre@villaserena.gt"
              className={INPUT_CLS} />
          </Campo>
          <Campo label="Fecha de contratación">
            <input type="date" value={fechaContratacion} onChange={e => {
              setFechaContratacion(e.target.value);
              setErr('');
            }} className={INPUT_CLS} />
          </Campo>
        </div>
        <div>
          <p className="text-[10px] text-[#AEBCC1] uppercase tracking-widest mb-2">Permisos de acceso</p>
          <div className="flex flex-wrap gap-2">
            {PERMISOS.map(p => (<button
              key={p}
              type="button"
              onClick={() => toggle(p)}
              className={`text-[12px] font-medium px-3 py-1.5 rounded-md border transition-colors ${permisos.includes(p) ? 'bg-[#18345C] text-white border-[#18345C]' : 'bg-white text-[#6B7280] border-[#E5E0D8]'}`}>
              {PERMISO_LABEL[p]}
            </button>))}
          </div>
        </div>
        {err && <p className="text-xs text-[#991B1B]">
          {err}
        </p>}
      </div>
      <div className="flex flex-wrap justify-end gap-2 px-4 pb-4">
        <button onClick={onCancelar} className="min-h-11 px-4 text-sm border border-[#E5E0D8] text-[#6B7280] rounded-md hover:bg-[#F8F6F0] transition-colors">
          Cancelar
        </button>
        <button onClick={guardar} className="min-h-11 px-4 text-sm font-semibold bg-[#18345C] text-white rounded-md hover:bg-[#102747] transition-colors">
          Guardar empleado
        </button>
      </div>
    </div>
  </div>);
}
function Kpi({ valor, label, color }: {
  valor: number;
  label: string;
  color: string;
}) {
  return (<div className="bg-[#F8F6F0] border border-[#E5E0D8] rounded-lg px-3 py-2.5">
    <p className="text-[22px] font-bold leading-none" style={{ color }}>
      {valor}
    </p>
    <p className="text-[11px] text-[#6B7280] mt-1">
      {label}
    </p>
  </div>);
}
function iniciales(nombre: string) { return nombre.split(/\s+/).filter(Boolean).map(x => x[0]).slice(0, 2).join('').toUpperCase(); }
function fotoEmpleado(e: Empleado,
  version: number) {
    void version;
  if (typeof window === 'undefined')
    return e.foto || '';
  try {
    return JSON.parse(localStorage.getItem(`vs-perfil-personal-${e.correo.toLowerCase()}`) || '{}').foto || e.foto || '';
  }
  catch {
    return e.foto || '';
  }
}
function Avatar({ nombre, foto, grande }: {
  nombre: string;
  foto?: string;
  grande?: boolean;
}) {
  const s = grande ? 'h-16 w-16 text-lg' : 'h-12 w-12';
  return <span className={`grid shrink-0 place-items-center overflow-hidden rounded-full bg-[#F3E8B8] font-bold text-[#18345C] ${s}`}>
    {foto ? <img src={foto} alt={nombre} className="h-full w-full object-cover" /> : iniciales(nombre)}
  </span>;
}
function FichaEmpleado({ empleado: e, foto, onCerrar, onCambiarAsistencia, onToggleActivo, onCambiarTurno, onTogglePermiso }: {
  empleado: Empleado;
  foto: string;
  onCerrar: () => void;
  onCambiarAsistencia: (id: string, a: EstadoAsistencia) => void;
  onToggleActivo: (id: string) => void;
  onCambiarTurno: (id: string, t: TurnoPersonal) => void;
  onTogglePermiso: (id: string, p: PermisoModulo) => void;
}) {
  const pct = e.tareasAsignadas ? Math.round(e.tareasCompletadas / e.tareasAsignadas * 100) : 0, am = ASISTENCIA_META[e.asistencia];
  return <div className="fixed inset-0 z-50 flex justify-end bg-[#071D34]/40" onMouseDown={x => {
    if (x.target === x.currentTarget)
      onCerrar();
  }}>
    <aside className="h-full w-full max-w-xl overflow-y-auto bg-white shadow-2xl">
      <header className="sticky top-0 z-10 flex items-start justify-between border-b bg-white p-5">
        <div className="flex items-center gap-4">
          <Avatar nombre={e.nombre} foto={foto} grande />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.16em] text-[#B38719]">Ficha del empleado</p>
            <h2 className="text-2xl font-semibold text-[#18345C]">
              {e.nombre}
            </h2>
            <p className="text-sm text-[#71839B]">
              {e.rol}
            </p>
          </div>
        </div>
        <button onClick={onCerrar} className="text-2xl text-[#71839B]">×</button>
      </header>
      <div className="space-y-6 p-5">
        <div className="flex flex-wrap gap-2">
          <Chip cls={am.chip}>
            {am.label}
          </Chip>
          <Chip cls={e.activo ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}>
            {e.activo ? 'Empleado activo' : 'Empleado inactivo'}
          </Chip>
        </div>
        <section>
          <h3 className="mb-3 font-semibold text-[#18345C]">Información personal y laboral</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <DatoPersonal label="Correo electrónico" valor={e.correo} />
            <DatoPersonal label="Teléfono" valor={e.telefono} />
            <DatoPersonal label="Fecha de contratación" valor={formatoFechaEmpleado(e.fechaContratacion)} />
            <DatoPersonal label="Código de empleado" valor={e.codigoEmpleado} />
            <DatoPersonal label="Área" valor={e.rol} />
            <div className="rounded-xl bg-[#F8F6F0] p-4">
              <p className="text-[10px] uppercase tracking-wider text-[#93A3B3]">Turno</p>
              <select
                value={e.turno}
                onChange={x => onCambiarTurno(e.id, x.target.value as TurnoPersonal)}
                className="mt-1 w-full bg-transparent font-semibold text-[#18345C] outline-none">
                {TURNOS.map(t => <option key={t}>
                  {t}
                </option>)}
              </select>
            </div>
          </div>
        </section>
        <section className="rounded-xl border border-[#E5E0D8] p-4">
          <h3 className="font-semibold text-[#18345C]">Desempeño</h3>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <DatoPersonal label="Tareas completadas" valor={`${e.tareasCompletadas} de ${e.tareasAsignadas}`} />
            <DatoPersonal label="Puntualidad" valor={`${e.puntualidadPct}%`} />
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#EEF0F2]">
            <div className="h-full rounded-full bg-[#18345C]" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-2 text-right text-xs font-semibold text-[#18345C]">Rendimiento {pct}%</p>
        </section>
        <section>
          <h3 className="mb-3 font-semibold text-[#18345C]">Asistencia de hoy</h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {ASISTENCIAS.map(a => <button
              key={a}
              onClick={() => onCambiarAsistencia(e.id, a)}
              className={`rounded-lg border px-3 py-2 text-xs font-semibold ${e.asistencia === a ? ASISTENCIA_META[a].chip : 'border-[#E5E0D8] text-[#6B7280]'}`}>
              {ASISTENCIA_META[a].label}
            </button>)}
          </div>
        </section>
        <section>
          <h3 className="mb-3 font-semibold text-[#18345C]">Permisos de acceso</h3>
          <div className="flex flex-wrap gap-2">
            {PERMISOS.map(p => {
              const tiene = e.permisos.includes(p);
              return <button
                key={p}
                onClick={() => onTogglePermiso(e.id, p)}
                className={`rounded-lg border px-3 py-2 text-xs font-semibold ${tiene ? 'border-[#18345C] bg-[#18345C] text-white' : 'border-[#E5E0D8] text-[#6B7280]'}`}>
                {tiene ? '✓ ' : ''}
                {PERMISO_LABEL[p]}
              </button>;
            })}
          </div>
        </section>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => onToggleActivo(e.id)}
            className={`min-h-[44px] rounded-lg border px-4 py-2.5 text-sm font-semibold ${e.activo ? 'border-red-300 text-red-700' : 'border-emerald-300 text-emerald-700'}`}>
            {e.activo ? 'Desactivar empleado' : 'Activar empleado'}
          </button>
        </div>
      </div>
    </aside>
  </div>;
}
function DatoPersonal({ label, valor }: {
  label: string;
  valor: string;
}) {
  return <div className="rounded-xl bg-[#F8F6F0] p-4">
    <p className="text-[10px] uppercase tracking-wider text-[#93A3B3]">
      {label}
    </p>
    <p className="mt-1 break-words font-semibold text-[#18345C]">
      {valor}
    </p>
  </div>;
}
function formatoFechaEmpleado(iso: string) {
  if (!iso)
    return '—';
  return new Date(`${iso}T00:00:00`).toLocaleDateString('es-GT', { day: '2-digit', month: 'long', year: 'numeric' });
}
