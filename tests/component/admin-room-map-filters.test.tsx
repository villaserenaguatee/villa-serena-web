import {render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {expect,test,vi} from 'vitest';
import PanelHabitaciones from '@/features/admin/pages/PanelHabitaciones';
import type {HabitacionHotel} from '@/lib/pms/types';
const rooms:HabitacionHotel[]=[
 {id:'1',numero:'101',piso:1,tipo:'Standard',capacidad:2,precioNoche:420,estado:'disponible'},
 {id:'2',numero:'102',piso:1,tipo:'Standard',capacidad:2,precioNoche:420,estado:'ocupada'},
 {id:'3',numero:'201',piso:2,tipo:'Standard',capacidad:2,precioNoche:420,estado:'en-limpieza'},
 {id:'4',numero:'301',piso:3,tipo:'Standard',capacidad:2,precioNoche:420,estado:'mantenimiento'},
];
test('los desplegables combinan piso y estado sin modificar habitaciones',async()=>{
 const change=vi.fn(),before=structuredClone(rooms);render(<PanelHabitaciones conectado habitaciones={rooms} reservas={[]} huespedes={[]} onCambiarEstadoHab={change}/>);
 const floor=screen.getByRole('combobox',{name:'Piso'}),state=screen.getByRole('combobox',{name:'Estado'});
 expect([...floor.querySelectorAll('option')].map(option=>option.textContent)).toEqual(['Todos los pisos','Piso 1','Piso 2','Piso 3']);
 expect([...state.querySelectorAll('option')].map(option=>option.textContent)).toEqual(['Todos','Libres','Ocupadas','En limpieza','En mantenimiento']);
 await userEvent.selectOptions(floor,'1');await userEvent.selectOptions(state,'ocupada');expect(screen.getByText('102')).toBeVisible();expect(screen.queryByText('101')).toBeNull();expect(screen.queryByText('201')).toBeNull();
 await userEvent.selectOptions(floor,'todos');expect(state).toHaveValue('ocupada');expect(screen.getByText('102')).toBeVisible();
 await userEvent.selectOptions(state,'en-limpieza');expect(screen.getByText('201')).toBeVisible();expect(screen.queryByText('102')).toBeNull();
 await userEvent.selectOptions(floor,'3');expect(screen.queryByText('201')).toBeNull();expect(screen.queryByText('301')).toBeNull();
 await userEvent.selectOptions(state,'mantenimiento');expect(screen.getByText('301')).toBeVisible();
 await userEvent.selectOptions(state,'todas');expect(floor).toHaveValue('3');expect(screen.getByText('301')).toBeVisible();
 await userEvent.selectOptions(floor,'todos');await userEvent.selectOptions(state,'disponible');expect(screen.getByText('101')).toBeVisible();expect(screen.queryByText('102')).toBeNull();expect(change).not.toHaveBeenCalled();expect(rooms).toEqual(before);
});
