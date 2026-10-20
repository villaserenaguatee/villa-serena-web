import {publicRooms} from './publicRoomSeed';
const images:Record<string,string>={
  "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1400&q=85": "/images/catalogo-aprobado/a27a019011086cef.jpg",
  "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1400&q=85": "/images/catalogo-aprobado/39621f33f891e10e.jpg",
  "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1400&q=85": "/images/catalogo-aprobado/2b78f193c57eeb51.jpg",
  "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1400&q=85": "/images/catalogo-aprobado/3352221dc5775ed0.jpg",
  "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1400&q=85": "/images/catalogo-aprobado/51c13b955cf3f554.jpg",
  "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1400&q=85": "/images/catalogo-aprobado/19e772c1347bca1e.jpg",
  "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=1400&q=85": "/images/catalogo-aprobado/68df97178bf8b3a9.jpg",
  "https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1400&q=85": "/images/catalogo-aprobado/1a34f776a5ba872a.jpg",
  "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1400&q=85": "/images/catalogo-aprobado/52579b7dd49f59ba.jpg",
  "https://images.unsplash.com/photo-1590490359683-658d3d23f972?auto=format&fit=crop&w=1400&q=85": "/images/catalogo-aprobado/4438ca836036ff10.jpg",
  "https://images.unsplash.com/photo-1609766857041-ed402ea8069a?auto=format&fit=crop&w=1400&q=85": "/images/catalogo-aprobado/1e67cb627d81a4ed.jpg",
  "https://images.unsplash.com/photo-1568495248636-6432b97bd949?auto=format&fit=crop&w=1400&q=85": "/images/catalogo-aprobado/29b2694f8d735049.jpg",
  "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=1400&q=85": "/images/catalogo-aprobado/32366a7adfd9d62d.jpg",
  "https://images.unsplash.com/photo-1595576508898-0ad5c879a061?auto=format&fit=crop&w=1400&q=85": "/images/catalogo-aprobado/e22c3f5a3d1f35e3.jpg",
  "https://images.unsplash.com/photo-1594563703937-fdc640497dcd?auto=format&fit=crop&w=1400&q=85": "/images/catalogo-aprobado/c7dfe0b939e56e7c.jpg",
  "https://images.unsplash.com/photo-1566195992011-5f6b21e539aa?auto=format&fit=crop&w=1400&q=85": "/images/catalogo-aprobado/0ccc9a9c7d1cb794.jpg",
  "https://images.unsplash.com/photo-1578898887932-dce23a595ad4?auto=format&fit=crop&w=1400&q=85": "/images/catalogo-aprobado/366c4d74471073bd.jpg"
};
/** Contenido editorial aprobado; no contiene precios, stock ni asociaciones operativas. */
export const approvedPublicOffers=publicRooms.map(({price,...offer})=>({...offer,image:images[offer.image],gallery:offer.gallery.map(url=>images[url])}));
export type ApprovedPublicOffer=typeof approvedPublicOffers[number];
