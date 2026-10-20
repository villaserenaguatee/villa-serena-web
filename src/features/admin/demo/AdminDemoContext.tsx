'use client';
import {createContext, useContext, useState, type ReactNode, type Dispatch, type SetStateAction} from 'react';
import {createAdminDemoData, type AdminDemoData} from './adminDemoData';
const Context = createContext(false);
const DataContext = createContext<{data:AdminDemoData; setData:Dispatch<SetStateAction<AdminDemoData>>}|null>(null);
function DemoData({children}:{children:ReactNode}) {
  const [data,setData]=useState(createAdminDemoData);
  return <DataContext.Provider value={{data,setData}}>{children}</DataContext.Provider>;
}
export function AdminDemoProvider({enabled, children}: {enabled:boolean; children:ReactNode}) {
  return <Context.Provider value={enabled}>{enabled?<DemoData>{children}</DemoData>:children}</Context.Provider>;
}
export function useAdminVisualDemo() { return useContext(Context); }
export function useAdminDemoData() {const value=useContext(DataContext);if(!value)throw Error('La vista requiere demostración local.');return value;}
