const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
let states=[],cursor=0,en=false,confirmed=0,changed=0,returned=0;
const result={exports:{}};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/components/common/EmailVerificationFlow.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText,{module:result,exports:result.exports,require:n=>n==='react'?{useState:initial=>{const i=cursor++;if(!(i in states))states[i]=initial;return [states[i],v=>states[i]=v]}}:n==='react/jsx-runtime'?require(n):{usePublicLanguage:()=>({en})}});
function nodes(n){if(!n||typeof n!=='object')return [];if(Array.isArray(n))return n.flatMap(nodes);return [n,...nodes(n.props?.children)]}
let service;
function render(extra={}){cursor=0;return nodes(result.exports.default({correo:'new@example.com',onCambiar:()=>changed++,onVolver:()=>returned++,onVerificado:()=>confirmed++,servicio:service,...extra}))}
function status(){return render().find(n=>n.props?.['data-state']).props['data-state']}
function submit(){render().find(n=>n.type==='form').props.onSubmit({preventDefault(){}})}
const tick=()=>new Promise(r=>setImmediate(r));
(async()=>{
for(const english of [false,true]){
 en=english;states=[];service=undefined;assert.equal(status(),'pendiente');submit();assert.equal(status(),'invalido');
 render().find(n=>n.type==='input').props.onChange({target:{value:'123456'}});submit();await tick();assert.equal(status(),'error');assert.equal(confirmed,0);
 render().find(n=>n.type==='button'&&n.props.children===(en?'Resend':'Reenviar')).props.onClick();await tick();assert.equal(status(),'error');assert.equal(states[2],false);
 for(const outcome of ['invalido','expirado','verificado']){
  states=[];let resolve;service={reenviar:async()=>{},verificar:()=>new Promise(r=>resolve=r)};
  render().find(n=>n.type==='input').props.onChange({target:{value:'123456'}});submit();assert.equal(status(),'verificando');assert.ok(render().filter(n=>n.type==='button'&&n.props.type==='submit').every(n=>n.props.disabled));resolve(outcome);await tick();assert.equal(status(),outcome);
 }
 states=[];service={reenviar:async()=>{},verificar:async()=>{throw Error('provider failure')}};
 render().find(n=>n.type==='input').props.onChange({target:{value:'123456'}});submit();await tick();assert.equal(status(),'error');
 render().find(n=>n.type==='button'&&n.props.children===(en?'Resend':'Reenviar')).props.onClick();await tick();assert.equal(status(),'pendiente');assert.equal(states[2],true);
 render().find(n=>n.type==='button'&&n.props.children===(en?'Change email':'Cambiar correo')).props.onClick();render().find(n=>n.type==='button'&&n.props.children===(en?'Back':'Volver')).props.onClick();
 states=[];cursor=0;assert.equal(render({verificado:true}).find(n=>n.props?.['data-state']).props['data-state'],'verificado');
 // Reset counter: the only confirmation came from the injected provider response.
 assert.equal(confirmed,1);confirmed=0;
}
assert.equal(changed,2);assert.equal(returned,2);
console.log('PASS: email pending/processing/verified/invalid/expired/error, resend/change/back, no false send or verification without provider, ES/EN.');
})().catch(e=>{console.error(e);process.exitCode=1});
