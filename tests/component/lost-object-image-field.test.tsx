import {fireEvent,render,screen} from '@testing-library/react';
import {useState} from 'react';import {beforeEach,expect,test,vi} from 'vitest';
import ImageField from '@/components/common/LostObjectImageField';
const error=vi.fn(),create=vi.fn(()=> 'blob:local-preview'),revoke=vi.fn();
beforeEach(()=>{Object.defineProperty(URL,'createObjectURL',{configurable:true,value:create});Object.defineProperty(URL,'revokeObjectURL',{configurable:true,value:revoke});error.mockReset();});
function Form(){const [file,setFile]=useState<File>();return <ImageField label="Imagen (opcional)" value={file} onChange={setFile} onError={error}/>;}
test('selection, preview, replacement and removal stay local and release object URLs',()=>{const view=render(<Form/>);const input=screen.getByLabelText('Imagen (opcional)');
 expect(input).toHaveAttribute('accept','image/jpeg,image/png');expect(screen.queryByRole('img')).toBeNull();
 fireEvent.change(input,{target:{files:[new File(['image'],'photo.png',{type:'image/png'})]}});expect(screen.getByRole('img')).toHaveAttribute('src','blob:local-preview');
 fireEvent.change(input,{target:{files:[new File(['image'],'photo.jpg',{type:'image/jpeg'})]}});expect(revoke).toHaveBeenCalled();
 fireEvent.click(screen.getByRole('button',{name:'Quitar imagen'}));expect(screen.queryByRole('img')).toBeNull();view.unmount();});
for(const [name,type,size] of [['file.svg','image/svg+xml',2],['large.png','image/png',5*1024*1024+1],['empty.png','image/png',0]] as const)test('reject '+name,()=>{render(<Form/>);fireEvent.change(screen.getByLabelText('Imagen (opcional)'),{target:{files:[new File([new Uint8Array(size)],name,{type})]}});expect(error).toHaveBeenCalledWith(expect.any(String));expect(error.mock.calls.at(-1)?.[0]).not.toBe('');expect(screen.queryByRole('img')).toBeNull();});
