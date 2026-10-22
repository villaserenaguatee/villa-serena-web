export function validateRoomCatalog(resource: string, draft: Record<string, unknown>, activeTypes: number[]) {
  const errors: Record<string, string> = {};
  const text = (key: string) => typeof draft[key] === 'string' ? (draft[key] as string).trim() : '';
  const integer = (key: string, min: number, max: number) => {
    const n = Number(draft[key]);
    if (draft[key] === '' || !Number.isInteger(n) || n < min || n > max) errors[key] = `Ingrese un número entero entre ${min} y ${max}`;
  };
  const decimal = (key: string, min: number) => {
    const value = String(draft[key] ?? '');
    if (!/^-?\d+(\.\d{1,2})?$/.test(value) || !Number.isFinite(Number(value)) || Number(value) < min || Number(value) > 9999999)
      errors[key] = 'Ingrese un importe válido con hasta dos decimales';
  };
  if (!['ACTIVO', 'INACTIVO'].includes(String(draft.estado))) errors.estado = 'Seleccione un estado válido';
  if (resource === 'tipos') {
    if (!text('nombre') || text('nombre').length > 100) errors.nombre = 'Ingrese un nombre de hasta 100 caracteres';
    if (!text('descripcion') || text('descripcion').length > 4000) errors.descripcion = 'Ingrese una descripción de hasta 4000 caracteres';
    integer('capacidad', 1, 30); decimal('precioBase', 0.01); decimal('ajusteFinSemanaPct', -99.99);
  } else if (resource === 'habitaciones') {
    if (!text('numero') || text('numero').length > 10) errors.numero = 'Ingrese un número de habitación de hasta 10 caracteres';
    integer('piso', 1, 100);
    if (!activeTypes.includes(Number(draft.tipoHabitacionId))) errors.tipoHabitacionId = 'Seleccione una categoría activa';
  }
  return errors;
}
