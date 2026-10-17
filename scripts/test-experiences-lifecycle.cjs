const fs=require('node:fs'),ts=require('typescript'),vm=require('node:vm'),assert=require('node:assert/strict');
let states=[],cursor=0,canonical=[],calls=0;
const source=fs.readFileSync('src/features/huesped/pages/ReservasExperiencias.tsx','utf8');
function runtime(){
 const result={exports:{}};
 vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText,{
  module:result,exports:result.exports,
  require:n=>n==='react'?{useState:initial=>{const i=cursor++;if(!(i in states))states[i]=initial;return [states[i],v=>states[i]=typeof v==='function'?v(states[i]):v]},useMemo:f=>f()}:n==='react/jsx-runtime'?require(n):n.includes('reservationStore')?{leerReservas:()=>canonical}:n.includes('PublicLanguageToggle')?{usePublicLanguage:()=>({en:false})}:n.includes('UiText')?{useUiText:()=>s=>s}:{Cabecera:'Cabecera'}
 });return result.exports;
}
function nodes(n){if(!n||typeof n!=='object')return [];if(Array.isArray(n))return n.flatMap(nodes);return [n,...nodes(n.props?.children)]}
const base={id:'portal-RES-1201',codigo:'RES-1201',huespedId:'hu-ana'};
const history=[{id:'existing',area:'Spa',detalle:'Existing historical booking',fecha:'2026-10-02',hora:'12:00',personas:1}];
const before=JSON.stringify(history);
for(const estado of ['confirmada','en-curso','finalizada','cancelada']){
 for(let reload=0;reload<2;reload++){
  states=[];canonical=JSON.parse(JSON.stringify([{...base,estado}]));const app=runtime();
  const props={reserva:canonical[0],huespedId:'hu-ana',turnos:[],reservas:history,onReservar:()=>calls++,onCancelar:()=>calls++,onCargoConfirmado:()=>calls++};
  function render(){cursor=0;return app.default(props)}
  assert.equal(app.puedeCrearExperiencia(base.id,'hu-ana'),estado==='en-curso');
  assert.equal(app.puedeCrearExperiencia(base.id,'another-guest'),false);
  let tree=render();const reserveButtons=nodes(tree).filter(n=>n.type==='button'&&['Reservar','Reservar traslado'].includes(n.props.children));
  assert.ok(reserveButtons.length>=5);
  for(const button of reserveButtons){
   assert.equal(button.props.disabled,estado!=='en-curso');
   const old=calls;button.props.onClick();tree=render();
   const confirm=nodes(tree).find(n=>n.type==='button'&&n.props.children==='Confirmar reserva');
   if(estado==='en-curso'){
    assert.ok(confirm); // El modal ya abierto no debe sobrevivir a un check-out canonico.
    canonical=[{...base,estado:'finalizada'}, {id:'future',huespedId:'hu-ana',estado:'en-curso'}];
    confirm.props.onClick();assert.equal(calls,old);
    assert.equal(states[8].length,0,'No se crea una reserva local despues del cierre');
    canonical=[{...base,estado}];
   }else{assert.equal(confirm,undefined);assert.equal(calls,old);}
  }
  assert.equal(JSON.stringify(history),before);
  assert.equal(canonical[0].id,base.id);
 }
}
// Una estancia activa conserva la creacion real y la relacion explicita.
states=[];canonical=[{...base,estado:'en-curso'}];
const activeApp=runtime();
const activeProps={reserva:canonical[0],huespedId:'hu-ana',turnos:[],reservas:history,onReservar:()=>calls++,onCancelar:()=>calls++,onCargoConfirmado:()=>calls++};
function activeRender(){cursor=0;return activeApp.default(activeProps)}
nodes(activeRender()).find(n=>n.type==='button'&&n.props.children==='Reservar').props.onClick();
nodes(activeRender()).find(n=>n.type==='button'&&n.props.children==='Confirmar reserva').props.onClick();
assert.equal(states[8].length,1);
assert.equal(states[8][0].reservaId,base.id);
assert.equal(states[8][0].huespedId,base.huespedId);
assert.equal(JSON.stringify(history),before);
console.log('PASS: todas las categorias, cuatro estados, recarga, callbacks forzados, modal obsoleto tras check-out y ninguna reasociacion a otra estancia.');
