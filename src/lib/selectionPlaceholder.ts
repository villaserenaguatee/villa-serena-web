/** Messages describe the field, never a placeholder value sent to the API. */
export function selectionRequiredMessage(label:string){
 const name=label.trim()||'este campo';
 const key=name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es');
 const fields:Record<string,string>={rol:'un rol','rol de acceso':'un rol',estado:'un estado',area:'un área',piso:'un piso',habitacion:'una habitación','tipo de habitacion':'una categoría de habitación',categoria:'una categoría','categoria de habitacion':'una categoría de habitación',empleado:'un empleado',turno:'un turno',tipo:'un tipo',motivo:'un motivo',horario:'un horario',producto:'un producto',proveedor:'un proveedor'};
 return fields[key]?`Selecciona ${fields[key]} para continuar`:`Selecciona una opción para «${name}» antes de continuar`;
}
