'use client';
import {useId} from 'react';
import styles from './GuatemalaPhoneInput.module.css';
function national(value:string){
 const text=value.trimStart().replace(/^\+502/,'');
 let digits=text.replace(/[^0-9]/g,'');
 if(digits.length===13&&digits.startsWith('00502'))digits=digits.slice(5);
 else if(digits.length===11&&digits.startsWith('502'))digits=digits.slice(3);
 return digits.slice(0,8);
}

export default function GuatemalaPhoneInput({value,onChange,label,error,name,height=44}:{value:string;onChange:(value:string)=>void;label:string;error?:string;name?:string;height?:number}){
 const id=useId();
 return <div className={styles.container}><div className={styles.field} style={{height}}><span className={styles.prefix}>+502</span><input className={styles.number} style={{height,minHeight:height}} type="tel" name={name} aria-label={label} required autoComplete="tel-national" inputMode="numeric" maxLength={8} pattern="[0-9]{8}" value={value} aria-invalid={Boolean(error)} aria-describedby={error?id:undefined} onChange={e=>onChange(national(e.target.value))} onPaste={e=>{e.preventDefault();const start=e.currentTarget.selectionStart??value.length,end=e.currentTarget.selectionEnd??value.length;onChange((value.slice(0,start)+national(e.clipboardData.getData('text'))+value.slice(end)).slice(0,8));}}/></div>{error&&<small id={id} role="alert" className={styles.error}>{error}</small>}</div>;
}
