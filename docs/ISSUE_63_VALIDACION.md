# Issue #63: adopción del contrato de docs

Estado local de implementación, sin commit, push ni PR.

- Rama: `chore/issue-63-contrato-docs`.
- Worktree exclusivo: `.worktrees/issue-63-contrato-docs`.
- Base: `develop` actualizado desde `origin/develop`,
  `54d31b09dc5d3d7c993c8672685ce55b62f62204`.
- Docs fijado: `f30ff74fe939d467728c51c31d7aca157b3be34e`, integrado por PR #20.
- Huella del contrato generado:
  `b1e4e8ecc10d6db74c170e7bdd12a02bd31b2cc98f8e3b7060d1fee04dd38e37`.
- No se modifica backend, `ajustes-web`, #60 ni #61. Sus cambios preexistentes
  permanecen fuera de esta rama. No se utilizan los previews antiguos como base.

## Archivos

Infraestructura del contrato:

- Eliminado `openapi.yaml` de web.
- Nuevos `api-contract.json`, `scripts/contrato-api.mjs` y `.gitattributes` (LF
  solo para el generado, para que `--check` sea reproducible).
- `package.json`: generación, comprobación y pruebas del consumidor. Sin cambios
  al lockfile ni a versiones de dependencias.
- `.github/workflows/web-tests.yml`: checkout de docs por el manifiesto,
  instalaciones independientes con lockfile, comprobación del contrato y
  conservación de los jobs existentes. Aplica también a PR hacia `develop`.
- `src/lib/api/schema.d.ts`: regenerado exclusivamente con la herramienta de docs.

Conciliación mínima de consumidores:

- `src/lib/bff/contracts/public.ts` y `contracts/reception.ts` bajo ese mismo
  directorio: alias directos del contrato, sin parche de nacionalidad.
- `src/lib/api/reception.ts`: acompañantes con DTO canónico.
- `src/lib/bff/publicContract.ts`, `receptionDemo.ts`: aceptar nacionalidad nula
  conforme al contrato; ninguna nacionalidad inventada.
- `src/lib/api/guestCompatibility.ts`: lectura defensiva de país emisor histórico,
  sin añadirlo a DTO generados ni escrituras.
- `src/features/recepcion/pages/ConnectedReceptionChat.tsx`,
  `ConnectedReceptionDay.tsx`, `Huespedes.tsx`, `NuevaReservaModal.tsx`,
  `RecepcionApp.tsx` y `src/features/recepcion/receptionLegacyLink.ts`: tolerar
  nacionalidad ausente y conservar lectura de información histórica. Sin cambios
  de diseño, rutas, permisos ni reglas de negocio.

Pruebas:

- Nuevos `tests/contract/consumer.test.mjs` y `generation.test.mjs`.
- `tests/bff/guest-fields.test.ts`, `public-contract.test.ts` y
  `reception-creation.test.ts`: nacionalidad omitida/nula, preservación de
  históricos y lectura defensiva del país emisor.

Documentación:

- Nuevos `docs/CONTRATO_API.md` y este informe.
- `README.md`, `AGENTS.md`, `docs/BFF_PUBLICO.md` y `RECEPCION_API.md` actualizan
  instrucciones activas.
- `docs/BFF_DETALLE_HABITACION.md`, `BFF_RECEPCION_OPERACIONES.md`,
  `BFF_RESULTADO_CANAL.md`, `BFF_SESION_PERSONAL.md`, `CUENTA_CHECKOUT_FACTURA.md`
  e `ISSUE_60_MVP.md` distinguen antecedentes históricos de la fuente vigente.

## Comprobaciones

| Comprobación | Resultado |
|---|---|
| Instalación frozen de web y de docs con sus lockfiles propios | Pasa |
| Validación oficial de docs y sus 3 pruebas de herramientas | Pasa; el error de referencia rota mostrado por una prueba negativa es esperado |
| `pnpm generate:api` y `pnpm check:api` | Pasan; sin YAML de web |
| `pnpm test:contract` con checkout real configurado | 5/5 pasan, sin omitidas |
| SHA incorrecto, contrato/herramientas modificados | Rechazo explícito, probado con Git real en clon temporal |
| Generado alterado | `--check` falla sin sobrescribirlo, probado en salida temporal |
| `pnpm check` | Pasa TypeScript e i18n |
| `pnpm lint` | Pasa con avisos existentes; no se amplía el alcance para corregirlos |
| `pnpm build` | Pasa, incluidas generación de páginas y comprobación de tipos |
| `pnpm test:bff` | 130/130 pasan |
| `pnpm test:cuenta` | 10/10 pasan |
| `pnpm test:unit` | 66/66 pasan |
| `pnpm test:component` | 65/65 pasan |
| YAML del workflow | Parseado correctamente; job del contrato y destino develop presentes |
| `pnpm test:booking:browser --reporter=line` | 8/8 pasan, computadora y móvil; catálogo, datos, pago pendiente, OTP demo, portal y recarga |
| `pnpm test:payments:browser --reporter=line` | 13/13 pasan, computadora y móvil; estados consultados, sondeo, reintentos y bloqueo de reserva cancelada; sin pago real |
| `pnpm test:reception:browser reception-creation.spec.ts --reporter=line` | 6/6 pasan, computadora y móvil; con/sin habitación, detalle, búsqueda, calendario, recarga, doble clic y respuesta perdida |
| `pnpm test:cuenta:browser --grep 'cargos y\|sin sesión' --reporter=line` | 4/4 seleccionadas pasan, computadora y móvil; cuenta/factura persistente y denegación sin sesión o con otro rol. No es la suite completa de cuenta |

