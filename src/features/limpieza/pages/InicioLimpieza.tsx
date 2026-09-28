import type { Habitacion, Solicitud, EntradaHistorial } from '@/lib/pms/types';
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
function fechaHoy(): string {
  const d = new Date();
  return `${DIAS[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]}`;
}
function tipoHabitacionEnEspanol(tipo: string): string {
  if (tipo === 'Standard')
    return 'Estándar';
  return tipo;
}
function Chip({ cls, children }: {
  cls: string;
  children: React.ReactNode;
}) {
  return (<span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md uppercase tracking-wide border ${cls}`}>
    {children}
  </span>);
}
function EstadoBadge({ estado, tipo }: {
  estado: string;
  tipo: string;
}) {
  if (estado === 'pendiente') {
    return <Chip cls="bg-[#FFFBEF] text-[#78450A] border-[#F3D98B]">Pendiente</Chip>;
  }
  if (estado === 'en-limpieza' || estado === 'en-proceso') {
    return <Chip cls="bg-[#EFF6FF] text-[#1E40AF] border-[#93C5FD]">En proceso</Chip>;
  }
  if (tipo === 'limpieza') {
    return <Chip cls="bg-[#F0FAF4] text-[#166534] border-[#86EFAC]">Atendida</Chip>;
  }
  return <Chip cls="bg-[#F0FAF4] text-[#166534] border-[#86EFAC]">Entregado</Chip>;
}
function BedIcon({ size = 18 }: {
  size?: number;
}) {
  return (<svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true">
    <path d="M3 7v10" />
    <path d="M21 10v7" />
    <path d="M3 13h18" />
    <path d="M5 13V9.5A1.5 1.5 0 0 1 6.5 8h3A1.5 1.5 0 0 1 11 9.5V13" />
    <path d="M11 13v-2a2 2 0 0 1 2-2h5a3 3 0 0 1 3 3v1" />
    <path d="M5 17v2" />
    <path d="M19 17v2" />
  </svg>);
}
function PersonIcon() {
  return (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>);
}
function ClockIcon() {
  return (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>);
}
interface Props {
  habitaciones: Habitacion[];
  solicitudes: Solicitud[];
  historial: EntradaHistorial[];
  onIrMapa: () => void;
  onIrSolicitudes: () => void;
  onVerSolicitud: (id: string) => void;
  onComenzarLimpieza: (id: string) => void;
  onAbrirHabitacion: (id: string, iniciar: boolean) => void;
  usuarioActual?: string;
}
export default function Inicio({ habitaciones, solicitudes, historial, onIrMapa, onIrSolicitudes, onVerSolicitud, onComenzarLimpieza, onAbrirHabitacion, usuarioActual = 'Personal de limpieza', }: Props) {
  const misHabitaciones = habitaciones.filter(h => h.personal === usuarioActual);
  const misNumeros = new Set(misHabitaciones.map(h => h.numero));
  const pendientes = misHabitaciones.filter(h => h.estado === 'pendiente').length;
  const enLimpieza = misHabitaciones.filter(h => h.estado === 'en-limpieza').length;
  const misSolicitudes = solicitudes.filter(s => s.id.startsWith('salida-') || misNumeros.has(s.habitacionNumero));
  const solicitudesActivas = misSolicitudes.filter(s => s.estado === 'pendiente' ||
    s.estado === 'en-proceso' ||
    s.estado === 'en-limpieza');
  const habitacionesAsignadas = [...misHabitaciones].sort((a,
    b) => {
    const orden: Record<string, number> = {
      'en-limpieza': 0,
      pendiente: 1,
      limpia: 2,
    };
    const prioridadA = a.proximaLlegada && a.estado !== 'limpia' ? -1 : 0;
    const prioridadB = b.proximaLlegada && b.estado !== 'limpia' ? -1 : 0;
    if (prioridadA !== prioridadB)
      return prioridadA - prioridadB;
    return (orden[a.estado] ?? 9) - (orden[b.estado] ?? 9);
  });
  const historialPersonal = historial
    .filter(e => e.responsable === usuarioActual)
    .slice(0, 6);
  return (<div className="flex-1 overflow-y-auto bg-[#F8F6F0]" style={{ fontFamily: '"Afacad", "Segoe UI", Arial, sans-serif' }}>
    <style>
      {`
        @import url('https://fonts.googleapis.com/css2?family=Afacad:wght@400;500;600;700&display=swap');
      `}
    </style>

    <div className="bg-[#18345C] px-4 sm:px-8 py-5 sm:py-6">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-5">
        <div>
          <p className="text-[#AEBCC1] text-[10px] tracking-widest uppercase mb-1">
            {fechaHoy()}
          </p>

          <h1 className="text-white text-[32px] font-semibold leading-tight">
            Panel de limpieza
          </h1>
        </div>

      </div>

    </div>

    <div className="px-4 sm:px-8 py-5 sm:py-7 space-y-8">

      <section>
        <SectionHeader title="Habitaciones asignadas" />

        {habitacionesAsignadas.length === 0 ? (<EmptyCard msg="No tienes habitaciones asignadas." />) : (<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {habitacionesAsignadas.map(h => {
            const tareasDone = h.tareas.filter(t => t.completada).length;
            const total = h.tareas.length;
            const porcentaje = total > 0 ? Math.round((tareasDone / total) * 100) : 0;
            const prioritaria = Boolean(h.proximaLlegada) && h.estado !== 'limpia';
            return (<div key={h.id} className="bg-white border border-[#E5E0D8] rounded-xl p-4 relative overflow-hidden">
              {prioritaria && (<div className="absolute top-0 left-0 w-1 h-full bg-[#D8B94E]" />)}
              <img src={h.foto} alt={`Habitación ${h.numero}`} className="w-full h-36 object-cover rounded-lg mb-3" />

              <div className={prioritaria ? "pl-3" : ""}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg bg-[#F8F6F0] flex items-center justify-center text-[#18345C]">
                        <BedIcon />
                      </span>

                      <p className="text-[28px] font-semibold text-[#18345C] leading-none">
                        {h.numero}
                      </p>
                    </div>

                    <p className="text-[14px] text-[#AEBCC1] mt-1 ml-10">
                      {tipoHabitacionEnEspanol(h.tipo)}
                    </p>
                  </div>

                  {h.estado === 'limpia' ? (<Chip cls="bg-[#F0FAF4] text-[#166534] border-[#86EFAC]">
                    Limpia
                  </Chip>) : h.estado === 'en-limpieza' ? (<Chip cls="bg-[#EFF6FF] text-[#1E40AF] border-[#93C5FD]">
                    En limpieza
                  </Chip>) : (<Chip cls="bg-[#FFFBEF] text-[#78450A] border-[#F3D98B]">
                    Pendiente
                  </Chip>)}
                </div>

                {h.estado === 'en-limpieza' && (<div className="mb-3">
                  <div className="flex justify-between text-[13px] text-[#6B7280] mb-1">
                    <span>{tareasDone} de {total} tareas</span>
                    <span>{porcentaje}%</span>
                  </div>

                  <div className="h-1.5 bg-[#EEF0F2] rounded-full overflow-hidden">
                    <div className="h-full bg-[#18345C] rounded-full" style={{ width: `${porcentaje}%` }} />
                  </div>
                </div>)}

                {prioritaria && (<div className="inline-flex items-center gap-1.5 text-[12px] text-[#8A6818] bg-[#FFF8DD] border border-[#F3D98B] px-2.5 py-1 rounded-md mb-2">
                  <span>★</span>
                  <span>Prioritaria</span>
                </div>)}

                <div className="flex items-center gap-1.5 text-[13px] text-[#6B7280] mb-2">
                  <PersonIcon />
                  <span>
                    {h.personal}
                  </span>
                </div>

                {h.proximaLlegada && h.estado !== 'limpia' && (<div className="flex items-center gap-1.5 text-[14px] text-[#B88A18] font-medium mb-3">
                  <ClockIcon />
                  <span>Próxima llegada: {h.proximaLlegada}</span>
                </div>)}

                {h.estado === 'pendiente' && (<button
                  type="button"
                  onClick={() => onAbrirHabitacion(h.id, true)}
                  className="w-full py-2.5 text-[15px] font-semibold bg-[#18345C] text-white rounded-md hover:bg-[#102747] transition-colors">
                  Comenzar limpieza
                </button>)}

                {h.estado === 'en-limpieza' && (<button
                  type="button"
                  onClick={() => onAbrirHabitacion(h.id, false)}
                  className="w-full py-2.5 text-[15px] font-semibold border border-[#18345C] text-[#18345C] rounded-md hover:bg-[#F8F6F0] transition-colors">
                  Continuar limpieza
                </button>)}

                {h.estado === 'limpia' && (<div className="w-full py-2.5 text-[14px] font-semibold text-center text-[#15803D] bg-[#ECFDF3] border border-[#86EFAC] rounded-md">
                  ✓ Limpieza finalizada
                </div>)}
              </div>
            </div>);
          })}
        </div>)}
      </section>

      <section>
        <SectionHeader title="Solicitudes pendientes" onAction={onIrSolicitudes} actionLabel="Ver todas" />

        {solicitudesActivas.length === 0 ? (<EmptyCard msg="No tienes solicitudes pendientes." />) : (<div className="space-y-2">
          {solicitudesActivas.slice(0, 4).map(s => ((() => {
            const habitacion = habitaciones.find(h => h.numero === s.habitacionNumero);
            return (<div key={s.id} className="bg-white border border-[#E5E0D8] rounded-xl p-3 sm:p-4 flex items-center gap-3">
              {habitacion ? <img src={habitacion.foto} alt={`Habitación ${habitacion.numero}`} className="h-14 w-20 shrink-0 rounded-lg object-cover" /> : <div className="w-9 h-9 rounded-lg bg-[#F8F6F0] flex items-center justify-center shrink-0 text-[#18345C]">
                <BedIcon size={16} />
              </div>}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold text-[#18345C]">
                    Habitación {s.habitacionNumero}
                  </p>

                  <EstadoBadge estado={s.estado} tipo={s.tipo} />
                </div>

                <p className="text-xs text-[#6B7280] truncate mt-0.5">
                  {s.descripcion}
                  {s.cantidad ? ` · ${s.cantidad} unidades` : ''}
                </p>

                <p className="text-[10px] text-[#AEBCC1]">
                  {s.id.startsWith('salida-') ? `Aviso automático del sistema · ${s.hora}` : s.hora}
                </p>
              </div>

              <button
                onClick={() => onVerSolicitud(s.id)}
                className="shrink-0 px-3 py-2 text-[15px] font-semibold border border-[#18345C] text-[#18345C] hover:bg-[#18345C] hover:text-white rounded-md transition-colors">
                Ver
              </button>
            </div>);
          })()))}
        </div>)}
      </section>

      {historialPersonal.length > 0 && (<section>
        <SectionHeader title="Actividad reciente" />

        <div className="bg-white border border-[#E5E0D8] rounded-xl divide-y divide-[#F0EBE3] overflow-hidden">
          {historialPersonal.map((e,
            i) => ((() => {
              const habitacion = habitaciones.find(h => h.numero === e.habitacionNumero);
              return (<div key={e.id} className="flex items-center gap-3 px-4 py-2.5">
                <div className={`w-2 h-2 rounded-full shrink-0 ${i === 0 ? 'bg-[#D8B94E]' : 'bg-[#E5E0D8]'}`} />

                {habitacion ? <img src={habitacion.foto} alt={`Habitación ${habitacion.numero}`} className="h-11 w-16 shrink-0 rounded-md object-cover" /> : <div className="grid h-11 w-16 shrink-0 place-items-center rounded-md bg-[#F8F6F0] text-[#18345C]">
                  <BedIcon size={16} />
                </div>}

                <p className="text-[10px] text-[#AEBCC1] w-16 shrink-0 hidden lg:block">
                  {e.fechaHora}
                </p>

                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <BedIcon size={14} />

                  <p className="text-sm text-[#1F2933] truncate">
                    <span className="font-semibold">
                      {e.habitacionNumero}
                    </span>
                    {' — '}
                    {e.tipo}
                  </p>
                </div>
              </div>);
            })()))}
        </div>
      </section>)}

    </div>
  </div>);
}
function StatCard({ valor, label, color, }: {
  valor: number;
  label: string;
  color: string;
}) {
  return (<div className="flex flex-col items-center justify-center bg-[#102747] rounded-lg py-3 px-2 gap-1">
    <span className="text-2xl sm:text-3xl font-bold leading-none" style={{ color }}>
      {valor}
    </span>

    <span className="text-[9px] sm:text-[10px] text-center leading-tight text-[#AEBCC1]">
      {label}
    </span>
  </div>);
}
function StatCardBtn({ valor, label, color, onClick, }: {
  valor: number;
  label: string;
  color: string;
  onClick: () => void;
}) {
  return (<button
    onClick={onClick}
    className="flex flex-col items-center justify-center bg-[#102747] rounded-lg py-3 px-2 gap-1 hover:bg-[#18345C] transition-colors">
    <span className="text-2xl sm:text-3xl font-bold leading-none" style={{ color }}>
      {valor}
    </span>

    <span className="text-[9px] sm:text-[10px] text-center leading-tight text-[#AEBCC1]">
      {label}
    </span>
  </button>);
}
function SectionHeader({ title, onAction, actionLabel, }: {
  title: string;
  onAction?: () => void;
  actionLabel?: string;
}) {
  return (<div className="flex items-center justify-between mb-4">
    <h2 className="text-[24px] font-semibold text-[#18345C] leading-tight">
      {title}
    </h2>

    {onAction && actionLabel && (<button
      onClick={onAction}
      className="text-xs text-[#18345C] hover:text-[#D8B94E] font-medium transition-colors flex items-center gap-1 shrink-0 ml-2">
      {actionLabel}

      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </button>)}
  </div>);
}
function EmptyCard({ msg }: {
  msg: string;
}) {
  return (<div className="bg-white border border-[#E5E0D8] rounded-xl p-6 text-center text-sm text-[#AEBCC1]">
    {msg}
  </div>);
}
