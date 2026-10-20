import {describe,it,expect} from 'vitest';
import {runtimeModeAllowed} from '../../src/lib/runtimeMode';
const demo={environment:'development',hostname:'localhost',staffMode:'demo',guestMode:'demo',bffMode:'demo',apiUrl:''};
describe('isolated runtime modes',()=>{
 it('keeps explicit local demo available',()=>expect(runtimeModeAllowed(demo)).toBe(true));
 it.each([{environment:'production'},{hostname:'hotel.example'},{apiUrl:'https://api.example'},{staffMode:'spring'},{guestMode:undefined},{bffMode:undefined}])('blocks mixed or published demo %o',change=>expect(runtimeModeAllowed({...demo,...change})).toBe(false));
 it('accepts configured real services, independent of their availability',()=>expect(runtimeModeAllowed({...demo,environment:'production',hostname:'hotel.example',staffMode:'spring',guestMode:'spring',bffMode:'api',apiUrl:'https://api.example'})).toBe(true));
 it('does not infer demo from missing settings',()=>expect(runtimeModeAllowed({hostname:'localhost'})).toBe(false));
});
