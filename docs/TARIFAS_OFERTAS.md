# Tarifas y ofertas

Esta corrección depende de Web #116 y reutiliza RoomCatalogManager, RoomOfferEditor, RoomFeaturesEditor, AdminRoomPhotos y el cliente de operaciones. No duplica formularios, contratos ni validaciones.

La causa de la falta de gestión era que TarifasAdmin montaba RoomCatalogContent, un consumidor de consulta pública, en lugar del administrador conectado. Las pestañas de Temporadas y Ofertas estaban fuera del contenedor desplazable del apartado; ahora cada apartado contiene título, acciones, navegación y contenido en ese orden, sin sticky/fixed nuevos ni cambios al menú general.

## Operaciones

El contrato fijado en api-contract.json ya admite GET admin/ofertas, POST/PUT admin/ofertas/{slug} y PATCH admin/ofertas/{slug}/publicacion. Los formularios básicos siguen usando admin/catalogos/tipos con ID/versión y validaciones. Temporadas conserva sus GET/POST/PUT/DELETE, categorías y ajustes.

Las ofertas usan IDs reales de habitaciones y categoría, precio público explícito, descripción, características, preferencias y la galería compartida de su categoría. Las características operativas conservan la protección del API frente a reservas activas. Se preservan las fotografías y no se llama a un borrado físico.

Crear una categoría no publica ni guarda ofertas. Una nueva oferta se guarda sin publicar; publicar y despublicar requieren confirmación separada. El modelo actual no tiene revisiones editoriales de ofertas: guardar una oferta ya publicada actualiza su contenido público; guardar su galería compartida también tiene efecto en sus ofertas. Añadir borradores de ofertas sería otro alcance, no necesario para las operaciones solicitadas.

No se necesitan PR de API o Docs: se reutiliza el contrato canónico y el API integrado. Integrar primero #116 y luego esta PR, cambiando su base a main y volviendo a revisar el diff/checks después del squash de #116. No integrar ni desplegar sin autorización. La rama tiene despliegue Vercel deshabilitado.

Las pruebas de componentes y navegador usan datos locales de prueba y respuestas del contrato, sin consultar ni modificar producción.
