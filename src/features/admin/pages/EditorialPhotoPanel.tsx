'use client';
import type {HotelEditorial} from './useHotelEditorial';
import type {SelectedSiteElement} from './PublicWebsitePreview';
import type {CatalogPhotoDraft} from './catalogPhotoClient';
import AdminPhotoGallery from './AdminPhotoGallery';
import c from './HotelWebsiteEditor.module.css';

export default function EditorialPhotoPanel({editorial,element,photos,disabled}:{editorial:HotelEditorial;element:SelectedSiteElement;photos:CatalogPhotoDraft[];disabled:boolean}){
 const id=element.editorialId!;
 const current=editorial.state.elements.find(item=>item.id===id);
 const keys=current?.fotoClaves??(current?.fotoClave?[current.fotoClave]:null);
 const fallback=id==='inicio.imagenes'||id==='galeria-hotel.imagenes'?photos
  :id==='nosotros.imagen'?photos.slice(0,1)
  :element.value&&/^(https?:|blob:|\/)/.test(element.value)?[{url:element.value,principal:false}]:[];
 const value:CatalogPhotoDraft[]=keys===null?fallback:keys.map(clave=>({clave,url:editorial.document?.fotografias?.[clave],principal:false}));
 const available=photos.filter(photo=>photo.clave&&!value.some(item=>item.clave===photo.clave));
 return <div className={c.controls}>
  <AdminPhotoGallery management friendly title="Fotografías de esta sección" value={value}
   onChange={next=>editorial.setPhotos(id,next)} disabled={disabled||editorial.busy||editorial.loading||!editorial.state.base}
   maxPhotos={id.endsWith('.imagenes')?30:1}/>
  {available.length>0&&<label>Usar fotografía registrada
   <select aria-label="Usar fotografía registrada" value="" disabled={disabled||editorial.busy||editorial.loading||!editorial.state.base}
    onChange={event=>{const photo=photos.find(item=>item.clave===event.target.value);if(photo)editorial.setPhotos(id,id.endsWith('.imagenes')?[...value.filter(item=>item.clave),photo]:[photo]);}}>
    <option value="" disabled>Seleccionar fotografía</option>
    {available.map((photo,index)=><option key={photo.clave} value={photo.clave}>Fotografía {index+1}</option>)}
   </select>
  </label>}
  <p className={c.note}>Los cambios se muestran en la vista previa. Guardar borrador no cambia el sitio público; Publicar cambios requiere confirmación. Quitar una fotografía no borra el archivo.</p>
 </div>;
}
