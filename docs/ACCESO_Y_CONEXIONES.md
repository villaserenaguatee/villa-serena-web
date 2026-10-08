# Acceso, módulos y conexiones

## Inicio de sesión

El personal entra desde `/panel/login`; el huésped, desde `/login`.

### Cuentas por área

| Rol | Correo | Acceso |
| --- | --- | --- |
| Administración | `admin@villaserena.gt` | `VillaSerena26` |
| Recepción | `recepcion@villaserena.gt` | `VillaSerena26` |
| Limpieza | `limpieza@villaserena.gt` | `VillaSerena26` |
| Room Service | `roomservice@villaserena.gt` | `VillaSerena26` |
| Mantenimiento | `mantenimiento@villaserena.gt` | `VillaSerena26` |
| Huésped | `anamorales@gmail.com` | `demo123` |

Las cuentas de prueba del personal usan `VillaSerena26` en el BFF. Un empleado inactivo no puede iniciar sesión. Estas credenciales no configuran el acceso real de Spring.

La sesión demo del huésped incluye un `guestId` explícito vinculado a su registro en `guestStore`. El portal resuelve el perfil y sus reservas por ese ID; si la sesión o el huésped asociado no son válidos, no muestra datos de otra cuenta.

## Web pública

Funciones principales:

- página principal del hotel;
- catálogo de habitaciones;
- detalle de habitación;
- consulta de disponibilidad;
- captura de datos del huésped;
- selección de método de pago;
- confirmación de reserva;
- activación del acceso del huésped;
- páginas legales y de información.

Conexiones:

- `publicAvailability.ts` consulta habitaciones, reservas y tarifas;
- `publicBooking.ts` valida la solicitud y crea la reserva únicamente después de una aprobación de pago;
- `reservationStore.ts` conserva las reservas del navegador;
- `guestStore.ts` conserva los huéspedes del navegador;
- `roomStore.ts` conserva las habitaciones del hotel.

El flujo público no tiene un BFF ni una pasarela de pago conectados. La función `processCardPayment` en `publicBooking.ts` es el punto de integración pendiente. El checkout no debe crear ni confirmar una reserva a partir de la validación local de los campos de tarjeta; la confirmación requiere una reserva persistida y un pago confirmado. Los datos antiguos de `vs-portal-recepcion` se migran una sola vez a `vs-reservas` y `vs-huespedes`.

## Recepción

Funciones principales:

- resumen del día;
- gestión de reservas;
- consulta de disponibilidad;
- control de habitaciones;
- registro y actualización de huéspedes;
- solicitudes;
- incidencias;
- reportes operativos;
- objetos olvidados;
- chat con huéspedes;
- check-in y check-out;
- pagos, servicios adicionales y comprobantes.

Conexiones:

- `reservationStore.ts`: reservas;
- `guestStore.ts`: huéspedes;
- `roomStore.ts`: habitaciones;
- `tarifasStore.ts`: tarifas;
- `guestStore.ts`: huéspedes compartidos con el Portal del huésped;
- `cleaningEvents.ts`: tareas posteriores al check-out;
- `maintenanceEvents.ts`: incidencias de mantenimiento;
- `lostFoundEvents.ts`: objetos olvidados;
- `chatStore.ts`: conversaciones.

## Portal del huésped

Funciones principales:

- inicio de estancia;
- perfil;
- reserva de estancia;
- check-in web;
- restaurante y servicios;
- pedidos;
- habitación;
- cuenta y cargos;
- chat con Recepción;
- reservas de experiencias.

Conexiones:

- comparte reservas con Recepción;
- obtiene estado y tarifa de habitaciones del PMS;
- utiliza el menú compartido con Room Service;
- publica pedidos mediante `roomServiceSync.ts`;
- comparte mensajes mediante `chatStore.ts`;
- genera tareas de limpieza mediante `cleaningEvents.ts`;
- consulta información de pagos mediante `paymentStore.ts`;
- traduce mensajes mediante `/api/translate`.

## Room Service

Funciones principales:

- pedidos pendientes;
- detalle de pedido;
- pedidos telefónicos;
- actualización de estado;
- catálogo de menú;
- disponibilidad de productos;
- historial;
- cargos.

Conexiones:

- `roomServiceSync.ts` conecta pedidos del huésped y Room Service;
- `menuStore.ts` comparte disponibilidad del menú con el Portal del huésped;
- los cargos terminados se reflejan en la cuenta del huésped según el flujo actual.

## Limpieza

Funciones principales:

- panel de trabajo;
- mapa de habitaciones;
- solicitudes;
- incidencias;
- objetos olvidados;
- historial.

Conexiones:

- `roomStore.ts` mantiene el estado de las habitaciones;
- `cleaningEvents.ts` recibe tareas de salida;
- `lostFoundEvents.ts` comparte objetos con Recepción;
- `maintenanceEvents.ts` envía incidencias a Mantenimiento.

## Mantenimiento

Funciones principales:

- panel del área;
- incidencias recibidas;
- órdenes de trabajo;
- mantenimiento preventivo;
- activos y equipos.

Conexiones:

- `maintenanceEvents.ts` centraliza incidencias;
- `roomStore.ts` comparte estado de habitaciones;
- `reservationStore.ts` permite validar ocupación y disponibilidad;
- `adminOperationsStore.ts` comparte activos con Administración;
- `employeeStore.ts` proporciona personal técnico.

## Administración

Funciones principales:

- panel de habitaciones;
- tarifas;
- reportes;
- personal;
- inventario y compras;
- finanzas;
- activos.

Conexiones:

- `employeeStore.ts` alimenta autenticación y perfiles del personal;
- `tarifasStore.ts` actualiza precios en la web pública y Recepción;
- `roomStore.ts` mantiene habitaciones;
- `reservationStore.ts` aporta ocupación e ingresos;
- `adminOperationsStore.ts` comparte inventario, compras, gastos y activos;
- `promotionStore.ts` comparte promociones con el flujo público.

## Persistencia actual

La implementación funcional actual usa almacenamiento del navegador para conservar información operativa entre pantallas y eventos personalizados para sincronizar los módulos dentro de la aplicación. Los archivos de `src/store/` son los puntos centrales de persistencia, eventos y sincronización entre módulos.

## Traducción

La interfaz bilingüe utiliza los recursos de `src/i18n`. Los mensajes que requieren traducción dinámica utilizan `/api/translate`. Para habilitar DeepL se debe crear `.env.local` con:

```env
DEEPL_API_KEY=clave_del_proveedor
DEEPL_API_URL=https://api-free.deepl.com/v2/translate
```
