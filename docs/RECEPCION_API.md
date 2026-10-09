# Recepción: calendario, reservas y check-in

Trabajo parcial del Issue #7, desde `develop` (`12a828a`).

La pantalla actual sigue en modo demo local. El calendario muestra las reservas
del navegador, sin canceladas, con colores e iconos Web/Recepción, filas por tipo
y «Sin asignar». Permite navegar por semanas, meses y volver a hoy. Las barras
son de lectura y abren un resumen con acceso al detalle existente.

Crear desde Recepción guarda antes de mostrar éxito, revalida cupo y deja la
reserva confirmada, incluso sin habitación, sin registrar pagos. El check-in
presencial comprueba fechas, huésped y habitación; muestra el motivo de rechazo.
Los huéspedes adicionales y los documentos del portal permanecen disponibles.
Los importes de esta pantalla son estimaciones demo, no cotizaciones del API.
Las fechas de hoy y relativas usan America/Guatemala, aunque el navegador esté
en otra zona horaria.

## Contrato y conexión pendiente

`openapi.yaml` es una copia sin cambios del contrato de `villa-serena-api/develop`
en `99c60f6fb14bb3a273293a8ddcfc4eec8d73043f` (blob
`45da8635278b5bcda47e2295e432b0b33d56598b`).
Los tipos se regeneran con:

```powershell
pnpm exec openapi-typescript openapi.yaml -o src/lib/api/schema.d.ts
```

`src/lib/bff/receptionApi.ts` prepara las llamadas de servidor a huéspedes,
disponibilidad, calendario, creación, detalle, adicionales y check-in. Conserva
los campos y estados del contrato. El token se recibe solo dentro del servidor;
no se entrega al navegador. No reintenta escrituras ni usa demo si falla el API.
Este transporte todavía no está conectado a Route Handlers ni a las pantallas.

Dependencias revisadas el 5 de octubre de 2026:

- [API #17 (OBJ-2A)](https://github.com/villaserenaguatee/villa-serena-api/issues/17): abierto; huéspedes, Gantt y reservas de prueba pendientes.
- [API #18 (OBJ-2B)](https://github.com/villaserenaguatee/villa-serena-api/issues/18): abierto; creación y check-in transaccional pendientes.
- [API #19 (OBJ-2C)](https://github.com/villaserenaguatee/villa-serena-api/issues/19): abierto; ocupación/condición y asignación pendientes.
- [Web #4](https://github.com/villaserenaguatee/villa-serena-web/issues/4): sesión BFF con cookies httpOnly pendiente.

El árbol de `develop` del API contiene migraciones y la clase de arranque, pero
no los controladores de estas operaciones. Una propuesta OpenAPI no demuestra
que el servidor las implemente. No hay integración real verificada.

Para cerrar #7 falta conectar la sesión y los handlers del BFF, adaptar catálogo
sin inventar IDs, usar precios del servidor, registrar adicionales en el API y
probar los tres criterios con las reservas de prueba del backend: creación
visible en Gantt, check-in `EN_ESTADIA` y rechazo por condición `SUCIA`.
El calendario usa EventCalendar, cargado solo en el navegador, sin arrastre
ni selección de días para crear reservas.

Los cambios locales de #8 (cambio de habitación), idiomas, identidades demo y
comparación de flujos no forman parte de esta rama. No cerrar el Issue con esta PR.

## Pruebas

```powershell
pnpm test:bff
node scripts/test-portal-checkin.cjs
pnpm exec vitest run --project component tests/component/checkin-documentos.test.tsx
node scripts/test-reservation-lifecycle.cjs
pnpm check
pnpm build
```

Para repetir la prueba de navegador en un contexto temporal, sin tocar datos
del navegador personal:

```powershell
pnpm exec playwright install chromium
pnpm dev --port 3017
# En otra terminal:
pnpm test:reception:browser
```

`RECEPTION_TEST_URL` permite cambiar el puerto de prueba. La comprobación usa
Chromium en escritorio y móvil, con zona UTC para verificar las fechas del hotel.
Comprueba navegación, creación con y sin habitación visible en Gantt sin pagos, check-in con habitación
limpia, recarga y rechazo por habitación no lista. Todo esto es demo local;
las pruebas del transporte simulan respuestas del API.
Con `VILLA_SERENA_BFF_MODE=api`, Recepción muestra el bloqueo de conexión y no
permite operar con reservas demo. Se comprobó también con el build de producción
y `node scripts/test-reception-browser.cjs --api` contra ese servidor.
