# Resultado del pago y canal simulado — Issue #6

Esta etapa funciona con datos de prueba detrás del BFF de Next.js. No realiza cobros, no contacta canales externos y no envía correos. El modo real devuelve 503 explícitamente; no usa datos simulados como sustituto de una conexión fallida.

## Dependencias y fuentes

Rama `feat/issue-6-resultado-canal`, creada desde `develop` (`ec60ec4`). Los PR #19 (sesión del personal) y #21 (reserva pública con tarjeta) estaban abiertos al comenzar. Sus commits se reutilizaron como dependencias locales separadas, sin rehacer esos módulos. Antes de publicar el PR debe revisarse su integración para evitar incluir nuevamente esos cambios.

Acuerdo de publicación vigente: publicar #6 en un PR en borrador hacia `develop`, incluyendo y señalando los commits de las dependencias #19 y #21. Esos cambios no se presentan como trabajo nuevo de #6. Mantener el borrador hasta integrar las dependencias y recomponer la rama sobre el último `develop` con únicamente los cambios de #6; después, revisar la diferencia y repetir las comprobaciones. No hacer merge ni cerrar el Issue.

Fuentes: [Issue #6](https://github.com/villaserenaguatee/villa-serena-web/issues/6), [OBJ-1E](https://github.com/villaserenaguatee/villa-serena-docs/blob/main/15%20-%20Prompts%20de%20IA/OBJ-1E%20-%20Web%20-%20Resultado%20del%20pago%20y%20canal%20simulado.md), historias de Cliente/Huésped y Channel Manager enlazadas en esa fuente, y `openapi.yaml` con sus tipos generados. No se modificó el contrato.

## Resultado público

`/reserva/resultado?codigo=...` consulta `GET /api/publico/reservas/{codigo}/estado`. Solo una respuesta coherente `CONFIRMADA` + `APROBADO` muestra confirmación. Los parámetros de regreso, la navegación y el reintento no cambian ese estado.

Los tres resultados son confirmado, en proceso y no completado. Se consulta cada 3 segundos durante un máximo de un minuto; después puede consultarse otra vez o reintentarse mientras el BFF indique que la reserva sigue pendiente. El contrato no distingue un intento abandonado de uno en proceso cuando ambos tienen `PENDIENTE_PAGO/PENDIENTE`; el vencimiento de la consulta no se interpreta como rechazo bancario. Una reserva cancelada por el plazo de 30 minutos no admite reintento.

El botón de reintento consulta primero el estado y luego solicita `POST /api/publico/reservas/{codigo}/pago`. La simulación devuelve una URL local, sin aprobar el pago. Una reserva pública nueva nunca pasa a confirmada por estos actos.

Casos sembrados en el servidor, independientes de las reservas nuevas:

| Código | Resultado |
| --- | --- |
| `VS-DEMO01` | Confirmado de prueba |
| `VS-DEMO02` | En proceso; al minuto, opción de consultar/reintentar |
| `VS-DEMO03` | No completado, sin pago iniciado; admite reintento |
| `VS-DEMO04` | Cancelado por vencimiento; no admite reintento |

Estas fixtures sirven para comprobar las vistas. No representan una transacción de Stripe ni un webhook recibido. El texto del correo aclara que no se envió un correo real.

## Canal del Administrador

`/panel/admin/canal-simulado` reutiliza el panel y la sesión HttpOnly. Solo ADMIN puede abrir el formulario y ejecutar `POST /api/admin/canal-simulado/reservas`; Recepción ve “Acceso denegado”. El servidor comprueba la sesión, el rol, la contraseña temporal y el Origin. El proxy general sigue bloqueando `/canal` y las variantes del simulador.

El formulario consulta los tipos al BFF público y envía únicamente `CanalSimuladoPeticion`: canal BOOKING/EXPEDIA y datos de reserva/huésped. Permite llenar al azar y repetir el último envío capturado, aunque se edite el formulario después.

Se respeta `CanalSimuladoResultado`: la envoltura responde **HTTP 200**, con **`codigoHttp: 201`** al crear y **`codigoHttp: 200`** al repetir. Esos son los códigos del canal que muestra la pantalla. La misma pareja canal/identificador externo devuelve la reserva original sin duplicarla, incluso si otros datos cambian. El ejemplo del contrato tiene valores de una reserva web; la simulación usa `CONFIRMADA` y BOOKING/EXPEDIA, según la descripción del canal y su historia de usuario.

El criterio 3 del Issue menciona 201 al crear y 200 al repetir. No son los estados HTTP de la envoltura del simulador: `paths → /api/v1/admin/canal-simulado/reservas → post → responses → "200"` y `components → schemas → CanalSimuladoResultado → description` en `openapi.yaml` establecen HTTP 200 con `codigoHttp`. En cambio, `/api/v1/canal/reservas` sí define HTTP 201/200. Por indicación del usuario se conserva el contrato del simulador; no se presenta HTTP 200 con `codigoHttp: 201` como equivalente a una respuesta HTTP 201 al navegador.

Las reservas del canal se guardan en el almacenamiento de prueba del BFF público y consumen su inventario compartido. Se reutilizan huéspedes conocidos por correo. Las reservas y las pantallas de Recepción no se modifican.

`CANAL_BOOKING_CODIGO`, `CANAL_BOOKING_CLAVE`, `CANAL_EXPEDIA_CODIGO` y `CANAL_EXPEDIA_CLAVE` figuran vacíos en `.env.example`. El módulo `server-only` prepara las cabeceras futuras `X-Canal-Codigo/X-Canal-Clave`. La simulación no necesita claves reales; no hay campo, cabecera, respuesta ni almacenamiento de claves en el navegador.

## Comprobaciones y pendiente

- `node --import ./tests/bff/register.mjs --test --test-isolation=none tests/bff/*.test.ts`: resultados, estados inconsistentes, regreso sin confirmación, reintentos, 201/200, concurrencia, permisos, renovación, Origin, datos inválidos, cupo compartido, almacenamiento corrupto y separación del modo real.
- Reemplazo implementado, pendiente de CI: `pnpm test:payments:browser` y `pnpm test:channels:browser` (reportes separados y servidor demo aislado). Se conserva el origen hasta validar equivalencia.
- Referencia histórica conservada, `node scripts/test-payment-channel-browser.cjs`: computadora y móvil; vistas, expiración, reintento, límite de consultas, roles, formulario, repetición capturada y ausencia de una clave de prueba en HTML/JS, peticiones, respuestas y almacenamiento. Servidor en puerto 3006; puede cambiarse con `ISSUE6_TEST_URL`. Evidencias locales en `.next-dev/issue6-evidence`.
- El script de reserva pública existente se actualizó al título “Pago en proceso” para comprobar el recorrido completo sin cambiar sus datos ni su comportamiento de tarjeta.
- Verificación realizada: 67 pruebas del BFF aprobadas, ambos scripts de navegador aprobados en computadora/móvil, TypeScript sin errores, 60 claves de traducción coincidentes y compilación de producción aprobada.

Pendiente: conexión real con Spring y canales, redirección a Stripe, confirmación autoritativa después del pago de prueba mediante webhook, correo real y visibilidad de las reservas del canal en Recepción mediante la API real. Ninguna de estas validaciones se presenta como realizada.
