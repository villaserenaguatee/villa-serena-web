// Visual fixtures, instantiated only by the local development demo provider.
// No storage, authentication accounts or API writes.
import {publicRooms} from '@/data/publicRoomSeed';
export type DemoRow = {id:string; [key:string]:unknown};
export type AdminDemoData = ReturnType<typeof createAdminDemoData>;
export function createAdminDemoData() {
  const employees:DemoRow[] = [
    ['Elena Ortiz','elena.ortiz','ADMIN','','Gerencia',6200,'Mañana'],
    ['Diego Castillo','diego.castillo','RECEPCION','','Recepción',4100,'Mañana'],
    ['Lucía Méndez','lucia.mendez','RECEPCION','','Recepción',4100,'Tarde'],
    ['Mateo Ríos','mateo.rios','ROOM_SERVICE','','Room Service',3600,'Tarde'],
    ['Valeria Soto','valeria.soto','ROOM_SERVICE','','Room Service',3600,'Mañana'],
    ['Isabel Romero','isabel.romero','MANTENIMIENTO_LIMPIEZA','LIMPIEZA','Limpieza',3400,'Mañana'],
    ['Daniel Fuentes','daniel.fuentes','MANTENIMIENTO_LIMPIEZA','MANTENIMIENTO','Mantenimiento',3900,'Mañana'],
    ['Camila León','camila.leon','MANTENIMIENTO_LIMPIEZA','LIMPIEZA','Limpieza',3400,'Tarde'],
  ].map(([nombre,mail,rol,area,cargo,salario,turno],i)=>({id:`demo-employee-${i+1}`,nombre,correo:`${mail}@example.test`,rol,area,cargo,telefono:`+502 5555 ${String(1000+i)}`,estado:i===7?'INACTIVO':'ACTIVO',perfil:{salarioBase:salario,turno,fechaContratacion:`2025-0${i%8+1}-10`,bonosExtras:250,descuentosNomina:100}}));
  const types:DemoRow[] = [
    {id:'demo-type-1',nombre:'Estándar',capacidad:2,camas:'1 queen',precioBase:420,estado:'ACTIVO',descripcion:'Una estancia cómoda para dos personas.'},
    {id:'demo-type-2',nombre:'Superior',capacidad:2,camas:'1 king',precioBase:560,estado:'ACTIVO',descripcion:'Más espacio y zona de lectura.'},
    {id:'demo-type-3',nombre:'Familiar',capacidad:4,camas:'2 queen',precioBase:720,estado:'ACTIVO',descripcion:'Espacio para compartir en familia.'},
    {id:'demo-type-4',nombre:'Suite',capacidad:3,camas:'1 king y sofá cama',precioBase:950,estado:'ACTIVO',descripcion:'Dormitorio y sala privada.'},
  ];
  // Illustrative catalog images for the local demo only, not hotel photographs.
  for (const type of types) {
    const offer = publicRooms.find(room => room.type === type.nombre);
    type.fotos = offer ? [...new Set([offer.image, ...offer.gallery])].filter(Boolean).map((url, orden) => ({url, principal: orden === 0, orden})) : [];
  }
  const rooms:DemoRow[] = Array.from({length:18},(_,i)=>({id:`demo-room-${i+1}`,numero:String((Math.floor(i/6)+1)*100+i%6+1),piso:Math.floor(i/6)+1,tipoId:types[i%4].id,estado:['Disponible','Ocupada','Disponible','En limpieza','Ocupada','Mantenimiento'][i%6]}));
  const seasons:DemoRow[] = [
    {id:'demo-season-1',nombre:'Fin de año',desde:'2026-12-15',hasta:'2027-01-05',ajustePct:20,estado:'ACTIVA'},
    {id:'demo-season-2',nombre:'Temporada tranquila',desde:'2026-11-01',hasta:'2026-11-30',ajustePct:-10,estado:'ACTIVA'},
    {id:'demo-season-3',nombre:'Semana Santa',desde:'2027-03-21',hasta:'2027-03-28',ajustePct:15,estado:'PROGRAMADA'},
  ];
  const offers:DemoRow[] = [
    {id:'demo-offer-1',nombre:'Escapada entre semana',descuento:10,desde:'2026-10-01',hasta:'2026-11-30',estado:'ACTIVA'},
    {id:'demo-offer-2',nombre:'Estancia prolongada',descuento:12,desde:'2026-11-01',hasta:'2026-12-10',estado:'PROGRAMADA'},
  ];
  const products:DemoRow[] = [
    ['Toalla de baño','Blancos','unidad',42,20,65,'Textiles del Valle'],['Sábanas queen','Blancos','juego',28,15,145,'Textiles del Valle'],
    ['Jabón de cortesía','Amenidades','unidad',160,50,4,'Suministros Roble'],['Champú de cortesía','Amenidades','unidad',18,40,6,'Suministros Roble'],
    ['Detergente neutro','Limpieza','litro',8,12,22,'Suministros Roble'],['Café de la casa','Cocina','libra',24,10,48,'Café Los Altos'],
    ['Agua embotellada','Cocina','unidad',96,48,4,'Distribuidora Central'],['Bombilla LED','Mantenimiento','unidad',16,8,28,'Suministros Roble'],
  ].map(([nombre,categoria,unidad,stock,minimo,costo,proveedor],i)=>({id:`demo-product-${i+1}`,nombre,categoria,unidad,stock,minimo,costo,proveedor}));
  const movements:DemoRow[] = products.slice(0,6).map((p,i)=>({id:`demo-movement-${i}`,productoId:p.id,fecha:`2026-10-${19-i}`,tipo:i%2?'Salida':'Entrada',cantidad:i%2?4:12,motivo:i%2?'Reposición de habitaciones':'Recepción de suministros'}));
  const purchases:DemoRow[] = [
    {id:'demo-purchase-1',codigo:'COMP-DEMO-01',proveedor:'Textiles del Valle',fecha:'2026-10-17',total:1740,estado:'RECIBIDA'},
    {id:'demo-purchase-2',codigo:'COMP-DEMO-02',proveedor:'Suministros Roble',fecha:'2026-10-18',total:720,estado:'PENDIENTE'},
    {id:'demo-purchase-3',codigo:'COMP-DEMO-03',proveedor:'Café Los Altos',fecha:'2026-10-19',total:576,estado:'RECIBIDA'},
  ];
  const expenses:DemoRow[] = [
    {id:'demo-expense-1',concepto:'Energía eléctrica',categoria:'Servicios',fecha:'2026-10-15',monto:2450},
    {id:'demo-expense-2',concepto:'Servicio de lavandería',categoria:'Operación',fecha:'2026-10-17',monto:1280},
    {id:'demo-expense-3',concepto:'Mantenimiento de piscina',categoria:'Mantenimiento',fecha:'2026-10-18',monto:650},
    {id:'demo-expense-4',concepto:'Servicio de internet',categoria:'Servicios',fecha:'2026-10-19',monto:495},
  ];
  const assets:DemoRow[] = [
    {id:'demo-asset-1',nombre:'Lavadora industrial',codigo:'ACT-DEMO-01',ubicacion:'Lavandería',estado:'OPERATIVO',costo:18500},
    {id:'demo-asset-2',nombre:'Equipo de aire acondicionado',codigo:'ACT-DEMO-02',ubicacion:'Habitación 206',estado:'EN REPARACIÓN',costo:4800},
    {id:'demo-asset-3',nombre:'Refrigerador',codigo:'ACT-DEMO-03',ubicacion:'Cocina',estado:'OPERATIVO',costo:7200},
  ];
  const attendance:DemoRow[] = employees.filter(e=>e.estado==='ACTIVO').map((e,i)=>({id:`demo-attendance-${i}`,empleadoId:e.id,fecha:'2026-10-19',turno:(e.perfil as Record<string,unknown>).turno,estado:i===4?'Descanso':i===2?'Pendiente':'Presente',observacion:''}));
  const corrections:DemoRow[] = [
    {id:'demo-correction-1',empleadoId:employees[1].id,campo:'Teléfono',nuevo:'+502 5555 2020',motivo:'Actualización de contacto',fecha:'2026-10-18',estado:'Pendiente'},
    {id:'demo-correction-2',empleadoId:employees[5].id,campo:'Nombre completo',nuevo:'Isabel Romero López',motivo:'Completar segundo apellido',fecha:'2026-10-17',estado:'Aprobada'},
  ];
  const income:DemoRow[] = [
    {id:'demo-income-1',concepto:'Alojamiento',monto:22400},
    {id:'demo-income-2',concepto:'Restaurante y Room Service',monto:3850},
    {id:'demo-income-3',concepto:'Servicios de estancia',monto:960},
  ];
  return {employees,types,rooms,seasons,offers,products,movements,purchases,expenses,assets,attendance,corrections,income};
}
