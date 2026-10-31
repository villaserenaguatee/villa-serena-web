export function isExperienceGuestRoute(method:string,segments:string[]){
 if(segments[0]!=='reservas'||!/^VS-[A-Z0-9]{6}$/.test(segments[1]??'')||segments[2]!=='experiencias')return false;
 const id=(v:string)=>/^[1-9]\d*$/.test(v);
 return method==='GET'&&(segments.length===3||segments.length===4&&['reservas','consultas'].includes(segments[3])||segments.length===5&&id(segments[3])&&segments[4]==='disponibilidad')||method==='POST'&&(segments.length===4&&segments[3]==='reservas'||segments.length===5&&id(segments[3])&&segments[4]==='consultas'||segments.length===6&&segments[3]==='reservas'&&id(segments[4])&&segments[5]==='cancelar');
}
