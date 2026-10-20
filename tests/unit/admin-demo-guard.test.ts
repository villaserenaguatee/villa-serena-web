import {expect,test} from 'vitest';
import {adminLocalDemoEnabled} from '@/features/admin/demo/adminDemoGuard';
import {createAdminDemoData} from '@/features/admin/demo/adminDemoData';
import {adminDemoHref} from '@/features/admin/demo/adminDemoRoutes';
const local={environment:'development',host:'localhost:3083',staffMode:'demo',bffMode:'demo',apiUrl:''};
test('visual demo requires local development, both demo modes and no API',()=>{
 expect(adminLocalDemoEnabled(local)).toBe(true);
 for(const change of [{environment:'production'},{environment:'test'},{host:'villaserenaguate.lat'},{host:'localhost.evil.test:3083'},{staffMode:'spring'},{bffMode:'spring'},{apiUrl:'https://api.example.test'}])expect(adminLocalDemoEnabled({...local,...change})).toBe(false);
 expect(adminLocalDemoEnabled({...local,host:'127.0.0.1:3083'})).toBe(true);
});
test('sample state is isolated per instance and all relationships resolve',()=>{
 const first=createAdminDemoData(),second=createAdminDemoData();first.employees[0].nombre='Edited';expect(second.employees[0].nombre).not.toBe('Edited');
 expect(new Set(second.rooms.map(r=>r.numero)).size).toBe(second.rooms.length);
 expect(second.rooms.every(r=>second.types.some(t=>t.id===r.tipoId))).toBe(true);
 expect(second.attendance.every(a=>second.employees.some(e=>e.id===a.empleadoId))).toBe(true);
 expect(second.movements.every(m=>second.products.some(p=>p.id===m.productoId))).toBe(true);
 expect(second.employees.every(e=>String(e.correo).endsWith('@example.test'))).toBe(true);
});
test('tabs and direct links use the existing admin routes, including the root panel',()=>{
 expect(adminDemoHref('panel','tipos')).toBe('/admin?vista=tipos');
 expect(adminDemoHref('panel')).toBe('/admin');
 expect(adminDemoHref('personal','asistencia')).toBe('/admin/personal?vista=asistencia');
 for(const section of ['tarifas','inventario','finanzas','reportes'])expect(adminDemoHref(section)).toBe(`/admin/${section}`);
});
