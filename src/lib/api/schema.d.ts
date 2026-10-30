/** Generado desde villa-serena-docs/openapi.yaml. No editar.
 * Contrato SHA-256: ad3171d23b0c085980d90e7d35ae476fe0e7633b378aa4fb884f9dbd97dd368f
 */
export interface paths {
    "/api/v1/auth/login": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Iniciar sesión del personal
         * @description HU-EMP-01 · RF-SEG-001. Correo y contraseña del empleado. Si son incorrectos
         *     responde un mensaje genérico que no revela si el correo existe. Tras 5
         *     intentos fallidos seguidos, la cuenta se bloquea 15 minutos. Un empleado
         *     `INACTIVO` no entra. El BFF guarda los tokens en cookies httpOnly y nunca
         *     los envía al navegador.
         */
        post: operations["iniciarSesion"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/renovar": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Renovar el token de acceso
         * @description HU-EMP-01 · RF-SEG-001. Recibe el refresh token y emite un par nuevo; el
         *     anterior deja de servir (rotación). Revisa que el empleado siga `ACTIVO`.
         *     El mismo endpoint lo usará la app del huésped (parte 2), por eso responde
         *     solo los tokens.
         */
        post: operations["renovarSesion"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/cerrar-sesion": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Cerrar sesión
         * @description HU-EMP-01 (criterio 7) · RF-SEG-001. Revoca el refresh token. Se permite
         *     aunque el empleado tenga la contraseña temporal.
         */
        post: operations["cerrarSesion"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/cambiar-contrasena": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Cambiar mi contraseña
         * @description HU-EMP-02 · RF-SEG-004. Obligatorio mientras `debeCambiarContrasena` sea
         *     verdadero; mientras tanto, el resto del API responde 403
         *     `CONTRASENA_TEMPORAL` (salvo este endpoint, /cerrar-sesion y /yo).
         *     La nueva contraseña: mínimo 8 caracteres, al menos una letra y un número,
         *     y distinta de la actual. Emite tokens nuevos sin la marca y revoca los
         *     refresh anteriores.
         */
        post: operations["cambiarContrasena"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/yo": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Datos del empleado autenticado
         * @description HU-EMP-01 · RF-SEG-001. El layout del panel lo usa para confirmar el rol y
         *     mostrar "Acceso denegado" si la sección no es suya. Se permite con la
         *     contraseña temporal pendiente.
         */
        get: operations["obtenerSesionActual"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/publico/hotel": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Información del hotel
         * @description HU-HUE-01 · RF-ADM-007. Datos de la configuración del hotel (datos iniciales).
         */
        get: operations["obtenerHotel"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/publico/tipos-habitacion": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Catálogo de tipos de habitación
         * @description HU-HUE-02 · RF-HAB-006. Solo tipos `ACTIVO`. Lista vacía si no hay
         *     ninguno (la web muestra un mensaje). Recepción y el canal simulado también
         *     usan esta lista para elegir el tipo.
         */
        get: operations["listarTiposHabitacionPublicos"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/publico/tipos-habitacion/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Detalle de un tipo de habitación
         * @description HU-HUE-02 (criterio 3) · RF-HAB-006. Un tipo `INACTIVO` responde 404.
         */
        get: operations["obtenerTipoHabitacionPublico"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/publico/disponibilidad": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Buscar disponibilidad y precio total
         * @description HU-HUE-03, HU-HUE-04 · RF-RES-001, RF-TAR-004. Reglas: 1 a 30 noches, sin
         *     fechas pasadas, salida posterior a la entrada y entrada a no más de 365
         *     días ("hoy" en America/Guatemala). Solo tipos activos con capacidad
         *     suficiente y cupo en **todas** las noches. Precio por noche = base ×
         *     (1 + % temporada) × (1 + % fin de semana si es viernes o sábado),
         *     redondeado a 2 decimales. Lista vacía si no hay disponibilidad. No
         *     muestra cuántas habitaciones quedan (solo Recepción lo ve).
         */
        get: operations["buscarDisponibilidadPublica"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/publico/ofertas": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Consultar catálogo de ofertas
         * @description Catálogo comercial usado por la web, ordenado por el orden del catálogo.
         *     Una oferta tiene slug propio y se vincula a un tipo mediante apiTypeId.
         *     Varias ofertas pueden compartir el mismo inventario de habitaciones.
         *     bookable indica tipo activo y existencia de una habitación elegible por
         *     características; no garantiza disponibilidad para unas fechas concretas.
         *     No devuelve pendingFeatures (notas editoriales internas).
         */
        get: operations["listarOfertasPublicas"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/publico/ofertas/disponibilidad": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Consultar ofertas disponibles y cotización
         * @description Requiere entrada, salida y huespedes: 1 a 30 noches, sin fechas pasadas,
         *     entrada a no más de 365 días y al menos un huésped (America/Guatemala).
         *     Filtra por bookable, capacidad de la oferta, cupo del tipo y una misma
         *     habitación elegible libre durante toda la estadía. Lista vacía si no hay.
         *     Cotiza al precio fijo de la oferta por noche, sin ajustes de temporada o
         *     fin de semana. Ofertas con el mismo inventarioCompartido no son cupos
         *     independientes ni deben sumarse. No expone cantidades restantes ni IDs
         *     de habitaciones. La creación de reserva vuelve a validar disponibilidad.
         */
        get: operations["buscarDisponibilidadOfertasPublicas"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/publico/reservas": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Crear la reserva web
         * @description HU-HUE-05 · RF-RES-008, RF-HUE-001, RF-PAG-007, RF-RES-010. Revalida la
         *     disponibilidad antes de crear. Si ya existe un huésped con ese correo, la
         *     reserva se asocia a ese perfil sin cambiar sus datos. La reserva nace
         *     `PENDIENTE_PAGO`, canal `DIRECTO_WEB`, con precio fijo y cuenta `ABIERTA`
         *     con el cargo por alojamiento. Si no se paga en 30 minutos se cancela sola. La web conserva Idempotency-Key antes de enviar. El comprobante corresponde al correo y borrador enviados. Reserva, prueba consumida y respuesta se guardan atómicamente. Repetir la misma clave y datos devuelve la respuesta inicial sin duplicar; cambiar los datos produce BOOKING_REQUEST_CONFLICT. Para intentos nuevos, el replay exige también prueba vigente del mismo correo y borrador. Los históricos conservan su replay.
         *
         *
         *     Hora estimada de llegada opcional, local de America/Guatemala, HH:mm entre 00:00 y 23:59. Omitida o null significa sin indicar; no tiene valor por defecto ni modifica el horario de check-in. Vacío, segundos o zona horaria devuelven 400 DATOS_INVALIDOS. Cambiar la hora con la misma Idempotency-Key devuelve 409 BOOKING_REQUEST_CONFLICT; omitirla y enviar null son equivalentes para los reenvíos.
         */
        post: operations["crearReservaWeb"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/publico/ofertas/{slug}/reservas": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Crear reserva web de una oferta
         * @description HU-HUE-05 · Reserva una oferta identificada por slug con el mismo cuerpo de reserva pública. tipoHabitacionId debe coincidir con el tipo de la oferta y numeroHuespedes con su capacidad. Revalida cupo y habitación elegible; nace PENDIENTE_PAGO y usa el precio de la oferta.
         *
         *     Hora estimada de llegada opcional, local de America/Guatemala, HH:mm entre 00:00 y 23:59. Omitida o null significa sin indicar; no tiene valor por defecto ni modifica el horario de check-in. Vacío, segundos o zona horaria devuelven 400 DATOS_INVALIDOS. Cambiar la hora con la misma Idempotency-Key devuelve 409 BOOKING_REQUEST_CONFLICT; omitirla y enviar null son equivalentes para los reenvíos.
         */
        post: operations["crearReservaWebOferta"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/publico/reservas/{codigo}/pago": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Iniciar (o retomar) el pago con Recurrente
         * @description HU-HUE-06 · RF-PAG-003, RF-PAG-012. Crea **una** sesión de Recurrente
         *     Checkout por el 100 % del total, o devuelve la misma si sigue abierta.
         *     El pago queda `PENDIENTE`. Recurrente regresa (pagado o cancelado) a
         *     `{WEB_URL}/reserva/resultado?codigo={codigo}`. El pago se verifica en el backend por webhook o conciliación del job de vencimiento,
         *     nunca por la redirección.
         *     Revalida plazo y estado aunque una consulta previa permitiera la acción.
         *     Si el checkout está pagado pendiente de registro o payment_in_progress, responde
         *     409 PAGO_EN_VERIFICACION sin crear otro. Si la pasarela falla, responde 502
         *     ERROR_PASARELA sin habilitar un nuevo cobro. Solo un checkout confirmado expired
         *     permite sustituir el intento pendiente; un unpaid con fecha vencida debe esperar
         *     confirmación de vencimiento de la pasarela. Plazo vencido: 409 PLAZO_PAGO_VENCIDO.
         */
        post: operations["iniciarPagoReserva"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/publico/reservas/{codigo}/estado": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Estado de la reserva y proceso de pago
         * @description HU-HUE-06 (criterio 6) · RF-PAG-004. Solo el estado de la reserva y de su
         *     pago (VIS-03); ningún dato personal. Casos de la página: `CONFIRMADA` →
         *     confirmada; `PENDIENTE_PAGO` → pago en proceso o no completado (con
         *     acción explícita); `CANCELADA` → reserva cancelada.
         *     estadoPago representa el registro local; estadoCheckout representa la observación
         *     del proveedor. PAGADO con estadoPago PENDIENTE significa esperar confirmación local,
         *     nunca reserva confirmada. La consulta no acredita pagos ni crea sesiones.
         *     accionPago distingue INICIAR, CONTINUAR, ESPERAR, REINTENTAR y NINGUNA.
         *     puedeReintentar es true únicamente para REINTENTAR; ya no significa simplemente
         *     PENDIENTE_PAGO. No se ofrecen acciones de cobro fuera de plazo. Un fallo de pasarela con la reserva aún PENDIENTE_PAGO
         *     devuelve NO_VERIFICADO/ESPERAR y puedeReintentar=false. urlPago solo se devuelve para
         *     CONTINUAR; expiraEn limita esa sesión y pagoVenceEn limita la reserva.
         *     Web y app deben usar accionPago y volver a consultar mientras sea ESPERAR.
         *     Las respuestas de estado y recuperación no se almacenan en caché.
         */
        get: operations["obtenerEstadoReservaPublica"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/pagos/recurrente/webhook": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Aviso de Recurrente (webhook)
         * @description Verifica la firma Svix sobre el cuerpo original con RECURRENTE_WEBHOOK_SECRET
         *     y una tolerancia de cinco minutos. Idempotencia por svix-id. intent.succeeded
         *     consulta el checkout en Recurrente y confirma únicamente si está pagado.
         *     checkout.expired solo marca FALLIDO si el proveedor confirma expired.
         *     Comprueba importe registrado, GTQ e identificador del pago antes de aprobar.
         *     El job de vencimiento consulta al proveedor antes de cancelar; no libera el cupo
         *     si el pago sigue en proceso y puede conciliar un pago confirmado por Recurrente.
         *     Otros eventos válidos se ignoran con 200. El retorno del navegador no aprueba pagos.
         *     No requiere JWT; sí las tres cabeceras Svix. No se expone a través del BFF.
         */
        post: operations["recibirWebhookRecurrente"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/canal/reservas": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Recibir una reserva de un canal externo
         * @description HU-CM-01 · RF-CM-002, RF-CM-008, RF-PAG-013, RF-RES-010. Autenticación con
         *     `X-Canal-Codigo` y `X-Canal-Clave` (comparada con su hash). Valida los 6
         *     datos del huésped, 1 a 30 noches, sin fechas pasadas ni a más de 365
         *     días, capacidad y tipo activo, y la disponibilidad con las mismas reglas
         *     de la web. Crea la reserva `CONFIRMADA` con el canal y el identificador
         *     externo, la cuenta con un cargo por alojamiento igual a `montoTotal` y un
         *     pago `APROBADO` con método `CANAL`. Si el identificador externo ya existe
         *     en ese canal, responde **200** con la reserva existente y no crea nada.
         *     El canal simulado (BFF de la web) llama a este mismo endpoint.
         */
        post: operations["crearReservaCanal"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/huespedes": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Buscar huéspedes
         * @description HU-REC-01, HU-REC-04 (criterio 1) · RF-HUE-001. Rol `RECEPCION`. Busca por
         *     nombre, número de documento o correo para asociar el huésped a una
         *     reserva. Lista vacía si no hay coincidencias.
         */
        get: operations["buscarHuespedes"];
        put?: never;
        /**
         * Registrar un huésped
         * @description HU-REC-01 · RF-HUE-001. Rol `RECEPCION`. La nacionalidad es opcional. El
         *     correo identifica al huésped: si ya existe, responde 200 con el perfil
         *     existente y `yaExistia: true` (no crea otro ni cambia sus datos).
         */
        post: operations["registrarHuesped"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/reservas/disponibilidad": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Consultar disponibilidad (Recepción)
         * @description HU-REC-03 · RF-RES-001, RF-TAR-004. Rol `RECEPCION`. Mismas reglas y
         *     cálculo que la web pública, y además cuántas habitaciones quedan de cada
         *     tipo en todo el rango (el mínimo entre las noches). Lista vacía si no hay
         *     disponibilidad.
         */
        get: operations["buscarDisponibilidadRecepcion"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/reservas": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Buscar reservas
         * @description HU-REC-06, HU-CM-02 · RF-RES-006, RF-RES-007, RF-CM-004. Rol `RECEPCION`.
         *     Filtros combinables. `desde`/`hasta` devuelven las reservas cuya estadía
         *     se cruza con ese rango. `rapido=LLEGAN_HOY`: `CONFIRMADA` con entrada hoy;
         *     `rapido=SALEN_HOY`: `EN_ESTADIA` con salida hoy ("hoy" en
         *     America/Guatemala). Paginada (la única lista paginada del API).
         */
        get: operations["buscarReservas"];
        put?: never;
        /**
         * Crear una reserva desde Recepción
         * @description HU-REC-04 · RF-RES-002, RF-RES-003, RF-PAG-007, RF-RES-010. Rol
         *     `RECEPCION`. El huésped se registra antes con POST /huespedes. Mismas
         *     reglas de HU-REC-03; la habitación es opcional (reglas de HU-REC-07).
         *     Revalida la disponibilidad al guardar. Nace `CONFIRMADA`, canal
         *     `RECEPCION`, con el recepcionista que la creó y la cuenta `ABIERTA` con el
         *     cargo por alojamiento, **sin pago** (se paga en el check-out). Envía el
         *     correo de confirmación.
         */
        post: operations["crearReservaRecepcion"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/reservas/calendario": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Datos del calendario Gantt
         * @description HU-REC-08 · RF-RES-012. Rol `RECEPCION`. Habitaciones agrupadas por tipo y
         *     las reservas activas o `FINALIZADA` (nunca `CANCELADA`) que se cruzan con
         *     el rango. Una reserva con `habitacionId: null` va en la fila
         *     "Sin asignar". Solo consulta; no es de tiempo real.
         */
        get: operations["obtenerCalendarioReservas"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/reservas/{codigo}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Detalle de una reserva
         * @description HU-REC-06 (criterio 5), HU-REC-02 (criterio 4), HU-CM-02 · RF-RES-006,
         *     RF-SEG-003. Rol `RECEPCION`. Incluye huésped, adicionales, canal,
         *     identificador externo e historial de estados. La web decide qué acciones
         *     mostrar según `estado` y `canal`.
         */
        get: operations["obtenerReserva"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/reservas/{codigo}/huespedes-adicionales": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Registrar un huésped adicional
         * @description HU-REC-02 · RF-HUE-002. Rol `RECEPCION`. Solo reservas `CONFIRMADA` o
         *     `EN_ESTADIA`. Principal + adicionales no puede superar el número de
         *     huéspedes de la reserva. Los adicionales no tienen acceso a la app.
         */
        post: operations["agregarHuespedAdicional"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/reservas/{codigo}/cancelacion": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Vista previa de la cancelación
         * @description HU-REC-05 (criterio 4) · RF-PAG-009. Rol `RECEPCION`. Dice qué pasará con
         *     el dinero, sin cambiar nada: `REEMBOLSO_TOTAL` si faltan 48 horas o más
         *     para las 15:00 del día de llegada (America/Guatemala) y hubo pago con
         *     Recurrente; `SIN_REEMBOLSO` si faltan menos; `SIN_PAGOS` si la reserva no
         *     tiene pagos. Incluye pagos históricos al calcular la vista previa; no ejecuta reembolsos.
         *     Responde 409 si la reserva no se puede cancelar.
         */
        get: operations["obtenerVistaPreviaCancelacion"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/reservas/{codigo}/cancelar": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Cancelar una reserva
         * @description HU-REC-05, HU-CM-02 (criterio 5) · RF-RES-005, RF-PAG-009. Rol
         *     `RECEPCION`. Solo `CONFIRMADA` y nunca de canal externo. Motivo
         *     obligatorio ("No se presentó" para quien no llega). Si corresponde, pide el
         *     reembolso total a Recurrente (pago `REEMBOLSADO`); si Recurrente lo rechaza, **no**
         *     cancela y responde 409 `REEMBOLSO_RECHAZADO`. Si corresponde reembolsar un pago
         *     histórico STRIPE, responde 409 `PAGO_LEGADO_REQUIERE_CONCILIACION` sin cancelar
         *     ni enviar ese pago a Recurrente. Al cancelar: reserva
         *     `CANCELADA`, cuenta `CERRADA`, habitación liberada e historial con el
         *     motivo. No se envía correo.
         */
        post: operations["cancelarReserva"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/reservas/{codigo}/habitacion": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /**
         * Asignar o cambiar la habitación
         * @description HU-REC-07 · RF-HAB-002, RF-RES-003. Rol `RECEPCION`. Solo reservas
         *     `PENDIENTE_PAGO` o `CONFIRMADA`. La habitación debe ser del mismo tipo, no
         *     estar `FUERA_DE_SERVICIO` ni tener otra reserva activa que se traslape (se
         *     revalida al guardar). No necesita estar `LIMPIA`. Las opciones salen de
         *     GET /habitaciones/disponibles.
         */
        put: operations["asignarHabitacion"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/reservas/{codigo}/check-in": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Realizar el check-in
         * @description HU-REC-12 · RF-REC-001. Rol `RECEPCION`. Solo reservas `CONFIRMADA` con hoy
         *     entre la fecha de entrada y el día anterior a la salida (America/Guatemala).
         *     Exige habitación asignada y `LIBRE` + `LIMPIA`. Reserva `EN_ESTADIA` y
         *     habitación `OCUPADA` en una sola operación. Los adicionales se agregan
         *     antes con POST /reservas/{codigo}/huespedes-adicionales. Sin cuerpo.
         */
        post: operations["hacerCheckIn"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/habitaciones": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Estado de las habitaciones
         * @description HU-REC-10 · RF-HAB-001, RF-HAB-003. Rol `RECEPCION`. Ocupación, condición
         *     e indicadores calculados con "hoy" en America/Guatemala. Para una
         *     habitación `FUERA_DE_SERVICIO` incluye, en solo lectura, la incidencia que
         *     la bloquea (P-02). Los cambios llegan en tiempo real por el WebSocket
         *     (`/topic/habitaciones`, parte 2). Lista vacía si nada cumple los filtros.
         */
        get: operations["listarEstadoHabitaciones"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/habitaciones/disponibles": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Habitaciones que se pueden asignar
         * @description HU-REC-07 (criterio 2), HU-REC-04 (criterio 2) · RF-HAB-002. Rol
         *     `RECEPCION`. Habitaciones activas del tipo indicado que no están
         *     `FUERA_DE_SERVICIO` y no tienen otra reserva activa que se traslape con
         *     las fechas. No exige que estén limpias. Lista vacía si no hay ninguna.
         */
        get: operations["listarHabitacionesAsignables"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/habitaciones/{id}/marcar-sucia": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Marcar una habitación libre como sucia
         * @description HU-REC-11 · RF-HAB-004. Rol `RECEPCION`. Solo `LIBRE` + `LIMPIA` →
         *     `SUCIA`; cualquier otro caso responde 409. Registra fecha, hora y
         *     responsable, y publica el cambio en tiempo real. Sin cuerpo.
         */
        post: operations["marcarHabitacionSucia"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/ws-ticket": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Crear ticket de WebSocket
         * @description HU-EMP-01
         *
         *     Ticket de un uso, vence en 60 segundos. Solo personal con contraseña definitiva; el BFF lo obtiene sin entregar el JWT al navegador.
         */
        post: operations["crearWsTicket"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/app/acceso/solicitar-codigo": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Solicitar código de acceso
         * @description HU-HUE-08
         *
         *     Siempre responde el mismo mensaje, incluso sin reservas o con bloqueo vigente. Solo encola codigo-acceso si corresponde. OTP con hash, 6 dígitos, 10 minutos; solicitar otro no reinicia intentos.
         */
        post: operations["solicitarCodigoHuesped"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/app/acceso/verificar-codigo": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Verificar código y emitir sesión
         * @description HU-HUE-08
         *
         *     Un solo uso. Cinco fallos bloquean 15 minutos; incorrecto, vencido, usado o bloqueado responde 401 con código estable y mensaje español. JWT HUESPED 15 minutos y refresh rotativo 7 días. Renovación por /auth/renovar.
         */
        post: operations["verificarCodigoHuesped"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/app/cerrar-sesion": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Cerrar sesión del huésped
         * @description HU-HUE-08 · HU-HUE-17
         *
         *     Revocar el refresh de esta sesión y eliminar los tokens push del huésped. Refresh ajeno no se revoca. La app borra sus tokens de SecureStore al cerrar sesión.
         */
        post: operations["cerrarSesionHuesped"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/app/reservas": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Listar mis reservas
         * @description HU-HUE-09
         *
         *     Todas las reservas del correo autenticado y de cualquier canal. Sin modificar ni cancelar; la app abre directamente una EN_ESTADIA si existe.
         */
        get: operations["listarReservasHuesped"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/app/reservas/{codigo}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Ver detalle de mi reserva
         * @description HU-HUE-09
         */
        get: operations["detalleReservaHuesped"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/app/reservas/{codigo}/menu": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Consultar menú de mi estadía
         * @description HU-HUE-10
         *
         *     Solo EN_ESTADIA; 409 fuera de estadía. Incluye AGOTADO sin permitir pedirlos.
         */
        get: operations["menuEstadia"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/app/reservas/{codigo}/pedidos": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Listar mis pedidos
         * @description HU-HUE-11
         *
         *     Pedidos de su reserva por fecha; permite consultar después del check-out. Recargar al reconectar STOMP.
         */
        get: operations["listarPedidosHuesped"];
        put?: never;
        /**
         * Crear pedido de Room Service
         * @description HU-HUE-10
         *
         *     Solo EN_ESTADIA y cuenta ABIERTA. Validar disponibilidad de todos los ítems, congelar precios, crear NUEVO. Si hay agotados, 409 identifica ítems en detalles. Cargo solo al entregar; publica evento 1 tras commit.
         */
        post: operations["crearPedidoHuesped"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/app/reservas/{codigo}/pedidos/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Consultar mi pedido
         * @description HU-HUE-11
         */
        get: operations["detallePedidoHuesped"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/app/reservas/{codigo}/articulos": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Consultar artículos solicitables
         * @description HU-HUE-13
         *
         *     Solo EN_ESTADIA. Catálogo y máximos de datos iniciales; no es inventario.
         */
        get: operations["catalogoArticulosEstadia"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/app/reservas/{codigo}/solicitudes": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Listar mis solicitudes
         * @description HU-HUE-14
         *
         *     Recargar al abrir y deslizar; sin STOMP en esta lista. Consulta propia después del check-out permite ver CANCELADA.
         */
        get: operations["listarSolicitudesHuesped"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/app/reservas/{codigo}/solicitudes/limpieza": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Solicitar limpieza
         * @description HU-HUE-12
         *
         *     Solo EN_ESTADIA. Una sola LIMPIEZA PENDIENTE o EN_PROCESO por habitación: 409 si existe. No cambia condición; evento 3 después del commit.
         */
        post: operations["solicitarLimpiezaHuesped"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/app/reservas/{codigo}/solicitudes/articulos": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Solicitar artículos
         * @description HU-HUE-13
         *
         *     Solo EN_ESTADIA. Validar máximos; no descuenta stock. Crear PENDIENTE y publicar evento 3 después del commit.
         */
        post: operations["solicitarArticulosHuesped"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/app/reservas/{codigo}/solicitudes/{id}/cancelar": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Cancelar mi solicitud pendiente
         * @description HU-HUE-14
         *
         *     Solo PENDIENTE; otro estado devuelve 409. Conserva registro e historial, sin eliminar.
         */
        post: operations["cancelarSolicitudHuesped"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/app/reservas/{codigo}/cuenta": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Ver mi cuenta
         * @description HU-HUE-15
         *
         *     Disponible en cualquier estado de reserva. Solo lectura; no es tiempo real, recargar al abrir o deslizar.
         */
        get: operations["consultarCuentaHuesped"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/app/reservas/{codigo}/checkout": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Consultar condiciones del check-out
         * @description HU-HUE-16
         *
         *     Consulta sin efectos: devuelve bloqueos y pedidos a cancelar. Ventana 00:00–12:00 del día de salida en America/Guatemala, EN_ESTADIA, sin pedido EN_CAMINO, saldo exactamente 0.
         */
        get: operations["consultarCheckoutApp"];
        put?: never;
        /**
         * Confirmar check-out desde la app
         * @description HU-HUE-16 · HU-HUE-17
         *
         *     Ventana de salida 00:00–12:00 Guatemala y EN_ESTADIA. Saldo exactamente 0, sin EN_CAMINO; consentimiento si hay NUEVO o EN_PREPARACION. Validar NIT/CF. En una transacción emitir factura, cerrar cuenta/reserva, liberar habitación a SUCIA o FUERA_DE_SERVICIO, cancelar pedidos/solicitudes pendientes, borrar push e historial. Si falla, rollback del cierre, conservar pagos ya aprobados y permitir reintento sin otro cobro.
         */
        post: operations["confirmarCheckoutApp"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/app/reservas/{codigo}/pago-saldo": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Iniciar pago del saldo con Recurrente
         * @description HU-HUE-16
         *
         *     Solo EN_ESTADIA en ventana 00:00–12:00 de salida y sin EN_CAMINO. Saldo positivo completo; si es 0 devuelve 204 sin crear sesión. No acepta monto ni tarjeta. Retorno a APP_URL_RETORNO con codigo; el retorno no acredita el pago. Reutiliza la sesión abierta. Si está pagada o en proceso devuelve 409 PAGO_EN_VERIFICACION.
         */
        post: operations["iniciarPagoSaldoApp"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/app/reservas/{codigo}/factura": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Consultar factura de mi reserva
         * @description HU-HUE-16
         *
         *     404 si aún no existe factura. Inmutable; el PDF se obtiene con /facturas/{id}/pdf.
         */
        get: operations["facturaReservaHuesped"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/app/dispositivos-push": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Registrar dispositivo push
         * @description HU-HUE-17
         *
         *     Token ligado al huésped autenticado. Mismo token propio: 200 con mismo id. Nunca aceptar un huespedId del cliente. Enviar solo EN_ESTADIA; eliminar al cerrar sesión o finalizar estadía. Rechazar un token vinculado a otro huésped sin apropiárselo.
         */
        post: operations["registrarDispositivoPush"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/app/dispositivos-push/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * Eliminar mi dispositivo push
         * @description HU-HUE-17
         */
        delete: operations["eliminarDispositivoPush"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/room-service/pedidos": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Consultar cola de pedidos activos
         * @description HU-RS-01
         *
         *     Solo NUEVO, EN_PREPARACION y EN_CAMINO, por antigüedad. Recargar al reconectar STOMP. No expone correo, teléfono, documento ni pagos.
         */
        get: operations["colaRoomService"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/room-service/pedidos/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Consultar detalle de pedido
         * @description HU-RS-02
         */
        get: operations["detallePedidoRoomService"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/room-service/pedidos/{id}/avanzar": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Avanzar al siguiente estado
         * @description HU-RS-03 · HU-RS-06
         *
         *     Comparar estadoEsperado; solo NUEVO→EN_PREPARACION→EN_CAMINO→ENTREGADO. Conflicto concurrente=409. ENTREGADO genera un solo cargo en cuenta abierta de EN_ESTADIA y push sin datos personales; evento 2 después del commit.
         */
        post: operations["avanzarPedido"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/room-service/pedidos/{id}/cancelar": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Cancelar pedido con motivo
         * @description HU-RS-04
         *
         *     Solo NUEVO, EN_PREPARACION o EN_CAMINO. Motivo obligatorio, sin cargo; historial y evento 2. Estado final inmutable.
         */
        post: operations["cancelarPedidoRoomService"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/room-service/menu": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Consultar menú operativo
         * @description HU-RS-05
         */
        get: operations["consultarMenuRoomService"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/room-service/menu/items/{id}/agotar": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Marcar ítem agotado
         * @description HU-RS-05
         *
         *     Solo DISPONIBLE→AGOTADO. Historial de fecha y empleado; no altera pedidos existentes. Solo ADMIN puede reactivar.
         */
        post: operations["agotarItemMenu"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/limpieza/habitaciones": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Consultar habitaciones pendientes
         * @description HU-MYL-01
         *
         *     Solo LIBRE + SUCIA/EN_LIMPIEZA; excluir FUERA_DE_SERVICIO y OCUPADA. Prioridad llegada hoy y antigüedad SUCIA.
         */
        get: operations["habitacionesPendientesLimpieza"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/limpieza/habitaciones/{id}/iniciar": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Iniciar limpieza
         * @description HU-MYL-02
         *
         *     LIBRE + SUCIA→EN_LIMPIEZA al empleado autenticado. Si otro inició, 409 indica quién. Historial y evento 4 después del commit.
         */
        post: operations["iniciarLimpiezaHabitacion"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/limpieza/habitaciones/{id}/interrumpir": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Interrumpir mi limpieza
         * @description HU-MYL-02
         *
         *     Solo EN_LIMPIEZA a su cargo→SUCIA; libera responsable. Historial y evento 4 después del commit.
         */
        post: operations["interrumpirLimpiezaHabitacion"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/limpieza/habitaciones/{id}/terminar": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Terminar mi limpieza
         * @description HU-MYL-03
         *
         *     Solo EN_LIMPIEZA a su cargo→LIMPIA. Sale de pendientes. Historial y evento 4 después del commit.
         */
        post: operations["terminarLimpiezaHabitacion"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/limpieza/solicitudes": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Consultar solicitudes activas
         * @description HU-MYL-04
         *
         *     PENDIENTE y EN_PROCESO, por antigüedad; sin datos personales del huésped. Recargar tras tomar/atender o conflicto.
         */
        get: operations["colaSolicitudesLimpieza"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/limpieza/solicitudes/{id}/tomar": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Tomar solicitud pendiente
         * @description HU-MYL-04
         *
         *     Solo PENDIENTE→EN_PROCESO a su nombre; tomada o cancelada=409. No cambia condición de habitación ni inventario.
         */
        post: operations["tomarSolicitudLimpieza"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/limpieza/solicitudes/{id}/atender": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Atender mi solicitud
         * @description HU-MYL-05
         *
         *     Solo EN_PROCESO a su cargo→ATENDIDA; CANCELADA=409. Sin descuento de inventario. Push Tu solicitud fue atendida solo EN_ESTADIA; no agrega evento STOMP de actualización de solicitud.
         */
        post: operations["atenderSolicitudLimpieza"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/incidencias": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Consultar incidencias
         * @description HU-MYL-07 · HU-ADM-10
         *
         *     ADMIN: por defecto activas primero y luego fecha reciente; filtros por estado, habitación y técnico. MYL MANTENIMIENTO/AMBAS: solo REPORTADA/EN_PROCESO por antigüedad; estado RESUELTA denegado para su cola. Sin tiempo real. Áreas solo limitan MYL, no ADMIN.
         */
        get: operations["listarIncidencias"];
        put?: never;
        /**
         * Reportar daño de habitación
         * @description HU-MYL-06 · HU-REC-17
         *
         *     MYL de cualquier área puede reportar, igual que RECEPCION. REPORTADA; si impide uso y LIBRE→FUERA_DE_SERVICIO, si OCUPADA solo indicador pendiente. Historial/evento 4 cuando cambia habitación; foto opcional privada.
         */
        post: operations["reportarIncidencia"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/incidencias/habitaciones": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Catálogo mínimo de habitaciones para reportes de incidencias
         * @description HU-MYL-06 · HU-REC-17.
         *     Catálogo mínimo de habitaciones operativas activas (id, número, piso) para reportar incidencias desde Recepción o Mantenimiento y Limpieza de cualquier área.
         */
        get: operations["listarHabitacionesIncidencias"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/incidencias/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Consultar detalle de incidencia
         * @description HU-MYL-07 · HU-ADM-10
         *
         *     ADMIN solo lectura; MYL MANTENIMIENTO/AMBAS consulta. Recepción solo consulta la incidencia bloqueante embebida en /habitaciones, no este detalle general.
         */
        get: operations["detalleIncidencia"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/incidencias/{id}/tomar": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Tomar incidencia reportada
         * @description HU-MYL-07
         *
         *     REPORTADA→EN_PROCESO al técnico autenticado. Si otro tomó, 409. Sin asignación por ADMIN.
         */
        post: operations["tomarIncidencia"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/incidencias/{id}/resolver": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Resolver mi incidencia
         * @description HU-MYL-08
         *
         *     Solo EN_PROCESO a su cargo→RESUELTA. Solución obligatoria. Si última que impide uso, FUERA_DE_SERVICIO→SUCIA o quitar indicador en OCUPADA. Historial/evento 4 si cambia habitación. No cancelación ni reasignación.
         */
        post: operations["resolverIncidencia"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/cuentas/{codigo}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Consultar cuenta de reserva
         * @description HU-REC-13
         *
         *     Cualquier estado de reserva; cargos, pagos, saldo y noches. Cuenta no es tiempo real.
         */
        get: operations["consultarCuentaRecepcion"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/cuentas/{codigo}/cargos": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Agregar cargo de servicio
         * @description HU-REC-13
         *
         *     Solo reserva EN_ESTADIA y cuenta ABIERTA. Cantidad y precio>0, total calculado; responsable del JWT.
         */
        post: operations["agregarCargoServicio"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/cuentas/{codigo}/cargos/{id}/anular": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Anular cargo adicional
         * @description HU-REC-13
         *
         *     Solo cuenta ABIERTA y cargo VIGENTE adicional; alojamiento no anulable. No exige EN_ESTADIA. Motivo/fecha/responsable; no elimina.
         */
        post: operations["anularCargoAdicional"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/checkout/{codigo}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Consultar condiciones de check-out
         * @description HU-REC-14
         *
         *     No limita fecha de salida. EN_ESTADIA, sin EN_CAMINO; informar saldo, nombre sugerido y pedidos que se cancelarán. Consulta sin efectos.
         */
        get: operations["consultarCheckoutRecepcion"];
        put?: never;
        /**
         * Confirmar check-out en Recepción
         * @description HU-REC-14 · HU-REC-15
         *
         *     Solo EN_ESTADIA, sin EN_CAMINO, sin límite horario. Si saldo>0, exigir pago EFECTIVO/TARJETA/OTRO por total calculado; si 0, no registrar pago; saldo negativo=409. Validar NIT/CF. Pago, factura, FINALIZADA/CERRADA, liberación SUCIA o FUERA_DE_SERVICIO, cancelación de pendientes, borrado push e historial en UNA transacción. Fallo de factura revierte también pago de Recepción; pagos anteriores se conservan. Correo por Outbox y evento 4 después del commit.
         */
        post: operations["confirmarCheckoutRecepcion"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/facturas/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Consultar detalle de factura
         * @description HU-REC-15 · HU-REC-16 · HU-HUE-16
         *
         *     RECEPCION consulta; HUESPED solo su factura, ajena=404. Sin POST para emitir, PUT para modificar ni anulación. Impresión 80 mm/carta desde HTML de la web, sin endpoint de impresión ni estado COPIA.
         */
        get: operations["consultarFactura"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/facturas/{id}/pdf": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Obtener enlace temporal al PDF
         * @description HU-REC-15 · HU-HUE-16
         *
         *     Tras comprobar acceso, devuelve URL firmada temporal de MinIO privado. No expone clave del bucket ni credenciales. Consultar de nuevo si venció el enlace.
         */
        get: operations["descargarFactura"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/archivos/imagenes": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Subir imagen autorizada
         * @description HU-ADM-03 · HU-ADM-05 · HU-ADM-08 · HU-ADM-11 · HU-REC-17 · HU-MYL-06
         *
         *     JPG/PNG hasta 5 MiB por archivo; validar contenido real. ADMIN: HOTEL/TIPO_HABITACION/MENU y AMENIDAD solo Nivel 2. RECEPCION o MYL de cualquier área: únicamente INCIDENCIA. Validar uso y asociación al recurso; fotos de incidencias privadas, fotos de catálogos públicas. No carga de PDF ni documentos de identidad.
         */
        post: operations["subirImagen"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/empleados": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Listar empleados
         * @description HU-ADM-02
         */
        get: operations["listarEmpleadosAdmin"];
        put?: never;
        /**
         * Crear empleado
         * @description HU-ADM-01
         *
         *     Correo único. Área solo MYL. ACTIVO y contraseña temporal con hash, mostrada una vez; sin correo.
         */
        post: operations["crearEmpleadoAdmin"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/empleados/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * Editar empleado
         * @description HU-ADM-02
         *
         *     Editar nombre, teléfono, rol y área; no correo. No cambiar su propio rol. Nunca borrar empleados.
         */
        patch: operations["editarEmpleadoAdmin"];
        trace?: never;
    };
    "/api/v1/admin/empleados/{id}/estado": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * Activar o desactivar empleado
         * @description HU-ADM-02
         *
         *     No desactivarse a sí mismo. INACTIVO no inicia ni renueva; revocar refresh. JWT vigente sigue hasta 15 minutos; sin revisar estado en cada acción.
         */
        patch: operations["estadoEmpleadoAdmin"];
        trace?: never;
    };
    "/api/v1/admin/empleados/{id}/restablecer-contrasena": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Restablecer contraseña temporal
         * @description HU-ADM-02
         *
         *     Visible solo una vez; anterior deja de funcionar y debe cambiarla en siguiente acceso.
         */
        post: operations["restablecerContrasenaAdmin"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/tipos-habitacion": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Listar tipos de habitación
         * @description HU-ADM-03
         */
        get: operations["listarTiposAdmin"];
        put?: never;
        /**
         * Crear tipo de habitación
         * @description HU-ADM-03
         */
        post: operations["crearTipoAdmin"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/tipos-habitacion/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Consultar tipo de habitación
         * @description HU-ADM-03
         */
        get: operations["detalleTipoAdmin"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * Editar tipo de habitación
         * @description HU-ADM-03
         *
         *     Precio>0, capacidad>=1, nombre único; solo afecta reservas nuevas.
         */
        patch: operations["editarTipoAdmin"];
        trace?: never;
    };
    "/api/v1/admin/tipos-habitacion/{id}/estado": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * Activar o desactivar tipo
         * @description HU-ADM-03
         *
         *     INACTIVO deja de mostrarse y no recibe reservas nuevas; conserva existentes.
         */
        patch: operations["estadoTipoAdmin"];
        trace?: never;
    };
    "/api/v1/admin/tipos-habitacion/{id}/fotos": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /**
         * Actualizar fotos y principal del tipo
         * @description HU-ADM-03
         *
         *     JPG/PNG cargadas antes con /archivos/imagenes; exactamente una principal. Validar claves y uso TIPO_HABITACION.
         */
        put: operations["actualizarFotosTipoAdmin"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/tipos-habitacion/{id}/ajuste-fin-semana": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * Configurar ajuste de fin de semana
         * @description HU-ADM-07
         *
         *     Mayor que −100 %, por defecto 0; viernes y sábado. PrecioNoche=base×(1+temporada/100)×(1+finSemana/100), redondear 2 decimales. Solo reservas nuevas.
         */
        patch: operations["ajusteFinSemanaAdmin"];
        trace?: never;
    };
    "/api/v1/admin/habitaciones": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Listar catálogo de habitaciones
         * @description HU-ADM-04
         */
        get: operations["listarHabitacionesAdmin"];
        put?: never;
        /**
         * Crear habitación
         * @description HU-ADM-04
         *
         *     Número único y tipo activo. Nace LIBRE + LIMPIA y suma al cupo.
         */
        post: operations["crearHabitacionAdmin"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/habitaciones/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * Editar habitación
         * @description HU-ADM-04
         *
         *     Tipo solo sin reservas activas asignadas; no permite cambiar ocupación/condición manualmente.
         */
        patch: operations["editarHabitacionAdmin"];
        trace?: never;
    };
    "/api/v1/admin/habitaciones/{id}/estado": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * Activar o desactivar habitación
         * @description HU-ADM-04
         *
         *     Desactivar solo no OCUPADA y sin reservas activas asignadas. Inactiva no suma al cupo ni es asignable.
         */
        patch: operations["estadoHabitacionAdmin"];
        trace?: never;
    };
    "/api/v1/admin/menu/categorias": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Listar categorías de menú
         * @description HU-ADM-05
         */
        get: operations["listarCategoriasAdmin"];
        put?: never;
        /**
         * Crear categoría de menú
         * @description HU-ADM-05
         */
        post: operations["crearCategoriaAdmin"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/menu/categorias/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * Editar categoría de menú
         * @description HU-ADM-05
         */
        patch: operations["editarCategoriaAdmin"];
        trace?: never;
    };
    "/api/v1/admin/menu/items": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Listar ítems del menú
         * @description HU-ADM-05
         */
        get: operations["listarItemsAdmin"];
        put?: never;
        /**
         * Crear ítem del menú
         * @description HU-ADM-05
         *
         *     Precio>0; foto opcional; nace ACTIVO y DISPONIBLE.
         */
        post: operations["crearItemAdmin"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/menu/items/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * Editar ítem del menú
         * @description HU-ADM-05
         *
         *     No afecta precio congelado de pedidos. El cambio de disponibilidad tiene acción propia.
         */
        patch: operations["editarItemAdmin"];
        trace?: never;
    };
    "/api/v1/admin/menu/items/{id}/estado": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * Activar o desactivar ítem
         * @description HU-ADM-05
         *
         *     La activación es distinta de DISPONIBLE/AGOTADO. INACTIVO deja de aparecer en menú.
         */
        patch: operations["estadoItemAdmin"];
        trace?: never;
    };
    "/api/v1/admin/menu/items/{id}/reactivar": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Reactivar ítem agotado
         * @description HU-ADM-05
         *
         *     Solo ADMIN: AGOTADO→DISPONIBLE. Room Service solo puede agotar.
         */
        post: operations["reactivarItemAdmin"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/temporadas": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Listar temporadas
         * @description HU-ADM-06
         */
        get: operations["listarTemporadasAdmin"];
        put?: never;
        /**
         * Crear temporada
         * @description HU-ADM-06
         *
         *     Fin>=inicio, ajuste>−100 %, sin traslapes por tipo; 409 identifica temporada en conflicto.
         */
        post: operations["crearTemporadaAdmin"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/temporadas/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /**
         * Reemplazar temporada
         * @description HU-ADM-06
         *
         *     Revalidar traslapes por tipo; reservas existentes conservan precios.
         */
        put: operations["editarTemporadaAdmin"];
        post?: never;
        /**
         * Eliminar temporada
         * @description HU-ADM-06
         *
         *     Solo afecta cálculos de reservas nuevas; las existentes conservan precios.
         */
        delete: operations["eliminarTemporadaAdmin"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/hotel": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Consultar datos generales y fiscales
         * @description HU-ADM-08. Devuelve 404 HOTEL_NO_CONFIGURADO si falta la configuración.
         */
        get: operations["consultarHotelAdmin"];
        /**
         * Actualizar datos del hotel
         * @description HU-ADM-08
         *
         *     Todos los datos fiscales obligatorios, validar NIT. No modificar serie/correlativo ni horarios fijos 15:00/12:00. Política generada de 48 h antes de 15:00 llegada; no editable. No altera facturas anteriores. Omitir fotos conserva la galería sin exigir If-Match. Si se envía una lista distinta, requiere revisión vigente; nunca se aplica parcialmente un cambio conflictivo. Solo actualiza una configuración existente; si falta responde 404 HOTEL_NO_CONFIGURADO.
         */
        put: operations["editarHotelAdmin"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/hotel/inicializacion": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Inicializar el hotel sin sobrescribir una configuración existente
         * @description HU-ADM-08. Inicialización atómica por ADMIN. Crea únicamente hotel_configuration.id=1. No altera fotografías, facturas ni series/correlativos. Idempotencia natural por los nueve campos normalizados: 201 al crear, 200 sin cambios si coinciden con la configuración actual, 409 HOTEL_YA_CONFIGURADO si difieren. No requiere Idempotency-Key; un reenvío después de editar la configuración puede devolver 409. No reinicia ni sustituye datos existentes.
         */
        post: operations["inicializarHotelAdmin"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/indicadores": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Consultar indicadores básicos
         * @description HU-ADM-09
         *
         *     Tres tarjetas: ocupación de hoy, ingresos APROBADO y reservas por canal. Rango opcional, mes actual por defecto; validar inicio<=fin. Sin datos=0.
         */
        get: operations["indicadoresAdmin"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/canal-simulado/reservas": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Enviar reserva por canal simulado
         * @description HU-CM-03
         *
         *     Invoca API REAL del canal. Claves solo en servidor; elegir BOOKING/EXPEDIA y reenviar identificador. Respuesta muestra HTTP real y cuerpo; otros roles=403.
         */
        post: operations["enviarReservaCanalSimulado"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/app/amenidades": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Consultar amenidades activas
         * @description HU-HUE-18
         *
         *     Cualquier huésped con sesión, sin exigir EN_ESTADIA; solo ACTIVO, ordenadas por orden.
         */
        get: operations["amenidadesHuesped"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/app/wifi": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Consultar Wi-Fi de huéspedes
         * @description HU-HUE-18
         *
         *     Cualquier huésped con sesión, sin exigir EN_ESTADIA.
         */
        get: operations["wifiHuesped"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/amenidades": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Listar amenidades
         * @description HU-ADM-11
         */
        get: operations["listarAmenidadesAdmin"];
        put?: never;
        /**
         * Crear amenidad
         * @description HU-ADM-11
         */
        post: operations["crearAmenidadAdmin"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/amenidades/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * Editar amenidad
         * @description HU-ADM-11
         */
        patch: operations["editarAmenidadAdmin"];
        trace?: never;
    };
    "/api/v1/admin/amenidades/{id}/estado": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * Activar o desactivar amenidad
         * @description HU-ADM-11
         */
        patch: operations["estadoAmenidadAdmin"];
        trace?: never;
    };
    "/api/v1/admin/wifi": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Consultar configuración Wi-Fi
         * @description HU-ADM-11
         */
        get: operations["consultarWifiAdmin"];
        /**
         * Configurar Wi-Fi para huéspedes
         * @description HU-ADM-11
         */
        put: operations["configurarWifiAdmin"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/turnos": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Listar turnos
         * @description HU-ADM-12
         */
        get: operations["listarTurnosAdmin"];
        put?: never;
        /**
         * Crear turno
         * @description HU-ADM-12
         */
        post: operations["crearTurnoAdmin"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/turnos/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * Editar turno
         * @description HU-ADM-12
         */
        patch: operations["editarTurnoAdmin"];
        trace?: never;
    };
    "/api/v1/admin/turnos/{id}/desactivar": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Desactivar turno
         * @description HU-ADM-12
         *
         *     ACTIVO→INACTIVO. Turnos informativos; no cambian permisos de acceso.
         */
        post: operations["desactivarTurnoAdmin"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/asignaciones-turnos": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Consultar vista semanal de turnos
         * @description HU-ADM-12
         *
         *     Fechas de la semana elegida; inicio<=fin.
         */
        get: operations["listarAsignacionesTurnosAdmin"];
        put?: never;
        /**
         * Asignar turnos por fechas
         * @description HU-ADM-12
         *
         *     Empleado ACTIVO no ADMIN, turno ACTIVO; validar traslapes incluso cruzando medianoche. Operación atómica para todas las fechas.
         */
        post: operations["asignarTurnosAdmin"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/asignaciones-turnos/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * Quitar asignación de turno
         * @description HU-ADM-12
         */
        delete: operations["quitarAsignacionTurnoAdmin"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/gestion/insumos": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Consultar insumos
         * @description GET permite ADMIN o MANTENIMIENTO_LIMPIEZA con área MANTENIMIENTO o AMBAS; POST solo ADMIN. No hay filtros de servidor: la web calcula stock bajo y filtra en memoria. POST permite crear o actualizar con la versión actual, enviando todos los datos requeridos.
         */
        get: operations["listarInsumoGestion"];
        put?: never;
        /**
         * Registrar insumos
         * @description GET permite ADMIN o MANTENIMIENTO_LIMPIEZA con área MANTENIMIENTO o AMBAS; POST solo ADMIN. No hay filtros de servidor: la web calcula stock bajo y filtra en memoria. POST permite crear o actualizar con la versión actual, enviando todos los datos requeridos. UUID generado por el cliente. Un reenvío con el mismo id, version=0 y datos de creación idénticos devuelve el registro sin repetir sus efectos. Reutilizar el id con otros datos y version=0 devuelve 409 VERSION_CAMBIADA. Una versión distinta de la actual devuelve 409 VERSION_CAMBIADA.
         */
        post: operations["guardarInsumoGestion"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/gestion/compras": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Consultar compras
         * @description Solo ADMIN. Compras y repuestos de órdenes comparten las existencias de insumos. Las compras no se sobrescriben: intentarlo con la versión actual devuelve 400 DATOS_INVALIDOS.
         */
        get: operations["listarCompraInventarioGestion"];
        put?: never;
        /**
         * Registrar compras
         * @description Solo ADMIN. Compras y repuestos de órdenes comparten las existencias de insumos. Las compras no se sobrescriben: intentarlo con la versión actual devuelve 400 DATOS_INVALIDOS. UUID generado por el cliente. Un reenvío con el mismo id, version=0 y datos de creación idénticos devuelve el registro sin repetir sus efectos. Reutilizar el id con otros datos y version=0 devuelve 409 VERSION_CAMBIADA. Una versión distinta de la actual devuelve 409 VERSION_CAMBIADA.
         */
        post: operations["guardarCompraInventarioGestion"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/gestion/movimientos": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Consultar movimientos de inventario
         * @description Solo ADMIN. Lista todos los movimientos manuales por creado_en e id, sin filtros ni paginación; la web relaciona por insumoId y ordena por fecha. Los movimientos son inmutables: intentar modificarlos con la versión actual devuelve 400 DATOS_INVALIDOS. Salida o merma sin existencias suficientes devuelve 409 STOCK_INSUFICIENTE. Movimiento, stock y auditoría se escriben en una transacción, con bloqueos compartidos con compras y repuestos.
         */
        get: operations["listarMovimientoInventarioGestion"];
        put?: never;
        /**
         * Registrar movimientos de inventario
         * @description Solo ADMIN. Lista todos los movimientos manuales por creado_en e id, sin filtros ni paginación; la web relaciona por insumoId y ordena por fecha. Los movimientos son inmutables: intentar modificarlos con la versión actual devuelve 400 DATOS_INVALIDOS. Salida o merma sin existencias suficientes devuelve 409 STOCK_INSUFICIENTE. Movimiento, stock y auditoría se escriben en una transacción, con bloqueos compartidos con compras y repuestos. UUID generado por el cliente. Un reenvío con el mismo id, version=0 y datos de creación idénticos devuelve el registro sin repetir sus efectos. Reutilizar el id con otros datos y version=0 devuelve 409 VERSION_CAMBIADA. Una versión distinta de la actual devuelve 409 VERSION_CAMBIADA.
         */
        post: operations["guardarMovimientoInventarioGestion"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/publico/reservas/intento": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Recuperar una reserva por su intento de creación
         * @description Consulta sin crear reservas, consumir comprobantes ni repetir el cuerpo original.
         *     Requiere clave, borrador y comprobante vigente del correo del intento original.
         *     Se acepta renovar la verificación del mismo correo y borrador; conocer solo la
         *     clave o el correo no autoriza la consulta. RESERVA y OFERTA son alcances separados.
         *     Devuelve el código y estado actual, sin datos personales ni la respuesta inicial.
         *     Un intento en otra transacción devuelve 409 SOLICITUD_EN_PROCESO sin esperar.
         *     Un 404 puede significar intento sin resultado, credenciales incorrectas/vencidas
         *     o intento histórico sin vínculo de verificación; nunca autoriza generar otra clave.
         *     Se debe conservar la clave y consultar de nuevo o reenviar el POST original con
         *     la misma clave y datos. La consulta no identifica una operación en tránsito que
         *     todavía no haya llegado al API. Los intentos históricos mantienen el replay previo.
         *     Límite 60 consultas por minuto e IP; 429 con Retry-After. Cache-Control no-store.
         */
        get: operations["consultarIntentoReserva"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/app/reservas/{codigo}/pago-saldo/estado": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Consultar el checkout y la acción de pago del saldo
         * @description Solo el huésped titular; reserva ajena responde 404. Consulta sin crear sesiones
         *     ni acreditar pagos. La acción de cobro requiere EN_ESTADIA, saldo positivo,
         *     ventana 00:00 inclusive a 12:00 exclusiva del día de salida en America/Guatemala
         *     y ningún pedido EN_CAMINO. Respeta la expiración de la sesión y el límite de salida.
         *     Un pago aprobado anterior no impide pagar nuevos cargos; con saldo positivo se
         *     considera que aún no hay checkout para ese nuevo saldo. Saldo cero: NINGUNA.
         *     Una pasarela inaccesible produce NO_VERIFICADO y no permite reintentar.
         *     La misma semántica de estados y acciones del proceso público; sin datos de tarjeta
         *     ni identificadores internos del proveedor. Cache-Control no-store.
         */
        get: operations["consultarProcesoPagoSaldoApp"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/ofertas": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Consultar ofertas publicadas y borradores
         * @description Conserva snapshots y precios de reservas existentes. Los borradores no aparecen en consultas públicas ni se pueden reservar. bookable continúa indicando elegibilidad general, no publicación ni disponibilidad por fechas. Las vinculaciones son atómicas y las cantidades se derivan de registros; no se duplican tarjetas por unidad. Las escrituras dejan auditoría administrativa. Una oferta ajena al tipo, piso o atributos de sus unidades se rechaza sin guardar parcialmente.
         */
        get: operations["listarOfertasAdmin"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/ofertas/{slug}": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                slug: string;
            };
            cookie?: never;
        };
        /**
         * Consultar oferta y cantidades derivadas
         * @description Conserva snapshots y precios de reservas existentes. Los borradores no aparecen en consultas públicas ni se pueden reservar. bookable continúa indicando elegibilidad general, no publicación ni disponibilidad por fechas. Las vinculaciones son atómicas y las cantidades se derivan de registros; no se duplican tarjetas por unidad. Las escrituras dejan auditoría administrativa. Una oferta ajena al tipo, piso o atributos de sus unidades se rechaza sin guardar parcialmente.
         */
        get: operations["detalleOfertaAdmin"];
        /**
         * Reemplazar contenido publicación precio y vínculos de oferta
         * @description Conserva snapshots y precios de reservas existentes. Los borradores no aparecen en consultas públicas ni se pueden reservar. bookable continúa indicando elegibilidad general, no publicación ni disponibilidad por fechas. Las vinculaciones son atómicas y las cantidades se derivan de registros; no se duplican tarjetas por unidad. Las escrituras dejan auditoría administrativa. Una oferta ajena al tipo, piso o atributos de sus unidades se rechaza sin guardar parcialmente.
         */
        put: operations["actualizarOfertaAdmin"];
        /**
         * Crear oferta con slug inmutable
         * @description Conserva snapshots y precios de reservas existentes. Los borradores no aparecen en consultas públicas ni se pueden reservar. bookable continúa indicando elegibilidad general, no publicación ni disponibilidad por fechas. Las vinculaciones son atómicas y las cantidades se derivan de registros; no se duplican tarjetas por unidad. Las escrituras dejan auditoría administrativa. Una oferta ajena al tipo, piso o atributos de sus unidades se rechaza sin guardar parcialmente.
         */
        post: operations["crearOfertaAdmin"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/habitaciones/{id}/caracteristicas": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: components["schemas"]["Id"];
            };
            cookie?: never;
        };
        /**
         * Consultar características físicas registradas
         * @description No modifica piso ni tipo. El registro conserva procedencia administrativa. Rechaza cambios de características con reservas activas asignadas (409 RESERVAS_ACTIVAS).
         */
        get: operations["consultarCaracteristicasHabitacionAdmin"];
        /**
         * Registrar características físicas sin afectar reservas activas
         * @description No modifica piso ni tipo. El registro conserva procedencia administrativa. Rechaza cambios de características con reservas activas asignadas (409 RESERVAS_ACTIVAS).
         */
        put: operations["guardarCaracteristicasHabitacionAdmin"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/ofertas/{slug}/publicacion": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                slug: string;
            };
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * Publicar o despublicar sin reemplazar contenido ni vínculos
         * @description ADMIN puede despublicar una oferta anterior aunque su contenido requiera revisión. Para publicar exige tipo activo, galería y al menos una unidad activa acreditada. Conserva vínculos, historial y precios de reservas; deja auditoría administrativa.
         */
        patch: operations["cambiarPublicacionOfertaAdmin"];
        trace?: never;
    };
    "/api/v1/admin/hotel/editorial/{idioma}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Consultar borrador editorial
         * @description ADMIN. Hotel configurado. 409 CONTENIDO_CAMBIADO conserva borrador y publicación anteriores. Guardar no publica. Publicar exige revisión vigente y persiste versión inmutable; repetir esa publicación es idempotente.
         */
        get: operations["consultarBorradorEditorial"];
        /**
         * Guardar borrador editorial
         * @description ADMIN. Hotel configurado. 409 CONTENIDO_CAMBIADO conserva borrador y publicación anteriores. Guardar no publica. Publicar exige revisión vigente y persiste versión inmutable; repetir esa publicación es idempotente.
         */
        put: operations["guardarBorradorEditorial"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/hotel/editorial/{idioma}/publicacion": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Publicar borrador editorial
         * @description ADMIN. Hotel configurado. 409 CONTENIDO_CAMBIADO conserva borrador y publicación anteriores. Guardar no publica. Publicar exige revisión vigente y persiste versión inmutable; repetir esa publicación es idempotente.
         */
        post: operations["publicarEditorial"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/publico/hotel/editorial/{idioma}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Consultar contenido editorial publicado
         * @description Solo versión publicada. 404 CONTENIDO_NO_PUBLICADO si no existe; nunca devuelve borrador ni traduce otro idioma.
         */
        get: operations["consultarEditorialPublicado"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/experiencias": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * experienciasAdmin
         * @description Requiere ADMIN. Las reservas ajenas responden 404; conflictos de revisión, cupo, política, estado o clave reutilizada responden 409.
         */
        get: operations["experienciasAdmin"];
        put?: never;
        /**
         * crearExperiencia
         * @description Requiere ADMIN. Las reservas ajenas responden 404; conflictos de revisión, cupo, política, estado o clave reutilizada responden 409.
         */
        post: operations["crearExperiencia"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/experiencias/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /**
         * editarExperiencia
         * @description Requiere ADMIN. Las reservas ajenas responden 404; conflictos de revisión, cupo, política, estado o clave reutilizada responden 409.
         */
        put: operations["editarExperiencia"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/experiencias/{id}/horarios": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * horariosExperienciaAdmin
         * @description Requiere ADMIN. Las reservas ajenas responden 404; conflictos de revisión, cupo, política, estado o clave reutilizada responden 409.
         */
        get: operations["horariosExperienciaAdmin"];
        put?: never;
        /**
         * crearHorarioExperiencia
         * @description Requiere ADMIN. Las reservas ajenas responden 404; conflictos de revisión, cupo, política, estado o clave reutilizada responden 409.
         */
        post: operations["crearHorarioExperiencia"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/experiencias/{id}/horarios/{horarioId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /**
         * editarHorarioExperiencia
         * @description Requiere ADMIN. Las reservas ajenas responden 404; conflictos de revisión, cupo, política, estado o clave reutilizada responden 409.
         */
        put: operations["editarHorarioExperiencia"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/app/reservas/{codigo}/experiencias": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * experienciasHuesped
         * @description Requiere HUESPED. Las reservas ajenas responden 404; conflictos de revisión, cupo, política, estado o clave reutilizada responden 409.
         */
        get: operations["experienciasHuesped"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/app/reservas/{codigo}/experiencias/{id}/disponibilidad": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * disponibilidadExperiencia
         * @description Requiere HUESPED. Las reservas ajenas responden 404; conflictos de revisión, cupo, política, estado o clave reutilizada responden 409.
         */
        get: operations["disponibilidadExperiencia"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/app/reservas/{codigo}/experiencias/reservas": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * misReservasExperiencias
         * @description Requiere HUESPED. Las reservas ajenas responden 404; conflictos de revisión, cupo, política, estado o clave reutilizada responden 409.
         */
        get: operations["misReservasExperiencias"];
        put?: never;
        /**
         * reservarExperiencia
         * @description Requiere HUESPED. Las reservas ajenas responden 404; conflictos de revisión, cupo, política, estado o clave reutilizada responden 409.
         */
        post: operations["reservarExperiencia"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/app/reservas/{codigo}/experiencias/reservas/{id}/cancelar": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * cancelarExperiencia
         * @description Requiere HUESPED. Las reservas ajenas responden 404; conflictos de revisión, cupo, política, estado o clave reutilizada responden 409.
         */
        post: operations["cancelarExperiencia"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/app/reservas/{codigo}/experiencias/{id}/consultas": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * consultarExperiencia
         * @description Requiere HUESPED. Las reservas ajenas responden 404; conflictos de revisión, cupo, política, estado o clave reutilizada responden 409.
         */
        post: operations["consultarExperiencia"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/app/reservas/{codigo}/experiencias/consultas": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * misConsultasExperiencias
         * @description Requiere HUESPED. Las reservas ajenas responden 404; conflictos de revisión, cupo, política, estado o clave reutilizada responden 409.
         */
        get: operations["misConsultasExperiencias"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/experiencias/reservas": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * reservasExperienciasRecepcion
         * @description Requiere RECEPCION. Las reservas ajenas responden 404; conflictos de revisión, cupo, política, estado o clave reutilizada responden 409.
         */
        get: operations["reservasExperienciasRecepcion"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/experiencias/reservas/{id}/decision": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * decidirReservaExperiencia
         * @description Requiere RECEPCION. Las reservas ajenas responden 404; conflictos de revisión, cupo, política, estado o clave reutilizada responden 409.
         */
        post: operations["decidirReservaExperiencia"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/experiencias/consultas": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * consultasExperienciasRecepcion
         * @description Requiere RECEPCION. Las reservas ajenas responden 404; conflictos de revisión, cupo, política, estado o clave reutilizada responden 409.
         */
        get: operations["consultasExperienciasRecepcion"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/experiencias/consultas/{id}/respuesta": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * responderConsultaExperiencia
         * @description Requiere RECEPCION. Las reservas ajenas responden 404; conflictos de revisión, cupo, política, estado o clave reutilizada responden 409.
         */
        post: operations["responderConsultaExperiencia"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        /** @description Extensión 1:1 de una amenidad existente: nombre, descripción, fotografía y estado provienen de hotel_amenities. Precio y políticas son configuración explícita; no hay valores comerciales de ejemplo. ANTICIPADO solo permite consultas, nunca confirma sin pago. */
        Experiencia: {
            /** Format: int64 */
            id: number;
            /** Format: int64 */
            amenidadId: number;
            nombre: string;
            descripcion: string;
            categoria: string;
            fotoUrl?: string;
            activa: boolean;
            /** @enum {string} */
            modalidad: "INMEDIATA" | "APROBACION" | "COORDINACION";
            /** @enum {string} */
            tarifa: "GRATUITA" | "POR_PERSONA" | "POR_RESERVA";
            precio: number;
            /** @enum {string} */
            cobro: "SIN_CARGO" | "CUENTA" | "ANTICIPADO";
            duracionMinutos: number;
            requiereEstadia: boolean;
            cancelable: boolean;
            antelacionCancelacionMinutos: number;
            /** Format: int64 */
            version: number;
        };
        ConfigExperiencia: {
            /** Format: int64 */
            amenidadId: number;
            categoria: string;
            activa: boolean;
            /** @enum {string} */
            modalidad: "INMEDIATA" | "APROBACION" | "COORDINACION";
            /** @enum {string} */
            tarifa: "GRATUITA" | "POR_PERSONA" | "POR_RESERVA";
            precio: number;
            /** @enum {string} */
            cobro: "SIN_CARGO" | "CUENTA" | "ANTICIPADO";
            duracionMinutos: number;
            requiereEstadia: boolean;
            cancelable: boolean;
            antelacionCancelacionMinutos: number;
            /** Format: int64 */
            version: number;
        };
        HorarioExperiencia: {
            /** Format: int64 */
            id: number;
            /** Format: int64 */
            experienciaId: number;
            /** Format: date-time */
            inicio: string;
            /** Format: date-time */
            fin: string;
            capacidad: number;
            disponibles: number;
            activo: boolean;
            /** Format: int64 */
            version: number;
        };
        ConfigHorarioExperiencia: {
            /** Format: date-time */
            inicio: string;
            capacidad: number;
            activo: boolean;
            /** Format: int64 */
            version: number;
        };
        /** @description Reserva persistente distinta del alojamiento. PENDIENTE y CONFIRMADA consumen cupos. Precio y política de cancelación se fijan al crearla. Cargo único solo al confirmar con cobro CUENTA, reserva EN_ESTADIA y cuenta abierta; cancelación permitida anula el mismo cargo en la misma transacción. Nunca borra archivos. Los campos del huésped/habitación se incluyen solo para Recepción. */
        ReservaExperiencia: {
            /** Format: int64 */
            id: number;
            referencia: string;
            codigoReserva: string;
            /** Format: int64 */
            experienciaId: number;
            nombre: string;
            categoria: string;
            fotoUrl?: string;
            /** Format: int64 */
            horarioId: number;
            /** Format: date-time */
            inicio: string;
            /** Format: date-time */
            fin: string;
            personas: number;
            total: number;
            /** @enum {string} */
            moneda: "GTQ";
            /** @enum {string} */
            estado: "PENDIENTE" | "CONFIRMADA" | "RECHAZADA" | "CANCELADA";
            motivo?: string;
            /** Format: int64 */
            version: number;
            /** Format: int64 */
            cargoId?: number;
            nombreHuesped?: string;
            habitacion?: string;
            cancelable: boolean;
        };
        CrearReservaExperiencia: {
            /** Format: uuid */
            clave: string;
            /** Format: int64 */
            horarioId: number;
            personas: number;
        };
        DecisionExperiencia: {
            /** Format: int64 */
            version: number;
            /** @enum {string} */
            accion: "APROBAR" | "RECHAZAR";
            motivo?: string;
        };
        CancelarExperiencia: {
            /** Format: int64 */
            version: number;
            motivo: string;
        };
        ConsultaExperiencia: {
            /** Format: int64 */
            id: number;
            /** Format: int64 */
            experienciaId: number;
            nombre: string;
            codigoReserva: string;
            comentario: string;
            respuesta?: string;
            /** @enum {string} */
            estado: "ABIERTA" | "RESPONDIDA";
            /** Format: date-time */
            creadaEn: string;
            nombreHuesped?: string;
        };
        CrearConsultaExperiencia: {
            /** Format: uuid */
            clave: string;
            comentario: string;
        };
        ResponderConsultaExperiencia: {
            respuesta: string;
        };
        /** @description Texto plano. Títulos, subtítulos y botones hasta 200 caracteres; otros textos hasta 4000. Imagen admite fotoClave o fotoClaves; botón exige texto y destino; los demás exigen texto. Prohibidos HTML, controles y campos ajenos al tipo. */
        ElementoEditorial: {
            /** @enum {string} */
            id: "inicio.titulo" | "inicio.descripcion" | "inicio.boton" | "habitaciones.subtitulo" | "habitaciones.titulo" | "habitaciones.boton" | "estancias.subtitulo" | "estancias.titulo" | "estancias.descripcion" | "estancias.romantica" | "estancias.descanso" | "estancias.familiar" | "estancias.negocios" | "estancias.bienestar" | "servicios.subtitulo" | "servicios.titulo" | "nosotros.subtitulo" | "nosotros.titulo" | "nosotros.descripcion" | "nosotros.boton" | "nosotros-page.subtitulo" | "nosotros-page.titulo" | "nosotros-page.descripcion" | "nosotros-page.imagen" | "nosotros-page.cierre.titulo" | "nosotros-page.cierre.boton" | "historia.subtitulo" | "historia.titulo" | "historia.descripcion" | "historia.imagen" | "mision-vision.mision.subtitulo" | "mision-vision.mision.titulo" | "mision-vision.mision.descripcion" | "mision-vision.vision.subtitulo" | "mision-vision.vision.titulo" | "mision-vision.vision.descripcion" | "valores.subtitulo" | "valores.titulo" | "valores.item1.titulo" | "valores.item1.descripcion" | "valores.item2.titulo" | "valores.item2.descripcion" | "valores.item3.titulo" | "valores.item3.descripcion" | "valores.item4.titulo" | "valores.item4.descripcion" | "valores.item5.titulo" | "valores.item5.descripcion" | "por-que.subtitulo" | "por-que.titulo" | "por-que.descripcion" | "por-que.item1.titulo" | "por-que.item1.descripcion" | "por-que.item2.titulo" | "por-que.item2.descripcion" | "por-que.item3.titulo" | "por-que.item3.descripcion" | "por-que.item4.titulo" | "por-que.item4.descripcion" | "galeria-hotel.titulo" | "contacto.subtitulo" | "contacto.titulo" | "ayuda.titulo" | "pie.descripcion" | "inicio.imagenes" | "galeria-hotel.imagenes" | "nosotros.imagen" | "servicios.spa.imagen" | "servicios.gimnasio.imagen" | "servicios.piscina.imagen" | "servicios.restaurante.imagen" | "estancias.romantica.imagen" | "estancias.descanso.imagen" | "estancias.familiar.imagen" | "estancias.negocios.imagen" | "estancias.bienestar.imagen" | "estancia-digital.imagen" | "identidad.logo.imagen";
            texto?: string;
            /** @description Solo en estancias.romantica, estancias.descanso, estancias.familiar, estancias.negocios y estancias.bienestar. Nombre visible sin cambiar el ID; texto conserva la descripción. Texto plano sin HTML ni controles. */
            nombre?: string;
            /** @description Solo en los cinco IDs de estancia. Referencias ordenadas a ofertas existentes, publicadas y de categoría activa. Cero a tres sin duplicados; admite reutilizar ofertas entre estancias. Ausencia conserva recomendaciones por preferencias anteriores; lista vacía retira recomendaciones de esa estancia. Fotografías, precios y datos provienen del catálogo vigente, nunca se copian ni modifican. Guardar no publica; revalidar asociaciones al publicar. */
            ofertaSlugs?: string[];
            /** @description Referencia HOTEL existente en almacenamiento; nunca URL externa. Compatible con documentos anteriores. Las claves nuevas deben tener UUID; las claves anteriores registradas en la galeria se conservan. */
            fotoClave?: string;
            /** @description Lista ordenada de claves HOTEL existentes en almacenamiento. No se asocian a la galeria publica al guardar. Maximo 30 para listas y una para posiciones individuales. Lista vacia retira imagenes al publicar, salvo el logo. No combinar con fotoClave, texto ni destino. Nunca elimina archivos. */
            fotoClaves?: string[];
            /** @enum {string} */
            destino?: "/catalogo" | "/nosotros" | "/reservar/habitaciones" | "/#habitaciones" | "/#servicios" | "/#contacto" | "/#buscar";
        };
        GuardarEditorialPeticion: {
            /** Format: int64 */
            revision: number;
            /** @description Documento completo del idioma, ids únicos. Elementos omitidos conservan textos anteriores en Web; sin traducción automática. */
            elementos: components["schemas"]["ElementoEditorial"][];
        };
        PublicarEditorialPeticion: {
            /** Format: int64 */
            revision: number;
        };
        EditorialSitio: {
            /** @description Mapa de claves HOTEL referenciadas a sus URL públicas, calculadas por el servidor. */
            readonly fotografias?: {
                [key: string]: string;
            };
            /** @enum {string} */
            idioma: "es" | "en";
            /** Format: int64 */
            revision: number;
            /** Format: int64 */
            revisionPublicada: number;
            /** Format: date-time */
            actualizadoEn?: string;
            /** Format: date-time */
            publicadoEn?: string;
            elementos: components["schemas"]["ElementoEditorial"][];
        };
        PublicacionOfertaPeticion: {
            publicada: boolean;
        };
        CaracteristicasHabitacionPeticion: {
            capacidad: number;
            superficieM2: number;
            camas: {
                [key: string]: number;
            };
            caracteristicas: string[];
        };
        /** @description Sin características registradas devuelve un objeto vacío. Los registros históricos incompletos omiten atributos no registrados; no se inventan valores. piso procede de rooms y no es editable aquí. */
        CaracteristicasHabitacionAdmin: {
            piso?: number;
            capacidad?: number;
            superficieM2?: number;
            camas?: {
                [key: string]: number;
            };
            caracteristicas?: string[];
        };
        /** @description Creación o reemplazo completo. No admite cupo manual ni fotos independientes: las unidades se vinculan por ID real y la galería pertenece al tipo. Todas las vinculadas deben acreditar el mismo piso, camas, superficie y características; su capacidad debe cubrir la oferta sin superar el tipo. El precio propio de la oferta es el utilizado en catálogo y cotización. Para publicar exige tipo activo, fotos y al menos una unidad activa acreditada. */
        GuardarOfertaAdminPeticion: {
            tipoHabitacionId: components["schemas"]["Id"];
            nombre: string;
            descripcion: string;
            piso: number;
            capacidad: number;
            superficieM2: number;
            camas: {
                [key: string]: number;
            };
            caracteristicas: string[];
            preferencias: string[];
            precioPorNoche: number;
            publicada: boolean;
            orden: number;
            habitacionIds: components["schemas"]["Id"][];
        };
        OfertaAdmin: {
            slug: string;
            tipoHabitacionId: components["schemas"]["Id"];
            nombre: string;
            descripcion: string;
            piso: number;
            capacidad: number;
            superficieM2: number;
            camas: {
                [key: string]: number;
            };
            caracteristicas: string[];
            preferencias: string[];
            precioPorNoche: number;
            publicada: boolean;
            orden: number;
            habitacionIds: components["schemas"]["Id"][];
            /** @description Número de vínculos físicos, no disponibilidad por fechas. */
            cantidadHabitaciones: number;
            /** @description Total real de rooms del tipo, incluyendo inactivas. */
            cantidadHabitacionesTipo: number;
            fotos: components["schemas"]["FotoCatalogo"][];
        };
        /** @description Formato único de error del API. */
        Error: {
            /**
             * @description Código estable del error, en mayúsculas.
             * @example DATOS_INVALIDOS
             */
            codigo: string;
            /**
             * @description Mensaje en español para mostrar al usuario.
             * @example Los datos enviados no son válidos.
             */
            mensaje: string;
            /** @description Detalle por campo; vacío si no aplica. */
            detalles: components["schemas"]["DetalleError"][];
        };
        DetalleError: {
            /** @example correo */
            campo: string;
            /** @example El correo no tiene un formato válido. */
            mensaje: string;
        };
        /**
         * Format: int64
         * @example 1
         */
        Id: number;
        /**
         * @description Monto en quetzales (GTQ) con 2 decimales, impuestos incluidos.
         * @example 1250
         */
        Monto: number;
        /**
         * Format: date
         * @description Fecha de estadía (YYYY-MM-DD).
         * @example 2026-10-15
         */
        FechaEstadia: string;
        /**
         * Format: date-time
         * @description Fecha y hora ISO 8601 con zona.
         * @example 2026-10-02T14:30:00-06:00
         */
        FechaHora: string;
        /**
         * @description Código único no secuencial de la reserva.
         * @example VS-7K2M9Q
         */
        CodigoReserva: string;
        /** @enum {string} */
        EstadoReserva: "PENDIENTE_PAGO" | "CONFIRMADA" | "EN_ESTADIA" | "FINALIZADA" | "CANCELADA";
        /** @enum {string} */
        EstadoCuenta: "ABIERTA" | "CERRADA";
        /** @enum {string} */
        EstadoCargo: "VIGENTE" | "ANULADO";
        /** @enum {string} */
        EstadoPago: "PENDIENTE" | "APROBADO" | "FALLIDO" | "REEMBOLSADO";
        /**
         * @description RECURRENTE para pagos en línea nuevos; STRIPE solo para pagos históricos, sin reinterpretarlos.
         * @enum {string}
         */
        MetodoPago: "RECURRENTE" | "STRIPE" | "CANAL" | "EFECTIVO" | "TARJETA" | "OTRO";
        /**
         * @description Canal de origen de la reserva; se asigna al crearla y no se edita.
         * @enum {string}
         */
        CanalOrigen: "DIRECTO_WEB" | "RECEPCION" | "BOOKING" | "EXPEDIA";
        /** @enum {string} */
        OcupacionHabitacion: "LIBRE" | "OCUPADA";
        /** @enum {string} */
        CondicionHabitacion: "LIMPIA" | "SUCIA" | "EN_LIMPIEZA" | "FUERA_DE_SERVICIO";
        /** @enum {string} */
        EstadoIncidencia: "REPORTADA" | "EN_PROCESO" | "RESUELTA";
        /** @enum {string} */
        TipoDocumento: "DPI" | "PASAPORTE";
        /** @enum {string} */
        RolEmpleado: "ADMIN" | "RECEPCION" | "ROOM_SERVICE" | "MANTENIMIENTO_LIMPIEZA";
        /**
         * @description Área del personal de Mantenimiento/Limpieza.
         * @enum {string}
         */
        AreaMyl: "LIMPIEZA" | "MANTENIMIENTO" | "AMBAS";
        LoginPeticion: {
            /**
             * Format: email
             * @example ana.perez@villaserena.test
             */
            correo: string;
            /** @example Temporal123 */
            contrasena: string;
        };
        RefreshPeticion: {
            /** @example 3f8a1c9e-6b2d-4f7a-9c11-0d5e8b7a2f44 */
            refreshToken: string;
        };
        /** @description Par de tokens; común a personal y huésped. */
        Tokens: {
            /** @description JWT de acceso (15 minutos). */
            accessToken: string;
            /** @description Refresh token rotativo (7 días). */
            refreshToken: string;
            /** @constant */
            tipoToken: "Bearer";
            /**
             * @description Segundos de vida del token de acceso.
             * @example 900
             */
            expiraEn: number;
        };
        /** @description Datos básicos del empleado autenticado. */
        EmpleadoSesion: {
            id: components["schemas"]["Id"];
            /** @example Ana Pérez */
            nombre: string;
            /**
             * Format: email
             * @example ana.perez@villaserena.test
             */
            correo: string;
            rol: components["schemas"]["RolEmpleado"];
            /** @description Solo para MANTENIMIENTO_LIMPIEZA; null en los demás roles. */
            area: components["schemas"]["AreaMyl"] | null;
            /** @example false */
            debeCambiarContrasena: boolean;
        };
        /** @description Tokens más los datos del empleado. */
        SesionEmpleado: components["schemas"]["Tokens"] & {
            empleado: components["schemas"]["EmpleadoSesion"];
        };
        CambiarContrasenaPeticion: {
            contrasenaActual: string;
            /** @description Mínimo 8 caracteres, al menos una letra y un número, distinta de la actual. */
            contrasenaNueva: string;
            confirmacion: string;
        };
        /** @description Datos del huésped principal (web, Recepción y canal). La nacionalidad es opcional. */
        HuespedDatos: {
            /** @example María José López */
            nombreCompleto: string;
            /**
             * Format: email
             * @example maria.lopez@example.com
             */
            correo: string;
            /** @example +502 5555 1234 */
            telefono: string;
            /**
             * @description Opcional. Si se omite o se envía en blanco se guarda como null, sin inferir valores.
             * @example Guatemalteca
             */
            nacionalidad?: string | null;
            tipoDocumento: components["schemas"]["TipoDocumento"];
            /** @example 2547896320101 */
            numeroDocumento: string;
        };
        /** @description Huésped principal registrado (visible para Recepción). */
        Huesped: {
            id: components["schemas"]["Id"];
        } & components["schemas"]["HuespedDatos"];
        /** @description Nombre del huésped principal en listas. */
        HuespedReferencia: {
            id: components["schemas"]["Id"];
            /** @example María José López */
            nombreCompleto: string;
        };
        HuespedAdicionalDatos: {
            /** @example Carlos López */
            nombreCompleto: string;
            tipoDocumento: components["schemas"]["TipoDocumento"];
            /** @example P1234567 */
            numeroDocumento: string;
            /**
             * @description Opcional. Si se omite o se envía en blanco se guarda como null, sin inferir valores.
             * @example Mexicana
             */
            nacionalidad?: string | null;
        };
        HuespedAdicional: {
            id: components["schemas"]["Id"];
        } & components["schemas"]["HuespedAdicionalDatos"];
        TipoHabitacionReferencia: {
            id: components["schemas"]["Id"];
            /** @example Doble Superior */
            nombre: string;
        };
        HabitacionReferencia: {
            id: components["schemas"]["Id"];
            /** @example 204 */
            numero: string;
            /** @example 2 */
            piso: number;
        };
        /**
         * Format: uri
         * @description URL pública de la foto servida por el CDN o dominio de assets públicos configurado en ARCHIVOS_URL_PUBLICA.
         * @example https://d13s29erv78l4g.cloudfront.net/hotel/fachada.jpg
         */
        UrlFoto: string;
        Hotel: {
            /** @example Villa Serena */
            nombre: string;
            descripcion: string;
            fotos: components["schemas"]["UrlFoto"][];
            ubicacion: {
                direccion: string;
            };
            contacto: {
                telefono: string;
                /** Format: email */
                correo: string;
            };
            /**
             * @description Hora fija de check-in.
             * @constant
             */
            horaCheckIn: "15:00";
            /**
             * @description Hora fija de check-out.
             * @constant
             */
            horaCheckOut: "12:00";
        };
        TipoHabitacionPublico: {
            id: components["schemas"]["Id"];
            /** @example Doble Superior */
            nombre: string;
            descripcion: string;
            /**
             * @description Capacidad máxima de huéspedes.
             * @example 4
             */
            capacidad: number;
            precioBaseNoche: components["schemas"]["Monto"];
            /** @description Puede estar vacía (la web usa una imagen genérica). */
            fotos: components["schemas"]["UrlFoto"][];
        };
        /** @description Precio de una noche y los ajustes que lleva. */
        PrecioNoche: {
            fecha: components["schemas"]["FechaEstadia"];
            precio: components["schemas"]["Monto"];
            /**
             * @description Nombre de la temporada aplicada; null si no hay.
             * @example Temporada alta
             */
            temporada: string | null;
            /** @description Verdadero si es viernes o sábado (lleva el ajuste de fin de semana). */
            finDeSemana: boolean;
        };
        CotizacionEstadia: {
            noches: number;
            total: components["schemas"]["Monto"];
            desglose: components["schemas"]["PrecioNoche"][];
        };
        /** @description Tipo disponible para la web pública (sin cantidad de habitaciones restantes). */
        OpcionDisponiblePublica: {
            tipoHabitacion: components["schemas"]["TipoHabitacionPublico"];
        } & components["schemas"]["CotizacionEstadia"];
        /** @description Contenido público del catálogo, más precio, tipo e indicador calculados por API. */
        OfertaPublica: {
            /** @description Identificador comercial usado al reservar por oferta. */
            slug: string;
            name: string;
            /** @description Nombre comercial de la categoría; no sustituye apiTypeId. */
            type: string;
            floor: number;
            price: components["schemas"]["Monto"];
            capacity: number;
            beds: string;
            /** @description Superficie en metros cuadrados. */
            size: number;
            /** @description Ruta relativa o URL de imagen; puede ser ilustrativa. */
            image: string;
            gallery: string[];
            description: string;
            features: string[];
            preferences: string[];
            apiTypeId: components["schemas"]["Id"];
            /** @description Elegibilidad general; consultar disponibilidad antes de reservar. */
            bookable: boolean;
            illustrativePhotos?: boolean;
            verifiedFeatures?: string[];
            inventoryNote?: string;
        } & {
            [key: string]: unknown;
        };
        /** @description Cotización de una oferta, distinta de la cotización tarifaria por tipo. */
        OpcionOfertaDisponible: {
            ofertaSlug: string;
            /** @description Identifica el inventario común del tipo; no representa una cantidad. */
            inventarioCompartido: string;
            tipoHabitacion: {
                id: components["schemas"]["Id"];
                /** @description Nombre comercial de la oferta. */
                nombre: string;
                descripcion: string;
                capacidad: number;
                precioBaseNoche: components["schemas"]["Monto"];
                /** @description Imagen principal de la oferta; admite ruta relativa. */
                fotos: string[];
            };
            noches: number;
            total: components["schemas"]["Monto"];
            desglose: (components["schemas"]["PrecioNoche"] & {
                temporada?: null;
                /** @constant */
                finDeSemana?: false;
            })[];
        };
        ReservaWebPeticion: {
            tipoHabitacionId: components["schemas"]["Id"];
            entrada: components["schemas"]["FechaEstadia"];
            salida: components["schemas"]["FechaEstadia"];
            numeroHuespedes: number;
            huesped: components["schemas"]["HuespedDatos"];
            horaEstimadaLlegada?: components["schemas"]["HoraEstimadaLlegada"];
        };
        /**
         * @description Hora local de America/Guatemala, HH:mm (00:00–23:59), independiente del check-in. En entrada, opcional y nullable: omitida/null = sin indicar. En detalle de Recepción, null si no se indicó o la reserva es histórica. Sin valor por defecto ni relleno histórico. Etiqueta web: Hora estimada de llegada.
         * @example 18:30
         * @example null
         */
        HoraEstimadaLlegada: string | null;
        ReservaWebCreada: {
            codigo: components["schemas"]["CodigoReserva"];
            estado: components["schemas"]["EstadoReserva"];
            tipoHabitacion: components["schemas"]["TipoHabitacionReferencia"];
            entrada: components["schemas"]["FechaEstadia"];
            salida: components["schemas"]["FechaEstadia"];
            noches: number;
            numeroHuespedes: number;
            total: components["schemas"]["Monto"];
            /** @description Momento en que la reserva se cancela sola si no se paga (30 minutos). */
            pagoVenceEn: components["schemas"]["FechaHora"];
        };
        PagoIniciado: {
            /**
             * Format: uri
             * @description URL alojada devuelta por Recurrente; el API la publica como urlPago, no checkout_url.
             */
            urlPago: string;
            /** @description Vencimiento ISO 8601. En pago de saldo puede ser null si el proveedor no lo informa. */
            expiraEn: components["schemas"]["FechaHora"] | null;
        };
        /**
         * @description Observación del checkout, independiente del estado contable local. PAGADO no
         *     confirma por sí solo la reserva. VENCIDO también representa un intento local
         *     FALLIDO. NO_VERIFICADO incluye error del proveedor o unpaid cuya fecha venció
         *     sin confirmación del proveedor. Un pago local aprobado o reembolsado se representa
         *     como PAGADO y no requiere consultar el checkout.
         * @enum {string}
         */
        EstadoCheckout: "SIN_CHECKOUT" | "ABIERTO" | "PROCESANDO" | "PAGADO" | "VENCIDO" | "NO_VERIFICADO";
        /**
         * @description INICIAR crea el primer checkout; CONTINUAR reutiliza el enlace; ESPERAR requiere
         *     consultar otra vez sin cobrar; REINTENTAR permite sustituir un intento fallido
         *     o expired confirmado dentro del plazo; NINGUNA no ofrece acciones de cobro.
         *     El POST siempre revalida las condiciones actuales.
         * @enum {string}
         */
        AccionPago: "INICIAR" | "CONTINUAR" | "ESPERAR" | "REINTENTAR" | "NINGUNA";
        ProcesoPago: {
            /** @description Registro local; null si aún no hay intento para el saldo actual. No reinterpreta pagos STRIPE históricos. */
            estadoPago: components["schemas"]["EstadoPago"] | null;
            estadoCheckout: components["schemas"]["EstadoCheckout"];
            accionPago: components["schemas"]["AccionPago"];
            /** @description True solo para REINTENTAR. Para iniciar o continuar usar accionPago. */
            puedeReintentar: boolean;
            /**
             * Format: uri
             * @description Enlace solo cuando accionPago es CONTINUAR.
             */
            urlPago: string | null;
            /** @description Expiración de sesión limitada por la ventana de pago; null si no aplica o no se conoce. */
            expiraEn: components["schemas"]["FechaHora"] | null;
        };
        /** @description Estado público del último pago RECURRENTE; no reinterpreta pagos STRIPE históricos. */
        EstadoReservaPublico: components["schemas"]["ProcesoPago"] & {
            codigo: components["schemas"]["CodigoReserva"];
            estadoReserva: components["schemas"]["EstadoReserva"];
            pagoVenceEn: components["schemas"]["FechaHora"];
        };
        /**
         * @description Cuerpo original firmado por Svix. Se usa event_type; si falta o es null,
         *     se admite type como alternativa. El id del cuerpo no identifica el envío:
         *     la idempotencia usa svix-id. Solo intent.succeeded y checkout.expired
         *     requieren checkout.id; otros tipos no vacíos se ignoran con 200.
         *     El estado y el importe del cuerpo no acreditan un pago: se consulta Recurrente.
         */
        EventoRecurrente: ({
            /**
             * @example intent.succeeded
             * @example checkout.expired
             */
            event_type?: string | null;
            /** @description Tipo alternativo únicamente si event_type falta o es null. */
            type?: string | null;
            checkout?: {
                id?: string;
            } & {
                [key: string]: unknown;
            };
        } & {
            [key: string]: unknown;
        }) | {
            event_type: string;
        } | {
            event_type?: null;
            type: string;
        };
        ReservaCanalPeticion: {
            /** @description Identificador de la reserva en el canal; único por canal. */
            identificadorExterno: string;
            tipoHabitacionId: components["schemas"]["Id"];
            entrada: components["schemas"]["FechaEstadia"];
            salida: components["schemas"]["FechaEstadia"];
            numeroHuespedes: number;
            /** @description Monto total cobrado por el canal, en quetzales. */
            montoTotal: components["schemas"]["Monto"];
            huesped: components["schemas"]["HuespedDatos"];
        };
        ReservaCanalRespuesta: {
            codigo: components["schemas"]["CodigoReserva"];
            estado: components["schemas"]["EstadoReserva"];
            canal: components["schemas"]["CanalOrigen"];
            identificadorExterno: string;
            tipoHabitacion: components["schemas"]["TipoHabitacionReferencia"];
            entrada: components["schemas"]["FechaEstadia"];
            salida: components["schemas"]["FechaEstadia"];
            numeroHuespedes: number;
            montoTotal: components["schemas"]["Monto"];
        };
        /** @description Fila de la búsqueda de reservas de Recepción. */
        ReservaResumen: {
            codigo: components["schemas"]["CodigoReserva"];
            huespedPrincipal: components["schemas"]["HuespedReferencia"];
            entrada: components["schemas"]["FechaEstadia"];
            salida: components["schemas"]["FechaEstadia"];
            /** @example 3 */
            noches: number;
            /** @example 2 */
            numeroHuespedes: number;
            tipoHabitacion: components["schemas"]["TipoHabitacionReferencia"];
            /** @description Habitación asignada; null = "Sin asignar". */
            habitacion: components["schemas"]["HabitacionReferencia"] | null;
            estado: components["schemas"]["EstadoReserva"];
            canal: components["schemas"]["CanalOrigen"];
            /**
             * @description Solo en reservas de BOOKING o EXPEDIA; null en las demás.
             * @example BK-99887766
             */
            identificadorExterno: string | null;
            total: components["schemas"]["Monto"];
            saldoPendiente: components["schemas"]["Monto"];
        };
        /** @description Un cambio de estado de la reserva (RG-EST-02). */
        HistorialEstado: {
            /** @description null cuando la reserva se crea. */
            estadoAnterior: components["schemas"]["EstadoReserva"] | null;
            estadoNuevo: components["schemas"]["EstadoReserva"];
            /**
             * @description Nombre del empleado, "Cliente web", el código del canal o "SISTEMA".
             * @example Ana Pérez
             */
            responsable: string;
            fechaHora: components["schemas"]["FechaHora"];
            /** @example null */
            motivo: string | null;
        };
        /** @description Detalle completo de la reserva para Recepción. */
        ReservaDetalle: {
            codigo: components["schemas"]["CodigoReserva"];
            estado: components["schemas"]["EstadoReserva"];
            canal: components["schemas"]["CanalOrigen"];
            /** @example null */
            identificadorExterno: string | null;
            entrada: components["schemas"]["FechaEstadia"];
            salida: components["schemas"]["FechaEstadia"];
            /** @example 3 */
            noches: number;
            /** @example 2 */
            numeroHuespedes: number;
            tipoHabitacion: components["schemas"]["TipoHabitacionReferencia"];
            habitacion: components["schemas"]["HabitacionReferencia"] | null;
            huesped: components["schemas"]["Huesped"];
            huespedesAdicionales: components["schemas"]["HuespedAdicional"][];
            total: components["schemas"]["Monto"];
            saldoPendiente: components["schemas"]["Monto"];
            creadaEn: components["schemas"]["FechaHora"];
            /** @description Cambios de estado, del más antiguo al más reciente. */
            historial: components["schemas"]["HistorialEstado"][];
            horaEstimadaLlegada: components["schemas"]["HoraEstimadaLlegada"];
        };
        RegistroHuespedRespuesta: {
            /** @description Verdadero si ya había un huésped con ese correo (se usa su perfil sin cambios). */
            yaExistia: boolean;
            huesped: components["schemas"]["Huesped"];
        };
        /** @description Tipo disponible para Recepción, con las habitaciones que quedan. */
        OpcionDisponibleRecepcion: {
            tipoHabitacion: components["schemas"]["TipoHabitacionReferencia"];
            capacidad: number;
            /** @description Habitaciones libres del tipo en todas las noches del rango (el mínimo). */
            habitacionesDisponibles: number;
        } & components["schemas"]["CotizacionEstadia"];
        ReservaRecepcionPeticion: {
            huespedId: components["schemas"]["Id"];
            tipoHabitacionId: components["schemas"]["Id"];
            entrada: components["schemas"]["FechaEstadia"];
            salida: components["schemas"]["FechaEstadia"];
            numeroHuespedes: number;
            /** @description Habitación opcional del mismo tipo (reglas de HU-REC-07). */
            habitacionId?: components["schemas"]["Id"] | null;
        };
        PaginaReservas: {
            contenido: components["schemas"]["ReservaResumen"][];
            page: number;
            size: number;
            /** Format: int64 */
            totalElementos: number;
            totalPaginas: number;
        };
        /** @description Barra del Gantt. */
        ReservaCalendario: {
            codigo: components["schemas"]["CodigoReserva"];
            /** @description Nombre completo del huésped principal. */
            huespedPrincipal: string;
            entrada: components["schemas"]["FechaEstadia"];
            salida: components["schemas"]["FechaEstadia"];
            estado: components["schemas"]["EstadoReserva"];
            canal: components["schemas"]["CanalOrigen"];
            tipoHabitacionId: components["schemas"]["Id"];
            /** @description null = fila "Sin asignar". */
            habitacionId: components["schemas"]["Id"] | null;
        };
        CalendarioReservas: {
            desde: components["schemas"]["FechaEstadia"];
            hasta: components["schemas"]["FechaEstadia"];
            /** @description Filas del Gantt agrupadas por tipo de habitación. */
            grupos: {
                tipoHabitacion: components["schemas"]["TipoHabitacionReferencia"];
                habitaciones: components["schemas"]["HabitacionReferencia"][];
            }[];
            /** @description Reservas activas o FINALIZADA (nunca CANCELADA) que se cruzan con el rango. */
            reservas: components["schemas"]["ReservaCalendario"][];
        };
        VistaPreviaCancelacion: {
            /** @enum {string} */
            resultado: "REEMBOLSO_TOTAL" | "SIN_REEMBOLSO" | "SIN_PAGOS";
            /** @description Monto que se reembolsaría por Recurrente; 0.00 si no hay reembolso. */
            montoReembolso: components["schemas"]["Monto"];
        };
        CancelarReservaPeticion: {
            /** @example No se presentó */
            motivo: string;
        };
        AsignarHabitacionPeticion: {
            habitacionId: components["schemas"]["Id"];
        };
        /** @description Incidencia que deja la habitación FUERA_DE_SERVICIO (solo lectura para Recepción). */
        IncidenciaBloqueante: {
            id: components["schemas"]["Id"];
            descripcion: string;
            estado: components["schemas"]["EstadoIncidencia"];
            reportadaEn: components["schemas"]["FechaHora"];
        };
        HabitacionEstado: {
            id: components["schemas"]["Id"];
            /** @example 103 */
            numero: string;
            /** @example 1 */
            piso: number;
            tipoHabitacion: components["schemas"]["TipoHabitacionReferencia"];
            ocupacion: components["schemas"]["OcupacionHabitacion"];
            condicion: components["schemas"]["CondicionHabitacion"];
            /** @description Tiene asignada una reserva CONFIRMADA con entrada hoy. */
            llegaHoy: boolean;
            /** @description Su reserva EN_ESTADIA sale hoy. */
            saleHoy: boolean;
            /** @description Está OCUPADA y tiene una incidencia sin resolver que impide su uso. */
            incidenciaPendiente: boolean;
            /** @description Solo si la condición es FUERA_DE_SERVICIO; null en los demás casos. */
            incidenciaBloqueante: components["schemas"]["IncidenciaBloqueante"] | null;
        };
        /**
         * @example ACTIVO
         * @enum {string}
         */
        EstadoCatalogo: "ACTIVO" | "INACTIVO";
        /**
         * @example NUEVO
         * @enum {string}
         */
        EstadoPedido: "NUEVO" | "EN_PREPARACION" | "EN_CAMINO" | "ENTREGADO" | "CANCELADO";
        /**
         * @example PENDIENTE
         * @enum {string}
         */
        EstadoSolicitud: "PENDIENTE" | "EN_PROCESO" | "ATENDIDA" | "CANCELADA";
        /**
         * @example LIMPIEZA
         * @enum {string}
         */
        TipoSolicitud: "LIMPIEZA" | "ARTICULOS";
        /**
         * @example DISPONIBLE
         * @enum {string}
         */
        DisponibilidadMenu: "DISPONIBLE" | "AGOTADO";
        /**
         * @example {
         *       "mensaje": "Si el correo tiene reservas, recibirás un código para entrar."
         *     }
         */
        MensajeGenerico: {
            mensaje: string;
        };
        /**
         * @example {
         *       "correo": "ana@example.com"
         *     }
         */
        CodigoAccesoPeticion: {
            /** Format: email */
            correo: string;
        };
        /**
         * @example {
         *       "correo": "ana@example.com",
         *       "codigo": "123456"
         *     }
         */
        VerificarCodigoPeticion: {
            /** Format: email */
            correo: string;
            codigo: string;
        };
        /**
         * @description Ticket opaco, de un solo uso y 60 segundos; se envía únicamente en CONNECT STOMP.
         * @example {
         *       "ticket": "ticket-opaco-de-demostracion",
         *       "expiraEn": "2026-10-08T16:01:00.000Z"
         *     }
         */
        WsTicket: {
            ticket: string;
            expiraEn: components["schemas"]["FechaHora"];
        };
        /**
         * @example {
         *       "codigo": "VS-7K2M9Q",
         *       "entrada": "2026-10-15T00:00:00.000Z",
         *       "salida": "2026-10-15T00:00:00.000Z",
         *       "estado": "PENDIENTE_PAGO"
         *     }
         */
        ReservaAppResumen: {
            codigo: components["schemas"]["CodigoReserva"];
            entrada: components["schemas"]["FechaEstadia"];
            salida: components["schemas"]["FechaEstadia"];
            estado: components["schemas"]["EstadoReserva"];
        };
        /**
         * @description Solo reservas del correo del huésped principal; habitación null se presenta como Por asignar.
         * @example {
         *       "codigo": "VS-7K2M9Q",
         *       "entrada": "2026-10-15T00:00:00.000Z",
         *       "salida": "2026-10-15T00:00:00.000Z",
         *       "estado": "PENDIENTE_PAGO",
         *       "horaCheckOut": "12:00",
         *       "tipoHabitacion": {
         *         "id": 1,
         *         "nombre": "Doble Superior"
         *       },
         *       "numeroHuespedes": 1,
         *       "habitacion": null
         *     }
         */
        ReservaAppDetalle: {
            codigo: components["schemas"]["CodigoReserva"];
            entrada: components["schemas"]["FechaEstadia"];
            salida: components["schemas"]["FechaEstadia"];
            estado: components["schemas"]["EstadoReserva"];
            /** @constant */
            horaCheckOut: "12:00";
            tipoHabitacion: components["schemas"]["TipoHabitacionReferencia"];
            numeroHuespedes: number;
            habitacion: components["schemas"]["HabitacionReferencia"] | null;
        };
        /**
         * @example {
         *       "id": 1,
         *       "nombre": "Bebidas"
         *     }
         */
        CategoriaMenu: {
            id: components["schemas"]["Id"];
            nombre: string;
        };
        /**
         * @example {
         *       "id": 21,
         *       "categoriaId": 1,
         *       "nombre": "Café de Guatemala",
         *       "descripcion": "Café recién preparado.",
         *       "precio": 25,
         *       "fotoUrl": null,
         *       "disponibilidad": "DISPONIBLE"
         *     }
         */
        ItemMenuApp: {
            id: components["schemas"]["Id"];
            categoriaId: components["schemas"]["Id"];
            nombre: string;
            descripcion: string;
            precio: components["schemas"]["Monto"];
            fotoUrl: string | null;
            disponibilidad: components["schemas"]["DisponibilidadMenu"];
        };
        /**
         * @description Solo categorías con ítems activos. Los AGOTADO se incluyen pero no se pueden pedir.
         * @example {
         *       "categorias": [
         *         {
         *           "id": 1,
         *           "nombre": "Bebidas"
         *         }
         *       ],
         *       "items": [
         *         {
         *           "id": 21,
         *           "categoriaId": 1,
         *           "nombre": "Café de Guatemala",
         *           "descripcion": "Café recién preparado.",
         *           "precio": 25,
         *           "fotoUrl": null,
         *           "disponibilidad": "DISPONIBLE"
         *         }
         *       ]
         *     }
         */
        MenuApp: {
            categorias: components["schemas"]["CategoriaMenu"][];
            items: components["schemas"]["ItemMenuApp"][];
        };
        /**
         * @example {
         *       "itemId": 21,
         *       "cantidad": 2
         *     }
         */
        ItemPedidoPeticion: {
            itemId: components["schemas"]["Id"];
            cantidad: number;
        };
        /**
         * @description Ítems distintos; precios y total los calcula el servidor. No enviar precios desde el cliente.
         * @example {
         *       "items": [
         *         {
         *           "itemId": 21,
         *           "cantidad": 2
         *         }
         *       ],
         *       "notas": "Sin azúcar"
         *     }
         */
        CrearPedidoPeticion: {
            items: components["schemas"]["ItemPedidoPeticion"][];
            notas?: string;
        };
        /**
         * @example {
         *       "itemId": 21,
         *       "nombre": "Café de Guatemala",
         *       "cantidad": 2,
         *       "precioUnitario": 25,
         *       "subtotal": 50
         *     }
         */
        ItemPedido: {
            itemId: components["schemas"]["Id"];
            nombre: string;
            cantidad: number;
            precioUnitario: components["schemas"]["Monto"];
            subtotal: components["schemas"]["Monto"];
        };
        /**
         * @example {
         *       "id": 7,
         *       "nombre": "María López"
         *     }
         */
        ResponsableEmpleado: {
            id: components["schemas"]["Id"];
            nombre: string;
        };
        /**
         * @description Estados exactos del recurso correspondiente; responsable es el nombre autorizado o SISTEMA. Nunca correo, teléfono ni documento.
         * @example {
         *       "estadoAnterior": null,
         *       "estadoNuevo": "Demostración",
         *       "responsable": "María López",
         *       "fechaHora": "2026-10-02T20:30:00.000Z",
         *       "motivo": null
         *     }
         */
        HistorialOperacion: {
            estadoAnterior: string | null;
            estadoNuevo: string;
            responsable: string;
            fechaHora: components["schemas"]["FechaHora"];
            motivo: string | null;
        };
        /**
         * @description Solo del dueño. No admite modificaciones ni cancelación desde la app.
         * @example {
         *       "id": 12,
         *       "codigoReserva": "VS-ABC123",
         *       "creadoEn": "2026-10-08T15:00:00.000Z",
         *       "estado": "NUEVO",
         *       "items": [
         *         {
         *           "itemId": 21,
         *           "nombre": "Café de Guatemala",
         *           "cantidad": 2,
         *           "precioUnitario": 25,
         *           "subtotal": 50
         *         }
         *       ],
         *       "notas": "Sin azúcar",
         *       "total": 50,
         *       "motivoCancelacion": null
         *     }
         */
        PedidoHuesped: {
            id: components["schemas"]["Id"];
            codigoReserva: components["schemas"]["CodigoReserva"];
            creadoEn: components["schemas"]["FechaHora"];
            estado: components["schemas"]["EstadoPedido"];
            items: components["schemas"]["ItemPedido"][];
            notas: string | null;
            total: components["schemas"]["Monto"];
            motivoCancelacion: string | null;
        };
        /**
         * @example {
         *       "id": 4,
         *       "numero": "204",
         *       "piso": 2
         *     }
         */
        HabitacionOperativa: {
            id: components["schemas"]["Id"];
            numero: string;
            piso: number;
        };
        /**
         * @description El único dato personal del huésped permitido es nombreHuesped. No incluye correo, teléfono, documento, cuenta ni pagos.
         * @example {
         *       "id": 12,
         *       "creadoEn": "2026-10-08T15:00:00.000Z",
         *       "estado": "NUEVO",
         *       "items": [
         *         {
         *           "itemId": 21,
         *           "nombre": "Café de Guatemala",
         *           "cantidad": 2,
         *           "precioUnitario": 25,
         *           "subtotal": 50
         *         }
         *       ],
         *       "notas": "Sin azúcar",
         *       "total": 50,
         *       "motivoCancelacion": null,
         *       "habitacion": {
         *         "id": 4,
         *         "numero": "204",
         *         "piso": 2
         *       },
         *       "nombreHuesped": "Ana Morales",
         *       "historial": [
         *         {
         *           "estadoAnterior": null,
         *           "estadoNuevo": "NUEVO",
         *           "responsable": "Huésped",
         *           "fechaHora": "2026-10-08T15:00:00.000Z",
         *           "motivo": null
         *         }
         *       ]
         *     }
         */
        PedidoRoomService: {
            id: components["schemas"]["Id"];
            creadoEn: components["schemas"]["FechaHora"];
            estado: components["schemas"]["EstadoPedido"];
            items: components["schemas"]["ItemPedido"][];
            notas: string | null;
            total: components["schemas"]["Monto"];
            motivoCancelacion: string | null;
            habitacion: components["schemas"]["HabitacionOperativa"];
            nombreHuesped: string;
            historial: components["schemas"]["HistorialOperacion"][];
        };
        /**
         * @description Solo el paso siguiente. Comparar estadoEsperado bajo bloqueo; si ya cambió, devolver 409.
         * @example {
         *       "estadoEsperado": "EN_CAMINO",
         *       "nuevoEstado": "ENTREGADO"
         *     }
         */
        AvanzarPedidoPeticion: {
            /** @enum {string} */
            estadoEsperado: "NUEVO" | "EN_PREPARACION" | "EN_CAMINO";
            /** @enum {string} */
            nuevoEstado: "EN_PREPARACION" | "EN_CAMINO" | "ENTREGADO";
        };
        /**
         * @example {
         *       "motivo": "Registrado por error"
         *     }
         */
        MotivoPeticion: {
            motivo: string;
        };
        /**
         * @example {
         *       "id": 1,
         *       "nombre": "Toalla de baño",
         *       "cantidadMaxima": 4
         *     }
         */
        ArticuloSolicitable: {
            id: components["schemas"]["Id"];
            nombre: string;
            cantidadMaxima: number;
        };
        /**
         * @example {
         *       "articuloId": 1,
         *       "cantidad": 2
         *     }
         */
        ArticuloSolicitudPeticion: {
            articuloId: components["schemas"]["Id"];
            cantidad: number;
        };
        /**
         * @example {
         *       "articuloId": 1,
         *       "nombre": "Toalla de baño",
         *       "cantidad": 2
         *     }
         */
        ArticuloSolicitud: {
            articuloId: components["schemas"]["Id"];
            nombre: string;
            cantidad: number;
        };
        /**
         * @description Comentario opcional. No modifica la condición de la habitación.
         * @example {
         *       "comentario": "Después de las 10:00, por favor."
         *     }
         */
        SolicitarLimpiezaPeticion: {
            comentario?: string;
        };
        /**
         * @description Artículos distintos y cantidad no superior al máximo del catálogo. No descuenta inventario.
         * @example {
         *       "articulos": [
         *         {
         *           "articuloId": 1,
         *           "cantidad": 2
         *         }
         *       ]
         *     }
         */
        SolicitarArticulosPeticion: {
            articulos: components["schemas"]["ArticuloSolicitudPeticion"][];
        };
        /**
         * @description Vista del huésped; no expone identidad del empleado. Las de LIMPIEZA tienen articulos vacío.
         * @example {
         *       "id": 8,
         *       "tipo": "ARTICULOS",
         *       "creadaEn": "2026-10-08T15:00:00.000Z",
         *       "estado": "PENDIENTE",
         *       "comentario": null,
         *       "articulos": [
         *         {
         *           "articuloId": 1,
         *           "nombre": "Toalla de baño",
         *           "cantidad": 2
         *         }
         *       ]
         *     }
         */
        SolicitudHuesped: {
            id: components["schemas"]["Id"];
            tipo: components["schemas"]["TipoSolicitud"];
            creadaEn: components["schemas"]["FechaHora"];
            estado: components["schemas"]["EstadoSolicitud"];
            comentario: string | null;
            articulos: components["schemas"]["ArticuloSolicitud"][];
        };
        /**
         * @description Sin datos personales del huésped: ni nombre, correo, teléfono, documento ni pagos.
         * @example {
         *       "id": 8,
         *       "tipo": "ARTICULOS",
         *       "creadaEn": "2026-10-08T15:00:00.000Z",
         *       "estado": "PENDIENTE",
         *       "comentario": null,
         *       "articulos": [
         *         {
         *           "articuloId": 1,
         *           "nombre": "Toalla de baño",
         *           "cantidad": 2
         *         }
         *       ],
         *       "habitacion": {
         *         "id": 4,
         *         "numero": "204",
         *         "piso": 2
         *       },
         *       "empleadoACargo": null
         *     }
         */
        SolicitudLimpieza: {
            id: components["schemas"]["Id"];
            tipo: components["schemas"]["TipoSolicitud"];
            creadaEn: components["schemas"]["FechaHora"];
            estado: components["schemas"]["EstadoSolicitud"];
            comentario: string | null;
            articulos: components["schemas"]["ArticuloSolicitud"][];
            habitacion: components["schemas"]["HabitacionOperativa"];
            empleadoACargo: components["schemas"]["ResponsableEmpleado"] | null;
        };
        /**
         * @description Solo habitaciones LIBRE. Priorizar llegadaHoy y luego antigüedad de SUCIA.
         * @example {
         *       "habitacion": {
         *         "id": 4,
         *         "numero": "204",
         *         "piso": 2
         *       },
         *       "condicion": "SUCIA",
         *       "llegadaHoy": false,
         *       "suciaDesde": "2026-10-02T20:30:00.000Z",
         *       "empleadoACargo": null
         *     }
         */
        HabitacionLimpieza: {
            habitacion: components["schemas"]["HabitacionOperativa"];
            /** @enum {string} */
            condicion: "SUCIA" | "EN_LIMPIEZA";
            llegadaHoy: boolean;
            suciaDesde: components["schemas"]["FechaHora"];
            empleadoACargo: components["schemas"]["ResponsableEmpleado"] | null;
        };
        /**
         * @example {
         *       "habitacion": {
         *         "id": 4,
         *         "numero": "204",
         *         "piso": 2
         *       },
         *       "ocupacion": "LIBRE",
         *       "condicion": "LIMPIA",
         *       "empleadoACargo": null
         *     }
         */
        ResultadoCondicionHabitacion: {
            habitacion: components["schemas"]["HabitacionOperativa"];
            ocupacion: components["schemas"]["OcupacionHabitacion"];
            condicion: components["schemas"]["CondicionHabitacion"];
            empleadoACargo: components["schemas"]["ResponsableEmpleado"] | null;
        };
        /**
         * @example {
         *       "habitacionId": 4,
         *       "descripcion": "Fuga en la ducha.",
         *       "impideUso": true,
         *       "fotoClave": "incidencias/fuga-demo.jpg"
         *     }
         */
        ReportarIncidenciaPeticion: {
            habitacionId: components["schemas"]["Id"];
            descripcion: string;
            impideUso: boolean;
            fotoClave?: string;
        };
        /**
         * @example {
         *       "id": 1,
         *       "habitacionId": 1,
         *       "estado": "REPORTADA",
         *       "reportadaEn": "2026-10-02T20:30:00.000Z"
         *     }
         */
        IncidenciaCreada: {
            id: components["schemas"]["Id"];
            habitacionId: components["schemas"]["Id"];
            /** @enum {string} */
            estado: "REPORTADA";
            reportadaEn: components["schemas"]["FechaHora"];
        };
        /**
         * @description fotoUrl, si existe, es firmada y de corta duración. No contiene datos del huésped.
         * @example {
         *       "id": 1,
         *       "habitacion": {
         *         "id": 4,
         *         "numero": "204",
         *         "piso": 2
         *       },
         *       "descripcion": "Descripción de demostración",
         *       "impideUso": false,
         *       "habitacionOcupada": false,
         *       "estado": "REPORTADA",
         *       "reportadaPor": {
         *         "id": 7,
         *         "nombre": "María López"
         *       },
         *       "reportadaEn": "2026-10-02T20:30:00.000Z",
         *       "tecnicoACargo": null,
         *       "resueltaEn": null,
         *       "fotoUrl": null
         *     }
         */
        IncidenciaResumen: {
            id: components["schemas"]["Id"];
            habitacion: components["schemas"]["HabitacionOperativa"];
            descripcion: string;
            impideUso: boolean;
            habitacionOcupada: boolean;
            estado: components["schemas"]["EstadoIncidencia"];
            reportadaPor: components["schemas"]["ResponsableEmpleado"];
            reportadaEn: components["schemas"]["FechaHora"];
            tecnicoACargo: components["schemas"]["ResponsableEmpleado"] | null;
            resueltaEn: components["schemas"]["FechaHora"] | null;
            fotoUrl: string | null;
        };
        /**
         * @example {
         *       "id": 1,
         *       "habitacion": {
         *         "id": 4,
         *         "numero": "204",
         *         "piso": 2
         *       },
         *       "descripcion": "Descripción de demostración",
         *       "impideUso": false,
         *       "habitacionOcupada": false,
         *       "estado": "REPORTADA",
         *       "reportadaPor": {
         *         "id": 7,
         *         "nombre": "María López"
         *       },
         *       "reportadaEn": "2026-10-02T20:30:00.000Z",
         *       "tecnicoACargo": null,
         *       "resueltaEn": null,
         *       "fotoUrl": null,
         *       "solucion": null,
         *       "historial": [
         *         {
         *           "estadoAnterior": null,
         *           "estadoNuevo": "Demostración",
         *           "responsable": "María López",
         *           "fechaHora": "2026-10-02T20:30:00.000Z",
         *           "motivo": null
         *         }
         *       ]
         *     }
         */
        IncidenciaDetalle: {
            id: components["schemas"]["Id"];
            habitacion: components["schemas"]["HabitacionOperativa"];
            descripcion: string;
            impideUso: boolean;
            habitacionOcupada: boolean;
            estado: components["schemas"]["EstadoIncidencia"];
            reportadaPor: components["schemas"]["ResponsableEmpleado"];
            reportadaEn: components["schemas"]["FechaHora"];
            tecnicoACargo: components["schemas"]["ResponsableEmpleado"] | null;
            resueltaEn: components["schemas"]["FechaHora"] | null;
            fotoUrl: string | null;
            solucion: string | null;
            historial: components["schemas"]["HistorialOperacion"][];
        };
        /**
         * @example {
         *       "solucion": "Se reemplazó la pieza dañada."
         *     }
         */
        ResolverIncidenciaPeticion: {
            solucion: string;
        };
        /**
         * @example {
         *       "id": 1,
         *       "fechaHora": "2026-10-08T15:30:00.000Z",
         *       "tipo": "ROOM_SERVICE",
         *       "concepto": "Room Service — Pedido #12",
         *       "cantidad": 2,
         *       "precioUnitario": 25,
         *       "monto": 50,
         *       "estado": "VIGENTE",
         *       "motivoAnulacion": null
         *     }
         */
        CargoCuentaHuesped: {
            id: components["schemas"]["Id"];
            fechaHora: components["schemas"]["FechaHora"];
            /** @enum {string} */
            tipo: "ALOJAMIENTO" | "ROOM_SERVICE" | "SERVICIO";
            concepto: string;
            cantidad: number;
            precioUnitario: components["schemas"]["Monto"];
            monto: components["schemas"]["Monto"];
            estado: components["schemas"]["EstadoCargo"];
            motivoAnulacion: string | null;
        };
        /**
         * @example {
         *       "id": 1,
         *       "fechaHora": "2026-10-08T15:30:00.000Z",
         *       "tipo": "ROOM_SERVICE",
         *       "concepto": "Room Service — Pedido #12",
         *       "cantidad": 2,
         *       "precioUnitario": 25,
         *       "monto": 50,
         *       "estado": "VIGENTE",
         *       "motivoAnulacion": null,
         *       "responsable": "María López",
         *       "anuladoPor": null
         *     }
         */
        CargoCuentaRecepcion: {
            id: components["schemas"]["Id"];
            fechaHora: components["schemas"]["FechaHora"];
            /** @enum {string} */
            tipo: "ALOJAMIENTO" | "ROOM_SERVICE" | "SERVICIO";
            concepto: string;
            cantidad: number;
            precioUnitario: components["schemas"]["Monto"];
            monto: components["schemas"]["Monto"];
            estado: components["schemas"]["EstadoCargo"];
            motivoAnulacion: string | null;
            responsable: string;
            anuladoPor: string | null;
        };
        /**
         * @example {
         *       "id": 1,
         *       "fechaHora": "2026-10-08T15:40:00.000Z",
         *       "metodo": "RECURRENTE",
         *       "monto": 50,
         *       "estado": "APROBADO"
         *     }
         */
        PagoCuentaHuesped: {
            id: components["schemas"]["Id"];
            fechaHora: components["schemas"]["FechaHora"];
            metodo: components["schemas"]["MetodoPago"];
            monto: components["schemas"]["Monto"];
            estado: components["schemas"]["EstadoPago"];
        };
        /**
         * @example {
         *       "id": 1,
         *       "fechaHora": "2026-10-08T15:40:00.000Z",
         *       "metodo": "RECURRENTE",
         *       "monto": 50,
         *       "estado": "APROBADO",
         *       "referencia": "Pago de prueba",
         *       "responsable": "RECURRENTE"
         *     }
         */
        PagoCuentaRecepcion: {
            id: components["schemas"]["Id"];
            fechaHora: components["schemas"]["FechaHora"];
            metodo: components["schemas"]["MetodoPago"];
            monto: components["schemas"]["Monto"];
            estado: components["schemas"]["EstadoPago"];
            referencia: string | null;
            responsable: string;
        };
        /**
         * @description Consulta en cualquier estado. Saldo=cargos VIGENTE−pagos APROBADO, puede ser negativo. No muestra referencias internas de la pasarela ni responsables de pagos.
         * @example {
         *       "codigoReserva": "VS-ABC123",
         *       "estadoReserva": "EN_ESTADIA",
         *       "estadoCuenta": "ABIERTA",
         *       "nombreHuesped": "Ana Morales",
         *       "detalleNoches": [],
         *       "totalCargosVigentes": 1850,
         *       "totalPagosAprobados": 1850,
         *       "saldo": 0,
         *       "facturaId": null,
         *       "cargos": [
         *         {
         *           "id": 2,
         *           "fechaHora": "2026-10-08T15:30:00.000Z",
         *           "tipo": "ALOJAMIENTO",
         *           "concepto": "Alojamiento · reserva de canal",
         *           "cantidad": 1,
         *           "precioUnitario": 1800,
         *           "monto": 1800,
         *           "estado": "VIGENTE",
         *           "motivoAnulacion": null
         *         },
         *         {
         *           "id": 1,
         *           "fechaHora": "2026-10-08T15:30:00.000Z",
         *           "tipo": "ROOM_SERVICE",
         *           "concepto": "Room Service — Pedido #12",
         *           "cantidad": 2,
         *           "precioUnitario": 25,
         *           "monto": 50,
         *           "estado": "VIGENTE",
         *           "motivoAnulacion": null
         *         }
         *       ],
         *       "pagos": [
         *         {
         *           "id": 2,
         *           "fechaHora": "2026-10-08T15:40:00.000Z",
         *           "metodo": "CANAL",
         *           "monto": 1800,
         *           "estado": "APROBADO"
         *         },
         *         {
         *           "id": 1,
         *           "fechaHora": "2026-10-08T15:40:00.000Z",
         *           "metodo": "RECURRENTE",
         *           "monto": 50,
         *           "estado": "APROBADO"
         *         }
         *       ]
         *     }
         */
        CuentaHuesped: {
            codigoReserva: components["schemas"]["CodigoReserva"];
            estadoReserva: components["schemas"]["EstadoReserva"];
            estadoCuenta: components["schemas"]["EstadoCuenta"];
            nombreHuesped: string;
            detalleNoches: components["schemas"]["PrecioNoche"][];
            totalCargosVigentes: components["schemas"]["Monto"];
            totalPagosAprobados: components["schemas"]["Monto"];
            saldo: components["schemas"]["Monto"];
            facturaId: components["schemas"]["Id"] | null;
            cargos: components["schemas"]["CargoCuentaHuesped"][];
            pagos: components["schemas"]["PagoCuentaHuesped"][];
        };
        /**
         * @description Incluye responsables y referencia de pagos; alojamiento de canal en una línea, sin detalle de noches.
         * @example {
         *       "codigoReserva": "VS-ABC123",
         *       "estadoReserva": "EN_ESTADIA",
         *       "estadoCuenta": "ABIERTA",
         *       "nombreHuesped": "Ana Morales",
         *       "detalleNoches": [],
         *       "totalCargosVigentes": 1850,
         *       "totalPagosAprobados": 1850,
         *       "saldo": 0,
         *       "facturaId": null,
         *       "cargos": [
         *         {
         *           "id": 2,
         *           "fechaHora": "2026-10-08T15:30:00.000Z",
         *           "tipo": "ALOJAMIENTO",
         *           "concepto": "Alojamiento · reserva de canal",
         *           "cantidad": 1,
         *           "precioUnitario": 1800,
         *           "monto": 1800,
         *           "estado": "VIGENTE",
         *           "motivoAnulacion": null,
         *           "responsable": "María López",
         *           "anuladoPor": null
         *         },
         *         {
         *           "id": 1,
         *           "fechaHora": "2026-10-08T15:30:00.000Z",
         *           "tipo": "ROOM_SERVICE",
         *           "concepto": "Room Service — Pedido #12",
         *           "cantidad": 2,
         *           "precioUnitario": 25,
         *           "monto": 50,
         *           "estado": "VIGENTE",
         *           "motivoAnulacion": null,
         *           "responsable": "María López",
         *           "anuladoPor": null
         *         }
         *       ],
         *       "pagos": [
         *         {
         *           "id": 2,
         *           "fechaHora": "2026-10-08T15:40:00.000Z",
         *           "metodo": "CANAL",
         *           "monto": 1800,
         *           "estado": "APROBADO",
         *           "referencia": "Pago de prueba",
         *           "responsable": "RECURRENTE"
         *         },
         *         {
         *           "id": 1,
         *           "fechaHora": "2026-10-08T15:40:00.000Z",
         *           "metodo": "RECURRENTE",
         *           "monto": 50,
         *           "estado": "APROBADO",
         *           "referencia": "Pago de prueba",
         *           "responsable": "RECURRENTE"
         *         }
         *       ]
         *     }
         */
        CuentaRecepcion: {
            codigoReserva: components["schemas"]["CodigoReserva"];
            estadoReserva: components["schemas"]["EstadoReserva"];
            estadoCuenta: components["schemas"]["EstadoCuenta"];
            nombreHuesped: string;
            detalleNoches: components["schemas"]["PrecioNoche"][];
            totalCargosVigentes: components["schemas"]["Monto"];
            totalPagosAprobados: components["schemas"]["Monto"];
            saldo: components["schemas"]["Monto"];
            facturaId: components["schemas"]["Id"] | null;
            cargos: components["schemas"]["CargoCuentaRecepcion"][];
            pagos: components["schemas"]["PagoCuentaRecepcion"][];
        };
        /**
         * @example {
         *       "concepto": "Servicio de lavandería",
         *       "cantidad": 1,
         *       "precioUnitario": 1
         *     }
         */
        AgregarCargoPeticion: {
            concepto: string;
            cantidad: number;
            precioUnitario: components["schemas"]["Monto"];
        };
        /**
         * @description Además del patrón, el backend valida el dígito verificador de Guatemala, incluyendo K.
         * @example {
         *       "nit": "CF",
         *       "nombreComprador": "Ana Morales"
         *     }
         */
        CompradorFactura: {
            /**
             * @example CF
             * @example 1234567-9
             */
            nit: string;
            nombreComprador: string;
        };
        /**
         * @description El monto no se recibe: el backend cobra exactamente el saldo completo. Si saldo=0, no enviar pago.
         * @example {
         *       "metodo": "EFECTIVO",
         *       "referencia": "Pago en recepción"
         *     }
         */
        PagoRecepcionPeticion: {
            /** @enum {string} */
            metodo: "EFECTIVO" | "TARJETA" | "OTRO";
            referencia?: string;
        };
        /**
         * @example {
         *       "comprador": {
         *         "nit": "CF",
         *         "nombreComprador": "Ana Morales"
         *       },
         *       "pago": {
         *         "metodo": "EFECTIVO",
         *         "referencia": "Pago en recepción"
         *       }
         *     }
         */
        CheckoutRecepcionPeticion: {
            comprador: components["schemas"]["CompradorFactura"];
            pago?: components["schemas"]["PagoRecepcionPeticion"];
        };
        /**
         * @description El consentimiento debe ser true si hay NUEVO o EN_PREPARACION; no acepta datos de tarjeta ni pagos de Recepción.
         * @example {
         *       "comprador": {
         *         "nit": "CF",
         *         "nombreComprador": "Ana Morales"
         *       },
         *       "aceptaCancelarPedidos": true
         *     }
         */
        CheckoutAppPeticion: {
            comprador: components["schemas"]["CompradorFactura"];
            aceptaCancelarPedidos: boolean;
        };
        /**
         * @description Recepción puede cobrar saldo positivo al confirmar. En app solo saldo exactamente 0 y ventana de salida 00:00–12:00 de Guatemala. Saldo negativo impide confirmar.
         * @example {
         *       "codigoReserva": "VS-ABC123",
         *       "saldo": 0,
         *       "nombreCompradorSugerido": "Ana Morales",
         *       "pedidoEnCamino": false,
         *       "pedidosACancelar": [
         *         12
         *       ],
         *       "puedeConfirmar": true,
         *       "motivosBloqueo": []
         *     }
         */
        VistaCheckout: {
            codigoReserva: components["schemas"]["CodigoReserva"];
            saldo: components["schemas"]["Monto"];
            nombreCompradorSugerido: string;
            pedidoEnCamino: boolean;
            pedidosACancelar: components["schemas"]["Id"][];
            puedeConfirmar: boolean;
            motivosBloqueo: string[];
        };
        /**
         * @example {
         *       "nombre": "Villa Serena",
         *       "nombreComercial": "Villa Serena",
         *       "razonSocial": "Villa Serena de demostración",
         *       "nit": "1234567-9",
         *       "direccionFiscal": "Antigua Guatemala",
         *       "telefono": "55550000",
         *       "correo": "ana@example.com"
         *     }
         */
        FacturaDatosHotel: {
            nombre: string;
            nombreComercial: string;
            razonSocial: string;
            nit: string;
            direccionFiscal: string;
            telefono: string;
            /** Format: email */
            correo: string;
        };
        /**
         * @example {
         *       "concepto": "Room Service — Pedido #12",
         *       "cantidad": 2,
         *       "precioUnitario": 25,
         *       "monto": 50
         *     }
         */
        FacturaCargo: {
            concepto: string;
            cantidad: number;
            precioUnitario: components["schemas"]["Monto"];
            monto: components["schemas"]["Monto"];
        };
        /**
         * @example {
         *       "metodo": "RECURRENTE",
         *       "monto": 50
         *     }
         */
        FacturaPago: {
            metodo: components["schemas"]["MetodoPago"];
            monto: components["schemas"]["Monto"];
        };
        /**
         * @description Snapshot inmutable. Solo cargos VIGENTE; pagos de la cuenta. Una por cuenta, correlativo sin saltos dentro del check-out.
         * @example {
         *       "id": 1,
         *       "estado": "EMITIDA",
         *       "serie": "VS-A",
         *       "numero": 1,
         *       "emitidaEn": "2026-10-02T20:30:00.000Z",
         *       "codigoReserva": "VS-7K2M9Q",
         *       "hotel": {
         *         "nombre": "Villa Serena",
         *         "nombreComercial": "Villa Serena",
         *         "razonSocial": "Villa Serena de demostración",
         *         "nit": "1234567-9",
         *         "direccionFiscal": "Antigua Guatemala",
         *         "telefono": "55550000",
         *         "correo": "ana@example.com"
         *       },
         *       "comprador": {
         *         "nit": "CF",
         *         "nombreComprador": "Ana Morales"
         *       },
         *       "cargos": [
         *         {
         *           "concepto": "Alojamiento · reserva de canal",
         *           "cantidad": 1,
         *           "precioUnitario": 1800,
         *           "monto": 1800
         *         },
         *         {
         *           "concepto": "Room Service — Pedido #12",
         *           "cantidad": 2,
         *           "precioUnitario": 25,
         *           "monto": 50
         *         }
         *       ],
         *       "pagos": [
         *         {
         *           "metodo": "CANAL",
         *           "monto": 1800
         *         },
         *         {
         *           "metodo": "RECURRENTE",
         *           "monto": 50
         *         }
         *       ],
         *       "total": 1850,
         *       "leyendaIva": "IVA incluido",
         *       "leyendaLegal": "Factura de demostración — no válida ante la SAT"
         *     }
         */
        FacturaDetalle: {
            id: components["schemas"]["Id"];
            /** @enum {string} */
            estado: "EMITIDA";
            serie: string;
            numero: number;
            emitidaEn: components["schemas"]["FechaHora"];
            codigoReserva: components["schemas"]["CodigoReserva"];
            hotel: components["schemas"]["FacturaDatosHotel"];
            comprador: components["schemas"]["CompradorFactura"];
            cargos: components["schemas"]["FacturaCargo"][];
            pagos: components["schemas"]["FacturaPago"][];
            total: components["schemas"]["Monto"];
            /** @constant */
            leyendaIva: "IVA incluido";
            /** @constant */
            leyendaLegal: "Factura de demostración — no válida ante la SAT";
        };
        /**
         * @example {
         *       "codigoReserva": "VS-ABC123",
         *       "estadoReserva": "FINALIZADA",
         *       "estadoCuenta": "CERRADA",
         *       "saldo": 0,
         *       "factura": {
         *         "id": 1,
         *         "estado": "EMITIDA",
         *         "serie": "VS-A",
         *         "numero": 1,
         *         "emitidaEn": "2026-10-02T20:30:00.000Z",
         *         "codigoReserva": "VS-7K2M9Q",
         *         "hotel": {
         *           "nombre": "Villa Serena",
         *           "nombreComercial": "Villa Serena",
         *           "razonSocial": "Villa Serena de demostración",
         *           "nit": "1234567-9",
         *           "direccionFiscal": "Antigua Guatemala",
         *           "telefono": "55550000",
         *           "correo": "ana@example.com"
         *         },
         *         "comprador": {
         *           "nit": "CF",
         *           "nombreComprador": "Ana Morales"
         *         },
         *         "cargos": [
         *           {
         *             "concepto": "Alojamiento · reserva de canal",
         *             "cantidad": 1,
         *             "precioUnitario": 1800,
         *             "monto": 1800
         *           },
         *           {
         *             "concepto": "Room Service — Pedido #12",
         *             "cantidad": 2,
         *             "precioUnitario": 25,
         *             "monto": 50
         *           }
         *         ],
         *         "pagos": [
         *           {
         *             "metodo": "CANAL",
         *             "monto": 1800
         *           },
         *           {
         *             "metodo": "RECURRENTE",
         *             "monto": 50
         *           }
         *         ],
         *         "total": 1850,
         *         "leyendaIva": "IVA incluido",
         *         "leyendaLegal": "Factura de demostración — no válida ante la SAT"
         *       }
         *     }
         */
        CheckoutResultado: {
            codigoReserva: components["schemas"]["CodigoReserva"];
            /** @enum {string} */
            estadoReserva: "FINALIZADA";
            /** @enum {string} */
            estadoCuenta: "CERRADA";
            /** @constant */
            saldo: 0;
            factura: components["schemas"]["FacturaDetalle"];
        };
        /**
         * @description URL firmada temporal de MinIO privado; emitir solo después de comprobar rol y propiedad. No requiere JWT en MinIO: la firma autoriza hasta expiraEn.
         * @example {
         *       "url": "http://localhost:9000/privado/factura-demo.pdf?firma=ejemplo",
         *       "expiraEn": "2026-10-08T16:05:00.000Z"
         *     }
         */
        DescargaFactura: {
            /** Format: uri */
            url: string;
            expiraEn: components["schemas"]["FechaHora"];
        };
        /**
         * @example {
         *       "tokenExpo": "ExpoPushToken[demostracion]"
         *     }
         */
        DispositivoPushPeticion: {
            tokenExpo: string;
        };
        /**
         * @description Identificador propio. Registro repetido del mismo token para el mismo huésped devuelve el mismo recurso.
         * @example {
         *       "id": 1
         *     }
         */
        DispositivoPushRegistrado: {
            id: components["schemas"]["Id"];
        };
        /**
         * @example {
         *       "id": 7,
         *       "nombreCompleto": "María López",
         *       "correo": "maria@villaserena.test",
         *       "telefono": "55550000",
         *       "rol": "MANTENIMIENTO_LIMPIEZA",
         *       "area": "LIMPIEZA",
         *       "estado": "ACTIVO"
         *     }
         */
        EmpleadoAdmin: {
            id: components["schemas"]["Id"];
            nombreCompleto: string;
            /**
             * Format: email
             * @description Correo laboral, identificador de autenticación. No se modifica mediante PATCH.
             */
            correo: string;
            /**
             * Format: email
             * @description Contacto personal opcional. No se utiliza para autenticación ni recuperación. En PATCH, omitir conserva el valor y null lo elimina.
             */
            correoPersonal?: string | null;
            telefono: string;
            rol: components["schemas"]["RolEmpleado"];
            area: components["schemas"]["AreaMyl"] | null;
            estado: components["schemas"]["EstadoCatalogo"];
        };
        /**
         * @description Área obligatoria solo para MANTENIMIENTO_LIMPIEZA; en los otros roles omitida o null.
         * @example {
         *       "nombreCompleto": "María López",
         *       "correo": "maria@villaserena.test",
         *       "telefono": "55550000",
         *       "rol": "MANTENIMIENTO_LIMPIEZA",
         *       "area": "LIMPIEZA"
         *     }
         */
        CrearEmpleadoPeticion: {
            nombreCompleto: string;
            /**
             * Format: email
             * @description Correo laboral, identificador de autenticación. No se modifica mediante PATCH.
             */
            correo: string;
            /**
             * Format: email
             * @description Contacto personal opcional. No se utiliza para autenticación ni recuperación. En PATCH, omitir conserva el valor y null lo elimina.
             */
            correoPersonal?: string | null;
            telefono: string;
            rol: components["schemas"]["RolEmpleado"];
            area?: components["schemas"]["AreaMyl"] | null;
        };
        /**
         * @description Correo ineditable. Validar área según el rol resultante. No permite cambiarse el rol a sí mismo.
         * @example {
         *       "nombreCompleto": "María López",
         *       "telefono": "55550000",
         *       "rol": "MANTENIMIENTO_LIMPIEZA",
         *       "area": "LIMPIEZA"
         *     }
         */
        EditarEmpleadoPeticion: {
            nombreCompleto?: string;
            /**
             * Format: email
             * @description Contacto personal opcional. No se utiliza para autenticación ni recuperación. En PATCH, omitir conserva el valor y null lo elimina.
             */
            correoPersonal?: string | null;
            telefono?: string;
            rol?: components["schemas"]["RolEmpleado"];
            area?: components["schemas"]["AreaMyl"] | null;
        };
        /**
         * @description Contraseña temporal visible solo en esta respuesta. Nunca se consulta ni se incluye en listas.
         * @example {
         *       "empleado": {
         *         "id": 7,
         *         "nombreCompleto": "María López",
         *         "correo": "maria@villaserena.test",
         *         "telefono": "55550000",
         *         "rol": "MANTENIMIENTO_LIMPIEZA",
         *         "area": "LIMPIEZA",
         *         "estado": "ACTIVO"
         *       },
         *       "contrasenaTemporal": "Demostración"
         *     }
         */
        EmpleadoCreado: {
            empleado: components["schemas"]["EmpleadoAdmin"];
            contrasenaTemporal: string;
        };
        /**
         * @example {
         *       "contrasenaTemporal": "Temporal123Demo"
         *     }
         */
        ContrasenaRestablecida: {
            contrasenaTemporal: string;
        };
        /**
         * @example {
         *       "estado": "INACTIVO"
         *     }
         */
        EstadoCatalogoPeticion: {
            estado: components["schemas"]["EstadoCatalogo"];
        };
        /**
         * @example {
         *       "clave": "tipos/suite-demo.jpg",
         *       "url": "https://d13s29erv78l4g.cloudfront.net/tipos/suite-demo.jpg",
         *       "principal": true,
         *       "orden": 0
         *     }
         */
        FotoCatalogo: {
            clave: string;
            /** Format: uri */
            url: string;
            principal: boolean;
            orden: number;
        };
        /**
         * @example {
         *       "id": 1,
         *       "nombre": "Villa Serena",
         *       "descripcion": "Descripción de demostración",
         *       "capacidad": 1,
         *       "precioBase": 1,
         *       "estado": "ACTIVO",
         *       "ajusteFinSemanaPct": 1,
         *       "fotos": [
         *         {
         *           "clave": "tipos/suite-demo.jpg",
         *           "url": "https://d13s29erv78l4g.cloudfront.net/tipos/suite-demo.jpg",
         *           "principal": true,
         *           "orden": 0
         *         }
         *       ]
         *     }
         */
        TipoHabitacionAdmin: {
            id: components["schemas"]["Id"];
            nombre: string;
            descripcion: string;
            capacidad: number;
            precioBase: components["schemas"]["Monto"];
            estado: components["schemas"]["EstadoCatalogo"];
            ajusteFinSemanaPct: number;
            fotos: components["schemas"]["FotoCatalogo"][];
        };
        /**
         * @example {
         *       "nombre": "Villa Serena",
         *       "descripcion": "Descripción de demostración",
         *       "capacidad": 1,
         *       "precioBase": 1
         *     }
         */
        CrearTipoHabitacionPeticion: {
            nombre: string;
            descripcion: string;
            capacidad: number;
            precioBase: components["schemas"]["Monto"];
        };
        /**
         * @example {
         *       "nombre": "Villa Serena",
         *       "descripcion": "Descripción de demostración",
         *       "capacidad": 1,
         *       "precioBase": 1
         *     }
         */
        EditarTipoHabitacionPeticion: {
            nombre?: string;
            descripcion?: string;
            capacidad?: number;
            precioBase?: components["schemas"]["Monto"];
        };
        /**
         * @example {
         *       "clave": "tipos/suite-demo.jpg",
         *       "principal": true,
         *       "orden": 0
         *     }
         */
        FotoTipoPeticion: {
            clave: string;
            principal: boolean;
            orden: number;
        };
        /**
         * @description Lista completa de fotos del tipo, exactamente una principal; claves creadas por carga de imágenes autorizada.
         * @example {
         *       "fotos": [
         *         {
         *           "clave": "tipos/suite-demo.jpg",
         *           "principal": true,
         *           "orden": 0
         *         }
         *       ]
         *     }
         */
        FotosTipoPeticion: {
            fotos: components["schemas"]["FotoTipoPeticion"][];
        };
        /**
         * @example {
         *       "numero": "204",
         *       "piso": 1,
         *       "tipoHabitacionId": 1
         *     }
         */
        CrearHabitacionPeticion: {
            numero: string;
            piso: number;
            tipoHabitacionId: components["schemas"]["Id"];
        };
        /**
         * @example {
         *       "numero": "204",
         *       "piso": 1,
         *       "tipoHabitacionId": 1
         *     }
         */
        EditarHabitacionPeticion: {
            numero?: string;
            piso?: number;
            tipoHabitacionId?: components["schemas"]["Id"];
        };
        /**
         * @example {
         *       "id": 1,
         *       "numero": "204",
         *       "piso": 1,
         *       "tipoHabitacionId": 1,
         *       "estado": "ACTIVO",
         *       "ocupacion": "LIBRE",
         *       "condicion": "LIMPIA"
         *     }
         */
        HabitacionAdmin: {
            id: components["schemas"]["Id"];
            numero: string;
            piso: number;
            tipoHabitacionId: components["schemas"]["Id"];
            estado: components["schemas"]["EstadoCatalogo"];
            ocupacion: components["schemas"]["OcupacionHabitacion"];
            condicion: components["schemas"]["CondicionHabitacion"];
        };
        /**
         * @example {
         *       "nombre": "Villa Serena"
         *     }
         */
        CategoriaMenuPeticion: {
            nombre: string;
        };
        /**
         * @example {
         *       "nombre": "Villa Serena",
         *       "descripcion": "Descripción de demostración",
         *       "categoriaId": 1,
         *       "precio": 1,
         *       "fotoClave": null
         *     }
         */
        CrearItemMenuPeticion: {
            nombre: string;
            descripcion: string;
            categoriaId: components["schemas"]["Id"];
            precio: components["schemas"]["Monto"];
            fotoClave?: string | null;
        };
        /**
         * @example {
         *       "nombre": "Villa Serena",
         *       "descripcion": "Descripción de demostración",
         *       "categoriaId": 1,
         *       "precio": 1,
         *       "fotoClave": null
         *     }
         */
        EditarItemMenuPeticion: {
            nombre?: string;
            descripcion?: string;
            categoriaId?: components["schemas"]["Id"];
            precio?: components["schemas"]["Monto"];
            fotoClave?: string | null;
        };
        /**
         * @example {
         *       "id": 1,
         *       "nombre": "Villa Serena",
         *       "descripcion": "Descripción de demostración",
         *       "categoriaId": 1,
         *       "precio": 1,
         *       "fotoClave": null,
         *       "disponibilidad": "DISPONIBLE",
         *       "estado": "ACTIVO"
         *     }
         */
        ItemMenuAdmin: {
            id: components["schemas"]["Id"];
            nombre: string;
            descripcion: string;
            categoriaId: components["schemas"]["Id"];
            precio: components["schemas"]["Monto"];
            fotoClave: string | null;
            /** @description URL pública de la fotografía MENU configurada por el API; nula si no hay fotografía. Campo adicional compatible con consumidores anteriores. No concede acceso a archivos privados. */
            fotoUrl?: string | null;
            disponibilidad: components["schemas"]["DisponibilidadMenu"];
            estado: components["schemas"]["EstadoCatalogo"];
        };
        /**
         * @description Fin>=inicio. tipoHabitacionIds vacío aplica a todos los tipos. Rechazar traslapes por tipo; cambios solo afectan reservas nuevas.
         * @example {
         *       "nombre": "Temporada alta",
         *       "inicio": "2026-12-01T00:00:00.000Z",
         *       "fin": "2026-12-31T00:00:00.000Z",
         *       "ajustePct": 20,
         *       "tipoHabitacionIds": [
         *         1
         *       ]
         *     }
         */
        TemporadaPeticion: {
            nombre: string;
            inicio: components["schemas"]["FechaEstadia"];
            fin: components["schemas"]["FechaEstadia"];
            ajustePct: number;
            tipoHabitacionIds: components["schemas"]["Id"][];
        };
        /**
         * @example {
         *       "id": 1,
         *       "nombre": "Villa Serena",
         *       "inicio": "2026-10-15T00:00:00.000Z",
         *       "fin": "2026-10-15T00:00:00.000Z",
         *       "ajustePct": 1,
         *       "tipoHabitacionIds": [
         *         1
         *       ]
         *     }
         */
        TemporadaAdmin: {
            id: components["schemas"]["Id"];
            nombre: string;
            inicio: components["schemas"]["FechaEstadia"];
            fin: components["schemas"]["FechaEstadia"];
            ajustePct: number;
            tipoHabitacionIds: components["schemas"]["Id"][];
        };
        /**
         * @example {
         *       "ajusteFinSemanaPct": 1
         *     }
         */
        AjusteFinSemanaPeticion: {
            ajusteFinSemanaPct: number;
        };
        /**
         * @example {
         *       "clave": "hotel/foto-demo.jpg",
         *       "orden": 0
         *     }
         */
        FotoHotelPeticion: {
            clave: string;
            orden: number;
        };
        /** @description Solo datos generales y fiscales aprobados. Se recortan espacios de los nueve campos y se normaliza el NIT (dígito verificador, K mayúscula). CF no es válido para el emisor. No admite fotos, series, correlativos, horarios ni políticas. No contiene datos fiscales por defecto. */
        InicializarHotelPeticion: {
            nombre: string;
            descripcion: string;
            direccion: string;
            telefono: string;
            /** Format: email */
            correo: string;
            nombreComercial: string;
            razonSocial: string;
            nit: string;
            direccionFiscal: string;
        };
        /**
         * @description Validar NIT fiscal. No admite serie, correlativo, horas ni política de cancelación editable.
         * @example {
         *       "nombre": "Villa Serena",
         *       "descripcion": "Descripción de demostración",
         *       "direccion": "Antigua Guatemala",
         *       "telefono": "55550000",
         *       "correo": "ana@example.com",
         *       "nombreComercial": "Villa Serena",
         *       "razonSocial": "Villa Serena de demostración",
         *       "nit": "1234567-9",
         *       "direccionFiscal": "Antigua Guatemala",
         *       "fotos": [
         *         {
         *           "clave": "hotel/foto-demo.jpg",
         *           "orden": 0
         *         }
         *       ]
         *     }
         */
        HotelAdminPeticion: {
            nombre: string;
            descripcion: string;
            direccion: string;
            telefono: string;
            /** Format: email */
            correo: string;
            nombreComercial: string;
            razonSocial: string;
            /** @example 1234567-9 */
            nit: string;
            direccionFiscal: string;
            /** @description Omitir conserva las fotos. Null no es válido. Lista vacía retira todas las asociaciones, sin borrar objetos. Cambiar claves u orden requiere If-Match vigente; claves y órdenes únicos. Las claves nuevas deben ser HOTEL y existir en almacenamiento público. */
            fotos?: components["schemas"]["FotoHotelPeticion"][];
        };
        /**
         * @example {
         *       "nombre": "Villa Serena",
         *       "descripcion": "Descripción de demostración",
         *       "direccion": "Antigua Guatemala",
         *       "telefono": "55550000",
         *       "correo": "ana@example.com",
         *       "nombreComercial": "Villa Serena",
         *       "razonSocial": "Villa Serena de demostración",
         *       "nit": "1234567-9",
         *       "direccionFiscal": "Antigua Guatemala",
         *       "fotos": [
         *         {
         *           "clave": "hotel/foto-demo.jpg",
         *           "orden": 0
         *         }
         *       ],
         *       "horaCheckIn": "15:00",
         *       "horaCheckOut": "12:00",
         *       "politicaCancelacion": "Reembolso total con al menos 48 horas antes de las 15:00 de llegada; sin reembolso después."
         *     }
         */
        HotelAdmin: {
            nombre: string;
            descripcion: string;
            direccion: string;
            telefono: string;
            /** Format: email */
            correo: string;
            nombreComercial: string;
            razonSocial: string;
            /** @example 1234567-9 */
            nit: string;
            direccionFiscal: string;
            fotos: components["schemas"]["FotoHotelPeticion"][];
            /** @description Soporta posiciones fotograficas con borradores y publicacion; no inferir compatibilidad de la presencia de ETag. */
            readonly editorFotografico?: boolean;
            /** @description Revision fuerte de fotos identica al ETag, para enviar literalmente en If-Match. */
            readonly revisionGaleria?: string;
            /** @constant */
            horaCheckIn: "15:00";
            /** @constant */
            horaCheckOut: "12:00";
            politicaCancelacion: string;
        };
        /**
         * @example {
         *       "fecha": "2026-10-15T00:00:00.000Z",
         *       "habitacionesOcupadas": 0,
         *       "habitacionesActivas": 0,
         *       "porcentaje": 0
         *     }
         */
        OcupacionHoy: {
            fecha: components["schemas"]["FechaEstadia"];
            habitacionesOcupadas: number;
            habitacionesActivas: number;
            porcentaje: number;
        };
        /**
         * @example {
         *       "canal": "DIRECTO_WEB",
         *       "cantidad": 0
         *     }
         */
        ReservasPorCanal: {
            canal: components["schemas"]["CanalOrigen"];
            cantidad: number;
        };
        /**
         * @description Ocupación siempre hoy. Ingresos=sum(pagos APROBADO del rango). Reservas por creación sin importar estado. Sin datos: cero. Rango predeterminado: mes actual de Guatemala.
         * @example {
         *       "inicio": "2026-10-15T00:00:00.000Z",
         *       "fin": "2026-10-15T00:00:00.000Z",
         *       "ocupacionHoy": {
         *         "fecha": "2026-10-15T00:00:00.000Z",
         *         "habitacionesOcupadas": 0,
         *         "habitacionesActivas": 0,
         *         "porcentaje": 0
         *       },
         *       "ingresos": 1,
         *       "reservasPorCanal": [
         *         {
         *           "canal": "DIRECTO_WEB",
         *           "cantidad": 0
         *         }
         *       ]
         *     }
         */
        Indicadores: {
            inicio: components["schemas"]["FechaEstadia"];
            fin: components["schemas"]["FechaEstadia"];
            ocupacionHoy: components["schemas"]["OcupacionHoy"];
            ingresos: components["schemas"]["Monto"];
            reservasPorCanal: components["schemas"]["ReservasPorCanal"][];
        };
        /**
         * @description El backend usa las claves configuradas del canal; nunca las entrega al navegador. Puede repetir el identificador para demostrar idempotencia.
         * @example {
         *       "canal": "BOOKING",
         *       "reserva": {
         *         "identificadorExterno": "Demostración",
         *         "tipoHabitacionId": 1,
         *         "entrada": "2026-10-15T00:00:00.000Z",
         *         "salida": "2026-10-15T00:00:00.000Z",
         *         "numeroHuespedes": 1,
         *         "montoTotal": 1,
         *         "huesped": {
         *           "nombreCompleto": "María José López",
         *           "correo": "maria.lopez@example.com",
         *           "telefono": "+502 5555 1234",
         *           "nacionalidad": "Guatemalteca",
         *           "tipoDocumento": "DPI",
         *           "numeroDocumento": "2547896320101"
         *         }
         *       }
         *     }
         */
        CanalSimuladoPeticion: {
            /** @enum {string} */
            canal: "BOOKING" | "EXPEDIA";
            reserva: components["schemas"]["ReservaCanalPeticion"];
        };
        /**
         * @description Código y cuerpo de la llamada REAL a /canal/reservas. El transporte de esta envoltura responde 200; los errores de permisos/validación del simulador usan el formato Error normal.
         * @example {
         *       "codigoHttp": 200,
         *       "respuesta": {
         *         "codigo": "VS-7K2M9Q",
         *         "estado": "PENDIENTE_PAGO",
         *         "canal": "DIRECTO_WEB",
         *         "identificadorExterno": "Demostración",
         *         "tipoHabitacion": {
         *           "id": 1,
         *           "nombre": "Doble Superior"
         *         },
         *         "entrada": "2026-10-15T00:00:00.000Z",
         *         "salida": "2026-10-15T00:00:00.000Z",
         *         "numeroHuespedes": 1,
         *         "montoTotal": 1
         *       }
         *     }
         */
        CanalSimuladoResultado: {
            /** @enum {integer} */
            codigoHttp: 200 | 201 | 400 | 401 | 409;
            respuesta: components["schemas"]["ReservaCanalRespuesta"] | components["schemas"]["Error"];
        };
        /**
         * @description Clave de objeto para asociarla al recurso. JPG/PNG hasta 5 MiB, MIME validado por contenido; fotos de incidencias privadas.
         * @example {
         *       "clave": "hotel/foto-demo.jpg"
         *     }
         */
        ImagenSubida: {
            clave: string;
        };
        SubirImagenPeticion: {
            /** Format: binary */
            archivo: string;
            /** @enum {string} */
            uso: "HOTEL" | "TIPO_HABITACION" | "MENU" | "AMENIDAD" | "INCIDENCIA";
        };
        /**
         * @example {
         *       "nombre": "Villa Serena",
         *       "descripcion": "Descripción de demostración",
         *       "fotoClave": null,
         *       "horario": "Demostración",
         *       "ubicacion": "Demostración",
         *       "orden": 0
         *     }
         */
        AmenidadPeticion: {
            nombre: string;
            descripcion?: string;
            fotoClave?: string | null;
            horario?: string;
            ubicacion?: string;
            orden?: number;
        };
        /**
         * @example {
         *       "nombre": "Villa Serena",
         *       "descripcion": "Descripción de demostración",
         *       "fotoClave": null,
         *       "horario": "Demostración",
         *       "ubicacion": "Demostración",
         *       "orden": 0
         *     }
         */
        EditarAmenidadPeticion: {
            nombre?: string;
            descripcion?: string;
            fotoClave?: string | null;
            horario?: string;
            ubicacion?: string;
            orden?: number;
        };
        /**
         * @example {
         *       "id": 1,
         *       "nombre": "Villa Serena",
         *       "descripcion": "Descripción de demostración",
         *       "fotoClave": null,
         *       "horario": "Demostración",
         *       "ubicacion": "Demostración",
         *       "orden": 0,
         *       "estado": "ACTIVO"
         *     }
         */
        AmenidadAdmin: {
            id: components["schemas"]["Id"];
            nombre: string;
            descripcion: string;
            fotoClave: string | null;
            horario: string;
            ubicacion: string;
            orden: number;
            estado: components["schemas"]["EstadoCatalogo"];
        };
        /**
         * @example {
         *       "id": 1,
         *       "nombre": "Villa Serena",
         *       "descripcion": "Descripción de demostración",
         *       "horario": "Demostración",
         *       "ubicacion": "Demostración",
         *       "orden": 0,
         *       "fotoUrl": null
         *     }
         */
        AmenidadApp: {
            id: components["schemas"]["Id"];
            nombre: string;
            descripcion: string;
            horario: string;
            ubicacion: string;
            orden: number;
            fotoUrl: string | null;
        };
        /**
         * @description Credenciales Wi-Fi para huéspedes, no credenciales del API. Solo Admin o huésped autenticado.
         * @example {
         *       "nombreRed": "VillaSerena-Huespedes",
         *       "contrasena": "EjemploWifi2026"
         *     }
         */
        Wifi: {
            nombreRed: string;
            contrasena: string;
        };
        /**
         * @description Puede cruzar medianoche. Inicio=fin no define un intervalo válido; turnos informativos, no restringen acceso.
         * @example {
         *       "nombre": "Noche",
         *       "horaInicio": "22:00",
         *       "horaFin": "06:00"
         *     }
         */
        TurnoPeticion: {
            nombre: string;
            horaInicio: string;
            horaFin: string;
        };
        /**
         * @example {
         *       "horaInicio": "21:00"
         *     }
         */
        EditarTurnoPeticion: {
            nombre?: string;
            horaInicio?: string;
            horaFin?: string;
        };
        /**
         * @example {
         *       "id": 1,
         *       "nombre": "Noche",
         *       "horaInicio": "22:00",
         *       "horaFin": "06:00",
         *       "estado": "ACTIVO"
         *     }
         */
        TurnoAdmin: {
            id: components["schemas"]["Id"];
            nombre: string;
            horaInicio: string;
            horaFin: string;
            estado: components["schemas"]["EstadoCatalogo"];
        };
        /**
         * @description Una o varias fechas. Solo empleado ACTIVO no ADMIN, turno ACTIVO. Sin traslapes del mismo empleado, incluso al cruzar medianoche.
         * @example {
         *       "empleadoId": 7,
         *       "turnoId": 1,
         *       "fechas": [
         *         "2026-10-05T00:00:00.000Z",
         *         "2026-10-06T00:00:00.000Z"
         *       ]
         *     }
         */
        AsignarTurnosPeticion: {
            empleadoId: components["schemas"]["Id"];
            turnoId: components["schemas"]["Id"];
            fechas: components["schemas"]["FechaEstadia"][];
        };
        /**
         * @example {
         *       "id": 1,
         *       "empleado": {
         *         "id": 7,
         *         "nombre": "María López"
         *       },
         *       "turno": {
         *         "id": 1,
         *         "nombre": "Noche",
         *         "horaInicio": "22:00",
         *         "horaFin": "06:00",
         *         "estado": "ACTIVO"
         *       },
         *       "fecha": "2026-10-15T00:00:00.000Z"
         *     }
         */
        AsignacionTurno: {
            id: components["schemas"]["Id"];
            empleado: components["schemas"]["ResponsableEmpleado"];
            turno: components["schemas"]["TurnoAdmin"];
            fecha: components["schemas"]["FechaEstadia"];
        };
        /** @description Stock inicial no negativo indicado al crear. Al actualizar no puede cambiar el stock directamente. No se exige nombre único ni existe desactivación. Los campos adicionales, como vencimiento, se conservan sin validación específica. */
        InsumoDatos: {
            /** @description No admite texto compuesto únicamente de espacios. */
            nombre: string;
            /** @description No admite texto compuesto únicamente de espacios. */
            categoria: string;
            /** @description No admite texto compuesto únicamente de espacios. */
            unidad: string;
            stock: number | string;
            stockMinimo: number | string;
            costoUnitario: number | string;
        } & {
            [key: string]: unknown;
        };
        /** @description Entrada suma; salida y merma restan. Se conservan los campos adicionales y los valores originales, excepto id/version internos y fecha, que fija el servidor. */
        MovimientoInventarioDatos: {
            /** Format: uuid */
            insumoId: string;
            /** @enum {string} */
            tipo: "entrada" | "salida" | "merma";
            cantidad: number | string;
            /** @description No admite texto compuesto únicamente de espacios. */
            motivo: string;
        } & {
            [key: string]: unknown;
        };
        /** @description Registrar la compra aumenta stock tanto pagada como pendiente. Calcula subtotal, impuesto del 12 % y total; ivaIncluido=true extrae el impuesto del importe. No actualiza el costoUnitario del insumo. La compra no se sobrescribe. */
        CompraInventarioDatos: {
            /** @description No admite texto compuesto únicamente de espacios. */
            numeroFactura: string;
            /** @description No admite texto compuesto únicamente de espacios. */
            proveedor: string;
            /** Format: date */
            fecha: string;
            /** Format: uuid */
            insumoId: string;
            cantidad: number | string;
            costoUnitario: number | string;
            /** @enum {string} */
            estado: "pagada" | "pendiente";
            ivaIncluido?: boolean;
        } & {
            [key: string]: unknown;
        };
        /** @description La web envía id, version y datos. version omitida toma 0. datos serializado no puede superar 64000 caracteres. id/version dentro de datos se ignoran. */
        InsumoPeticion: {
            /** Format: uuid */
            id: string;
            /**
             * @description 0 para crear o reenviar la creación; en insumos, la versión actual para actualizar.
             * @default 0
             */
            version: number;
            datos: components["schemas"]["InsumoDatos"];
        } & {
            [key: string]: unknown;
        };
        /**
         * @example {
         *       "id": "7f81edc9-cdbc-48f2-8c6a-52b9301117ac",
         *       "version": 1,
         *       "nombre": "Foco LED",
         *       "categoria": "Mantenimiento",
         *       "unidad": "Unidad",
         *       "stock": 10,
         *       "stockMinimo": 2,
         *       "costoUnitario": 15
         *     }
         */
        Insumo: {
            /** @description No admite texto compuesto únicamente de espacios. */
            nombre: string;
            /** @description No admite texto compuesto únicamente de espacios. */
            categoria: string;
            /** @description No admite texto compuesto únicamente de espacios. */
            unidad: string;
            /** @description Existencias actuales; compras y entradas pueden acumular más que el máximo permitido por movimiento. */
            stock: number | string;
            stockMinimo: number | string;
            costoUnitario: number | string;
            /** Format: uuid */
            id: string;
            version: number;
        } & {
            [key: string]: unknown;
        };
        /** @description La web envía id, version y datos. version omitida toma 0. datos serializado no puede superar 64000 caracteres. id/version dentro de datos se ignoran. */
        MovimientoInventarioPeticion: {
            /** Format: uuid */
            id: string;
            /**
             * @description 0 para crear o reenviar la creación; en insumos, la versión actual para actualizar.
             * @default 0
             */
            version: number;
            datos: components["schemas"]["MovimientoInventarioDatos"];
        } & {
            [key: string]: unknown;
        };
        /**
         * @description Respuesta plana. No incluye responsable ni stockResultante generados por el servidor; el empleado queda registrado en auditoría. GET lista solo movimientos manuales, no compras ni consumos de repuestos.
         * @example {
         *       "id": "d10b41f7-370a-4c02-a254-f653b39c069f",
         *       "version": 1,
         *       "insumoId": "7f81edc9-cdbc-48f2-8c6a-52b9301117ac",
         *       "tipo": "salida",
         *       "cantidad": 2,
         *       "motivo": "Entrega a un área",
         *       "fecha": "2026-10-19T15:00:00Z"
         *     }
         */
        MovimientoInventario: {
            /** Format: uuid */
            insumoId: string;
            /** @enum {string} */
            tipo: "entrada" | "salida" | "merma";
            cantidad: number | string;
            /** @description No admite texto compuesto únicamente de espacios. */
            motivo: string;
            /** Format: uuid */
            id: string;
            version: number;
            fecha: components["schemas"]["FechaHora"];
        } & {
            [key: string]: unknown;
        };
        /** @description La web envía id, version y datos. version omitida toma 0. datos serializado no puede superar 64000 caracteres. id/version dentro de datos se ignoran. */
        CompraInventarioPeticion: {
            /** Format: uuid */
            id: string;
            /**
             * @description 0 para crear o reenviar la creación; en insumos, la versión actual para actualizar.
             * @default 0
             */
            version: number;
            datos: components["schemas"]["CompraInventarioDatos"];
        } & {
            [key: string]: unknown;
        };
        /**
         * @example {
         *       "id": "1d92ff74-9b70-4cb1-b57f-33de75784649",
         *       "version": 1,
         *       "numeroFactura": "DEMO-001",
         *       "proveedor": "Proveedor ficticio",
         *       "fecha": "2026-10-19",
         *       "insumoId": "7f81edc9-cdbc-48f2-8c6a-52b9301117ac",
         *       "cantidad": 10,
         *       "costoUnitario": 15,
         *       "estado": "pagada",
         *       "ivaIncluido": false,
         *       "subtotal": 150,
         *       "impuesto": 18,
         *       "total": 168
         *     }
         */
        CompraInventario: {
            /** @description No admite texto compuesto únicamente de espacios. */
            numeroFactura: string;
            /** @description No admite texto compuesto únicamente de espacios. */
            proveedor: string;
            /** Format: date */
            fecha: string;
            /** Format: uuid */
            insumoId: string;
            cantidad: number | string;
            costoUnitario: number | string;
            /** @enum {string} */
            estado: "pagada" | "pendiente";
            ivaIncluido?: boolean;
            /** Format: uuid */
            id: string;
            version: number;
            subtotal: number;
            impuesto: number;
            total: number;
        } & {
            [key: string]: unknown;
        };
        /**
         * @example {
         *       "habitacionId": 4,
         *       "numero": "204",
         *       "piso": 2,
         *       "ocupacion": "LIBRE",
         *       "condicion": "SUCIA",
         *       "llegaHoy": false,
         *       "saleHoy": false,
         *       "incidenciaPendiente": false
         *     }
         */
        HabitacionEvento: {
            /**
             * Format: int64
             * @example 1
             */
            habitacionId: number;
            numero: string;
            piso: number;
            ocupacion: components["schemas"]["OcupacionHabitacion"];
            condicion: components["schemas"]["CondicionHabitacion"];
            llegaHoy: boolean;
            saleHoy: boolean;
            incidenciaPendiente: boolean;
        };
        /**
         * @example {
         *       "tipo": "NUEVO_PEDIDO",
         *       "ocurridoEn": "2026-10-08T16:00:00.000Z",
         *       "datos": {
         *         "id": 12,
         *         "creadoEn": "2026-10-08T15:00:00.000Z",
         *         "estado": "NUEVO",
         *         "items": [
         *           {
         *             "itemId": 21,
         *             "nombre": "Café de Guatemala",
         *             "cantidad": 2,
         *             "precioUnitario": 25,
         *             "subtotal": 50
         *           }
         *         ],
         *         "notas": "Sin azúcar",
         *         "total": 50,
         *         "motivoCancelacion": null,
         *         "habitacion": {
         *           "id": 4,
         *           "numero": "204",
         *           "piso": 2
         *         },
         *         "nombreHuesped": "Ana Morales",
         *         "historial": [
         *           {
         *             "estadoAnterior": null,
         *             "estadoNuevo": "NUEVO",
         *             "responsable": "Huésped",
         *             "fechaHora": "2026-10-08T15:00:00.000Z",
         *             "motivo": null
         *           }
         *         ]
         *       }
         *     }
         */
        EventoNuevoPedido: {
            /** @constant */
            tipo: "NUEVO_PEDIDO";
            ocurridoEn: components["schemas"]["FechaHora"];
            datos: components["schemas"]["PedidoRoomService"];
        };
        /**
         * @example {
         *       "tipo": "PEDIDO_ACTUALIZADO",
         *       "ocurridoEn": "2026-10-08T16:00:00.000Z",
         *       "datos": {
         *         "id": 12,
         *         "creadoEn": "2026-10-08T15:00:00.000Z",
         *         "estado": "EN_PREPARACION",
         *         "items": [
         *           {
         *             "itemId": 21,
         *             "nombre": "Café de Guatemala",
         *             "cantidad": 2,
         *             "precioUnitario": 25,
         *             "subtotal": 50
         *           }
         *         ],
         *         "notas": "Sin azúcar",
         *         "total": 50,
         *         "motivoCancelacion": null,
         *         "habitacion": {
         *           "id": 4,
         *           "numero": "204",
         *           "piso": 2
         *         },
         *         "nombreHuesped": "Ana Morales",
         *         "historial": [
         *           {
         *             "estadoAnterior": null,
         *             "estadoNuevo": "NUEVO",
         *             "responsable": "Huésped",
         *             "fechaHora": "2026-10-08T15:00:00.000Z",
         *             "motivo": null
         *           }
         *         ]
         *       }
         *     }
         */
        EventoEstadoPedidoRoomService: {
            /** @constant */
            tipo: "PEDIDO_ACTUALIZADO";
            ocurridoEn: components["schemas"]["FechaHora"];
            datos: components["schemas"]["PedidoRoomService"];
        };
        /**
         * @example {
         *       "tipo": "PEDIDO_ACTUALIZADO",
         *       "ocurridoEn": "2026-10-08T16:00:00.000Z",
         *       "datos": {
         *         "id": 12,
         *         "codigoReserva": "VS-ABC123",
         *         "creadoEn": "2026-10-08T15:00:00.000Z",
         *         "estado": "EN_PREPARACION",
         *         "items": [
         *           {
         *             "itemId": 21,
         *             "nombre": "Café de Guatemala",
         *             "cantidad": 2,
         *             "precioUnitario": 25,
         *             "subtotal": 50
         *           }
         *         ],
         *         "notas": "Sin azúcar",
         *         "total": 50,
         *         "motivoCancelacion": null
         *       }
         *     }
         */
        EventoEstadoPedidoHuesped: {
            /** @constant */
            tipo: "PEDIDO_ACTUALIZADO";
            ocurridoEn: components["schemas"]["FechaHora"];
            datos: components["schemas"]["PedidoHuesped"];
        };
        /**
         * @example {
         *       "tipo": "NUEVA_SOLICITUD",
         *       "ocurridoEn": "2026-10-08T16:00:00.000Z",
         *       "datos": {
         *         "id": 8,
         *         "tipo": "ARTICULOS",
         *         "creadaEn": "2026-10-08T15:00:00.000Z",
         *         "estado": "PENDIENTE",
         *         "comentario": null,
         *         "articulos": [
         *           {
         *             "articuloId": 1,
         *             "nombre": "Toalla de baño",
         *             "cantidad": 2
         *           }
         *         ],
         *         "habitacion": {
         *           "id": 4,
         *           "numero": "204",
         *           "piso": 2
         *         },
         *         "empleadoACargo": null
         *       }
         *     }
         */
        EventoNuevaSolicitud: {
            /** @constant */
            tipo: "NUEVA_SOLICITUD";
            ocurridoEn: components["schemas"]["FechaHora"];
            datos: components["schemas"]["SolicitudLimpieza"];
        };
        /**
         * @example {
         *       "tipo": "HABITACION_ACTUALIZADA",
         *       "ocurridoEn": "2026-10-08T16:00:00.000Z",
         *       "datos": {
         *         "habitacionId": 4,
         *         "numero": "204",
         *         "piso": 2,
         *         "ocupacion": "LIBRE",
         *         "condicion": "SUCIA",
         *         "llegaHoy": false,
         *         "saleHoy": false,
         *         "incidenciaPendiente": false
         *       }
         *     }
         */
        EventoHabitacion: {
            /** @constant */
            tipo: "HABITACION_ACTUALIZADA";
            ocurridoEn: components["schemas"]["FechaHora"];
            datos: components["schemas"]["HabitacionEvento"];
        };
    };
    responses: {
        /** @description Datos inválidos o incompletos. */
        BadRequest: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                /**
                 * @example {
                 *       "codigo": "DATOS_INVALIDOS",
                 *       "mensaje": "Los datos enviados no son válidos.",
                 *       "detalles": [
                 *         {
                 *           "campo": "correo",
                 *           "mensaje": "El correo no tiene un formato válido."
                 *         }
                 *       ]
                 *     }
                 */
                "application/json": components["schemas"]["Error"];
            };
        };
        /** @description Sin sesión, token vencido o credenciales incorrectas. */
        Unauthorized: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                /**
                 * @example {
                 *       "codigo": "NO_AUTENTICADO",
                 *       "mensaje": "Debes iniciar sesión para continuar.",
                 *       "detalles": []
                 *     }
                 */
                "application/json": components["schemas"]["Error"];
            };
        };
        /** @description El usuario no tiene permiso para esta acción. */
        Forbidden: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                /**
                 * @example {
                 *       "codigo": "ACCESO_DENEGADO",
                 *       "mensaje": "Acceso denegado.",
                 *       "detalles": []
                 *     }
                 */
                "application/json": components["schemas"]["Error"];
            };
        };
        /** @description El recurso no existe o no pertenece al usuario. */
        NotFound: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                /**
                 * @example {
                 *       "codigo": "NO_ENCONTRADO",
                 *       "mensaje": "No se encontró el recurso solicitado.",
                 *       "detalles": []
                 *     }
                 */
                "application/json": components["schemas"]["Error"];
            };
        };
        /** @description La acción no es válida en el estado actual del recurso. */
        Conflict: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                /**
                 * @example {
                 *       "codigo": "ESTADO_INVALIDO",
                 *       "mensaje": "La acción no se puede realizar en el estado actual.",
                 *       "detalles": []
                 *     }
                 */
                "application/json": components["schemas"]["Error"];
            };
        };
        /** @description La reserva no se puede cancelar (no está confirmada o es de canal externo). */
        ConflictoCancelacion: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                /**
                 * @example {
                 *       "codigo": "CANAL_NO_CANCELABLE",
                 *       "mensaje": "Las reservas de canal no se cancelan desde el sistema.",
                 *       "detalles": []
                 *     }
                 */
                "application/json": components["schemas"]["Error"];
            };
        };
    };
    parameters: {
        /** @description Identificador guardado antes de crear; nunca sustituirlo tras una respuesta perdida. */
        BookingIdempotencyKey: string;
        BookingDraft: string;
        /** @description Comprobante secreto de verificación del correo para ese borrador; nunca ponerlo en URLs ni logs. */
        BookingEmailVerification: string;
        IdPath: components["schemas"]["Id"];
        /**
         * @description Código de la reserva.
         * @example VS-7K2M9Q
         */
        CodigoReservaPath: components["schemas"]["CodigoReserva"];
        /**
         * @description Fecha de entrada (YYYY-MM-DD).
         * @example 2026-10-15
         */
        Entrada: components["schemas"]["FechaEstadia"];
        /**
         * @description Fecha de salida (YYYY-MM-DD).
         * @example 2026-10-17
         */
        Salida: components["schemas"]["FechaEstadia"];
        /**
         * @description Número de huéspedes.
         * @example 2
         */
        Huespedes: number;
    };
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    iniciarSesion: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "correo": "ana.perez@villaserena.test",
                 *       "contrasena": "Temporal123"
                 *     }
                 */
                "application/json": components["schemas"]["LoginPeticion"];
            };
        };
        responses: {
            /** @description Sesión iniciada. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "accessToken": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMiJ9.firma",
                     *       "refreshToken": "3f8a1c9e-6b2d-4f7a-9c11-0d5e8b7a2f44",
                     *       "tipoToken": "Bearer",
                     *       "expiraEn": 900,
                     *       "empleado": {
                     *         "id": 12,
                     *         "nombre": "Ana Pérez",
                     *         "correo": "ana.perez@villaserena.test",
                     *         "rol": "RECEPCION",
                     *         "area": null,
                     *         "debeCambiarContrasena": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["SesionEmpleado"];
                };
            };
            400: components["responses"]["BadRequest"];
            /** @description Credenciales incorrectas, empleado inactivo o cuenta bloqueada. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    renovarSesion: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "refreshToken": "3f8a1c9e-6b2d-4f7a-9c11-0d5e8b7a2f44"
                 *     }
                 */
                "application/json": components["schemas"]["RefreshPeticion"];
            };
        };
        responses: {
            /** @description Tokens renovados. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "accessToken": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMiJ9.nueva",
                     *       "refreshToken": "9b0c2d7e-1a4f-4e3b-8c6d-5f7a9e1b3c20",
                     *       "tipoToken": "Bearer",
                     *       "expiraEn": 900
                     *     }
                     */
                    "application/json": components["schemas"]["Tokens"];
                };
            };
            400: components["responses"]["BadRequest"];
            /** @description Refresh token inválido, vencido, ya usado o del empleado inactivo. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "codigo": "SESION_VENCIDA",
                     *       "mensaje": "Tu sesión venció. Inicia sesión de nuevo.",
                     *       "detalles": []
                     *     }
                     */
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    cerrarSesion: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "refreshToken": "9b0c2d7e-1a4f-4e3b-8c6d-5f7a9e1b3c20"
                 *     }
                 */
                "application/json": components["schemas"]["RefreshPeticion"];
            };
        };
        responses: {
            /** @description Sesión cerrada (también si el refresh ya estaba revocado). */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
        };
    };
    cambiarContrasena: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "contrasenaActual": "Temporal123",
                 *       "contrasenaNueva": "VillaSerena2026",
                 *       "confirmacion": "VillaSerena2026"
                 *     }
                 */
                "application/json": components["schemas"]["CambiarContrasenaPeticion"];
            };
        };
        responses: {
            /** @description Contraseña cambiada; nuevos tokens. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "accessToken": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMiJ9.otra",
                     *       "refreshToken": "7c1e5a3b-2d9f-4b6a-a8e0-4c3b2a1f0e99",
                     *       "tipoToken": "Bearer",
                     *       "expiraEn": 900,
                     *       "empleado": {
                     *         "id": 12,
                     *         "nombre": "Ana Pérez",
                     *         "correo": "ana.perez@villaserena.test",
                     *         "rol": "RECEPCION",
                     *         "area": null,
                     *         "debeCambiarContrasena": false
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["SesionEmpleado"];
                };
            };
            /** @description La contraseña actual es incorrecta, la confirmación no coincide o la nueva no cumple las reglas. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
        };
    };
    obtenerSesionActual: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Empleado de la sesión. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": 31,
                     *       "nombre": "Luis García",
                     *       "correo": "luis.garcia@villaserena.test",
                     *       "rol": "MANTENIMIENTO_LIMPIEZA",
                     *       "area": "LIMPIEZA",
                     *       "debeCambiarContrasena": false
                     *     }
                     */
                    "application/json": components["schemas"]["EmpleadoSesion"];
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
        };
    };
    obtenerHotel: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Información pública del hotel. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "nombre": "Villa Serena",
                     *       "descripcion": "Hotel boutique de 12 habitaciones en el corazón de Antigua Guatemala.",
                     *       "fotos": [
                     *         "http://localhost:9000/villa-serena-publico/hotel/fachada.jpg",
                     *         "http://localhost:9000/villa-serena-publico/hotel/jardin.jpg"
                     *       ],
                     *       "ubicacion": {
                     *         "direccion": "5a Avenida Norte 12, Antigua Guatemala, Sacatepéquez"
                     *       },
                     *       "contacto": {
                     *         "telefono": "+502 7832 0000",
                     *         "correo": "reservas@villaserena.test"
                     *       },
                     *       "horaCheckIn": "15:00",
                     *       "horaCheckOut": "12:00"
                     *     }
                     */
                    "application/json": components["schemas"]["Hotel"];
                };
            };
        };
    };
    listarTiposHabitacionPublicos: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Tipos de habitación activos. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example [
                     *       {
                     *         "id": 1,
                     *         "nombre": "Doble Superior",
                     *         "descripcion": "Dos camas matrimoniales con vista al jardín.",
                     *         "capacidad": 4,
                     *         "precioBaseNoche": 850,
                     *         "fotos": [
                     *           "https://d13s29erv78l4g.cloudfront.net/tipos/1/principal.jpg"
                     *         ]
                     *       },
                     *       {
                     *         "id": 2,
                     *         "nombre": "Suite Volcán",
                     *         "descripcion": "Cama king, terraza privada y vista al Volcán de Agua.",
                     *         "capacidad": 2,
                     *         "precioBaseNoche": 1450,
                     *         "fotos": []
                     *       }
                     *     ]
                     */
                    "application/json": components["schemas"]["TipoHabitacionPublico"][];
                };
            };
        };
    };
    obtenerTipoHabitacionPublico: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: components["parameters"]["IdPath"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Detalle del tipo con todas sus fotos. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": 1,
                     *       "nombre": "Doble Superior",
                     *       "descripcion": "Dos camas matrimoniales con vista al jardín.",
                     *       "capacidad": 4,
                     *       "precioBaseNoche": 850,
                     *       "fotos": [
                     *         "https://d13s29erv78l4g.cloudfront.net/tipos/1/principal.jpg",
                     *         "https://d13s29erv78l4g.cloudfront.net/tipos/1/bano.jpg"
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["TipoHabitacionPublico"];
                };
            };
            400: components["responses"]["BadRequest"];
            404: components["responses"]["NotFound"];
        };
    };
    buscarDisponibilidadPublica: {
        parameters: {
            query: {
                /**
                 * @description Fecha de entrada (YYYY-MM-DD).
                 * @example 2026-10-15
                 */
                entrada: components["parameters"]["Entrada"];
                /**
                 * @description Fecha de salida (YYYY-MM-DD).
                 * @example 2026-10-17
                 */
                salida: components["parameters"]["Salida"];
                /**
                 * @description Número de huéspedes.
                 * @example 2
                 */
                huespedes: components["parameters"]["Huespedes"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Tipos disponibles con su precio total y el desglose por noche. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example [
                     *       {
                     *         "tipoHabitacion": {
                     *           "id": 1,
                     *           "nombre": "Doble Superior",
                     *           "descripcion": "Dos camas matrimoniales con vista al jardín.",
                     *           "capacidad": 4,
                     *           "precioBaseNoche": 850,
                     *           "fotos": [
                     *             "https://d13s29erv78l4g.cloudfront.net/tipos/1/principal.jpg"
                     *           ]
                     *         },
                     *         "noches": 2,
                     *         "total": 1912.5,
                     *         "desglose": [
                     *           {
                     *             "fecha": "2026-10-15",
                     *             "precio": 850,
                     *             "temporada": null,
                     *             "finDeSemana": false
                     *           },
                     *           {
                     *             "fecha": "2026-10-16",
                     *             "precio": 1062.5,
                     *             "temporada": null,
                     *             "finDeSemana": true
                     *           }
                     *         ]
                     *       }
                     *     ]
                     */
                    "application/json": components["schemas"]["OpcionDisponiblePublica"][];
                };
            };
            /** @description Las fechas o el número de huéspedes no cumplen las reglas. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "codigo": "FECHAS_INVALIDAS",
                     *       "mensaje": "La estadía debe ser de 1 a 30 noches.",
                     *       "detalles": [
                     *         {
                     *           "campo": "salida",
                     *           "mensaje": "La estadía debe ser de 1 a 30 noches."
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    listarOfertasPublicas: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Catálogo completo; puede estar vacío. Incluye ofertas con bookable=false. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example [
                     *       {
                     *         "slug": "estandar-jardin",
                     *         "name": "Estándar Jardín",
                     *         "type": "Estándar",
                     *         "floor": 1,
                     *         "apiTypeId": 3,
                     *         "price": 420,
                     *         "capacity": 2,
                     *         "beds": "1 cama queen",
                     *         "size": 27,
                     *         "image": "/images/catalogo-aprobado/ejemplo.jpg",
                     *         "gallery": [
                     *           "/images/catalogo-aprobado/ejemplo.jpg"
                     *         ],
                     *         "description": "Habitación con vista al jardín.",
                     *         "features": [
                     *           "Vista al jardín",
                     *           "Wi-Fi incluido"
                     *         ],
                     *         "preferences": [
                     *           "Descanso"
                     *         ],
                     *         "bookable": true,
                     *         "illustrativePhotos": true,
                     *         "verifiedFeatures": [
                     *           "Vista al jardín",
                     *           "Wi-Fi incluido"
                     *         ],
                     *         "inventoryNote": "1 cama queen · Hasta 2 huéspedes · Piso 1"
                     *       }
                     *     ]
                     */
                    "application/json": components["schemas"]["OfertaPublica"][];
                };
            };
        };
    };
    buscarDisponibilidadOfertasPublicas: {
        parameters: {
            query: {
                /**
                 * @description Fecha de entrada (YYYY-MM-DD).
                 * @example 2026-10-15
                 */
                entrada: components["parameters"]["Entrada"];
                /**
                 * @description Fecha de salida (YYYY-MM-DD).
                 * @example 2026-10-17
                 */
                salida: components["parameters"]["Salida"];
                /**
                 * @description Número de huéspedes.
                 * @example 2
                 */
                huespedes: components["parameters"]["Huespedes"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Ofertas disponibles, en orden de catálogo, con total en GTQ y desglose por noche. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example [
                     *       {
                     *         "ofertaSlug": "estandar-jardin",
                     *         "inventarioCompartido": "tipo-3",
                     *         "tipoHabitacion": {
                     *           "id": 3,
                     *           "nombre": "Estándar Jardín",
                     *           "descripcion": "Habitación con vista al jardín.",
                     *           "capacidad": 2,
                     *           "precioBaseNoche": 420,
                     *           "fotos": [
                     *             "/images/catalogo-aprobado/ejemplo.jpg"
                     *           ]
                     *         },
                     *         "noches": 2,
                     *         "total": 840,
                     *         "desglose": [
                     *           {
                     *             "fecha": "2026-10-15",
                     *             "precio": 420,
                     *             "temporada": null,
                     *             "finDeSemana": false
                     *           },
                     *           {
                     *             "fecha": "2026-10-16",
                     *             "precio": 420,
                     *             "temporada": null,
                     *             "finDeSemana": false
                     *           }
                     *         ]
                     *       }
                     *     ]
                     */
                    "application/json": components["schemas"]["OpcionOfertaDisponible"][];
                };
            };
            /** @description Parámetro ausente o mal formado, FECHAS_INVALIDAS o DATOS_INVALIDOS. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "codigo": "DATOS_INVALIDOS",
                     *       "mensaje": "Los datos enviados no son válidos.",
                     *       "detalles": [
                     *         {
                     *           "campo": "huespedes",
                     *           "mensaje": "Debe haber al menos un huésped."
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    crearReservaWeb: {
        parameters: {
            query?: never;
            header: {
                /**
                 * @description Identificador del intento. Repetir los mismos datos devuelve la reserva original; cambiar hora u otro dato devuelve 409 BOOKING_REQUEST_CONFLICT.
                 * @example reserva-ejemplo-0001
                 */
                "Idempotency-Key": string;
                /** @description Borrador verificado, obligatorio para una nueva reserva y para recuperar reenvíos con verificación asociada. Puede omitirse en reenvíos históricos sin verificación. */
                "X-Booking-Draft"?: string;
                /** @description Comprobante vigente del correo y borrador. Obligatorio para nuevas reservas; no se omite al usar hora opcional. Los reenvíos históricos sin verificación conservan su compatibilidad. */
                "X-Booking-Email-Verification"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "tipoHabitacionId": 1,
                 *       "entrada": "2026-10-15",
                 *       "salida": "2026-10-17",
                 *       "numeroHuespedes": 2,
                 *       "huesped": {
                 *         "nombreCompleto": "María José López",
                 *         "correo": "maria.lopez@example.com",
                 *         "telefono": "+502 5555 1234",
                 *         "tipoDocumento": "DPI",
                 *         "numeroDocumento": "2547896320101"
                 *       },
                 *       "horaEstimadaLlegada": "18:30"
                 *     }
                 */
                "application/json": components["schemas"]["ReservaWebPeticion"];
            };
        };
        responses: {
            /** @description Reserva creada, pendiente de pago. */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "codigo": "VS-7K2M9Q",
                     *       "estado": "PENDIENTE_PAGO",
                     *       "tipoHabitacion": {
                     *         "id": 1,
                     *         "nombre": "Doble Superior"
                     *       },
                     *       "entrada": "2026-10-15",
                     *       "salida": "2026-10-17",
                     *       "noches": 2,
                     *       "numeroHuespedes": 2,
                     *       "total": 1912.5,
                     *       "pagoVenceEn": "2026-10-02T15:00:00-06:00"
                     *     }
                     */
                    "application/json": components["schemas"]["ReservaWebCreada"];
                };
            };
            400: components["responses"]["BadRequest"];
            /** @description CORREO_NO_VERIFICADO: falta verificación vigente para crear la reserva. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description No se autoriza recuperar un intento con la verificación presentada. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description Sin disponibilidad o datos distintos para la misma clave idempotente (BOOKING_REQUEST_CONFLICT). */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    crearReservaWebOferta: {
        parameters: {
            query?: never;
            header: {
                /**
                 * @description Identificador del intento. Repetir los mismos datos devuelve la reserva original; cambiar hora u otro dato devuelve 409 BOOKING_REQUEST_CONFLICT.
                 * @example reserva-ejemplo-0001
                 */
                "Idempotency-Key": string;
                /** @description Borrador verificado, obligatorio para una nueva reserva y para recuperar reenvíos con verificación asociada. Puede omitirse en reenvíos históricos sin verificación. */
                "X-Booking-Draft"?: string;
                /** @description Comprobante vigente del correo y borrador. Obligatorio para nuevas reservas; no se omite al usar hora opcional. Los reenvíos históricos sin verificación conservan su compatibilidad. */
                "X-Booking-Email-Verification"?: string;
            };
            path: {
                /** @example estandar-jardin */
                slug: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "tipoHabitacionId": 1,
                 *       "entrada": "2026-10-15",
                 *       "salida": "2026-10-17",
                 *       "numeroHuespedes": 2,
                 *       "huesped": {
                 *         "nombreCompleto": "María José López",
                 *         "correo": "maria.lopez@example.com",
                 *         "telefono": "+502 5555 1234",
                 *         "tipoDocumento": "DPI",
                 *         "numeroDocumento": "2547896320101"
                 *       },
                 *       "horaEstimadaLlegada": "18:30"
                 *     }
                 */
                "application/json": components["schemas"]["ReservaWebPeticion"];
            };
        };
        responses: {
            /** @description Reserva creada, pendiente de pago. */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "codigo": "VS-7K2M9Q",
                     *       "estado": "PENDIENTE_PAGO",
                     *       "tipoHabitacion": {
                     *         "id": 1,
                     *         "nombre": "Doble Superior"
                     *       },
                     *       "entrada": "2026-10-15",
                     *       "salida": "2026-10-17",
                     *       "noches": 2,
                     *       "numeroHuespedes": 2,
                     *       "total": 1912.5,
                     *       "pagoVenceEn": "2026-10-02T15:00:00-06:00"
                     *     }
                     */
                    "application/json": components["schemas"]["ReservaWebCreada"];
                };
            };
            400: components["responses"]["BadRequest"];
            /** @description CORREO_NO_VERIFICADO: falta verificación vigente para crear la reserva. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description No se autoriza recuperar un intento con la verificación presentada. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description Sin disponibilidad o datos distintos para la misma clave idempotente (BOOKING_REQUEST_CONFLICT). También OFERTA_NO_ENCONTRADA u OFERTA_INCOMPATIBLE. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    iniciarPagoReserva: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /**
                 * @description Código de la reserva.
                 * @example VS-7K2M9Q
                 */
                codigo: components["parameters"]["CodigoReservaPath"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Enlace de la página de pago de Recurrente. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "urlPago": "https://app.recurrente.com/checkout-session/ch_a1B2c3D4",
                     *       "expiraEn": "2026-10-02T15:00:00-06:00"
                     *     }
                     */
                    "application/json": components["schemas"]["PagoIniciado"];
                };
            };
            400: components["responses"]["BadRequest"];
            404: components["responses"]["NotFound"];
            /** @description La reserva ya no está pendiente de pago. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "codigo": "RESERVA_NO_PENDIENTE",
                     *       "mensaje": "La reserva ya no está pendiente de pago.",
                     *       "detalles": []
                     *     }
                     */
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description ERROR_PASARELA; no se pudo verificar o completar la operación. */
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    obtenerEstadoReservaPublica: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /**
                 * @description Código de la reserva.
                 * @example VS-7K2M9Q
                 */
                codigo: components["parameters"]["CodigoReservaPath"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Estado actual. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EstadoReservaPublico"];
                };
            };
            400: components["responses"]["BadRequest"];
            404: components["responses"]["NotFound"];
        };
    };
    recibirWebhookRecurrente: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "id": "in_ejemplo",
                 *       "type": "payment",
                 *       "event_type": "intent.succeeded",
                 *       "status": "succeeded",
                 *       "checkout": {
                 *         "id": "ch_ejemplo",
                 *         "status": "paid"
                 *       }
                 *     }
                 */
                "application/json": components["schemas"]["EventoRecurrente"];
            };
        };
        responses: {
            /** @description Evento recibido (también si ya se había procesado o se ignora). */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description FIRMA_INVALIDA (cabeceras, firma o timestamp inválidos) o EVENTO_INVALIDO (cuerpo inválido). */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "codigo": "FIRMA_INVALIDA",
                     *       "mensaje": "La firma del aviso de Recurrente no es válida.",
                     *       "detalles": []
                     *     }
                     */
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description PAGO_NO_COINCIDE; importe o moneda no coinciden con el pago registrado. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description ERROR_PASARELA; no se pudo consultar/conciliar el checkout. No se aprueba el pago. */
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    crearReservaCanal: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "identificadorExterno": "BK-99887766",
                 *       "tipoHabitacionId": 2,
                 *       "entrada": "2026-11-03",
                 *       "salida": "2026-11-06",
                 *       "numeroHuespedes": 2,
                 *       "montoTotal": 4350,
                 *       "huesped": {
                 *         "nombreCompleto": "John Smith",
                 *         "correo": "john.smith@example.com",
                 *         "telefono": "+1 555 0100",
                 *         "nacionalidad": "Estadounidense",
                 *         "tipoDocumento": "PASAPORTE",
                 *         "numeroDocumento": "567890123"
                 *       }
                 *     }
                 */
                "application/json": components["schemas"]["ReservaCanalPeticion"];
            };
        };
        responses: {
            /** @description La reserva ya existía (mismo canal e identificador externo); no se creó otra. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "codigo": "VS-Q4R8T2",
                     *       "estado": "CONFIRMADA",
                     *       "canal": "BOOKING",
                     *       "identificadorExterno": "BK-99887766",
                     *       "tipoHabitacion": {
                     *         "id": 2,
                     *         "nombre": "Suite Volcán"
                     *       },
                     *       "entrada": "2026-11-03",
                     *       "salida": "2026-11-06",
                     *       "numeroHuespedes": 2,
                     *       "montoTotal": 4350
                     *     }
                     */
                    "application/json": components["schemas"]["ReservaCanalRespuesta"];
                };
            };
            /** @description Reserva creada. */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "codigo": "VS-Q4R8T2",
                     *       "estado": "CONFIRMADA",
                     *       "canal": "BOOKING",
                     *       "identificadorExterno": "BK-99887766",
                     *       "tipoHabitacion": {
                     *         "id": 2,
                     *         "nombre": "Suite Volcán"
                     *       },
                     *       "entrada": "2026-11-03",
                     *       "salida": "2026-11-06",
                     *       "numeroHuespedes": 2,
                     *       "montoTotal": 4350
                     *     }
                     */
                    "application/json": components["schemas"]["ReservaCanalRespuesta"];
                };
            };
            /** @description Faltan datos o no cumplen las reglas. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "codigo": "DATOS_INVALIDOS",
                     *       "mensaje": "El número de huéspedes supera la capacidad del tipo de habitación.",
                     *       "detalles": [
                     *         {
                     *           "campo": "numeroHuespedes",
                     *           "mensaje": "La capacidad máxima de Suite Volcán es 2."
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description El canal no existe o la clave es incorrecta. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "codigo": "CANAL_NO_AUTORIZADO",
                     *       "mensaje": "Canal o clave incorrectos.",
                     *       "detalles": []
                     *     }
                     */
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description No hay disponibilidad. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "codigo": "SIN_DISPONIBILIDAD",
                     *       "mensaje": "No hay habitaciones disponibles de ese tipo para esas fechas.",
                     *       "detalles": []
                     *     }
                     */
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    buscarHuespedes: {
        parameters: {
            query: {
                /**
                 * @description Texto a buscar (mínimo 2 caracteres).
                 * @example lópez
                 */
                q: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Huéspedes encontrados. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example [
                     *       {
                     *         "id": 45,
                     *         "nombreCompleto": "María José López",
                     *         "correo": "maria.lopez@example.com",
                     *         "telefono": "+502 5555 1234",
                     *         "nacionalidad": "Guatemalteca",
                     *         "tipoDocumento": "DPI",
                     *         "numeroDocumento": "2547896320101"
                     *       }
                     *     ]
                     */
                    "application/json": components["schemas"]["Huesped"][];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
        };
    };
    registrarHuesped: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "nombreCompleto": "María José López",
                 *       "correo": "maria.lopez@example.com",
                 *       "telefono": "+502 5555 1234",
                 *       "tipoDocumento": "DPI",
                 *       "numeroDocumento": "2547896320101"
                 *     }
                 */
                "application/json": components["schemas"]["HuespedDatos"];
            };
        };
        responses: {
            /** @description Ya existía un huésped con ese correo; se devuelve su perfil sin cambios. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "yaExistia": true,
                     *       "huesped": {
                     *         "id": 45,
                     *         "nombreCompleto": "María José López",
                     *         "correo": "maria.lopez@example.com",
                     *         "telefono": "+502 5555 1234",
                     *         "nacionalidad": "Guatemalteca",
                     *         "tipoDocumento": "DPI",
                     *         "numeroDocumento": "2547896320101"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["RegistroHuespedRespuesta"];
                };
            };
            /** @description Huésped nuevo registrado. */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "yaExistia": false,
                     *       "huesped": {
                     *         "id": 45,
                     *         "nombreCompleto": "María José López",
                     *         "correo": "maria.lopez@example.com",
                     *         "telefono": "+502 5555 1234",
                     *         "nacionalidad": "Guatemalteca",
                     *         "tipoDocumento": "DPI",
                     *         "numeroDocumento": "2547896320101"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["RegistroHuespedRespuesta"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
        };
    };
    buscarDisponibilidadRecepcion: {
        parameters: {
            query: {
                /**
                 * @description Fecha de entrada (YYYY-MM-DD).
                 * @example 2026-10-15
                 */
                entrada: components["parameters"]["Entrada"];
                /**
                 * @description Fecha de salida (YYYY-MM-DD).
                 * @example 2026-10-17
                 */
                salida: components["parameters"]["Salida"];
                /**
                 * @description Número de huéspedes.
                 * @example 2
                 */
                huespedes: components["parameters"]["Huespedes"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Tipos disponibles. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example [
                     *       {
                     *         "tipoHabitacion": {
                     *           "id": 1,
                     *           "nombre": "Doble Superior"
                     *         },
                     *         "capacidad": 4,
                     *         "habitacionesDisponibles": 3,
                     *         "noches": 2,
                     *         "total": 1912.5,
                     *         "desglose": [
                     *           {
                     *             "fecha": "2026-10-15",
                     *             "precio": 850,
                     *             "temporada": null,
                     *             "finDeSemana": false
                     *           },
                     *           {
                     *             "fecha": "2026-10-16",
                     *             "precio": 1062.5,
                     *             "temporada": null,
                     *             "finDeSemana": true
                     *           }
                     *         ]
                     *       }
                     *     ]
                     */
                    "application/json": components["schemas"]["OpcionDisponibleRecepcion"][];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
        };
    };
    buscarReservas: {
        parameters: {
            query?: {
                /**
                 * @description Nombre del huésped principal o número de documento.
                 * @example lópez
                 */
                texto?: string;
                codigo?: components["schemas"]["CodigoReserva"];
                desde?: components["schemas"]["FechaEstadia"];
                hasta?: components["schemas"]["FechaEstadia"];
                estado?: components["schemas"]["EstadoReserva"];
                canal?: components["schemas"]["CanalOrigen"];
                /** @description Filtro rápido; si se envía, se combina con los demás. */
                rapido?: "LLEGAN_HOY" | "SALEN_HOY";
                /** @description Página, empezando en 0. */
                page?: number;
                /** @description Tamaño de página. */
                size?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Página de resultados (vacía si no hay coincidencias). */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "contenido": [
                     *         {
                     *           "codigo": "VS-Q4R8T2",
                     *           "huespedPrincipal": {
                     *             "id": 52,
                     *             "nombreCompleto": "John Smith"
                     *           },
                     *           "entrada": "2026-11-03",
                     *           "salida": "2026-11-06",
                     *           "noches": 3,
                     *           "numeroHuespedes": 2,
                     *           "tipoHabitacion": {
                     *             "id": 2,
                     *             "nombre": "Suite Volcán"
                     *           },
                     *           "habitacion": null,
                     *           "estado": "CONFIRMADA",
                     *           "canal": "BOOKING",
                     *           "identificadorExterno": "BK-99887766",
                     *           "total": 4350,
                     *           "saldoPendiente": 0
                     *         }
                     *       ],
                     *       "page": 0,
                     *       "size": 20,
                     *       "totalElementos": 1,
                     *       "totalPaginas": 1
                     *     }
                     */
                    "application/json": components["schemas"]["PaginaReservas"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
        };
    };
    crearReservaRecepcion: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "huespedId": 45,
                 *       "tipoHabitacionId": 1,
                 *       "entrada": "2026-10-15",
                 *       "salida": "2026-10-17",
                 *       "numeroHuespedes": 2,
                 *       "habitacionId": 3
                 *     }
                 */
                "application/json": components["schemas"]["ReservaRecepcionPeticion"];
            };
        };
        responses: {
            /** @description Reserva creada y confirmada. */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "codigo": "VS-H3N8P1",
                     *       "horaEstimadaLlegada": null,
                     *       "estado": "CONFIRMADA",
                     *       "canal": "RECEPCION",
                     *       "identificadorExterno": null,
                     *       "entrada": "2026-10-15",
                     *       "salida": "2026-10-17",
                     *       "noches": 2,
                     *       "numeroHuespedes": 2,
                     *       "tipoHabitacion": {
                     *         "id": 1,
                     *         "nombre": "Doble Superior"
                     *       },
                     *       "habitacion": {
                     *         "id": 3,
                     *         "numero": "103",
                     *         "piso": 1
                     *       },
                     *       "huesped": {
                     *         "id": 45,
                     *         "nombreCompleto": "María José López",
                     *         "correo": "maria.lopez@example.com",
                     *         "telefono": "+502 5555 1234",
                     *         "nacionalidad": "Guatemalteca",
                     *         "tipoDocumento": "DPI",
                     *         "numeroDocumento": "2547896320101"
                     *       },
                     *       "huespedesAdicionales": [],
                     *       "total": 1912.5,
                     *       "saldoPendiente": 1912.5,
                     *       "creadaEn": "2026-10-02T10:15:00-06:00",
                     *       "historial": [
                     *         {
                     *           "estadoAnterior": null,
                     *           "estadoNuevo": "CONFIRMADA",
                     *           "responsable": "Ana Pérez",
                     *           "fechaHora": "2026-10-02T10:15:00-06:00",
                     *           "motivo": null
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["ReservaDetalle"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            /** @description El huésped, el tipo o la habitación no existen. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "codigo": "NO_ENCONTRADO",
                     *       "mensaje": "No se encontró el huésped indicado.",
                     *       "detalles": []
                     *     }
                     */
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description Sin disponibilidad, o la habitación elegida ya está ocupada en esas fechas o fuera de servicio. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "codigo": "SIN_DISPONIBILIDAD",
                     *       "mensaje": "Ya no hay habitaciones disponibles de ese tipo para esas fechas.",
                     *       "detalles": []
                     *     }
                     */
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    obtenerCalendarioReservas: {
        parameters: {
            query: {
                /** @example 2026-10-01 */
                desde: components["schemas"]["FechaEstadia"];
                /** @example 2026-10-31 */
                hasta: components["schemas"]["FechaEstadia"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Datos para el Gantt. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "desde": "2026-10-01",
                     *       "hasta": "2026-10-31",
                     *       "grupos": [
                     *         {
                     *           "tipoHabitacion": {
                     *             "id": 1,
                     *             "nombre": "Doble Superior"
                     *           },
                     *           "habitaciones": [
                     *             {
                     *               "id": 3,
                     *               "numero": "103",
                     *               "piso": 1
                     *             },
                     *             {
                     *               "id": 4,
                     *               "numero": "104",
                     *               "piso": 1
                     *             }
                     *           ]
                     *         }
                     *       ],
                     *       "reservas": [
                     *         {
                     *           "codigo": "VS-H3N8P1",
                     *           "huespedPrincipal": "María José López",
                     *           "entrada": "2026-10-15",
                     *           "salida": "2026-10-17",
                     *           "estado": "CONFIRMADA",
                     *           "canal": "RECEPCION",
                     *           "tipoHabitacionId": 1,
                     *           "habitacionId": 3
                     *         },
                     *         {
                     *           "codigo": "VS-Q4R8T2",
                     *           "huespedPrincipal": "John Smith",
                     *           "entrada": "2026-10-20",
                     *           "salida": "2026-10-23",
                     *           "estado": "CONFIRMADA",
                     *           "canal": "BOOKING",
                     *           "tipoHabitacionId": 2,
                     *           "habitacionId": null
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["CalendarioReservas"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
        };
    };
    obtenerReserva: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /**
                 * @description Código de la reserva.
                 * @example VS-7K2M9Q
                 */
                codigo: components["parameters"]["CodigoReservaPath"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Detalle de la reserva. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "codigo": "VS-7K2M9Q",
                     *       "horaEstimadaLlegada": "18:30",
                     *       "estado": "EN_ESTADIA",
                     *       "canal": "DIRECTO_WEB",
                     *       "identificadorExterno": null,
                     *       "entrada": "2026-10-01",
                     *       "salida": "2026-10-04",
                     *       "noches": 3,
                     *       "numeroHuespedes": 2,
                     *       "tipoHabitacion": {
                     *         "id": 1,
                     *         "nombre": "Doble Superior"
                     *       },
                     *       "habitacion": {
                     *         "id": 4,
                     *         "numero": "104",
                     *         "piso": 1
                     *       },
                     *       "huesped": {
                     *         "id": 45,
                     *         "nombreCompleto": "María José López",
                     *         "correo": "maria.lopez@example.com",
                     *         "telefono": "+502 5555 1234",
                     *         "nacionalidad": "Guatemalteca",
                     *         "tipoDocumento": "DPI",
                     *         "numeroDocumento": "2547896320101"
                     *       },
                     *       "huespedesAdicionales": [
                     *         {
                     *           "id": 7,
                     *           "nombreCompleto": "Carlos López",
                     *           "tipoDocumento": "PASAPORTE",
                     *           "numeroDocumento": "P1234567",
                     *           "nacionalidad": "Mexicana"
                     *         }
                     *       ],
                     *       "total": 2975,
                     *       "saldoPendiente": 0,
                     *       "creadaEn": "2026-09-20T09:02:11-06:00",
                     *       "historial": [
                     *         {
                     *           "estadoAnterior": null,
                     *           "estadoNuevo": "PENDIENTE_PAGO",
                     *           "responsable": "Cliente web",
                     *           "fechaHora": "2026-09-20T09:02:11-06:00",
                     *           "motivo": null
                     *         },
                     *         {
                     *           "estadoAnterior": "PENDIENTE_PAGO",
                     *           "estadoNuevo": "CONFIRMADA",
                     *           "responsable": "SISTEMA",
                     *           "fechaHora": "2026-09-20T09:04:40-06:00",
                     *           "motivo": null
                     *         },
                     *         {
                     *           "estadoAnterior": "CONFIRMADA",
                     *           "estadoNuevo": "EN_ESTADIA",
                     *           "responsable": "Ana Pérez",
                     *           "fechaHora": "2026-10-01T14:20:00-06:00",
                     *           "motivo": null
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["ReservaDetalle"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
        };
    };
    agregarHuespedAdicional: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /**
                 * @description Código de la reserva.
                 * @example VS-7K2M9Q
                 */
                codigo: components["parameters"]["CodigoReservaPath"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "nombreCompleto": "Carlos López",
                 *       "tipoDocumento": "PASAPORTE",
                 *       "numeroDocumento": "P1234567",
                 *       "nacionalidad": "Mexicana"
                 *     }
                 */
                "application/json": components["schemas"]["HuespedAdicionalDatos"];
            };
        };
        responses: {
            /** @description Huésped adicional registrado. */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": 7,
                     *       "nombreCompleto": "Carlos López",
                     *       "tipoDocumento": "PASAPORTE",
                     *       "numeroDocumento": "P1234567",
                     *       "nacionalidad": "Mexicana"
                     *     }
                     */
                    "application/json": components["schemas"]["HuespedAdicional"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            /** @description Se supera el número de huéspedes o el estado de la reserva no lo permite. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    obtenerVistaPreviaCancelacion: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /**
                 * @description Código de la reserva.
                 * @example VS-7K2M9Q
                 */
                codigo: components["parameters"]["CodigoReservaPath"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Efecto económico de cancelar. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["VistaPreviaCancelacion"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["ConflictoCancelacion"];
        };
    };
    cancelarReserva: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /**
                 * @description Código de la reserva.
                 * @example VS-7K2M9Q
                 */
                codigo: components["parameters"]["CodigoReservaPath"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "motivo": "El huésped cambió sus planes de viaje."
                 *     }
                 */
                "application/json": components["schemas"]["CancelarReservaPeticion"];
            };
        };
        responses: {
            /** @description Reserva cancelada. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "codigo": "VS-H3N8P1",
                     *       "horaEstimadaLlegada": null,
                     *       "estado": "CANCELADA",
                     *       "canal": "RECEPCION",
                     *       "identificadorExterno": null,
                     *       "entrada": "2026-10-15",
                     *       "salida": "2026-10-17",
                     *       "noches": 2,
                     *       "numeroHuespedes": 2,
                     *       "tipoHabitacion": {
                     *         "id": 1,
                     *         "nombre": "Doble Superior"
                     *       },
                     *       "habitacion": null,
                     *       "huesped": {
                     *         "id": 45,
                     *         "nombreCompleto": "María José López",
                     *         "correo": "maria.lopez@example.com",
                     *         "telefono": "+502 5555 1234",
                     *         "nacionalidad": "Guatemalteca",
                     *         "tipoDocumento": "DPI",
                     *         "numeroDocumento": "2547896320101"
                     *       },
                     *       "huespedesAdicionales": [],
                     *       "total": 1912.5,
                     *       "saldoPendiente": 1912.5,
                     *       "creadaEn": "2026-10-02T10:15:00-06:00",
                     *       "historial": [
                     *         {
                     *           "estadoAnterior": null,
                     *           "estadoNuevo": "CONFIRMADA",
                     *           "responsable": "Ana Pérez",
                     *           "fechaHora": "2026-10-02T10:15:00-06:00",
                     *           "motivo": null
                     *         },
                     *         {
                     *           "estadoAnterior": "CONFIRMADA",
                     *           "estadoNuevo": "CANCELADA",
                     *           "responsable": "Ana Pérez",
                     *           "fechaHora": "2026-10-05T11:40:00-06:00",
                     *           "motivo": "El huésped cambió sus planes de viaje."
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["ReservaDetalle"];
                };
            };
            /** @description Falta el motivo. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "codigo": "DATOS_INVALIDOS",
                     *       "mensaje": "El motivo de cancelación es obligatorio.",
                     *       "detalles": [
                     *         {
                     *           "campo": "motivo",
                     *           "mensaje": "El motivo es obligatorio."
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["Error"];
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            /** @description La reserva no se puede cancelar o Recurrente rechazó el reembolso. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    asignarHabitacion: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /**
                 * @description Código de la reserva.
                 * @example VS-7K2M9Q
                 */
                codigo: components["parameters"]["CodigoReservaPath"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "habitacionId": 4
                 *     }
                 */
                "application/json": components["schemas"]["AsignarHabitacionPeticion"];
            };
        };
        responses: {
            /** @description Habitación asignada; devuelve el detalle actualizado. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "codigo": "VS-Q4R8T2",
                     *       "horaEstimadaLlegada": null,
                     *       "estado": "CONFIRMADA",
                     *       "canal": "BOOKING",
                     *       "identificadorExterno": "BK-99887766",
                     *       "entrada": "2026-11-03",
                     *       "salida": "2026-11-06",
                     *       "noches": 3,
                     *       "numeroHuespedes": 2,
                     *       "tipoHabitacion": {
                     *         "id": 2,
                     *         "nombre": "Suite Volcán"
                     *       },
                     *       "habitacion": {
                     *         "id": 9,
                     *         "numero": "201",
                     *         "piso": 2
                     *       },
                     *       "huesped": {
                     *         "id": 52,
                     *         "nombreCompleto": "John Smith",
                     *         "correo": "john.smith@example.com",
                     *         "telefono": "+1 555 0100",
                     *         "nacionalidad": "Estadounidense",
                     *         "tipoDocumento": "PASAPORTE",
                     *         "numeroDocumento": "567890123"
                     *       },
                     *       "huespedesAdicionales": [],
                     *       "total": 4350,
                     *       "saldoPendiente": 0,
                     *       "creadaEn": "2026-10-02T08:00:00-06:00",
                     *       "historial": [
                     *         {
                     *           "estadoAnterior": null,
                     *           "estadoNuevo": "CONFIRMADA",
                     *           "responsable": "BOOKING",
                     *           "fechaHora": "2026-10-02T08:00:00-06:00",
                     *           "motivo": null
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["ReservaDetalle"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            /** @description La habitación no es válida para la reserva o la reserva ya no permite cambios. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    hacerCheckIn: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /**
                 * @description Código de la reserva.
                 * @example VS-7K2M9Q
                 */
                codigo: components["parameters"]["CodigoReservaPath"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Check-in realizado; devuelve el detalle actualizado. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "codigo": "VS-H3N8P1",
                     *       "horaEstimadaLlegada": null,
                     *       "estado": "EN_ESTADIA",
                     *       "canal": "RECEPCION",
                     *       "identificadorExterno": null,
                     *       "entrada": "2026-10-15",
                     *       "salida": "2026-10-17",
                     *       "noches": 2,
                     *       "numeroHuespedes": 2,
                     *       "tipoHabitacion": {
                     *         "id": 1,
                     *         "nombre": "Doble Superior"
                     *       },
                     *       "habitacion": {
                     *         "id": 3,
                     *         "numero": "103",
                     *         "piso": 1
                     *       },
                     *       "huesped": {
                     *         "id": 45,
                     *         "nombreCompleto": "María José López",
                     *         "correo": "maria.lopez@example.com",
                     *         "telefono": "+502 5555 1234",
                     *         "nacionalidad": "Guatemalteca",
                     *         "tipoDocumento": "DPI",
                     *         "numeroDocumento": "2547896320101"
                     *       },
                     *       "huespedesAdicionales": [],
                     *       "total": 1912.5,
                     *       "saldoPendiente": 1912.5,
                     *       "creadaEn": "2026-10-02T10:15:00-06:00",
                     *       "historial": [
                     *         {
                     *           "estadoAnterior": null,
                     *           "estadoNuevo": "CONFIRMADA",
                     *           "responsable": "Ana Pérez",
                     *           "fechaHora": "2026-10-02T10:15:00-06:00",
                     *           "motivo": null
                     *         },
                     *         {
                     *           "estadoAnterior": "CONFIRMADA",
                     *           "estadoNuevo": "EN_ESTADIA",
                     *           "responsable": "Ana Pérez",
                     *           "fechaHora": "2026-10-15T14:05:00-06:00",
                     *           "motivo": null
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["ReservaDetalle"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            /** @description No se cumple alguna condición del check-in. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    listarEstadoHabitaciones: {
        parameters: {
            query?: {
                ocupacion?: components["schemas"]["OcupacionHabitacion"];
                condicion?: components["schemas"]["CondicionHabitacion"];
                tipoHabitacionId?: components["schemas"]["Id"];
                /** @example 2 */
                piso?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Habitaciones activas con su estado. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example [
                     *       {
                     *         "id": 3,
                     *         "numero": "103",
                     *         "piso": 1,
                     *         "tipoHabitacion": {
                     *           "id": 1,
                     *           "nombre": "Doble Superior"
                     *         },
                     *         "ocupacion": "LIBRE",
                     *         "condicion": "LIMPIA",
                     *         "llegaHoy": true,
                     *         "saleHoy": false,
                     *         "incidenciaPendiente": false,
                     *         "incidenciaBloqueante": null
                     *       },
                     *       {
                     *         "id": 9,
                     *         "numero": "201",
                     *         "piso": 2,
                     *         "tipoHabitacion": {
                     *           "id": 2,
                     *           "nombre": "Suite Volcán"
                     *         },
                     *         "ocupacion": "LIBRE",
                     *         "condicion": "FUERA_DE_SERVICIO",
                     *         "llegaHoy": false,
                     *         "saleHoy": false,
                     *         "incidenciaPendiente": false,
                     *         "incidenciaBloqueante": {
                     *           "id": 15,
                     *           "descripcion": "Fuga de agua en el baño.",
                     *           "estado": "EN_PROCESO",
                     *           "reportadaEn": "2026-10-02T08:30:00-06:00"
                     *         }
                     *       }
                     *     ]
                     */
                    "application/json": components["schemas"]["HabitacionEstado"][];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
        };
    };
    listarHabitacionesAsignables: {
        parameters: {
            query: {
                /** @example 1 */
                tipoHabitacionId: components["schemas"]["Id"];
                /**
                 * @description Fecha de entrada (YYYY-MM-DD).
                 * @example 2026-10-15
                 */
                entrada: components["parameters"]["Entrada"];
                /**
                 * @description Fecha de salida (YYYY-MM-DD).
                 * @example 2026-10-17
                 */
                salida: components["parameters"]["Salida"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Habitaciones asignables. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example [
                     *       {
                     *         "id": 3,
                     *         "numero": "103",
                     *         "piso": 1
                     *       },
                     *       {
                     *         "id": 4,
                     *         "numero": "104",
                     *         "piso": 1
                     *       }
                     *     ]
                     */
                    "application/json": components["schemas"]["HabitacionReferencia"][];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
        };
    };
    marcarHabitacionSucia: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: components["parameters"]["IdPath"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Habitación marcada como sucia. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": 3,
                     *       "numero": "103",
                     *       "piso": 1,
                     *       "tipoHabitacion": {
                     *         "id": 1,
                     *         "nombre": "Doble Superior"
                     *       },
                     *       "ocupacion": "LIBRE",
                     *       "condicion": "SUCIA",
                     *       "llegaHoy": false,
                     *       "saleHoy": false,
                     *       "incidenciaPendiente": false,
                     *       "incidenciaBloqueante": null
                     *     }
                     */
                    "application/json": components["schemas"]["HabitacionEstado"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
        };
    };
    crearWsTicket: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Crear ticket de WebSocket. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "ticket": "ticket-opaco-de-demostracion",
                     *       "expiraEn": "2026-10-08T16:01:00.000Z"
                     *     }
                     */
                    "application/json": components["schemas"]["WsTicket"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            409: components["responses"]["Conflict"];
        };
    };
    solicitarCodigoHuesped: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "correo": "ana@example.com"
                 *     }
                 */
                "application/json": components["schemas"]["CodigoAccesoPeticion"];
            };
        };
        responses: {
            /** @description Solicitar código de acceso. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "mensaje": "Si el correo tiene reservas, recibirás un código para entrar."
                     *     }
                     */
                    "application/json": components["schemas"]["MensajeGenerico"];
                };
            };
            400: components["responses"]["BadRequest"];
        };
    };
    verificarCodigoHuesped: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "correo": "ana@example.com",
                 *       "codigo": "123456"
                 *     }
                 */
                "application/json": components["schemas"]["VerificarCodigoPeticion"];
            };
        };
        responses: {
            /** @description Verificar código y emitir sesión. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "accessToken": "eyJhbGciOiJIUzI1NiJ9.demo.firma",
                     *       "refreshToken": "11111111-2222-4333-8444-555555555555",
                     *       "tipoToken": "Bearer",
                     *       "expiraEn": 900
                     *     }
                     */
                    "application/json": components["schemas"]["Tokens"];
                };
            };
            400: components["responses"]["BadRequest"];
            /** @description Código incorrecto, vencido, usado o acceso bloqueado. Sin tokens. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    cerrarSesionHuesped: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "refreshToken": "3f8a1c9e-6b2d-4f7a-9c11-0d5e8b7a2f44"
                 *     }
                 */
                "application/json": components["schemas"]["RefreshPeticion"];
            };
        };
        responses: {
            /** @description Cerrar sesión del huésped. Sin cuerpo. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
        };
    };
    listarReservasHuesped: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Listar mis reservas. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example [
                     *       {
                     *         "codigo": "VS-7K2M9Q",
                     *         "entrada": "2026-10-15T00:00:00.000Z",
                     *         "salida": "2026-10-15T00:00:00.000Z",
                     *         "estado": "PENDIENTE_PAGO"
                     *       }
                     *     ]
                     */
                    "application/json": components["schemas"]["ReservaAppResumen"][];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
        };
    };
    detalleReservaHuesped: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @example VS-7K2M9Q */
                codigo: components["schemas"]["CodigoReserva"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Ver detalle de mi reserva. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "codigo": "VS-7K2M9Q",
                     *       "entrada": "2026-10-15T00:00:00.000Z",
                     *       "salida": "2026-10-15T00:00:00.000Z",
                     *       "estado": "PENDIENTE_PAGO",
                     *       "horaCheckOut": "12:00",
                     *       "tipoHabitacion": {
                     *         "id": 1,
                     *         "nombre": "Doble Superior"
                     *       },
                     *       "numeroHuespedes": 1,
                     *       "habitacion": null
                     *     }
                     */
                    "application/json": components["schemas"]["ReservaAppDetalle"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
        };
    };
    menuEstadia: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @example VS-7K2M9Q */
                codigo: components["schemas"]["CodigoReserva"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Consultar menú de mi estadía. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "categorias": [
                     *         {
                     *           "id": 1,
                     *           "nombre": "Bebidas"
                     *         }
                     *       ],
                     *       "items": [
                     *         {
                     *           "id": 21,
                     *           "categoriaId": 1,
                     *           "nombre": "Café de Guatemala",
                     *           "descripcion": "Café recién preparado.",
                     *           "precio": 25,
                     *           "fotoUrl": null,
                     *           "disponibilidad": "DISPONIBLE"
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["MenuApp"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
        };
    };
    listarPedidosHuesped: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @example VS-7K2M9Q */
                codigo: components["schemas"]["CodigoReserva"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Listar mis pedidos. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example [
                     *       {
                     *         "id": 12,
                     *         "codigoReserva": "VS-ABC123",
                     *         "creadoEn": "2026-10-08T15:00:00.000Z",
                     *         "estado": "NUEVO",
                     *         "items": [
                     *           {
                     *             "itemId": 21,
                     *             "nombre": "Café de Guatemala",
                     *             "cantidad": 2,
                     *             "precioUnitario": 25,
                     *             "subtotal": 50
                     *           }
                     *         ],
                     *         "notas": "Sin azúcar",
                     *         "total": 50,
                     *         "motivoCancelacion": null
                     *       }
                     *     ]
                     */
                    "application/json": components["schemas"]["PedidoHuesped"][];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
        };
    };
    crearPedidoHuesped: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @example VS-7K2M9Q */
                codigo: components["schemas"]["CodigoReserva"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "items": [
                 *         {
                 *           "itemId": 21,
                 *           "cantidad": 2
                 *         }
                 *       ],
                 *       "notas": "Sin azúcar"
                 *     }
                 */
                "application/json": components["schemas"]["CrearPedidoPeticion"];
            };
        };
        responses: {
            /** @description Crear pedido de Room Service. */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": 12,
                     *       "codigoReserva": "VS-ABC123",
                     *       "creadoEn": "2026-10-08T15:00:00.000Z",
                     *       "estado": "NUEVO",
                     *       "items": [
                     *         {
                     *           "itemId": 21,
                     *           "nombre": "Café de Guatemala",
                     *           "cantidad": 2,
                     *           "precioUnitario": 25,
                     *           "subtotal": 50
                     *         }
                     *       ],
                     *       "notas": "Sin azúcar",
                     *       "total": 50,
                     *       "motivoCancelacion": null
                     *     }
                     */
                    "application/json": components["schemas"]["PedidoHuesped"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            /** @description Fuera de estadía, cuenta cerrada o ítems agotados. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "codigo": "ITEM_AGOTADO",
                     *       "mensaje": "Quita del carrito los artículos agotados.",
                     *       "detalles": [
                     *         {
                     *           "campo": "items[0].itemId",
                     *           "mensaje": "El ítem 21 (Café de Guatemala) está agotado."
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    detallePedidoHuesped: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @example VS-7K2M9Q */
                codigo: components["schemas"]["CodigoReserva"];
                /** @example 1 */
                id: components["schemas"]["Id"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Consultar mi pedido. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": 12,
                     *       "codigoReserva": "VS-ABC123",
                     *       "creadoEn": "2026-10-08T15:00:00.000Z",
                     *       "estado": "NUEVO",
                     *       "items": [
                     *         {
                     *           "itemId": 21,
                     *           "nombre": "Café de Guatemala",
                     *           "cantidad": 2,
                     *           "precioUnitario": 25,
                     *           "subtotal": 50
                     *         }
                     *       ],
                     *       "notas": "Sin azúcar",
                     *       "total": 50,
                     *       "motivoCancelacion": null
                     *     }
                     */
                    "application/json": components["schemas"]["PedidoHuesped"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
        };
    };
    catalogoArticulosEstadia: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @example VS-7K2M9Q */
                codigo: components["schemas"]["CodigoReserva"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Consultar artículos solicitables. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example [
                     *       {
                     *         "id": 1,
                     *         "nombre": "Toalla de baño",
                     *         "cantidadMaxima": 4
                     *       }
                     *     ]
                     */
                    "application/json": components["schemas"]["ArticuloSolicitable"][];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
        };
    };
    listarSolicitudesHuesped: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @example VS-7K2M9Q */
                codigo: components["schemas"]["CodigoReserva"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Listar mis solicitudes. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example [
                     *       {
                     *         "id": 8,
                     *         "tipo": "ARTICULOS",
                     *         "creadaEn": "2026-10-08T15:00:00.000Z",
                     *         "estado": "PENDIENTE",
                     *         "comentario": null,
                     *         "articulos": [
                     *           {
                     *             "articuloId": 1,
                     *             "nombre": "Toalla de baño",
                     *             "cantidad": 2
                     *           }
                     *         ]
                     *       }
                     *     ]
                     */
                    "application/json": components["schemas"]["SolicitudHuesped"][];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
        };
    };
    solicitarLimpiezaHuesped: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @example VS-7K2M9Q */
                codigo: components["schemas"]["CodigoReserva"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "comentario": "Después de las 10:00, por favor."
                 *     }
                 */
                "application/json": components["schemas"]["SolicitarLimpiezaPeticion"];
            };
        };
        responses: {
            /** @description Solicitar limpieza. */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": 8,
                     *       "tipo": "LIMPIEZA",
                     *       "creadaEn": "2026-10-08T15:00:00.000Z",
                     *       "estado": "PENDIENTE",
                     *       "comentario": "Después de las 10:00, por favor.",
                     *       "articulos": []
                     *     }
                     */
                    "application/json": components["schemas"]["SolicitudHuesped"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
        };
    };
    solicitarArticulosHuesped: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @example VS-7K2M9Q */
                codigo: components["schemas"]["CodigoReserva"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "articulos": [
                 *         {
                 *           "articuloId": 1,
                 *           "cantidad": 2
                 *         }
                 *       ]
                 *     }
                 */
                "application/json": components["schemas"]["SolicitarArticulosPeticion"];
            };
        };
        responses: {
            /** @description Solicitar artículos. */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": 8,
                     *       "tipo": "ARTICULOS",
                     *       "creadaEn": "2026-10-08T15:00:00.000Z",
                     *       "estado": "PENDIENTE",
                     *       "comentario": null,
                     *       "articulos": [
                     *         {
                     *           "articuloId": 1,
                     *           "nombre": "Toalla de baño",
                     *           "cantidad": 2
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["SolicitudHuesped"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
        };
    };
    cancelarSolicitudHuesped: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @example VS-7K2M9Q */
                codigo: components["schemas"]["CodigoReserva"];
                /** @example 1 */
                id: components["schemas"]["Id"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Cancelar mi solicitud pendiente. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": 8,
                     *       "tipo": "ARTICULOS",
                     *       "creadaEn": "2026-10-08T15:00:00.000Z",
                     *       "estado": "CANCELADA",
                     *       "comentario": null,
                     *       "articulos": [
                     *         {
                     *           "articuloId": 1,
                     *           "nombre": "Toalla de baño",
                     *           "cantidad": 2
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["SolicitudHuesped"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
        };
    };
    consultarCuentaHuesped: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @example VS-7K2M9Q */
                codigo: components["schemas"]["CodigoReserva"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Ver mi cuenta. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "codigoReserva": "VS-ABC123",
                     *       "estadoReserva": "EN_ESTADIA",
                     *       "estadoCuenta": "ABIERTA",
                     *       "nombreHuesped": "Ana Morales",
                     *       "detalleNoches": [],
                     *       "totalCargosVigentes": 1850,
                     *       "totalPagosAprobados": 1850,
                     *       "saldo": 0,
                     *       "facturaId": null,
                     *       "cargos": [
                     *         {
                     *           "id": 2,
                     *           "fechaHora": "2026-10-08T15:30:00.000Z",
                     *           "tipo": "ALOJAMIENTO",
                     *           "concepto": "Alojamiento · reserva de canal",
                     *           "cantidad": 1,
                     *           "precioUnitario": 1800,
                     *           "monto": 1800,
                     *           "estado": "VIGENTE",
                     *           "motivoAnulacion": null
                     *         },
                     *         {
                     *           "id": 1,
                     *           "fechaHora": "2026-10-08T15:30:00.000Z",
                     *           "tipo": "ROOM_SERVICE",
                     *           "concepto": "Room Service — Pedido #12",
                     *           "cantidad": 2,
                     *           "precioUnitario": 25,
                     *           "monto": 50,
                     *           "estado": "VIGENTE",
                     *           "motivoAnulacion": null
                     *         }
                     *       ],
                     *       "pagos": [
                     *         {
                     *           "id": 2,
                     *           "fechaHora": "2026-10-08T15:40:00.000Z",
                     *           "metodo": "CANAL",
                     *           "monto": 1800,
                     *           "estado": "APROBADO"
                     *         },
                     *         {
                     *           "id": 1,
                     *           "fechaHora": "2026-10-08T15:40:00.000Z",
                     *           "metodo": "RECURRENTE",
                     *           "monto": 50,
                     *           "estado": "APROBADO"
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["CuentaHuesped"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
        };
    };
    consultarCheckoutApp: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @example VS-7K2M9Q */
                codigo: components["schemas"]["CodigoReserva"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Consultar condiciones del check-out. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "codigoReserva": "VS-ABC123",
                     *       "saldo": 0,
                     *       "nombreCompradorSugerido": "Ana Morales",
                     *       "pedidoEnCamino": false,
                     *       "pedidosACancelar": [
                     *         12
                     *       ],
                     *       "puedeConfirmar": true,
                     *       "motivosBloqueo": []
                     *     }
                     */
                    "application/json": components["schemas"]["VistaCheckout"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
        };
    };
    confirmarCheckoutApp: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @example VS-7K2M9Q */
                codigo: components["schemas"]["CodigoReserva"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "comprador": {
                 *         "nit": "CF",
                 *         "nombreComprador": "Ana Morales"
                 *       },
                 *       "aceptaCancelarPedidos": true
                 *     }
                 */
                "application/json": components["schemas"]["CheckoutAppPeticion"];
            };
        };
        responses: {
            /** @description Confirmar check-out desde la app. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "codigoReserva": "VS-ABC123",
                     *       "estadoReserva": "FINALIZADA",
                     *       "estadoCuenta": "CERRADA",
                     *       "saldo": 0,
                     *       "factura": {
                     *         "id": 1,
                     *         "estado": "EMITIDA",
                     *         "serie": "VS-A",
                     *         "numero": 1,
                     *         "emitidaEn": "2026-10-02T20:30:00.000Z",
                     *         "codigoReserva": "VS-7K2M9Q",
                     *         "hotel": {
                     *           "nombre": "Villa Serena",
                     *           "nombreComercial": "Villa Serena",
                     *           "razonSocial": "Villa Serena de demostración",
                     *           "nit": "1234567-9",
                     *           "direccionFiscal": "Antigua Guatemala",
                     *           "telefono": "55550000",
                     *           "correo": "ana@example.com"
                     *         },
                     *         "comprador": {
                     *           "nit": "CF",
                     *           "nombreComprador": "Ana Morales"
                     *         },
                     *         "cargos": [
                     *           {
                     *             "concepto": "Alojamiento · reserva de canal",
                     *             "cantidad": 1,
                     *             "precioUnitario": 1800,
                     *             "monto": 1800
                     *           },
                     *           {
                     *             "concepto": "Room Service — Pedido #12",
                     *             "cantidad": 2,
                     *             "precioUnitario": 25,
                     *             "monto": 50
                     *           }
                     *         ],
                     *         "pagos": [
                     *           {
                     *             "metodo": "CANAL",
                     *             "monto": 1800
                     *           },
                     *           {
                     *             "metodo": "RECURRENTE",
                     *             "monto": 50
                     *           }
                     *         ],
                     *         "total": 1850,
                     *         "leyendaIva": "IVA incluido",
                     *         "leyendaLegal": "Factura de demostración — no válida ante la SAT"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["CheckoutResultado"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
        };
    };
    iniciarPagoSaldoApp: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @example VS-7K2M9Q */
                codigo: components["schemas"]["CodigoReserva"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Iniciar pago del saldo con Recurrente. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "urlPago": "https://app.recurrente.com/checkout-session/ch_saldo_ejemplo",
                     *       "expiraEn": "2026-10-02T20:30:00.000Z"
                     *     }
                     */
                    "application/json": components["schemas"]["PagoIniciado"];
                };
            };
            /** @description Saldo exactamente cero; no se creó sesión. Confirmar check-out. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
        };
    };
    facturaReservaHuesped: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @example VS-7K2M9Q */
                codigo: components["schemas"]["CodigoReserva"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Consultar factura de mi reserva. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": 1,
                     *       "estado": "EMITIDA",
                     *       "serie": "VS-A",
                     *       "numero": 1,
                     *       "emitidaEn": "2026-10-02T20:30:00.000Z",
                     *       "codigoReserva": "VS-7K2M9Q",
                     *       "hotel": {
                     *         "nombre": "Villa Serena",
                     *         "nombreComercial": "Villa Serena",
                     *         "razonSocial": "Villa Serena de demostración",
                     *         "nit": "1234567-9",
                     *         "direccionFiscal": "Antigua Guatemala",
                     *         "telefono": "55550000",
                     *         "correo": "ana@example.com"
                     *       },
                     *       "comprador": {
                     *         "nit": "CF",
                     *         "nombreComprador": "Ana Morales"
                     *       },
                     *       "cargos": [
                     *         {
                     *           "concepto": "Alojamiento · reserva de canal",
                     *           "cantidad": 1,
                     *           "precioUnitario": 1800,
                     *           "monto": 1800
                     *         },
                     *         {
                     *           "concepto": "Room Service — Pedido #12",
                     *           "cantidad": 2,
                     *           "precioUnitario": 25,
                     *           "monto": 50
                     *         }
                     *       ],
                     *       "pagos": [
                     *         {
                     *           "metodo": "CANAL",
                     *           "monto": 1800
                     *         },
                     *         {
                     *           "metodo": "RECURRENTE",
                     *           "monto": 50
                     *         }
                     *       ],
                     *       "total": 1850,
                     *       "leyendaIva": "IVA incluido",
                     *       "leyendaLegal": "Factura de demostración — no válida ante la SAT"
                     *     }
                     */
                    "application/json": components["schemas"]["FacturaDetalle"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
        };
    };
    registrarDispositivoPush: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "tokenExpo": "ExpoPushToken[demostracion]"
                 *     }
                 */
                "application/json": components["schemas"]["DispositivoPushPeticion"];
            };
        };
        responses: {
            /** @description El token ya estaba registrado para el mismo huésped. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": 1
                     *     }
                     */
                    "application/json": components["schemas"]["DispositivoPushRegistrado"];
                };
            };
            /** @description Registrar dispositivo push. */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": 1
                     *     }
                     */
                    "application/json": components["schemas"]["DispositivoPushRegistrado"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
        };
    };
    eliminarDispositivoPush: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @example 1 */
                id: components["schemas"]["Id"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Eliminar mi dispositivo push. Sin cuerpo. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
        };
    };
    colaRoomService: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Consultar cola de pedidos activos. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example [
                     *       {
                     *         "id": 12,
                     *         "creadoEn": "2026-10-08T15:00:00.000Z",
                     *         "estado": "NUEVO",
                     *         "items": [
                     *           {
                     *             "itemId": 21,
                     *             "nombre": "Café de Guatemala",
                     *             "cantidad": 2,
                     *             "precioUnitario": 25,
                     *             "subtotal": 50
                     *           }
                     *         ],
                     *         "notas": "Sin azúcar",
                     *         "total": 50,
                     *         "motivoCancelacion": null,
                     *         "habitacion": {
                     *           "id": 4,
                     *           "numero": "204",
                     *           "piso": 2
                     *         },
                     *         "nombreHuesped": "Ana Morales",
                     *         "historial": [
                     *           {
                     *             "estadoAnterior": null,
                     *             "estadoNuevo": "NUEVO",
                     *             "responsable": "Huésped",
                     *             "fechaHora": "2026-10-08T15:00:00.000Z",
                     *             "motivo": null
                     *           }
                     *         ]
                     *       }
                     *     ]
                     */
                    "application/json": components["schemas"]["PedidoRoomService"][];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
        };
    };
    detallePedidoRoomService: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @example 1 */
                id: components["schemas"]["Id"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Consultar detalle de pedido. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": 12,
                     *       "creadoEn": "2026-10-08T15:00:00.000Z",
                     *       "estado": "NUEVO",
                     *       "items": [
                     *         {
                     *           "itemId": 21,
                     *           "nombre": "Café de Guatemala",
                     *           "cantidad": 2,
                     *           "precioUnitario": 25,
                     *           "subtotal": 50
                     *         }
                     *       ],
                     *       "notas": "Sin azúcar",
                     *       "total": 50,
                     *       "motivoCancelacion": null,
                     *       "habitacion": {
                     *         "id": 4,
                     *         "numero": "204",
                     *         "piso": 2
                     *       },
                     *       "nombreHuesped": "Ana Morales",
                     *       "historial": [
                     *         {
                     *           "estadoAnterior": null,
                     *           "estadoNuevo": "NUEVO",
                     *           "responsable": "Huésped",
                     *           "fechaHora": "2026-10-08T15:00:00.000Z",
                     *           "motivo": null
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["PedidoRoomService"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
        };
    };
    avanzarPedido: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @example 1 */
                id: components["schemas"]["Id"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "estadoEsperado": "EN_CAMINO",
                 *       "nuevoEstado": "ENTREGADO"
                 *     }
                 */
                "application/json": components["schemas"]["AvanzarPedidoPeticion"];
            };
        };
        responses: {
            /** @description Avanzar al siguiente estado. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": 12,
                     *       "creadoEn": "2026-10-08T15:00:00.000Z",
                     *       "estado": "ENTREGADO",
                     *       "items": [
                     *         {
                     *           "itemId": 21,
                     *           "nombre": "Café de Guatemala",
                     *           "cantidad": 2,
                     *           "precioUnitario": 25,
                     *           "subtotal": 50
                     *         }
                     *       ],
                     *       "notas": "Sin azúcar",
                     *       "total": 50,
                     *       "motivoCancelacion": null,
                     *       "habitacion": {
                     *         "id": 4,
                     *         "numero": "204",
                     *         "piso": 2
                     *       },
                     *       "nombreHuesped": "Ana Morales",
                     *       "historial": [
                     *         {
                     *           "estadoAnterior": "EN_CAMINO",
                     *           "estadoNuevo": "ENTREGADO",
                     *           "responsable": "María López",
                     *           "fechaHora": "2026-10-08T16:00:00.000Z",
                     *           "motivo": null
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["PedidoRoomService"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
        };
    };
    cancelarPedidoRoomService: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @example 1 */
                id: components["schemas"]["Id"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "motivo": "Registrado por error"
                 *     }
                 */
                "application/json": components["schemas"]["MotivoPeticion"];
            };
        };
        responses: {
            /** @description Cancelar pedido con motivo. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": 12,
                     *       "creadoEn": "2026-10-08T15:00:00.000Z",
                     *       "estado": "CANCELADO",
                     *       "items": [
                     *         {
                     *           "itemId": 21,
                     *           "nombre": "Café de Guatemala",
                     *           "cantidad": 2,
                     *           "precioUnitario": 25,
                     *           "subtotal": 50
                     *         }
                     *       ],
                     *       "notas": "Sin azúcar",
                     *       "total": 50,
                     *       "motivoCancelacion": "Producto no disponible",
                     *       "habitacion": {
                     *         "id": 4,
                     *         "numero": "204",
                     *         "piso": 2
                     *       },
                     *       "nombreHuesped": "Ana Morales",
                     *       "historial": [
                     *         {
                     *           "estadoAnterior": "NUEVO",
                     *           "estadoNuevo": "CANCELADO",
                     *           "responsable": "María López",
                     *           "fechaHora": "2026-10-08T16:00:00.000Z",
                     *           "motivo": "Producto no disponible"
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["PedidoRoomService"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
        };
    };
    consultarMenuRoomService: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Consultar menú operativo. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "categorias": [
                     *         {
                     *           "id": 1,
                     *           "nombre": "Bebidas"
                     *         }
                     *       ],
                     *       "items": [
                     *         {
                     *           "id": 21,
                     *           "categoriaId": 1,
                     *           "nombre": "Café de Guatemala",
                     *           "descripcion": "Café recién preparado.",
                     *           "precio": 25,
                     *           "fotoUrl": null,
                     *           "disponibilidad": "DISPONIBLE"
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["MenuApp"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
        };
    };
    agotarItemMenu: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @example 1 */
                id: components["schemas"]["Id"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Marcar ítem agotado. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": 21,
                     *       "categoriaId": 1,
                     *       "nombre": "Café de Guatemala",
                     *       "descripcion": "Café recién preparado.",
                     *       "precio": 25,
                     *       "fotoUrl": null,
                     *       "disponibilidad": "AGOTADO"
                     *     }
                     */
                    "application/json": components["schemas"]["ItemMenuApp"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
        };
    };
    habitacionesPendientesLimpieza: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Consultar habitaciones pendientes. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example [
                     *       {
                     *         "habitacion": {
                     *           "id": 4,
                     *           "numero": "204",
                     *           "piso": 2
                     *         },
                     *         "condicion": "SUCIA",
                     *         "llegadaHoy": false,
                     *         "suciaDesde": "2026-10-02T20:30:00.000Z",
                     *         "empleadoACargo": null
                     *       }
                     *     ]
                     */
                    "application/json": components["schemas"]["HabitacionLimpieza"][];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
        };
    };
    iniciarLimpiezaHabitacion: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @example 1 */
                id: components["schemas"]["Id"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Iniciar limpieza. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "habitacion": {
                     *         "id": 4,
                     *         "numero": "204",
                     *         "piso": 2
                     *       },
                     *       "ocupacion": "LIBRE",
                     *       "condicion": "EN_LIMPIEZA",
                     *       "empleadoACargo": {
                     *         "id": 7,
                     *         "nombre": "María López"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ResultadoCondicionHabitacion"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
        };
    };
    interrumpirLimpiezaHabitacion: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @example 1 */
                id: components["schemas"]["Id"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Interrumpir mi limpieza. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "habitacion": {
                     *         "id": 4,
                     *         "numero": "204",
                     *         "piso": 2
                     *       },
                     *       "ocupacion": "LIBRE",
                     *       "condicion": "SUCIA",
                     *       "empleadoACargo": null
                     *     }
                     */
                    "application/json": components["schemas"]["ResultadoCondicionHabitacion"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
        };
    };
    terminarLimpiezaHabitacion: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @example 1 */
                id: components["schemas"]["Id"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Terminar mi limpieza. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "habitacion": {
                     *         "id": 4,
                     *         "numero": "204",
                     *         "piso": 2
                     *       },
                     *       "ocupacion": "LIBRE",
                     *       "condicion": "LIMPIA",
                     *       "empleadoACargo": null
                     *     }
                     */
                    "application/json": components["schemas"]["ResultadoCondicionHabitacion"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
        };
    };
    colaSolicitudesLimpieza: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Consultar solicitudes activas. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example [
                     *       {
                     *         "id": 8,
                     *         "tipo": "ARTICULOS",
                     *         "creadaEn": "2026-10-08T15:00:00.000Z",
                     *         "estado": "PENDIENTE",
                     *         "comentario": null,
                     *         "articulos": [
                     *           {
                     *             "articuloId": 1,
                     *             "nombre": "Toalla de baño",
                     *             "cantidad": 2
                     *           }
                     *         ],
                     *         "habitacion": {
                     *           "id": 4,
                     *           "numero": "204",
                     *           "piso": 2
                     *         },
                     *         "empleadoACargo": null
                     *       }
                     *     ]
                     */
                    "application/json": components["schemas"]["SolicitudLimpieza"][];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
        };
    };
    tomarSolicitudLimpieza: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @example 1 */
                id: components["schemas"]["Id"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Tomar solicitud pendiente. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": 8,
                     *       "tipo": "ARTICULOS",
                     *       "creadaEn": "2026-10-08T15:00:00.000Z",
                     *       "estado": "EN_PROCESO",
                     *       "comentario": null,
                     *       "articulos": [
                     *         {
                     *           "articuloId": 1,
                     *           "nombre": "Toalla de baño",
                     *           "cantidad": 2
                     *         }
                     *       ],
                     *       "habitacion": {
                     *         "id": 4,
                     *         "numero": "204",
                     *         "piso": 2
                     *       },
                     *       "empleadoACargo": {
                     *         "id": 7,
                     *         "nombre": "María López"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["SolicitudLimpieza"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
        };
    };
    atenderSolicitudLimpieza: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @example 1 */
                id: components["schemas"]["Id"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Atender mi solicitud. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": 8,
                     *       "tipo": "ARTICULOS",
                     *       "creadaEn": "2026-10-08T15:00:00.000Z",
                     *       "estado": "ATENDIDA",
                     *       "comentario": null,
                     *       "articulos": [
                     *         {
                     *           "articuloId": 1,
                     *           "nombre": "Toalla de baño",
                     *           "cantidad": 2
                     *         }
                     *       ],
                     *       "habitacion": {
                     *         "id": 4,
                     *         "numero": "204",
                     *         "piso": 2
                     *       },
                     *       "empleadoACargo": {
                     *         "id": 7,
                     *         "nombre": "María López"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["SolicitudLimpieza"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
        };
    };
    listarIncidencias: {
        parameters: {
            query?: {
                /** @example REPORTADA */
                estado?: components["schemas"]["EstadoIncidencia"];
                /** @example 1 */
                habitacionId?: components["schemas"]["Id"];
                /** @example 1 */
                tecnicoId?: components["schemas"]["Id"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Consultar incidencias. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example [
                     *       {
                     *         "id": 1,
                     *         "habitacion": {
                     *           "id": 4,
                     *           "numero": "204",
                     *           "piso": 2
                     *         },
                     *         "descripcion": "Descripción de demostración",
                     *         "impideUso": false,
                     *         "habitacionOcupada": false,
                     *         "estado": "REPORTADA",
                     *         "reportadaPor": {
                     *           "id": 7,
                     *           "nombre": "María López"
                     *         },
                     *         "reportadaEn": "2026-10-02T20:30:00.000Z",
                     *         "tecnicoACargo": null,
                     *         "resueltaEn": null,
                     *         "fotoUrl": null
                     *       }
                     *     ]
                     */
                    "application/json": components["schemas"]["IncidenciaResumen"][];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
        };
    };
    reportarIncidencia: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "habitacionId": 4,
                 *       "descripcion": "Fuga en la ducha.",
                 *       "impideUso": true,
                 *       "fotoClave": "incidencias/fuga-demo.jpg"
                 *     }
                 */
                "application/json": components["schemas"]["ReportarIncidenciaPeticion"];
            };
        };
        responses: {
            /** @description Reportar daño de habitación. */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": 1,
                     *       "habitacionId": 1,
                     *       "estado": "REPORTADA",
                     *       "reportadaEn": "2026-10-02T20:30:00.000Z"
                     *     }
                     */
                    "application/json": components["schemas"]["IncidenciaCreada"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            409: components["responses"]["Conflict"];
        };
    };
    listarHabitacionesIncidencias: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Catálogo de habitaciones operativas para reportar incidencias. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HabitacionOperativa"][];
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
        };
    };
    detalleIncidencia: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @example 1 */
                id: components["schemas"]["Id"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Consultar detalle de incidencia. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": 1,
                     *       "habitacion": {
                     *         "id": 4,
                     *         "numero": "204",
                     *         "piso": 2
                     *       },
                     *       "descripcion": "Descripción de demostración",
                     *       "impideUso": false,
                     *       "habitacionOcupada": false,
                     *       "estado": "REPORTADA",
                     *       "reportadaPor": {
                     *         "id": 7,
                     *         "nombre": "María López"
                     *       },
                     *       "reportadaEn": "2026-10-02T20:30:00.000Z",
                     *       "tecnicoACargo": null,
                     *       "resueltaEn": null,
                     *       "fotoUrl": null,
                     *       "solucion": null,
                     *       "historial": [
                     *         {
                     *           "estadoAnterior": null,
                     *           "estadoNuevo": "Demostración",
                     *           "responsable": "María López",
                     *           "fechaHora": "2026-10-02T20:30:00.000Z",
                     *           "motivo": null
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["IncidenciaDetalle"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
        };
    };
    tomarIncidencia: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @example 1 */
                id: components["schemas"]["Id"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Tomar incidencia reportada. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": 1,
                     *       "habitacion": {
                     *         "id": 4,
                     *         "numero": "204",
                     *         "piso": 2
                     *       },
                     *       "descripcion": "Descripción de demostración",
                     *       "impideUso": false,
                     *       "habitacionOcupada": false,
                     *       "estado": "EN_PROCESO",
                     *       "reportadaPor": {
                     *         "id": 7,
                     *         "nombre": "María López"
                     *       },
                     *       "reportadaEn": "2026-10-02T20:30:00.000Z",
                     *       "tecnicoACargo": {
                     *         "id": 7,
                     *         "nombre": "María López"
                     *       },
                     *       "resueltaEn": null,
                     *       "fotoUrl": null,
                     *       "solucion": null,
                     *       "historial": [
                     *         {
                     *           "estadoAnterior": null,
                     *           "estadoNuevo": "Demostración",
                     *           "responsable": "María López",
                     *           "fechaHora": "2026-10-02T20:30:00.000Z",
                     *           "motivo": null
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["IncidenciaDetalle"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
        };
    };
    resolverIncidencia: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @example 1 */
                id: components["schemas"]["Id"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "solucion": "Se reemplazó la pieza dañada."
                 *     }
                 */
                "application/json": components["schemas"]["ResolverIncidenciaPeticion"];
            };
        };
        responses: {
            /** @description Resolver mi incidencia. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": 1,
                     *       "habitacion": {
                     *         "id": 4,
                     *         "numero": "204",
                     *         "piso": 2
                     *       },
                     *       "descripcion": "Descripción de demostración",
                     *       "impideUso": false,
                     *       "habitacionOcupada": false,
                     *       "estado": "RESUELTA",
                     *       "reportadaPor": {
                     *         "id": 7,
                     *         "nombre": "María López"
                     *       },
                     *       "reportadaEn": "2026-10-02T20:30:00.000Z",
                     *       "tecnicoACargo": {
                     *         "id": 7,
                     *         "nombre": "María López"
                     *       },
                     *       "resueltaEn": "2026-10-08T16:00:00.000Z",
                     *       "fotoUrl": null,
                     *       "solucion": "Se reemplazó la pieza dañada.",
                     *       "historial": [
                     *         {
                     *           "estadoAnterior": null,
                     *           "estadoNuevo": "Demostración",
                     *           "responsable": "María López",
                     *           "fechaHora": "2026-10-02T20:30:00.000Z",
                     *           "motivo": null
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["IncidenciaDetalle"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
        };
    };
    consultarCuentaRecepcion: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @example VS-7K2M9Q */
                codigo: components["schemas"]["CodigoReserva"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Consultar cuenta de reserva. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "codigoReserva": "VS-ABC123",
                     *       "estadoReserva": "EN_ESTADIA",
                     *       "estadoCuenta": "ABIERTA",
                     *       "nombreHuesped": "Ana Morales",
                     *       "detalleNoches": [],
                     *       "totalCargosVigentes": 1850,
                     *       "totalPagosAprobados": 1850,
                     *       "saldo": 0,
                     *       "facturaId": null,
                     *       "cargos": [
                     *         {
                     *           "id": 2,
                     *           "fechaHora": "2026-10-08T15:30:00.000Z",
                     *           "tipo": "ALOJAMIENTO",
                     *           "concepto": "Alojamiento · reserva de canal",
                     *           "cantidad": 1,
                     *           "precioUnitario": 1800,
                     *           "monto": 1800,
                     *           "estado": "VIGENTE",
                     *           "motivoAnulacion": null,
                     *           "responsable": "María López",
                     *           "anuladoPor": null
                     *         },
                     *         {
                     *           "id": 1,
                     *           "fechaHora": "2026-10-08T15:30:00.000Z",
                     *           "tipo": "ROOM_SERVICE",
                     *           "concepto": "Room Service — Pedido #12",
                     *           "cantidad": 2,
                     *           "precioUnitario": 25,
                     *           "monto": 50,
                     *           "estado": "VIGENTE",
                     *           "motivoAnulacion": null,
                     *           "responsable": "María López",
                     *           "anuladoPor": null
                     *         }
                     *       ],
                     *       "pagos": [
                     *         {
                     *           "id": 2,
                     *           "fechaHora": "2026-10-08T15:40:00.000Z",
                     *           "metodo": "CANAL",
                     *           "monto": 1800,
                     *           "estado": "APROBADO",
                     *           "referencia": "Pago de prueba",
                     *           "responsable": "RECURRENTE"
                     *         },
                     *         {
                     *           "id": 1,
                     *           "fechaHora": "2026-10-08T15:40:00.000Z",
                     *           "metodo": "RECURRENTE",
                     *           "monto": 50,
                     *           "estado": "APROBADO",
                     *           "referencia": "Pago de prueba",
                     *           "responsable": "RECURRENTE"
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["CuentaRecepcion"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
        };
    };
    agregarCargoServicio: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @example VS-7K2M9Q */
                codigo: components["schemas"]["CodigoReserva"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "concepto": "Servicio de lavandería",
                 *       "cantidad": 1,
                 *       "precioUnitario": 1
                 *     }
                 */
                "application/json": components["schemas"]["AgregarCargoPeticion"];
            };
        };
        responses: {
            /** @description Agregar cargo de servicio. */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": 1,
                     *       "fechaHora": "2026-10-08T15:30:00.000Z",
                     *       "tipo": "ROOM_SERVICE",
                     *       "concepto": "Room Service — Pedido #12",
                     *       "cantidad": 2,
                     *       "precioUnitario": 25,
                     *       "monto": 50,
                     *       "estado": "VIGENTE",
                     *       "motivoAnulacion": null,
                     *       "responsable": "María López",
                     *       "anuladoPor": null
                     *     }
                     */
                    "application/json": components["schemas"]["CargoCuentaRecepcion"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
        };
    };
    anularCargoAdicional: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @example VS-7K2M9Q */
                codigo: components["schemas"]["CodigoReserva"];
                /** @example 1 */
                id: components["schemas"]["Id"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "motivo": "Registrado por error"
                 *     }
                 */
                "application/json": components["schemas"]["MotivoPeticion"];
            };
        };
        responses: {
            /** @description Anular cargo adicional. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": 1,
                     *       "fechaHora": "2026-10-08T15:30:00.000Z",
                     *       "tipo": "ROOM_SERVICE",
                     *       "concepto": "Room Service — Pedido #12",
                     *       "cantidad": 2,
                     *       "precioUnitario": 25,
                     *       "monto": 50,
                     *       "estado": "VIGENTE",
                     *       "motivoAnulacion": null,
                     *       "responsable": "María López",
                     *       "anuladoPor": null
                     *     }
                     */
                    "application/json": components["schemas"]["CargoCuentaRecepcion"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
        };
    };
    consultarCheckoutRecepcion: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @example VS-7K2M9Q */
                codigo: components["schemas"]["CodigoReserva"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Consultar condiciones de check-out. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "codigoReserva": "VS-ABC123",
                     *       "saldo": 0,
                     *       "nombreCompradorSugerido": "Ana Morales",
                     *       "pedidoEnCamino": false,
                     *       "pedidosACancelar": [
                     *         12
                     *       ],
                     *       "puedeConfirmar": true,
                     *       "motivosBloqueo": []
                     *     }
                     */
                    "application/json": components["schemas"]["VistaCheckout"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
        };
    };
    confirmarCheckoutRecepcion: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @example VS-7K2M9Q */
                codigo: components["schemas"]["CodigoReserva"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "comprador": {
                 *         "nit": "CF",
                 *         "nombreComprador": "Ana Morales"
                 *       },
                 *       "pago": {
                 *         "metodo": "EFECTIVO",
                 *         "referencia": "Pago en recepción"
                 *       }
                 *     }
                 */
                "application/json": components["schemas"]["CheckoutRecepcionPeticion"];
            };
        };
        responses: {
            /** @description Confirmar check-out en Recepción. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "codigoReserva": "VS-ABC123",
                     *       "estadoReserva": "FINALIZADA",
                     *       "estadoCuenta": "CERRADA",
                     *       "saldo": 0,
                     *       "factura": {
                     *         "id": 1,
                     *         "estado": "EMITIDA",
                     *         "serie": "VS-A",
                     *         "numero": 1,
                     *         "emitidaEn": "2026-10-02T20:30:00.000Z",
                     *         "codigoReserva": "VS-7K2M9Q",
                     *         "hotel": {
                     *           "nombre": "Villa Serena",
                     *           "nombreComercial": "Villa Serena",
                     *           "razonSocial": "Villa Serena de demostración",
                     *           "nit": "1234567-9",
                     *           "direccionFiscal": "Antigua Guatemala",
                     *           "telefono": "55550000",
                     *           "correo": "ana@example.com"
                     *         },
                     *         "comprador": {
                     *           "nit": "CF",
                     *           "nombreComprador": "Ana Morales"
                     *         },
                     *         "cargos": [
                     *           {
                     *             "concepto": "Alojamiento · reserva de canal",
                     *             "cantidad": 1,
                     *             "precioUnitario": 1800,
                     *             "monto": 1800
                     *           },
                     *           {
                     *             "concepto": "Room Service — Pedido #12",
                     *             "cantidad": 2,
                     *             "precioUnitario": 25,
                     *             "monto": 50
                     *           }
                     *         ],
                     *         "pagos": [
                     *           {
                     *             "metodo": "CANAL",
                     *             "monto": 1800
                     *           },
                     *           {
                     *             "metodo": "RECURRENTE",
                     *             "monto": 50
                     *           }
                     *         ],
                     *         "total": 1850,
                     *         "leyendaIva": "IVA incluido",
                     *         "leyendaLegal": "Factura de demostración — no válida ante la SAT"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["CheckoutResultado"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
        };
    };
    consultarFactura: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @example 1 */
                id: components["schemas"]["Id"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Consultar detalle de factura. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": 1,
                     *       "estado": "EMITIDA",
                     *       "serie": "VS-A",
                     *       "numero": 1,
                     *       "emitidaEn": "2026-10-02T20:30:00.000Z",
                     *       "codigoReserva": "VS-7K2M9Q",
                     *       "hotel": {
                     *         "nombre": "Villa Serena",
                     *         "nombreComercial": "Villa Serena",
                     *         "razonSocial": "Villa Serena de demostración",
                     *         "nit": "1234567-9",
                     *         "direccionFiscal": "Antigua Guatemala",
                     *         "telefono": "55550000",
                     *         "correo": "ana@example.com"
                     *       },
                     *       "comprador": {
                     *         "nit": "CF",
                     *         "nombreComprador": "Ana Morales"
                     *       },
                     *       "cargos": [
                     *         {
                     *           "concepto": "Alojamiento · reserva de canal",
                     *           "cantidad": 1,
                     *           "precioUnitario": 1800,
                     *           "monto": 1800
                     *         },
                     *         {
                     *           "concepto": "Room Service — Pedido #12",
                     *           "cantidad": 2,
                     *           "precioUnitario": 25,
                     *           "monto": 50
                     *         }
                     *       ],
                     *       "pagos": [
                     *         {
                     *           "metodo": "CANAL",
                     *           "monto": 1800
                     *         },
                     *         {
                     *           "metodo": "RECURRENTE",
                     *           "monto": 50
                     *         }
                     *       ],
                     *       "total": 1850,
                     *       "leyendaIva": "IVA incluido",
                     *       "leyendaLegal": "Factura de demostración — no válida ante la SAT"
                     *     }
                     */
                    "application/json": components["schemas"]["FacturaDetalle"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
        };
    };
    descargarFactura: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @example 1 */
                id: components["schemas"]["Id"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Obtener enlace temporal al PDF. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "url": "http://localhost:9000/privado/factura-demo.pdf?firma=ejemplo",
                     *       "expiraEn": "2026-10-08T16:05:00.000Z"
                     *     }
                     */
                    "application/json": components["schemas"]["DescargaFactura"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
        };
    };
    subirImagen: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "archivo": "<seleccionar JPG o PNG de hasta 5 MiB>",
                 *       "uso": "INCIDENCIA"
                 *     }
                 */
                "multipart/form-data": components["schemas"]["SubirImagenPeticion"];
            };
        };
        responses: {
            /** @description Subir imagen autorizada. */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "clave": "hotel/foto-demo.jpg"
                     *     }
                     */
                    "application/json": components["schemas"]["ImagenSubida"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            409: components["responses"]["Conflict"];
            /** @description ALMACEN_NO_DISPONIBLE. No se guardaron cambios en la galería. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    listarEmpleadosAdmin: {
        parameters: {
            query?: {
                /** @example ADMIN */
                rol?: components["schemas"]["RolEmpleado"];
                /** @example ACTIVO */
                estado?: components["schemas"]["EstadoCatalogo"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Listar empleados. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example [
                     *       {
                     *         "id": 7,
                     *         "nombreCompleto": "María López",
                     *         "correo": "maria@villaserena.test",
                     *         "telefono": "55550000",
                     *         "rol": "MANTENIMIENTO_LIMPIEZA",
                     *         "area": "LIMPIEZA",
                     *         "estado": "ACTIVO"
                     *       }
                     *     ]
                     */
                    "application/json": components["schemas"]["EmpleadoAdmin"][];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
        };
    };
    crearEmpleadoAdmin: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "nombreCompleto": "María López",
                 *       "correo": "maria@villaserena.test",
                 *       "telefono": "55550000",
                 *       "rol": "MANTENIMIENTO_LIMPIEZA",
                 *       "area": "LIMPIEZA"
                 *     }
                 */
                "application/json": components["schemas"]["CrearEmpleadoPeticion"];
            };
        };
        responses: {
            /** @description Crear empleado. */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "empleado": {
                     *         "id": 7,
                     *         "nombreCompleto": "María López",
                     *         "correo": "maria@villaserena.test",
                     *         "telefono": "55550000",
                     *         "rol": "MANTENIMIENTO_LIMPIEZA",
                     *         "area": "LIMPIEZA",
                     *         "estado": "ACTIVO"
                     *       },
                     *       "contrasenaTemporal": "Demostración"
                     *     }
                     */
                    "application/json": components["schemas"]["EmpleadoCreado"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            409: components["responses"]["Conflict"];
        };
    };
    editarEmpleadoAdmin: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @example 1 */
                id: components["schemas"]["Id"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "nombreCompleto": "María López",
                 *       "telefono": "55550000",
                 *       "rol": "MANTENIMIENTO_LIMPIEZA",
                 *       "area": "LIMPIEZA"
                 *     }
                 */
                "application/json": components["schemas"]["EditarEmpleadoPeticion"];
            };
        };
        responses: {
            /** @description Editar empleado. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": 7,
                     *       "nombreCompleto": "María López",
                     *       "correo": "maria@villaserena.test",
                     *       "telefono": "55550000",
                     *       "rol": "MANTENIMIENTO_LIMPIEZA",
                     *       "area": "LIMPIEZA",
                     *       "estado": "ACTIVO"
                     *     }
                     */
                    "application/json": components["schemas"]["EmpleadoAdmin"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
        };
    };
    estadoEmpleadoAdmin: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @example 1 */
                id: components["schemas"]["Id"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "estado": "INACTIVO"
                 *     }
                 */
                "application/json": components["schemas"]["EstadoCatalogoPeticion"];
            };
        };
        responses: {
            /** @description Activar o desactivar empleado. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": 7,
                     *       "nombreCompleto": "María López",
                     *       "correo": "maria@villaserena.test",
                     *       "telefono": "55550000",
                     *       "rol": "MANTENIMIENTO_LIMPIEZA",
                     *       "area": "LIMPIEZA",
                     *       "estado": "INACTIVO"
                     *     }
                     */
                    "application/json": components["schemas"]["EmpleadoAdmin"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
        };
    };
    restablecerContrasenaAdmin: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @example 1 */
                id: components["schemas"]["Id"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Restablecer contraseña temporal. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "contrasenaTemporal": "Temporal123Demo"
                     *     }
                     */
                    "application/json": components["schemas"]["ContrasenaRestablecida"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
        };
    };
    listarTiposAdmin: {
        parameters: {
            query?: {
                /** @example ACTIVO */
                estado?: components["schemas"]["EstadoCatalogo"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Listar tipos de habitación. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example [
                     *       {
                     *         "id": 1,
                     *         "nombre": "Villa Serena",
                     *         "descripcion": "Descripción de demostración",
                     *         "capacidad": 1,
                     *         "precioBase": 1,
                     *         "estado": "ACTIVO",
                     *         "ajusteFinSemanaPct": 1,
                     *         "fotos": [
                     *           {
                     *             "clave": "tipos/suite-demo.jpg",
                     *             "url": "https://d13s29erv78l4g.cloudfront.net/tipos/suite-demo.jpg",
                     *             "principal": true,
                     *             "orden": 0
                     *           }
                     *         ]
                     *       }
                     *     ]
                     */
                    "application/json": components["schemas"]["TipoHabitacionAdmin"][];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
        };
    };
    crearTipoAdmin: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "nombre": "Villa Serena",
                 *       "descripcion": "Descripción de demostración",
                 *       "capacidad": 1,
                 *       "precioBase": 1
                 *     }
                 */
                "application/json": components["schemas"]["CrearTipoHabitacionPeticion"];
            };
        };
        responses: {
            /** @description Crear tipo de habitación. */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": 1,
                     *       "nombre": "Villa Serena",
                     *       "descripcion": "Descripción de demostración",
                     *       "capacidad": 1,
                     *       "precioBase": 1,
                     *       "estado": "ACTIVO",
                     *       "ajusteFinSemanaPct": 1,
                     *       "fotos": [
                     *         {
                     *           "clave": "tipos/suite-demo.jpg",
                     *           "url": "https://d13s29erv78l4g.cloudfront.net/tipos/suite-demo.jpg",
                     *           "principal": true,
                     *           "orden": 0
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["TipoHabitacionAdmin"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            409: components["responses"]["Conflict"];
        };
    };
    detalleTipoAdmin: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @example 1 */
                id: components["schemas"]["Id"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Consultar tipo de habitación. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": 1,
                     *       "nombre": "Villa Serena",
                     *       "descripcion": "Descripción de demostración",
                     *       "capacidad": 1,
                     *       "precioBase": 1,
                     *       "estado": "ACTIVO",
                     *       "ajusteFinSemanaPct": 1,
                     *       "fotos": [
                     *         {
                     *           "clave": "tipos/suite-demo.jpg",
                     *           "url": "https://d13s29erv78l4g.cloudfront.net/tipos/suite-demo.jpg",
                     *           "principal": true,
                     *           "orden": 0
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["TipoHabitacionAdmin"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
        };
    };
    editarTipoAdmin: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @example 1 */
                id: components["schemas"]["Id"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "nombre": "Villa Serena",
                 *       "descripcion": "Descripción de demostración",
                 *       "capacidad": 1,
                 *       "precioBase": 1
                 *     }
                 */
                "application/json": components["schemas"]["EditarTipoHabitacionPeticion"];
            };
        };
        responses: {
            /** @description Editar tipo de habitación. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": 1,
                     *       "nombre": "Villa Serena",
                     *       "descripcion": "Descripción de demostración",
                     *       "capacidad": 1,
                     *       "precioBase": 1,
                     *       "estado": "ACTIVO",
                     *       "ajusteFinSemanaPct": 1,
                     *       "fotos": [
                     *         {
                     *           "clave": "tipos/suite-demo.jpg",
                     *           "url": "https://d13s29erv78l4g.cloudfront.net/tipos/suite-demo.jpg",
                     *           "principal": true,
                     *           "orden": 0
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["TipoHabitacionAdmin"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
        };
    };
    estadoTipoAdmin: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @example 1 */
                id: components["schemas"]["Id"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "estado": "INACTIVO"
                 *     }
                 */
                "application/json": components["schemas"]["EstadoCatalogoPeticion"];
            };
        };
        responses: {
            /** @description Activar o desactivar tipo. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": 1,
                     *       "nombre": "Villa Serena",
                     *       "descripcion": "Descripción de demostración",
                     *       "capacidad": 1,
                     *       "precioBase": 1,
                     *       "estado": "INACTIVO",
                     *       "ajusteFinSemanaPct": 1,
                     *       "fotos": [
                     *         {
                     *           "clave": "tipos/suite-demo.jpg",
                     *           "url": "https://d13s29erv78l4g.cloudfront.net/tipos/suite-demo.jpg",
                     *           "principal": true,
                     *           "orden": 0
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["TipoHabitacionAdmin"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
        };
    };
    actualizarFotosTipoAdmin: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @example 1 */
                id: components["schemas"]["Id"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "fotos": [
                 *         {
                 *           "clave": "tipos/suite-demo.jpg",
                 *           "principal": true,
                 *           "orden": 0
                 *         }
                 *       ]
                 *     }
                 */
                "application/json": components["schemas"]["FotosTipoPeticion"];
            };
        };
        responses: {
            /** @description Actualizar fotos y principal del tipo. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": 1,
                     *       "nombre": "Villa Serena",
                     *       "descripcion": "Descripción de demostración",
                     *       "capacidad": 1,
                     *       "precioBase": 1,
                     *       "estado": "ACTIVO",
                     *       "ajusteFinSemanaPct": 1,
                     *       "fotos": [
                     *         {
                     *           "clave": "tipos/suite-demo.jpg",
                     *           "url": "https://d13s29erv78l4g.cloudfront.net/tipos/suite-demo.jpg",
                     *           "principal": true,
                     *           "orden": 0
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["TipoHabitacionAdmin"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
        };
    };
    ajusteFinSemanaAdmin: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @example 1 */
                id: components["schemas"]["Id"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "ajusteFinSemanaPct": 1
                 *     }
                 */
                "application/json": components["schemas"]["AjusteFinSemanaPeticion"];
            };
        };
        responses: {
            /** @description Configurar ajuste de fin de semana. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": 1,
                     *       "nombre": "Villa Serena",
                     *       "descripcion": "Descripción de demostración",
                     *       "capacidad": 1,
                     *       "precioBase": 1,
                     *       "estado": "ACTIVO",
                     *       "ajusteFinSemanaPct": 1,
                     *       "fotos": [
                     *         {
                     *           "clave": "tipos/suite-demo.jpg",
                     *           "url": "https://d13s29erv78l4g.cloudfront.net/tipos/suite-demo.jpg",
                     *           "principal": true,
                     *           "orden": 0
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["TipoHabitacionAdmin"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
        };
    };
    listarHabitacionesAdmin: {
        parameters: {
            query?: {
                /** @example ACTIVO */
                estado?: components["schemas"]["EstadoCatalogo"];
                /** @example 1 */
                tipoHabitacionId?: components["schemas"]["Id"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Listar catálogo de habitaciones. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example [
                     *       {
                     *         "id": 1,
                     *         "numero": "204",
                     *         "piso": 1,
                     *         "tipoHabitacionId": 1,
                     *         "estado": "ACTIVO",
                     *         "ocupacion": "LIBRE",
                     *         "condicion": "LIMPIA"
                     *       }
                     *     ]
                     */
                    "application/json": components["schemas"]["HabitacionAdmin"][];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
        };
    };
    crearHabitacionAdmin: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "numero": "204",
                 *       "piso": 1,
                 *       "tipoHabitacionId": 1
                 *     }
                 */
                "application/json": components["schemas"]["CrearHabitacionPeticion"];
            };
        };
        responses: {
            /** @description Crear habitación. */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": 1,
                     *       "numero": "204",
                     *       "piso": 1,
                     *       "tipoHabitacionId": 1,
                     *       "estado": "ACTIVO",
                     *       "ocupacion": "LIBRE",
                     *       "condicion": "LIMPIA"
                     *     }
                     */
                    "application/json": components["schemas"]["HabitacionAdmin"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            409: components["responses"]["Conflict"];
        };
    };
    editarHabitacionAdmin: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @example 1 */
                id: components["schemas"]["Id"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "numero": "204",
                 *       "piso": 1,
                 *       "tipoHabitacionId": 1
                 *     }
                 */
                "application/json": components["schemas"]["EditarHabitacionPeticion"];
            };
        };
        responses: {
            /** @description Editar habitación. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": 1,
                     *       "numero": "204",
                     *       "piso": 1,
                     *       "tipoHabitacionId": 1,
                     *       "estado": "ACTIVO",
                     *       "ocupacion": "LIBRE",
                     *       "condicion": "LIMPIA"
                     *     }
                     */
                    "application/json": components["schemas"]["HabitacionAdmin"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
        };
    };
    estadoHabitacionAdmin: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @example 1 */
                id: components["schemas"]["Id"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "estado": "INACTIVO"
                 *     }
                 */
                "application/json": components["schemas"]["EstadoCatalogoPeticion"];
            };
        };
        responses: {
            /** @description Activar o desactivar habitación. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": 1,
                     *       "numero": "204",
                     *       "piso": 1,
                     *       "tipoHabitacionId": 1,
                     *       "estado": "INACTIVO",
                     *       "ocupacion": "LIBRE",
                     *       "condicion": "LIMPIA"
                     *     }
                     */
                    "application/json": components["schemas"]["HabitacionAdmin"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
        };
    };
    listarCategoriasAdmin: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Listar categorías de menú. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example [
                     *       {
                     *         "id": 1,
                     *         "nombre": "Bebidas"
                     *       }
                     *     ]
                     */
                    "application/json": components["schemas"]["CategoriaMenu"][];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
        };
    };
    crearCategoriaAdmin: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "nombre": "Villa Serena"
                 *     }
                 */
                "application/json": components["schemas"]["CategoriaMenuPeticion"];
            };
        };
        responses: {
            /** @description Crear categoría de menú. */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": 1,
                     *       "nombre": "Bebidas"
                     *     }
                     */
                    "application/json": components["schemas"]["CategoriaMenu"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            409: components["responses"]["Conflict"];
        };
    };
    editarCategoriaAdmin: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @example 1 */
                id: components["schemas"]["Id"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "nombre": "Villa Serena"
                 *     }
                 */
                "application/json": components["schemas"]["CategoriaMenuPeticion"];
            };
        };
        responses: {
            /** @description Editar categoría de menú. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": 1,
                     *       "nombre": "Bebidas"
                     *     }
                     */
                    "application/json": components["schemas"]["CategoriaMenu"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
        };
    };
    listarItemsAdmin: {
        parameters: {
            query?: {
                /** @example 1 */
                categoriaId?: components["schemas"]["Id"];
                /** @example ACTIVO */
                estado?: components["schemas"]["EstadoCatalogo"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Listar ítems del menú. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example [
                     *       {
                     *         "id": 1,
                     *         "nombre": "Villa Serena",
                     *         "descripcion": "Descripción de demostración",
                     *         "categoriaId": 1,
                     *         "precio": 1,
                     *         "fotoClave": null,
                     *         "disponibilidad": "DISPONIBLE",
                     *         "estado": "ACTIVO"
                     *       }
                     *     ]
                     */
                    "application/json": components["schemas"]["ItemMenuAdmin"][];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
        };
    };
    crearItemAdmin: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "nombre": "Villa Serena",
                 *       "descripcion": "Descripción de demostración",
                 *       "categoriaId": 1,
                 *       "precio": 1,
                 *       "fotoClave": null
                 *     }
                 */
                "application/json": components["schemas"]["CrearItemMenuPeticion"];
            };
        };
        responses: {
            /** @description Crear ítem del menú. */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": 1,
                     *       "nombre": "Villa Serena",
                     *       "descripcion": "Descripción de demostración",
                     *       "categoriaId": 1,
                     *       "precio": 1,
                     *       "fotoClave": null,
                     *       "disponibilidad": "DISPONIBLE",
                     *       "estado": "ACTIVO"
                     *     }
                     */
                    "application/json": components["schemas"]["ItemMenuAdmin"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            409: components["responses"]["Conflict"];
        };
    };
    editarItemAdmin: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @example 1 */
                id: components["schemas"]["Id"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "nombre": "Villa Serena",
                 *       "descripcion": "Descripción de demostración",
                 *       "categoriaId": 1,
                 *       "precio": 1,
                 *       "fotoClave": null
                 *     }
                 */
                "application/json": components["schemas"]["EditarItemMenuPeticion"];
            };
        };
        responses: {
            /** @description Editar ítem del menú. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": 1,
                     *       "nombre": "Villa Serena",
                     *       "descripcion": "Descripción de demostración",
                     *       "categoriaId": 1,
                     *       "precio": 1,
                     *       "fotoClave": null,
                     *       "disponibilidad": "DISPONIBLE",
                     *       "estado": "ACTIVO"
                     *     }
                     */
                    "application/json": components["schemas"]["ItemMenuAdmin"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
        };
    };
    estadoItemAdmin: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @example 1 */
                id: components["schemas"]["Id"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "estado": "INACTIVO"
                 *     }
                 */
                "application/json": components["schemas"]["EstadoCatalogoPeticion"];
            };
        };
        responses: {
            /** @description Activar o desactivar ítem. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": 1,
                     *       "nombre": "Villa Serena",
                     *       "descripcion": "Descripción de demostración",
                     *       "categoriaId": 1,
                     *       "precio": 1,
                     *       "fotoClave": null,
                     *       "disponibilidad": "DISPONIBLE",
                     *       "estado": "INACTIVO"
                     *     }
                     */
                    "application/json": components["schemas"]["ItemMenuAdmin"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
        };
    };
    reactivarItemAdmin: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @example 1 */
                id: components["schemas"]["Id"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Reactivar ítem agotado. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": 1,
                     *       "nombre": "Villa Serena",
                     *       "descripcion": "Descripción de demostración",
                     *       "categoriaId": 1,
                     *       "precio": 1,
                     *       "fotoClave": null,
                     *       "disponibilidad": "DISPONIBLE",
                     *       "estado": "ACTIVO"
                     *     }
                     */
                    "application/json": components["schemas"]["ItemMenuAdmin"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
        };
    };
    listarTemporadasAdmin: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Listar temporadas. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example [
                     *       {
                     *         "id": 1,
                     *         "nombre": "Villa Serena",
                     *         "inicio": "2026-10-15T00:00:00.000Z",
                     *         "fin": "2026-10-15T00:00:00.000Z",
                     *         "ajustePct": 1,
                     *         "tipoHabitacionIds": [
                     *           1
                     *         ]
                     *       }
                     *     ]
                     */
                    "application/json": components["schemas"]["TemporadaAdmin"][];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
        };
    };
    crearTemporadaAdmin: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "nombre": "Temporada alta",
                 *       "inicio": "2026-12-01T00:00:00.000Z",
                 *       "fin": "2026-12-31T00:00:00.000Z",
                 *       "ajustePct": 20,
                 *       "tipoHabitacionIds": [
                 *         1
                 *       ]
                 *     }
                 */
                "application/json": components["schemas"]["TemporadaPeticion"];
            };
        };
        responses: {
            /** @description Crear temporada. */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": 1,
                     *       "nombre": "Villa Serena",
                     *       "inicio": "2026-10-15T00:00:00.000Z",
                     *       "fin": "2026-10-15T00:00:00.000Z",
                     *       "ajustePct": 1,
                     *       "tipoHabitacionIds": [
                     *         1
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["TemporadaAdmin"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            409: components["responses"]["Conflict"];
        };
    };
    editarTemporadaAdmin: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @example 1 */
                id: components["schemas"]["Id"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "nombre": "Temporada alta",
                 *       "inicio": "2026-12-01T00:00:00.000Z",
                 *       "fin": "2026-12-31T00:00:00.000Z",
                 *       "ajustePct": 20,
                 *       "tipoHabitacionIds": [
                 *         1
                 *       ]
                 *     }
                 */
                "application/json": components["schemas"]["TemporadaPeticion"];
            };
        };
        responses: {
            /** @description Reemplazar temporada. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": 1,
                     *       "nombre": "Villa Serena",
                     *       "inicio": "2026-10-15T00:00:00.000Z",
                     *       "fin": "2026-10-15T00:00:00.000Z",
                     *       "ajustePct": 1,
                     *       "tipoHabitacionIds": [
                     *         1
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["TemporadaAdmin"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
        };
    };
    eliminarTemporadaAdmin: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @example 1 */
                id: components["schemas"]["Id"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Eliminar temporada. Sin cuerpo. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
        };
    };
    consultarHotelAdmin: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Consultar datos generales y fiscales. */
            200: {
                headers: {
                    /** @description Revisión fuerte de la galería; conservar las comillas y enviar como If-Match para cambiar fotos. */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "nombre": "Villa Serena",
                     *       "descripcion": "Descripción de demostración",
                     *       "direccion": "Antigua Guatemala",
                     *       "telefono": "55550000",
                     *       "correo": "ana@example.com",
                     *       "nombreComercial": "Villa Serena",
                     *       "razonSocial": "Villa Serena de demostración",
                     *       "nit": "1234567-9",
                     *       "direccionFiscal": "Antigua Guatemala",
                     *       "fotos": [
                     *         {
                     *           "clave": "hotel/foto-demo.jpg",
                     *           "orden": 0
                     *         }
                     *       ],
                     *       "horaCheckIn": "15:00",
                     *       "horaCheckOut": "12:00",
                     *       "politicaCancelacion": "Reembolso total con al menos 48 horas antes de las 15:00 de llegada; sin reembolso después."
                     *     }
                     */
                    "application/json": components["schemas"]["HotelAdmin"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            /** @description HOTEL_NO_CONFIGURADO. Inicializar mediante la operación específica. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    editarHotelAdmin: {
        parameters: {
            query?: never;
            header?: {
                /** @description Obligatorio solo si cambia la galería. Debe coincidir con el ETag de la consulta administrativa vigente. Sin revisión o con revisión obsoleta, 409 GALERIA_CAMBIADA y ningún cambio. */
                "If-Match"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "nombre": "Villa Serena",
                 *       "descripcion": "Descripción de demostración",
                 *       "direccion": "Antigua Guatemala",
                 *       "telefono": "55550000",
                 *       "correo": "ana@example.com",
                 *       "nombreComercial": "Villa Serena",
                 *       "razonSocial": "Villa Serena de demostración",
                 *       "nit": "1234567-9",
                 *       "direccionFiscal": "Antigua Guatemala",
                 *       "fotos": [
                 *         {
                 *           "clave": "hotel/foto-demo.jpg",
                 *           "orden": 0
                 *         }
                 *       ]
                 *     }
                 */
                "application/json": components["schemas"]["HotelAdminPeticion"];
            };
        };
        responses: {
            /** @description Actualizar datos del hotel. */
            200: {
                headers: {
                    /** @description Revisión fuerte de la galería resultante. */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "nombre": "Villa Serena",
                     *       "descripcion": "Descripción de demostración",
                     *       "direccion": "Antigua Guatemala",
                     *       "telefono": "55550000",
                     *       "correo": "ana@example.com",
                     *       "nombreComercial": "Villa Serena",
                     *       "razonSocial": "Villa Serena de demostración",
                     *       "nit": "1234567-9",
                     *       "direccionFiscal": "Antigua Guatemala",
                     *       "fotos": [
                     *         {
                     *           "clave": "hotel/foto-demo.jpg",
                     *           "orden": 0
                     *         }
                     *       ],
                     *       "horaCheckIn": "15:00",
                     *       "horaCheckOut": "12:00",
                     *       "politicaCancelacion": "Reembolso total con al menos 48 horas antes de las 15:00 de llegada; sin reembolso después."
                     *     }
                     */
                    "application/json": components["schemas"]["HotelAdmin"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            /** @description HOTEL_NO_CONFIGURADO. Inicializar mediante la operación específica. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            409: components["responses"]["Conflict"];
            /** @description ALMACEN_NO_DISPONIBLE. No se guardaron cambios en la galería. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    inicializarHotelAdmin: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["InicializarHotelPeticion"];
            };
        };
        responses: {
            /** @description Los datos normalizados coinciden; configuración devuelta sin cambios. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HotelAdmin"];
                };
            };
            /** @description Configuración creada; ninguna otra entidad fue modificada. */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HotelAdmin"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            /** @description HOTEL_YA_CONFIGURADO. Hay una configuración con datos distintos; no se sobrescribe. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    indicadoresAdmin: {
        parameters: {
            query?: {
                /** @example "2026-10-15T00:00:00.000Z" */
                inicio?: components["schemas"]["FechaEstadia"];
                /** @example "2026-10-15T00:00:00.000Z" */
                fin?: components["schemas"]["FechaEstadia"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Consultar indicadores básicos. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "inicio": "2026-10-15T00:00:00.000Z",
                     *       "fin": "2026-10-15T00:00:00.000Z",
                     *       "ocupacionHoy": {
                     *         "fecha": "2026-10-15T00:00:00.000Z",
                     *         "habitacionesOcupadas": 0,
                     *         "habitacionesActivas": 0,
                     *         "porcentaje": 0
                     *       },
                     *       "ingresos": 1,
                     *       "reservasPorCanal": [
                     *         {
                     *           "canal": "DIRECTO_WEB",
                     *           "cantidad": 0
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["Indicadores"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
        };
    };
    enviarReservaCanalSimulado: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "canal": "BOOKING",
                 *       "reserva": {
                 *         "identificadorExterno": "Demostración",
                 *         "tipoHabitacionId": 1,
                 *         "entrada": "2026-10-15T00:00:00.000Z",
                 *         "salida": "2026-10-15T00:00:00.000Z",
                 *         "numeroHuespedes": 1,
                 *         "montoTotal": 1,
                 *         "huesped": {
                 *           "nombreCompleto": "María José López",
                 *           "correo": "maria.lopez@example.com",
                 *           "telefono": "+502 5555 1234",
                 *           "nacionalidad": "Guatemalteca",
                 *           "tipoDocumento": "DPI",
                 *           "numeroDocumento": "2547896320101"
                 *         }
                 *       }
                 *     }
                 */
                "application/json": components["schemas"]["CanalSimuladoPeticion"];
            };
        };
        responses: {
            /** @description Enviar reserva por canal simulado. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "codigoHttp": 200,
                     *       "respuesta": {
                     *         "codigo": "VS-7K2M9Q",
                     *         "estado": "PENDIENTE_PAGO",
                     *         "canal": "DIRECTO_WEB",
                     *         "identificadorExterno": "Demostración",
                     *         "tipoHabitacion": {
                     *           "id": 1,
                     *           "nombre": "Doble Superior"
                     *         },
                     *         "entrada": "2026-10-15T00:00:00.000Z",
                     *         "salida": "2026-10-15T00:00:00.000Z",
                     *         "numeroHuespedes": 1,
                     *         "montoTotal": 1
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["CanalSimuladoResultado"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            409: components["responses"]["Conflict"];
        };
    };
    amenidadesHuesped: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Consultar amenidades activas. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example [
                     *       {
                     *         "id": 1,
                     *         "nombre": "Villa Serena",
                     *         "descripcion": "Descripción de demostración",
                     *         "horario": "Demostración",
                     *         "ubicacion": "Demostración",
                     *         "orden": 0,
                     *         "fotoUrl": null
                     *       }
                     *     ]
                     */
                    "application/json": components["schemas"]["AmenidadApp"][];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
        };
    };
    wifiHuesped: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Consultar Wi-Fi de huéspedes. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "nombreRed": "VillaSerena-Huespedes",
                     *       "contrasena": "EjemploWifi2026"
                     *     }
                     */
                    "application/json": components["schemas"]["Wifi"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
        };
    };
    listarAmenidadesAdmin: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Listar amenidades. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example [
                     *       {
                     *         "id": 1,
                     *         "nombre": "Villa Serena",
                     *         "descripcion": "Descripción de demostración",
                     *         "fotoClave": null,
                     *         "horario": "Demostración",
                     *         "ubicacion": "Demostración",
                     *         "orden": 0,
                     *         "estado": "ACTIVO"
                     *       }
                     *     ]
                     */
                    "application/json": components["schemas"]["AmenidadAdmin"][];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
        };
    };
    crearAmenidadAdmin: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "nombre": "Villa Serena",
                 *       "descripcion": "Descripción de demostración",
                 *       "fotoClave": null,
                 *       "horario": "Demostración",
                 *       "ubicacion": "Demostración",
                 *       "orden": 0
                 *     }
                 */
                "application/json": components["schemas"]["AmenidadPeticion"];
            };
        };
        responses: {
            /** @description Crear amenidad. */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": 1,
                     *       "nombre": "Villa Serena",
                     *       "descripcion": "Descripción de demostración",
                     *       "fotoClave": null,
                     *       "horario": "Demostración",
                     *       "ubicacion": "Demostración",
                     *       "orden": 0,
                     *       "estado": "ACTIVO"
                     *     }
                     */
                    "application/json": components["schemas"]["AmenidadAdmin"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            409: components["responses"]["Conflict"];
        };
    };
    editarAmenidadAdmin: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @example 1 */
                id: components["schemas"]["Id"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "nombre": "Villa Serena",
                 *       "descripcion": "Descripción de demostración",
                 *       "fotoClave": null,
                 *       "horario": "Demostración",
                 *       "ubicacion": "Demostración",
                 *       "orden": 0
                 *     }
                 */
                "application/json": components["schemas"]["EditarAmenidadPeticion"];
            };
        };
        responses: {
            /** @description Editar amenidad. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": 1,
                     *       "nombre": "Villa Serena",
                     *       "descripcion": "Descripción de demostración",
                     *       "fotoClave": null,
                     *       "horario": "Demostración",
                     *       "ubicacion": "Demostración",
                     *       "orden": 0,
                     *       "estado": "ACTIVO"
                     *     }
                     */
                    "application/json": components["schemas"]["AmenidadAdmin"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
        };
    };
    estadoAmenidadAdmin: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @example 1 */
                id: components["schemas"]["Id"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "estado": "INACTIVO"
                 *     }
                 */
                "application/json": components["schemas"]["EstadoCatalogoPeticion"];
            };
        };
        responses: {
            /** @description Activar o desactivar amenidad. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": 1,
                     *       "nombre": "Villa Serena",
                     *       "descripcion": "Descripción de demostración",
                     *       "fotoClave": null,
                     *       "horario": "Demostración",
                     *       "ubicacion": "Demostración",
                     *       "orden": 0,
                     *       "estado": "INACTIVO"
                     *     }
                     */
                    "application/json": components["schemas"]["AmenidadAdmin"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
        };
    };
    consultarWifiAdmin: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Consultar configuración Wi-Fi. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "nombreRed": "VillaSerena-Huespedes",
                     *       "contrasena": "EjemploWifi2026"
                     *     }
                     */
                    "application/json": components["schemas"]["Wifi"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
        };
    };
    configurarWifiAdmin: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "nombreRed": "VillaSerena-Huespedes",
                 *       "contrasena": "EjemploWifi2026"
                 *     }
                 */
                "application/json": components["schemas"]["Wifi"];
            };
        };
        responses: {
            /** @description Configurar Wi-Fi para huéspedes. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "nombreRed": "VillaSerena-Huespedes",
                     *       "contrasena": "EjemploWifi2026"
                     *     }
                     */
                    "application/json": components["schemas"]["Wifi"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            409: components["responses"]["Conflict"];
        };
    };
    listarTurnosAdmin: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Listar turnos. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example [
                     *       {
                     *         "id": 1,
                     *         "nombre": "Noche",
                     *         "horaInicio": "22:00",
                     *         "horaFin": "06:00",
                     *         "estado": "ACTIVO"
                     *       }
                     *     ]
                     */
                    "application/json": components["schemas"]["TurnoAdmin"][];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
        };
    };
    crearTurnoAdmin: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "nombre": "Noche",
                 *       "horaInicio": "22:00",
                 *       "horaFin": "06:00"
                 *     }
                 */
                "application/json": components["schemas"]["TurnoPeticion"];
            };
        };
        responses: {
            /** @description Crear turno. */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": 1,
                     *       "nombre": "Noche",
                     *       "horaInicio": "22:00",
                     *       "horaFin": "06:00",
                     *       "estado": "ACTIVO"
                     *     }
                     */
                    "application/json": components["schemas"]["TurnoAdmin"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            409: components["responses"]["Conflict"];
        };
    };
    editarTurnoAdmin: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @example 1 */
                id: components["schemas"]["Id"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "horaInicio": "21:00"
                 *     }
                 */
                "application/json": components["schemas"]["EditarTurnoPeticion"];
            };
        };
        responses: {
            /** @description Editar turno. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": 1,
                     *       "nombre": "Noche",
                     *       "horaInicio": "22:00",
                     *       "horaFin": "06:00",
                     *       "estado": "ACTIVO"
                     *     }
                     */
                    "application/json": components["schemas"]["TurnoAdmin"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
        };
    };
    desactivarTurnoAdmin: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @example 1 */
                id: components["schemas"]["Id"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Desactivar turno. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": 1,
                     *       "nombre": "Noche",
                     *       "horaInicio": "22:00",
                     *       "horaFin": "06:00",
                     *       "estado": "INACTIVO"
                     *     }
                     */
                    "application/json": components["schemas"]["TurnoAdmin"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
        };
    };
    listarAsignacionesTurnosAdmin: {
        parameters: {
            query: {
                /** @example "2026-10-15T00:00:00.000Z" */
                inicio: components["schemas"]["FechaEstadia"];
                /** @example "2026-10-15T00:00:00.000Z" */
                fin: components["schemas"]["FechaEstadia"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Consultar vista semanal de turnos. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example [
                     *       {
                     *         "id": 1,
                     *         "empleado": {
                     *           "id": 7,
                     *           "nombre": "María López"
                     *         },
                     *         "turno": {
                     *           "id": 1,
                     *           "nombre": "Noche",
                     *           "horaInicio": "22:00",
                     *           "horaFin": "06:00",
                     *           "estado": "ACTIVO"
                     *         },
                     *         "fecha": "2026-10-15T00:00:00.000Z"
                     *       }
                     *     ]
                     */
                    "application/json": components["schemas"]["AsignacionTurno"][];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
        };
    };
    asignarTurnosAdmin: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "empleadoId": 7,
                 *       "turnoId": 1,
                 *       "fechas": [
                 *         "2026-10-05T00:00:00.000Z",
                 *         "2026-10-06T00:00:00.000Z"
                 *       ]
                 *     }
                 */
                "application/json": components["schemas"]["AsignarTurnosPeticion"];
            };
        };
        responses: {
            /** @description Asignar turnos por fechas. */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example [
                     *       {
                     *         "id": 1,
                     *         "empleado": {
                     *           "id": 7,
                     *           "nombre": "María López"
                     *         },
                     *         "turno": {
                     *           "id": 1,
                     *           "nombre": "Noche",
                     *           "horaInicio": "22:00",
                     *           "horaFin": "06:00",
                     *           "estado": "ACTIVO"
                     *         },
                     *         "fecha": "2026-10-15T00:00:00.000Z"
                     *       }
                     *     ]
                     */
                    "application/json": components["schemas"]["AsignacionTurno"][];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            409: components["responses"]["Conflict"];
        };
    };
    quitarAsignacionTurnoAdmin: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @example 1 */
                id: components["schemas"]["Id"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Quitar asignación de turno. Sin cuerpo. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
        };
    };
    listarInsumoGestion: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Lista completa, ordenada por creación e id. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example [
                     *       {
                     *         "id": "7f81edc9-cdbc-48f2-8c6a-52b9301117ac",
                     *         "version": 1,
                     *         "nombre": "Foco LED",
                     *         "categoria": "Mantenimiento",
                     *         "unidad": "Unidad",
                     *         "stock": 10,
                     *         "stockMinimo": 2,
                     *         "costoUnitario": 15
                     *       }
                     *     ]
                     */
                    "application/json": components["schemas"]["Insumo"][];
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
        };
    };
    guardarInsumoGestion: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "id": "7f81edc9-cdbc-48f2-8c6a-52b9301117ac",
                 *       "version": 0,
                 *       "datos": {
                 *         "nombre": "Foco LED",
                 *         "categoria": "Mantenimiento",
                 *         "unidad": "Unidad",
                 *         "stock": 10,
                 *         "stockMinimo": 2,
                 *         "costoUnitario": 15
                 *       }
                 *     }
                 */
                "application/json": components["schemas"]["InsumoPeticion"];
            };
        };
        responses: {
            /** @description Registro plano creado, actualizado o recuperado por reenvío. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": "7f81edc9-cdbc-48f2-8c6a-52b9301117ac",
                     *       "version": 1,
                     *       "nombre": "Foco LED",
                     *       "categoria": "Mantenimiento",
                     *       "unidad": "Unidad",
                     *       "stock": 10,
                     *       "stockMinimo": 2,
                     *       "costoUnitario": 15
                     *     }
                     */
                    "application/json": components["schemas"]["Insumo"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            409: components["responses"]["Conflict"];
        };
    };
    listarCompraInventarioGestion: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Lista completa, ordenada por creación e id. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example [
                     *       {
                     *         "id": "1d92ff74-9b70-4cb1-b57f-33de75784649",
                     *         "version": 1,
                     *         "numeroFactura": "DEMO-001",
                     *         "proveedor": "Proveedor ficticio",
                     *         "fecha": "2026-10-19",
                     *         "insumoId": "7f81edc9-cdbc-48f2-8c6a-52b9301117ac",
                     *         "cantidad": 10,
                     *         "costoUnitario": 15,
                     *         "estado": "pagada",
                     *         "ivaIncluido": false,
                     *         "subtotal": 150,
                     *         "impuesto": 18,
                     *         "total": 168
                     *       }
                     *     ]
                     */
                    "application/json": components["schemas"]["CompraInventario"][];
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
        };
    };
    guardarCompraInventarioGestion: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "id": "1d92ff74-9b70-4cb1-b57f-33de75784649",
                 *       "version": 0,
                 *       "datos": {
                 *         "numeroFactura": "DEMO-001",
                 *         "proveedor": "Proveedor ficticio",
                 *         "fecha": "2026-10-19",
                 *         "insumoId": "7f81edc9-cdbc-48f2-8c6a-52b9301117ac",
                 *         "cantidad": 10,
                 *         "costoUnitario": 15,
                 *         "estado": "pagada",
                 *         "ivaIncluido": false
                 *       }
                 *     }
                 */
                "application/json": components["schemas"]["CompraInventarioPeticion"];
            };
        };
        responses: {
            /** @description Registro plano creado, actualizado o recuperado por reenvío. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": "1d92ff74-9b70-4cb1-b57f-33de75784649",
                     *       "version": 1,
                     *       "numeroFactura": "DEMO-001",
                     *       "proveedor": "Proveedor ficticio",
                     *       "fecha": "2026-10-19",
                     *       "insumoId": "7f81edc9-cdbc-48f2-8c6a-52b9301117ac",
                     *       "cantidad": 10,
                     *       "costoUnitario": 15,
                     *       "estado": "pagada",
                     *       "ivaIncluido": false,
                     *       "subtotal": 150,
                     *       "impuesto": 18,
                     *       "total": 168
                     *     }
                     */
                    "application/json": components["schemas"]["CompraInventario"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            409: components["responses"]["Conflict"];
        };
    };
    listarMovimientoInventarioGestion: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Lista completa, ordenada por creación e id. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example [
                     *       {
                     *         "id": "d10b41f7-370a-4c02-a254-f653b39c069f",
                     *         "version": 1,
                     *         "insumoId": "7f81edc9-cdbc-48f2-8c6a-52b9301117ac",
                     *         "tipo": "salida",
                     *         "cantidad": 2,
                     *         "motivo": "Entrega a un área",
                     *         "fecha": "2026-10-19T15:00:00Z"
                     *       }
                     *     ]
                     */
                    "application/json": components["schemas"]["MovimientoInventario"][];
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
        };
    };
    guardarMovimientoInventarioGestion: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "id": "d10b41f7-370a-4c02-a254-f653b39c069f",
                 *       "version": 0,
                 *       "datos": {
                 *         "insumoId": "7f81edc9-cdbc-48f2-8c6a-52b9301117ac",
                 *         "tipo": "salida",
                 *         "cantidad": 2,
                 *         "motivo": "Entrega a un área"
                 *       }
                 *     }
                 */
                "application/json": components["schemas"]["MovimientoInventarioPeticion"];
            };
        };
        responses: {
            /** @description Registro plano creado, actualizado o recuperado por reenvío. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": "d10b41f7-370a-4c02-a254-f653b39c069f",
                     *       "version": 1,
                     *       "insumoId": "7f81edc9-cdbc-48f2-8c6a-52b9301117ac",
                     *       "tipo": "salida",
                     *       "cantidad": 2,
                     *       "motivo": "Entrega a un área",
                     *       "fecha": "2026-10-19T15:00:00Z"
                     *     }
                     */
                    "application/json": components["schemas"]["MovimientoInventario"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            409: components["responses"]["Conflict"];
        };
    };
    consultarIntentoReserva: {
        parameters: {
            query?: {
                origen?: "RESERVA" | "OFERTA";
            };
            header: {
                /** @description Identificador guardado antes de crear; nunca sustituirlo tras una respuesta perdida. */
                "Idempotency-Key": components["parameters"]["BookingIdempotencyKey"];
                "X-Booking-Draft": components["parameters"]["BookingDraft"];
                /** @description Comprobante secreto de verificación del correo para ese borrador; nunca ponerlo en URLs ni logs. */
                "X-Booking-Email-Verification": components["parameters"]["BookingEmailVerification"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Reserva recuperada con su estado actual. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EstadoReservaPublico"];
                };
            };
            400: components["responses"]["BadRequest"];
            404: components["responses"]["NotFound"];
            /** @description SOLICITUD_EN_PROCESO; conservar la clave y consultar de nuevo. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description LIMITE_SOLICITUDES; esperar Retry-After. */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    consultarProcesoPagoSaldoApp: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /**
                 * @description Código de la reserva.
                 * @example VS-7K2M9Q
                 */
                codigo: components["parameters"]["CodigoReservaPath"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Estado observado y acción permitida. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ProcesoPago"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
        };
    };
    listarOfertasAdmin: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Consultar ofertas publicadas y borradores */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["OfertaAdmin"][];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
        };
    };
    detalleOfertaAdmin: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                slug: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Consultar oferta y cantidades derivadas */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["OfertaAdmin"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
        };
    };
    actualizarOfertaAdmin: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                slug: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["GuardarOfertaAdminPeticion"];
            };
        };
        responses: {
            /** @description Reemplazar contenido publicación precio y vínculos de oferta */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["OfertaAdmin"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
        };
    };
    crearOfertaAdmin: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                slug: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["GuardarOfertaAdminPeticion"];
            };
        };
        responses: {
            /** @description Crear oferta con slug inmutable */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["OfertaAdmin"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
        };
    };
    consultarCaracteristicasHabitacionAdmin: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: components["schemas"]["Id"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Consultar características físicas registradas */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CaracteristicasHabitacionAdmin"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
        };
    };
    guardarCaracteristicasHabitacionAdmin: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: components["schemas"]["Id"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CaracteristicasHabitacionPeticion"];
            };
        };
        responses: {
            /** @description Registrar características físicas sin afectar reservas activas */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CaracteristicasHabitacionAdmin"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
        };
    };
    cambiarPublicacionOfertaAdmin: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                slug: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PublicacionOfertaPeticion"];
            };
        };
        responses: {
            /** @description Oferta actualizada */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["OfertaAdmin"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
        };
    };
    consultarBorradorEditorial: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                idioma: "es" | "en";
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Documento del idioma solicitado. Borrador inexistente: revisión 0 y lista vacía. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EditorialSitio"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            /** @description HOTEL_NO_CONFIGURADO o CONTENIDO_NO_PUBLICADO. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            409: components["responses"]["Conflict"];
        };
    };
    guardarBorradorEditorial: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                idioma: "es" | "en";
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["GuardarEditorialPeticion"];
            };
        };
        responses: {
            /** @description Documento del idioma solicitado. Borrador inexistente: revisión 0 y lista vacía. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EditorialSitio"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            /** @description HOTEL_NO_CONFIGURADO o CONTENIDO_NO_PUBLICADO. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            409: components["responses"]["Conflict"];
            /** @description ALMACEN_NO_DISPONIBLE. No se modificó el borrador ni la versión publicada. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    publicarEditorial: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                idioma: "es" | "en";
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PublicarEditorialPeticion"];
            };
        };
        responses: {
            /** @description Documento del idioma solicitado. Borrador inexistente: revisión 0 y lista vacía. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EditorialSitio"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            /** @description HOTEL_NO_CONFIGURADO o CONTENIDO_NO_PUBLICADO. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            409: components["responses"]["Conflict"];
            /** @description ALMACEN_NO_DISPONIBLE. No se modificó el borrador ni la versión publicada. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    consultarEditorialPublicado: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                idioma: "es" | "en";
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Documento del idioma solicitado. Borrador inexistente: revisión 0 y lista vacía. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EditorialSitio"];
                };
            };
            400: components["responses"]["BadRequest"];
            /** @description HOTEL_NO_CONFIGURADO o CONTENIDO_NO_PUBLICADO. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    experienciasAdmin: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Operación completada */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Experiencia"][];
                };
            };
            /** @description Datos inválidos */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Sin sesión */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Rol no permitido */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Recurso no encontrado o ajeno */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Conflicto de cupos, estado, revisión o política */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    crearExperiencia: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ConfigExperiencia"];
            };
        };
        responses: {
            /** @description Operación completada */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Experiencia"];
                };
            };
            /** @description Datos inválidos */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Sin sesión */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Rol no permitido */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Recurso no encontrado o ajeno */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Conflicto de cupos, estado, revisión o política */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    editarExperiencia: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ConfigExperiencia"];
            };
        };
        responses: {
            /** @description Operación completada */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Experiencia"];
                };
            };
            /** @description Datos inválidos */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Sin sesión */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Rol no permitido */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Recurso no encontrado o ajeno */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Conflicto de cupos, estado, revisión o política */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    horariosExperienciaAdmin: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Operación completada */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HorarioExperiencia"][];
                };
            };
            /** @description Datos inválidos */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Sin sesión */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Rol no permitido */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Recurso no encontrado o ajeno */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Conflicto de cupos, estado, revisión o política */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    crearHorarioExperiencia: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ConfigHorarioExperiencia"];
            };
        };
        responses: {
            /** @description Operación completada */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HorarioExperiencia"];
                };
            };
            /** @description Datos inválidos */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Sin sesión */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Rol no permitido */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Recurso no encontrado o ajeno */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Conflicto de cupos, estado, revisión o política */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    editarHorarioExperiencia: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
                horarioId: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ConfigHorarioExperiencia"];
            };
        };
        responses: {
            /** @description Operación completada */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HorarioExperiencia"];
                };
            };
            /** @description Datos inválidos */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Sin sesión */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Rol no permitido */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Recurso no encontrado o ajeno */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Conflicto de cupos, estado, revisión o política */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    experienciasHuesped: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                codigo: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Operación completada */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Experiencia"][];
                };
            };
            /** @description Datos inválidos */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Sin sesión */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Rol no permitido */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Recurso no encontrado o ajeno */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Conflicto de cupos, estado, revisión o política */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    disponibilidadExperiencia: {
        parameters: {
            query?: {
                fecha?: string;
            };
            header?: never;
            path: {
                codigo: string;
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Operación completada */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HorarioExperiencia"][];
                };
            };
            /** @description Datos inválidos */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Sin sesión */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Rol no permitido */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Recurso no encontrado o ajeno */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Conflicto de cupos, estado, revisión o política */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    misReservasExperiencias: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                codigo: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Operación completada */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReservaExperiencia"][];
                };
            };
            /** @description Datos inválidos */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Sin sesión */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Rol no permitido */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Recurso no encontrado o ajeno */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Conflicto de cupos, estado, revisión o política */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    reservarExperiencia: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                codigo: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CrearReservaExperiencia"];
            };
        };
        responses: {
            /** @description Operación completada */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReservaExperiencia"];
                };
            };
            /** @description Datos inválidos */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Sin sesión */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Rol no permitido */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Recurso no encontrado o ajeno */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Conflicto de cupos, estado, revisión o política */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    cancelarExperiencia: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                codigo: string;
                id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CancelarExperiencia"];
            };
        };
        responses: {
            /** @description Operación completada */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReservaExperiencia"];
                };
            };
            /** @description Datos inválidos */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Sin sesión */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Rol no permitido */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Recurso no encontrado o ajeno */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Conflicto de cupos, estado, revisión o política */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    consultarExperiencia: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                codigo: string;
                id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CrearConsultaExperiencia"];
            };
        };
        responses: {
            /** @description Operación completada */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ConsultaExperiencia"];
                };
            };
            /** @description Datos inválidos */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Sin sesión */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Rol no permitido */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Recurso no encontrado o ajeno */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Conflicto de cupos, estado, revisión o política */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    misConsultasExperiencias: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                codigo: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Operación completada */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ConsultaExperiencia"][];
                };
            };
            /** @description Datos inválidos */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Sin sesión */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Rol no permitido */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Recurso no encontrado o ajeno */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Conflicto de cupos, estado, revisión o política */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    reservasExperienciasRecepcion: {
        parameters: {
            query?: {
                fecha?: string;
                experienciaId?: number;
                estado?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Operación completada */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReservaExperiencia"][];
                };
            };
            /** @description Datos inválidos */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Sin sesión */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Rol no permitido */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Recurso no encontrado o ajeno */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Conflicto de cupos, estado, revisión o política */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    decidirReservaExperiencia: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["DecisionExperiencia"];
            };
        };
        responses: {
            /** @description Operación completada */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReservaExperiencia"];
                };
            };
            /** @description Datos inválidos */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Sin sesión */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Rol no permitido */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Recurso no encontrado o ajeno */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Conflicto de cupos, estado, revisión o política */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    consultasExperienciasRecepcion: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Operación completada */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ConsultaExperiencia"][];
                };
            };
            /** @description Datos inválidos */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Sin sesión */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Rol no permitido */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Recurso no encontrado o ajeno */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Conflicto de cupos, estado, revisión o política */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    responderConsultaExperiencia: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ResponderConsultaExperiencia"];
            };
        };
        responses: {
            /** @description Operación completada */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ConsultaExperiencia"];
                };
            };
            /** @description Datos inválidos */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Sin sesión */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Rol no permitido */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Recurso no encontrado o ajeno */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Conflicto de cupos, estado, revisión o política */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
}
