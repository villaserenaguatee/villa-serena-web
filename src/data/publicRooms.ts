import { useEffect, useState } from 'react';
import { leerTarifas, TARIFAS_EVENT, tipoPublicoATipoHotel } from '@/store/tarifasStore';
export type PublicRoom = {
  slug: string;
  name: string;
  type: string;
  floor: 1 | 2 | 3;
  price: number;
  capacity: number;
  beds: string;
  size: number;
  image: string;
  gallery: string[];
  description: string;
  features: string[];
  preferences: string[];
};
const imgs = {
  standard: ['https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1400&q=85',
    'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1400&q=85'],
  deluxe: ['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1400&q=85',
    'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1400&q=85'],
  suite: ['https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1400&q=85',
    'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1400&q=85'],
  family: ['https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=1400&q=85',
    'https://images.unsplash.com/photo-1590490359683-658d3d23f972?auto=format&fit=crop&w=1400&q=85']
};
export const publicRooms: PublicRoom[] = [
  {
    slug: 'habitacion-estandar',
    name: 'Habitación Estándar',
    floor: 1,
    type: 'Estándar',
    price: 420,
    capacity: 2,
    beds: '1 cama queen',
    size: 25,
    image: imgs.standard[0],
    gallery: imgs.standard,
    description: 'Una habitación serena y funcional, ideal para descansar o realizar una visita de trabajo.',
    features: ['Wi‑Fi incluido', 'Aire acondicionado', 'Baño privado', 'TV de pantalla plana', 'Caja fuerte', 'Toallas y artículos de aseo'],
    preferences: ['Descanso', 'Negocios']
  },
  {
    slug: 'estandar-jardin',
    name: 'Estándar Jardín',
    floor: 1,
    type: 'Estándar',
    price: 420,
    capacity: 2,
    beds: '1 cama queen',
    size: 27,
    image: imgs.standard[1],
    gallery: [imgs.standard[1], imgs.standard[0]],
    description: 'Espacio luminoso con vista al jardín y una atmósfera tranquila.',
    features: ['Vista al jardín', 'Wi‑Fi incluido', 'Aire acondicionado', 'Baño privado', 'TV', 'Secador de cabello'],
    preferences: ['Descanso', 'Bienestar']
  },
  {
    slug: 'deluxe-serena',
    name: 'Deluxe Serena',
    floor: 1,
    type: 'Deluxe',
    price: 580,
    capacity: 2,
    beds: '1 cama king',
    size: 31,
    image: imgs.deluxe[0],
    gallery: imgs.deluxe,
    description: 'Confort contemporáneo con una cómoda zona de descanso.',
    features: ['Cama king', 'Wi‑Fi incluido', 'Aire acondicionado', 'Baño privado', 'TV', 'Amenidades'],
    preferences: ['Negocios', 'Descanso']
  },
  {
    slug: 'deluxe-jardin',
    name: 'Deluxe Jardín',
    floor: 1,
    type: 'Deluxe',
    price: 580,
    capacity: 3,
    beds: '1 cama king',
    size: 34,
    image: imgs.deluxe[1],
    gallery: [imgs.deluxe[1], imgs.deluxe[0]],
    description: 'Habitación amplia con terraza y vista a los jardines de Villa Serena.',
    features: ['Terraza', 'Vista al jardín', 'Wi‑Fi incluido', 'Aire acondicionado', 'Baño privado', 'Caja fuerte'],
    preferences: ['Descanso', 'Bienestar', 'Romántica']
  },
  {
    slug: 'superior',
    name: 'Superior',
    floor: 2,
    type: 'Superior',
    price: 500,
    capacity: 3,
    beds: '1 cama king',
    size: 35,
    image: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1400&q=85',
    gallery: ['https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1400&q=85', imgs.deluxe[0]],
    description: 'Una estancia espaciosa con detalles pensados para el descanso.',
    features: ['Balcón', 'Wi‑Fi incluido', 'Aire acondicionado', 'Baño privado', 'TV', 'Zona de descanso'],
    preferences: ['Negocios', 'Descanso']
  },
  {
    slug: 'suite-serena',
    name: 'Suite Serena',
    floor: 2,
    type: 'Suite',
    price: 790,
    capacity: 2,
    beds: '1 cama king',
    size: 42,
    image: imgs.suite[0],
    gallery: imgs.suite,
    description: 'Suite amplia con cama king, terraza privada y ambiente sereno.',
    features: ['Terraza privada', 'Sala', 'Cama king', 'Wi‑Fi incluido', 'Baño privado', 'Amenidades premium'],
    preferences: ['Romántica', 'Bienestar']
  },
  {
    slug: 'suite-terraza',
    name: 'Suite con Terraza',
    floor: 2,
    type: 'Suite',
    price: 790,
    capacity: 2,
    beds: '1 cama king',
    size: 45,
    image: imgs.suite[1],
    gallery: [imgs.suite[1], imgs.suite[0]],
    description: 'Suite privada con terraza amplia para disfrutar momentos de tranquilidad.',
    features: ['Terraza amplia', 'Sala privada', 'Wi‑Fi incluido', 'Aire acondicionado', 'Baño privado', 'Caja fuerte'],
    preferences: ['Romántica', 'Descanso', 'Bienestar']
  },
  {
    slug: 'suite-familiar',
    name: 'Suite Familiar',
    floor: 2,
    type: 'Familiar',
    price: 720,
    capacity: 4,
    beds: '2 camas',
    size: 48,
    image: imgs.family[0],
    gallery: imgs.family,
    description: 'Espacio cómodo para compartir en familia sin renunciar a la privacidad.',
    features: ['Dormitorio y sala', '2 camas', 'Wi‑Fi incluido', 'Baño privado', 'TV', 'Espacio familiar'],
    preferences: ['Familiar']
  },
  {
    slug: 'familiar-premium',
    name: 'Familiar Premium',
    floor: 3,
    type: 'Familiar',
    price: 720,
    capacity: 5,
    beds: '2 camas',
    size: 54,
    image: imgs.family[1],
    gallery: [imgs.family[1], imgs.family[0]],
    description: 'Dormitorio y sala con mayor amplitud para estancias familiares.',
    features: ['Dormitorio y sala', '2 camas', 'Wi‑Fi incluido', 'Aire acondicionado', 'Baño privado', 'Sala'],
    preferences: ['Familiar', 'Descanso']
  },
  {
    slug: 'suite-panoramica',
    name: 'Suite Panorámica',
    floor: 3,
    type: 'Suite',
    price: 790,
    capacity: 2,
    beds: '1 cama king',
    size: 47,
    image: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1400&q=85',
    gallery: ['https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1400&q=85', imgs.suite[0]],
    description: 'Una suite especial con vista panorámica y espacios de descanso.',
    features: ['Vista panorámica', 'Cama king', 'Wi‑Fi incluido', 'Baño privado', 'Sala', 'Amenidades premium'],
    preferences: ['Romántica', 'Bienestar']
  },
  {
    slug: 'luna-de-miel',
    name: 'Suite Luna de Miel',
    floor: 3,
    type: 'Suite',
    price: 790,
    capacity: 2,
    beds: '1 cama king',
    size: 50,
    image: 'https://images.unsplash.com/photo-1609766857041-ed402ea8069a?auto=format&fit=crop&w=1400&q=85',
    gallery: ['https://images.unsplash.com/photo-1609766857041-ed402ea8069a?auto=format&fit=crop&w=1400&q=85', imgs.suite[1]],
    description: 'Diseñada para una estancia romántica con detalles especiales.',
    features: ['Cama king', 'Terraza', 'Bañera', 'Wi‑Fi incluido', 'Baño privado', 'Sala'],
    preferences: ['Romántica', 'Bienestar']
  },
  {
    slug: 'villa-serena-premium',
    name: 'Villa Serena Premium',
    floor: 3,
    type: 'Premium',
    price: 790,
    capacity: 4,
    beds: '2 camas',
    size: 62,
    image: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=1400&q=85',
    gallery: ['https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=1400&q=85',
      'https://images.unsplash.com/photo-1568495248636-6432b97bd949?auto=format&fit=crop&w=1400&q=85'],
    description: 'Nuestra opción más amplia, con sala, terraza y privacidad superior.',
    features: ['Suite amplia', 'Sala', 'Terraza', 'Wi‑Fi incluido', 'Baño privado', '2 camas'],
    preferences: ['Familiar', 'Bienestar']
  },
  {
    slug: 'deluxe-terraza',
    name: 'Deluxe Terraza',
    floor: 2,
    type: 'Deluxe',
    price: 580,
    capacity: 3,
    beds: '1 cama king + sofá cama',
    size: 38,
    image: 'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?auto=format&fit=crop&w=1400&q=85',
    gallery: ['https://images.unsplash.com/photo-1595576508898-0ad5c879a061?auto=format&fit=crop&w=1400&q=85',
      'https://images.unsplash.com/photo-1578898887932-dce23a595ad4?auto=format&fit=crop&w=1400&q=85'],
    description: 'Habitación amplia con terraza para disfrutar una estancia cómoda y tranquila.',
    features: ['Terraza', 'Cama king', 'Sofá cama', 'Wi‑Fi incluido', 'Baño privado', 'Aire acondicionado'],
    preferences: ['Descanso', 'Romántica', 'Bienestar']
  },
  {
    slug: 'familiar-jardin',
    name: 'Familiar Jardín',
    floor: 1,
    type: 'Familiar',
    price: 720,
    capacity: 4,
    beds: '2 camas queen',
    size: 46,
    image: 'https://images.unsplash.com/photo-1594563703937-fdc640497dcd?auto=format&fit=crop&w=1400&q=85',
    gallery: ['https://images.unsplash.com/photo-1594563703937-fdc640497dcd?auto=format&fit=crop&w=1400&q=85',
      'https://images.unsplash.com/photo-1590490359683-658d3d23f972?auto=format&fit=crop&w=1400&q=85'],
    description: 'Opción familiar con vista al jardín y espacio para compartir con comodidad.',
    features: ['Vista al jardín', '2 camas queen', 'Wi‑Fi incluido', 'Baño privado', 'TV', 'Aire acondicionado'],
    preferences: ['Familiar', 'Descanso']
  },
  {
    slug: 'premium-familiar',
    name: 'Premium Familiar',
    floor: 3,
    type: 'Premium',
    price: 790,
    capacity: 5,
    beds: '2 camas + sofá cama',
    size: 60,
    image: 'https://images.unsplash.com/photo-1566195992011-5f6b21e539aa?auto=format&fit=crop&w=1400&q=85',
    gallery: ['https://images.unsplash.com/photo-1566195992011-5f6b21e539aa?auto=format&fit=crop&w=1400&q=85',
      'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=1400&q=85'],
    description: 'Una alternativa premium para familias que necesitan mayor capacidad y espacios de descanso.',
    features: ['Sala', '2 camas', 'Sofá cama', 'Wi‑Fi incluido', 'Baño privado', 'Amenidades premium'],
    preferences: ['Familiar', 'Bienestar']
  }
];
export const money = (n: number) => `Q ${n.toLocaleString('en-US')}`;
function habitacionesConTarifas() {
  const tarifas = leerTarifas();
  return publicRooms.map(room => ({ ...room, price: tarifas[tipoPublicoATipoHotel(room.type)] }));
}
export function usePublicRooms() {
  const [rooms, setRooms] = useState<PublicRoom[]>(() => habitacionesConTarifas());
  useEffect(() => {
    const actualizar = () => setRooms(habitacionesConTarifas());
    window.addEventListener(TARIFAS_EVENT, actualizar);
    window.addEventListener('storage', actualizar);
    actualizar();
    return () => {
      window.removeEventListener(TARIFAS_EVENT, actualizar);
      window.removeEventListener('storage', actualizar);
    };
  },
    []);
  return rooms;
}
export function publicRoomForHotelType(tipo: string): PublicRoom {
  const tipoPublico = tipo === 'Standard' ? 'Estándar' : tipo === 'Suite Deluxe' ? 'Familiar' : tipo;
  return publicRooms.find(room => room.type === tipoPublico) ?? publicRooms[0];
}
