import { RoleGuard } from '@/components/common/RoleGuard';
import CleaningApp from '@/features/limpieza/pages/LimpiezaApp';
export default function Page() {
  return <RoleGuard role="limpieza">
    <CleaningApp />
  </RoleGuard>;
}
