const fs=require('node:fs'), vm=require('node:vm'),ts=require('typescript'),assert=require('node:assert/strict');
const storage=new Map();let states=[],cursor=0,lang='ES',effects=[],handlers={},focused=0,restored=0;
const localStorage={getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)};
const guest={id:'guest-test',nombre:'Guest Test',telefono:'55555555',correo:'old@example.com',nacionalidad:'Guatemala',documento:'123',tipoDocumento:'DPI',documentoVerificado:true,correoVerificacion:{correo:'old@example.com',estado:'verificado'}};
storage.set('vs-huespedes',JSON.stringify([guest]));storage.set('vs-reservas',JSON.stringify([{id:'keep',estado:'finalizada',pagos:[{id:'historical',monto:50}]}]));const originalReservations=storage.get('vs-reservas');
const cache={};let rootRef;
const hooks={useState(initial){const i=cursor++;if(!(i in states))states[i]=typeof initial==='function'?initial():initial;return [states[i],v=>states[i]=typeof v==='function'?v(states[i]):v]},useRef(initial){return {current:initial}},useEffect(fn){effects.push(fn)}};
function load(p){if(cache[p])return cache[p];const result={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText,{
module:result,exports:result.exports,localStorage,crypto:require('node:crypto').webcrypto,Event:class{},window:{dispatchEvent(){}},document:{activeElement:{focus(){restored++}},addEventListener:(k,f)=>handlers[k]=f,removeEventListener:k=>delete handlers[k]},
require(n){if(n.includes('PrivacyPolicyContent'))return load('src/components/common/PrivacyPolicyContent.tsx');if(n.includes('UiText'))return {UiText:({text})=>text};if(n.includes('VillaSerenaCard'))return load('src/components/common/VillaSerenaCard.tsx');if(n.includes('EmailVerificationFlow'))return load('src/components/common/EmailVerificationFlow.tsx');if(n.includes('employeeStore'))return {leerEmpleados:()=>[]};if(n.includes('guestAccountAccess'))return {cuentaHuespedExpirada:()=>false};if(n==='./types')return {};if(n.includes('cardForm'))return load('src/lib/cardForm.ts');if(n==='react')return hooks;if(n==='react/jsx-runtime')return require(n);if(n==='lucide-react')return new Proxy({},{get:(t,k)=>String(k)});if(n.includes('PublicLanguageToggle'))return {usePublicLanguage:()=>({lang,en:lang==='EN'})};if(n.includes('guestStore'))return load('src/store/guestStore.ts');if(n.includes('paymentStore'))return load('src/store/paymentStore.ts');if(n.includes('portalReceptionMigration'))return {migrateLegacyPortalReceptionData(){}};if(n==='@/data/pms')return {HUESPEDES_INICIALES:[]};throw Error(n)}
});return cache[p]=result.exports;}
const Profile=load('src/features/huesped/pages/PerfilHuesped.tsx').default;
const props={huespedId:guest.id,nombre:guest.nombre,telefono:guest.telefono,correo:guest.correo,onVolver(){},onCerrarSesion(){}};
function nodes(n){if(!n||typeof n!=='object')return [];if(Array.isArray(n))return n.flatMap(nodes);const children=typeof n.type==='function'?n.type(n.props):n.props?.children;return [n,...nodes(children)]}
function render(){cursor=0;effects=[];return nodes(Profile(props))}
function text(n){if(typeof n==='string')return n;if(Array.isArray(n))return n.map(text).join('');return text(n?.props?.children||'')}
function open(name){const tree=render();tree.find(n=>n.type==='button'&&text(n).includes(name)).props.onClick();return render()}
function field(label,value){const tree=render();const el=tree.find(n=>n.type==='label'&&Array.isArray(n.props.children)&&n.props.children[0]===label);assert.ok(el,label);nodes(el).find(n=>n.type==='input').props.onChange({target:{value}})}
function submit(){render().find(n=>n.type==='form').props.onSubmit({preventDefault(){}});return render()}
function alert(){return render().find(n=>n.props?.role==='alert')}
function close(){render().find(n=>n.type==='button'&&n.props['aria-label']===(lang==='EN'?'Close':'Cerrar')).props.onClick();assert.equal(render().some(n=>n.props?.['aria-labelledby']==='guest-profile-modal-title'),false)}
for(const english of [false,true]) {
 lang=english?'EN':'ES';states=[];storage.set('vs-huespedes',JSON.stringify([guest]));
 let view=open(english?'Personal information':'Informaci\u00f3n personal');
 assert.equal(view.filter(n=>n.type==='input').filter(n=>!n.props.readOnly&&n.props.type!=='file').length,0);
 assert.equal(view.some(n=>n.type==='select'||(n.type==='button'&&n.props.type==='submit')),false);
 assert.equal(storage.get('vs-huespedes'),JSON.stringify([guest]));close();
 view=open(english?'Contact details':'Datos de contacto');
 const emailLabel=view.find(n=>n.type==='label'&&Array.isArray(n.props.children)&&n.props.children[0]===(english?'Email':'Correo electr\u00f3nico'));
 assert.equal(nodes(emailLabel).find(n=>n.type==='input').props.readOnly,true);
 field(english?'Phone':'Tel\u00e9fono','bad');submit();assert.ok(alert());
 field(english?'Phone':'Tel\u00e9fono','+502 1234 5678');submit();close();
 const saved=JSON.parse(storage.get('vs-huespedes'))[0];assert.deepEqual(saved,{...guest,telefono:'+502 1234 5678'});
 states=[];open(english?'Contact details':'Datos de contacto');
 assert.ok(render().some(n=>n.type==='input'&&n.props.value==='+502 1234 5678'));close();
 view=open(english?'Privacy':'Privacidad');assert.ok(text(view).includes(english?'Privacy policy':'Pol\u00edtica de privacidad'));assert.ok(text(view).includes(english?'Guest rights':'Derechos del hu\u00e9sped'));assert.ok(view.some(n=>n.type==='a'&&n.props.href==='/privacidad'));assert.ok(view.some(n=>n.type==='a'&&n.props.href==='mailto:villaserenagt@gmail.com'));assert.equal(view.some(n=>n.type==='input'&&n.props.type!=='file'),false);assert.equal(view.some(n=>n.type==='button'&&n.props.type==='submit'),false);close();
}
lang='ES';states=[];
open('Seguridad');submit();assert.ok(alert());field('Contrase\u00f1a actual','SecretCurrent123');field('Nueva contrase\u00f1a','NewSecret123');field('Confirmar contrase\u00f1a','Mismatch123');submit();assert.ok(alert());field('Confirmar contrase\u00f1a','NewSecret123');submit();assert.ok(render().some(n=>n.props?.role==='status'&&text(n).includes('no ha cambiado')));assert.ok(render().filter(n=>n.type==='input'&&n.props.type==='password').every(n=>n.props.value===''));close();
open('M\u00e9todos de pago');field('Nombre del titular','Updated Guest');field('N\u00famero de tarjeta','12');field('CVV/CVC','987');field('Vencimiento MM/AA','12/99');submit();assert.ok(alert());field('N\u00famero de tarjeta','4242424242424242');submit();const card=JSON.parse(storage.get('vs-payment-methods'))[0];assert.equal(card.ultimos4,'4242');assert.equal(card.demo,true);assert.equal(card.huespedId,guest.id);assert.ok(render().filter(n=>n.type==='input'&&['CVV/CVC',''].includes(n.props['aria-label']||'')).every(n=>n.props.value!=='987'));assert.equal(states.some(v=>v&&typeof v==='object'&&v.numero&&String(v.numero).includes('4242')),false);assert.equal(Object.hasOwn(card,'cvv'),false);assert.equal(Object.hasOwn(card,'numero'),false);close();
states=[];open('M\u00e9todos de pago');assert.ok(text(render().find(n=>n.type==='form')).includes('4242'));assert.ok(render().some(n=>n.props?.className==='visual-card'));assert.equal(/demo|tokeniz|backend|PAN|referencia de demostraci/i.test(text(render().find(n=>n.type==='form'))),false);render().find(n=>n.type==='button'&&text(n)==='Eliminar m\u00e9todo de pago').props.onClick();assert.equal(JSON.parse(storage.get('vs-payment-methods')).length,0);
// Modal: focus, Escape, backdrop and cleanup use its actual effect/handlers.
let tree=render();const dialog=tree.find(n=>n.props?.['aria-labelledby']==='guest-profile-modal-title');const first={focus(){focused++},hasAttribute(){return false}},last={focus(){focused++},hasAttribute(){return false}};dialog.props.ref.current={querySelector:()=>first,querySelectorAll:()=>[first,last]};const cleanup=effects[effects.length-1]();assert.equal(focused,1);handlers.keydown({key:'Escape',preventDefault(){},stopPropagation(){}});assert.equal(render().some(n=>n.props?.['aria-labelledby']==='guest-profile-modal-title'),false);cleanup();assert.ok(restored>0);
open('Datos de contacto');tree=render();const backdrop=tree.find(n=>n.type==='div'&&n.props.className?.includes('z-[140]'));const target={};backdrop.props.onMouseDown({target,currentTarget:target});assert.equal(render().some(n=>n.props?.['aria-labelledby']==='guest-profile-modal-title'),false);
lang='EN';states=[];open('Personal information');assert.ok(render().some(n=>n.type==='label'&&text(n).includes('Full name')));close();
assert.equal(storage.get('vs-reservas'),originalReservations);for(const value of storage.values()){assert.equal(value.includes('SecretCurrent123'),false);assert.equal(value.includes('NewSecret123'),false);assert.equal(value.includes('4242424242424242'),false);assert.equal(value.includes('987'),false)}
const validator=load('src/lib/cardForm.ts');
assert.equal(validator.marcaTarjeta('4242424242424242'),'Visa');
assert.equal(validator.marcaTarjeta('5555555555554444'),'Mastercard');
assert.equal(validator.marcaTarjeta('378282246310005'),'American Express');
for(const english of [false,true]) {
 const valid={titular:'Guest Test',numero:'4242424242424242',cvv:'987',vencimiento:'12/99'};
 assert.equal(Object.keys(validator.validarTarjeta(valid,english)).length,0);
 for(const [key,value] of [['numero','4242424242424241'],['titular',''],['cvv','12'],['vencimiento','01/20']]) assert.ok(validator.validarTarjeta({...valid,[key]:value},english)[key]);
}
console.log('PASS: actual profile clicks/forms, validation, phone-only persistence/reload, read-only identity/email, informational privacy, safe card metadata, password boundary/no secrets, ES/EN, X/Escape/backdrop/focus and reservations preserved.');
