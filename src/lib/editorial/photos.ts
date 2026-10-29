import type {EditorialDocument,EditorialId} from './catalog';

export function editorialPhotoUrls(document:EditorialDocument|null|undefined,id:EditorialId,fallback:string[]){
 const element=document?.elementos.find(item=>item.id===id);
 if(!element)return fallback;
 const keys=element.fotoClaves??(element.fotoClave?[element.fotoClave]:null);
 if(keys===null)return fallback;
 return keys.map(key=>document?.fotografias?.[key]).filter((url):url is string=>{
  if(!url)return false;
  try{return ['https:','http:','blob:'].includes(new URL(url).protocol);}catch{return false;}
 });
}
