# Contrato API canónico (#63)

La fuente es `openapi.yaml` de `villaserenaguatee/villa-serena-docs`. La web no
conserva una copia YAML/JSON ni descarga el contrato durante peticiones. Versiona
únicamente los tipos generados y `api-contract.json`, que fija repositorio y SHA
completo. Local y CI leen ese mismo manifiesto.

Revisión adoptada: `f30ff74fe939d467728c51c31d7aca157b3be34e` (docs PR #20).
Guía oficial: [contrato-api.md](https://github.com/villaserenaguatee/villa-serena-docs/blob/f30ff74fe939d467728c51c31d7aca157b3be34e/03-arquitectura/contrato-api.md).

## Preparación local

Usar Node 24 y pnpm 12. Obtener un checkout exclusivo de docs en una ubicación
elegida por el desarrollador. Conviene situarlo fuera del workspace pnpm de web:
así cada instalación utiliza su propio lockfile. No se requiere una carpeta
hermana ni una ruta personal concreta.

```sh
git -c core.autocrlf=false clone https://github.com/villaserenaguatee/villa-serena-docs.git RUTA_DOCS
git -C RUTA_DOCS -c core.autocrlf=false checkout --detach f30ff74fe939d467728c51c31d7aca157b3be34e
```

Dentro de ese checkout: `pnpm install --frozen-lockfile`. Dentro de web:
`pnpm install --frozen-lockfile`. Conservar LF en docs permite que la huella sea
idéntica en Windows, macOS y Linux. No editar su contrato ni sus herramientas.

Desde web, PowerShell:

```powershell
$env:API_CONTRACT_DOCS_DIR = 'RUTA_ABSOLUTA_DOCS'
pnpm generate:api
pnpm check:api
pnpm test:contract
pnpm check
```

En macOS/Linux: `export API_CONTRACT_DOCS_DIR='RUTA_ABSOLUTA_DOCS'`, seguido de los
mismos comandos. Alternativamente: `pnpm generate:api --docs-dir RUTA_DOCS` y
`pnpm generate:api --docs-dir RUTA_DOCS --check`. Se admiten rutas con espacios.

El adaptador ejecuta la herramienta de docs:
`scripts/contrato-api.mjs types --output RUTA_WEB/src/lib/api/schema.d.ts --revision SHA`.
`check:api` añade `--check`: falla ante divergencia y no sobrescribe el generado.
Antes de ejecutar herramientas, comprueba HEAD, cambios en contrato/herramientas
y bytes del YAML frente al commit. El encabezado generado conserva su SHA-256.
Nunca editar `schema.d.ts` manualmente.

## CI y actualizaciones

El job `api-contract` de `web-tests.yml` obtiene web y docs por separado, instala
ambos con sus lockfiles y comprueba tipos y adaptador. Los demás checks y pruebas
se mantienen. Si docs es privado, configurar el secreto de Actions
`DOCS_READ_TOKEN` con lectura de ese repositorio; el token del repositorio web
puede no tener acceso a otro repositorio privado. No poner tokens en archivos.

Los cambios al contrato se proponen primero mediante issue/PR en docs y se
coordinan con API, web y móvil. Tras integrar y aprobar una revisión, actualizar
`api-contract.json`, usar ese checkout limpio, regenerar, revisar el diff y
ejecutar los checks y pruebas de consumidores afectados. No usar `main` o una
rama móvil como revisión. Las omisiones funcionales requieren actualización en
docs; este traslado no autoriza inventar endpoints o respuestas.

## Conciliación de esta revisión

- Nacionalidad es opcional y admite `null` en huésped y acompañantes. Los DTO de
  escritura vuelven a ser alias directos de los tipos generados. Para modelos de
  presentación antiguos, ausencia se representa como cadena vacía; no se asigna
  una nacionalidad ficticia ni se alteran registros históricos.
- `paisEmisorPasaporte` no está en el contrato fijado. Se retira su ampliación
  manual del generado. La lectura defensiva de un valor histórico ya recibido
  se conserva en `guestCompatibility.ts`; no se añade a escrituras. El MVP #60
  ya retiró la captura de pasaporte. Si se retoma, docs debe definir ese campo.
- Las extensiones y operaciones anteriores no documentadas (verificación de
  correo de reserva, contacto y recuperación de personal, entre otras) no se
  incorporan al contrato por esta migración. Deben reconciliarse en docs antes
  de presentarlas como contratos oficiales; no se cambia su comportamiento aquí.
- No cambian autenticación BFF, cookies HttpOnly, ticket WebSocket de un solo
  uso/60 segundos, rutas de pagos, webhooks ni diseños.
