import {expect,test,vi,beforeEach} from 'vitest';
import {render,screen,fireEvent,waitFor,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PersonalFields from '@/features/admin/pages/PersonalFields';
import {validatePersonal} from '@/features/admin/pages/personalValidation';
import {officialEmployeeCreate} from '@/features/admin/pages/employeeContract';
import EmployeeInformationDialog from '@/features/admin/pages/EmployeeInformationDialog';
import {saveEmployee} from '@/features/admin/pages/employeeClient';
import {operacion} from '@/lib/api/operaciones';
vi.mock('@/lib/api/operaciones',async original=>({...await original<typeof import('@/lib/api/operaciones')>(),operacion:vi.fn()}));
const call=vi.mocked(operacion);
const draft={id:7,version:1,nombre:'Persona',correo:'laboral@example.test',correoPersonal:'personal@example.test',telefono:'55551234',rol:'RECEPCION',area:null,estado:'ACTIVO',laborDisponible:false};
beforeEach(()=>call.mockReset());
test('connected personal and access fields are separated; labor email stays readonly on edit',()=>{
 const change=vi.fn();const {rerender}=render(<PersonalFields section="personal" serverPassword draft={draft} errors={{}} onChange={change}/>);
 expect(screen.getByLabelText('Correo personal')).toHaveValue(draft.correoPersonal);expect(screen.queryByLabelText('Correo laboral')).toBeNull();
 expect(screen.getByLabelText('Correo personal')).not.toBeRequired();
 rerender(<PersonalFields section="laboral" serverPassword employmentEditable={false} draft={draft} errors={{}} onChange={change}/>);
 expect(screen.getByLabelText('Correo laboral')).toHaveValue(draft.correo);expect(screen.getByLabelText('Correo laboral')).toHaveAttribute('readonly');
});
test('optional contact validates independently; blank clears to null in official DTO',()=>{
 expect(validatePersonal({...draft,correoPersonal:''},true)).toEqual({});
 expect(validatePersonal({...draft,correoPersonal:'invalido'},true).correoPersonal).toBeDefined();
 expect(officialEmployeeCreate({...draft,rol:'RECEPCION',correoPersonal:''}).correoPersonal).toBeNull();
 expect(officialEmployeeCreate({...draft,rol:'RECEPCION',correoPersonal:undefined})).not.toHaveProperty('correoPersonal');
});
test('create sends separate contact and labor identifiers and only displays server password',async()=>{
 call.mockResolvedValue({empleado:{id:7},contrasenaTemporal:'respuesta-solo-fixture'});const show=vi.fn();
 await saveEmployee({...draft,id:undefined},show);
 expect(call).toHaveBeenCalledExactlyOnceWith('admin/empleados','POST',expect.objectContaining({correo:draft.correo,correoPersonal:draft.correoPersonal}));
 expect(show).toHaveBeenCalledWith(7,'respuesta-solo-fixture');
});
test('contact edit never sends labor email or requests password/session changes',async()=>{
 call.mockResolvedValue({});await saveEmployee({...draft,correoPersonal:''},vi.fn());
 expect(call).toHaveBeenCalledExactlyOnceWith('admin/empleados/7','PATCH',expect.objectContaining({correoPersonal:null}));
 expect(call.mock.calls[0][2]).not.toHaveProperty('correo');
});
test('employee details show both emails; historical missing contact is not invented',()=>{
 const {rerender}=render(<EmployeeInformationDialog employee={draft} canReadLabor onClose={()=>{}}/>);
 expect(screen.getByText(draft.correo)).toBeVisible();expect(screen.getByText(draft.correoPersonal)).toBeVisible();
 rerender(<EmployeeInformationDialog employee={{...draft,correoPersonal:undefined}} canReadLabor onClose={()=>{}}/>);
 expect(screen.queryByText(draft.correoPersonal)).toBeNull();expect(screen.getByText('Correo personal')).toBeVisible();
});
