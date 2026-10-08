# Cuenta, check-out y factura — issue #12 / OBJ-4C

Recepción permite consultar la cuenta, agregar o anular cargos adicionales,
cobrar el saldo completo al hacer check-out y consultar e imprimir la factura.
No incluye abonos, descuentos ni anulación de facturas.

## Acceso y configuración

En la vista del día, el enlace «Cuenta, check-out y factura» abre
`/panel/recepcion/cuenta`. Con `STAFF_AUTH_MODE=spring` solicita el código de
reserva y consulta el API configurado en `API_URL`. También se puede abrir
`/panel/recepcion/reservas/{codigo}/cuenta` directamente.
El detalle de factura está en `/panel/recepcion/facturas/{id}`.

Estas rutas requieren una sesión de Recepción. El BFF conserva los tokens en
cookies httpOnly, renueva la sesión mediante el mecanismo compartido y valida
el origen de las escrituras. Las respuestas no se almacenan en caché.

`STAFF_AUTH_MODE=demo` conserva exclusivamente la cuenta aislada `VS-DEMO-4C`.
El modo conectado no lee ni escribe su almacenamiento local ni sustituye un
error del API por datos demo. La configuración pública
`VILLA_SERENA_BFF_MODE` es independiente de esta conexión del personal.

## Contrato y comportamiento

Se utilizan los tipos generados existentes en `src/lib/api/schema.d.ts`, desde
la copia `openapi.yaml` de `develop` (base `37287b8`). No se modificó el contrato.

| Petición del navegador | Endpoint del API |
| --- | --- |
| GET `/api/cuentas/{codigo}` | GET `/api/v1/cuentas/{codigo}` |
| POST `/api/cuentas/{codigo}/cargos` | POST `/api/v1/cuentas/{codigo}/cargos` |
| POST `/api/cuentas/{codigo}/cargos/{id}/anular` | POST `/api/v1/cuentas/{codigo}/cargos/{id}/anular` |
| GET / POST `/api/checkout/{codigo}` | GET / POST `/api/v1/checkout/{codigo}` |
| GET `/api/facturas/{id}` | GET `/api/v1/facturas/{id}` |

Los importes de las líneas y los totales de cuenta se muestran como los devuelve
el servidor; los cargos anulados permanecen visibles con motivo y responsable.
El detalle de noches se muestra cuando existe. El check-out vuelve a consultar
saldo, comprador sugerido y condiciones. Un pedido en camino, un bloqueo del
API o un NIT inválido impiden confirmar. CF y el verificador K están admitidos.

Con saldo positivo se envían método y referencia opcional de un único pago,
sin monto: el servidor calcula y cobra el saldo. Con saldo cero se omite `pago`.
La confirmación nunca se repite automáticamente; un bloqueo local evita envíos
simultáneos. Ante un error se muestra el mensaje y se ofrece consultar de nuevo.
La transacción de pago, factura y cierre corresponde al API.

Tras confirmar se ofrece abrir e imprimir la factura. Esta vista utiliza el
snapshot del servidor, incluidos los datos fiscales del hotel, comprador,
cargos y pagos. La impresión usa un portal fuera de los menús y CSS para
80 mm (72 mm útiles) o carta. Imprimir y recargar no vuelven a hacer check-out.

## Evidencia al 7 de octubre de 2026

- `pnpm check`: TypeScript e idiomas aprobados.
- `pnpm build`: compilación de producción aprobada.
- `pnpm test:cuenta`: pruebas del modelo demo y NIT aprobadas.
- `pnpm test:cuenta:connected`: recorrido web → BFF → **API falso** aprobado:
  cuenta, cargos, anulación, pedido en camino, NIT inválido/CF, error de factura,
  doble clic, pago por saldo total, omisión de pago con saldo cero, recarga de
  factura, aislamiento del almacenamiento demo, permisos y origen.
- La prueba de navegador exporta capturas y PDF a
  `/tmp/villa-serena-cuenta-connected`. Comprueba el ancho útil del ticket,
  ausencia de desbordamiento y ocultación de menús en ambos formatos.
- `pnpm test:bff`: 97/98 pasan. La prueba de creación de reservas del issue #25
  espera 403 y recibe 401. Se reprodujo el mismo fallo en una copia sin cambios
  de la base `origin/develop`; no se modificó esa prueba.

Para ejecutar la prueba conectada se necesita Chromium de Playwright instalado;
el script arranca y cierra Next y el API falso en los puertos 3124/3125.
`ACCOUNT_CONNECTED_PORT` permite cambiar el puerto inicial.

Se corrigió además una importación duplicada y la importación faltante de
`requireReadyCheckInRoom` en Recepción, presentes en la base y que impedían
validar TypeScript y compilar.

## Pendiente para cerrar el criterio real

El API local no respondió en `localhost:8080`. No se acreditó un check-out real
ni se cerró la issue. Con OBJ-4A y OBJ-4B disponibles, iniciar sesión con
Recepción en modo Spring, consultar una reserva real EN_ESTADIA, comprobar sus
cargos y saldo, realizar check-out, verificar FINALIZADA/CERRADA y factura,
y revisar la impresión en ambos formatos. Repetir con saldo cero, pedido en
camino y error de factura para comprobar las reglas y la transacción reales.
Las lecturas y acciones previas de reservas conservan su migración independiente;
no se modificaron sus recorridos demo. La prueba con API falso valida la web y el BFF; no acredita la implementación
de esas reglas en Spring.
