# BFF del flujo público de reservas

Primer bloque: las pantallas de resultados, detalle y datos consultan
`POST /api/public/availability` en Next.js. Se conserva el catálogo, las imágenes
y las configuraciones demo existentes. No se adopta todavía el contrato propuesto.

En demo se envía contexto temporal de habitaciones y ocupaciones, sin datos del
huésped ni pagos. El BFF valida y calcula disponibilidad; no importa ni sobrescribe
localStorage. Incluye reservas asignadas y sin asignación. Una respuesta fallida
no se presenta como lista vacía ni habilita continuar con inventario anterior.

Esta etapa es **solo consulta**: creación, pago y confirmación mantienen el código
actual de develop y se migrarán después. No hay persistencia compartida del servidor
ni garantía contra sobreventa en la creación aún. El contexto es de confianza solo
para el demo, no un inventario oficial para producción. En modo `api` devuelve 503
explícito hasta acordar y conectar disponibilidad real; no hay fallback demo automático.

Pendientes funcionales: pagar en el hotel, Stripe y transferencia/depósito a cuentas
guatemaltecas con comprobante. Banco requiere definir revisión, plazos y acceso privado.
Promociones se discute en el [issue API #7](https://github.com/villaserenaguatee/villa-serena-api/issues/7).

Verificación: `pnpm test:bff`, `pnpm check`, `pnpm build`, más los tests existentes
de scripts para comprobar que no se cambiaron los flujos locales del portal.

Resultado del primer bloque: 11 tests BFF, los siete scripts existentes, TypeScript,
i18n (57 claves) y build de producción aprobados. No se hicieron capturas ni una
prueba completa de interacción en navegador; no se conectó un backend real.

## Segundo bloque: creación y resultado demo — issue #13

`POST /api/public/bookings` recibe un DTO en inglés: intento UUID, oferta y habitación,
fechas, adultos/niños, huésped, método, promoción y total esperado. Solo permite
crear con `paymentMethod: hotel`: guarda una reserva demo confirmada sin pagos,
sin simular correo, verificación ni cobros. Esta confirmación es comportamiento demo;
las políticas reales de confirmación/cancelación/no presentación siguen pendientes.
Stripe y banco permanecen visibles y pendientes de integración; sus solicitudes
fallan explícitamente sin guardar. En modo `api` se devuelve `API_NOT_READY` (503).
No se adopta el contrato propuesto ni se instala un cliente OpenAPI en este bloque.

El servidor genera código/ID y valida huésped, estancia, ocupación, oferta, piso,
habitación, tarifa y promoción antes de guardar. El total se fija al crear; no activa
ajustes nuevos. El contexto de inventario, tarifas y promociones del navegador es
**configuración confiada exclusivamente para demo**, no autoridad de producción.
Se conserva la configuración local sin importarla ni sustituirla en el servidor.
Las ocupaciones guardadas por el BFF prevalecen sobre copias locales del mismo código
y se incorporan tanto a disponibilidad como a la revalidación de creación.

### Persistencia e idempotencia

Estado exclusivo de este bloque en `.data/public-bookings.json` (ignorado por Git),
o en `VILLA_SERENA_BFF_STATE_PATH`. No importa huéspedes, pagos ni reservas locales.
Cada escritura guarda huésped, reserva y huella del intento en una única operación:
archivo temporal privado y rename. Una lectura corrupta o escritura fallida devuelve
503; nunca reinicia silenciosamente el estado. Misma clave y parámetros devuelve
la misma reserva; parámetros distintos con esa clave devuelve 409. Los cambios de
contexto demo no modifican un resultado ya guardado. No hay reintentos POST automáticos.
El borrador conserva los parámetros y la clave del intento tras un fallo incierto.
Cambiar datos, fechas o promoción no crea otra clave mientras ese intento siga
pendiente o guardado. «Recuperar intento anterior» reenvía explícitamente los datos
originales. Solo un rechazo explícito sin escritura permite corregir el intento.
La recuperación por código incluye `recoveryCode`: si ese resultado no existe o
pertenece a otro intento, falla sin crear una nueva reserva.

El bloqueo exclusivo de archivo protege procesos que comparten el mismo archivo en
un host; si está ocupado devuelve 503 para un reintento explícito. No garantiza
coordinación entre hosts, volúmenes separados ni durabilidad ante pérdida del disco.
Requiere Node y almacenamiento local persistente: no es una solución serverless ni
un sustituto de las garantías durables que deberá ofrecer la API. Tras una caída que
abandone `.lock`, se deben detener los procesos y comprobar que no haya escritores
antes de eliminar ese bloqueo; no se rompe por tiempo transcurrido. Guardar el archivo
fuera de directorios públicos y restringir sus permisos (datos personales demo).
No hay vencimiento de 30 minutos ni cancelación automática para pagar en el hotel.

### Navegador y compatibilidad

Datos → verificar → pago usa un borrador de `sessionStorage` por pestaña, con duración
máxima de dos horas; la URL lleva un identificador aleatorio y metadatos de estancia,
sin nombre, correo, teléfono ni documento. No es autenticación ni storage privado
frente a scripts del mismo origen. Si falla/vencen los datos se pide volver al formulario.
Cambiar correo actualiza el borrador. La pantalla conserva el formulario de verificación
sin fingir un proveedor, y permite continuar con correo pendiente para la reserva demo.
La reserva pública usa el correo de su borrador aunque exista otra sesión de huésped;
no hereda su identidad ni su estado de verificación. Un borrador vencido impide continuar.

Tras la respuesta del servidor se añade una copia a los stores existentes, sin borrar
colecciones ni modificar huéspedes ya guardados con el mismo documento. Se conserva
su ID local para enlazar la reserva y mantener el portal, Recepción y cuenta de estadía.
Repetir el intento no sobrescribe check-in, pagos, servicios ni perfiles locales.
Una copia fallida no invalida la reserva guardada: confirmación muestra el resultado
servidor y permite reintentar la copia usando el mismo intento del borrador.
Una consulta fallida de confirmación puede reintentarse mediante GET sin crear otra
reserva. Si falla la recuperación de la copia local, se muestra el error y se conserva
el resultado guardado del servidor.
**Las acciones posteriores locales no se sincronizan con el BFF**: cancelación,
check-in/check-out y pagos locales no liberan inventario ni cambian el resultado
servidor. Esto es un puente temporal, no un PMS compartido.

`GET /api/public/bookings/{code}` entrega únicamente modo, código, estado, método,
estado de pago y total, con `no-store`. No permite leer el huésped, fechas, habitación,
comprobantes ni el objeto de compatibilidad. El código aleatorio no concede permisos
para futuras acciones privadas. La confirmación por código no exige pago para hotel;
el resultado es válido aunque falte la copia local. La ruta anterior por `reservaId`
conserva la validación de reservas heredadas con tarjeta.

Verificación del bloque: 25 tests BFF (incluida concurrencia entre tres procesos,
respuesta perdida, bloqueo/escritura fallidos, replay y conservación local), los siete
scripts existentes, TypeScript, i18n (57 claves), build de producción y smoke HTTP de
creación/replay/resultado/cupo/confirmación aprobados. Sin prueba completa de interacción
en navegador: el conector no encontró Chrome. Sin capturas, backend real ni pagos.
