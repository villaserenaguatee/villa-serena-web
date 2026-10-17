'use client';
import {useEffect,useState} from 'react';
import {usePublicLanguage} from '@/components/common/PublicLanguageToggle';
import {translatePublicContent} from './client';
import type {TranslatableContentKind} from './types';
import {menuGlossary} from './menuGlossary';
import {serviceGlossary} from './serviceGlossary';
const reviewedText=(kind:TranslatableContentKind,text:string)=>kind==='menu-item'?menuGlossary[text]:kind==='service'?serviceGlossary[text]:undefined;
const cache=new Map<string,string>();
const pending=new Map<string,ReturnType<typeof translatePublicContent>>();
function batchTranslation(texts:string[],kind:TranslatableContentKind){const key=JSON.stringify([kind,texts]);let task=pending.get(key);if(!task){task=translatePublicContent(texts,kind);pending.set(key,task);task.then(()=>pending.delete(key),()=>pending.delete(key));}return task;}
export function useContentTranslation(texts:string[],kind:TranslatableContentKind){
 const {en}=usePublicLanguage(),key=JSON.stringify([...new Set(texts.filter(t=>t.trim()&&!reviewedText(kind,t)))]);
 const [result,setResult]=useState<{key:string;values:Record<string,string>;failed:boolean}>(),[retry,setRetry]=useState(0);
 useEffect(()=>{if(!en)return;let cancelled=false;const originals:string[]=JSON.parse(key),values:Record<string,string>={};const missing=originals.filter(t=>{const prior=cache.get(kind+'\0'+t);if(prior){values[t]=prior;return false;}return true;});setResult({key,values:{...values},failed:false});
 (async()=>{try{for(let i=0;i<missing.length;i+=20){const batch=missing.slice(i,i+20),response=await batchTranslation(batch,kind);if(cancelled)return;batch.forEach((text,n)=>{const translated=response.translations[n];if(!translated)throw new Error('Empty translation');if(cache.size>=1000)cache.delete(cache.keys().next().value!);cache.set(kind+'\0'+text,translated);values[text]=translated;});setResult({key,values:{...values},failed:false});}}catch{if(!cancelled)setResult({key,values:{...values},failed:true});}})();return()=>{cancelled=true;};
 },[key,kind,en,retry]);
 return {en,text:(original:string)=>en?reviewedText(kind,original)||(result?.key===key?result.values[original]:undefined)||original:original,loading:en&&!!JSON.parse(key).length&&(!result||result.key!==key||(!result.failed&&Object.keys(result.values).length<JSON.parse(key).length)),failed:en&&result?.key===key&&result.failed,retry:()=>setRetry(n=>n+1)};
}
