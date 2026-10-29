import {render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {expect,test,vi} from 'vitest';
import {EditorialMessages} from '@/features/admin/pages/HotelEditorialPanel';
import type {HotelEditorial} from '@/features/admin/pages/useHotelEditorial';

test('publicar sigue requiriendo confirmación con un mensaje breve',async()=>{
 const editorial={state:{},confirmPublish:true,setConfirmPublish:vi.fn(),publish:vi.fn()} as unknown as HotelEditorial;
 render(<EditorialMessages editorial={editorial}/>);
 expect(screen.getByText('¿Deseas publicar estos cambios?')).toBeVisible();expect(editorial.publish).not.toHaveBeenCalled();
 await userEvent.click(screen.getByRole('button',{name:'Cancelar'}));expect(editorial.setConfirmPublish).toHaveBeenCalledWith(false);expect(editorial.publish).not.toHaveBeenCalled();
 await userEvent.click(screen.getByRole('button',{name:'Confirmar publicación'}));expect(editorial.publish).toHaveBeenCalledTimes(1);
});
test('recuperar el borrador advierte que descarta cambios y mantiene las dos opciones',async()=>{
 const editorial={state:{remote:{revision:5}},closeReview:vi.fn(),loadRemote:vi.fn()} as unknown as HotelEditorial;
 render(<EditorialMessages editorial={editorial}/>);
 expect(screen.getByText('¿Descartar tus cambios y cargar el borrador actual?')).toBeVisible();expect(screen.queryByText(/La revisión actual/)).toBeNull();
 await userEvent.click(screen.getByRole('button',{name:'Conservar mis cambios'}));expect(editorial.closeReview).toHaveBeenCalledTimes(1);expect(editorial.loadRemote).not.toHaveBeenCalled();
 await userEvent.click(screen.getByRole('button',{name:'Cargar borrador actual'}));expect(editorial.loadRemote).toHaveBeenCalledTimes(1);
});
