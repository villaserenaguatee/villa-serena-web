export const MAX_FOTO = 5 * 1024 * 1024;
export function validarFoto(file: { type: string; size: number }) {
  if (!['image/jpeg', 'image/png'].includes(file.type)) return 'La foto debe ser JPG o PNG.';
  if (file.size > MAX_FOTO) return 'La foto debe pesar como máximo 5 MB.';
  if (!file.size) return 'La foto está vacía.';
  return '';
}