La primera comprobación TypeScript detectó incompatibilidades reales de
nacionalidad y país emisor; fueron corregidas sin editar el generado. El primer
intento E2E no arrancó los navegadores: faltaba Chromium headless 1248 requerido
por el lockfile. Se instaló la versión requerida y la suite de reserva pasó
completa al repetirla. No se cambió código de aplicación para resolverlo.

Los logs y artefactos de ejecución están en `.local/*.log` y `test-results/`,
excluidos de Git. Los datos de prueba se crean en directorios temporales.

## Límites y conformidad

Las pruebas de BFF y los recorridos demo/mocks son pruebas técnicas aisladas con
archivos temporales. No acreditan integración con Spring, correos recibidos,
pagos reales ni webhook real; no ejecutan cobros ni envíos nuevos.

La revisión canónica omite `paisEmisorPasaporte`, que existía como añadido manual
en el generado anterior. Se conserva la lectura histórica y se retira el campo
de escrituras nuevas, ya excluido del formulario MVP. Si se reactiva la captura,
debe acordarse y publicarse primero en docs. También siguen fuera del contrato
canónico varias operaciones existentes de verificación de correo, contacto y
recuperación de acceso; no se inventan DTO ni endpoints por este traslado.

CI remoto no se ha ejecutado: no se autoriza publicar esta rama todavía. GitHub
confirma que docs es público; actualmente no requiere un token privado adicional.
Si cambia su visibilidad, web necesitará `DOCS_READ_TOKEN` con lectura de docs.
No se guardan credenciales ni configuraciones privadas en estos cambios.

La adopción no acredita conformidad del API desplegado con docs. Ese contraste
corresponde a API y no se modifica ni sustituye aquí.

## Criterios de aceptación

| Criterio de #63 | Evidencia local / límite |
|---|---|
| Sin copia versionada del contrato ni dependencia de web/openapi.yaml | YAML eliminado; generación y compilación pasan sin él. Solo se conservan tipos y manifiesto |
| Revisión fija compartida por local y CI; rechazo de checkout incorrecto/modificado | Manifiesto común, wrapper y pruebas con Git real |
| Generación y check; rechazo sin sobrescritura de tipos alterados | Pruebas ejecutadas con las herramientas canónicas y archivos temporales |
| CI del contrato, checks y regresiones | Workflow preparado y parseado; checks y regresiones locales registrados arriba. Ejecución en GitHub Actions pendiente de autorización para publicar |
| Guía y AGENTS actualizados | README, AGENTS y docs/CONTRATO_API.md, con instrucciones de actualización coordinada |

No se declara cierre definitivo de la issue antes de revisar los cambios y
ejecutar CI remoto. Ninguna prueba se presenta como certificación de integración
con un backend real.

## Revisión final previa a publicación — 19 de octubre de 2026

- Revisado el conjunto completo: 35 archivos nuevos/modificados y la eliminación
  de `openapi.yaml`. No hay cambios funcionales de #61, ajustes locales pendientes
  de #60, archivos del backend ni modificaciones de otros worktrees.
- Repetidos `pnpm generate:api`, `pnpm generate:api --check` y
  `pnpm test:contract`: pasan; 5 pruebas, ninguna omitida. El generado coincide
  byte a byte con la herramienta canónica. Fuera de comentarios, sus únicas
  diferencias respecto a la base son nacionalidad opcional/nula y la retirada
  de la extensión manual de país emisor.
- CI lee repositorio y revisión desde el manifiesto y usa esa salida como `ref`
  del checkout; no utiliza `main` cambiante. La comprobación usa el mismo SHA
  completo aprobado y la ubicación de ese checkout.
- ESLint revisó 372 archivos: 277 avisos y 0 errores. Los 277 se contrastaron
  por archivo, regla, severidad y mensaje con el contenido de la base `HEAD`,
  usando la misma configuración y dependencias. No hay diagnósticos añadidos.
  No se modificaron reglas ni se silenciaron avisos para obtener este resultado.
- Revisados nombres y contenido de los archivos que se incluirían: sin archivos
  locales/generados, configuraciones privadas ni secretos detectados. El barrido
  de patrones de claves privadas, Stripe, OAuth, GitHub, JWT y URL con credenciales
  no produjo hallazgos. Esto no equivale a una garantía absoluta sobre secretos.
- `git diff --check` pasa. Los auxiliares de revisión y logs están en `.local/`,
  ignorados; no forman parte del cambio propuesto.
- Informe listo para acompañar la PR. Las pruebas de flujos y compilación de la
  tabla anterior siguen siendo las ejecutadas durante la implementación; no se
  repitieron sin cambios que las afectaran. Pendiente únicamente la ejecución de
  CI remoto para confirmar el resultado en GitHub; no se publica esta revisión
  sin autorización.
