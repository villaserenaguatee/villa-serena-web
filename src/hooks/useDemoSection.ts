'use client';
import {useCallback,useEffect,useState,type Dispatch,type SetStateAction} from 'react';

/** Remembers only an allowed demo section, scoped to the current staff account. */
export function useDemoSection<T extends string>(initial:T,key:string|undefined,allowed:readonly T[]):[T,Dispatch<SetStateAction<T>>]{
 const [section,setSection]=useState(initial);
 const signature=allowed.join('|');
 useEffect(()=>{
  if(!key)return;
  try{const saved=sessionStorage.getItem(key);if(saved&&signature.split('|').includes(saved))setSection(saved as T);else{if(saved)sessionStorage.removeItem(key);setSection(initial);}}catch{setSection(initial);}
 },[key,initial,signature]);
 const change:Dispatch<SetStateAction<T>>=useCallback(value=>{
  setSection(current=>{
   const next=typeof value==='function'?value(current):value;
   if(!signature.split('|').includes(next))return current;
   if(key)try{sessionStorage.setItem(key,next);}catch{/* Navigation remains usable without storage. */}
   return next;
  });
 },[key,signature]);
 return [section,change];
}
