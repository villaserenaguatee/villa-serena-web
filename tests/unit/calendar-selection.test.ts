import {expect,test} from 'vitest';
import {calendarRangeError,nextCalendarDay} from '@/features/recepcion/calendarSelection';
import type {Reserva} from '@/lib/pms/types';
const room={id:'hh-101',numero:'101',piso:1,tipo:'Deluxe'};
const stay={habitacionId:room.id,estado:'confirmada',fechaEntrada:'2026-10-24',fechaSalida:'2026-10-26'} as Reserva;
test('selection respects exclusive departure and blocks occupied intermediate nights',()=>{
 expect(calendarRangeError(room,'2026-10-22','2026-10-24',[stay],'2026-10-22')).toBe('');
 expect(calendarRangeError(room,'2026-10-22','2026-10-27',[stay],'2026-10-22')).toMatch(/ocupadas/);
 expect(calendarRangeError(room,'2026-10-26','2026-10-27',[stay],'2026-10-22')).toBe('');
});
test('blocks past, reverse, zero and overlong ranges and unavailable rooms',()=>{
 for(const [a,b]of [['2026-10-21','2026-10-23'],['2026-10-23','2026-10-22'],['2026-10-22','2026-10-22'],['2026-10-22','2026-11-22']])expect(calendarRangeError(room,a,b,[],'2026-10-22')).not.toBe('');
 expect(calendarRangeError({...room,seleccionable:false},'2026-10-22','2026-10-23',[],'2026-10-22')).not.toBe('');
});
test('canceled and finalized stays do not block; date increment crosses months and years',()=>{
 expect(calendarRangeError(room,'2026-10-24','2026-10-25',[{...stay,estado:'cancelada'},{...stay,estado:'finalizada'}],'2026-10-22')).toBe('');
 expect(nextCalendarDay('2026-10-31')).toBe('2026-11-01');expect(nextCalendarDay('2026-12-31')).toBe('2027-01-01');
});
