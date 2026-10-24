import Image from 'next/image';
import {LockKeyhole} from 'lucide-react';
import {requireStaff} from '@/lib/bff/auth/page-session';
import StaffPasswordPageForm from '@/components/common/StaffPasswordPageForm';
export default async function PasswordPage(){
 const employee=await requireStaff();
 return <main className="flex min-h-dvh items-center justify-center bg-[#F8F6F0] p-3 text-[#18345C] sm:p-6"><section className="w-full max-w-md rounded-2xl bg-white p-5 shadow-sm sm:p-7"><header className="mb-5 text-center"><Image src="/villa-serena-logo.png" alt="Villa Serena" width={105} height={90} className="mx-auto mb-3 h-auto"/><LockKeyhole size={26} className="mx-auto mb-2"/><h1 className="text-2xl font-semibold">{employee.debeCambiarContrasena?'Establece tu contraseña':'Cambiar contraseña'}</h1><p className="mt-1 text-sm text-[#536579]">{employee.debeCambiarContrasena?'Protege tu cuenta antes de continuar':'Actualiza tu contraseña para mantener tu cuenta segura'}</p></header><StaffPasswordPageForm mandatory={employee.debeCambiarContrasena}/></section></main>;
}
