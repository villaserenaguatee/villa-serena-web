import type { ItemMenu } from '@/lib/pms/types';
import { MENU_INICIAL } from '@/data/pms';
const KEY = 'vs-menu-restaurante-v56';
export const MENU_EVENT = 'vs-menu-restaurante-updated';
export function leerMenu(): ItemMenu[] {
  if (typeof window === 'undefined')
    return MENU_INICIAL;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw === null)
      return MENU_INICIAL;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : MENU_INICIAL;
  }
  catch {
    return MENU_INICIAL;
  }
}
export function guardarMenu(menu: ItemMenu[]) {
  if (typeof window === 'undefined')
    return;
  window.localStorage.setItem(KEY, JSON.stringify(menu));
  window.dispatchEvent(new Event(MENU_EVENT));
}
export function actualizarDisponibilidadMenu(id: string, disponible: boolean) {
  const menu = leerMenu().map(item => item.id === id ? { ...item, disponible } : item);
  guardarMenu(menu);
  return menu;
}
