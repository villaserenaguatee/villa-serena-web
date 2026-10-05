import type { Habitacion, Solicitud, Incidencia, ObjetoOlvidado, EntradaHistorial, ItemMenu, Pedido, TurnoRS, TipoHabitacion, HabitacionHotel, Huesped, Reserva, SolicitudHuesped, ReglaTarifa, Promocion, Empleado, Insumo, MovimientoInsumo, OrdenTrabajo, Activo, TareaPreventiva, Repuesto, EstadoOT, CambioEstadoOT, OfertaHabitacion, ServicioCatalogo, PedidoHuesped, MensajeChat, Domotica, TurnoAmenidad, ReservaAmenidad, CargoHuesped, CheckInWeb, DatosFiscales, AreaAmenidad, } from "@/lib/pms/types";
import { TARIFAS_PREDETERMINADAS } from '@/store/tarifasStore';
const CAPACIDAD_TIPO: Record<TipoHabitacion, number> = {
  Standard: 2,
  Superior: 2,
  Deluxe: 3,
  'Suite Deluxe': 4,
  Suite: 4,
};
export const MONEDA = 'Q ';
export function fechaHoyISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
export function fechaRelativaISO(dias: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + dias);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
export function nochesEntre(entrada: string,
  salida: string): number {
  const [anioEntrada, mesEntrada, diaEntrada] = entrada.split('-').map(Number);
  const [anioSalida, mesSalida, diaSalida] = salida.split('-').map(Number);
  const inicio = Date.UTC(anioEntrada, mesEntrada - 1, diaEntrada);
  const fin = Date.UTC(anioSalida, mesSalida - 1, diaSalida);
  return Math.max(0, Math.round((fin - inicio) / 86400000));
}
const tareasBase = () => [
  { id: "t1", nombre: "Retirar basura y residuos", completada: false },
  { id: "t2", nombre: "Cambiar ropa de cama", completada: false },
  { id: "t3", nombre: "Cambiar toallas", completada: false },
  { id: "t4", nombre: "Limpiar y desinfectar baño", completada: false },
  { id: "t5", nombre: "Limpiar espejos", completada: false },
  { id: "t6", nombre: "Limpiar muebles y superficies", completada: false },
  { id: "t7", nombre: "Aspirar piso o alfombra", completada: false },
  { id: "t8", nombre: "Trapear piso", completada: false },
  { id: "t9", nombre: "Reponer papel higiénico", completada: false },
  { id: "t10", nombre: "Reponer amenidades", completada: false },
  { id: "t11", nombre: "Realizar inspección final", completada: false },
];
export const FOTO_STANDARD = "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=600&h=380&fit=crop&auto=format";
export const FOTO_SUPERIOR = "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600&h=380&fit=crop&auto=format";
export const FOTO_DELUXE = "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=600&h=380&fit=crop&auto=format";
export const FOTO_SUITE = "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=380&fit=crop&auto=format";
function mkHab(numero: string,
  tipo: TipoHabitacion,
  estado: HabitacionHotel["estado"]): HabitacionHotel {
  return {
    id: `hh-${numero}`,
    numero,
    piso: pisoDeHabitacion(numero),
    tipo,
    capacidad: CAPACIDAD_TIPO[tipo],
    precioNoche: TARIFAS_PREDETERMINADAS[tipo],
    estado,
  };
}
export const HABITACIONES_CENTRALES: HabitacionHotel[] = [
  mkHab("101", "Standard", "ocupada"),
  mkHab("102", "Standard", "disponible"),
  mkHab("103", "Superior", "disponible"),
  mkHab("104", "Standard", "en-limpieza"),
  mkHab("105", "Deluxe", "ocupada"),
  mkHab("106", "Deluxe", "disponible"),
  mkHab("107", "Superior", "disponible"),
  mkHab("108", "Suite", "disponible"),
  mkHab("109", "Deluxe", "disponible"),
  mkHab("110", "Suite Deluxe", "mantenimiento"),
  mkHab("201", "Standard", "disponible"),
  mkHab("202", "Deluxe", "disponible"),
  mkHab("203", "Deluxe", "disponible"),
  mkHab("204", "Superior", "disponible"),
  mkHab("205", "Suite", "disponible"),
  mkHab("206", "Deluxe", "disponible"),
  mkHab("207", "Suite Deluxe", "disponible"),
  mkHab("208", "Standard", "mantenimiento"),
  mkHab("209", "Standard", "disponible"),
  mkHab("210", "Superior", "disponible"),
  mkHab("301", "Superior", "ocupada"),
  mkHab("302", "Suite", "disponible"),
  mkHab("303", "Deluxe", "disponible"),
  mkHab("304", "Suite Deluxe", "disponible"),
  mkHab("305", "Standard", "disponible"),
  mkHab("306", "Standard", "mantenimiento"),
  mkHab("307", "Superior", "disponible"),
  mkHab("308", "Standard", "disponible"),
  mkHab("309", "Deluxe", "disponible"),
  mkHab("310", "Deluxe", "en-limpieza"),
];
export const HABITACIONES_HOTEL = HABITACIONES_CENTRALES.map(h => h.numero);
export const HUESPEDES_INICIALES: Huesped[] = [
  {
    id: "hu-ana",
    nombre: "Ana Morales",
    tipoDocumento: "DPI",
    documento: "2987 65432 0101",
    telefono: "+502 5512 3344",
    correo: "ana.morales@correo.com",
    nacionalidad: "Guatemala",
    creadoEn: "2025-11-02T09:00:00.000Z"
  },
  {
    id: "hu-carlos",
    nombre: "Carlos Ruiz",
    tipoDocumento: "Pasaporte",
    documento: "MX-A1234567",
    telefono: "+52 55 8899 1122",
    correo: "carlos.ruiz@correo.com",
    nacionalidad: "México",
    creadoEn: "2026-01-15T14:20:00.000Z"
  },
  {
    id: "hu-sofia",
    nombre: "Sofía López",
    tipoDocumento: "DPI",
    documento: "1765 43210 0102",
    telefono: "+502 4478 9900",
    correo: "sofia.lopez@correo.com",
    nacionalidad: "Guatemala",
    creadoEn: "2026-03-08T11:05:00.000Z"
  },
  {
    id: "hu-marta",
    nombre: "Marta Girón",
    tipoDocumento: "DPI",
    documento: "3120 98765 0103",
    telefono: "+502 5566 7788",
    correo: "marta.giron@correo.com",
    nacionalidad: "Guatemala",
    creadoEn: "2026-05-21T16:40:00.000Z"
  },
  {
    id: "hu-jorge",
    nombre: "Jorge Castillo",
    tipoDocumento: "Pasaporte",
    documento: "US-556677889",
    telefono: "+1 305 220 3344",
    correo: "jorge.castillo@correo.com",
    nacionalidad: "Estados Unidos",
    creadoEn: "2025-08-30T08:15:00.000Z"
  },
  {
    id: "hu-pedro",
    nombre: "Pedro Ramírez",
    tipoDocumento: "DPI",
    documento: "4098 11223 0104",
    telefono: "+502 5901 2233",
    correo: "pedro.ramirez@correo.com",
    nacionalidad: "Guatemala",
    creadoEn: "2026-07-19T10:00:00.000Z"
  },
  {
    id: "hu-lucia",
    nombre: "Lucía Hernández",
    tipoDocumento: "DPI",
    documento: "2233 44556 0105",
    telefono: "+502 4102 8877",
    correo: "lucia.hernandez@correo.com",
    nacionalidad: "El Salvador",
    creadoEn: "2026-08-01T13:30:00.000Z"
  },
];
export const RESERVAS_INICIALES: Reserva[] = [
  {
    id: "re-1",
    codigo: "VS-2026-01042",
    huespedId: "hu-ana",
    habitacionId: "hh-101",
    tipoHabitacion: "Standard",
    fechaEntrada: fechaRelativaISO(-1),
    fechaSalida: fechaRelativaISO(2),
    personas: 2,
    estado: "en-curso",
    acompanantes: [{ nombre: "Luis Morales", documento: "2987 65432 0110" }],
    servicios: [],
    pagos: [{
      id: "pg-1",
      fecha: fechaRelativaISO(-5) + "T15:00:00.000Z",
      monto: TARIFAS_PREDETERMINADAS.Standard * nochesEntre(fechaRelativaISO(-1), fechaRelativaISO(2)),
      metodo: "tarjeta",
      comprobante: "CP-1001"
    }],
    descuento: 0,
    checkInEn: fechaRelativaISO(-1) + "T15:10:00.000Z",
    creadoEn: fechaRelativaISO(-5) + "T15:00:00.000Z",
  },
  {
    id: "re-2",
    codigo: "VS-2026-01039",
    huespedId: "hu-sofia",
    habitacionId: "hh-301",
    tipoHabitacion: "Suite",
    fechaEntrada: fechaRelativaISO(-4),
    fechaSalida: fechaRelativaISO(0),
    personas: 3,
    estado: "en-curso",
    acompanantes: [
      { nombre: "Diego López", documento: "1765 43210 0111" },
      { nombre: "Camila López", documento: "1765 43210 0112" },
    ],
    servicios: [
      { id: "sv-1", tipo: "Restaurante", descripcion: "Cena buffet x3", cantidad: 3, precioUnitario: 28, fecha: fechaRelativaISO(-3) + "T21:00:00.000Z" },
      { id: "sv-2", tipo: "Spa", descripcion: "Masaje relajante", cantidad: 1, precioUnitario: 60, fecha: fechaRelativaISO(-2) + "T17:00:00.000Z" },
    ],
    pagos: [{ id: "pg-2", fecha: fechaRelativaISO(-4) + "T13:00:00.000Z", monto: 500, metodo: "tarjeta", comprobante: "CP-1002" }],
    descuento: 40,
    checkInEn: fechaRelativaISO(-4) + "T13:05:00.000Z",
    creadoEn: fechaRelativaISO(-20) + "T10:00:00.000Z",
  },
  {
    id: "re-3",
    codigo: "VS-2026-01040",
    huespedId: "hu-carlos",
    habitacionId: "hh-105",
    tipoHabitacion: "Deluxe",
    fechaEntrada: fechaRelativaISO(-2),
    fechaSalida: fechaRelativaISO(1),
    personas: 1,
    estado: "en-curso",
    acompanantes: [],
    servicios: [
      { id: "sv-3", tipo: "Lavandería", descripcion: "Planchado de camisas", cantidad: 4, precioUnitario: 5, fecha: fechaRelativaISO(-1) + "T09:00:00.000Z" },
    ],
    pagos: [{ id: "pg-3", fecha: fechaRelativaISO(-2) + "T12:00:00.000Z", monto: 390, metodo: "efectivo", comprobante: "CP-1003" }],
    descuento: 0,
    checkInEn: fechaRelativaISO(-2) + "T12:10:00.000Z",
    creadoEn: fechaRelativaISO(-12) + "T18:00:00.000Z",
  },
  {
    id: "re-4",
    codigo: "VS-2026-01044",
    huespedId: "hu-marta",
    habitacionId: null,
    tipoHabitacion: "Superior",
    fechaEntrada: fechaRelativaISO(2),
    fechaSalida: fechaRelativaISO(5),
    personas: 2,
    estado: "confirmada",
    acompanantes: [],
    servicios: [],
    pagos: [],
    descuento: 0,
    creadoEn: fechaRelativaISO(-1) + "T11:00:00.000Z",
  },
  {
    id: "re-5",
    codigo: "VS-2026-01045",
    huespedId: "hu-lucia",
    habitacionId: null,
    tipoHabitacion: "Superior",
    fechaEntrada: fechaRelativaISO(0),
    fechaSalida: fechaRelativaISO(2),
    personas: 2,
    estado: "pendiente",
    acompanantes: [],
    servicios: [],
    pagos: [],
    descuento: 0,
    creadoEn: fechaRelativaISO(0) + "T07:30:00.000Z",
  },
  {
    id: "re-6",
    codigo: "VS-2026-01010",
    huespedId: "hu-jorge",
    habitacionId: "hh-102",
    tipoHabitacion: "Standard",
    fechaEntrada: fechaRelativaISO(-25),
    fechaSalida: fechaRelativaISO(-21),
    personas: 1,
    estado: "finalizada",
    acompanantes: [],
    servicios: [{ id: "sv-4", tipo: "Estacionamiento", descripcion: "4 noches", cantidad: 4, precioUnitario: 8, fecha: fechaRelativaISO(-25) + "T12:00:00.000Z" }],
    pagos: [{ id: "pg-4", fecha: fechaRelativaISO(-21) + "T11:00:00.000Z", monto: 332, metodo: "tarjeta", comprobante: "CP-1004" }],
    descuento: 0,
    checkInEn: fechaRelativaISO(-25) + "T14:00:00.000Z",
    checkOutEn: fechaRelativaISO(-21) + "T11:30:00.000Z",
    creadoEn: fechaRelativaISO(-40) + "T09:00:00.000Z",
  },
  {
    id: "re-7",
    codigo: "VS-2026-00995",
    huespedId: "hu-ana",
    habitacionId: "hh-202",
    tipoHabitacion: "Superior",
    fechaEntrada: fechaRelativaISO(-60),
    fechaSalida: fechaRelativaISO(-57),
    personas: 2,
    estado: "finalizada",
    acompanantes: [{ nombre: "Luis Morales", documento: "2987 65432 0110" }],
    servicios: [],
    pagos: [{ id: "pg-5", fecha: fechaRelativaISO(-57) + "T11:00:00.000Z", monto: 285, metodo: "efectivo", comprobante: "CP-0995" }],
    descuento: 0,
    checkInEn: fechaRelativaISO(-60) + "T15:00:00.000Z",
    checkOutEn: fechaRelativaISO(-57) + "T10:45:00.000Z",
    creadoEn: fechaRelativaISO(-75) + "T09:00:00.000Z",
  },
  {
    id: "re-8",
    codigo: "VS-2026-01041",
    huespedId: "hu-pedro",
    habitacionId: null,
    tipoHabitacion: "Deluxe",
    fechaEntrada: fechaRelativaISO(1),
    fechaSalida: fechaRelativaISO(4),
    personas: 2,
    estado: "cancelada",
    acompanantes: [],
    servicios: [],
    pagos: [],
    descuento: 0,
    motivoCancelacion: "El huésped canceló su viaje por motivos personales.",
    creadoEn: fechaRelativaISO(-8) + "T16:00:00.000Z",
  },
];
export const SOLICITUDES_HUESPED_INICIALES: SolicitudHuesped[] = [];
export const REGLAS_TARIFA_INICIALES: ReglaTarifa[] = [
  {
    id: "rt-1",
    nombre: "Temporada alta — fin de año",
    tipoHabitacion: "Todas",
    criterio: "temporada",
    ajuste: "porcentaje",
    valor: 20,
    desde: fechaRelativaISO(-2),
    hasta: fechaRelativaISO(20),
    activa: false,
  },
  {
    id: "rt-2",
    nombre: "Alta ocupación — suites",
    tipoHabitacion: "Suite",
    criterio: "ocupacion",
    ajuste: "porcentaje",
    valor: 15,
    umbralOcupacion: 70,
    activa: true,
  },
  {
    id: "rt-3",
    nombre: "Congreso de medicina",
    tipoHabitacion: "Deluxe",
    criterio: "evento",
    ajuste: "fijo",
    valor: 160,
    desde: fechaRelativaISO(5),
    hasta: fechaRelativaISO(8),
    activa: true,
  },
  {
    id: "rt-4",
    nombre: "Temporada baja — entre semana",
    tipoHabitacion: "Standard",
    criterio: "temporada",
    ajuste: "porcentaje",
    valor: -10,
    desde: fechaRelativaISO(40),
    hasta: fechaRelativaISO(70),
    activa: false,
  },
];
export const PROMOCIONES_INICIALES: Promocion[] = [];
export const EMPLEADOS_INICIALES: Empleado[] = [
  {
    id: "em-1",
    codigoEmpleado: "REC-001",
    nombre: "Personal de recepción",
    correo: "recepcion@villaserena.gt",
    fechaContratacion: "2023-02-14",
    rol: "Recepción",
    turno: "Mañana",
    telefono: "+502 5512 0001",
    activo: true,
    permisos: ["recepcion"],
    tareasCompletadas: 24,
    tareasAsignadas: 26,
    puntualidadPct: 98,
    asistencia: "presente"
  },
  {
    id: "em-2",
    codigoEmpleado: "LIM-001",
    nombre: "Carmen Vidal",
    correo: "carmen.vidal@villaserena.gt",
    fechaContratacion: "2022-08-09",
    rol: "Limpieza",
    turno: "Mañana",
    telefono: "+502 5512 0002",
    activo: true,
    permisos: ["limpieza"],
    tareasCompletadas: 31,
    tareasAsignadas: 34,
    puntualidadPct: 95,
    asistencia: "presente"
  },
  {
    id: "em-3",
    codigoEmpleado: "LIM-002",
    nombre: "Laura Méndez",
    correo: "laura.mendez@villaserena.gt",
    fechaContratacion: "2024-01-22",
    rol: "Limpieza",
    turno: "Tarde",
    telefono: "+502 5512 0003",
    activo: true,
    permisos: ["limpieza"],
    tareasCompletadas: 28,
    tareasAsignadas: 30,
    puntualidadPct: 92,
    asistencia: "presente"
  },
  {
    id: "em-4",
    codigoEmpleado: "RS-001",
    nombre: "Diego Fuentes",
    correo: "restaurante@villaserena.gt",
    fechaContratacion: "2021-11-03",
    rol: "Room Service",
    turno: "Tarde",
    telefono: "+502 5512 0004",
    activo: true,
    permisos: ["roomservice"],
    tareasCompletadas: 19,
    tareasAsignadas: 22,
    puntualidadPct: 88,
    asistencia: "presente"
  },
  {
    id: "em-5",
    codigoEmpleado: "RS-002",
    nombre: "Marco Solís",
    correo: "marco.solis@villaserena.gt",
    fechaContratacion: "2025-03-18",
    rol: "Room Service",
    turno: "Noche",
    telefono: "+502 5512 0005",
    activo: true,
    permisos: ["roomservice"],
    tareasCompletadas: 12,
    tareasAsignadas: 15,
    puntualidadPct: 90,
    asistencia: "descanso"
  },
  {
    id: "em-6",
    codigoEmpleado: "MNT-001",
    nombre: "Rodrigo Paz",
    correo: "mantenimiento@villaserena.gt",
    fechaContratacion: "2020-06-12",
    rol: "Mantenimiento",
    turno: "Mañana",
    telefono: "+502 5512 0006",
    activo: true,
    permisos: ["mantenimiento"],
    tareasCompletadas: 9,
    tareasAsignadas: 11,
    puntualidadPct: 85,
    asistencia: "presente"
  },
  {
    id: "em-7",
    codigoEmpleado: "REC-002",
    nombre: "Elena Ríos",
    correo: "elena.rios@villaserena.gt",
    fechaContratacion: "2024-07-01",
    rol: "Recepción",
    turno: "Noche",
    telefono: "+502 5512 0007",
    activo: true,
    permisos: ["recepcion"],
    tareasCompletadas: 17,
    tareasAsignadas: 18,
    puntualidadPct: 97,
    asistencia: "presente"
  },
  {
    id: "em-8",
    codigoEmpleado: "LIM-003",
    nombre: "Tomás Aguilar",
    correo: "tomas.aguilar@villaserena.gt",
    fechaContratacion: "2025-01-15",
    rol: "Limpieza",
    turno: "Noche",
    telefono: "+502 5512 0008",
    activo: false,
    permisos: ["limpieza"],
    tareasCompletadas: 0,
    tareasAsignadas: 0,
    puntualidadPct: 0,
    asistencia: "ausente"
  },
  {
    id: "em-9",
    codigoEmpleado: "ADM-001",
    nombre: "Valeria Cano",
    correo: "admin@villaserena.gt",
    fechaContratacion: "2019-04-08",
    rol: "Administración",
    turno: "Mañana",
    telefono: "+502 5512 0009",
    activo: true,
    permisos: ["admin", "recepcion", "roomservice", "limpieza"],
    tareasCompletadas: 14,
    tareasAsignadas: 14,
    puntualidadPct: 100,
    asistencia: "presente"
  },
  {
    id: "em-10",
    codigoEmpleado: "MNT-002",
    nombre: "Iván Torres",
    correo: "ivan.torres@villaserena.gt",
    fechaContratacion: "2025-09-02",
    rol: "Mantenimiento",
    turno: "Tarde",
    telefono: "+502 5512 0010",
    activo: true,
    permisos: ["mantenimiento"],
    tareasCompletadas: 6,
    tareasAsignadas: 10,
    puntualidadPct: 80,
    asistencia: "pendiente"
  },
];
export const INSUMOS_INICIALES: Insumo[] = [
  { id: "in-1", nombre: "Juego de sábanas (queen)", categoria: "Lencería", unidad: "juego", stock: 42, stockMinimo: 30, costoUnitario: 18.0 },
  { id: "in-2", nombre: "Toalla de baño", categoria: "Lencería", unidad: "unidad", stock: 24, stockMinimo: 40, costoUnitario: 6.5 },
  { id: "in-3", nombre: "Toalla de manos", categoria: "Lencería", unidad: "unidad", stock: 70, stockMinimo: 40, costoUnitario: 3.0 },
  { id: "in-4", nombre: "Almohada estándar", categoria: "Lencería", unidad: "unidad", stock: 33, stockMinimo: 20, costoUnitario: 9.0 },
  {
    id: "in-5",
    nombre: "Jabón de tocador 25 g",
    categoria: "Amenidades",
    unidad: "unidad",
    stock: 180,
    stockMinimo: 120,
    costoUnitario: 0.35,
    vencimiento: fechaRelativaISO(240)
  },
  {
    id: "in-6",
    nombre: "Shampoo 30 ml",
    categoria: "Amenidades",
    unidad: "unidad",
    stock: 95,
    stockMinimo: 120,
    costoUnitario: 0.55,
    vencimiento: fechaRelativaISO(45)
  },
  { id: "in-7", nombre: "Papel higiénico", categoria: "Amenidades", unidad: "rollo", stock: 210, stockMinimo: 150, costoUnitario: 0.4 },
  {
    id: "in-8",
    nombre: "Kit dental",
    categoria: "Amenidades",
    unidad: "unidad",
    stock: 60,
    stockMinimo: 50,
    costoUnitario: 0.7,
    vencimiento: fechaRelativaISO(120)
  },
  { id: "in-9", nombre: "Set de costura", categoria: "Amenidades", unidad: "unidad", stock: 18, stockMinimo: 25, costoUnitario: 0.6 },
  { id: "in-10", nombre: "Zapatillas desechables", categoria: "Amenidades", unidad: "par", stock: 40, stockMinimo: 30, costoUnitario: 1.1 },
  {
    id: "in-11",
    nombre: "Agua embotellada 500 ml",
    categoria: "Minibar",
    unidad: "botella",
    stock: 130,
    stockMinimo: 80,
    costoUnitario: 0.5,
    vencimiento: fechaRelativaISO(20)
  },
  {
    id: "in-12",
    nombre: "Refresco en lata",
    categoria: "Minibar",
    unidad: "lata",
    stock: 46,
    stockMinimo: 60,
    costoUnitario: 0.8,
    vencimiento: fechaRelativaISO(75)
  },
  {
    id: "in-13",
    nombre: "Snack de maní",
    categoria: "Minibar",
    unidad: "unidad",
    stock: 22,
    stockMinimo: 40,
    costoUnitario: 0.9,
    vencimiento: fechaRelativaISO(10)
  },
  { id: "in-14", nombre: "Detergente multiusos 5 L", categoria: "Limpieza", unidad: "bidón", stock: 12, stockMinimo: 8, costoUnitario: 11.0 },
  { id: "in-15", nombre: "Bolsas de basura (paquete)", categoria: "Limpieza", unidad: "paquete", stock: 5, stockMinimo: 12, costoUnitario: 2.2 },
  {
    id: "in-16",
    nombre: "Guantes de nitrilo (caja)",
    categoria: "Limpieza",
    unidad: "caja",
    stock: 9,
    stockMinimo: 6,
    costoUnitario: 4.5,
    vencimiento: fechaRelativaISO(400)
  },
  {
    id: "in-17",
    nombre: "Café molido",
    categoria: "Alimentos y bebidas",
    unidad: "kg",
    stock: 8,
    stockMinimo: 5,
    costoUnitario: 72.0,
    vencimiento: fechaRelativaISO(90)
  },
  {
    id: "in-18",
    nombre: "Aceite para cocina",
    categoria: "Alimentos y bebidas",
    unidad: "botella",
    stock: 10,
    stockMinimo: 6,
    costoUnitario: 24.0,
    vencimiento: fechaRelativaISO(120)
  },
  { id: "in-19", nombre: "Bombilla LED 12 W", categoria: "Mantenimiento", unidad: "unidad", stock: 18, stockMinimo: 10, costoUnitario: 19.0 },
  { id: "in-20", nombre: "Cinta aislante", categoria: "Mantenimiento", unidad: "rollo", stock: 7, stockMinimo: 5, costoUnitario: 15.0 },
  { id: "in-21", nombre: "Papel para impresora", categoria: "Recepción y oficina", unidad: "resma", stock: 6, stockMinimo: 4, costoUnitario: 42.0 },
  { id: "in-22", nombre: "Rollos para POS", categoria: "Recepción y oficina", unidad: "caja", stock: 4, stockMinimo: 3, costoUnitario: 58.0 },
];
export const MOVIMIENTOS_INSUMO_INICIALES: MovimientoInsumo[] = [];
export const COMPRAS_HOTEL_INICIALES = [];
export const GASTOS_HOTEL_INICIALES = [];
export const ACTIVOS_HOTEL_INICIALES = [
  {
    id: "ac-1",
    codigo: "CLI-001",
    nombre: "Aire acondicionado hab. 105",
    categoria: "Climatización",
    ubicacion: "Habitación 105",
    fechaCompra: "2022-03-15",
    costo: 4200,
    estado: "en reparación" as const,
    vinculadoMantenimiento: true
  },
  {
    id: "ac-2",
    codigo: "ASC-001",
    nombre: "Ascensor principal",
    categoria: "Maquinaria",
    ubicacion: "Torre A",
    fechaCompra: "2019-06-10",
    costo: 148000,
    estado: "operativo" as const,
    vinculadoMantenimiento: true
  },
  {
    id: "ac-3",
    codigo: "COC-001",
    nombre: "Refrigerador industrial",
    categoria: "Equipo de cocina",
    ubicacion: "Restaurante",
    fechaCompra: "2021-11-08",
    costo: 18600,
    estado: "fuera de servicio" as const,
    vinculadoMantenimiento: true
  },
  {
    id: "ac-4",
    codigo: "MOB-301",
    nombre: "Mobiliario Suite 301",
    categoria: "Mobiliario",
    ubicacion: "Suite 301",
    fechaCompra: "2023-02-20",
    costo: 23500,
    estado: "operativo" as const,
    vinculadoMantenimiento: false
  },
];
export const ENCARGADO_MANT = "Rodrigo Paz";
export const TAREAS_PREVENTIVAS_INICIALES: TareaPreventiva[] = [];
export const REPUESTOS_INICIALES: Repuesto[] = [];
export const ORDENES_INICIALES: OrdenTrabajo[] = [];
export const RESERVA_HUESPED_INICIAL: Reserva = {
  ...RESERVAS_INICIALES.find((r) => r.id === "re-1")!,
};
export const WIFI_RED = "VillaSerena_Huespedes";
export const WIFI_PASSWORD = "Serena2026!";
export const TELEFONO_RECEPCION = "+502 2456 7800";
export const PUNTOS_FIDELIDAD_INICIALES = 0;
export const PUNTOS_POR_MONEDA = 100;
const FOTOS_TIPO: Record<TipoHabitacion, string[]> = {
  "Standard": [
    "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&h=520&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&h=520&fit=crop&auto=format",
  ],
  "Superior": [
    "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&h=520&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=800&h=520&fit=crop&auto=format",
  ],
  "Deluxe": [
    "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&h=520&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&h=520&fit=crop&auto=format",
  ],
  "Suite Deluxe": [
    "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=520&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800&h=520&fit=crop&auto=format",
  ],
  "Suite": [
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=520&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1591088398332-8a7791972843?w=800&h=520&fit=crop&auto=format",
  ],
};
export const CATALOGO_HABITACIONES_PUBLICO: OfertaHabitacion[] = [
  {
    tipo: "Standard",
    descripcion: { es: "Habitación acogedora con cama matrimonial, escritorio y baño privado.", en: "Cozy room with a double bed, desk and private bathroom." },
    capacidad: CAPACIDAD_TIPO["Standard"],
    precioNoche: TARIFAS_PREDETERMINADAS["Standard"],
    metros: 22,
    fotos: FOTOS_TIPO["Standard"],
    amenidades: [{ es: "Wi-Fi de alta velocidad", en: "High-speed Wi-Fi" },
    { es: "Aire acondicionado", en: "Air conditioning" },
    { es: "Televisión por cable", en: "Cable TV" },
    { es: "Caja fuerte", en: "Safe" }],
  },
  {
    tipo: "Superior",
    descripcion: { es: "Más espacio y vista al jardín interior, con zona de estar independiente.", en: "More space and an interior garden view, with a separate sitting area." },
    capacidad: CAPACIDAD_TIPO["Superior"],
    precioNoche: TARIFAS_PREDETERMINADAS["Superior"],
    metros: 28,
    fotos: FOTOS_TIPO["Superior"],
    amenidades: [{ es: "Wi-Fi de alta velocidad", en: "High-speed Wi-Fi" },
    { es: "Vista al jardín", en: "Garden view" },
    { es: "Cafetera", en: "Coffee maker" },
    { es: "Escritorio de trabajo", en: "Work desk" }],
  },
  {
    tipo: "Deluxe",
    descripcion: { es: "Habitación amplia con balcón privado y baño con tina.", en: "Spacious room with a private balcony and a bathroom with a bathtub." },
    capacidad: CAPACIDAD_TIPO["Deluxe"],
    precioNoche: TARIFAS_PREDETERMINADAS["Deluxe"],
    metros: 35,
    fotos: FOTOS_TIPO["Deluxe"],
    amenidades: [{ es: "Balcón privado", en: "Private balcony" },
    { es: "Tina de baño", en: "Bathtub" },
    { es: "Minibar", en: "Minibar" },
    { es: "Batas y pantuflas", en: "Bathrobes and slippers" }],
  },
  {
    tipo: "Suite Deluxe",
    descripcion: { es: "Dormitorio y sala separados, ideal para familias o estancias largas.", en: "Separate bedroom and living room, ideal for families or extended stays." },
    capacidad: CAPACIDAD_TIPO["Suite Deluxe"],
    precioNoche: TARIFAS_PREDETERMINADAS["Suite Deluxe"],
    metros: 48,
    fotos: FOTOS_TIPO["Suite Deluxe"],
    amenidades: [{ es: "Sala independiente", en: "Separate living room" },
    { es: "Dos televisores", en: "Two televisions" },
    { es: "Minibar", en: "Minibar" },
    { es: "Servicio de mayordomía", en: "Butler service" }],
  },
  {
    tipo: "Suite",
    descripcion: {
      es: "La mejor vista del hotel, con terraza, jacuzzi y desayuno incluido.",
      en: "The best view in the hotel, with a terrace, hot tub and breakfast included."
    },
    capacidad: CAPACIDAD_TIPO["Suite"],
    precioNoche: TARIFAS_PREDETERMINADAS["Suite"],
    metros: 62,
    fotos: FOTOS_TIPO["Suite"],
    amenidades: [{ es: "Terraza privada", en: "Private terrace" },
    { es: "Jacuzzi", en: "Hot tub" },
    { es: "Desayuno incluido", en: "Breakfast included" },
    { es: "Check-out tardío", en: "Late checkout" }],
  },
];
export function siguienteCodigoReservaWeb(codigosExistentes: string[]): string {
  const maximo = codigosExistentes.reduce((max, codigo) => {
    const match = /^RES-(\d+)$/.exec(codigo);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 1200);
  return `RES-${maximo + 1}`;
}
export const PETICIONES_ESPECIALES = [
  "Cuna para bebé",
  "Ropa de cama hipoalergénica",
  "Retirar productos del minibar",
  "Llegada tardía",
  "Asistencia de movilidad al llegar",
  "Otra solicitud",
];
export const TERMINOS_ESTANCIA = [
  "Confirmo que los datos proporcionados son correctos y que el documento de identidad me pertenece.",
  "Autorizo el tratamiento de mis datos para gestionar la reserva, el registro de huéspedes y las obligaciones legales del hotel.",
  "Acepto las políticas de entrada, salida, cancelación y convivencia de Villa Serena.",
  "Autorizo que los consumos y servicios que confirme se carguen a la cuenta de mi habitación.",
  "Comprendo que los daños verificados podrán cargarse después de que el hotel me lo notifique.",
];
export const CHECKIN_INICIAL: CheckInWeb = {
  estado: "disponible",
  documento: null,
  terminosAceptados: false,
  peticiones: [],
  notaPeticiones: "",
};
export function codigoLlaveDigital(codigoReserva: string, habitacion: string): string {
  return `VS-${codigoReserva}-${habitacion}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}
export const SERVICIOS_CATALOGO: ServicioCatalogo[] = [
  {
    id: 'sv-toallas',
    nombre: 'Toallas extra',
    descripcion: 'Solicitud de toallas adicionales directamente a la habitación.',
    categoria: 'Habitación',
    precio: 0
  },
  {
    id: 'sv-almohadas',
    nombre: 'Almohadas adicionales',
    descripcion: 'Almohadas adicionales para mayor comodidad durante la estancia.',
    categoria: 'Habitación',
    precio: 0
  },
  {
    id: 'sv-amenities',
    nombre: 'Reposición de amenidades',
    descripcion: 'Reposición de productos esenciales disponibles en la habitación.',
    categoria: 'Habitación',
    precio: 0
  },
  { id: 'sv-agua', nombre: 'Agua de cortesía', descripcion: 'Máximo 3 botellas por habitación al día.', categoria: 'Habitación', precio: 0 },
  {
    id: 'sv-plancha',
    nombre: 'Plancha y tabla de planchar',
    descripcion: 'Préstamo de plancha y tabla de planchar para uso dentro de la habitación.',
    categoria: 'Habitación',
    precio: 0
  },
  { id: 'sv-manta', nombre: 'Cobija adicional', descripcion: 'Cobija adicional para mayor comodidad durante la estancia.', categoria: 'Habitación', precio: 0 },
  {
    id: 'sv-ganchos',
    nombre: 'Perchas adicionales',
    descripcion: 'Perchas adicionales para organizar prendas dentro de la habitación.',
    categoria: 'Habitación',
    precio: 0
  },
  {
    id: 'sv-limpieza',
    nombre: 'Limpieza de habitación',
    descripcion: 'Servicio de limpieza y organización general de la habitación.',
    categoria: 'Limpieza y lavandería',
    precio: 0
  },
  {
    id: 'sv-cama',
    nombre: 'Cambio de ropa de cama',
    descripcion: 'Cambio de sábanas y ropa de cama de la habitación.',
    categoria: 'Limpieza y lavandería',
    precio: 0
  },
  {
    id: 'sv-lavanderia',
    nombre: 'Lavandería',
    descripcion: 'Servicio de lavado de prendas personales con entrega en la habitación. Q12 por prenda.',
    categoria: 'Limpieza y lavandería',
    precio: 12
  },
  {
    id: 'sv-planchado',
    nombre: 'Planchado express',
    descripcion: 'Servicio de planchado individual con entrega directamente en la habitación. Q8 por prenda.',
    categoria: 'Limpieza y lavandería',
    precio: 8
  },
  {
    id: 'sv-masaje',
    nombre: 'Masaje relajante',
    descripcion: 'Masaje corporal enfocado en liberar tensión y proporcionar una sensación general de descanso. 60 min.',
    categoria: 'Spa y Relajación',
    precio: 425
  },
  {
    id: 'sv-masaje-cuello',
    nombre: 'Masaje de espalda y cuello',
    descripcion: 'Masaje localizado para aliviar tensión acumulada en espalda, hombros y cuello. 30 min.',
    categoria: 'Spa y Relajación',
    precio: 250
  },
  {
    id: 'sv-piedras',
    nombre: 'Masaje con piedras calientes',
    descripcion: 'Masaje corporal acompañado de piedras calientes. 60 min.',
    categoria: 'Spa y Relajación',
    precio: 475
  },
  {
    id: 'sv-reflexologia',
    nombre: 'Reflexología',
    descripcion: 'Sesión enfocada en puntos específicos de los pies. 30 min.',
    categoria: 'Spa y Relajación',
    precio: 225
  },
  {
    id: 'sv-facial',
    nombre: 'Facial relajante',
    descripcion: 'Sesión facial de limpieza, hidratación y cuidado de la piel. 45 min.',
    categoria: 'Spa y Relajación',
    precio: 325
  },
  {
    id: 'sv-exfoliacion',
    nombre: 'Exfoliación corporal',
    descripcion: 'Tratamiento corporal de exfoliación. 45 min.',
    categoria: 'Spa y Relajación',
    precio: 350
  },
  {
    id: 'sv-masaje-dos',
    nombre: 'Masaje para dos',
    descripcion: 'Experiencia de masaje para dos personas durante la misma sesión. 60 min.',
    categoria: 'Spa y Relajación',
    precio: 800
  },
  {
    id: 'sv-relajacion',
    nombre: 'Experiencia de relajación',
    descripcion: 'Sesión prolongada que combina técnicas de masaje y relajación. 90 min.',
    categoria: 'Spa y Relajación',
    precio: 550
  },
  {
    id: 'sv-romantica',
    nombre: 'Cena romántica',
    descripcion: 'Preparación especial de una cena para dos durante la estancia.',
    categoria: 'Celebraciones y detalles',
    precio: 650
  },
  {
    id: 'sv-cumple',
    nombre: 'Celebración de cumpleaños',
    descripcion: 'Preparación especial para celebrar un cumpleaños durante la estancia.',
    categoria: 'Celebraciones y detalles',
    precio: 450
  },
  {
    id: 'sv-aniversario',
    nombre: 'Aniversario',
    descripcion: 'Preparación especial para celebrar un aniversario en Villa Serena.',
    categoria: 'Celebraciones y detalles',
    precio: 550
  },
  {
    id: 'sv-flores',
    nombre: 'Arreglo de flores',
    descripcion: 'Arreglo floral preparado para entregar directamente en la habitación.',
    categoria: 'Celebraciones y detalles',
    precio: 175
  },
  {
    id: 'sv-pastel',
    nombre: 'Pastel personalizado',
    descripcion: 'Pastel preparado para cumpleaños, aniversarios u otras ocasiones especiales.',
    categoria: 'Celebraciones y detalles',
    precio: 175
  },
  {
    id: 'sv-bienvenida',
    nombre: 'Bienvenida en la habitación',
    descripcion: 'Detalle preparado en la habitación para recibir al huésped a su llegada.',
    categoria: 'Celebraciones y detalles',
    precio: 300
  },
  {
    id: 'sv-aeropuerto',
    nombre: 'Transporte al aeropuerto',
    descripcion: 'Servicio de transporte entre Villa Serena y el aeropuerto. Tarifa definida por el hotel.',
    categoria: 'Recepción',
    precio: 0
  },
  {
    id: 'sv-despertador',
    nombre: 'Llamada de despertador',
    descripcion: 'Solicitud de llamada telefónica a la habitación a la hora indicada.',
    categoria: 'Recepción',
    precio: 0
  },
  {
    id: 'sv-equipaje',
    nombre: 'Ayuda con el equipaje',
    descripcion: 'Asistencia para recoger o trasladar el equipaje del huésped.',
    categoria: 'Recepción',
    precio: 0
  },
  { id: 'sv-taxi', nombre: 'Solicitar taxi', descripcion: 'Asistencia de recepción para coordinar un servicio de taxi.', categoria: 'Recepción', precio: 0 },
  {
    id: 'sv-info',
    nombre: 'Información y asistencia',
    descripcion: 'Contacto con recepción para consultas o asistencia durante la estancia.',
    categoria: 'Recepción',
    precio: 0
  },
  {
    id: 'sv-mantenimiento',
    nombre: 'Reportar un problema',
    descripcion: 'Reporta un inconveniente de la habitación para Mantenimiento.',
    categoria: 'Mantenimiento',
    precio: 0
  },
];
export const ALERGIAS_FRECUENTES = ["Sin frutos secos", "Sin gluten", "Sin lactosa", "Sin mariscos", "Sin huevo", "Sin soya"];
let _correlativoPedidoHuesped = 2400;
export function siguienteNumeroPedidoHuesped(): number {
  _correlativoPedidoHuesped += 1;
  return _correlativoPedidoHuesped;
}
function haceMin(min: number): string {
  return new Date(Date.now() - min * 60000).toISOString();
}
export const PEDIDOS_HUESPED_INICIALES: PedidoHuesped[] = [];
export const MENSAJES_CHAT_INICIALES: MensajeChat[] = [];
export const DOMOTICA_INICIAL: Domotica = {
  climaEncendido: true,
  temperatura: 22,
  luces: [
    { id: "lz-general", nombre: "Luz general", encendida: true, intensidad: 70 },
    { id: "lz-noche", nombre: "Lámparas de noche", encendida: false, intensidad: 40 },
    { id: "lz-bano", nombre: "Baño", encendida: false, intensidad: 100 },
    { id: "lz-ambiente", nombre: "Luz de ambiente", encendida: true, intensidad: 25 },
  ],
  cortinas: 60,
  noMolestar: false,
  hacerHabitacion: false,
  wifiConectado: false,
};
export const AMENIDADES_CONFIG: {
  area: AreaAmenidad;
  descripcion: string;
  horas: string[];
  aforo: number;
}[] = [
    { area: "Spa", descripcion: "Circuito de aguas y sala de masajes.", horas: ["10:00", "12:00", "14:00", "16:00", "18:00"], aforo: 2 },
    { area: "Gimnasio", descripcion: "Equipo cardiovascular y de fuerza.", horas: ["06:00", "08:00", "10:00", "16:00", "18:00", "20:00"], aforo: 8 },
    {
      area: "Restaurante Mirador",
      descripcion: "Desayuno, almuerzo y cena con vista al valle.",
      horas: ["07:00", "08:30", "10:00", "12:30", "14:00", "15:30", "18:30", "20:00", "21:30"],
      aforo: 12
    },
    { area: "Piscina", descripcion: "Piscina climatizada con área de descanso.", horas: ["09:00", "11:00", "15:00", "17:00"], aforo: 15 },
  ];
function ocupacionBase(id: string, aforo: number): number {
  let h = 0;
  for (const c of id)
    h = (h * 31 + c.charCodeAt(0)) % 997;
  return h % (aforo + 1);
}
export const TURNOS_AMENIDAD_INICIALES: TurnoAmenidad[] = AMENIDADES_CONFIG.flatMap((cfg) => [0, 1, 2].flatMap((dia) => cfg.horas.map((hora) => {
  const fecha = fechaRelativaISO(dia);
  const id = `tu-${cfg.area}-${fecha}-${hora}`;
  return {
    id,
    area: cfg.area,
    fecha,
    hora,
    aforo: cfg.aforo,
    ocupados: ocupacionBase(id, cfg.aforo),
  };
})));
export const RESERVAS_AMENIDAD_INICIALES: ReservaAmenidad[] = [];
export const CARGOS_HUESPED_INICIALES: CargoHuesped[] = [];
export const DATOS_FISCALES_INICIALES: DatosFiscales = {
  nombre: "",
  nit: "",
  direccion: "",
  correo: "",
};
let _correlativoFEL = 0;
export function siguienteFacturaFEL(): string {
  _correlativoFEL += 1;
  return `FEL-${String(_correlativoFEL).padStart(4, "0")}`;
}
export function ahoraISO(): string { return new Date().toISOString(); }
export function generarId(): string { return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`; }
let _comprobante = 2000;
export function siguienteComprobante(): string {
  _comprobante += 1;
  return `CP-${_comprobante}`;
}
export function horaActual(): string { return new Date().toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' }); }
export const MENU_INICIAL: ItemMenu[] = [
  {
    id: 'menu-v56-001',
    nombre: 'Guacamole con Nachos',
    descripcion: 'Guacamole preparado con aguacate, tomate, cebolla, cilantro y limón, acompañado de nachos de maíz.',
    precio: 95,
    categoria: 'Almuerzo',
    subcategoria: 'Entradas',
    disponible: true
  },
  {
    id: 'menu-v56-002',
    nombre: 'Nachos Villa Serena',
    descripcion: 'Nachos de maíz con frijoles, queso derretido, carne molida, guacamole, pico de gallo y crema.',
    precio: 95,
    categoria: 'Almuerzo',
    subcategoria: 'Entradas',
    disponible: true
  },
  {
    id: 'menu-v56-003',
    nombre: 'Alitas de Pollo',
    descripcion: 'Alitas de pollo acompañadas de papas fritas, apio y aderezo ranch.',
    precio: 95,
    categoria: 'Almuerzo',
    subcategoria: 'Entradas',
    disponible: true
  },
  {
    id: 'menu-v56-004',
    nombre: 'Mozzarella Sticks',
    descripcion: 'Palitos de queso mozzarella empanizados, acompañados de salsa de tomate.',
    precio: 95,
    categoria: 'Almuerzo',
    subcategoria: 'Entradas',
    disponible: true
  },
  {
    id: 'menu-v56-005',
    nombre: 'Papas Villa Serena',
    descripcion: 'Papas fritas cubiertas con queso, tocino, cebollín y aderezo de la casa.',
    precio: 95,
    categoria: 'Almuerzo',
    subcategoria: 'Entradas',
    disponible: true
  },
  {
    id: 'menu-v56-006',
    nombre: 'Quesadillas de Pollo',
    descripcion: 'Tortillas de harina rellenas de pollo, queso y vegetales, acompañadas de guacamole, pico de gallo y crema.',
    precio: 95,
    categoria: 'Almuerzo',
    subcategoria: 'Entradas',
    disponible: true
  },
  {
    id: 'menu-v56-007',
    nombre: 'Sopa de Pollo',
    descripcion: 'Caldo de pollo con papa, zanahoria, güisquil, elote y hierbas, acompañado de arroz y tortillas.',
    precio: 95,
    categoria: 'Almuerzo',
    subcategoria: 'Sopas',
    disponible: true
  },
  {
    id: 'menu-v56-008',
    nombre: 'Sopa de Tortilla',
    descripcion: 'Sopa de tomate con pollo, tiras de tortilla, aguacate, queso y crema.',
    precio: 95,
    categoria: 'Almuerzo',
    subcategoria: 'Sopas',
    disponible: true
  },
  {
    id: 'menu-v56-009',
    nombre: 'Crema de Tomate',
    descripcion: 'Crema de tomate ligeramente sazonada, acompañada de pan tostado.',
    precio: 95,
    categoria: 'Almuerzo',
    subcategoria: 'Sopas',
    disponible: true
  },
  {
    id: 'menu-v56-010',
    nombre: 'Crema de Vegetales',
    descripcion: 'Crema preparada con vegetales frescos, acompañada de crotones.',
    precio: 95,
    categoria: 'Almuerzo',
    subcategoria: 'Sopas',
    disponible: true
  },
  {
    id: 'menu-v56-011',
    nombre: 'Ensalada César con Pollo',
    descripcion: 'Lechuga romana con pollo a la plancha, queso parmesano, crotones y aderezo César.',
    precio: 95,
    categoria: 'Almuerzo',
    subcategoria: 'Ensaladas',
    disponible: true
  },
  {
    id: 'menu-v56-012',
    nombre: 'Ensalada Villa Serena',
    descripcion: 'Lechugas mixtas con pollo a la plancha, aguacate, tomate cherry, pepino, zanahoria y queso, acompañadas de vinagreta de la casa.',
    precio: 95,
    categoria: 'Almuerzo',
    subcategoria: 'Ensaladas',
    disponible: true
  },
  {
    id: 'menu-v56-013',
    nombre: 'Ensalada Mediterránea',
    descripcion: 'Lechuga, tomate, pepino, aceitunas, cebolla morada y queso feta, acompañados de vinagreta.',
    precio: 95,
    categoria: 'Almuerzo',
    subcategoria: 'Ensaladas',
    disponible: true
  },
  {
    id: 'menu-v56-014',
    nombre: 'Ensalada de Aguacate y Pollo',
    descripcion: 'Pollo a la plancha con aguacate, lechuga, tomate, pepino y maíz dulce.',
    precio: 95,
    categoria: 'Almuerzo',
    subcategoria: 'Ensaladas',
    disponible: true
  },
  {
    id: 'menu-v56-015',
    nombre: 'Pechuga de Pollo a la Plancha',
    descripcion: 'Pechuga de pollo marinada y preparada a la plancha, acompañada de arroz, vegetales salteados y ensalada.',
    precio: 95,
    categoria: 'Almuerzo',
    subcategoria: 'Platos Fuertes',
    disponible: true
  },
  {
    id: 'menu-v56-016',
    nombre: 'Pollo en Salsa de Champiñones',
    descripcion: 'Pechuga de pollo con salsa cremosa de champiñones, acompañada de puré de papa y vegetales.',
    precio: 95,
    categoria: 'Almuerzo',
    subcategoria: 'Platos Fuertes',
    disponible: true
  },
  {
    id: 'menu-v56-017',
    nombre: 'Pollo BBQ',
    descripcion: 'Pechuga de pollo cubierta con salsa BBQ, acompañada de papas fritas y ensalada fresca.',
    precio: 95,
    categoria: 'Almuerzo',
    subcategoria: 'Platos Fuertes',
    disponible: true
  },
  {
    id: 'menu-v56-018',
    nombre: 'Carne Asada',
    descripcion: 'Carne de res a la parrilla acompañada de frijoles, guacamole, cebollines asados, papa y tortillas.',
    precio: 95,
    categoria: 'Almuerzo',
    subcategoria: 'Platos Fuertes',
    disponible: true
  },
  {
    id: 'menu-v56-019',
    nombre: 'Lomito a la Parrilla',
    descripcion: 'Lomito de res a la parrilla acompañado de puré de papa, vegetales salteados y salsa de la casa.',
    precio: 95,
    categoria: 'Almuerzo',
    subcategoria: 'Platos Fuertes',
    disponible: true
  },
  {
    id: 'menu-v56-020',
    nombre: 'Lomito en Salsa de Champiñones',
    descripcion: 'Lomito de res con salsa cremosa de champiñones, acompañado de puré de papa y vegetales.',
    precio: 95,
    categoria: 'Almuerzo',
    subcategoria: 'Platos Fuertes',
    disponible: true
  },
  {
    id: 'menu-v56-021',
    nombre: 'Costillas BBQ',
    descripcion: 'Costillas de cerdo cubiertas con salsa BBQ, acompañadas de papas fritas, elote y ensalada de repollo.',
    precio: 95,
    categoria: 'Almuerzo',
    subcategoria: 'Platos Fuertes',
    disponible: true
  },
  {
    id: 'menu-v56-022',
    nombre: 'Chuleta de Cerdo a la Parrilla',
    descripcion: 'Chuleta de cerdo marinada y preparada a la parrilla, acompañada de papa, vegetales y ensalada.',
    precio: 95,
    categoria: 'Almuerzo',
    subcategoria: 'Platos Fuertes',
    disponible: true
  },
  {
    id: 'menu-v56-023',
    nombre: 'Salmón a la Plancha',
    descripcion: 'Filete de salmón a la plancha con limón y hierbas, acompañado de vegetales salteados y puré de papa.',
    precio: 95,
    categoria: 'Almuerzo',
    subcategoria: 'Pescados',
    disponible: true
  },
  {
    id: 'menu-v56-024',
    nombre: 'Salmón en Salsa de Limón',
    descripcion: 'Salmón a la plancha con salsa cremosa de limón, acompañado de arroz y vegetales.',
    precio: 95,
    categoria: 'Almuerzo',
    subcategoria: 'Pescados',
    disponible: true
  },
  {
    id: 'menu-v56-025',
    nombre: 'Filete de Pescado a la Plancha',
    descripcion: 'Filete de pescado blanco preparado con ajo, limón y hierbas, acompañado de arroz y ensalada.',
    precio: 95,
    categoria: 'Almuerzo',
    subcategoria: 'Pescados',
    disponible: true
  },
  {
    id: 'menu-v56-026',
    nombre: 'Pescado Empanizado',
    descripcion: 'Filete de pescado empanizado acompañado de papas fritas, ensalada y salsa tártara.',
    precio: 95,
    categoria: 'Almuerzo',
    subcategoria: 'Pescados',
    disponible: true
  },
  {
    id: 'menu-v56-027',
    nombre: 'Pasta Alfredo con Pollo',
    descripcion: 'Fettuccine con pollo a la plancha, salsa Alfredo cremosa y queso parmesano.',
    precio: 95,
    categoria: 'Almuerzo',
    subcategoria: 'Pastas',
    disponible: true
  },
  {
    id: 'menu-v56-028',
    nombre: 'Pasta Alfredo con Camarones',
    descripcion: 'Fettuccine con camarones, salsa Alfredo cremosa y queso parmesano.',
    precio: 95,
    categoria: 'Almuerzo',
    subcategoria: 'Pastas',
    disponible: true
  },
  {
    id: 'menu-v56-029',
    nombre: 'Pasta Bolognesa',
    descripcion: 'Pasta con salsa de tomate, carne molida, hierbas y queso parmesano.',
    precio: 95,
    categoria: 'Almuerzo',
    subcategoria: 'Pastas',
    disponible: true
  },
  {
    id: 'menu-v56-030',
    nombre: 'Pasta Pomodoro',
    descripcion: 'Pasta con salsa de tomate, ajo, albahaca y queso parmesano.',
    precio: 95,
    categoria: 'Almuerzo',
    subcategoria: 'Pastas',
    disponible: true
  },
  {
    id: 'menu-v56-031',
    nombre: 'Pasta Pesto con Pollo',
    descripcion: 'Pasta con pollo a la plancha, pesto de albahaca y queso parmesano.',
    precio: 95,
    categoria: 'Almuerzo',
    subcategoria: 'Pastas',
    disponible: true
  },
  {
    id: 'menu-v56-032',
    nombre: 'Hamburguesa Clásica',
    descripcion: 'Carne de res con queso, lechuga, tomate, cebolla, pepinillos y aderezo de la casa, acompañada de papas fritas.',
    precio: 95,
    categoria: 'Almuerzo',
    subcategoria: 'Hamburguesas',
    disponible: true
  },
  {
    id: 'menu-v56-033',
    nombre: 'Hamburguesa Villa Serena',
    descripcion: 'Carne de res con queso cheddar, tocino, aguacate, lechuga, tomate y cebolla caramelizada, acompañada de papas fritas.',
    precio: 95,
    categoria: 'Almuerzo',
    subcategoria: 'Hamburguesas',
    disponible: true
  },
  {
    id: 'menu-v56-034',
    nombre: 'Hamburguesa BBQ',
    descripcion: 'Carne de res con queso cheddar, tocino, cebolla caramelizada y salsa BBQ, acompañada de papas fritas.',
    precio: 95,
    categoria: 'Almuerzo',
    subcategoria: 'Hamburguesas',
    disponible: true
  },
  {
    id: 'menu-v56-035',
    nombre: 'Hamburguesa de Pollo',
    descripcion: 'Pechuga de pollo a la plancha con queso, lechuga, tomate y aderezo de la casa, acompañada de papas fritas.',
    precio: 95,
    categoria: 'Almuerzo',
    subcategoria: 'Hamburguesas',
    disponible: true
  },
  {
    id: 'menu-v56-036',
    nombre: 'Pepián de Pollo',
    descripcion: 'Pollo servido en recado tradicional de tomate, miltomate, chiles, semillas y especias, acompañado de arroz y tortillas.',
    precio: 95,
    categoria: 'Almuerzo',
    subcategoria: 'Sabores de Guatemala',
    disponible: true
  },
  {
    id: 'menu-v56-037',
    nombre: 'Jocón de Pollo',
    descripcion: 'Pollo en recado verde preparado con miltomate, cilantro y especias, acompañado de arroz y tortillas.',
    precio: 95,
    categoria: 'Almuerzo',
    subcategoria: 'Sabores de Guatemala',
    disponible: true
  },
  {
    id: 'menu-v56-038',
    nombre: 'Hilachas',
    descripcion: 'Carne de res deshebrada con papa en recado de tomate y especias, acompañada de arroz y tortillas.',
    precio: 95,
    categoria: 'Almuerzo',
    subcategoria: 'Sabores de Guatemala',
    disponible: true
  },
  {
    id: 'menu-v56-039',
    nombre: 'Subanik',
    descripcion: 'Carnes cocinadas en recado de tomate y chiles, acompañadas de arroz y tortillas.',
    precio: 95,
    categoria: 'Almuerzo',
    subcategoria: 'Sabores de Guatemala',
    disponible: true
  },
  {
    id: 'menu-v56-040',
    nombre: 'Churrasco Chapín',
    descripcion: 'Carne asada acompañada de frijoles volteados, guacamole, cebollines asados, chirmol y tortillas.',
    precio: 95,
    categoria: 'Almuerzo',
    subcategoria: 'Sabores de Guatemala',
    disponible: true
  },
  {
    id: 'menu-v56-041',
    nombre: 'Bruschettas de Tomate y Albahaca',
    descripcion: 'Pan artesanal tostado con tomate fresco, albahaca, ajo, aceite de oliva y queso parmesano.',
    precio: 110,
    categoria: 'Cena',
    subcategoria: 'Entradas',
    disponible: true
  },
  {
    id: 'menu-v56-042',
    nombre: 'Croquetas de Pollo y Queso',
    descripcion: 'Croquetas crujientes rellenas de pollo y queso, acompañadas de aderezo de la casa.',
    precio: 110,
    categoria: 'Cena',
    subcategoria: 'Entradas',
    disponible: true
  },
  {
    id: 'menu-v56-043',
    nombre: 'Champiñones al Ajo',
    descripcion: 'Champiñones salteados con ajo, mantequilla, perejil y limón, acompañados de pan tostado.',
    precio: 110,
    categoria: 'Cena',
    subcategoria: 'Entradas',
    disponible: true
  },
  {
    id: 'menu-v56-044',
    nombre: 'Queso Fundido con Chorizo',
    descripcion: 'Queso fundido con chorizo, acompañado de tortillas de maíz y pico de gallo.',
    precio: 110,
    categoria: 'Cena',
    subcategoria: 'Entradas',
    disponible: true
  },
  {
    id: 'menu-v56-045',
    nombre: 'Camarones al Ajo',
    descripcion: 'Camarones salteados con ajo, mantequilla, perejil y limón, acompañados de pan artesanal.',
    precio: 110,
    categoria: 'Cena',
    subcategoria: 'Entradas',
    disponible: true
  },
  {
    id: 'menu-v56-046',
    nombre: 'Tabla Villa Serena',
    descripcion: 'Selección de quesos, jamón, frutas frescas, aceitunas, frutos secos y pan tostado.',
    precio: 110,
    categoria: 'Cena',
    subcategoria: 'Entradas',
    disponible: true
  },
  {
    id: 'menu-v56-047',
    nombre: 'Crema de Tomate y Albahaca',
    descripcion: 'Crema preparada con tomate y albahaca, acompañada de crotones.',
    precio: 110,
    categoria: 'Cena',
    subcategoria: 'Sopas y Cremas',
    disponible: true
  },
  {
    id: 'menu-v56-048',
    nombre: 'Crema de Champiñones',
    descripcion: 'Crema de champiñones con cebolla, ajo y especias, acompañada de pan tostado.',
    precio: 110,
    categoria: 'Cena',
    subcategoria: 'Sopas y Cremas',
    disponible: true
  },
  {
    id: 'menu-v56-049',
    nombre: 'Crema de Brócoli',
    descripcion: 'Crema preparada con brócoli, leche, cebolla y queso.',
    precio: 110,
    categoria: 'Cena',
    subcategoria: 'Sopas y Cremas',
    disponible: true
  },
  {
    id: 'menu-v56-050',
    nombre: 'Sopa de Pollo con Vegetales',
    descripcion: 'Caldo de pollo con papa, zanahoria, güisquil, elote y hierbas frescas.',
    precio: 110,
    categoria: 'Cena',
    subcategoria: 'Sopas y Cremas',
    disponible: true
  },
  {
    id: 'menu-v56-051',
    nombre: 'Ensalada César con Pollo',
    descripcion: 'Lechuga romana con pollo a la plancha, queso parmesano, crotones y aderezo César.',
    precio: 110,
    categoria: 'Cena',
    subcategoria: 'Ensaladas',
    disponible: true
  },
  {
    id: 'menu-v56-052',
    nombre: 'Ensalada Villa Serena',
    descripcion: 'Lechugas mixtas con aguacate, tomate cherry, pepino, queso, semillas y vinagreta de la casa.',
    precio: 110,
    categoria: 'Cena',
    subcategoria: 'Ensaladas',
    disponible: true
  },
  {
    id: 'menu-v56-053',
    nombre: 'Ensalada de Salmón',
    descripcion: 'Salmón a la plancha con lechugas mixtas, aguacate, tomate cherry, pepino y vinagreta de limón.',
    precio: 110,
    categoria: 'Cena',
    subcategoria: 'Ensaladas',
    disponible: true
  },
  {
    id: 'menu-v56-054',
    nombre: 'Ensalada Mediterránea',
    descripcion: 'Lechuga, tomate, pepino, cebolla morada, aceitunas y queso feta con vinagreta de hierbas.',
    precio: 110,
    categoria: 'Cena',
    subcategoria: 'Ensaladas',
    disponible: true
  },
  {
    id: 'menu-v56-055',
    nombre: 'Pollo en Salsa de Champiñones',
    descripcion: 'Pechuga de pollo a la plancha cubierta con salsa cremosa de champiñones, acompañada de puré de papa y vegetales salteados.',
    precio: 110,
    categoria: 'Cena',
    subcategoria: 'Pollo',
    disponible: true
  },
  {
    id: 'menu-v56-056',
    nombre: 'Pollo al Limón y Hierbas',
    descripcion: 'Pechuga de pollo marinada con limón, ajo y hierbas, acompañada de arroz y vegetales.',
    precio: 110,
    categoria: 'Cena',
    subcategoria: 'Pollo',
    disponible: true
  },
  {
    id: 'menu-v56-057',
    nombre: 'Pollo Relleno de Espinaca y Queso',
    descripcion: 'Pechuga de pollo rellena de espinaca y queso, acompañada de puré de papa y vegetales.',
    precio: 110,
    categoria: 'Cena',
    subcategoria: 'Pollo',
    disponible: true
  },
  {
    id: 'menu-v56-058',
    nombre: 'Pollo a la Parrilla Villa Serena',
    descripcion: 'Pechuga marinada y preparada a la parrilla, acompañada de papa asada, vegetales y salsa de la casa.',
    precio: 110,
    categoria: 'Cena',
    subcategoria: 'Pollo',
    disponible: true
  },
  {
    id: 'menu-v56-059',
    nombre: 'Lomito Villa Serena',
    descripcion: 'Lomito de res a la parrilla acompañado de puré de papa, vegetales salteados y salsa de champiñones.',
    precio: 110,
    categoria: 'Cena',
    subcategoria: 'Carnes',
    disponible: true
  },
  {
    id: 'menu-v56-060',
    nombre: 'Lomito a la Pimienta',
    descripcion: 'Lomito de res acompañado de salsa cremosa de pimienta, papa asada y vegetales.',
    precio: 110,
    categoria: 'Cena',
    subcategoria: 'Carnes',
    disponible: true
  },
  {
    id: 'menu-v56-061',
    nombre: 'Churrasco a la Parrilla',
    descripcion: 'Carne de res a la parrilla acompañada de papa asada, vegetales, guacamole y chimichurri.',
    precio: 110,
    categoria: 'Cena',
    subcategoria: 'Carnes',
    disponible: true
  },
  {
    id: 'menu-v56-062',
    nombre: 'Medallones de Res con Champiñones',
    descripcion: 'Medallones de res con salsa cremosa de champiñones, acompañados de puré de papa y vegetales.',
    precio: 110,
    categoria: 'Cena',
    subcategoria: 'Carnes',
    disponible: true
  },
  {
    id: 'menu-v56-063',
    nombre: 'Costillas BBQ',
    descripcion: 'Costillas de cerdo con salsa BBQ, acompañadas de papa horneada y ensalada de repollo.',
    precio: 110,
    categoria: 'Cena',
    subcategoria: 'Carnes',
    disponible: true
  },
  {
    id: 'menu-v56-064',
    nombre: 'Salmón Villa Serena',
    descripcion: 'Salmón a la plancha con mantequilla de ajo, limón y hierbas, acompañado de puré de papa y vegetales.',
    precio: 110,
    categoria: 'Cena',
    subcategoria: 'Pescados y Mariscos',
    disponible: true
  },
  {
    id: 'menu-v56-065',
    nombre: 'Salmón en Salsa de Limón',
    descripcion: 'Salmón a la plancha con salsa cremosa de limón, acompañado de arroz y vegetales.',
    precio: 110,
    categoria: 'Cena',
    subcategoria: 'Pescados y Mariscos',
    disponible: true
  },
  {
    id: 'menu-v56-066',
    nombre: 'Filete de Pescado al Ajo',
    descripcion: 'Pescado blanco a la plancha con ajo, mantequilla y limón, acompañado de arroz y ensalada.',
    precio: 110,
    categoria: 'Cena',
    subcategoria: 'Pescados y Mariscos',
    disponible: true
  },
  {
    id: 'menu-v56-067',
    nombre: 'Pescado en Salsa de Hierbas',
    descripcion: 'Filete de pescado con salsa de hierbas frescas, acompañado de puré de papa y vegetales.',
    precio: 110,
    categoria: 'Cena',
    subcategoria: 'Pescados y Mariscos',
    disponible: true
  },
  {
    id: 'menu-v56-068',
    nombre: 'Camarones al Ajo',
    descripcion: 'Camarones salteados en mantequilla, ajo y perejil, acompañados de arroz y vegetales.',
    precio: 110,
    categoria: 'Cena',
    subcategoria: 'Pescados y Mariscos',
    disponible: true
  },
  {
    id: 'menu-v56-069',
    nombre: 'Camarones en Salsa Cremosa',
    descripcion: 'Camarones en salsa cremosa de ajo y queso parmesano, acompañados de arroz y vegetales.',
    precio: 110,
    categoria: 'Cena',
    subcategoria: 'Pescados y Mariscos',
    disponible: true
  },
  {
    id: 'menu-v56-070',
    nombre: 'Fettuccine Alfredo con Pollo',
    descripcion: 'Fettuccine con pollo a la plancha, salsa Alfredo y queso parmesano.',
    precio: 110,
    categoria: 'Cena',
    subcategoria: 'Pastas',
    disponible: true
  },
  {
    id: 'menu-v56-071',
    nombre: 'Fettuccine Alfredo con Camarones',
    descripcion: 'Fettuccine con camarones, salsa Alfredo, ajo y queso parmesano.',
    precio: 110,
    categoria: 'Cena',
    subcategoria: 'Pastas',
    disponible: true
  },
  {
    id: 'menu-v56-072',
    nombre: 'Spaghetti Bolognesa',
    descripcion: 'Spaghetti con salsa de tomate, carne molida, hierbas y queso parmesano.',
    precio: 110,
    categoria: 'Cena',
    subcategoria: 'Pastas',
    disponible: true
  },
  {
    id: 'menu-v56-073',
    nombre: 'Pasta Pesto con Pollo',
    descripcion: 'Pasta con pollo a la plancha, pesto de albahaca, tomate cherry y queso parmesano.',
    precio: 110,
    categoria: 'Cena',
    subcategoria: 'Pastas',
    disponible: true
  },
  {
    id: 'menu-v56-074',
    nombre: 'Pasta con Camarones al Ajo',
    descripcion: 'Pasta con camarones, ajo, mantequilla, perejil, tomate cherry y queso parmesano.',
    precio: 110,
    categoria: 'Cena',
    subcategoria: 'Pastas',
    disponible: true
  },
  {
    id: 'menu-v56-075',
    nombre: 'Pasta Primavera',
    descripcion: 'Pasta con brócoli, zucchini, zanahoria, chile pimiento, tomate cherry y salsa ligera de ajo y aceite de oliva.',
    precio: 110,
    categoria: 'Cena',
    subcategoria: 'Pastas',
    disponible: true
  },
  {
    id: 'menu-v56-076',
    nombre: 'Pepián de Pollo',
    descripcion: 'Pollo servido en recado tradicional de tomate, miltomate, chiles, semillas y especias, acompañado de arroz y tortillas.',
    precio: 110,
    categoria: 'Cena',
    subcategoria: 'Especialidades Guatemaltecas',
    disponible: true
  },
  {
    id: 'menu-v56-077',
    nombre: 'Jocón de Pollo',
    descripcion: 'Pollo en recado verde de miltomate, cilantro y especias, acompañado de arroz y tortillas.',
    precio: 110,
    categoria: 'Cena',
    subcategoria: 'Especialidades Guatemaltecas',
    disponible: true
  },
  {
    id: 'menu-v56-078',
    nombre: 'Hilachas de Res',
    descripcion: 'Carne de res deshebrada con papa en recado de tomate y especias, acompañada de arroz y tortillas.',
    precio: 110,
    categoria: 'Cena',
    subcategoria: 'Especialidades Guatemaltecas',
    disponible: true
  },
  {
    id: 'menu-v56-079',
    nombre: 'Churrasco Chapín',
    descripcion: 'Carne asada acompañada de frijoles volteados, guacamole, chirmol, cebollines asados y tortillas.',
    precio: 110,
    categoria: 'Cena',
    subcategoria: 'Especialidades Guatemaltecas',
    disponible: true
  },
  {
    id: 'menu-v56-080',
    nombre: 'Bowl de Pollo y Aguacate',
    descripcion: 'Pollo a la plancha con arroz, aguacate, tomate, pepino, maíz y vegetales.',
    precio: 110,
    categoria: 'Cena',
    subcategoria: 'Opciones Ligeras',
    disponible: true
  },
  {
    id: 'menu-v56-081',
    nombre: 'Bowl de Vegetales',
    descripcion: 'Arroz acompañado de aguacate, brócoli, zanahoria, zucchini, maíz y tomate.',
    precio: 110,
    categoria: 'Cena',
    subcategoria: 'Opciones Ligeras',
    disponible: true
  },
  {
    id: 'menu-v56-082',
    nombre: 'Wrap de Pollo',
    descripcion: 'Tortilla de harina rellena de pollo a la plancha, lechuga, tomate, aguacate y queso.',
    precio: 110,
    categoria: 'Cena',
    subcategoria: 'Opciones Ligeras',
    disponible: true
  },
  {
    id: 'menu-v56-083',
    nombre: 'Sándwich Caprese',
    descripcion: 'Pan artesanal con queso mozzarella, tomate, albahaca y pesto.',
    precio: 110,
    categoria: 'Cena',
    subcategoria: 'Opciones Ligeras',
    disponible: true
  },
  {
    id: 'menu-v56-084',
    nombre: 'Jugo de Naranja',
    descripcion: 'Naranjas frescas recién exprimidas.',
    precio: 28,
    categoria: 'Bebidas sin alcohol',
    subcategoria: 'Jugos Naturales',
    disponible: true
  },
  {
    id: 'menu-v56-085',
    nombre: 'Jugo de Piña',
    descripcion: 'Piña fresca preparada con agua y hielo.',
    precio: 28,
    categoria: 'Bebidas sin alcohol',
    subcategoria: 'Jugos Naturales',
    disponible: true
  },
  {
    id: 'menu-v56-086',
    nombre: 'Jugo de Papaya',
    descripcion: 'Papaya fresca preparada con agua y hielo.',
    precio: 28,
    categoria: 'Bebidas sin alcohol',
    subcategoria: 'Jugos Naturales',
    disponible: true
  },
  {
    id: 'menu-v56-087',
    nombre: 'Jugo de Sandía',
    descripcion: 'Sandía fresca preparada y servida fría.',
    precio: 28,
    categoria: 'Bebidas sin alcohol',
    subcategoria: 'Jugos Naturales',
    disponible: true
  },
  {
    id: 'menu-v56-088',
    nombre: 'Jugo de Maracuyá',
    descripcion: 'Maracuyá preparado con agua y hielo.',
    precio: 28,
    categoria: 'Bebidas sin alcohol',
    subcategoria: 'Jugos Naturales',
    disponible: true
  },
  {
    id: 'menu-v56-089',
    nombre: 'Jugo de Naranja y Zanahoria',
    descripcion: 'Naranja fresca combinada con zanahoria.',
    precio: 28,
    categoria: 'Bebidas sin alcohol',
    subcategoria: 'Jugos Naturales',
    disponible: true
  },
  {
    id: 'menu-v56-090',
    nombre: 'Jugo Verde',
    descripcion: 'Combinación fresca de piña, pepino, apio, espinaca y limón.',
    precio: 28,
    categoria: 'Bebidas sin alcohol',
    subcategoria: 'Jugos Naturales',
    disponible: true
  },
  {
    id: 'menu-v56-091',
    nombre: 'Jugo Tropical',
    descripcion: 'Mezcla refrescante de naranja, piña y maracuyá.',
    precio: 28,
    categoria: 'Bebidas sin alcohol',
    subcategoria: 'Jugos Naturales',
    disponible: true
  },
  {
    id: 'menu-v56-092',
    nombre: 'Licuado de Fresa',
    descripcion: 'Fresas frescas combinadas con leche y un toque de miel.',
    precio: 28,
    categoria: 'Bebidas sin alcohol',
    subcategoria: 'Licuados',
    disponible: true
  },
  {
    id: 'menu-v56-093',
    nombre: 'Licuado de Banano',
    descripcion: 'Banano, leche, miel y un toque de canela.',
    precio: 28,
    categoria: 'Bebidas sin alcohol',
    subcategoria: 'Licuados',
    disponible: true
  },
  {
    id: 'menu-v56-094',
    nombre: 'Licuado de Papaya',
    descripcion: 'Papaya fresca combinada con leche y miel.',
    precio: 28,
    categoria: 'Bebidas sin alcohol',
    subcategoria: 'Licuados',
    disponible: true
  },
  {
    id: 'menu-v56-095',
    nombre: 'Licuado de Fresa y Banano',
    descripcion: 'Fresas y banano combinados con leche y miel.',
    precio: 28,
    categoria: 'Bebidas sin alcohol',
    subcategoria: 'Licuados',
    disponible: true
  },
  {
    id: 'menu-v56-096',
    nombre: 'Licuado Tropical',
    descripcion: 'Piña, papaya y banano combinados con leche y hielo.',
    precio: 28,
    categoria: 'Bebidas sin alcohol',
    subcategoria: 'Licuados',
    disponible: true
  },
  {
    id: 'menu-v56-097',
    nombre: 'Licuado de Frutos Rojos',
    descripcion: 'Fresas, moras y arándanos combinados con leche.',
    precio: 28,
    categoria: 'Bebidas sin alcohol',
    subcategoria: 'Licuados',
    disponible: true
  },
  {
    id: 'menu-v56-098',
    nombre: 'Licuado de Mango',
    descripcion: 'Mango fresco combinado con leche y hielo.',
    precio: 28,
    categoria: 'Bebidas sin alcohol',
    subcategoria: 'Licuados',
    disponible: true
  },
  {
    id: 'menu-v56-099',
    nombre: 'Licuado de Avena y Banano',
    descripcion: 'Banano y avena combinados con leche y canela.',
    precio: 28,
    categoria: 'Bebidas sin alcohol',
    subcategoria: 'Licuados',
    disponible: true
  },
  {
    id: 'menu-v56-100',
    nombre: 'Limonada Natural',
    descripcion: 'Limón fresco, agua y hielo.',
    precio: 28,
    categoria: 'Bebidas sin alcohol',
    subcategoria: 'Bebidas Naturales',
    disponible: true
  },
  {
    id: 'menu-v56-101',
    nombre: 'Limonada con Hierbabuena',
    descripcion: 'Limón fresco con hierbabuena, agua y hielo.',
    precio: 28,
    categoria: 'Bebidas sin alcohol',
    subcategoria: 'Bebidas Naturales',
    disponible: true
  },
  {
    id: 'menu-v56-102',
    nombre: 'Limonada de Fresa',
    descripcion: 'Fresas frescas combinadas con limón, agua y hielo.',
    precio: 28,
    categoria: 'Bebidas sin alcohol',
    subcategoria: 'Bebidas Naturales',
    disponible: true
  },
  {
    id: 'menu-v56-103',
    nombre: 'Limonada de Frutos Rojos',
    descripcion: 'Frutos rojos combinados con limón fresco, agua y hielo.',
    precio: 28,
    categoria: 'Bebidas sin alcohol',
    subcategoria: 'Bebidas Naturales',
    disponible: true
  },
  {
    id: 'menu-v56-104',
    nombre: 'Naranjada Natural',
    descripcion: 'Naranja fresca preparada con agua y hielo.',
    precio: 28,
    categoria: 'Bebidas sin alcohol',
    subcategoria: 'Bebidas Naturales',
    disponible: true
  },
  {
    id: 'menu-v56-105',
    nombre: 'Naranjada con Soda',
    descripcion: 'Naranja fresca combinada con agua carbonatada y hielo.',
    precio: 28,
    categoria: 'Bebidas sin alcohol',
    subcategoria: 'Bebidas Naturales',
    disponible: true
  },
  {
    id: 'menu-v56-106',
    nombre: 'Rosa de Jamaica',
    descripcion: 'Infusión de flor de jamaica servida fría.',
    precio: 28,
    categoria: 'Bebidas sin alcohol',
    subcategoria: 'Bebidas Naturales',
    disponible: true
  },
  {
    id: 'menu-v56-107',
    nombre: 'Horchata',
    descripcion: 'Bebida tradicional de arroz con notas de canela y vainilla.',
    precio: 28,
    categoria: 'Bebidas sin alcohol',
    subcategoria: 'Bebidas Naturales',
    disponible: true
  },
  {
    id: 'menu-v56-108',
    nombre: 'Té Frío de Limón',
    descripcion: 'Té negro con limón servido con hielo.',
    precio: 28,
    categoria: 'Bebidas sin alcohol',
    subcategoria: 'Tés y Cafés Fríos',
    disponible: true
  },
  {
    id: 'menu-v56-109',
    nombre: 'Té Frío de Durazno',
    descripcion: 'Té negro con notas de durazno servido frío.',
    precio: 28,
    categoria: 'Bebidas sin alcohol',
    subcategoria: 'Tés y Cafés Fríos',
    disponible: true
  },
  {
    id: 'menu-v56-110',
    nombre: 'Té Frío de Frutos Rojos',
    descripcion: 'Infusión frutal de frutos rojos servida con hielo.',
    precio: 28,
    categoria: 'Bebidas sin alcohol',
    subcategoria: 'Tés y Cafés Fríos',
    disponible: true
  },
  {
    id: 'menu-v56-111',
    nombre: 'Café Frío',
    descripcion: 'Café guatemalteco servido frío con hielo.',
    precio: 28,
    categoria: 'Bebidas sin alcohol',
    subcategoria: 'Tés y Cafés Fríos',
    disponible: true
  },
  {
    id: 'menu-v56-112',
    nombre: 'Iced Latte',
    descripcion: 'Espresso combinado con leche fría y hielo.',
    precio: 28,
    categoria: 'Bebidas sin alcohol',
    subcategoria: 'Tés y Cafés Fríos',
    disponible: true
  },
  {
    id: 'menu-v56-113',
    nombre: 'Iced Mocha',
    descripcion: 'Espresso, chocolate y leche servidos con hielo.',
    precio: 28,
    categoria: 'Bebidas sin alcohol',
    subcategoria: 'Tés y Cafés Fríos',
    disponible: true
  },
  {
    id: 'menu-v56-114',
    nombre: 'Frappé de Café',
    descripcion: 'Café y leche mezclados con hielo hasta obtener una textura cremosa.',
    precio: 28,
    categoria: 'Bebidas sin alcohol',
    subcategoria: 'Tés y Cafés Fríos',
    disponible: true
  },
  {
    id: 'menu-v56-115',
    nombre: 'Frappé de Chocolate',
    descripcion: 'Chocolate y leche mezclados con hielo hasta obtener una textura cremosa.',
    precio: 28,
    categoria: 'Bebidas sin alcohol',
    subcategoria: 'Tés y Cafés Fríos',
    disponible: true
  },
  {
    id: 'menu-v56-116',
    nombre: 'Café Guatemalteco',
    descripcion: 'Café de Guatemala recién preparado.',
    precio: 28,
    categoria: 'Bebidas sin alcohol',
    subcategoria: 'Cafés y Chocolates',
    disponible: true
  },
  {
    id: 'menu-v56-117',
    nombre: 'Café Americano',
    descripcion: 'Espresso combinado con agua caliente.',
    precio: 28,
    categoria: 'Bebidas sin alcohol',
    subcategoria: 'Cafés y Chocolates',
    disponible: true
  },
  {
    id: 'menu-v56-118',
    nombre: 'Espresso',
    descripcion: 'Café concentrado preparado al momento.',
    precio: 28,
    categoria: 'Bebidas sin alcohol',
    subcategoria: 'Cafés y Chocolates',
    disponible: true
  },
  {
    id: 'menu-v56-119',
    nombre: 'Espresso Doble',
    descripcion: 'Doble porción de espresso de sabor intenso.',
    precio: 28,
    categoria: 'Bebidas sin alcohol',
    subcategoria: 'Cafés y Chocolates',
    disponible: true
  },
  {
    id: 'menu-v56-120',
    nombre: 'Cappuccino',
    descripcion: 'Espresso con leche vaporizada y espuma de leche.',
    precio: 28,
    categoria: 'Bebidas sin alcohol',
    subcategoria: 'Cafés y Chocolates',
    disponible: true
  },
  {
    id: 'menu-v56-121',
    nombre: 'Latte',
    descripcion: 'Espresso combinado con leche vaporizada.',
    precio: 28,
    categoria: 'Bebidas sin alcohol',
    subcategoria: 'Cafés y Chocolates',
    disponible: true
  },
  {
    id: 'menu-v56-122',
    nombre: 'Mocaccino',
    descripcion: 'Espresso combinado con chocolate y leche vaporizada.',
    precio: 28,
    categoria: 'Bebidas sin alcohol',
    subcategoria: 'Cafés y Chocolates',
    disponible: true
  },
  {
    id: 'menu-v56-123',
    nombre: 'Chocolate Caliente',
    descripcion: 'Chocolate preparado con leche caliente y textura cremosa.',
    precio: 28,
    categoria: 'Bebidas sin alcohol',
    subcategoria: 'Cafés y Chocolates',
    disponible: true
  },
  {
    id: 'menu-v56-124',
    nombre: 'Chocolate Guatemalteco',
    descripcion: 'Chocolate de estilo tradicional con notas de canela.',
    precio: 28,
    categoria: 'Bebidas sin alcohol',
    subcategoria: 'Cafés y Chocolates',
    disponible: true
  },
  {
    id: 'menu-v56-125',
    nombre: 'Té de Manzanilla',
    descripcion: 'Infusión suave y aromática de manzanilla.',
    precio: 28,
    categoria: 'Bebidas sin alcohol',
    subcategoria: 'Tés e Infusiones',
    disponible: true
  },
  {
    id: 'menu-v56-126',
    nombre: 'Té de Menta',
    descripcion: 'Infusión fresca y aromática de menta.',
    precio: 28,
    categoria: 'Bebidas sin alcohol',
    subcategoria: 'Tés e Infusiones',
    disponible: true
  },
  {
    id: 'menu-v56-127',
    nombre: 'Té Verde',
    descripcion: 'Infusión ligera de té verde.',
    precio: 28,
    categoria: 'Bebidas sin alcohol',
    subcategoria: 'Tés e Infusiones',
    disponible: true
  },
  {
    id: 'menu-v56-128',
    nombre: 'Té Negro',
    descripcion: 'Infusión clásica de té negro de sabor intenso.',
    precio: 28,
    categoria: 'Bebidas sin alcohol',
    subcategoria: 'Tés e Infusiones',
    disponible: true
  },
  {
    id: 'menu-v56-129',
    nombre: 'Té de Canela',
    descripcion: 'Infusión caliente de canela de aroma especiado.',
    precio: 28,
    categoria: 'Bebidas sin alcohol',
    subcategoria: 'Tés e Infusiones',
    disponible: true
  },
  {
    id: 'menu-v56-130',
    nombre: 'Infusión de Frutos Rojos',
    descripcion: 'Infusión frutal con notas de fresas, moras y frutos rojos.',
    precio: 28,
    categoria: 'Bebidas sin alcohol',
    subcategoria: 'Tés e Infusiones',
    disponible: true
  },
  {
    id: 'menu-v56-131',
    nombre: 'Agua Pura',
    descripcion: 'Agua purificada embotellada.',
    precio: 28,
    categoria: 'Bebidas sin alcohol',
    subcategoria: 'Agua y Gaseosas',
    disponible: true
  },
  {
    id: 'menu-v56-132',
    nombre: 'Agua Mineral',
    descripcion: 'Agua mineral con gas.',
    precio: 28,
    categoria: 'Bebidas sin alcohol',
    subcategoria: 'Agua y Gaseosas',
    disponible: true
  },
  {
    id: 'menu-v56-133',
    nombre: 'Agua Mineral con Limón',
    descripcion: 'Agua mineral con gas acompañada de limón fresco.',
    precio: 28,
    categoria: 'Bebidas sin alcohol',
    subcategoria: 'Agua y Gaseosas',
    disponible: true
  },
  {
    id: 'menu-v56-134',
    nombre: 'Gaseosas',
    descripcion: 'Selección de bebidas carbonatadas.',
    precio: 28,
    categoria: 'Bebidas sin alcohol',
    subcategoria: 'Agua y Gaseosas',
    disponible: true
  },
  {
    id: 'menu-v56-135',
    nombre: 'Ginger Ale',
    descripcion: 'Bebida carbonatada con notas de jengibre.',
    precio: 28,
    categoria: 'Bebidas sin alcohol',
    subcategoria: 'Agua y Gaseosas',
    disponible: true
  },
  {
    id: 'menu-v56-136',
    nombre: 'Agua Tónica',
    descripcion: 'Bebida carbonatada de perfil ligeramente amargo.',
    precio: 28,
    categoria: 'Bebidas sin alcohol',
    subcategoria: 'Agua y Gaseosas',
    disponible: true
  },
  {
    id: 'menu-v56-137',
    nombre: 'Barra final',
    descripcion: 'Barra final',
    precio: 28,
    categoria: 'Bebidas sin alcohol',
    subcategoria: 'Agua y Gaseosas',
    disponible: true
  },
  {
    id: 'menu-v56-138',
    nombre: 'Desayuno Chapín',
    descripcion: 'Desayuno Chapín, preparado al momento por Villa Serena.',
    precio: 72,
    categoria: 'Desayuno',
    subcategoria: 'Desayunos',
    disponible: true
  },
  {
    id: 'menu-v56-139',
    nombre: 'Desayuno Villa Serena',
    descripcion: 'Desayuno Villa Serena, preparado al momento por Villa Serena.',
    precio: 72,
    categoria: 'Desayuno',
    subcategoria: 'Desayunos',
    disponible: true
  },
  {
    id: 'menu-v56-140',
    nombre: 'Huevos Rancheros',
    descripcion: 'Huevos Rancheros, preparado al momento por Villa Serena.',
    precio: 72,
    categoria: 'Desayuno',
    subcategoria: 'Huevos y Omelettes',
    disponible: true
  },
  {
    id: 'menu-v56-141',
    nombre: 'Huevos con Chorizo',
    descripcion: 'Huevos con Chorizo, preparado al momento por Villa Serena.',
    precio: 72,
    categoria: 'Desayuno',
    subcategoria: 'Huevos y Omelettes',
    disponible: true
  },
  {
    id: 'menu-v56-142',
    nombre: 'Omelette de Jamón y Queso',
    descripcion: 'Omelette de Jamón y Queso, preparado al momento por Villa Serena.',
    precio: 72,
    categoria: 'Desayuno',
    subcategoria: 'Huevos y Omelettes',
    disponible: true
  },
  {
    id: 'menu-v56-143',
    nombre: 'Omelette de Vegetales',
    descripcion: 'Omelette de Vegetales, preparado al momento por Villa Serena.',
    precio: 72,
    categoria: 'Desayuno',
    subcategoria: 'Huevos y Omelettes',
    disponible: true
  },
  {
    id: 'menu-v56-144',
    nombre: 'Avena con Frutas',
    descripcion: 'Avena con Frutas, preparado al momento por Villa Serena.',
    precio: 72,
    categoria: 'Desayuno',
    subcategoria: 'Desayunos',
    disponible: true
  },
  {
    id: 'menu-v56-145',
    nombre: 'Yogurt con Frutas y Granola',
    descripcion: 'Yogurt con Frutas y Granola, preparado al momento por Villa Serena.',
    precio: 72,
    categoria: 'Desayuno',
    subcategoria: 'Yogurt y Cereal',
    disponible: true
  },
  {
    id: 'menu-v56-146',
    nombre: 'Sándwich de Desayuno',
    descripcion: 'Sándwich de Desayuno, preparado al momento por Villa Serena.',
    precio: 72,
    categoria: 'Desayuno',
    subcategoria: 'Sándwiches',
    disponible: true
  },
  {
    id: 'menu-v56-147',
    nombre: 'Sándwich de Pollo',
    descripcion: 'Sándwich de Pollo, preparado al momento por Villa Serena.',
    precio: 72,
    categoria: 'Desayuno',
    subcategoria: 'Sándwiches',
    disponible: true
  },
  {
    id: 'menu-v56-148',
    nombre: 'Club Sándwich',
    descripcion: 'Club Sándwich, preparado al momento por Villa Serena.',
    precio: 72,
    categoria: 'Desayuno',
    subcategoria: 'Sándwiches',
    disponible: true
  },
  {
    id: 'menu-v56-149',
    nombre: 'Sándwich de Aguacate y Huevo',
    descripcion: 'Sándwich de Aguacate y Huevo, preparado al momento por Villa Serena.',
    precio: 72,
    categoria: 'Desayuno',
    subcategoria: 'Sándwiches',
    disponible: true
  },
  {
    id: 'menu-v56-150',
    nombre: 'Croissant de Jamón y Queso',
    descripcion: 'Croissant de Jamón y Queso, preparado al momento por Villa Serena.',
    precio: 72,
    categoria: 'Desayuno',
    subcategoria: 'Sándwiches',
    disponible: true
  },
  {
    id: 'menu-v56-151',
    nombre: 'Panini de Pollo',
    descripcion: 'Panini de Pollo, preparado al momento por Villa Serena.',
    precio: 72,
    categoria: 'Desayuno',
    subcategoria: 'Sándwiches',
    disponible: true
  },
  {
    id: 'menu-v56-152',
    nombre: 'Bagel de Huevo y Queso',
    descripcion: 'Bagel de Huevo y Queso, preparado al momento por Villa Serena.',
    precio: 72,
    categoria: 'Desayuno',
    subcategoria: 'Sándwiches',
    disponible: true
  },
  {
    id: 'menu-v56-153',
    nombre: 'Waffle Clásico',
    descripcion: 'Waffle Clásico, preparado al momento por Villa Serena.',
    precio: 72,
    categoria: 'Desayuno',
    subcategoria: 'Waffles y Panqueques',
    disponible: true
  },
  {
    id: 'menu-v56-154',
    nombre: 'Waffle de Fresa y Banano',
    descripcion: 'Waffle de Fresa y Banano, preparado al momento por Villa Serena.',
    precio: 72,
    categoria: 'Desayuno',
    subcategoria: 'Waffles y Panqueques',
    disponible: true
  },
  {
    id: 'menu-v56-155',
    nombre: 'Waffle de Chocolate y Fresa',
    descripcion: 'Waffle de Chocolate y Fresa, preparado al momento por Villa Serena.',
    precio: 72,
    categoria: 'Desayuno',
    subcategoria: 'Waffles y Panqueques',
    disponible: true
  },
  {
    id: 'menu-v56-156',
    nombre: 'Waffle de Frutos Rojos',
    descripcion: 'Waffle de Frutos Rojos, preparado al momento por Villa Serena.',
    precio: 72,
    categoria: 'Desayuno',
    subcategoria: 'Waffles y Panqueques',
    disponible: true
  },
  {
    id: 'menu-v56-157',
    nombre: 'Waffle con Huevo y Tocino',
    descripcion: 'Waffle con Huevo y Tocino, preparado al momento por Villa Serena.',
    precio: 72,
    categoria: 'Desayuno',
    subcategoria: 'Waffles y Panqueques',
    disponible: true
  },
  {
    id: 'menu-v56-158',
    nombre: 'Panqueques Clásicos',
    descripcion: 'Panqueques Clásicos, preparado al momento por Villa Serena.',
    precio: 72,
    categoria: 'Desayuno',
    subcategoria: 'Waffles y Panqueques',
    disponible: true
  },
  {
    id: 'menu-v56-159',
    nombre: 'Panqueques con Frutas',
    descripcion: 'Panqueques con Frutas, preparado al momento por Villa Serena.',
    precio: 72,
    categoria: 'Desayuno',
    subcategoria: 'Waffles y Panqueques',
    disponible: true
  },
  {
    id: 'menu-v56-160',
    nombre: 'Tostadas Francesas',
    descripcion: 'Tostadas Francesas, preparado al momento por Villa Serena.',
    precio: 72,
    categoria: 'Desayuno',
    subcategoria: 'Waffles y Panqueques',
    disponible: true
  },
  {
    id: 'menu-v56-161',
    nombre: 'Pastel de Chocolate',
    descripcion: 'Pastel de Chocolate, preparado al momento por Villa Serena.',
    precio: 48,
    categoria: 'Postres',
    subcategoria: 'Pasteles y Tartas',
    disponible: true
  },
  {
    id: 'menu-v56-162',
    nombre: 'Cheesecake de Fresa',
    descripcion: 'Cheesecake de Fresa, preparado al momento por Villa Serena.',
    precio: 48,
    categoria: 'Postres',
    subcategoria: 'Pasteles y Tartas',
    disponible: true
  },
  {
    id: 'menu-v56-163',
    nombre: 'Cheesecake de Frutos Rojos',
    descripcion: 'Cheesecake de Frutos Rojos, preparado al momento por Villa Serena.',
    precio: 48,
    categoria: 'Postres',
    subcategoria: 'Pasteles y Tartas',
    disponible: true
  },
  {
    id: 'menu-v56-164',
    nombre: 'Pastel de Zanahoria',
    descripcion: 'Pastel de Zanahoria, preparado al momento por Villa Serena.',
    precio: 48,
    categoria: 'Postres',
    subcategoria: 'Pasteles y Tartas',
    disponible: true
  },
  {
    id: 'menu-v56-165',
    nombre: 'Tres Leches',
    descripcion: 'Tres Leches, preparado al momento por Villa Serena.',
    precio: 48,
    categoria: 'Postres',
    subcategoria: 'Postres Tradicionales',
    disponible: true
  },
  {
    id: 'menu-v56-166',
    nombre: 'Flan de Caramelo',
    descripcion: 'Flan de Caramelo, preparado al momento por Villa Serena.',
    precio: 48,
    categoria: 'Postres',
    subcategoria: 'Postres Tradicionales',
    disponible: true
  },
  {
    id: 'menu-v56-167',
    nombre: 'Arroz con Leche',
    descripcion: 'Arroz con Leche, preparado al momento por Villa Serena.',
    precio: 48,
    categoria: 'Postres',
    subcategoria: 'Postres Tradicionales',
    disponible: true
  },
  {
    id: 'menu-v56-168',
    nombre: 'Brownie con Helado',
    descripcion: 'Brownie con Helado, preparado al momento por Villa Serena.',
    precio: 48,
    categoria: 'Postres',
    subcategoria: 'Chocolate',
    disponible: true
  },
  {
    id: 'menu-v56-169',
    nombre: 'Brownie Villa Serena',
    descripcion: 'Brownie Villa Serena, preparado al momento por Villa Serena.',
    precio: 48,
    categoria: 'Postres',
    subcategoria: 'Chocolate',
    disponible: true
  },
  {
    id: 'menu-v56-170',
    nombre: 'Volcán de Chocolate',
    descripcion: 'Volcán de Chocolate, preparado al momento por Villa Serena.',
    precio: 48,
    categoria: 'Postres',
    subcategoria: 'Chocolate',
    disponible: true
  },
  {
    id: 'menu-v56-171',
    nombre: 'Crepas de Fresa',
    descripcion: 'Crepas de Fresa, preparado al momento por Villa Serena.',
    precio: 48,
    categoria: 'Postres',
    subcategoria: 'Crepas',
    disponible: true
  },
  {
    id: 'menu-v56-172',
    nombre: 'Crepas de Banano y Chocolate',
    descripcion: 'Crepas de Banano y Chocolate, preparado al momento por Villa Serena.',
    precio: 48,
    categoria: 'Postres',
    subcategoria: 'Crepas',
    disponible: true
  },
  {
    id: 'menu-v56-173',
    nombre: 'Crepas de Frutos Rojos',
    descripcion: 'Crepas de Frutos Rojos, preparado al momento por Villa Serena.',
    precio: 48,
    categoria: 'Postres',
    subcategoria: 'Crepas',
    disponible: true
  },
  {
    id: 'menu-v56-174',
    nombre: 'Copa de Helado',
    descripcion: 'Copa de Helado, preparado al momento por Villa Serena.',
    precio: 48,
    categoria: 'Postres',
    subcategoria: 'Helados',
    disponible: true
  },
  {
    id: 'menu-v56-175',
    nombre: 'Sundae de Chocolate',
    descripcion: 'Sundae de Chocolate, preparado al momento por Villa Serena.',
    precio: 48,
    categoria: 'Postres',
    subcategoria: 'Helados',
    disponible: true
  },
  {
    id: 'menu-v56-176',
    nombre: 'Sundae de Frutos Rojos',
    descripcion: 'Sundae de Frutos Rojos, preparado al momento por Villa Serena.',
    precio: 48,
    categoria: 'Postres',
    subcategoria: 'Helados',
    disponible: true
  },
  {
    id: 'menu-v56-177',
    nombre: 'Cerveza Nacional',
    descripcion: 'Cerveza Nacional, preparado al momento por Villa Serena.',
    precio: 65,
    categoria: 'Bebidas con alcohol',
    subcategoria: 'Cervezas',
    disponible: true
  },
  {
    id: 'menu-v56-178',
    nombre: 'Cerveza Importada',
    descripcion: 'Cerveza Importada, preparado al momento por Villa Serena.',
    precio: 65,
    categoria: 'Bebidas con alcohol',
    subcategoria: 'Cervezas',
    disponible: true
  },
  {
    id: 'menu-v56-179',
    nombre: 'Cerveza Artesanal',
    descripcion: 'Cerveza Artesanal, preparado al momento por Villa Serena.',
    precio: 65,
    categoria: 'Bebidas con alcohol',
    subcategoria: 'Cervezas',
    disponible: true
  },
  {
    id: 'menu-v56-180',
    nombre: 'Vino Tinto',
    descripcion: 'Vino Tinto, preparado al momento por Villa Serena.',
    precio: 65,
    categoria: 'Bebidas con alcohol',
    subcategoria: 'Vinos',
    disponible: true
  },
  {
    id: 'menu-v56-181',
    nombre: 'Vino Blanco',
    descripcion: 'Vino Blanco, preparado al momento por Villa Serena.',
    precio: 65,
    categoria: 'Bebidas con alcohol',
    subcategoria: 'Vinos',
    disponible: true
  },
  {
    id: 'menu-v56-182',
    nombre: 'Vino Rosado',
    descripcion: 'Vino Rosado, preparado al momento por Villa Serena.',
    precio: 65,
    categoria: 'Bebidas con alcohol',
    subcategoria: 'Vinos',
    disponible: true
  },
  {
    id: 'menu-v56-183',
    nombre: 'Vino Espumoso',
    descripcion: 'Vino Espumoso, preparado al momento por Villa Serena.',
    precio: 65,
    categoria: 'Bebidas con alcohol',
    subcategoria: 'Vinos',
    disponible: true
  },
  {
    id: 'menu-v56-184',
    nombre: 'Selección Especial Villa Serena',
    descripcion: 'Selección Especial Villa Serena, preparado al momento por Villa Serena.',
    precio: 65,
    categoria: 'Bebidas con alcohol',
    subcategoria: 'Vinos',
    disponible: true
  },
  {
    id: 'menu-v56-185',
    nombre: 'Margarita',
    descripcion: 'Margarita, preparado al momento por Villa Serena.',
    precio: 65,
    categoria: 'Bebidas con alcohol',
    subcategoria: 'Cócteles Clásicos',
    disponible: true
  },
  {
    id: 'menu-v56-186',
    nombre: 'Mojito',
    descripcion: 'Mojito, preparado al momento por Villa Serena.',
    precio: 65,
    categoria: 'Bebidas con alcohol',
    subcategoria: 'Cócteles Clásicos',
    disponible: true
  },
  {
    id: 'menu-v56-187',
    nombre: 'Piña Colada',
    descripcion: 'Piña Colada, preparado al momento por Villa Serena.',
    precio: 65,
    categoria: 'Bebidas con alcohol',
    subcategoria: 'Cócteles Clásicos',
    disponible: true
  },
  {
    id: 'menu-v56-188',
    nombre: 'Daiquiri',
    descripcion: 'Daiquiri, preparado al momento por Villa Serena.',
    precio: 65,
    categoria: 'Bebidas con alcohol',
    subcategoria: 'Cócteles Clásicos',
    disponible: true
  },
  {
    id: 'menu-v56-189',
    nombre: 'Tequila Sunrise',
    descripcion: 'Tequila Sunrise, preparado al momento por Villa Serena.',
    precio: 65,
    categoria: 'Bebidas con alcohol',
    subcategoria: 'Cócteles Clásicos',
    disponible: true
  },
  {
    id: 'menu-v56-190',
    nombre: 'Cuba Libre',
    descripcion: 'Cuba Libre, preparado al momento por Villa Serena.',
    precio: 65,
    categoria: 'Bebidas con alcohol',
    subcategoria: 'Cócteles Clásicos',
    disponible: true
  },
  {
    id: 'menu-v56-191',
    nombre: 'Gin Tonic',
    descripcion: 'Gin Tonic, preparado al momento por Villa Serena.',
    precio: 65,
    categoria: 'Bebidas con alcohol',
    subcategoria: 'Cócteles Clásicos',
    disponible: true
  },
  {
    id: 'menu-v56-192',
    nombre: 'Sangría',
    descripcion: 'Sangría, preparado al momento por Villa Serena.',
    precio: 65,
    categoria: 'Bebidas con alcohol',
    subcategoria: 'Cócteles Clásicos',
    disponible: true
  },
  {
    id: 'menu-v56-193',
    nombre: 'Serena Tropical',
    descripcion: 'Serena Tropical, preparado al momento por Villa Serena.',
    precio: 65,
    categoria: 'Bebidas con alcohol',
    subcategoria: 'Cócteles Villa Serena',
    disponible: true
  },
  {
    id: 'menu-v56-194',
    nombre: 'Atardecer Serena',
    descripcion: 'Atardecer Serena, preparado al momento por Villa Serena.',
    precio: 65,
    categoria: 'Bebidas con alcohol',
    subcategoria: 'Cócteles Villa Serena',
    disponible: true
  },
  {
    id: 'menu-v56-195',
    nombre: 'Jardín Serena',
    descripcion: 'Jardín Serena, preparado al momento por Villa Serena.',
    precio: 65,
    categoria: 'Bebidas con alcohol',
    subcategoria: 'Cócteles Villa Serena',
    disponible: true
  },
  {
    id: 'menu-v56-196',
    nombre: 'Pasión Serena',
    descripcion: 'Pasión Serena, preparado al momento por Villa Serena.',
    precio: 65,
    categoria: 'Bebidas con alcohol',
    subcategoria: 'Cócteles Villa Serena',
    disponible: true
  },
  {
    id: 'menu-v56-197',
    nombre: 'Noche Serena',
    descripcion: 'Noche Serena, preparado al momento por Villa Serena.',
    precio: 65,
    categoria: 'Bebidas con alcohol',
    subcategoria: 'Cócteles Villa Serena',
    disponible: true
  },
  {
    id: 'menu-v56-198',
    nombre: 'Brisa Serena',
    descripcion: 'Brisa Serena, preparado al momento por Villa Serena.',
    precio: 65,
    categoria: 'Bebidas con alcohol',
    subcategoria: 'Cócteles Villa Serena',
    disponible: true
  },
  {
    id: 'menu-v56-199',
    nombre: 'Whisky',
    descripcion: 'Whisky, preparado al momento por Villa Serena.',
    precio: 65,
    categoria: 'Bebidas con alcohol',
    subcategoria: 'Destilados',
    disponible: true
  },
  {
    id: 'menu-v56-200',
    nombre: 'Ron',
    descripcion: 'Ron, preparado al momento por Villa Serena.',
    precio: 65,
    categoria: 'Bebidas con alcohol',
    subcategoria: 'Destilados',
    disponible: true
  },
  {
    id: 'menu-v56-201',
    nombre: 'Tequila',
    descripcion: 'Tequila, preparado al momento por Villa Serena.',
    precio: 65,
    categoria: 'Bebidas con alcohol',
    subcategoria: 'Destilados',
    disponible: true
  },
  {
    id: 'menu-v56-202',
    nombre: 'Vodka',
    descripcion: 'Vodka, preparado al momento por Villa Serena.',
    precio: 65,
    categoria: 'Bebidas con alcohol',
    subcategoria: 'Destilados',
    disponible: true
  },
  {
    id: 'menu-v56-203',
    nombre: 'Ginebra',
    descripcion: 'Ginebra, preparado al momento por Villa Serena.',
    precio: 65,
    categoria: 'Bebidas con alcohol',
    subcategoria: 'Destilados',
    disponible: true
  },
  {
    id: 'menu-v56-204',
    nombre: 'Copa de Vino Espumoso',
    descripcion: 'Copa de Vino Espumoso, preparado al momento por Villa Serena.',
    precio: 65,
    categoria: 'Bebidas con alcohol',
    subcategoria: 'Para Brindar',
    disponible: true
  },
  {
    id: 'menu-v56-205',
    nombre: 'Botella de Vino Espumoso',
    descripcion: 'Botella de Vino Espumoso, preparado al momento por Villa Serena.',
    precio: 65,
    categoria: 'Bebidas con alcohol',
    subcategoria: 'Para Brindar',
    disponible: true
  },
  {
    id: 'menu-v56-206',
    nombre: 'Celebración Villa Serena',
    descripcion: 'Celebración Villa Serena, preparado al momento por Villa Serena.',
    precio: 65,
    categoria: 'Bebidas con alcohol',
    subcategoria: 'Para Brindar',
    disponible: true
  },
  {
    id: 'menu-v56-207',
    nombre: 'Mini Sándwiches Villa Serena',
    descripcion: 'Mini Sándwiches Villa Serena, preparado al momento por Villa Serena.',
    precio: 65,
    categoria: 'Entre horarios',
    subcategoria: 'Sándwiches y Wraps',
    disponible: true
  },
  {
    id: 'menu-v56-208',
    nombre: 'Wrap de Pollo y Aguacate',
    descripcion: 'Wrap de Pollo y Aguacate, preparado al momento por Villa Serena.',
    precio: 65,
    categoria: 'Entre horarios',
    subcategoria: 'Sándwiches y Wraps',
    disponible: true
  },
  {
    id: 'menu-v56-209',
    nombre: 'Club Sándwich',
    descripcion: 'Club Sándwich, preparado al momento por Villa Serena.',
    precio: 65,
    categoria: 'Entre horarios',
    subcategoria: 'Sándwiches y Wraps',
    disponible: true
  },
  {
    id: 'menu-v56-210',
    nombre: 'Sándwich Caprese',
    descripcion: 'Sándwich Caprese, preparado al momento por Villa Serena.',
    precio: 65,
    categoria: 'Entre horarios',
    subcategoria: 'Sándwiches y Wraps',
    disponible: true
  },
  {
    id: 'menu-v56-211',
    nombre: 'Quesadilla de Tres Quesos',
    descripcion: 'Quesadilla de Tres Quesos, preparado al momento por Villa Serena.',
    precio: 65,
    categoria: 'Entre horarios',
    subcategoria: 'Quesadillas',
    disponible: true
  },
  {
    id: 'menu-v56-212',
    nombre: 'Quesadilla de Pollo',
    descripcion: 'Quesadilla de Pollo, preparado al momento por Villa Serena.',
    precio: 65,
    categoria: 'Entre horarios',
    subcategoria: 'Quesadillas',
    disponible: true
  },
  {
    id: 'menu-v56-213',
    nombre: 'Nachos con Guacamole',
    descripcion: 'Nachos con Guacamole, preparado al momento por Villa Serena.',
    precio: 65,
    categoria: 'Entre horarios',
    subcategoria: 'Snacks',
    disponible: true
  },
  {
    id: 'menu-v56-214',
    nombre: 'Papas con Queso y Tocino',
    descripcion: 'Papas con Queso y Tocino, preparado al momento por Villa Serena.',
    precio: 65,
    categoria: 'Entre horarios',
    subcategoria: 'Snacks',
    disponible: true
  },
  {
    id: 'menu-v56-215',
    nombre: 'Deditos de Pollo',
    descripcion: 'Deditos de Pollo, preparado al momento por Villa Serena.',
    precio: 65,
    categoria: 'Entre horarios',
    subcategoria: 'Snacks',
    disponible: true
  },
  {
    id: 'menu-v56-216',
    nombre: 'Croquetas de Pollo y Queso',
    descripcion: 'Croquetas de Pollo y Queso, preparado al momento por Villa Serena.',
    precio: 65,
    categoria: 'Entre horarios',
    subcategoria: 'Snacks',
    disponible: true
  },
  {
    id: 'menu-v56-217',
    nombre: 'Tostadas de Aguacate',
    descripcion: 'Tostadas de Aguacate, preparado al momento por Villa Serena.',
    precio: 65,
    categoria: 'Entre horarios',
    subcategoria: 'Opciones Ligeras',
    disponible: true
  },
  {
    id: 'menu-v56-218',
    nombre: 'Bowl de Pollo',
    descripcion: 'Bowl de Pollo, preparado al momento por Villa Serena.',
    precio: 65,
    categoria: 'Entre horarios',
    subcategoria: 'Opciones Ligeras',
    disponible: true
  },
  {
    id: 'menu-v56-219',
    nombre: 'Ensalada Ligera Villa Serena',
    descripcion: 'Ensalada Ligera Villa Serena, preparado al momento por Villa Serena.',
    precio: 65,
    categoria: 'Entre horarios',
    subcategoria: 'Opciones Ligeras',
    disponible: true
  },
  {
    id: 'menu-v56-220',
    nombre: 'Bowl de Frutas',
    descripcion: 'Bowl de Frutas, preparado al momento por Villa Serena.',
    precio: 65,
    categoria: 'Entre horarios',
    subcategoria: 'Frutas y Yogurt',
    disponible: true
  },
  {
    id: 'menu-v56-221',
    nombre: 'Yogurt Parfait',
    descripcion: 'Yogurt Parfait, preparado al momento por Villa Serena.',
    precio: 65,
    categoria: 'Entre horarios',
    subcategoria: 'Frutas y Yogurt',
    disponible: true
  },
  {
    id: 'menu-v56-222',
    nombre: 'Frutas con Yogurt y Granola',
    descripcion: 'Frutas con Yogurt y Granola, preparado al momento por Villa Serena.',
    precio: 65,
    categoria: 'Entre horarios',
    subcategoria: 'Frutas y Yogurt',
    disponible: true
  },
  {
    id: 'menu-v56-223',
    nombre: 'Tabla de Frutas y Quesos',
    descripcion: 'Tabla de Frutas y Quesos, preparado al momento por Villa Serena.',
    precio: 65,
    categoria: 'Entre horarios',
    subcategoria: 'Frutas y Yogurt',
    disponible: true
  },
  {
    id: 'menu-v56-224',
    nombre: 'Limonada Natural',
    descripcion: 'Limonada Natural, preparado al momento por Villa Serena.',
    precio: 65,
    categoria: 'Entre horarios',
    subcategoria: 'Bebidas',
    disponible: true
  },
  {
    id: 'menu-v56-225',
    nombre: 'Limonada con Hierbabuena',
    descripcion: 'Limonada con Hierbabuena, preparado al momento por Villa Serena.',
    precio: 65,
    categoria: 'Entre horarios',
    subcategoria: 'Bebidas',
    disponible: true
  },
  {
    id: 'menu-v56-226',
    nombre: 'Naranjada Natural',
    descripcion: 'Naranjada Natural, preparado al momento por Villa Serena.',
    precio: 65,
    categoria: 'Entre horarios',
    subcategoria: 'Bebidas',
    disponible: true
  },
  {
    id: 'menu-v56-227',
    nombre: 'Rosa de Jamaica',
    descripcion: 'Rosa de Jamaica, preparado al momento por Villa Serena.',
    precio: 65,
    categoria: 'Entre horarios',
    subcategoria: 'Bebidas',
    disponible: true
  },
  {
    id: 'menu-v56-228',
    nombre: 'Té Frío de Limón',
    descripcion: 'Té Frío de Limón, preparado al momento por Villa Serena.',
    precio: 65,
    categoria: 'Entre horarios',
    subcategoria: 'Bebidas',
    disponible: true
  },
  {
    id: 'menu-v56-229',
    nombre: 'Té Frío de Durazno',
    descripcion: 'Té Frío de Durazno, preparado al momento por Villa Serena.',
    precio: 65,
    categoria: 'Entre horarios',
    subcategoria: 'Bebidas',
    disponible: true
  },
  {
    id: 'menu-v56-230',
    nombre: 'Iced Latte',
    descripcion: 'Iced Latte, preparado al momento por Villa Serena.',
    precio: 65,
    categoria: 'Entre horarios',
    subcategoria: 'Bebidas',
    disponible: true
  },
  {
    id: 'menu-v56-231',
    nombre: 'Café Frío',
    descripcion: 'Café Frío, preparado al momento por Villa Serena.',
    precio: 65,
    categoria: 'Entre horarios',
    subcategoria: 'Bebidas',
    disponible: true
  },
  {
    id: 'menu-v56-232',
    nombre: 'Agua Pura',
    descripcion: 'Agua Pura, preparado al momento por Villa Serena.',
    precio: 65,
    categoria: 'Entre horarios',
    subcategoria: 'Bebidas',
    disponible: true
  },
  {
    id: 'menu-v56-233',
    nombre: 'Agua Mineral',
    descripcion: 'Agua Mineral, preparado al momento por Villa Serena.',
    precio: 65,
    categoria: 'Entre horarios',
    subcategoria: 'Bebidas',
    disponible: true
  },
  {
    id: 'menu-v56-234',
    nombre: 'Café Guatemalteco',
    descripcion: 'Café Guatemalteco, preparado al momento por Villa Serena.',
    precio: 65,
    categoria: 'Entre horarios',
    subcategoria: 'Bebidas',
    disponible: true
  },
  {
    id: 'menu-v56-235',
    nombre: 'Americano',
    descripcion: 'Americano, preparado al momento por Villa Serena.',
    precio: 65,
    categoria: 'Entre horarios',
    subcategoria: 'Bebidas',
    disponible: true
  },
  {
    id: 'menu-v56-236',
    nombre: 'Espresso',
    descripcion: 'Espresso, preparado al momento por Villa Serena.',
    precio: 65,
    categoria: 'Entre horarios',
    subcategoria: 'Bebidas',
    disponible: true
  },
  {
    id: 'menu-v56-237',
    nombre: 'Cappuccino',
    descripcion: 'Cappuccino, preparado al momento por Villa Serena.',
    precio: 65,
    categoria: 'Entre horarios',
    subcategoria: 'Bebidas',
    disponible: true
  },
  {
    id: 'menu-v56-238',
    nombre: 'Latte',
    descripcion: 'Latte, preparado al momento por Villa Serena.',
    precio: 65,
    categoria: 'Entre horarios',
    subcategoria: 'Bebidas',
    disponible: true
  },
  {
    id: 'menu-v56-239',
    nombre: 'Mocaccino',
    descripcion: 'Mocaccino, preparado al momento por Villa Serena.',
    precio: 65,
    categoria: 'Entre horarios',
    subcategoria: 'Bebidas',
    disponible: true
  },
  {
    id: 'menu-v56-240',
    nombre: 'Chocolate Caliente',
    descripcion: 'Chocolate Caliente, preparado al momento por Villa Serena.',
    precio: 65,
    categoria: 'Entre horarios',
    subcategoria: 'Bebidas',
    disponible: true
  },
  {
    id: 'menu-v56-241',
    nombre: 'Té de Manzanilla',
    descripcion: 'Té de Manzanilla, preparado al momento por Villa Serena.',
    precio: 65,
    categoria: 'Entre horarios',
    subcategoria: 'Bebidas',
    disponible: true
  },
  {
    id: 'menu-v56-242',
    nombre: 'Té de Menta',
    descripcion: 'Té de Menta, preparado al momento por Villa Serena.',
    precio: 65,
    categoria: 'Entre horarios',
    subcategoria: 'Bebidas',
    disponible: true
  },
  {
    id: 'menu-v56-243',
    nombre: 'Té Verde',
    descripcion: 'Té Verde, preparado al momento por Villa Serena.',
    precio: 65,
    categoria: 'Entre horarios',
    subcategoria: 'Bebidas',
    disponible: true
  },
];
export function formatoFecha(valor: string): string {
  if (!valor)
    return '—';
  const d = new Date(valor.includes('T') ? valor : `${valor}T12:00:00`);
  return Number.isNaN(d.getTime()) ? valor : d.toLocaleDateString('es-GT', { day: '2-digit', month: 'short', year: 'numeric' });
}
export function formatoFechaHora(valor: string): string {
  if (!valor)
    return '—';
  const d = new Date(valor);
  return Number.isNaN(d.getTime()) ? valor : d.toLocaleString('es-GT', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
export function formatoHoraISO(valor: string): string {
  if (!valor)
    return '—';
  const d = new Date(valor);
  return Number.isNaN(d.getTime()) ? valor : d.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' });
}
export function minutosEntre(desde: string,
  hasta?: string): number {
  if (!desde)
    return 0;
  const a = new Date(desde).getTime();
  const b = hasta ? new Date(hasta).getTime() : Date.now();
  if (!Number.isFinite(a) || !Number.isFinite(b))
    return 0;
  return Math.max(0, Math.round((b - a) / 60000));
}
export function formatoDuracion(minutos?: number): string {
  if (minutos == null || !Number.isFinite(minutos))
    return '—';
  const m = Math.max(0, Math.round(minutos));
  if (m < 60)
    return `${m} min`;
  const h = Math.floor(m / 60), r = m % 60;
  return r ? `${h} h ${r} min` : `${h} h`;
}
export function pisoDeHabitacion(numero: string): number {
  const n = Number(numero);
  if (!Number.isFinite(n))
    return 1;
  return Math.floor(n / 100);
}
export const TURNOS_HORARIO: Record<TurnoRS, string> = {
  mañana: '07:00–12:00',
  tarde: '12:00–18:00',
  noche: '18:00–23:00',
};
export function turnoActual(): TurnoRS {
  const h = new Date().getHours();
  return h < 12 ? 'mañana' : h < 18 ? 'tarde' : 'noche';
}
let _codigoReserva = 1045;
export function siguienteCodigoReserva(): string {
  _codigoReserva += 1;
  return `VS-2026-${String(_codigoReserva).padStart(5, '0')}`;
}
let _numeroPedido = 1042;
export function siguienteNumeroPedido(): number {
  _numeroPedido += 1;
  return _numeroPedido;
}
let _codigoOT = 101;
export function siguienteCodigoOT(): string {
  _codigoOT += 1;
  return `OT-${String(_codigoOT).padStart(4, '0')}`;
}
