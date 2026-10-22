import {expect,test} from 'vitest';
import {occupancyPercentage,reportRangeValid,type Indicadores} from '@/features/admin/pages/indicadoresValidation';
test('occupancy uses active rooms as denominator, including a genuinely empty hotel',()=>{
 const data=(occupied:number,active:number)=>({ocupacionHoy:{habitacionesOcupadas:occupied,habitacionesActivas:active}} as Indicadores);
 expect(occupancyPercentage(data(2,8))).toBe(25);expect(occupancyPercentage(data(0,0))).toBe(0);expect(occupancyPercentage(data(1,3))).toBeCloseTo(33.3333);
 for(const [occupied,active]of [[2,1],[1,0],[-1,2],[1,NaN],[1,1.5]])expect(()=>occupancyPercentage(data(occupied,active))).toThrow();
 expect(()=>occupancyPercentage({} as Indicadores)).toThrow();
});
test('report range allows one day and rejects missing, reversed or impossible dates',()=>{
 expect(reportRangeValid('2026-10-01','2026-10-31')).toBe(true);expect(reportRangeValid('2026-10-01','2026-10-01')).toBe(true);
 for(const [start,end]of [['','2026-10-01'],['2026-10-01',''],['2026-10-02','2026-10-01'],['2026-02-30','2026-03-02'],['invalid','2026-10-01']])expect(reportRangeValid(start,end)).toBe(false);
});
