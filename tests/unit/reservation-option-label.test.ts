import {expect,test} from 'vitest';
import {reservationOptionLabel} from '../../src/lib/reservationOptionLabel';
test('reservation selector labels the arrival date and translates actual states',()=>{
 const reservation={codigo:'VS-ABC123',fechaEntrada:'2026-10-18',estado:'en-curso' as const};
 expect(reservationOptionLabel(reservation)).toContain('Llegada 18 de octubre de 2026 · En curso');
 expect(reservationOptionLabel({...reservation,estado:'finalizada'},true)).toContain('Arrival October 18, 2026 · Completed');
 expect(reservationOptionLabel({...reservation,estado:'cancelada'})).toContain('Cancelada');
});
