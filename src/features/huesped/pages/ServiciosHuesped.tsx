import { fechaHotel } from "@/lib/hotel";
import { UiText, useUiText } from "@/i18n/UiText";
import { usePublicLanguage } from "@/components/common/PublicLanguageToggle";
import { useEffect, useRef, useState } from "react";
import { leerReservas, guardarReservas } from "@/store/reservationStore";
import { transportesEstancia, aceptarTransporte, type SolicitudTransporte } from "@/store/transportStore";
import type { ItemMenu, CategoriaMenu, ServicioCatalogo, CategoriaServicioHuesped, PedidoHuesped, MensajeChat, HabitacionHotel, LineaPedidoHuesped, TipoPedidoHuesped, } from "@/lib/pms/types";
import { formatoHoraISO, minutosEntre, ALERGIAS_FRECUENTES, TELEFONO_RECEPCION, } from "@/data/pms";
import { dinero, Chip, Campo, INPUT_CLS, Cabecera, Tarjeta, Aviso, Vacio, BotonFiltro, BotonPrimario, BotonSecundario, ESTADO_PEDIDO_META, PASOS_PEDIDO, pedidoActivo, totalPedido, CartIcon, ChatIcon, ClockIcon, CheckIcon, AlertIcon, PlusIcon, } from "@/features/huesped/pages/huespedUtils";
type Pestana = "restaurante" | "servicios" | "pedidos";
const PESTANAS: {
  id: Pestana;
  label: string;
}[] = [
    { id: "restaurante", label: "Restaurante" },
    { id: "servicios", label: "Explorar servicios" },
    { id: "pedidos", label: "Mis pedidos" },
  ];
