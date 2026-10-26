import {render,screen,fireEvent} from '@testing-library/react';
import {expect,test,vi} from 'vitest';
import AdminSearchInput from '@/features/admin/pages/AdminSearchInput';

test('search input retains label, value, placeholder, disabled state and handlers',()=>{
 const change=vi.fn();const {rerender}=render(<label>Buscar categoría<AdminSearchInput type="search" value="Suite" placeholder="Nombre de categoría" onChange={change}/></label>);
 const input=screen.getByRole('searchbox',{name:'Buscar categoría'});expect(input).toHaveValue('Suite');expect(input).toHaveAttribute('placeholder','Nombre de categoría');expect(input.parentElement?.querySelector('svg')).toHaveAttribute('aria-hidden','true');expect(input).toHaveClass('pl-9');fireEvent.change(input,{target:{value:'Estándar'}});expect(change).toHaveBeenCalledOnce();
 rerender(<label>Buscar categoría<AdminSearchInput type="search" value="Suite" disabled onChange={change}/></label>);expect(input).toBeDisabled();
});
test('inventory retains its text input semantics, focus, blur and numeric-text content',()=>{
 const focus=vi.fn(),blur=vi.fn(),change=vi.fn();render(<AdminSearchInput type="text" aria-label="Insumo" value="Jabón 2" onFocus={focus} onBlur={blur} onChange={change} autoComplete="off"/>);
 const input=screen.getByRole('textbox',{name:'Insumo'});expect(input).toHaveValue('Jabón 2');fireEvent.focus(input);fireEvent.blur(input);expect(focus).toHaveBeenCalledOnce();expect(blur).toHaveBeenCalledOnce();expect(input).toHaveAttribute('autocomplete','off');
});
