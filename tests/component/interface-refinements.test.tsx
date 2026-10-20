import {render,screen,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {expect,test,vi} from 'vitest';
import Incidents from '@/features/mantenimiento/pages/BandejaIncidencias';
import Orders from '@/features/mantenimiento/pages/OrdenesTrabajo';
import Assets from '@/features/mantenimiento/pages/Activos';
import Preventive from '@/features/mantenimiento/pages/Preventivo';
test('incident selects retain all priorities, states and reporting areas',async()=>{
 render(<Incidents incidencias={[]} ordenes={[]} habitaciones={[]} onGenerarOrden={vi.fn()} onAbrirOrden={vi.fn()}/>);
 expect(screen.getAllByRole('combobox')).toHaveLength(3);
 await userEvent.selectOptions(screen.getByLabelText('Prioridad'),'alta');expect(screen.getByLabelText('Prioridad')).toHaveValue('alta');
 expect(within(screen.getByLabelText('Estado')).getAllByRole('option').map(o=>o.getAttribute('value'))).toEqual(['todos','pendiente','en-proceso','resuelta']);
 expect(within(screen.getByLabelText('Reportado por')).getAllByRole('option')).toHaveLength(5);
});
test('task filters keep terminal states and the overdue control',async()=>{
 render(<Orders ordenes={[]} onAbrirOrden={vi.fn()} onNuevaOrden={vi.fn()}/>);
 await userEvent.selectOptions(screen.getByLabelText('Estado'),'cancelada');expect(screen.getByLabelText('Estado')).toHaveValue('cancelada');
 await userEvent.click(screen.getByLabelText('Solo atrasadas'));expect(screen.getByLabelText('Solo atrasadas')).toBeChecked();
 expect(within(screen.getByLabelText('Estado')).getAllByRole('option')).toHaveLength(8);
});
test('equipment categories are a single selector and new equipment does not display a fabricated code',async()=>{
 render(<Assets activos={[]} ordenes={[]} onCambiarEstado={vi.fn()} onAgregarActivo={vi.fn()} onAbrirOrden={vi.fn()}/>);
 expect(within(screen.getByLabelText('Categoría')).getAllByRole('option')).toHaveLength(14);
 await userEvent.click(screen.getByRole('button',{name:/Nuevo equipo/}));
 expect(screen.getByRole('heading',{name:'Nuevo equipo'})).toBeVisible();expect(screen.queryByText(/^CLI-\d/)).toBeNull();
 await userEvent.click(screen.getByRole('button',{name:'Cancelar'}));expect(screen.queryByRole('heading',{name:'Nuevo equipo'})).toBeNull();
});
test('preventive maintenance keeps its optional equipment relationship and frequency options',async()=>{
 render(<Preventive tareas={[]} activos={[]} ordenes={[]} onGenerarOrden={vi.fn()} onToggleActiva={vi.fn()} onAgregarTarea={vi.fn()}/>);
 await userEvent.click(screen.getByRole('button',{name:/Nuevo mantenimiento preventivo/}));
 expect(screen.getByRole('combobox',{name:'Equipo o activo relacionado (opcional)'})).toHaveValue('');
 expect(within(screen.getByRole('combobox',{name:'Frecuencia'})).getAllByRole('option')).toHaveLength(6);
 expect(screen.getByText('Selecciona un equipo registrado si este mantenimiento corresponde a uno.')).toBeVisible();
});
