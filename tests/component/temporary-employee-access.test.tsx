import {render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {expect,test,vi} from 'vitest';
import TemporaryAccess from '@/features/admin/pages/TemporaryEmployeeAccess';
test('closing discards the temporary credential, with no persistence or network request',async()=>{
 const close=vi.fn(),fetch=vi.spyOn(globalThis,'fetch'),local=vi.spyOn(Storage.prototype,'setItem');
 const view=render(<TemporaryAccess password="fictional-test-only" onDismiss={close}/>);
 expect(screen.getByRole('textbox')).toHaveValue('fictional-test-only');
 await userEvent.click(screen.getByRole('button',{name:'Cerrar'}));
 expect(close).toHaveBeenCalledTimes(1);expect(screen.queryByRole('dialog')).toBeNull();
 view.rerender(<TemporaryAccess password="fictional-test-only" onDismiss={close}/>);expect(screen.queryByRole('dialog')).toBeNull();expect(fetch).not.toHaveBeenCalled();expect(local).not.toHaveBeenCalled();
});
test('Escape discards the credential and asks the caller to clear its response',async()=>{
 const close=vi.fn();render(<TemporaryAccess password="fictional-test-only" onDismiss={close}/>);await userEvent.keyboard('{Escape}');expect(close).toHaveBeenCalledTimes(1);expect(screen.queryByRole('textbox')).toBeNull();
});