type SeccionMenu = CategoriaMenu;
const CATEGORIAS_MENU: SeccionMenu[] = ['Desayuno', 'Almuerzo', 'Entre horarios', 'Cena', 'Postres', 'Bebidas sin alcohol', 'Bebidas con alcohol'];
const FOTO_HERO_GENERAL = "https://images.unsplash.com/photo-1595236629937-aadaf7c1d99d?auto=format&fit=crop&fm=jpg&q=88&w=1800";
const HERO_MENU: Record<SeccionMenu, {
  foto: string;
  frase: string;
}> = {
  "Desayuno": {
    foto: FOTO_HERO_GENERAL,
    frase: "Empieza el día con sabores frescos y un desayuno preparado a tu ritmo.",
  },
  "Almuerzo": {
    foto: FOTO_HERO_GENERAL,
    frase: "Una pausa deliciosa con opciones preparadas para disfrutar en Villa Serena.",
  },
  "Entre horarios": {
    foto: FOTO_HERO_GENERAL,
    frase: "Antojos, bocados y bebidas para disfrutar en cualquier momento del día.",
  },
  "Cena": {
    foto: FOTO_HERO_GENERAL,
    frase: "Cierra el día con una cena especial y sabores para disfrutar sin prisa.",
  },
  "Postres": {
    foto: FOTO_HERO_GENERAL,
    frase: "Un final dulce para convertir cualquier momento en algo especial.",
  },
  "Bebidas sin alcohol": {
    foto: FOTO_HERO_GENERAL,
    frase: "Refresca tu estancia con bebidas frías, cafés y opciones para cada momento.",
  },
  "Bebidas con alcohol": {
    foto: FOTO_HERO_GENERAL,
    frase: "Brinda y disfruta una selección de vinos, cervezas y cócteles Villa Serena.",
  },
};
const CATEGORIAS_SERVICIO: CategoriaServicioHuesped[] = [
  "Habitación",
  "Limpieza y lavandería",
  "Spa y Relajación",
  "Celebraciones y detalles",
  "Recepción",
];
const FOTO_GENERAL = "https://images.unsplash.com/photo-1595236629937-aadaf7c1d99d?auto=format&fit=crop&fm=jpg&q=88&w=1800";
const PRESENTACION_SERVICIO: Record<CategoriaServicioHuesped | "todas", {
  foto: string;
  frase: string;
}> = {
  "todas": {
    foto: FOTO_GENERAL,
    frase: "Todo lo que necesitas para disfrutar una estancia cómoda y especial en Villa Serena.",
  },
  "Habitación": {
    foto: FOTO_GENERAL,
    frase: "Todo lo que necesitas para hacer tu habitación aún más cómoda.",
  },
  "Limpieza y lavandería": {
    foto: FOTO_GENERAL,
    frase: "Cuidamos cada detalle para mantener tu espacio limpio, cómodo y listo para disfrutar.",
  },
  "Spa y Relajación": {
    foto: FOTO_GENERAL,
    frase: "Un momento de descanso y bienestar sin salir de Villa Serena.",
  },
  "Celebraciones y detalles": {
    foto: FOTO_GENERAL,
    frase: "Haz de cada ocasión un momento especial con detalles preparados para ti.",
  },
  "Recepción": {
    foto: FOTO_GENERAL,
    frase: "Asistencia durante tu estadía para traslados, información y solicitudes de recepción.",
  },
  "Mantenimiento": {
    foto: FOTO_GENERAL,
    frase: "Reporta cualquier inconveniente en tu habitación para que podamos atenderlo.",
  },
};
const IMAGENES_SERVICIO: Record<CategoriaServicioHuesped, string> = {
  "Habitación": FOTO_GENERAL,
  "Limpieza y lavandería": FOTO_GENERAL,
  "Spa y Relajación": FOTO_GENERAL,
  "Celebraciones y detalles": FOTO_GENERAL,
  "Recepción": FOTO_GENERAL,
  "Mantenimiento": FOTO_GENERAL,
};
function horarioRestaurante(categoria: SeccionMenu,
  now = new Date()) {
  const finSemana = now.getDay() === 0 || now.getDay() === 6;
  const minutos = now.getHours() * 60 + now.getMinutes();
  let inicio = 360, fin = 1380, texto = '6:00 a. m. – 11:00 p. m.';
  if (categoria === 'Desayuno') {
    inicio = finSemana ? 420 : 390;
    fin = finSemana ? 660 : 630;
    texto = finSemana ? '7:00 a. m. – 11:00 a. m.' : '6:30 a. m. – 10:30 a. m.';
  }
  else if (categoria === 'Almuerzo') {
    inicio = 720;
    fin = finSemana ? 960 : 900;
    texto = finSemana ? '12:00 p. m. – 4:00 p. m.' : '12:00 p. m. – 3:00 p. m.';
  }
  else if (categoria === 'Cena') {
    inicio = 1080;
    fin = 1320;
    texto = '6:00 p. m. – 10:00 p. m.';
  }
  else if (categoria === 'Bebidas con alcohol') {
    inicio = 720;
    fin = 1320;
    texto = '12:00 p. m. – 10:00 p. m.';
  }
  return { texto, abierto: minutos >= inicio && minutos < fin };
}
type PersonalizacionCfg = {
  ingredientes?: string[];
  eleccion?: {
    titulo: string;
    opciones: string[];
  };
  extras?: {
    nombre: string;
    precio: number;
  }[];
};
function configPersonalizacion(item: ItemMenu): PersonalizacionCfg | null {
  const n = item.nombre;
  const exact: Record<string, PersonalizacionCfg> = {
    'Desayuno Chapín': {
      ingredientes: ['Frijoles volteados', 'Plátanos fritos', 'Queso fresco', 'Crema', 'Aguacate', 'Tortillas'],
      eleccion: { titulo: 'Preparación de huevos', opciones: ['Revueltos', 'Estrellados'] },
      extras: [{ nombre: 'Tocino', precio: 8 }, { nombre: 'Chorizo', precio: 8 }, { nombre: 'Aguacate', precio: 7 }]
    },
    'Villa Serena': {
      ingredientes: ['Tocino', 'Frijoles', 'Plátanos', 'Aguacate', 'Pan tostado', 'Mantequilla'],
      eleccion: { titulo: 'Preparación', opciones: ['Revueltos', 'Estrellados'] },
      extras: [{ nombre: 'Tocino adicional', precio: 8 }, { nombre: 'Aguacate', precio: 7 }]
    },
    'Huevos Rancheros': {
      ingredientes: ['Salsa ranchera', 'Frijoles', 'Queso fresco', 'Aguacate', 'Tortilla'],
      eleccion: { titulo: 'Preparación', opciones: ['Estrellados', 'Revueltos'] },
      extras: [{ nombre: 'Tocino', precio: 8 }, { nombre: 'Chorizo', precio: 8 }]
    },
    'Huevos con Chorizo': {
      ingredientes: ['Chorizo', 'Frijoles', 'Queso fresco', 'Plátanos', 'Tortillas'],
      extras: [{ nombre: 'Aguacate', precio: 7 }, { nombre: 'Chorizo adicional', precio: 8 }]
    },
    'Omelette Jamón y Queso': {
      ingredientes: ['Jamón', 'Queso', 'Tomate', 'Cebolla'],
      extras: [{ nombre: 'Tocino', precio: 8 }, { nombre: 'Aguacate', precio: 7 }, { nombre: 'Queso extra', precio: 5 }]
    },
    'Omelette Vegetales': {
      ingredientes: ['Espinaca', 'Tomate', 'Cebolla', 'Chile pimiento', 'Queso'],
      extras: [{ nombre: 'Jamón', precio: 7 }, { nombre: 'Aguacate', precio: 7 }, { nombre: 'Queso extra', precio: 5 }]
    },
    'Guacamole con Nachos': {
      ingredientes: ['Tomate', 'Cebolla', 'Cilantro', 'Limón', 'Nachos'],
      extras: [{ nombre: 'Guacamole', precio: 8 }, { nombre: 'Nachos', precio: 7 }, { nombre: 'Queso', precio: 6 }]
    },
    'Nachos Villa Serena': {
      ingredientes: ['Frijoles', 'Queso', 'Carne molida', 'Guacamole', 'Pico de gallo', 'Crema'],
      extras: [{ nombre: 'Carne', precio: 10 }, { nombre: 'Queso', precio: 6 }, { nombre: 'Guacamole', precio: 8 }]
    },
    'Alitas': {
      ingredientes: ['Papas fritas', 'Apio', 'Ranch'],
      eleccion: { titulo: 'Salsa', opciones: ['BBQ', 'Búfalo'] },
      extras: [{ nombre: 'Papas', precio: 8 }, { nombre: 'Ranch', precio: 5 }, { nombre: 'Salsa', precio: 4 }]
    },
    'Carne Asada': {
      ingredientes: ['Frijoles', 'Guacamole', 'Cebollines', 'Papa', 'Tortillas'],
      eleccion: { titulo: 'Término', opciones: ['Medio', '¾', 'Bien cocido'] },
      extras: [{ nombre: 'Guacamole', precio: 8 }, { nombre: 'Frijoles', precio: 6 }]
    },
    'Lomito a la Parrilla': { ingredientes: ['Vegetales', 'Salsa de la casa'], eleccion: { titulo: 'Término', opciones: ['Medio', '¾', 'Bien cocido'] } },
    'Costillas BBQ': {
      ingredientes: ['Salsa BBQ', 'Papas fritas', 'Elote', 'Ensalada de repollo'],
      extras: [{ nombre: 'BBQ', precio: 5 }, { nombre: 'Papas', precio: 8 }, { nombre: 'Elote', precio: 6 }]
    },
    'Pastel de Chocolate': {
      ingredientes: ['Cobertura de chocolate'],
      extras: [{ nombre: 'Helado de vainilla', precio: 8 }, { nombre: 'Fresas', precio: 5 }, { nombre: 'Salsa de chocolate', precio: 4 }]
    },
    'Cheesecake de Fresa': { ingredientes: ['Salsa de fresa', 'Fresas'], extras: [{ nombre: 'Fresas', precio: 5 }, { nombre: 'Salsa de fresa', precio: 4 }] },
    'Brownie con Helado': {
      ingredientes: ['Salsa de chocolate', 'Crema batida'],
      eleccion: { titulo: 'Helado', opciones: ['Vainilla', 'Chocolate', 'Fresa'] },
      extras: [{ nombre: 'Helado adicional', precio: 8 }, { nombre: 'Fresas', precio: 5 }, { nombre: 'Caramelo', precio: 4 }]
    },
  };
  if (exact[n])
    return exact[n];
  if (item.subcategoria === 'Hamburguesas')
    return {
      ingredientes: ['Queso', 'Lechuga', 'Tomate', 'Cebolla'],
      eleccion: { titulo: 'Término', opciones: ['Medio', '¾', 'Bien cocido'] },
      extras: [{ nombre: 'Tocino', precio: 7 }, { nombre: 'Aguacate', precio: 7 }, { nombre: 'Queso', precio: 5 }]
    };
  if (item.subcategoria === 'Pastas')
    return { ingredientes: ['Parmesano'], extras: [{ nombre: 'Pan de ajo', precio: 8 }, { nombre: 'Parmesano', precio: 5 }, { nombre: 'Pollo', precio: 12 }] };
  if (item.categoria === 'Bebidas con alcohol' && /(vino|espumoso)/i.test(item.nombre))
    return { ingredientes: [], eleccion: { titulo: 'Presentación', opciones: ['Copa', 'Botella'] }, extras: [] };
  if (item.categoria === 'Bebidas con alcohol')
    return null;
  return item.subcategoria ? { ingredientes: [], extras: [] } : null;
}
function productoDirecto(item: ItemMenu) {
  if (['Agua Pura', 'Agua Mineral', 'Espresso', 'Espresso Doble', 'Ginger Ale', 'Agua Tónica', 'Cerveza Sin Alcohol 0.0'].includes(item.nombre))
    return true;
  if (item.categoria !== 'Bebidas con alcohol')
    return false;
  return !/(vino|espumoso)/i.test(item.nombre);
}
type Carrito = Record<string, number>;
interface Props {
  menu: ItemMenu[];
  servicios: ServicioCatalogo[];
  pedidos: PedidoHuesped[];
  mensajes: MensajeChat[];
  escribiendo: boolean;
  habitacion: HabitacionHotel;
  reserva: import("@/lib/pms/types").Reserva;
  huespedId: string;
  estanciaCerrada: boolean;
  onCrearPedido: (datos: {
    tipo: TipoPedidoHuesped;
    lineas: LineaPedidoHuesped[];
    nota: string;
    alergias: string;
    lugarEntrega?: string;
    codigoCupon?: string;
    descuentoPct?: number;
  }) => number;
  onCancelarPedido: (id: string, motivo?: string) => void;
  onEnviarMensaje: (texto: string) => void;
  onIrCuenta: () => void;
  modo?: "restaurante" | "servicios";
}
export default function ServiciosHuesped({ menu, servicios, pedidos, mensajes, escribiendo, habitacion, reserva, huespedId, estanciaCerrada, onCrearPedido, onCancelarPedido, onEnviarMensaje, onIrCuenta, modo = "restaurante", }: Props) {
  const ui = useUiText();
  const [pedidoCancelar, setPedidoCancelar] = useState<string | null>(null);
  const [motivoCancelar, setMotivoCancelar] = useState("");
  const [pestana, setPestana] = useState<Pestana>(modo);
  const [solicitudesTransporte, setSolicitudesTransporte] = useState<SolicitudTransporte[]>([]);
  useEffect(() => {
    if (typeof window === 'undefined')
      return;
    const cargar = () => {
      try {
        setSolicitudesTransporte(transportesEstancia(reserva.id, huespedId));
      }
      catch {
        setSolicitudesTransporte([]);
      }
    };
    cargar();
    const id = window.setInterval(cargar, 1200);
    return () => window.clearInterval(id);
  },
    []);
  useEffect(() => setPestana(modo), [modo]);
  const [catMenu, setCatMenu] = useState<SeccionMenu>("Desayuno");
  const [turnoMenu, setTurnoMenu] = useState<SeccionMenu>("Desayuno");
  const [carritoAbierto, setCarritoAbierto] = useState(false);
  const [subcategoria, setSubcategoria] = useState("Todas");
  const [catServicio, setCatServicio] = useState<CategoriaServicioHuesped | "todas">("todas");
  const [carritoMenu, setCarritoMenu] = useState<Carrito>({});
  const [carritoServicios, setCarritoServicios] = useState<Carrito>({});
  const claveAgua = `vs-agua-${habitacion.numero}-${fechaHotel()}`;
  const [aguaUsada, setAguaUsada] = useState(() => typeof window === 'undefined' ? 0 : Number(localStorage.getItem(claveAgua) || 0));
  const [alergias, setAlergias] = useState<string[]>([]);
  const [otraAlergia, setOtraAlergia] = useState("");
  const [notaMenu, setNotaMenu] = useState("");
  const [codigoCupon, setCodigoCupon] = useState("");
  const [cuponAplicado, setCuponAplicado] = useState<{
    codigo: string;
    pct: number;
  } | null>(null);
  const [errorCupon, setErrorCupon] = useState("");
  const [notaServicio, setNotaServicio] = useState("");
  const [productoActivo, setProductoActivo] = useState<ItemMenu | null>(null);
  const [servicioActivo, setServicioActivo] = useState<ServicioCatalogo | null>(null);
  const [detalleServicio, setDetalleServicio] = useState({
    fecha: "",
    hora: "",
    tipo: "",
    cantidad: 1,
    nota: "",
    prioridad: "Puede esperar",
    permiso: "Sí",
    mensaje: "",
    personas: 1,
    lugar: "",
    vuelo: "",
    problema: ""
  });
  const [cantidadProducto, setCantidadProducto] = useState(1);
  const [personalizacion, setPersonalizacion] = useState("");
  const [extrasSeleccionados, setExtrasSeleccionados] = useState<Record<string, number>>({});
  const [eleccionProducto, setEleccionProducto] = useState("");
  const [ingredientesExcluidos, setIngredientesExcluidos] = useState<string[]>([]);
  const [busquedaMenu, setBusquedaMenu] = useState("");
  const categoriaDisponible = (categoria: SeccionMenu) => horarioRestaurante(categoria).abierto;
  const activos = pedidos.filter(pedidoActivo);
  const seccionDeItem = (i: ItemMenu): SeccionMenu => i.categoria;
  const itemsMenu = menu.filter((i) => {
    if (seccionDeItem(i) !== catMenu)
      return false;
    if (subcategoria !== "Todas" && i.subcategoria !== subcategoria)
      return false;
    const q = busquedaMenu.trim().toLowerCase();
    return !q || `${i.nombre} ${i.descripcion} ${i.subcategoria ?? ''}`.toLowerCase().includes(q);
  });
  const itemsServicio = servicios.filter((s) => catServicio === "todas" || s.categoria === catServicio);
  const lineasMenu: LineaPedidoHuesped[] = (Object.entries(carritoMenu) as [
    string,
    number
  ][])
    .filter(([, c]) => c > 0)
    .map(([id, cantidad]) => {
      const item = menu.find((m) => m.id === id)!;
      return {
        refId: id,
        nombre: item.nombre,
        precioUnitario: item.precio,
        cantidad,
      };
    });
  const esTransporteConTarifa = (id: string) => ['sv-aeropuerto', 'sv-desde-aeropuerto', 'sv-taxi', 'sv-reserva-transporte'].includes(id);
  const etiquetaServicio = (id: string,
    precio: number) => esTransporteConTarifa(id)
      ? (id === 'sv-taxi' ? ui('Tarifa según destino') : id === 'sv-reserva-transporte' ? ui('Tarifa según servicio') : ui('Tarifa según recorrido'))
      : precio === 0 ? ui('Incluido') : dinero(precio);
  const lineasServicio: LineaPedidoHuesped[] = (Object.entries(carritoServicios) as [
    string,
    number
  ][])
    .filter(([, c]) => c > 0)
    .map(([id, cantidad]) => {
      const s = servicios.find((x) => x.id === id)!;
      return {
        refId: id,
        nombre: s.nombre,
        precioUnitario: s.precio,
        cantidad,
      };
    });
  const totalMenu = lineasMenu.reduce((s, l) => s + l.cantidad * l.precioUnitario, 0);
  const totalServicio = lineasServicio.reduce((s, l) => s + l.cantidad * l.precioUnitario, 0);
  function cambiar(carrito: Carrito,
    set: (c: Carrito) => void,
    id: string,
    delta: number) {
    const actual = carrito[id] ?? 0;
    const nuevo = Math.max(0, Math.min(20, actual + delta));
    set({ ...carrito, [id]: nuevo });
  }
  function textoAlergias(): string {
    const extra = otraAlergia.trim();
    return [...alergias, ...(extra ? [extra] : [])].join(", ");
  }
  function enviarPedidoMenu() {
    if (lineasMenu.length === 0)
      return;
    onCrearPedido({
      tipo: "restaurante",
      lineas: lineasMenu,
      nota: notaMenu.trim(),
      alergias: textoAlergias(),
      lugarEntrega: `Habitación ${habitacion.numero}`,
      codigoCupon: cuponAplicado?.codigo,
      descuentoPct: cuponAplicado?.pct,
    });
    setCarritoMenu({});
    setNotaMenu("");
    setCodigoCupon("");
    setCuponAplicado(null);
    setErrorCupon("");
    setPestana("pedidos");
  }
  function enviarPedidoServicio() {
    if (lineasServicio.length === 0)
      return;
    const numero = onCrearPedido({
      tipo: "servicio",
      lineas: lineasServicio,
      nota: notaServicio.trim(),
      alergias: "",
    });
    if (!numero) return;
    const transportes = lineasServicio.filter(l => esTransporteConTarifa(l.refId));
    if (transportes.length && typeof window !== 'undefined') {
      const actuales = JSON.parse(localStorage.getItem('vs-solicitudes-transporte') || '[]');
      const nuevos = transportes.map(l => ({
        id: `tr-${Date.now()}-${l.refId}`,
        reservaId: reserva.id, huespedId, habitacionId: habitacion.id, codigoReserva: reserva.codigo,
        refId: l.refId,
        servicio: l.nombre,
        habitacion: habitacion.numero,
        detalle: notaServicio.trim(),
        estadoTarifa: 'pendiente',
        tarifa: null,
        areaResponsable: 'Recepción',
        aceptacionHuesped: 'pendiente',
        creadoEn: new Date().toISOString(),
      }));
      localStorage.setItem('vs-solicitudes-transporte', JSON.stringify([...nuevos, ...actuales]));
    }
    const agua = lineasServicio.find(l => l.refId === 'sv-agua')?.cantidad ?? 0;
    if (agua) {
      const nuevo = Math.min(3, aguaUsada + agua);
      setAguaUsada(nuevo);
      localStorage.setItem(claveAgua, String(nuevo));
    }
    setCarritoServicios({});
    setNotaServicio("");
    setPestana("pedidos");
  }
  return (<div className="flex-1 overflow-y-auto bg-[#F8F6F0]" style={{ fontFamily: '"Afacad", "Segoe UI", Arial, sans-serif' }}>
    <Cabecera
      titulo={modo === "restaurante" ? "Menú" : "Servicios"}
      subtitulo={modo === "restaurante" ? `Habitación ${habitacion.numero} · Ordena alimentos y bebidas durante tu estancia.` : `Habitación ${habitacion.numero} · Solicita atención y servicios para tu estancia.`}>
      <button
        onClick={onIrCuenta}
        className="px-4 py-2.5 min-h-[44px] text-[14px] font-semibold border border-[#18345C] text-[#18345C] rounded-md hover:bg-[#18345C] hover:text-white transition-colors">
        <UiText text="           Ver mi cuenta         " />
      </button>
    </Cabecera>

    <div className="px-4 sm:px-6 pt-5 flex gap-2 flex-wrap">
      {PESTANAS.filter(p => p.id === modo || p.id === "pedidos").map((p) => (<BotonFiltro key={p.id} activo={pestana === p.id} onClick={() => setPestana(p.id)}>
        {ui(p.id === "pedidos" && modo === "servicios" ? "Mis solicitudes" : p.label)}
        {p.id === "pedidos" && activos.length > 0 && (<span className="ml-1.5 text-[11px] font-bold">
          <UiText text="(" />
          {activos.length}
          <UiText text=")" />
        </span>)}
      </BotonFiltro>))}
    </div>

    <div className="px-4 sm:px-6 py-5 space-y-5">
      {estanciaCerrada && (<Aviso tono="alerta">
        <UiText text="             Tu estancia finalizó, por lo que ya no es posible hacer pedidos a la habitación.           " />
      </Aviso>)}

      {pestana === "restaurante" && (<div className="space-y-5 pb-24">
        <div className="flex gap-2 flex-wrap">
          {CATEGORIAS_MENU.map((turno) => (<BotonFiltro key={turno} activo={catMenu === turno} onClick={() => {
            setTurnoMenu(turno);
            setCatMenu(turno);
            setSubcategoria("Todas");
          }}>
            {ui(turno)}
          </BotonFiltro>))}
        </div>
        <div className="relative min-h-[220px] overflow-hidden rounded-xl border border-[#E5E0D8] bg-[#18345C] shadow-sm">
          <img src={HERO_MENU[catMenu].foto} alt={ui(catMenu)} className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#102747]/95 via-[#102747]/65 to-[#102747]/15" />
          <div className="relative z-10 flex min-h-[220px] items-end justify-between gap-5 p-6 sm:p-8">
            <div className="max-w-2xl text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#F1D57A]">
                {ui("Menú")}
              </p>
              <h2 className="mt-1 text-3xl font-semibold">
                {ui(catMenu)}
              </h2>
              <p className="mt-2 max-w-xl text-base text-white/90">
                {ui(HERO_MENU[catMenu].frase)}
              </p>
            </div>
            <div className="shrink-0 rounded-lg bg-white/90 px-4 py-3 text-right text-sm text-[#18345C] backdrop-blur-sm">
              <span>{ui("Horario")} · <b>
                {horarioRestaurante(catMenu).texto}
              </b></span>
              <p className={horarioRestaurante(catMenu).abierto ? "font-semibold text-[#166534]" : "font-semibold text-[#A33A3A]"}>● {ui(horarioRestaurante(catMenu).abierto ? "Abierto" : "Cerrado")}</p>
            </div>
          </div>
        </div>
        {Array.from(new Set(menu.filter(i => i.categoria === catMenu).map(i => i.subcategoria).filter(Boolean) as string[])).length > 1 && <div className="flex flex-wrap gap-2">
          {["Todas", ...Array.from(new Set(menu.filter(i => i.categoria === catMenu).map(i => i.subcategoria).filter(Boolean) as string[]))].map(sc => <BotonFiltro key={sc} activo={subcategoria === sc} onClick={() => setSubcategoria(sc)}>
            {ui(sc)}
          </BotonFiltro>)}
        </div>}
        <div className="relative">
          <input
            value={busquedaMenu}
            onChange={(e) => setBusquedaMenu(e.target.value)}
            placeholder={ui("Buscar platillos y bebidas")}
            className={`${INPUT_CLS} pl-11 h-11`} />
          <span className="absolute left-4 top-3 text-[#71839B]">⌕</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {itemsMenu.map((item) => (<FilaCatalogo
            key={item.id}
            cuadrado
            foto={item.foto}
            nombre={ui(item.nombre)}
            descripcion={ui(item.descripcion)}
            precio={item.precio}
            etiqueta={ui(item.categoria)}
            disponible={item.disponible && !estanciaCerrada && categoriaDisponible(catMenu)}
            motivoNoDisponible={!item.disponible ? ui("Agotado hoy") : estanciaCerrada ? ui("Estancia finalizada") : ui("Servicio cerrado")}
            cantidad={carritoMenu[item.id] ?? 0}
            onCambiar={(d) => cambiar(carritoMenu, setCarritoMenu, item.id, d)}
            onAbrir={() => {
              if (productoDirecto(item)) {
                cambiar(carritoMenu, setCarritoMenu, item.id, 1);
                return;
              }
              setProductoActivo(item);
              setCantidadProducto(carritoMenu[item.id] ?? 1);
              setPersonalizacion("");
              setExtrasSeleccionados({});
              setEleccionProducto("");
              setIngredientesExcluidos([]);
            }} />))}
        </div>
        {itemsMenu.length === 0 && <Vacio msg="No hay platillos disponibles en esta categoría." />}
        {lineasMenu.length > 0 && (<div className="fixed bottom-5 right-5 z-40 w-auto max-w-[calc(100vw-28px)]">
          <div className="flex items-center gap-2 rounded-full bg-[#102747] p-2 shadow-2xl border border-white/10">
            <div className="h-11 w-11 shrink-0 rounded-full bg-[#F4C531] text-[#102747] flex items-center justify-center">
              <CartIcon size={21} />
            </div>
            <div className="text-white">
              <p className="text-sm font-semibold">{lineasMenu.reduce((s, l) => s + l.cantidad, 0)} · {dinero(totalMenu)}</p>
            </div>
            <button onClick={() => setCarritoAbierto(true)} className="rounded-full bg-[#F4C531] px-5 py-3 text-sm font-bold text-[#102747] hover:bg-[#ffd75b]">
              {ui("Ver carrito")}
            </button>
          </div>
        </div>)}
      </div>)}

      {pestana === "servicios" && (<div className="space-y-5 pb-24">
        <div className="space-y-4">
          {(() => {
            const p = PRESENTACION_SERVICIO[catServicio];
            return <div className="relative min-h-[205px] overflow-hidden rounded-xl border border-[#E5E0D8] bg-[#18345C]">
              <img src={p.foto} alt={ui(catServicio === "todas" ? "Servicios" : catServicio)} className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#102747]/92 via-[#102747]/55 to-transparent" />
              <div className="relative z-10 max-w-2xl p-7 sm:p-9 text-white">
                <p className="text-[11px] uppercase tracking-[0.32em] text-white/80">
                  {ui(catServicio === "todas" ? "Servicios" : catServicio)}
                </p>
                <h2 className="mt-2 text-3xl sm:text-4xl font-semibold leading-tight">
                  {ui(p.frase)}
                </h2>
              </div>
            </div>;
          })()}
          <div className="flex gap-2 flex-wrap">
            <BotonFiltro activo={catServicio === "todas"} onClick={() => setCatServicio("todas")}>
              <UiText text="Todos" />
            </BotonFiltro>
            {CATEGORIAS_SERVICIO.map((c) => (<BotonFiltro key={c} activo={catServicio === c} onClick={() => setCatServicio(c)}>
              {ui(c)}
            </BotonFiltro>))}
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {itemsServicio.map((s) => (<FilaCatalogo
              key={s.id}
              nombre={ui(s.nombre)}
              descripcion={ui(s.id === "sv-agua" ? `${s.descripcion} ${Math.max(0, 3 - aguaUsada)} disponibles hoy.` : s.descripcion)}
              precio={s.precio}
              etiqueta={ui(s.categoria)}
              disponible={!estanciaCerrada}
              motivoNoDisponible="Estancia finalizada"
              cantidad={carritoServicios[s.id] ?? 0}
              textoPrecio={esTransporteConTarifa(s.id) ? (s.id === 'sv-taxi' ? ui('Tarifa según destino') : s.id === 'sv-reserva-transporte' ? ui('Tarifa según servicio') : ui('Tarifa según recorrido')) : s.precio === 0 ? ui('Incluido') : undefined}
              onAbrir={() => {
                setServicioActivo(s);
                setDetalleServicio({
                  fecha: "",
                  hora: "",
                  tipo: "",
                  cantidad: 1,
                  nota: "",
                  prioridad: "Puede esperar",
                  permiso: "Sí",
                  mensaje: "",
                  personas: 1,
                  lugar: "",
                  vuelo: "",
                  problema: ""
                });
              }}
              textoAccion={s.id === "sv-mantenimiento" ? ui("Reportar problema") : s.id === "sv-masaje" ? ui("Reservar") : s.id === "sv-despertador" ? ui("Programar") : esTransporteConTarifa(s.id) ? ui("Solicitar transporte") : ui("Solicitar")}
              onCambiar={(d) => {
                const actual = carritoServicios[s.id] ?? 0;
                const maximo = s.id === "sv-agua" ? Math.max(0, 3 - aguaUsada) : s.categoria === "Celebraciones y detalles" ? 1 : 10;
                setCarritoServicios({ ...carritoServicios, [s.id]: Math.max(0, Math.min(maximo, actual + d)) });
              }} />))}
          </div>
        </div>
        {lineasServicio.length > 0 && (<div className="fixed bottom-5 right-5 z-40 w-auto max-w-[calc(100vw-28px)]">
          <div className="flex items-center gap-2 rounded-full bg-[#102747] p-2 shadow-2xl border border-white/10">
            <div className="h-11 w-11 shrink-0 rounded-full bg-[#F4C531] text-[#102747] flex items-center justify-center">
              <CartIcon size={21} />
            </div>
            <div className="text-white">
              <p className="text-sm font-semibold">{lineasServicio.reduce((s, l) => s + l.cantidad, 0)} · {dinero(totalServicio)}</p>
            </div>
            <button onClick={() => setCarritoAbierto(true)} className="rounded-full bg-[#F4C531] px-5 py-3 text-sm font-bold text-[#102747] hover:bg-[#ffd75b]">
              {ui("Ver carrito")}
            </button>
          </div>
        </div>)}
      </div>)}

      {pestana === "pedidos" && (<div className="space-y-4 max-w-3xl">
        {modo === 'servicios' && solicitudesTransporte.map(t => {
          const aceptada = t.aceptacionHuesped === 'aceptada';
          const aceptar = () => {
            if (aceptarTransporte(t.id, reserva.id, huespedId))
              setSolicitudesTransporte(transportesEstancia(reserva.id, huespedId));
          };
          return <section key={t.id} className="rounded-xl border border-[#E5E0D8] bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-[#18345C]">
                  {ui(t.servicio)}
                </p>
                <p className="mt-1 text-sm text-[#52677F]">
                  {t.estadoTarifa === 'confirmada' ? ui('Tarifa confirmada') : ui('Tarifa pendiente de confirmación')}
                </p>
                {t.detalle && <p className="mt-1 text-sm text-[#6B7280]">
                  {t.detalle}
                </p>}
              </div>
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${t.estadoTarifa === 'confirmada' ? 'border-[#86EFAC] bg-[#F0FAF4] text-[#166534]' : 'border-[#E7D49B] bg-[#FFF7DD] text-[#8A6200]'}`}>
                {t.estadoTarifa === 'confirmada' ? `Q ${Number(t.tarifa).toLocaleString()}` : ui('Pendiente')}
              </span>
            </div>
            {t.estadoTarifa === 'confirmada' && !aceptada && <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-[#F8F6F0] p-3">
              <p className="text-sm text-[#18345C]">
                {ui('Recepción confirmó la tarifa. Acéptala para cargarla a la cuenta de la habitación.')}
              </p>
              <button onClick={aceptar} className="rounded-lg bg-[#18345C] px-4 py-2 text-sm font-semibold text-white">
                {ui('Aceptar tarifa')}
              </button>
            </div>}
            {t.estadoTarifa === 'confirmada' && aceptada && <p className="mt-3 rounded-lg bg-[#F0FAF4] p-3 text-sm text-[#166534]">
              {ui('Tarifa aceptada. El cargo se agregará a la cuenta de la habitación.')}
            </p>}
          </section>;
        })}
        {pedidos.filter(p => modo === 'servicios' ? p.tipo === 'servicio' : p.tipo === 'restaurante').length === 0 && !(modo === 'servicios' && solicitudesTransporte.length) ? (<Vacio msg={modo === 'servicios' ? "Todavía no tienes solicitudes durante esta estancia." : "Todavía no has hecho pedidos durante esta estancia."} />) : (pedidos.filter(p => modo === 'servicios' ? p.tipo === 'servicio' : p.tipo === 'restaurante').map((p) => (<SeguimientoPedido key={p.id} pedido={p} onCancelar={() => {
          setPedidoCancelar(p.id);
          setMotivoCancelar("");
        }} />)))}
      </div>)}
    </div>
    {carritoAbierto && (<div className="fixed inset-0 z-50 flex justify-end bg-[#102747]/55" onClick={() => setCarritoAbierto(false)}>
      <div className="h-full w-full max-w-md overflow-y-auto bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E5E0D8] bg-white px-5 py-4">
          <div>
            <h2 className="text-xl font-semibold text-[#18345C]">
              {ui("Tu carrito")}
            </h2>
            <p className="text-sm text-[#71839B]">
              {ui("Revisa tu pedido antes de confirmar.")}
            </p>
          </div>
          <button onClick={() => setCarritoAbierto(false)} className="text-2xl text-[#71839B]">×</button>
        </div>
        <div className="p-5 space-y-4">
          {modo === "servicios" && pestana === "servicios" ? (<>
            {lineasServicio.length === 0 ? (<Vacio msg="No hay servicios en tu carrito." />) : (<>
              <div className="space-y-3">
                {lineasServicio.map((linea) => {
                  const servicio = servicios.find((x) => x.id === linea.refId);
                  if (!servicio)
                    return null;
                  return (<div key={linea.refId} className="rounded-xl border border-[#E5E0D8] p-3">
                    <div className="flex items-start gap-3">
                      <img src={IMAGENES_SERVICIO[servicio.categoria]} alt={ui(servicio.nombre)} className="h-16 w-20 shrink-0 rounded-lg object-cover" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-semibold text-[#18345C]">
                              {ui(servicio.nombre)}
                            </p>
                            <p className="mt-0.5 text-xs text-[#71839B]">
                              {ui(servicio.descripcion)}
                            </p>
                          </div>
                          <b className="shrink-0 text-[#18345C]">
                            {esTransporteConTarifa(linea.refId) ? ui("Pendiente") : servicio.precio === 0 ? ui("Incluido") : dinero(servicio.precio * linea.cantidad)}
                          </b>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => cambiar(carritoServicios, setCarritoServicios, linea.refId, -1)} className="h-8 w-8 rounded border border-[#CCD3DB]">−</button>
                        <span className="w-5 text-center text-sm font-semibold">
                          {linea.cantidad}
                        </span>
                        <button onClick={() => cambiar(carritoServicios, setCarritoServicios, linea.refId, 1)} className="h-8 w-8 rounded border border-[#CCD3DB]">+</button>
                      </div>
                      <button
                        onClick={() => setCarritoServicios((c) => {
                          const n = { ...c };
                          delete n[linea.refId];
                          return n;
                        })}
                        className="text-sm font-semibold text-[#B42318]">
                        {ui("Eliminar")}
                      </button>
                    </div>
                  </div>);
                })}
              </div>
              {catServicio !== "Celebraciones y detalles" && (<Campo label="Indicaciones para el personal">
                <textarea
                  value={notaServicio}
                  onChange={(e) => setNotaServicio(e.target.value)}
                  rows={2}
                  className={INPUT_CLS}
                  placeholder={ui("Indica aquí cualquier detalle importante")} />
              </Campo>)}
              <div className="flex items-center justify-between border-t border-[#E5E0D8] pt-4">
                <div>
                  <p className="text-sm text-[#71839B]">
                    {ui("Total")}
                  </p>
                  <p className="text-2xl font-bold text-[#18345C]">
                    {dinero(totalServicio)}
                  </p>
                </div>
                <button
                  onClick={enviarPedidoServicio}
                  disabled={estanciaCerrada}
                  className="rounded-xl bg-[#18345C] px-6 py-3 font-semibold text-white disabled:opacity-50">{ui("Solicitar servicios")} · {dinero(totalServicio)} →</button>
              </div>
            </>)}
          </>) : (<>
            {lineasMenu.map((linea) => {
              const item = menu.find((m) => m.id === linea.refId);
              if (!item)
                return null;
              return (<div key={linea.refId} className="flex gap-3 rounded-xl border border-[#E5E0D8] p-3">
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[#18345C]">
                        {ui(item.nombre)}
                      </p>
                      <p className="text-xs text-[#71839B] mt-0.5">
                        {ui(item.descripcion)}
                      </p>
                    </div>
                    <b className="text-[#18345C] shrink-0">
                      {dinero(item.precio * linea.cantidad)}
                    </b>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => cambiar(carritoMenu, setCarritoMenu, item.id, -1)} className="h-8 w-8 rounded border">−</button>
                      <span className="w-5 text-center text-sm font-semibold">
                        {linea.cantidad}
                      </span>
                      <button onClick={() => cambiar(carritoMenu, setCarritoMenu, item.id, 1)} className="h-8 w-8 rounded border">+</button>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <button
                        onClick={() => {
                          setProductoActivo(item);
                          setCantidadProducto(linea.cantidad);
                          setPersonalizacion("");
                          setCarritoAbierto(false);
                        }}
                        className="font-semibold text-[#18345C]">
                        {ui("Editar platillo")}
                      </button>
                      <button onClick={() => setCarritoMenu((c) => {
                        const n = { ...c };
                        delete n[item.id];
                        return n;
                      })} className="font-semibold text-[#B42318]">
                        {ui("Eliminar")}
                      </button>
                    </div>
                  </div>
                </div>
              </div>);
            })}
            <div className="rounded-xl bg-[#F0F6FB] p-4">
              <p className="font-semibold text-[#18345C]">
                {ui("Alergias")}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {ALERGIAS_FRECUENTES.map((a) => {
                  const activa = alergias.includes(a);
                  return <button
                    key={a}
                    onClick={() => setAlergias((as) => activa ? as.filter((x) => x !== a) : [...as, a])}
                    className={`rounded-lg border px-3 py-2 text-xs ${activa ? "bg-[#18345C] text-white" : "bg-white text-[#18345C]"}`}>
                    {ui(a.replace(/^Sin /, ""))}
                  </button>;
                })}
              </div>
              <input
                value={otraAlergia}
                onChange={(e) => setOtraAlergia(e.target.value)}
                className={`${INPUT_CLS} mt-3`}
                placeholder={ui("Otra alergia o intolerancia")} />
              <textarea
                value={notaMenu}
                onChange={(e) => setNotaMenu(e.target.value)}
                rows={2}
                className={`${INPUT_CLS} mt-3`}
                placeholder={ui("Indicaciones para la cocina (opcional)")} />
            </div>
            <div className="flex items-center justify-between border-t border-[#E5E0D8] pt-4">
              <div>
                <p className="text-sm text-[#71839B]">
                  {ui("Total")}
                </p>
                <p className="text-2xl font-bold text-[#18345C]">
                  {dinero(totalMenu)}
                </p>
              </div>
              <button
                onClick={enviarPedidoMenu}
                disabled={estanciaCerrada}
                className="rounded-xl bg-[#18345C] px-6 py-3 font-semibold text-white disabled:opacity-50">{ui("Confirmar pedido")} · {dinero(totalMenu)} →</button>
            </div>
          </>)}
        </div>
      </div>
    </div>)}

    {servicioActivo && (<div
      className="fixed inset-0 z-[65] grid place-items-center bg-[#102747]/55 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && setServicioActivo(null)}>
      <section className="max-h-[82vh] w-full max-w-md overflow-y-auto rounded-xl bg-white shadow-2xl">

        <header className="flex items-start justify-between border-b border-[#E5E0D8] px-4 py-3">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[#B38719]">
              {ui(servicioActivo.categoria)}
            </p>

            <h2 className="text-2xl font-semibold text-[#18345C]">
              {ui(servicioActivo.nombre)}
            </h2>
          </div>

          <button type="button" onClick={() => setServicioActivo(null)} className="text-2xl text-[#18345C]">
            ×
          </button>
        </header>

        <div className="space-y-3 p-4">

          {[
            "Spa y Relajación",
            "Celebraciones y detalles",
            "Recepción",
          ].includes(servicioActivo.categoria) && (<div className="grid grid-cols-2 gap-3">
            <Campo label="Fecha">
              <input
                type="date"
                value={detalleServicio.fecha}
                onChange={(e) => setDetalleServicio((v) => ({
                  ...v,
                  fecha: e.target.value,
                }))}
                className={INPUT_CLS} />
            </Campo>

            <Campo label="Hora">
              <input
                type="time"
                value={detalleServicio.hora}
                onChange={(e) => setDetalleServicio((v) => ({
                  ...v,
                  hora: e.target.value,
                }))}
                className={INPUT_CLS} />
            </Campo>
          </div>)}

          {servicioActivo.categoria === "Habitación" &&
            servicioActivo.id !== "sv-agua" && (<Campo label={servicioActivo.id === "sv-cuna"
              ? "Ubicación preferida"
              : "Cantidad"}>
              {servicioActivo.id === "sv-cuna" ? (<select
                value={detalleServicio.tipo}
                onChange={(e) => setDetalleServicio((v) => ({
                  ...v,
                  tipo: e.target.value,
                }))}
                className={INPUT_CLS}>
                <option value="">Seleccionar</option>
                <option>Junto a la cama</option>
                <option>Área disponible de la habitación</option>
              </select>) : (<input
                type="number"
                min={1}
                max={6}
                value={detalleServicio.cantidad}
                onChange={(e) => setDetalleServicio((v) => ({
                  ...v,
                  cantidad: Math.max(1, Number(e.target.value) || 1),
                }))}
                className={INPUT_CLS} />)}
            </Campo>)}

          {servicioActivo.categoria === "Celebraciones y detalles" && (<>
            <Campo label={servicioActivo.id === "sv-pastel"
              ? "Mensaje del pastel"
              : "Mensaje o dedicatoria"}>
              <input
                value={detalleServicio.mensaje}
                onChange={(e) => setDetalleServicio((v) => ({
                  ...v,
                  mensaje: e.target.value,
                }))}
                className={INPUT_CLS} />
            </Campo>

            {[
              "sv-romantica",
              "sv-cumple",
              "sv-aniversario",
            ].includes(servicioActivo.id) && (<Campo label="Personas">
              <input
                type="number"
                min={1}
                max={10}
                value={detalleServicio.personas}
                onChange={(e) => setDetalleServicio((v) => ({
                  ...v,
                  personas: Math.max(1, Number(e.target.value) || 1),
                }))}
                className={INPUT_CLS} />
            </Campo>)}

            {servicioActivo.id === "sv-flores" && (<Campo label="Tipo de arreglo">
              <select
                value={detalleServicio.tipo}
                onChange={(e) => setDetalleServicio((v) => ({
                  ...v,
                  tipo: e.target.value,
                }))}
                className={INPUT_CLS}>
                <option value="">Seleccionar</option>
                <option>Rosas</option>
                <option>Flores mixtas</option>
                <option>Flores de temporada</option>
              </select>
            </Campo>)}

            {servicioActivo.id === "sv-pastel" && (<Campo label="Sabor">
              <select
                value={detalleServicio.tipo}
                onChange={(e) => setDetalleServicio((v) => ({
                  ...v,
                  tipo: e.target.value,
                }))}
                className={INPUT_CLS}>
                <option value="">Seleccionar</option>
                <option>Chocolate</option>
                <option>Vainilla</option>
                <option>Fresa</option>
              </select>
            </Campo>)}
          </>)}

          {servicioActivo.categoria === "Recepción" && (<>
            {[
              "sv-aeropuerto",
              "sv-desde-aeropuerto",
              "sv-taxi",
            ].includes(servicioActivo.id) && (<Campo label="Lugar de recogida o destino">
              <input
                value={detalleServicio.lugar}
                onChange={(e) => setDetalleServicio((v) => ({
                  ...v,
                  lugar: e.target.value,
                }))}
                className={INPUT_CLS} />
            </Campo>)}

            {[
              "sv-aeropuerto",
              "sv-desde-aeropuerto",
            ].includes(servicioActivo.id) && (<Campo label="Vuelo (opcional)">
              <input
                value={detalleServicio.vuelo}
                onChange={(e) => setDetalleServicio((v) => ({
                  ...v,
                  vuelo: e.target.value,
                }))}
                className={INPUT_CLS} />
            </Campo>)}

            {servicioActivo.id === "sv-equipaje" && (<Campo label="Cantidad de piezas">
              <input
                type="number"
                min={1}
                max={20}
                value={detalleServicio.cantidad}
                onChange={(e) => setDetalleServicio((v) => ({
                  ...v,
                  cantidad: Math.max(1, Number(e.target.value) || 1),
                }))}
                className={INPUT_CLS} />
            </Campo>)}
          </>)}

          {servicioActivo.id === "sv-lavanderia" && (<Campo label="Tipo">
            <select
              value={detalleServicio.tipo}
              onChange={(e) => setDetalleServicio((v) => ({
                ...v,
                tipo: e.target.value,
              }))}
              className={INPUT_CLS}>
              <option value="">Seleccionar</option>
              <option>Lavado</option>
              <option>Lavado y planchado</option>
            </select>
          </Campo>)}

          {["sv-lavanderia", "sv-planchado"].includes(servicioActivo.id) && (<Campo label="Cantidad de prendas">
            <input
              type="number"
              min={1}
              value={detalleServicio.cantidad}
              onChange={(e) => setDetalleServicio((v) => ({
                ...v,
                cantidad: Math.max(1, Number(e.target.value) || 1),
              }))}
              className={INPUT_CLS} />
          </Campo>)}

          {servicioActivo.id === "sv-masaje" && (<Campo label="Tipo de masaje">
            <select
              value={detalleServicio.tipo}
              onChange={(e) => setDetalleServicio((v) => ({
                ...v,
                tipo: e.target.value,
              }))}
              className={INPUT_CLS}>
              <option>Relajante</option>
              <option>Suave</option>
            </select>
          </Campo>)}

          {servicioActivo.id === "sv-mantenimiento" && (<>
            <Campo label="Tipo de problema">
              <select
                value={detalleServicio.tipo}
                onChange={(e) => setDetalleServicio((v) => ({
                  ...v,
                  tipo: e.target.value,
                }))}
                className={INPUT_CLS}>
                <option>Aire acondicionado</option>
                <option>TV</option>
                <option>Wi-Fi</option>
                <option>Iluminación</option>
                <option>Agua</option>
                <option>Electricidad</option>
                <option>Mobiliario</option>
                <option>Otro</option>
              </select>
            </Campo>

            <Campo label="Prioridad">
              <select
                value={detalleServicio.prioridad}
                onChange={(e) => setDetalleServicio((v) => ({
                  ...v,
                  prioridad: e.target.value,
                }))}
                className={INPUT_CLS}>
                <option>Puede esperar</option>
                <option>Lo necesito pronto</option>
              </select>
            </Campo>

            <Campo label="¿Puede ingresar el personal si no estás?">
              <select
                value={detalleServicio.permiso}
                onChange={(e) => setDetalleServicio((v) => ({
                  ...v,
                  permiso: e.target.value,
                }))}
                className={INPUT_CLS}>
                <option>Sí</option>
                <option>No</option>
              </select>
            </Campo>
          </>)}

          <Campo label="Indicaciones">
            <textarea
              rows={2}
              value={detalleServicio.nota}
              onChange={(e) => setDetalleServicio((v) => ({
                ...v,
                nota: e.target.value,
              }))}
              className={INPUT_CLS} />
          </Campo>

          {servicioActivo.precio > 0 && (<p className="rounded-lg bg-[#F8F6F0] p-3 font-semibold text-[#18345C]">
            {ui("Total")} ·{" "}
            {dinero(servicioActivo.precio *
              detalleServicio.cantidad)}
          </p>)}

          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setServicioActivo(null)} className="rounded-lg border border-[#DDD7CD] px-4 py-2 text-[#526276]">
              {ui("Cancelar")}
            </button>

            <button
              type="button"
              onClick={() => {
                setCarritoServicios((c) => ({
                  ...c,
                  [servicioActivo.id]: (c[servicioActivo.id] ?? 0) +
                    detalleServicio.cantidad,
                }));
                const info = [
                  detalleServicio.fecha,
                  detalleServicio.hora,
                  detalleServicio.tipo,
                  detalleServicio.mensaje,
                  detalleServicio.lugar,
                  detalleServicio.vuelo,
                  detalleServicio.problema,
                  detalleServicio.personas > 1
                    ? `${detalleServicio.personas} personas`
                    : "",
                  detalleServicio.prioridad,
                  detalleServicio.nota,
                ]
                  .filter(Boolean)
                  .join(" · ");
                if (info) {
                  setNotaServicio((n) => `${n}${n ? " · " : ""}${servicioActivo.nombre}: ${info}`);
                }
                setServicioActivo(null);
              }}
              className="rounded-lg bg-[#18345C] px-4 py-2 font-semibold text-white hover:bg-[#102747]">
              {ui("Agregar")}
            </button>
          </div>
        </div>
      </section>
    </div>)}
    {productoActivo && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-[#102747]/55 p-4" onClick={() => setProductoActivo(null)}>
      <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="p-5">
          <div className="flex justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-[#18345C]">
                {ui(productoActivo.nombre)}
              </h2>
              <p className="mt-1 text-[#6B7280]">
                {ui(productoActivo.descripcion)}
              </p>
            </div>
            <button onClick={() => setProductoActivo(null)} className="text-2xl text-[#6B7280]">×</button>
          </div>
          {configPersonalizacion(productoActivo) && <div className="mt-4 space-y-4 rounded-xl bg-[#F8F6F0] p-4">
            {(configPersonalizacion(productoActivo)?.ingredientes?.length ?? 0) > 0 && <div>
              <p className="font-semibold text-[#18345C]">
                {ui("Ingredientes")}
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                {configPersonalizacion(productoActivo)!.ingredientes!.map(x => <label key={x} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!ingredientesExcluidos.includes(x)}
                    onChange={e => setIngredientesExcluidos(v => e.target.checked ? v.filter(i => i !== x) : [...v, x])}
                    className="accent-[#18345C]" />
                  {ui(x)}
                </label>)}
              </div>
            </div>}
            {configPersonalizacion(productoActivo)?.eleccion && <div>
              <p className="font-semibold text-[#18345C]">
                {ui(configPersonalizacion(productoActivo)!.eleccion!.titulo)}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {configPersonalizacion(productoActivo)!.eleccion!.opciones.map(x => <label key={x} className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm">
                  <input type="radio" name="eleccion-producto" checked={eleccionProducto === x} onChange={() => setEleccionProducto(x)} />
                  {ui(x)}
                </label>)}
              </div>
            </div>}
            {(configPersonalizacion(productoActivo)?.extras?.length ?? 0) > 0 && <div>
              <p className="font-semibold text-[#18345C]">
                {ui("Extras")}
              </p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {configPersonalizacion(productoActivo)!.extras!.map(x => <label key={x.nombre} className="flex items-center justify-between rounded-lg border bg-white px-3 py-2 text-sm">
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={!!extrasSeleccionados[x.nombre]}
                      onChange={e => setExtrasSeleccionados(v => ({ ...v, [x.nombre]: e.target.checked ? x.precio : 0 }))} />
                    {ui(x.nombre)}
                  </span>
                  <b>+{dinero(x.precio)}</b>
                </label>)}
              </div>
            </div>}
          </div>}
          <Campo label={ui("¿Deseas agregar o quitar algo? (opcional)")}>
            <textarea
              value={personalizacion}
              onChange={(e) => setPersonalizacion(e.target.value)}
              rows={2}
              className={INPUT_CLS}
              placeholder={ui("Escribe aquí tus indicaciones")} />
          </Campo>
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setCantidadProducto(Math.max(1, cantidadProducto - 1))} className="h-11 w-11 rounded border">−</button>
              <b>
                {cantidadProducto}
              </b>
              <button onClick={() => setCantidadProducto(Math.min(10, cantidadProducto + 1))} className="h-11 w-11 rounded border">+</button>
            </div>
            <button
              onClick={() => {
                setCarritoMenu((c) => ({ ...c, [productoActivo.id]: (c[productoActivo.id] ?? 0) + cantidadProducto }));
                const detalle = [eleccionProducto,
                  ...(ingredientesExcluidos.length ? [`Retirar: ${ingredientesExcluidos.join(' / ')}`] : []),
                  ...(Object.entries(extrasSeleccionados) as [
                    string,
                    number
                  ][]).filter(([, v]) => v > 0).map(([k]) => k),
                  personalizacion.trim()].filter(Boolean).join(", ");
                if (detalle)
                  setNotaMenu((n) => `${n}${n ? " · " : ""}${productoActivo.nombre}: ${detalle}`);
                setProductoActivo(null);
              }}
              className="rounded-lg bg-[#18345C] px-6 py-3 font-semibold text-white">{ui("Agregar")} · {dinero((productoActivo.precio + (Object.values(extrasSeleccionados) as number[]).reduce((a, b) => a + b, 0)) * cantidadProducto)}</button>
          </div>
        </div>
      </div>
    </div>)}
    {pedidoCancelar && <div
      className="fixed inset-0 z-[150] grid place-items-center bg-[#071D34]/50 p-4"
      onMouseDown={() => {
        setPedidoCancelar(null);
        setMotivoCancelar("");
      }}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancelar-pedido-titulo"
        className="relative w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl sm:p-6"
        onMouseDown={e => e.stopPropagation()}>
        <button
          type="button"
          aria-label={ui("Cerrar")}
          onClick={() => {
            setPedidoCancelar(null);
            setMotivoCancelar("");
          }}
          className="absolute right-4 top-3 grid h-9 w-9 place-items-center rounded-full text-2xl leading-none text-[#71839B] hover:bg-[#F3F0EA] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B79B45]">×</button>
        <h3 id="cancelar-pedido-titulo" className="pr-10 text-xl font-semibold text-[#18345C]">
          <UiText text="Cancelar pedido" />
        </h3>
        <p className="mt-2 text-sm text-[#71839B]">
          <UiText text="Indica el motivo de la cancelación." />
        </p>
        <textarea
          autoFocus
          value={motivoCancelar}
          onChange={e => setMotivoCancelar(e.target.value)}
          rows={3}
          placeholder={ui("Escribe el motivo aquí...")}
          className="mt-4 w-full resize-none rounded-lg border border-[#CCD3DB] p-3 outline-none focus:border-[#18345C] focus-visible:ring-2 focus-visible:ring-[#B79B45]/40" />
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              setPedidoCancelar(null);
              setMotivoCancelar("");
            }}
            className="rounded-lg border border-[#18345C] px-4 py-2 text-sm font-semibold text-[#18345C]">
            <UiText text="Volver" />
          </button>
          <button
            type="button"
            disabled={!motivoCancelar.trim()}
            onClick={() => {
              onCancelarPedido(pedidoCancelar, motivoCancelar.trim());
              setPedidoCancelar(null);
              setMotivoCancelar("");
            }}
            className="rounded-lg bg-[#B32D2D] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">
            <UiText text="Confirmar cancelación" />
          </button>
        </div>
      </section>
    </div>}
  </div>);
}
function FilaCatalogo({ nombre, descripcion, precio, foto, etiqueta, disponible, motivoNoDisponible, cantidad, onCambiar, onAbrir, textoPrecio, textoAccion, cuadrado = false, }: {
  nombre: string;
  descripcion: string;
  precio: number;
  foto?: string;
  etiqueta: string;
  disponible: boolean;
  motivoNoDisponible: string;
  cantidad: number;
  onCambiar: (delta: number) => void;
  onAbrir?: () => void;
  textoPrecio?: string;
  textoAccion?: string;
  cuadrado?: boolean;
}) {
  const ui = useUiText();
  return (<div className={`${onAbrir ? "bg-white border rounded-xl overflow-hidden px-4 py-3.5" : "bg-white border rounded-xl px-4 py-3"} ${cuadrado ? "" : ""} ${cantidad > 0 ? "border-[#18345C]" : "border-[#E5E0D8]"}`}>
    <div className={`flex gap-2.5 h-full ${cuadrado ? "flex-col items-stretch" : "flex-col items-stretch"}`}>
      {foto && (<img src={foto} alt={nombre} className={cuadrado ? "w-full h-24 rounded-lg object-cover shrink-0" : "w-32 h-28 rounded-lg object-cover shrink-0"} />)}
      <div className="flex-1 min-w-0 py-1.5 pr-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-[15px] font-semibold text-[#18345C] leading-5">
            {nombre}
          </p>
          <Chip cls="bg-[#F8F6F0] text-[#6B7280] border-[#E5E0D8]">
            {etiqueta}
          </Chip>
          {!disponible && (<Chip cls="bg-[#FEF2F2] text-[#991B1B] border-[#FCA5A5]">
            {ui(motivoNoDisponible)}
          </Chip>)}
        </div>
        <p className="text-[12px] leading-4 text-[#6B7280] mt-1 line-clamp-2">
          {ui(descripcion)}
        </p>
        <p className="text-[14px] font-semibold text-[#18345C] mt-1.5">
          {textoPrecio ?? (precio === 0 ? "Incluido en tu estancia" : dinero(precio))}
        </p>
      </div>

      <div className="shrink-0 flex items-center justify-end pt-1">
        {cantidad === 0 ? (<button
          onClick={() => onAbrir ? onAbrir() : onCambiar(1)}
          disabled={!disponible}
          className={`px-3 py-2 min-h-[38px] text-[12px] font-semibold rounded-md transition-colors flex items-center gap-1.5 ${disponible
            ? "bg-[#18345C] text-white hover:bg-[#102747]"
            : "bg-[#F8F6F0] text-[#AEBCC1] cursor-not-allowed"}`}>
          <PlusIcon />
          {textoAccion ? textoAccion : <UiText text={onAbrir ? " Personalizar" : " Agregar"} />}
        </button>) : (<div className="flex items-center gap-2">
          <button
            onClick={() => onCambiar(-1)}
            aria-label={ui("Quitar una unidad")}
            className="w-11 h-11 flex items-center justify-center rounded-md border border-[#E5E0D8] text-[#18345C] text-[18px] font-bold hover:bg-[#F8F6F0]">
            <UiText text="                 −               " />
          </button>
          <span className="text-[17px] font-semibold text-[#18345C] w-6 text-center">
            {cantidad}
          </span>
          <button
            onClick={() => onCambiar(1)}
            aria-label={ui("Agregar una unidad")}
            className="w-11 h-11 flex items-center justify-center rounded-md border border-[#E5E0D8] text-[#18345C] text-[18px] font-bold hover:bg-[#F8F6F0]">
            <UiText text="                 +               " />
          </button>
        </div>)}
      </div>
    </div>
  </div>);
}
function SeguimientoPedido({ pedido, onCancelar, }: {
  pedido: PedidoHuesped;
  onCancelar: () => void;
}) {
  const ui = useUiText();
  const em = ESTADO_PEDIDO_META[pedido.estado];
  const indice = PASOS_PEDIDO.indexOf(pedido.estado);
  const cancelado = pedido.estado === "cancelado";
  const transcurrido = minutosEntre(pedido.creadoEn, pedido.entregadoEn);
  return (<div className="bg-white border border-[#E5E0D8] rounded-xl px-4 sm:px-5 py-4">
    <div className="flex items-start gap-3 flex-wrap">
      <div className="w-10 h-10 rounded-lg bg-[#F8F6F0] flex items-center justify-center shrink-0 text-[#18345C]">
        <CartIcon size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-[17px] font-semibold text-[#18345C]">
            <UiText text="Pedido #" />
            {pedido.numero}
          </p>
          <Chip cls={em.chip}>
            {ui(em.label)}
          </Chip>
          <Chip cls="bg-[#F8F6F0] text-[#6B7280] border-[#E5E0D8]">
            {ui(pedido.tipo === "restaurante" ? "Restaurante" : "Servicio")}
          </Chip>
        </div>
        <p className="text-[13px] text-[#AEBCC1] mt-1 flex items-center gap-1">
          <ClockIcon size={12} />
          <UiText text=" Pedido a las " />
          {formatoHoraISO(pedido.creadoEn)}
          <UiText text=" · " />
          {transcurrido}
          <UiText text=" min             " />
          {ui(pedido.estado === "entregado" ? " hasta la entrega" : " transcurridos")}
        </p>
      </div>
      {totalPedido(pedido) > 0 && (<p className="text-[20px] font-bold text-[#18345C] shrink-0">
        {dinero(totalPedido(pedido))}
      </p>)}
    </div>

    {!cancelado && (<div className="mt-4 flex items-center">
      {PASOS_PEDIDO.map((paso,
        i) => {
        const alcanzado = i <= indice;
        const meta = ESTADO_PEDIDO_META[paso];
        return (<div key={paso} className="flex-1 flex items-center">
          <div className="flex flex-col items-center gap-1 shrink-0">
            <span
              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[11px]"
              style={{
                backgroundColor: alcanzado ? meta.dot : "#E5E0D8",
              }}>
              {alcanzado ? <CheckIcon size={12} /> : ""}
            </span>
            <span className="text-[10px] text-center leading-tight max-w-[64px]" style={{ color: alcanzado ? "#18345C" : "#AEBCC1" }}>
              {ui(meta.label)}
            </span>
          </div>
          {i < PASOS_PEDIDO.length - 1 && (<span
            className="flex-1 h-0.5 mx-1 mb-4"
            style={{
              backgroundColor: i < indice ? ESTADO_PEDIDO_META[paso].dot : "#E5E0D8",
            }} />)}
        </div>);
      })}
    </div>)}

    <p className="text-[14px] text-[#6B7280] mt-3">
      {ui(em.descripcion)}
    </p>

    <div className="mt-3 bg-[#F8F6F0] border border-[#E5E0D8] rounded-lg px-3 py-2.5 space-y-1">
      {pedido.lineas.map((l) => (<div key={l.refId} className="flex items-start gap-2 text-[14px]">
        <span className="text-[#18345C] font-semibold shrink-0">
          {l.cantidad}
          <UiText text="×" />
        </span>
        <span className="flex-1 text-[#6B7280]">
          {ui(l.nombre)}
        </span>
        <span className="text-[#6B7280] shrink-0">
          {l.precioUnitario === 0
            ? ui("Sin costo")
            : dinero(l.cantidad * l.precioUnitario)}
        </span>
      </div>))}
    </div>

    {(pedido.nota || pedido.alergias) && (<div className="mt-2 space-y-1">
      {pedido.alergias && (<p className="text-[13px] text-[#991B1B] flex items-center gap-1.5">
        <AlertIcon size={13} />
        <UiText text=" Alergias: " />
        {pedido.alergias}
      </p>)}
      {pedido.nota && (<p className="text-[13px] text-[#6B7280]">
        <UiText text="Nota: " />
        {pedido.nota}
      </p>)}
    </div>)}

    {pedido.estado === "recibido" && (<div className="mt-4">
      <BotonSecundario onClick={onCancelar}>
        <UiText text="Cancelar pedido" />
      </BotonSecundario>
    </div>)}
  </div>);
}
export function ChatRecepcion({ mensajes, escribiendo, onEnviar, preguntas = [], }: {
  mensajes: MensajeChat[];
  escribiendo: boolean;
  onEnviar: (texto: string) => void;
  preguntas?: string[];
}) {
  const ui = useUiText();
  const { en } = usePublicLanguage();
  const [texto, setTexto] = useState("");
  const [adjunto, setAdjunto] = useState<{
    nombre: string;
    url: string;
  } | null>(null);
  const finRef = useRef<HTMLDivElement | null>(null);
  const archivoRef = useRef<HTMLInputElement | null>(null);
  const mensajesVisibles = mensajes.filter((mensaje,
    indice,
    lista) => {
    const anterior = lista[indice - 1];
    return !(anterior &&
      mensaje.autor === "recepcion" &&
      anterior.autor === "recepcion" &&
      mensaje.texto.trim().toLowerCase() === anterior.texto.trim().toLowerCase());
  });
  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [mensajes.length, escribiendo]);
  function enviar() {
    const t = texto.trim();
    if (!t && !adjunto)
      return;
    const mensaje = [t, adjunto ? `Imagen adjunta: ${adjunto.nombre}` : ""]
      .filter(Boolean)
      .join(" · ");
    onEnviar(mensaje);
    setTexto("");
    if (adjunto)
      URL.revokeObjectURL(adjunto.url);
    setAdjunto(null);
  }
  return (<div className="bg-white border border-[#E5E0D8] rounded-xl overflow-hidden flex flex-col">
    <div className="px-4 sm:px-5 py-3.5 border-b border-[#E5E0D8] flex items-center gap-3">
      <div className="w-9 h-9 rounded-full bg-[#18345C] flex items-center justify-center text-white shrink-0">
        <ChatIcon size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-semibold text-[#18345C]">
          <UiText text="Recepción" />
        </p>
        <p className="text-[12px] text-[#166534]">
          <UiText text="En línea" />
        </p>
        <p className="text-[11px] text-[#6B7280] mt-0.5">
          <UiText text="¿Tienes dudas sobre tu reserva o quieres solicitar algo? Escríbenos aquí." />
        </p>
      </div>
      <a href={`tel:${TELEFONO_RECEPCION.replace(/\s/g, "")}`} className="text-[13px] font-semibold text-[#18345C] hover:underline shrink-0">
        <UiText text="           Llamar         " />
      </a>
    </div>

    <div className="px-4 sm:px-5 py-4 space-y-3 h-[430px] overflow-y-auto bg-[#F8F6F0]">
      <div className="max-w-2xl rounded-xl border border-[#E5E0D8] bg-white p-4">
        <p className="font-semibold text-[#18345C]">
          <UiText text="¿En qué podemos ayudarte?" />
        </p>
        <p className="mt-1 text-[13px] text-[#6B7280]">
          <UiText text="Selecciona una opción o escribe tu consulta." />
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {preguntas.map((pregunta) => (<button
            key={pregunta}
            onClick={() => onEnviar(ui(pregunta))}
            className="rounded-full border border-[#D8B94E] bg-white px-3 py-1.5 text-[12px] text-[#18345C] hover:bg-[#FFF9E5]">
            {ui(pregunta)}
          </button>))}
        </div>
      </div>

      {mensajesVisibles.map((m) => {
        const mio = m.autor === "huesped";
        return (<div key={m.id} className={`flex ${mio ? "justify-end" : "justify-start"}`}>
          <div className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 ${mio
            ? "bg-[#18345C] text-white rounded-br-sm"
            : "bg-white text-[#1F2933] border border-[#E5E0D8] rounded-bl-sm"}`}>
            <p className="text-[14px] leading-snug">
              {en ? (m.textoEn ?? m.texto) : (m.textoEs ?? m.texto)}
            </p>
            <p className={`text-[10px] mt-1 ${mio ? "text-[#AEBCC1]" : "text-[#AEBCC1]"}`}>
              {formatoHoraISO(m.hora)}
            </p>
          </div>
        </div>);
      })}

      {escribiendo && (<div className="flex justify-start">
        <div className="bg-white border border-[#E5E0D8] rounded-2xl rounded-bl-sm px-3.5 py-2.5">
          <p className="text-[13px] text-[#AEBCC1]">
            <UiText text="Recepción está escribiendo…" />
          </p>
        </div>
      </div>)}

      <div ref={finRef} />
    </div>

    <div className="border-t border-[#E5E0D8] bg-white px-4 py-3 sm:px-5">
      {adjunto && (<div className="mb-2 flex items-center gap-3 rounded-lg border border-[#E5E0D8] bg-[#F8F6F0] p-2">
        <img src={adjunto.url} alt="Vista previa del archivo" className="h-12 w-12 rounded-md object-cover" />
        <span className="min-w-0 flex-1 truncate text-[12px] text-[#6B7280]">
          {adjunto.nombre}
        </span>
        <button onClick={() => {
          URL.revokeObjectURL(adjunto.url);
          setAdjunto(null);
        }} className="text-[12px] font-semibold text-[#991B1B]">
          <UiText text="Quitar" />
        </button>
      </div>)}
      <div className="flex gap-2">
        <input
          ref={archivoRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const archivo = e.target.files?.[0];
            if (!archivo)
              return;
            if (adjunto)
              URL.revokeObjectURL(adjunto.url);
            setAdjunto({ nombre: archivo.name, url: URL.createObjectURL(archivo) });
            e.target.value = "";
          }} />
        <button
          type="button"
          onClick={() => archivoRef.current?.click()}
          className="min-h-[44px] shrink-0 rounded-md border border-[#D8B94E] px-3 text-[18px] text-[#18345C]"
          aria-label={ui("Adjuntar imagen")}>+</button>
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter")
              enviar();
          }}
          className={INPUT_CLS}
          placeholder={ui("Escribe tu consulta a recepción…")} />

        <button
          onClick={enviar}
          disabled={!texto.trim() && !adjunto}
          className={`px-4 py-2.5 min-h-[44px] text-[14px] font-semibold rounded-md transition-colors shrink-0 ${texto.trim() || adjunto
            ? "bg-[#18345C] text-white hover:bg-[#102747]"
            : "bg-[#E5E0D8] text-[#AEBCC1] cursor-not-allowed"}`}>
          <UiText text="           Enviar         " />
        </button>
      </div>
    </div>
  </div>);
}
