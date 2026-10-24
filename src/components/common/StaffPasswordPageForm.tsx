'use client';
import StaffPasswordForm from './StaffPasswordForm';
import {staffHome} from '@/lib/auth/staff-contract';
export default function StaffPasswordPageForm({mandatory}:{mandatory:boolean}){
 return <StaffPasswordForm mandatory={mandatory} onSuccess={employee=>window.location.assign(employee.debeCambiarContrasena?'/panel/cambiar-contrasena':staffHome(employee))}/>;
}
