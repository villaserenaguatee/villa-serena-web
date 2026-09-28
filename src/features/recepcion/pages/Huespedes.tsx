import { useMemo, useState } from 'react';
import type { Huesped, Reserva, HabitacionHotel, TipoDocumento } from '@/lib/pms/types';
import { formatoFecha } from '@/data/pms';
import { publicRoomForHotelType } from '@/data/publicRooms';
import { dinero, Chip, RESERVA_META, calcularCuenta, Campo, INPUT_CLS, SearchIcon, PlusIcon, CloseIcon, UserIcon, } from '@/features/recepcion/pages/recUtils';
interface Props {
  huespedes: Huesped[];
  reservas: Reserva[];
  habitaciones: HabitacionHotel[];
  onRegistrar: (h: Omit<Huesped, 'id' | 'creadoEn'>) => void;
  onActualizar: (id: string, cambios: Partial<Huesped>) => void;
  onAbrirReserva: (id: string) => void;
}
interface Form {
  nombre: string;
  tipoDocumento: TipoDocumento;
  documento: string;
  telefono: string;
  correo: string;
  nacionalidad: string;
  apellidos: string;
  prefijo: string;
}
const FORM_VACIO: Form = {
  nombre: '',
  tipoDocumento: 'DPI',
  documento: '',
  telefono: '',
  correo: '',
  nacionalidad: 'Guatemalteca',
  apellidos: '',
  prefijo: '+502',
};
export default function Huespedes({ huespedes, reservas, habitaciones, onRegistrar, onActualizar, onAbrirReserva }: Props) {
  const [q, setQ] = useState('');
  const [registrando, setRegistrando] = useState(false);
  const [perfilId, setPerfilId] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(FORM_VACIO);
  const [revisando, setRevisando] = useState(false);
  const [errores, setErrores] = useState<Partial<Record<keyof Form, string>>>({});
  const filtrados = useMemo(() => {
    const t = q.trim().toLowerCase();
    return [...huespedes]
      .filter(h => !t || h.nombre.toLowerCase().includes(t))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  },
    [huespedes, q]);
  const perfil = huespedes.find(h => h.id === perfilId) ?? null;
  function validar(): boolean {
    const e: Partial<Record<keyof Form, string>> = {};
    if (!form.nombre.trim())
      e.nombre = 'El nombre es obligatorio.';
    if (!form.apellidos.trim())
      e.apellidos = 'El apellido es obligatorio.';
    if (!form.documento.trim())
      e.documento = 'El DPI o pasaporte es obligatorio.';
    if (!form.telefono.trim())
      e.telefono = 'El teléfono es obligatorio.';
    if (!form.correo.trim())
      e.correo = 'El correo es obligatorio.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo.trim()))
      e.correo = 'Correo no válido.';
    if (!form.nacionalidad)
      e.nacionalidad = 'Selecciona la nacionalidad.';
    setErrores(e);
    return Object.keys(e).length === 0;
  }
  function guardar() {
    if (!validar())
      return;
    onRegistrar({
      nombre: `${form.nombre.trim()} ${form.apellidos.trim()}`.trim(),
      tipoDocumento: form.tipoDocumento,
      documento: form.documento.trim(),
      telefono: `${form.prefijo} ${form.telefono.trim()}`,
      correo: form.correo.trim(),
      nacionalidad: form.nacionalidad,
    });
    setForm(FORM_VACIO);
    setErrores({});
    setRegistrando(false);
    setRevisando(false);
  }
  return (<div className="flex-1 overflow-y-auto bg-[#F8F6F0]" style={{ fontFamily: '"Afacad", "Segoe UI", Arial, sans-serif' }}>
    <div className="px-4 sm:px-6 py-5 bg-white border-b border-[#E5E0D8]">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
        <div>
          <h1 className="text-[32px] font-semibold text-[#18345C] leading-tight">Huéspedes</h1>
          <p className="text-[15px] text-[#AEBCC1] mt-1">{huespedes.length} registrados</p>
        </div>
        <button
          onClick={() => {
            setForm(FORM_VACIO);
            setErrores({});
            setRevisando(false);
            setRegistrando(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 text-[15px] font-semibold bg-[#18345C] text-white rounded-md hover:bg-[#102747] transition-colors">
          <PlusIcon />
          Registrar huésped
        </button>
      </div>

      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#AEBCC1]">
          <SearchIcon size={15} />
        </span>
        <input
          type="text"
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Buscar por nombre completo…"
          className="w-full border border-[#E5E0D8] rounded-md pl-9 pr-3 py-2.5 text-sm bg-white" />
      </div>
    </div>

    <div className="px-4 sm:px-6 py-5">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtrados.map(h => {
          const estancias = reservas.filter(r => r.huespedId === h.id).length;
          return (<button
            key={h.id}
            onClick={() => setPerfilId(h.id)}
            className="text-left bg-white border border-[#E5E0D8] rounded-xl p-4 hover:border-[#18345C] transition-colors">
            <div className="flex items-center gap-3">
              {h.foto ? <img src={h.foto} alt={h.nombre} className="h-11 w-11 shrink-0 rounded-full object-cover" /> : <span className="w-11 h-11 rounded-full bg-[#EFF6FF] text-[#1E40AF] flex items-center justify-center shrink-0 text-sm font-bold">
                {iniciales(h.nombre)}
              </span>}
              <div className="min-w-0">
                <p className="text-[16px] font-semibold text-[#18345C] truncate">
                  {h.nombre}
                </p>
                <p className="text-[12px] text-[#AEBCC1]">{h.tipoDocumento} •••• {h.documento.slice(-4)}</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-[#F0EBE3] text-[13px] text-[#6B7280] space-y-0.5">
              <p>
                {h.telefono.replace(/\d(?=.*\d{2})/g, '•')}
              </p>
              <p className="truncate">
                {h.correo.replace(/^(.{2}).*(@.*)$/, '$1••••••$2')}
              </p>
              <p className="text-[#AEBCC1]">{h.nacionalidad} · {estancias} reserva(s)</p>
            </div>
          </button>);
        })}
      </div>
    </div>

    {registrando && (<div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/40" onClick={() => {
        setRegistrando(false);
        setRevisando(false);
      }} />
      <div className="relative z-10 bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-4xl max-h-[94vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b sticky top-0 bg-white z-10">
          <div>
            <p className="text-[11px] tracking-[.18em] text-[#B38719] uppercase">Datos del huésped</p>
            <h2 className="text-[28px] font-semibold text-[#18345C]">
              {revisando ? 'Revisar datos' : 'Registrar huésped'}
            </h2>
          </div>
          <button onClick={() => {
            setRegistrando(false);
            setRevisando(false);
          }} className="text-2xl text-[#AEBCC1]">×</button>
        </div>
        {!revisando ? <><div className="p-6 grid sm:grid-cols-2 gap-4">
          <Campo label="Nombre" error={errores.nombre}>
            <input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} className={INPUT_CLS} />
          </Campo>
          <Campo label="Apellidos" error={errores.apellidos}>
            <input value={form.apellidos} onChange={e => setForm(f => ({ ...f, apellidos: e.target.value }))} className={INPUT_CLS} />
          </Campo>
          <Campo label="Tipo de documento">
            <select value={form.tipoDocumento} onChange={e => setForm(f => ({ ...f, tipoDocumento: e.target.value as TipoDocumento }))} className={INPUT_CLS}>
              <option>DPI</option>
              <option>Pasaporte</option>
            </select>
          </Campo>
          <Campo label="Número de documento" error={errores.documento}>
            <input
              value={form.documento}
              onChange={e => setForm(f => ({ ...f, documento: e.target.value.replace(f.tipoDocumento === 'DPI' ? /\D/g : /[^A-Za-z0-9]/g, '').slice(0, f.tipoDocumento === 'DPI' ? 13 : 20) }))}
              maxLength={form.tipoDocumento === 'DPI' ? 13 : 20}
              className={INPUT_CLS} />
          </Campo>
          <Campo label="Correo electrónico" error={errores.correo}>
            <input type="email" value={form.correo} onChange={e => setForm(f => ({ ...f, correo: e.target.value }))} className={INPUT_CLS} />
          </Campo>
          <Campo label="Teléfono" error={errores.telefono}>
            <div className="flex gap-3">
              <select value={form.prefijo} onChange={e => setForm(f => ({ ...f, prefijo: e.target.value }))} className={`${INPUT_CLS} !w-36`}>
                <option value="+502">+502</option>
                <option value="+52">+52</option>
                <option value="+1">+1</option>
                <option value="+503">+503</option>
                <option value="+504">+504</option>
              </select>
              <input
                value={form.telefono}
                onChange={e => setForm(f => ({ ...f, telefono: e.target.value.replace(/\D/g, "").slice(0, ["+1", "+52"].includes(f.prefijo) ? 10 : 8) }))}
                maxLength={["+1", "+52"].includes(form.prefijo) ? 10 : 8}
                className={`${INPUT_CLS} flex-1`} />
            </div>
          </Campo>
          <Campo label="Nacionalidad" error={errores.nacionalidad}>
            <input value={form.nacionalidad} onChange={e => setForm(f => ({ ...f, nacionalidad: e.target.value }))} className={INPUT_CLS} />
          </Campo>
        </div><div className="px-6 pb-6 flex justify-end">
            <button
              onClick={() => {
                if (validar())
                  setRevisando(true);
              }}
              className="px-10 py-3 bg-[#18345C] text-white rounded-md font-semibold">REVISAR DATOS</button>
          </div></> : <><div className="p-7 grid sm:grid-cols-2 gap-x-10 gap-y-6">
            <Dato k="Huésped" v={`${form.nombre} ${form.apellidos}`.trim()} />
            <Dato k={form.tipoDocumento} v={form.documento} />
            <Dato k="Correo" v={form.correo} />
            <Dato k="Teléfono" v={`${form.prefijo} ${form.telefono}`} />
            <Dato k="Nacionalidad" v={form.nacionalidad} />
          </div><div className="px-7 pb-7 flex justify-end gap-3">
            <button onClick={() => setRevisando(false)} className="px-7 py-3 border border-[#18345C] text-[#18345C] rounded-md font-semibold">Editar</button>
            <button onClick={guardar} className="px-10 py-3 bg-[#18345C] text-white rounded-md font-semibold">GUARDAR HUÉSPED</button>
          </div></>}
      </div>
    </div>)}

    {perfil && (<PerfilHuesped
      huesped={perfil}
      reservas={reservas.filter(r => r.huespedId === perfil.id)}
      habitaciones={habitaciones}
      onCerrar={() => setPerfilId(null)}
      onActualizar={onActualizar}
      onAbrirReserva={id => {
        setPerfilId(null);
        onAbrirReserva(id);
      }} />)}
  </div>);
}
function PerfilHuesped({ huesped, reservas, habitaciones, onCerrar, onActualizar, onAbrirReserva, }: {
  huesped: Huesped;
  reservas: Reserva[];
  habitaciones: HabitacionHotel[];
  onCerrar: () => void;
  onActualizar: (id: string, cambios: Partial<Huesped>) => void;
  onAbrirReserva: (id: string) => void;
}) {
  const ordenadas = [...reservas].sort((a, b) => b.fechaEntrada.localeCompare(a.fechaEntrada));
  const historicas = ordenadas.filter(r => r.estado === 'finalizada');
  const partesNombre = huesped.nombre.trim().split(/\s+/);
  const telefonoSeparado = huesped.telefono.match(/^(\+\d+)\s*(.*)$/);
  const [editando, setEditando] = useState(false);
  const [ed, setEd] = useState({
    nombre: partesNombre[0] || '',
    apellidos: partesNombre.slice(1).join(' '),
    tipoDocumento: huesped.tipoDocumento,
    documento: huesped.documento,
    prefijo: telefonoSeparado?.[1] || '+502',
    telefono: telefonoSeparado?.[2] || huesped.telefono,
    correo: huesped.correo,
    nacionalidad: huesped.nacionalidad
  });
  return (<div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center sm:p-4">
    <div className="absolute inset-0 bg-black/40" onClick={onCerrar} />
    <div className="relative z-10 bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-3xl max-h-[92vh] overflow-y-auto">
      <div className="flex items-start justify-between gap-3 px-5 sm:px-6 py-4 border-b border-[#E5E0D8] sticky top-0 bg-white">
        <div className="flex items-center gap-3">
          {huesped.foto ? <img src={huesped.foto} alt={huesped.nombre} className="h-12 w-12 shrink-0 rounded-full object-cover" /> : <span className="w-12 h-12 rounded-full bg-[#EFF6FF] text-[#1E40AF] flex items-center justify-center shrink-0 text-sm font-bold">
            {iniciales(huesped.nombre)}
          </span>}
          <div>
            <h2 className="text-[22px] font-semibold text-[#18345C] leading-none">
              {huesped.nombre}
            </h2>
            <p className="text-[13px] text-[#AEBCC1] mt-1">
              {huesped.tipoDocumento}
              {huesped.documento}
            </p>
          </div>
        </div>
        <button onClick={onCerrar} className="text-[#AEBCC1] hover:text-[#1F2933] p-1 shrink-0">
          <CloseIcon />
        </button>
      </div>

      <div className="px-5 sm:px-6 py-5 space-y-5">
        {!editando ? <><div className="grid gap-3 rounded-xl border border-[#E5E0D8] bg-[#FCFBF8] p-4 text-[13px] sm:grid-cols-2 lg:grid-cols-3">
          <Dato k="Nombre completo" v={huesped.nombre} />
          <Dato k="Documento" v={`${huesped.tipoDocumento} · ${huesped.documento}`} />
          <Dato k="Teléfono" v={huesped.telefono} />
          <Dato k="Correo electrónico" v={huesped.correo} />
          <Dato k="Nacionalidad" v={huesped.nacionalidad} />
          <Dato k="Reservas registradas" v={String(reservas.length)} />
          <Dato k="Huésped desde" v={formatoFecha(huesped.creadoEn)} />
        </div><button onClick={() => setEditando(true)} className="px-4 py-2 border border-[#18345C] text-[#18345C] rounded-md text-sm font-semibold">Editar datos</button></> : <div className="rounded-xl border border-[#E5E0D8] p-4">
          <h3 className="mb-4 font-semibold text-[#18345C]">Editar datos del huésped</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Campo label="Nombre">
              <input value={ed.nombre} onChange={e => setEd({ ...ed, nombre: e.target.value })} className={INPUT_CLS} />
            </Campo>
            <Campo label="Apellidos">
              <input value={ed.apellidos} onChange={e => setEd({ ...ed, apellidos: e.target.value })} className={INPUT_CLS} />
            </Campo>
            <Campo label="Tipo de documento">
              <select value={ed.tipoDocumento} onChange={e => setEd({ ...ed, tipoDocumento: e.target.value as TipoDocumento })} className={INPUT_CLS}>
                <option>DPI</option>
                <option>Pasaporte</option>
              </select>
            </Campo>
            <Campo label="Número de documento">
              <input
                value={ed.documento}
                onChange={e => setEd({ ...ed, documento: e.target.value.replace(ed.tipoDocumento === 'DPI' ? /\D/g : /[^A-Za-z0-9]/g, "").slice(0, ed.tipoDocumento === 'DPI' ? 13 : 20) })}
                maxLength={ed.tipoDocumento === 'DPI' ? 13 : 20}
                className={INPUT_CLS} />
            </Campo>
            <Campo label="Correo electrónico">
              <input type="email" value={ed.correo} onChange={e => setEd({ ...ed, correo: e.target.value })} className={INPUT_CLS} />
            </Campo>
            <Campo label="Teléfono">
              <div className="flex gap-2">
                <select value={ed.prefijo} onChange={e => setEd({ ...ed, prefijo: e.target.value })} className={`${INPUT_CLS} !w-32`}>
                  <option value="+502">+502</option>
                  <option value="+52">+52</option>
                  <option value="+1">+1</option>
                  <option value="+503">+503</option>
                  <option value="+504">+504</option>
                </select>
                <input
                  value={ed.telefono}
                  onChange={e => setEd({ ...ed, telefono: e.target.value.replace(/\D/g, "").slice(0, ["+1", "+52"].includes(ed.prefijo) ? 10 : 8) })}
                  maxLength={["+1", "+52"].includes(ed.prefijo) ? 10 : 8}
                  inputMode="numeric"
                  className={`${INPUT_CLS} flex-1`} />
              </div>
            </Campo>
            <Campo label="Nacionalidad">
              <input value={ed.nacionalidad} onChange={e => setEd({ ...ed, nacionalidad: e.target.value })} className={INPUT_CLS} />
            </Campo>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button onClick={() => setEditando(false)} className="px-5 py-2.5 border rounded-md text-sm">Cancelar</button>
            <button
              disabled={!ed.nombre.trim() || !ed.apellidos.trim() || !ed.documento.trim() || !ed.correo.trim() || !ed.telefono.trim()}
              onClick={() => {
                onActualizar(huesped.id,
                  {
                    nombre: `${ed.nombre.trim()} ${ed.apellidos.trim()}`,
                    tipoDocumento: ed.tipoDocumento,
                    documento: ed.documento.trim(),
                    correo: ed.correo.trim(),
                    telefono: `${ed.prefijo} ${ed.telefono.trim()}`,
                    nacionalidad: ed.nacionalidad
                  });
                setEditando(false);
              }}
              className="px-5 py-2.5 bg-[#18345C] text-white rounded-md text-sm font-semibold disabled:opacity-40">Guardar cambios</button>
          </div>
        </div>}

        <div className="rounded-xl border border-[#BFD4EA] bg-[#F5FAFF] p-4">
          <p className="text-[10px] uppercase tracking-widest text-[#71839B]">Cuenta del huésped</p>
          <div className="mt-1 flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-[#18345C]">
                {ordenadas.length > 0 ? 'Cuenta vinculada' : 'Se vinculará con la primera reserva'}
              </p>
              <p className="text-[12px] text-[#52677F]">Las nuevas reservas realizadas para esta persona se asociarán automáticamente al mismo perfil.</p>
            </div>
            {ordenadas.length > 0 && <span className="shrink-0 rounded-full bg-[#DCFCE7] px-3 py-1 text-xs font-semibold text-[#166534]">Activa</span>}
          </div>
        </div>

        <div>
          <p className="text-[10px] text-[#AEBCC1] uppercase tracking-widest mb-2">
            Historial de estadías ({historicas.length})
          </p>
          {ordenadas.length === 0 ? (<p className="text-[13px] text-[#AEBCC1]">Sin reservas registradas.</p>) : (<div className="border border-[#E5E0D8] rounded-xl divide-y divide-[#F0EBE3]">
            {ordenadas.map(r => {
              const hab = habitaciones.find(h => h.id === r.habitacionId) ?? null;
              const cuenta = calcularCuenta(r, hab);
              const meta = RESERVA_META[r.estado];
              return (<button key={r.id} onClick={() => onAbrirReserva(r.id)} className="w-full text-left px-4 py-3 hover:bg-[#F8F6F0] transition-colors">
                <div className="flex gap-4">
                  {(() => {
                    const visual = publicRoomForHotelType(hab?.tipo ?? 'Standard');
                    return <img src={visual.image} alt={`Habitación ${hab?.numero || ''}`} className="w-28 h-20 object-cover rounded-lg shrink-0" />;
                  })()}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[14px] font-semibold text-[#18345C]">
                        {r.codigo}
                      </span>
                      <Chip cls={meta.chip}>
                        {meta.label}
                      </Chip>
                      <span className="text-[12px] text-[#AEBCC1]">Hab. {hab?.numero ?? '—'}</span>
                    </div>
                    <p className="text-[13px] text-[#6B7280] mt-1">
                      {formatoFecha(r.fechaEntrada)} → {formatoFecha(r.fechaSalida)} · {cuenta.noches} noche(s)
                    </p>
                    <p className="text-[12px] text-[#AEBCC1] mt-0.5">
                      Total {dinero(cuenta.total)} · pagado {dinero(cuenta.pagado)}
                      {r.servicios.length > 0 && ` · ${r.servicios.length} servicio(s)`}
                    </p>
                    <p className="text-[12px] text-[#18345C] mt-1">
                      {hab ? `Habitación ${hab.numero} · Piso ${hab.piso}` : 'Habitación sin asignar'}
                    </p>
                  </div>
                </div>
              </button>);
            })}
          </div>)}
        </div>
      </div>
    </div>
  </div>);
}
function Dato({ k, v }: {
  k: string;
  v: string;
}) {
  return (<div>
    <p className="text-[11px] text-[#AEBCC1]">
      {k}
    </p>
    <p className="text-[13px] text-[#1F2933] font-medium break-words">
      {v}
    </p>
  </div>);
}
function iniciales(nombre: string) { return nombre.trim().split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase()).join('') || 'H'; }
