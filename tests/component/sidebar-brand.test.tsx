import {render,screen,cleanup} from '@testing-library/react';
import {afterEach,expect,it} from 'vitest';
import SidebarBrand from '@/components/common/SidebarBrand';
afterEach(cleanup);
for(const module of ['Administraci\u00f3n','Recepci\u00f3n','Limpieza','Mantenimiento','Room Service','Hu\u00e9sped'])it(`shows the official shared brand for ${module}`,()=>{render(<SidebarBrand module={module}/>);expect(screen.getByText('Villa Serena')).toBeVisible();expect(screen.getByText(module)).toBeVisible();const logo=screen.getByRole('img',{name:'Hotel Villa Serena'});expect(logo).toHaveAttribute('width','58');expect(logo).toHaveAttribute('height','55');expect(logo.getAttribute('src')).toContain('villa-serena-logo.png');});
