export type EstadoHabitacion = 'limpia' | 'pendiente' | 'en-limpieza' | 'inspeccion' | 'fuera-servicio';
export type TipoHabitacion = 'Standard' | 'Superior' | 'Deluxe' | 'Suite Deluxe' | 'Suite';
export interface Tarea {
  id: string;
  nombre: string;
  completada: boolean;
}
export interface Habitacion {
  id: string;
  numero: string;
  piso: number;
  tipo: TipoHabitacion;
  estado: EstadoHabitacion;
  personal: string | null;
  proximaLlegada: string | null;
  tareas: Tarea[];
  observaciones: string;
  foto: string;
  finalizadaEn?: string;
}
export type EstadoSolicitud = 'pendiente' | 'en-proceso' | 'en-limpieza' | 'finalizada' | 'entregado';
export type TipoSolicitud = 'limpieza' | 'articulos';
export interface Solicitud {
  id: string;
  habitacionNumero: string;
  tipo: TipoSolicitud;
  descripcion: string;
  cantidad?: number;
  hora: string;
  estado: EstadoSolicitud;
  horaEntrega?: string;
  observaciones: string;
}
export type PrioridadIncidencia = 'alta' | 'media' | 'baja';
export type EstadoIncidencia = 'pendiente' | 'en-proceso' | 'resuelta';
export interface Incidencia {
  id: string;
  habitacionNumero: string;
  tipo: string;
  descripcion: string;
  prioridad: PrioridadIncidencia;
  hora: string;
  estado: EstadoIncidencia;
  impideUso: boolean;
  area?: AreaSolicitud;
}
export interface ObjetoOlvidado {
  id: string;
  habitacionNumero: string;
  descripcion: string;
  fechaHora: string;
  observaciones: string;
  foto?: string;
  estado: 'encontrado' | 'guardado' | 'notificado' | 'devuelto';
  origen?: 'limpieza';
  notificadoEn?: string;
  devueltoEn?: string;
}
export interface EntradaHistorial {
  id: string;
  habitacionNumero: string;
  tipo: string;
  fechaHora: string;
  estado: string;
  responsable: string;
}
export type Pantalla = 'inicio' | 'mapa' | 'solicitudes' | 'incidencias' | 'objetos' | 'historial';
export type Modulo = 'limpieza' | 'roomservice' | 'recepcion' | 'admin' | 'mantenimiento' | 'huesped';
export type EstadoPedido = 'nuevo' | 'en-preparacion' | 'en-camino' | 'entregado' | 'cancelado';
export type OrigenPedido = 'portal' | 'app' | 'telefono';
export type CategoriaMenu = 'Desayuno' | 'Almuerzo' | 'Entre horarios' | 'Cena' | 'Postres' | 'Bebidas sin alcohol' | 'Bebidas con alcohol';
export type TurnoRS = 'mañana' | 'tarde' | 'noche';
export interface ItemMenu {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: CategoriaMenu;
  subcategoria?: string;
  disponible: boolean;
  foto?: string;
}
export interface LineaPedido {
  itemId: string;
  nombre: string;
  precioUnitario: number;
  cantidad: number;
  nota?: string;
}
export interface CambioEstado {
  estado: EstadoPedido;
  fechaHora: string;
  motivo?: string;
}
export interface Pedido {
  id: string;
  reservaId?: string;
  huespedId?: string;
  habitacionId?: string;
  codigoReserva?: string;
  numero: number;
  habitacionNumero: string;
  piso: number;
  huesped: string;
  origen: OrigenPedido;
  turno: TurnoRS;
  lineas: LineaPedido[];
  notaGeneral: string;
  alergias?: string;
  indicaciones?: string;
  lugarEntrega?: string;
  codigoCupon?: string;
  descuentoPct?: number;
  estado: EstadoPedido;
  creadoEn: string;
  entregadoEn?: string;
  motivoCancelacion?: string;
  historial: CambioEstado[];
}
export interface NotificacionRS {
  id: string;
  pedidoId: string;
  habitacionNumero: string;
  hora: string;
  leida: boolean;
}
export type SeccionRS = 'resumen' | 'pedidos' | 'menu' | 'historial' | 'cargos';
export type EstadoHabHotel = 'disponible' | 'ocupada' | 'reservada' | 'en-limpieza' | 'mantenimiento';
export interface HabitacionHotel {
  id: string;
  numero: string;
  piso: number;
  tipo: TipoHabitacion;
  capacidad: number;
  precioNoche: number;
  estado: EstadoHabHotel;
}
export type TipoDocumento = 'DPI' | 'Pasaporte';
export interface Huesped {
  correoVerificacion?: { correo: string; estado: 'pendiente' | 'verificado' };
  id: string;
  nombre: string;
  foto?: string;
  tipoDocumento: TipoDocumento;
  documento: string;
  telefono: string;
  correo: string;
  nacionalidad: string;
  creadoEn: string;
}
export type EstadoReserva = 'pendiente' | 'confirmada' | 'en-curso' | 'finalizada' | 'cancelada';
export interface Acompanante {
  nombre: string;
  documento: string;
  tipoDocumento?: TipoDocumento;
  telefono?: string;
}
export type MetodoPago = 'efectivo' | 'tarjeta' | 'transferencia';
export interface Pago {
  destino?: 'alojamiento' | 'consumos';
  id: string;
  fecha: string;
  monto: number;
  metodo: MetodoPago;
  comprobante: string;
}
export interface ServicioAdicional {
  id: string;
  tipo: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  fecha: string;
}
export interface Reserva {
  id: string;
  canal?: 'DIRECTO_WEB' | 'RECEPCION' | 'BOOKING' | 'EXPEDIA';
  origenReserva?: 'publica';
  solicitudPublicaId?: string;
  precioNoche?: number;
  habitacionPublica?: string;
  codigo: string;
  huespedId: string;
  habitacionId: string | null;
  tipoHabitacion: TipoHabitacion;
  fechaEntrada: string;
  fechaSalida: string;
  personas: number;
  adultos?: number;
  ninos?: number;
  estado: EstadoReserva;
  acompanantes: Acompanante[];
  servicios: ServicioAdicional[];
  pagos: Pago[];
  descuento: number;
  checkInEn?: string;
  checkOutEn?: string;
  origenCheckIn?: 'portal' | 'recepcion';
  origenCheckOut?: 'portal' | 'recepcion';
  checkInWeb?: {
    estado: 'pendiente' | 'aprobado' | 'rechazado';
    documento: DocumentoCargado;
    documentos?: DocumentoCargado[];
    terminosAceptados: boolean;
    peticiones: string[];
    notaPeticiones: string;
    enviadoEn: string;
    revisadoEn?: string;
    motivoRevision?: string;
  };
  actividadPortal?: {
    id: string;
    tipo: 'pedido' | 'reservacion';
    categoria: string;
    detalle: string;
    fechaHora: string;
    estado: string;
    total?: number;
  }[];
  motivoCancelacion?: string;
  creadoEn: string;
}
export type EstadoSolicitudHuesped = 'pendiente' | 'en-proceso' | 'atendida';
export type PrioridadSolicitud = 'alta' | 'media' | 'baja';
export type AreaSolicitud = 'Limpieza' | 'Mantenimiento' | 'Room Service' | 'Recepción';
export interface SolicitudHuesped {
  id: string;
  huespedId: string;
  habitacionNumero: string;
  descripcion: string;
  area: AreaSolicitud;
  prioridad: PrioridadSolicitud;
  estado: EstadoSolicitudHuesped;
  fecha: string;
}
export type SeccionRecepcion = 'dia' | 'reservas' | 'disponibilidad' | 'habitaciones' | 'huespedes' | 'solicitudes' | 'incidencias' | 'reportes' | 'chat' | 'objetos';
export type SeccionAdmin = 'panel' | 'tarifas' | 'reportes' | 'personal' | 'inventario' | 'finanzas';
export type CriterioTarifa = 'temporada' | 'ocupacion' | 'evento';
export type AjusteTarifa = 'porcentaje' | 'fijo';
export interface ReglaTarifa {
  id: string;
  nombre: string;
  tipoHabitacion: TipoHabitacion | 'Todas';
  criterio: CriterioTarifa;
  ajuste: AjusteTarifa;
  valor: number;
  desde?: string;
  hasta?: string;
  umbralOcupacion?: number;
  activa: boolean;
  descripcion?: string;
}
export interface Promocion {
  id: string;
  nombre: string;
  codigo: string;
  descuentoPct: number;
  desde: string;
  hasta: string;
  activa: boolean;
}
export type RolPersonal = 'Recepción' | 'Limpieza' | 'Room Service' | 'Mantenimiento' | 'Administración';
export type TurnoPersonal = 'Mañana' | 'Tarde' | 'Noche';
export type PermisoModulo = 'limpieza' | 'roomservice' | 'recepcion' | 'admin' | 'mantenimiento';
export type EstadoAsistencia = 'presente' | 'ausente' | 'descanso' | 'pendiente';
export interface Empleado {
  id: string;
  codigoEmpleado: string;
  nombre: string;
  correo: string;
  fechaContratacion: string;
  foto?: string;
  rol: RolPersonal;
  turno: TurnoPersonal;
  telefono: string;
  activo: boolean;
  permisos: PermisoModulo[];
  tareasCompletadas: number;
  tareasAsignadas: number;
  puntualidadPct: number;
  asistencia: EstadoAsistencia;
  salarioBase?: number;
  bonosExtras?: number;
  descuentosNomina?: number;
}
export type CategoriaInsumo = 'Lencería' | 'Amenidades' | 'Limpieza' | 'Minibar' | 'Alimentos y bebidas' | 'Mantenimiento' | 'Recepción y oficina';
export type TipoMovimiento = 'entrada' | 'salida' | 'merma';
export interface Insumo {
  id: string;
  nombre: string;
  categoria: CategoriaInsumo;
  unidad: string;
  stock: number;
  stockMinimo: number;
  costoUnitario: number;
  vencimiento?: string;
}
export interface MovimientoInsumo {
  id: string;
  insumoId: string;
  tipo: TipoMovimiento;
  cantidad: number;
  motivo: string;
  fecha: string;
  areaDestino?: string;
  referencia?: string;
}
export interface CompraHotel {
  id: string;
  numeroFactura: string;
  proveedor: string;
  fecha: string;
  insumoId: string;
  cantidad: number;
  costoUnitario: number;
  subtotal: number;
  impuesto: number;
  total: number;
  estado: 'pagada' | 'pendiente';
  ivaIncluido?: boolean;
}
export interface GastoHotel {
  id: string;
  fecha: string;
  categoria: string;
  concepto: string;
  comprobante: string;
  monto: number;
  origen?: 'manual' | 'compra';
}
export interface ActivoHotel {
  id: string;
  codigo: string;
  nombre: string;
  categoria: string;
  ubicacion: string;
  fechaCompra: string;
  costo: number;
  estado: 'operativo' | 'en reparación' | 'fuera de servicio';
  vinculadoMantenimiento: boolean;
}
export type SeccionMant = 'panel' | 'incidencias' | 'ordenes' | 'preventivo' | 'activos';
export type EstadoOT = 'abierta' | 'asignada' | 'en-proceso' | 'resuelta' | 'cerrada' | 'cancelada';
export type OrigenOT = 'incidencia' | 'interna' | 'preventivo';
export type TipoAveria = 'Fuga de agua' | 'Avería técnica' | 'Daño en mobiliario' | 'Problema eléctrico' | 'Otro';
export type CategoriaActivo = 'Climatización' | 'Electricidad' | 'Fontanería' | 'Mobiliario' | 'Ascensores' | 'Cocina' | 'Refrigeración' | 'Equipos de Spa' | 'Gimnasio' | 'Piscina' | 'Seguridad' | 'Lavandería' | 'Otros';
export type EstadoActivo = 'operativo' | 'en-reparacion' | 'fuera-servicio';
export type FrecuenciaPreventivo = 'semanal' | 'mensual' | 'trimestral' | 'semestral' | 'anual' | 'otra';
export interface CambioEstadoOT {
  estado: EstadoOT;
  fechaHora: string;
  responsable: string;
  nota?: string;
}
export interface Repuesto {
  id: string;
  nombre: string;
  unidad: string;
  stock: number;
  costoUnitario: number;
}
export interface RepuestoUsado {
  repuestoId: string;
  nombre: string;
  cantidad: number;
  costoUnitario: number;
}
export interface OrdenTrabajo {
  id: string;
  codigo: string;
  ubicacion: string;
  esHabitacion: boolean;
  tipo: TipoAveria;
  descripcion: string;
  prioridad: PrioridadIncidencia;
  origen: OrigenOT;
  incidenciaId?: string;
  activoId?: string;
  tareaPreventivaId?: string;
  impideUso: boolean;
  area?: AreaSolicitud;
  estado: EstadoOT;
  tecnicoId: string | null;
  fechaCompromiso: string;
  solucion?: string;
  minutosEmpleados?: number;
  motivoCancelacion?: string;
  repuestos: RepuestoUsado[];
  creadaEn: string;
  cerradaEn?: string;
  historial: CambioEstadoOT[];
}
export interface Activo {
  id: string;
  nombre: string;
  categoria: CategoriaActivo;
  ubicacion: string;
  marcaModelo: string;
  marca?: string;
  modelo?: string;
  codigo?: string;
  costo?: number;
  instaladoEn: string;
  estado: EstadoActivo;
}
export interface TareaPreventiva {
  id: string;
  nombre: string;
  activoId: string | null;
  ubicacion: string;
  frecuencia: FrecuenciaPreventivo;
  proximaEjecucion: string;
  ultimaEjecucion?: string;
  activa: boolean;
  descripcion?: string;
}
export type SeccionHuesped = 'inicio' | 'reservar' | 'experiencias' | 'chat' | 'checkin' | 'restaurante' | 'servicios' | 'habitacion' | 'cuenta';
export interface TextoLocalizado {
  es: string;
  en: string;
  traducidoEn?: string;
  proveedorTraduccion?: 'deepl';
}
export interface NuevaOfertaHabitacion {
  tipo: TipoHabitacion;
  descripcion: string;
  amenidades: string[];
  capacidad: number;
  precioNoche: number;
  metros: number;
  fotos: string[];
}
export interface OfertaHabitacion {
  tipo: TipoHabitacion;
  descripcion: TextoLocalizado;
  capacidad: number;
  precioNoche: number;
  metros: number;
  fotos: string[];
  amenidades: TextoLocalizado[];
}
export interface DatosContacto {
  nombre: string;
  correo: string;
  telefono: string;
  documento: string;
}
export interface ReservaHuesped {
  codigo: string;
  tipo: TipoHabitacion;
  fechaEntrada: string;
  fechaSalida: string;
  personas: number;
  noches: number;
  precioNoche: number;
  total: number;
  contacto: DatosContacto;
  ultimos4: string;
  creadaEn: string;
}
export type EstadoCheckInWeb = 'disponible' | 'pendiente' | 'aprobado' | 'rechazado';
export type FormatoDocumento = 'JPG' | 'PNG' | 'PDF';
export interface DocumentoCargado {
  nombre: string;
  formato: FormatoDocumento;
  pesoKb: number;
  previewUrl?: string;
  lado?: "frente" | "reverso" | "unico";
}
export interface CheckInWeb {
  estado: EstadoCheckInWeb;
  documento: DocumentoCargado | null;
  documentos?: DocumentoCargado[];
  terminosAceptados: boolean;
  peticiones: string[];
  notaPeticiones: string;
  completadoEn?: string;
  codigoLlave?: string;
  motivoRechazo?: string;
}
export type CategoriaServicioHuesped = 'Habitación' | 'Limpieza y lavandería' | 'Spa y Relajación' | 'Celebraciones y detalles' | 'Recepción' | 'Mantenimiento';
export interface ServicioCatalogo {
  id: string;
  nombre: string;
  descripcion: string;
  categoria: CategoriaServicioHuesped;
  precio: number;
}
export type EstadoPedidoHuesped = 'recibido' | 'en-preparacion' | 'en-camino' | 'entregado' | 'cancelado';
export type TipoPedidoHuesped = 'restaurante' | 'servicio';
export interface LineaPedidoHuesped {
  refId: string;
  nombre: string;
  precioUnitario: number;
  cantidad: number;
  nota?: string;
}
export interface PedidoHuesped {
  id: string;
  numero: number;
  tipo: TipoPedidoHuesped;
  lineas: LineaPedidoHuesped[];
  nota: string;
  alergias: string;
  lugarEntrega?: string;
  codigoCupon?: string;
  descuentoPct?: number;
  motivoCancelacion?: string;
  estado: EstadoPedidoHuesped;
  creadoEn: string;
  entregadoEn?: string;
  historial: {
    estado: EstadoPedidoHuesped;
    fechaHora: string;
  }[];
}
export interface MensajeChat {
  id: string;
  autor: 'huesped' | 'recepcion';
  huespedId?: string;
  texto: string;
  textoEs?: string;
  textoEn?: string;
  idiomaOriginal?: 'es' | 'en';
  hora: string;
  editado?: boolean;
  editadoEn?: string;
  eliminadoParaTodos?: boolean;
  eliminadoPara?: Array<'huesped' | 'recepcion'>;
  leidoPor?: Array<'huesped' | 'recepcion'>;
}
export interface Luz {
  id: string;
  nombre: string;
  encendida: boolean;
  intensidad: number;
}
export interface Domotica {
  climaEncendido: boolean;
  temperatura: number;
  luces: Luz[];
  cortinas: number;
  noMolestar: boolean;
  hacerHabitacion: boolean;
  wifiConectado: boolean;
}
export type AreaAmenidad = 'Spa' | 'Gimnasio' | 'Restaurante Mirador' | 'Piscina';
export interface TurnoAmenidad {
  id: string;
  area: AreaAmenidad;
  fecha: string;
  hora: string;
  aforo: number;
  ocupados: number;
}
export interface ReservaAmenidad {
  id: string;
  turnoId: string;
  area: AreaAmenidad;
  fecha: string;
  hora: string;
  personas: number;
  detalle?: string;
  creadaEn: string;
}
export type CategoriaCargo = 'Estancia' | 'Restaurante' | 'Room service' | 'Servicios' | 'Spa y experiencias';
export interface CargoHuesped {
  id: string;
  concepto: string;
  categoria: CategoriaCargo;
  cantidad: number;
  precioUnitario: number;
  fecha: string;
}
export type MetodoPagoHuesped = 'tarjeta' | 'debito' | 'puntos';
export interface DatosFiscales {
  nombre: string;
  nit: string;
  direccion: string;
  correo: string;
}
export interface PagoHuespedApp {
  id: string;
  monto: number;
  metodo: MetodoPagoHuesped;
  fecha: string;
  comprobante: string;
  ultimos4?: string;
  puntosUsados?: number;
  descuentoPuntos?: number;
  descuentoCodigo?: number;
  codigoPromocional?: string;
  montoTarjeta?: number;
}
