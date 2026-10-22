# Amenidades y Wi-Fi: frontend oficial

Fuente: HU-ADM-11, HU-HUE-18 y OpenAPI de docs 77225a1. Se implementan las operaciones ya definidas, sin modificar el contrato fijado, backend o datos.

## FRONTEND IMPLEMENTADO
- Administración: listado, búsqueda, filtro de estado, alta POST, edición PATCH y cambio de estado PATCH de amenidades. Formulario compacto reutiliza el selector de fotografías aprobado; carga AMENIDAD, asociación por clave, reemplazo y quitar asociación. No fabrica una URL histórica que AmenidadAdmin no devuelve.
- Administración: GET/PUT Wi-Fi con campos obligatorios, visualización opcional de contraseña, bloqueo de doble envío y confirmación basada en respuesta válida. No se guardan contraseñas de red en almacenamiento del navegador ni logs.
- Mi habitación: consulta independiente de amenidades activas y Wi-Fi; muestra nombre, foto proporcionada, descripción, horario, ubicación y orden. Errores y vacío son diferentes; no se reemplazan por información inventada. La contraseña se oculta inicialmente y al actualizar. No depende del check-in o estado de estancia para estas consultas.
- BFF: solo GET de amenidades/Wi-Fi para huésped con sesión existente. Las operaciones administrativas conservan el guard ADMIN del proxy. No se habilita una escritura de huésped ni se exponen tokens.
- Los controles físicos y reservas de turnos sin operación aplicable permanecen bloqueados. El modo visual local anterior se conserva; no se simula conexión física a la red ni apertura de dispositivos.

## Pruebas
- 21 componentes: 7 casos nuevos y 14 regresiones de historial/estancia.
- 2 BFF: lecturas autenticadas, métodos, prohibición de escrituras del huésped y permisos ADMIN.
- 3 recorridos Chromium a 1440, 390 y 320 px: formularios, errores de guardado, contraseña oculta/visible y lectura del huésped; sin pageerror ni desbordamiento. Capturas revisadas y excluidas de Git.
- TypeScript, lint dirigido, i18n y build: pasan. Se conservan avisos preexistentes de archivos heredados.
- HTTP, identidades y valores de estas pruebas son aislados. No se crean cuentas, amenidades, reservas o pagos reales.

## VALIDACIONES FUTURAS CON BACKEND
- Persistencia de amenidades/Wi-Fi, exclusión de inactivas y orden del listado del huésped.
- Subida y asociación de fotografías con almacenamiento real; URL de imágenes históricas en Administración solo si el contrato la incorpora.
- Permisos reales ADMIN/HUESPED y lectura con reservas confirmadas, activas, canceladas o finalizadas.

Las ramas son independientes. Al integrar se conservan también las entradas de navegación de las otras fases y la ampliación de rutas de solicitudes de #83; no se sustituye guestAccess.ts ni AdminApp.tsx por una versión completa de otra rama.
