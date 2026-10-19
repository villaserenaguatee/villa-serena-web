# Issue #60: simplificar el MVP

Trabajo exclusivo del frontend, desde `develop` (`f8edf6e`), en
`feat/issue-60-simplificar-mvp`. No utiliza el preview anterior como base.

## Funciones retiradas

- Interfaz en español: sin selector ES/EN, preferencia de idioma ni traducción
  automática de mensajes, reseñas o contenido dinámico. El chat muestra el texto
  original, sin modificar mensajes ni traducciones históricos en el servidor.
- Sin Google/Facebook para completar datos. Nombre, apellidos, correo, DPI,
  teléfono y hora se completan manualmente. La verificación de
  correo previa a reservar y el código de acceso al Portal siguen separados.
- Sin selección/captura de pasaporte ni país emisor en formularios nuevos.
  DPI se conserva como texto y exige exactamente 13 dígitos. Se mantienen teléfono,
  correo, fechas, capacidad y protección de borradores/intentos de reserva.
- Rutas de traducción y OAuth retiradas responden `410`, sin llamar proveedores,
  redirigir, emitir cookies ni conceder comprobantes de correo verificado. Los
  clientes antiguos deben volver al formulario manual.

No se borran registros ni se migran pasaportes a DPI. Los tipos del contrato y las
vistas de documentos históricos permanecen compatibles para su consulta. Una
reserva histórica no se convierte ni duplica. Un borrador antiguo de pasaporte
requiere introducir un DPI antes de continuar; no se cambia su identidad pendiente.

## Dependencias y referencia para retomarlas

Se conserva `next-intl`: los componentes actuales utilizan sus claves españolas y
formatos; quitarla ahora rompería pantallas ajenas al alcance. Las tablas de inglés
quedan inactivas, sin selector ni observador que reescriba el DOM. No hay SDK de
Google/Facebook/DeepL que retirar del manifiesto. `libphonenumber-js` sigue siendo
necesario para validar teléfonos internacionales. No se cambian versiones.

Referencia de la implementación anterior: commit base `f8edf6e`, en particular
`src/lib/bff/bookingSocial.ts`, `src/lib/translation/{server,client}.ts`, las rutas
OAuth, `ScopedI18nProvider`, `PublicLanguageToggle`, `TranslatedChatText` y los
formularios modificados. Recuperar mediante una futura rama/issue, nunca copiando
secretos ni restaurando todo el árbol.

Para retomar OAuth: aplicaciones y callback HTTPS autorizados, secretos del servidor,
estado/PKCE/consumo único compartido, vínculo al borrador y pruebas reales de retorno,
cancelación y verificación del correo. Para traducción: proveedor configurado en
servidor, límites, privacidad, conservación del original y pruebas de mensajes nuevos
e historial. Para pasaporte: contrato de país emisor y reglas acordadas con API/app,
validación independiente del DPI, documentos privados y pruebas históricas.

## Coordinación con Alex (sin modificar backend)

Para comprobar el recorrido conectado necesitamos un API Spring activo que ofrezca:

- `GET /api/v1/publico/ofertas`, `GET /api/v1/publico/ofertas/disponibilidad` con
  `entrada`, `salida`, `numeroHuespedes`, y el DTO vigente de ofertas/tipos reales.
- `POST /api/v1/publico/correo/{solicitar,estado,verificar,actualizar}` y comprobante
  de correo ligado al borrador; ahora todo huésped nuevo completa la vía manual.
- Creación con DPI (`tipoDocumento: DPI`, `numeroDocumento` de 13 dígitos como texto),
  precio/cupo verificados en servidor e idempotencia actuales.
- Mantener lectura de registros históricos con pasaporte; no eliminar columnas,
  registros ni documentos por esta simplificación del frontend.

El 18/10 el API público devuelve 503 y localhost:8081 no responde. No se presenta
la prueba de componentes con fixtures como disponibilidad o conexión real. No se
crearon reservas, pagos ni correos para esta tarea. Resultados finales y enlace de
revisión local se registran al completar las comprobaciones.

## Comprobaciones del 18/10/2026

| Comprobación | Resultado y alcance |
|---|---|
| Compilación Next.js de producción | Correcta; 66 páginas, comprobación de tipos incluida. Persisten advertencias de imágenes/hooks y código sin uso; sin errores de ESLint. |
| Suite BFF | 125 pruebas aprobadas. Pruebas técnicas con almacenamiento temporal y transportes controlados; no acreditan operaciones contra Spring. |
| Unitarias y componentes | 129 pruebas aprobadas en 14 archivos. Se adapta la expectativa de preferencias EN antiguas: ahora deben mostrar español. Incluye documentos históricos. |
| Navegador 1280 y 390 px | Formulario sin controles sociales/pasaporte/idioma, DPI y teléfono limitados al pegar, sin desbordamiento ni errores JS. Catálogo/cotización sustituidos **solo en la prueba aislada de presentación**; cero escrituras. |
| API real | Público 503, local no disponible. Reserva manual, correo, pago y operaciones autenticadas de extremo a extremo quedan pendientes del API de Alex. |

