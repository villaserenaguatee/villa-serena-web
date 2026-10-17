'use client';
import {createContext,useContext} from 'react';
const FormOperationContext=createContext<{error:string;busy:boolean}>({error:'',busy:false});
export const FormOperationProvider=FormOperationContext.Provider;
export default function FormOperationFeedback(){const {error,busy}=useContext(FormOperationContext);return error?<p role="alert" className="my-2 text-sm text-red-800">{error}</p>:busy?<p role="status" className="my-2 text-sm">Guardando…</p>:null;}
