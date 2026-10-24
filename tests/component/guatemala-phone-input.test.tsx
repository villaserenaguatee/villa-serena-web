import {useState} from 'react';
import {render,screen,fireEvent} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {expect,test} from 'vitest';
import Phone from '@/components/common/GuatemalaPhoneInput';
function Demo(){const [value,setValue]=useState('');return <Phone label={'Tel\u00e9fono'} value={value} onChange={setValue}/>;}
test('fixed prefix, numeric typing, eight digit maximum and accessible national input',async()=>{const user=userEvent.setup();render(<Demo/>);expect(screen.getByText('+502')).toBeVisible();expect(screen.queryByRole('combobox')).toBeNull();const input=screen.getByRole('textbox',{name:'Tel\u00e9fono'});expect(input).toHaveAttribute('inputmode','numeric');await user.type(input,'55a! 55123499');expect(input).toHaveValue('55551234');expect((input as HTMLInputElement).checkValidity()).toBe(true);fireEvent.change(input,{target:{value:'123'}});expect((input as HTMLInputElement).checkValidity()).toBe(false);});
test.each(['+502 5555-1234','50255551234','00502 5555 1234','55a55!1234'])('paste normalizes %s without repeating the prefix',async text=>{const user=userEvent.setup();render(<Demo/>);const input=screen.getByRole('textbox',{name:'Tel\u00e9fono'});await user.click(input);await user.paste(text);expect(input).toHaveValue('55551234');});
