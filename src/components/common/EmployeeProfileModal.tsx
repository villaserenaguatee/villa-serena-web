'use client';
import AdminRefreshButton from '@/features/admin/pages/AdminRefreshButton';
import {useEffect,useRef,useState} from 'react';
import StaffPasswordModal from '@/components/common/StaffPasswordModal';
import StaffLogoutConfirmation from './StaffLogoutConfirmation';
import {Pencil,LockKeyhole,ChevronRight,Contact,BriefcaseBusiness} from 'lucide-react';
import AdminPersonDialog from '@/features/admin/pages/AdminPersonDialog';
import {EmployeeInformationContent} from '@/features/admin/pages/EmployeeInformationDialog';
import {useAuth} from '@/hooks/useAuth';
import {operacion} from '@/lib/api/operaciones';
import StaffProfileDetails from './StaffProfileDetails';
import {operationalLabel} from '@/i18n/operationalLabels';

type Profile={id:number;nombre:string;correo:string;rol:string;area?:string|null;telefono?:string;estado?:string;perfil?:Record<string,unknown>};
export default function EmployeeProfileModal({open,onClose}:{open:boolean;onClose:()=>void}){
 const {user,localDemo=false,logout}=useAuth();const [passwordOpen,setPasswordOpen]=useState(false);
 const [profile,setProfile]=useState<Profile>(),[loading,setLoading]=useState(false),[error,setError]=useState(''),[signingOut,setSigningOut]=useState(false);
 const [reload,setReload]=useState(0);
 const [section,setSection]=useState<'personal'|'laboral'|'seguridad'>('personal');
 const [confirmLogout,setConfirmLogout]=useState(false);
 useEffect(()=>{if(open){setSection('personal');setConfirmLogout(false);}},[open,user?.id]);
 const logoutLock=useRef(false),logoutButton=useRef<HTMLButtonElement>(null);
 useEffect(()=>{
  if(!open||!user?.staff||user.role==='huesped')return;
  setError('');setProfile(user.staff);setLoading(!localDemo);
  if(localDemo)return;
  const controller=new AbortController();
  void operacion<Profile>('laboral/perfil','GET',undefined,controller.signal).then(data=>{
   if(controller.signal.aborted)return;
   if(data.id!==user.staff?.id||typeof data.nombre!=='string'||typeof data.correo!=='string')throw Error('El servicio no confirmó los datos del usuario autenticado.');
   setProfile(data);
  }).catch(e=>{if(!controller.signal.aborted)setError(e instanceof Error?e.message:'No se pudo consultar el perfil.');}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});
  return()=>controller.abort();
 },[open,user?.id,user?.staff,user?.role,localDemo,reload]);
 async function signOut(){if(logoutLock.current)return;logoutLock.current=true;setSigningOut(true);setError('');try{await logout();window.location.replace('/login');}catch{setError('No se pudo cerrar la sesión. Intenta nuevamente.');logoutLock.current=false;setSigningOut(false);}}
 if(!open||!user?.staff||user.role==='huesped')return null;
 if(confirmLogout)return <StaffLogoutConfirmation busy={signingOut} error={error} onCancel={()=>{setConfirmLogout(false);setError('');requestAnimationFrame(()=>logoutButton.current?.focus());}} onConfirm={()=>void signOut()}/>;
 if(passwordOpen)return <StaffPasswordModal onClose={()=>setPasswordOpen(false)}/>;
 const ownProfile=profile?.id===user.staff.id?profile:user.staff;
 const name=ownProfile.nombre??user.name,email=ownProfile.correo??user.email;
 const area=ownProfile.rol?operationalLabel(ownProfile.rol,false):'No registrada';
 const avatar=<div className="relative h-12 w-12 shrink-0"><div className="grid h-12 w-12 place-items-center rounded-full bg-[#F3E7BE] text-xl font-semibold">{name.trim().split(/\s+/).filter(Boolean).map(part=>part[0]).slice(0,2).join('').toUpperCase()}</div><button type="button" disabled aria-label="Cambiar foto de perfil" title="El API todavía no permite guardar fotografías de empleados" className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full border border-[#D9D5CC] bg-white text-[#18345C] opacity-50 cursor-not-allowed"><Pencil size={14}/></button></div>;
 return <AdminPersonDialog compact dense title="Mi perfil" name={name} area={area} avatar={avatar} onClose={()=>{if(logoutLock.current)return;if(confirmLogout){setConfirmLogout(false);requestAnimationFrame(()=>logoutButton.current?.focus());}else onClose();}} navigation={<nav aria-label="Secciones de mi perfil" className="mt-2 space-y-0">{([['personal','Información personal',Contact],['laboral','Información laboral',BriefcaseBusiness],['seguridad','Seguridad',LockKeyhole]] as const).map(([id,label,Icon])=><button key={id} type="button" disabled={confirmLogout||signingOut} aria-current={section===id?'page':undefined} onClick={()=>setSection(id)} className={`flex w-full items-center gap-2 rounded-lg border px-2 py-1 text-left text-xs disabled:opacity-50 ${section===id?'border-[#E8DDBB] bg-white font-semibold':'border-transparent text-[#536579]'}`}><Icon size={15} className="shrink-0"/>{label}</button>)}</nav>} footer={<button ref={logoutButton} type="button" disabled={signingOut||confirmLogout} onClick={()=>setConfirmLogout(true)} className="w-full rounded-lg border border-[#D9D5CC] bg-white px-3 py-1 text-sm disabled:opacity-60">{signingOut?'Cerrando sesión…':'Cerrar sesión'}</button>}>
  {loading&&<p role="status" className="mb-3 text-sm">Consultando perfil…{user.role==='admin'&&<AdminRefreshButton loading={loading} onClick={()=>setReload(n=>n+1)} className="ml-2"/>}</p>}{error&&<p role="alert" className="mb-3 text-sm text-red-800">{error}{user.role==='admin'?<AdminRefreshButton loading={loading} onClick={()=>setReload(n=>n+1)} className="ml-2"/>:<button type="button" onClick={()=>setReload(n=>n+1)} className="ml-2 underline">Actualizar perfil</button>}</p>}

  {section==='seguridad'?<section className="min-w-0"><h2 className="text-left text-sm font-semibold">Seguridad</h2><p className="mb-3 mt-1 text-sm leading-snug text-[#536579]">Administra la seguridad de tu cuenta</p><button type="button" onClick={()=>setPasswordOpen(true)} className="flex w-full max-w-xs items-center gap-2 rounded-lg border border-[#D9D5CC] bg-[#F8F6F0] px-3 py-2.5 text-left text-sm transition hover:border-[#426D98]"><LockKeyhole size={18}/>Cambiar contraseña<ChevronRight size={16} className="ml-auto"/></button></section>:<><h2 className={`mb-2 text-sm font-semibold text-left`}>{section==='personal'?'Información personal':'Información laboral'}</h2><EmployeeInformationContent employee={{...ownProfile,nombre:name,correo:email}} section={section} personalColumns canReadLabor administrative={user.role==='admin'}/>{!localDemo&&user.role!=='admin'&&profile&&profile.id===user.staff?.id&&!loading&&!error&&<StaffProfileDetails key={profile.id} section={section} employeeId={profile.id}/>}</>}
 </AdminPersonDialog>;
}
