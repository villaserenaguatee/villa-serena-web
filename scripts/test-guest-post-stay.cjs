const fs = require('node:fs'), ts = require('typescript'), vm = require('node:vm'), assert = require('node:assert/strict');
const source = fs.readFileSync('src/features/huesped/pages/HuespedApp.tsx','utf8');
const ast = ts.createSourceFile('app.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
let list, navigation, selection, postGuard;
function visit(n) {
 if(ts.isVariableStatement(n) && n.declarationList.declarations.some(d=>d.name.getText(ast)==='SECCIONES')) list=n;
 if(ts.isFunctionDeclaration(n) && n.name?.text==='seccionesPortal') navigation=n;
 if(ts.isFunctionDeclaration(n) && n.name?.text==='seleccionarEstanciaHuesped') selection=n;
 if(ts.isIfStatement(n) && n.expression.getText(ast).includes("reserva.estado === 'finalizada' &&")) postGuard=n.expression.getText(ast);
 ts.forEachChild(n,visit);
}
visit(ast);const context={};vm.createContext(context);
vm.runInContext(ts.transpileModule([list,navigation,selection].map(n=>n.getText(ast).replace(/^export /,'')).join(' '),{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText,context);
for(const estado of ['confirmada','en-curso','finalizada']) {
 const ids=context.seccionesPortal(estado).map(x=>x.id);
 for(const id of ['checkin','restaurante','servicios']) assert.equal(ids.includes(id),estado!=='finalizada');
 for(const id of ['inicio','chat','habitacion','experiencias','cuenta','reservar']) assert.ok(ids.includes(id));
 for(const seccion of ['inicio','checkin','restaurante','servicios']) assert.equal(vm.runInNewContext(postGuard,{reserva:{estado},seccion}),estado==='finalizada');
 for(const route of ['menu','servicios','check-in']) {
  const result={exports:{}};let redirected;
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/app/(private)/huesped/'+route+'/page.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{module:result,exports:result.exports,require:()=>({redirect:url=>redirected=url})});
  result.exports.default();assert.equal(redirected,'/huesped');
 }
}
const ended={id:'ended',codigo:'ENDED',huespedId:'guest',estado:'finalizada',fechaSalida:'2026-10-05'};
assert.equal(context.seleccionarEstanciaHuesped(JSON.parse(JSON.stringify([ended,{...ended,id:'older',fechaSalida:'2026-08-06'}])),'guest').id,'ended');
const result={exports:{}};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/features/huesped/pages/MiHabitacion.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,{
 module:result,exports:result.exports,require:n=>n==='react'?{useState:v=>[v,()=>{}]}:n==='react/jsx-runtime'?require(n):n==='@/store/roomStore'?{fotoHabitacion:n=>'/rooms/'+n+'.jpg'}:n==='@/data/pms'?{formatoFecha:x=>x,formatoFechaHora:x=>x}:n.includes('PublicLanguageToggle')?{usePublicLanguage:()=>({en:false})}:n.includes('UiText')?{UiText:'UiText',useUiText:()=>s=>s}:new Proxy({},{get:(t,k)=>String(k)})
});
const tree=result.exports.default({estanciaCerrada:true,llaveActiva:true,habitacion:{numero:'999',tipo:'Standard',piso:1,capacidad:2}});
function nodes(n){if(!n||typeof n!=='object')return [];if(Array.isArray(n))return n.flatMap(nodes);return [n,...nodes(n.props?.children)]}
assert.equal(nodes(tree).some(n=>n.type==='button'||n.type==='input'),false);
assert.ok(nodes(tree).some(n=>n.props?.subtitulo==='Habitación 999 · Standard'));
console.log('PASS: navegacion confirmada/en-curso/finalizada, rutas directas, recarga de seleccion finalizada y habitacion historica sin controles.');

// La recarga directa recupera la seccion historica y sus acciones solo navegan.
const immutable = JSON.stringify(ended);
let section, review = false, booking;
let routeEffect;
const handlers = {};
function actions(n) {
 if(ts.isCallExpression(n) && n.expression.getText(ast)==='useEffect' && n.arguments[0]?.getText(ast).includes('URLSearchParams(window.location.search)')) routeEffect=n.arguments[0];
 if(ts.isJsxAttribute(n) && ['onCompartirExperiencia','onReservarEstancia','onVerCuentaFinal'].includes(n.name.getText(ast))) handlers[n.name.getText(ast)]=n.initializer.expression;
 ts.forEachChild(n,actions);
}
actions(ast);
const nav={window:{location:{search:'?seccion=habitacion'}},URLSearchParams,setSeccion:v=>section=v,setAbrirResena:v=>review=v,setGestionEstancia:v=>booking=v};
vm.createContext(nav);
vm.runInContext(ts.transpileModule('const open = '+routeEffect.getText(ast)+'; open();',{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText,nav);
assert.equal(section,'habitacion');
const click={};
for(const [name,fn] of Object.entries(handlers)) click[name]=vm.runInContext(ts.transpileModule('('+fn.getText(ast)+')',{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText,nav);
const completed={...ended,checkOutEn:'2026-10-05T12:00:00Z',fechaEntrada:'2026-10-02'};
const summary=result.exports.default({reserva:JSON.parse(JSON.stringify(completed)),estanciaCerrada:true,llaveActiva:true,habitacion:{numero:'999',tipo:'Standard',piso:1,capacidad:2},...click});
const buttons=nodes(summary).filter(n=>n.type==='button');assert.equal(buttons.length,3);
buttons[0].props.onClick();assert.equal(section,'cuenta');assert.equal(review,true);
buttons[1].props.onClick();assert.equal(section,'reservar');assert.equal(booking,'nueva');
buttons[2].props.onClick();assert.equal(section,'cuenta');assert.equal(review,false);
assert.ok(nodes(summary).some(n=>n.type==='img'&&n.props.src==='/rooms/999.jpg'));
assert.equal(nodes(summary).some(n=>n.type==='input'),false);
assert.equal(JSON.stringify(ended),immutable);
const route={exports:{}};let location;
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/app/(private)/huesped/habitacion/page.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{module:route,exports:route.exports,require:()=>({redirect:url=>location=url})});route.exports.default();assert.equal(location,'/huesped?seccion=habitacion');
console.log('PASS: resumen historico completo, recarga directa y tres clics de navegacion sin reactivar reserva.');
