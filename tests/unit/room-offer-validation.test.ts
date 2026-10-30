import {expect,test} from 'vitest';
import {featureDraft,featureInput} from '@/features/admin/pages/RoomOfferFields';
test('no inventa características ausentes y conserva nombres y cantidades existentes',()=>{
 expect(featureDraft()).toEqual({capacidad:'',superficieM2:'',camas:[],caracteristicas:''});const value={capacidad:3,superficieM2:30,camas:{Matrimonial:1,Individual:1},caracteristicas:['Wi-Fi','Balcón']};expect(featureInput(featureDraft(value))).toEqual(value);
});
test('rechaza camas repetidas, cantidades y capacidad inválidas',()=>{
 const draft=featureDraft({capacidad:2,superficieM2:25,camas:{Matrimonial:1}});for(const change of [{capacidad:'0'},{superficieM2:'0'},{camas:[]},{camas:[{tipo:'A',cantidad:'1'},{tipo:'A',cantidad:'2'}]},{camas:[{tipo:'A',cantidad:'0'}]}])expect(()=>featureInput({...draft,...change})).toThrow();
});
