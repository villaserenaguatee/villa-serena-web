# Inventario — ajustes de la implementación existente

Fuente: HU-ADM-13 y contrato oficial docs 77225a1, incluido inventario-contrato.md. No se utilizan las rutas obsoletas admin/inventario.

- Inventario consulta únicamente gestion/insumos, gestion/movimientos y gestion/compras. Los servicios financieros adicionales ya no impiden cargarlo.
- Edición del insumo con su UUID y versión actual, conservando datos adicionales. Stock de solo lectura; los movimientos y compras existentes siguen siendo la única forma de cambiar existencias.
- Los errores y conflictos conservan el formulario. Actualización explícita para recuperar la versión real. No se afirma éxito tras una respuesta incierta.
- Creación y movimientos conservan el UUID del intento para reenviar exactamente los mismos datos. Nombres duplicados permitidos; no se inventa desactivación.
- Reutiliza el filtro por categoría y agrega solo stock bajo, incluyendo igualdad stock <= mínimo. Convierte decimales recibidos como texto para los cálculos de la interfaz.
- Costo cero admitido según contrato; nombre/unidad no vacíos y límites numéricos oficiales. No modifica datos de otros módulos.

## Comprobaciones

6 pruebas nuevas y 9 regresiones de disponibilidad: pasan. TypeScript, lint dirigido, i18n y build: pasan. HTTP simulado y controlado, sin escrituras reales.

## Validaciones futuras con backend

Persistencia compartida, concurrencia entre sesiones y efecto único de los reenvíos. La adopción general de tipos de docs continúa separada en #76.
