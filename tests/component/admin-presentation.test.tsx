import {fireEvent,render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {expect,test,vi} from 'vitest';
import {dinero} from '@/features/admin/pages/adminUtils';
import ComprasInventario from '@/features/admin/pages/ComprasInventario';
import EmployeeInformationDialog from '@/features/admin/pages/EmployeeInformationDialog';

const amount=(label:string)=>screen.getByText(label).nextElementSibling;
test('purchase totals retain the included and added IVA calculations',async()=>{
 render(<ComprasInventario insumos={[{id:'test-item',nombre:'Producto de prueba',categoria:'Limpieza',unidad:'unidad',stock:0,stockMinimo:0,costoUnitario:112}]} movimientos={[]} compras={[]} onAgregarInsumo={vi.fn()} onRegistrarMovimiento={vi.fn()} onRegistrarCompra={vi.fn()}/>);
 await userEvent.click(screen.getByRole('button',{name:'+ Registrar compra'}));fireEvent.change(screen.getByLabelText('Producto'),{target:{value:'test-item'}});fireEvent.change(screen.getByLabelText('Cantidad'),{target:{value:'2'}});expect(amount('Subtotal')).toHaveTextContent(dinero(200));expect(amount('IVA (12%)')).toHaveTextContent(dinero(24));expect(amount('Total')).toHaveTextContent(dinero(224));fireEvent.change(screen.getByLabelText('Tratamiento de IVA'),{target:{value:'agregar'}});expect(amount('Subtotal')).toHaveTextContent(dinero(224));expect(amount('IVA (12%)')).toHaveTextContent(dinero(26.88));expect(amount('Total')).toHaveTextContent(dinero(250.88));
});
test('employee consultation keeps both emails, role and permission-gated labor information',async()=>{
 const edit=vi.fn();render(<EmployeeInformationDialog employee={{nombre:'Empleado de prueba',correoPersonal:'personal@example.invalid',correo:'laboral@example.invalid',telefono:'55551234',rol:'RECEPCION',estado:'ACTIVO',perfil:{turno:'Mañana',salarioBase:0}}} canReadLabor onEdit={edit} onClose={()=>{}}/>);
 expect(screen.getByText('Correo personal').nextElementSibling).toHaveTextContent('personal@example.invalid');expect(screen.getByText('Correo laboral').nextElementSibling).toHaveTextContent('laboral@example.invalid');expect(screen.queryByRole('textbox')).toBeNull();await userEvent.click(screen.getByRole('button',{name:'Información laboral'}));expect(screen.getByText('Rol').nextElementSibling).toHaveTextContent('RECEPCION');expect(screen.getByText('Salario base (Q)').nextElementSibling).toHaveTextContent('0');expect(screen.getByText('Bonos (Q)').nextElementSibling).toHaveTextContent('No registrado');await userEvent.click(screen.getByRole('button',{name:'Editar empleado'}));expect(edit).toHaveBeenCalledOnce();
});
