# Elementos y destinos del editor

Web #125 separa el contenido editorial del formulario general del hotel. Los controles de nombre/contacto/dirección que antes eran de solo lectura se retiran del panel, permaneciendo en Datos y políticas. No se borra contenido ni asociaciones. Cada opción corresponde a un ID canónico y las etiquetas distinguen misión/visión, elementos y fotografías de servicios.

El texto de un botón y su ruta son campos independientes. Se muestra el destino real, se conserva al editar texto y se ofrece Abrir destino en pestaña separada con noopener/noreferrer. La captura de la vista previa evita navegación y envíos accidentales; las anclas internas permiten seleccionar la sección. Las rutas de login, reservas, pagos y portal no cambian. El sitio público conserva su diseño.

Docs #70 y API #125 añaden /#buscar a la lista cerrada para conservar el destino ya utilizado por Reservar ahora. No se debilitan permisos, ETag/If-Match, revisiones o publicación; el borrador sigue separado del contenido público. Ambos contratos incorporan también fotoUrl ya integrado por Room Service.

Pruebas: 34 componentes, 3 unitarias y 1 BFF del editor; 3 E2E en 1440/390/320, además de la ejecución combinada de 6 con estancias. La comprobación móvil desplaza explícitamente el contenedor hasta el iframe antes de pulsarlo; no fuerza clics ni abandona el editor. Las pruebas previas detectaron selectores y una ruta de publicación ausente del mock, corregidos en las pruebas. No se usó producción.

## Archivos de esta corrección

- src/features/admin/pages/HotelWebsiteEditor.tsx
- src/features/admin/pages/HotelEditorialPanel.tsx
- src/features/admin/pages/PublicWebsitePreview.tsx
- src/lib/editorial/catalog.ts
- api-contract.json y src/lib/api/schema.d.ts (generado)
- tests/component/hotel-website-editor.test.tsx
- tests/component/editor-button-destinations.test.tsx
- tests/unit/editor-section-elements.test.ts
- tests/e2e/admin-editor-elements.spec.ts y su configuración Playwright
- vercel.json (despliegue de rama deshabilitado)

Orden: Docs #70, API #125, Web #125, siempre con autorización. Después del squash fijar el SHA definitivo del contrato y verificar tipos. Las estancias completas se tramitan como PR dependientes, sin mezclar su alcance en esta PR. Ninguna integración o despliegue se ha ejecutado.
