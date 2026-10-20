import {act,render,renderHook,screen,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {beforeEach,expect,test,vi} from 'vitest';
import ChatRecepcion from '@/features/recepcion/pages/ChatRecepcion';
import {useDemoSection} from '@/hooks/useDemoSection';
import {guest,room,seedPortal} from '../fixtures/portal-checkin';
import {reservation} from '../fixtures/reservation';
import {CHAT_KEY,leerMensajesChat} from '@/store/chatStore';

beforeEach(()=>{sessionStorage.clear();});
test('demo section survives remount, is scoped to the employee and rejects invalid sections',()=>{
 const allowed=['inicio','chat'] as const;
 const first=renderHook(()=>useDemoSection('inicio','review:staff-1',allowed));
 act(()=>first.result.current[1]('chat'));first.unmount();
 const next=renderHook(({id})=>useDemoSection('inicio',id,allowed),{initialProps:{id:'review:staff-1'}});
 expect(next.result.current[0]).toBe('chat');next.rerender({id:'review:staff-2'});expect(next.result.current[0]).toBe('inicio');
 next.unmount();sessionStorage.setItem('review:staff-2','admin');
 const invalid=renderHook(()=>useDemoSection('inicio','review:staff-2',allowed));expect(invalid.result.current[0]).toBe('inicio');expect(sessionStorage.getItem('review:staff-2')).toBeNull();
});
test('connected sections do not read or write demo navigation state',()=>{
 const hook=renderHook(()=>useDemoSection('inicio',undefined,['inicio','chat']));
 act(()=>hook.result.current[1]('chat'));expect(hook.result.current[0]).toBe('chat');expect(sessionStorage.length).toBe(0);
});

const stay=reservation({id:'review-stay',huespedId:guest.id,habitacionId:room.id,estado:'en-curso',checkInEn:'2026-10-19T15:00:00Z'});
async function openChat(){
 seedPortal(stay);localStorage.setItem(CHAT_KEY,JSON.stringify([
  {id:'own',autor:'recepcion',huespedId:guest.id,texto:'Mensaje propio local',hora:'2026-10-19T15:10:00Z'},
  {id:'other',autor:'huesped',huespedId:guest.id,texto:'Mensaje recibido local',hora:'2026-10-19T15:11:00Z'}
 ]));
 render(<ChatRecepcion huespedes={[guest]} reservas={[stay]} habitaciones={[room]}/>);
 await userEvent.click(await screen.findByRole('button',{name:/Ana.*Hab\. 101/}));
}
async function options(text:string){const bubble=screen.getByText(text).closest('.group')!;await userEvent.click(within(bubble as HTMLElement).getByRole('button',{name:'Opciones del mensaje'}));}
for(const all of [false,true])test(`Reception can delete its own message ${all?'for everyone':'for itself'}, preserving received messages`,async()=>{
 await openChat();await options('Mensaje propio local');await userEvent.click(screen.getByRole('button',{name:'Eliminar'}));
 // A new message arriving after render must not be overwritten by deletion.
 const current=leerMensajesChat();localStorage.setItem(CHAT_KEY,JSON.stringify([...current,{id:'new',autor:'huesped',huespedId:guest.id,texto:'Nuevo recibido',hora:'2026-10-19T15:12:00Z'}]));
 await userEvent.click(screen.getByRole('button',{name:all?'Eliminar para todos':'Eliminar para mí'}));
 const saved=leerMensajesChat();expect(saved.find(m=>m.id==='other')).toEqual(current[1]);expect(saved.some(m=>m.id==='new')).toBe(true);
 if(all)expect(saved.find(m=>m.id==='own')?.eliminadoParaTodos).toBe(true);else expect(saved.find(m=>m.id==='own')?.eliminadoPara).toContain('recepcion');
});
test('received messages have no delete action and cannot be edited by Reception',async()=>{
 await openChat();await options('Mensaje recibido local');expect(screen.queryByRole('button',{name:'Eliminar'})).toBeNull();expect(screen.getByRole('button',{name:'Editar'})).toBeDisabled();
});
test('canceling deletion leaves messages unchanged',async()=>{
 await openChat();const before=localStorage.getItem(CHAT_KEY);await options('Mensaje propio local');await userEvent.click(screen.getByRole('button',{name:'Eliminar'}));await userEvent.click(screen.getByRole('button',{name:'Cancelar'}));expect(localStorage.getItem(CHAT_KEY)).toBe(before);
});
