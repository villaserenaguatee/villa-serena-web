'use client';
import {useState} from 'react';
import Link from 'next/link';
import {Pencil,ExternalLink} from 'lucide-react';
import {HotelGalleryRecovery,type HotelConfiguration} from './HotelAdmin';
import AdminRefreshButton from './AdminRefreshButton';
import c from './HotelWebsiteEditor.module.css';

const fields=[['nombreComercial','Nombre comercial'],['razonSocial','Razón social'],['nit','NIT del hotel'],['direccionFiscal','Dirección fiscal']] as const;
type FiscalValues=Pick<HotelConfiguration['draft'],typeof fields[number][0]>;
export default function HotelDataPolicies({controller}:{controller:HotelConfiguration}){
 const {hotel,draft,setDraft,ready,busy,loading,error,notice,errors,setErrors,save,dirty}=controller;
 const [edition,setEdition]=useState<{source:typeof hotel;values:FiscalValues}|null>(null);
 const editing=Boolean(edition&&edition.source===hotel);
 const value=(text:string|undefined)=>text?.trim()||'No registrado';
 function edit(){setEdition({source:hotel,values:Object.fromEntries(fields.map(([key])=>[key,draft[key]])) as FiscalValues});}
 function cancel(){if(edition)setDraft(current=>({...current,...edition.values}));setErrors(current=>Object.fromEntries(Object.entries(current).filter(([key])=>!fields.some(([field])=>field===key))));setEdition(null);}
 return <main className={c.policies}>
  <header className={c.policyHeader}><div><h1>Datos y políticas del hotel</h1></div><AdminRefreshButton loading={loading} disabled={busy||dirty} onClick={controller.refresh}/></header>
  {loading&&<p role="status">Consultando configuración del hotel…</p>}
  {error&&<p role="alert" className={c.status+' '+c.error}>{error}</p>}
  {!loading&&!ready&&<p className={c.status}>La configuración inicial no está disponible. La edición y el guardado permanecen bloqueados.</p>}
  {notice&&<p role="status" className={c.status+' '+c.success}>{notice}</p>}
  <HotelGalleryRecovery controller={controller}/><div className={c.policyGrid}>
   <section className={c.policyCard} aria-labelledby="hotel-fiscal-title"><header><div><h2 id="hotel-fiscal-title">Identificación y datos fiscales</h2><p>Datos del emisor para futuras facturas. Las facturas anteriores conservan su información fiscal.</p></div>{!editing&&<button type="button" className={c.button} disabled={!ready||busy} onClick={edit}><Pencil size={14}/>Editar</button>}</header>
    {editing?<form noValidate onSubmit={event=>{event.preventDefault();void save({gallery:false});}}><div className={c.policyFields}>{fields.map(([key,label])=><div key={key}><label htmlFor={'hotel-policy-'+key}>{label} *</label><input id={'hotel-policy-'+key} required disabled={!ready||busy} value={draft[key]} aria-invalid={Boolean(errors[key])} aria-describedby={errors[key]?'hotel-policy-error-'+key:undefined} onChange={event=>{setDraft(current=>({...current,[key]:event.target.value}));setErrors(current=>({...current,[key]:''}));}}/>{errors[key]&&<small role="alert" id={'hotel-policy-error-'+key}>{errors[key]}</small>}</div>)}</div>
     {Object.entries(errors).filter(([key,message])=>message&&!fields.some(([field])=>field===key)).map(([key,message])=><p role="alert" key={key}>Revisa los datos del editor de la página web: {message}.</p>)}

     <footer><button type="button" className={c.button} disabled={busy} onClick={cancel}>Cancelar</button><button className={c.button+' '+c.save} disabled={!ready||busy||!dirty}>{busy?'Guardando…':'Guardar cambios'}</button></footer></form>:<dl className={c.policyFields}>{fields.map(([key,label])=><div key={key}><dt>{label}</dt><dd>{value(hotel?.[key])}</dd></div>)}</dl>}
   </section>
   <section className={c.policyCard} aria-labelledby="hotel-billing-title"><h2 id="hotel-billing-title">Facturación</h2><p>Facturación de demostración, sin validez ante la SAT. Se emite en el check-out conforme a las reglas de la cuenta.</p><p>El emisor utiliza los datos de «Identificación y datos fiscales». Los importes se presentan con IVA incluido, sin desglose.</p><p>La serie y el correlativo no se administran desde esta pantalla.</p></section>
   <section className={c.policyCard} aria-labelledby="hotel-hours-title"><h2 id="hotel-hours-title">Horarios y estancia</h2><p>Horarios de consulta definidos por el sistema.</p><dl className={c.policyFields}><div><dt>Check-in</dt><dd>{value(hotel?.horaCheckIn)}</dd></div><div><dt>Check-out</dt><dd>{value(hotel?.horaCheckOut)}</dd></div></dl><Link className={c.button} href="/admin/amenidades">Consultar amenidades y sus horarios</Link></section>
   <section className={c.policyCard} aria-labelledby="hotel-booking-title"><h2 id="hotel-booking-title">Reservas y cancelaciones</h2><p>Política vigente proporcionada por el servicio, de solo lectura.</p><p className={c.policyRule}>{value(hotel?.politicaCancelacion)}</p><p>Para consultar las condiciones publicadas sobre modificaciones, reembolsos, no presentación y reservas de plataformas externas:</p><Link className={c.button} href="/terminos" target="_blank" rel="noopener noreferrer">Consultar condiciones de reserva<ExternalLink size={14}/></Link></section>
   <section className={c.policyCard} aria-labelledby="hotel-legal-title"><h2 id="hotel-legal-title">Privacidad y términos</h2><p>Consulta los documentos públicos existentes. Esta pantalla no modifica ni publica textos legales.</p><div className={c.policyLinks}><Link className={c.button} href="/privacidad" target="_blank" rel="noopener noreferrer">Política de privacidad<ExternalLink size={14}/></Link><Link className={c.button} href="/terminos" target="_blank" rel="noopener noreferrer">Términos y condiciones<ExternalLink size={14}/></Link></div></section>
  </div>
 </main>;
}
