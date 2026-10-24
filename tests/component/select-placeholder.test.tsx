import {useState} from 'react';
import {fireEvent,render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {expect,test} from 'vitest';
import SelectPlaceholder from '@/components/common/SelectPlaceholder';
import BookingCountryPicker from '@/components/common/BookingCountryPicker';

function Example({initial='',required=true}:{initial?:string;required?:boolean}){
 const [value,setValue]=useState(initial);
 return <form><label>Estado<select required={required} value={value} onChange={e=>setValue(e.target.value)}><SelectPlaceholder/><option value="ACTIVO">Activo</option><option value="INACTIVO">Inactivo</option></select></label><button>Guardar</button></form>;
}

test('placeholder is visible as initial text but hidden and disabled in the options',()=>{
 render(<Example/>);const select=screen.getByRole('combobox') as HTMLSelectElement;
 expect(select.value).toBe('');expect(select.selectedOptions[0].text).toBe('Seleccionar');
 expect(select.options[0]).toBeDisabled();expect(select.options[0].hidden).toBe(true);
 expect(screen.getAllByRole('option').map(option=>option.textContent)).toEqual(['Activo','Inactivo']);
});

test('required selection has a field-specific message which clears after a real choice',async()=>{
 render(<Example/>);const select=screen.getByRole('combobox') as HTMLSelectElement;
 expect(select.checkValidity()).toBe(false);expect(select.validationMessage).toBe('Selecciona un estado para continuar');
 await userEvent.selectOptions(select,'INACTIVO');expect(select.value).toBe('INACTIVO');expect(select.checkValidity()).toBe(true);expect(select.validationMessage).toBe('');
});

test('editing keeps the previous real value and option order',()=>{
 render(<Example initial="INACTIVO"/>);const select=screen.getByRole('combobox') as HTMLSelectElement;
 expect(select.value).toBe('INACTIVO');expect(select.selectedOptions[0].text).toBe('Inactivo');
 expect(Array.from(select.options).slice(1).map(option=>option.value)).toEqual(['ACTIVO','INACTIVO']);
});

test('uncontrolled form fields start empty instead of choosing the first real option',()=>{
 render(<label>Habitación<select defaultValue="" required><SelectPlaceholder/><option value="101">101</option></select></label>);
 const select=screen.getByRole('combobox') as HTMLSelectElement;
 expect(select.value).toBe('');expect(select.selectedOptions[0].text).toBe('Seleccionar');
 expect(select.checkValidity()).toBe(false);expect(select.validationMessage).toBe('Selecciona una habitación para continuar');
});

test('loading an existing record clears only the placeholder validation message',()=>{
 const field=(value:string)=><label>Estado<select required value={value} onChange={()=>{}}><SelectPlaceholder/><option value="ACTIVO">Activo</option></select></label>;
 const {rerender}=render(field(''));const select=screen.getByRole('combobox') as HTMLSelectElement;
 expect(select.checkValidity()).toBe(false);rerender(field('ACTIVO'));
 expect(select.value).toBe('ACTIVO');expect(select.checkValidity()).toBe(true);
});

test('optional empty values remain valid and external validation errors are not cleared',()=>{
 render(<Example required={false}/>);const select=screen.getByRole('combobox') as HTMLSelectElement;
 expect(select.checkValidity()).toBe(true);select.required=true;select.setCustomValidity('Error del formulario');
 expect(select.checkValidity()).toBe(false);expect(select.validationMessage).toBe('Error del formulario');
 fireEvent.change(select,{target:{value:'ACTIVO'}});expect(select.validationMessage).toBe('Error del formulario');
});

test('real empty-valued choices such as Todos remain selectable',()=>{
 render(<label>Filtrar<select defaultValue=""><option value="">Todos</option><option value="ACTIVO">Activo</option></select></label>);
 expect(screen.getByRole('option',{name:'Todos'})).toBeEnabled();
});

test('custom picker keeps the placeholder outside its real choices and preserves selection',async()=>{
 function Picker(){const [value,setValue]=useState('');return <BookingCountryPicker label="País" en={false} value={value} onChange={setValue} options={[{value:'GT',label:'Guatemala'},{value:'SV',label:'El Salvador'}]}/>;}
 render(<Picker/>);const trigger=screen.getByRole('button',{name:'País'});
 expect(trigger).toHaveTextContent('Seleccionar');await userEvent.click(trigger);
 const choices=screen.getByRole('dialog');expect(choices).not.toHaveTextContent('Seleccionar');
 await userEvent.click(screen.getByRole('button',{name:'Guatemala'}));expect(trigger).toHaveTextContent('Guatemala');
 await userEvent.click(trigger);expect(screen.getByRole('button',{name:'Guatemala'})).toHaveAttribute('aria-pressed','true');
});
