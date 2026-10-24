import {render,screen,fireEvent} from '@testing-library/react';
import {expect,it} from 'vitest';
import RoomInformationDialog from '@/features/admin/pages/RoomInformationDialog';
it('keeps one live state badge over the photo when changing thumbnails, state and missing images',()=>{
 const props={numero:'102',tipo:'Superior',estado:'Ocupada',piso:1,onClose:()=>{},fotos:['/one.png','/two.png']};
 const {rerender}=render(<RoomInformationDialog {...props}/>);
 const badge=screen.getByText('Ocupada');expect(badge.parentElement).toHaveClass('relative');expect(badge).toHaveClass('absolute','right-2','top-2');expect(screen.getAllByText('Ocupada')).toHaveLength(1);
 fireEvent.click(screen.getByRole('button',{name:'Ver fotograf\u00eda 2'}));expect(screen.getByAltText('Habitaci\u00f3n 102, fotograf\u00eda 2')).toHaveAttribute('src','/two.png');expect(screen.getByText('Ocupada')).toBe(badge);
 for(const [estado,color] of [['Disponible','bg-green-50'],['En limpieza','bg-amber-50'],['Mantenimiento','bg-red-50'],['Fuera de servicio','bg-red-50']]){rerender(<RoomInformationDialog {...props} estado={estado} fotos={[]}/>);expect(screen.getByText(estado)).toHaveClass(color);expect(screen.getByText('Sin fotograf\u00eda disponible').parentElement?.parentElement).toBe(screen.getByText(estado).parentElement);}
});
