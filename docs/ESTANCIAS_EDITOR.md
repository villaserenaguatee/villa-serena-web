# Estancias editables desde Administración

## Resultado y modelo

Se conservan cinco IDs: romantica, descanso, familiar, negocios y bienestar. El texto visible no es una clave. Cada elemento editorial existente estancias.<id> conserva texto como descripción y admite nombre opcional y ofertaSlugs opcional, máximo tres ofertas públicas únicas y ordenadas. Se seleccionan ofertas del catálogo, no habitaciones físicas; no se crean habitaciones ni se modifica precio, disponibilidad, pedidos o reservas.

El panel muestra Subtítulo, Título, Descripción general y cinco estancias. Cada estancia abre Nombre, Descripción y Habitación 1/2/3. Permite quitar, reemplazar y reutilizar ofertas entre estancias; rechaza duplicados incluso en eventos programáticos. Si el catálogo está pendiente o falla, bloquea la edición para no inicializar recomendaciones vacías. No se muestran controles para subir fotografías.

Las fotografías y demás datos provienen de cada oferta del catálogo vigente. No se copian archivos ni se congela una URL en el documento editorial. Una oferta retirada del catálogo se omite sin sustituirla por otra y el API rechaza guardar/publicar referencias que ya no sean públicas. Guardar borrador persiste la asociación sin alterar el sitio público; publicación requiere confirmación y revisión vigente.

## Transición y dependencias

Documentos sin nombre/ofertaSlugs conservan los nombres anteriores y recomendaciones por preferencias. Una lista vacía retira las recomendaciones de esa estancia. Los IDs fotográficos anteriores permanecen aceptados y guardados; su representación se conserva en estancias todavía no configuradas. Al configurar una estancia se utilizan las fotografías actuales de sus ofertas. Nunca se borran referencias anteriores ni archivos físicos automáticamente.

Web #128 depende de Web #125, Docs #72 (sobre #70) y API #127 (después de #125). Los contratos combinados conservan fotoUrl del menú ya integrado. Orden propuesto: Docs #70 → #72, API #125 → #127, y luego Web #125 → esta PR. Integraciones y despliegues requieren autorización; al hacer squash de Docs fijar el SHA definitivo combinado y regenerar tipos. API actualizado antes de usar los nuevos campos; un API anterior no admite guardar nombre/ofertaSlugs. No se ha integrado ni desplegado nada en esta tarea.

## Verificación

37 pruebas de componentes editoriales, 8 unitarias (incluyendo ETag), 4 BFF (editorial, catálogo e If-Match), TypeScript y check:api aprobados. ESLint sin errores, con advertencias de imágenes/hooks existentes. Los dos recorridos E2E aprobaron en 1440/390/320: navegación, texto/destino independientes, cinco nombres/descripciones, cero/una/dos/tres recomendaciones, orden, duplicados, borrador privado, recarga, publicación y fotografía vigente. La protección adicional de duplicados se volvió a comprobar en los tres tamaños con consola funcional verificada. El sandbox conserva allow-same-origin sin allow-scripts; los avisos de scripts bloqueados de about:srcdoc son esperados y no se permite ejecutar esos scripts.

API: EstanciasEditorialTest (3 casos) y MenuAdminPhotoTest aprobados localmente. CI API 41010842214: 481 pruebas, cero fallos/errores y una omitida, incluyendo EditorialIntegrationTest (9 casos) y validaciones de estancias. Las pruebas usan PostgreSQL y datos de prueba aislados; no se conectó a producción.

## Archivos de estancias

- src/lib/editorial/stays.ts y catalog.ts
- src/features/admin/pages/StayEditorialPanel.tsx
- src/features/admin/pages/HotelEditorialPanel.tsx, HotelWebsiteEditor.tsx, PublicWebsitePreview.tsx y useHotelEditorial.ts
- src/features/public/EditorialContent.tsx y PublicHome.tsx (mismas clases y distribución)
- api-contract.json y src/lib/api/schema.d.ts generado
- tests/unit/editor-stays.test.ts
- tests/component/editor-stays-connected.test.tsx
- tests/e2e/admin-editor-stays.spec.ts y configuración Playwright
- vercel.json: despliegue de rama deshabilitado
- API: ElementoEditorial.java, EditorialService.java, EstanciasEditorialTest.java, EditorialIntegrationTest.java y api-contract.json
- Docs: openapi.yaml y 03-arquitectura/estancias-editor.md

Las capturas locales están en .local/capturas-editor/INDICE.md y contienen exclusivamente datos de prueba.
