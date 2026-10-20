/** Only official hosted destinations; never trust a URL solely because it came from the API. */
export function checkoutUrl(value: string, mode: string, origin: string, code: string) {
 if(typeof value!=='string'||!value||value!==value.trim()||/[\\\u0000-\u0020\u007f]/.test(value))throw new Error('Destino de pago inválido.');
 let url:URL;try{url=new URL(value);}catch{throw new Error('Destino de pago inválido.');}
 if(url.username||url.password||url.hash)throw new Error('Destino de pago inválido.');
 if(mode==='spring'&&url.protocol==='https:'&&url.hostname==='app.recurrente.com'&&!url.port&&/^\/checkout-session\/ch_[A-Za-z0-9_-]+\/?$/.test(url.pathname)&&!url.search)return url.href;
 if(mode==='demo'&&url.origin===origin&&url.pathname==='/reserva/resultado'&&url.searchParams.get('codigo')===code)return url.href;
 throw new Error('No se pudo abrir una página de pago autorizada. Consulta el estado antes de volver a intentarlo.');
}
