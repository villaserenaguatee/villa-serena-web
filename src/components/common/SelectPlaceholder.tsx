'use client';
import {useEffect,useRef} from 'react';
import {selectionRequiredMessage} from '@/lib/selectionPlaceholder';

/** Empty display value, excluded from the native menu and from keyboard selection. */
export default function SelectPlaceholder(){
 const option=useRef<HTMLOptionElement>(null),ownMessage=useRef('');
 useEffect(()=>{
  const select=option.current?.closest('select');
  if(select?.value&&ownMessage.current&&select.validationMessage===ownMessage.current){select.setCustomValidity('');ownMessage.current='';}
 });
 useEffect(()=>{
  const select=option.current?.closest('select');if(!select)return;
  const clear=()=>{if(ownMessage.current&&select.validationMessage===ownMessage.current)select.setCustomValidity('');ownMessage.current='';};
  const invalid=()=>{
   clear();if(select.validity.customError||!select.validity.valueMissing)return;
   const label=select.labels?.[0]?.cloneNode(true) as HTMLElement|undefined;
   label?.querySelectorAll('select,input,textarea,button,[role="alert"]').forEach(node=>node.remove());
   ownMessage.current=selectionRequiredMessage(select.getAttribute('aria-label')||label?.textContent?.trim()||select.name||'este campo');
   select.setCustomValidity(ownMessage.current);
  };
  select.addEventListener('invalid',invalid);select.addEventListener('change',clear);select.addEventListener('input',clear);
  return()=>{select.removeEventListener('invalid',invalid);select.removeEventListener('change',clear);select.removeEventListener('input',clear);clear();};
 },[]);
 return <option ref={option} value="" disabled hidden>Seleccionar</option>;
}
