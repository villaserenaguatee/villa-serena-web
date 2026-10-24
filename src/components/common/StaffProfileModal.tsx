'use client';
import EmployeeProfileModal from './EmployeeProfileModal';
type PerfilModalProps = {
  open: boolean;
  onClose: () => void;
  name: string;
  role: string;
  email: string;
  onSolicitarCodigoTelefono?: (telefono: string) => Promise<void>;
  onVerificarCodigoTelefono?: (telefono: string, codigo: string) => Promise<void>;
  onActualizarTelefono?: (telefono: string) => Promise<void>;
  onCambiarClave?: (actual: string, nueva: string) => Promise<void>;
};
export default function StaffProfileModal({open,onClose}:PerfilModalProps){return <EmployeeProfileModal open={open} onClose={onClose}/>;}