Revisión local: **http://localhost:3080**. Está configurada en modo `api`/`spring`
contra `https://api.villaserenaguate.lat`, sin fallback. Por el 503, el formulario
de reserva no se abre con inventario real hasta que el servicio responda; no se
incluyen fixtures en el servidor de revisión. Las capturas son exclusivamente
evidencia de presentación de la prueba aislada.

Para retomar en este worktree: configurar `API_URL`, `VILLA_SERENA_BFF_MODE=api`,
`STAFF_AUTH_MODE=spring` y `GUEST_AUTH_MODE=spring` en el entorno local del servidor
(fuera de Git), y ejecutar `pnpm dev --port 3080`. No se requieren claves OAuth ni
del traductor. No se reinició ni modificó el backend.

Cambios sin preparar para commit; sin commit, push, PR, merge ni despliegue. Se
conservan todos los otros worktrees, cambios previos y registros del servidor.

## Ampliación: retirar Nacionalidad

Añadida a la descripción de la issue #60 por solicitud de Kimberly. Retirada la
captura y obligatoriedad en datos de reserva pública, nueva estancia del huésped,
registro/edición de huésped y nueva reserva en Recepción, huésped adicional y
formulario del simulador de canal. Las cuadrículas se redistribuyen sin celdas
vacías; reserva pública queda con tres filas de dos campos en escritorio.

No se deduce nacionalidad de teléfono, DPI, país o idioma. No se envía un país
predeterminado: las peticiones nuevas omiten `nacionalidad`. La lectura del Perfil
y los detalles históricos conservan el dato ya registrado; editar otros campos
no borra esa información. Los modelos locales de lectura pueden representar un
dato ausente con texto vacío; ese texto no se utiliza como país en el API.

> Actualización #63: el contrato canónico fijado en `api-contract.json` ya
> declara nacionalidad opcional/nullable. Los tipos se regeneraron con docs y
> los DTO usan esos tipos directamente. El listado siguiente documenta el
> bloqueo histórico de #60; no describe el estado actual del esquema ni acredita
> por sí solo una integración con un API desplegado. Ver [contrato](CONTRATO_API.md).

**Incompatibilidad comprobada en el contrato versionado, pendiente para Alex:**

- `src/lib/api/schema.d.ts` declara `HuespedDatos.nacionalidad` y
  `HuespedAdicionalDatos.nacionalidad` obligatorios; no se modificó ese archivo
  generado ni `openapi.yaml` para fingir que el servidor ya acepta la omisión.
- Alex debe permitir su ausencia en registro de huésped, creación de reserva
  pública (incluidas ofertas/canales) y huéspedes adicionales: quitar validación
  obligatoria de entrada, conservar campos históricos y no sobrescribirlos cuando
  falte el dato. Resolver también la nulabilidad/persistencia que corresponda en
  su implementación, sin introducir un país por defecto.
- Después debe publicar OpenAPI actualizado para regenerar los tipos compartidos.
  Mientras tanto, los tipos **de escritura del frontend** adaptan explícitamente
  la omisión; los DTO de lectura y el contrato generado permanecen intactos.
- Si Spring lo rechaza, el frontend conserva el error y no anuncia éxito, no
  reintenta automáticamente ni rellena una nacionalidad para superar el rechazo.
  No se acredita aceptación real mientras el API esté inaccesible (503).

Comprobaciones de esta ampliación: compilación de producción correcta (66 páginas),
127 pruebas BFF aprobadas; cuatro pruebas de componentes de los formularios
afectados aprobadas (incluyen revisar datos sin nacionalidad y cerrar sin guardar).
Las pruebas de transporte verifican omisión en reserva pública, registro y huésped
adicional, conservación de un valor histórico conocido y rechazo del API sin éxito
falso ni reintento automático. Navegador 1280/390: sin campo Nacionalidad, sin
desbordamiento ni errores JS; capturas aisladas actualizadas, cero escrituras.
Los apartados autenticados completos y la aceptación por Spring siguen pendientes
de un API activo y del ajuste del contrato descrito para Alex.

Última comprobación del servidor de revisión: `/login` devuelve 200;
`/api/publico/ofertas` devuelve 502 `API_NO_DISPONIBLE` (antes se observó 503 en el
dominio público). No se atribuye ese fallo de conexión al campo nacionalidad ni
se utiliza un catálogo simulado en `localhost:3080` para ocultarlo.
