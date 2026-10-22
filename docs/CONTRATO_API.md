# Contrato API canónico (#63)

La fuente es `openapi.yaml` de `villaserenaguatee/villa-serena-docs`. La web no
conserva una copia YAML/JSON ni descarga el contrato durante peticiones. Versiona
únicamente los tipos generados y `api-contract.json`, que fija repositorio y SHA
completo. Local y CI leen ese mismo manifiesto.

Revisión adoptada: `77225a11d06daf576a404e2a557185868bd49c56` (contrato oficial vigente; Recurrente y hora estimada de llegada).
Guía oficial: [contrato-api.md](https://github.com/villaserenaguatee/villa-serena-docs/blob/77225a11d06daf576a404e2a557185868bd49c56/03-arquitectura/contrato-api.md).

## Preparación local

Usar Node 24 y pnpm 12. Obtener un checkout exclusivo de docs en una ubicación
elegida por el desarrollador. Conviene situarlo fuera del workspace pnpm de web:
así cada instalación utiliza su propio lockfile. No se requiere una carpeta
hermana ni una ruta personal concreta.

```sh
git -c core.autocrlf=false clone https://github.com/villaserenaguatee/villa-serena-docs.git RUTA_DOCS
git -C RUTA_DOCS -c core.autocrlf=false checkout --detach 77225a11d06daf576a404e2a557185868bd49c56
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

- Los estados de checkout, acciones de pago y recuperación del intento ya vienen
  del contrato oficial. `recurrenteStatus.ts` usa los tipos generados y mantiene
  lectura defensiva de respuestas anteriores, sin autorizar cobros nuevos por
  ausencia de información.
- La reserva pública por tipo y por oferta admite `horaEstimadaLlegada` opcional,
  en HH:mm local de Guatemala. La web omite el campo vacío y no convierte a UTC.
  El detalle autorizado de Recepción muestra el valor recibido o «No indicada».
- `ReservaRecepcionPeticion` no declara esta hora: no se añade al POST de
  Recepción ni se inventa una operación de actualización. Su alta queda pendiente
  de un contrato oficial que la admita.
- No se reintroducen controles retirados del MVP ni se cambian datos históricos,
  autenticación, verificación de correo, permisos, webhooks o reglas de pago.
