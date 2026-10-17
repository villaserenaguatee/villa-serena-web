# Entrega local aprobada — 16 octubre 2026

Presentación e integración recuperadas de la copia activa `preview-aprobado-54`, incluida la última corrección de regreso desde verificación y Continuar pago sin flecha. Esa copia no tenía Git propio. Se conserva la base remota develop y sus configuraciones, pruebas y herramientas. Los cambios antiguos del directorio principal permanecen localmente: no sustituyen la versión aprobada más reciente.

Incluye catálogo aprobado e imágenes, disponibilidad/reservas con API, BFF, sesiones y acceso unificado, recuperación del personal, verificación previa a reservar y Google, portal con diseño recuperado, documentos/chat/traducción, cuenta/factura y módulos operativos/administrativos. Funciones sin backend permanecen restringidas; no se habilitaron simulaciones como respaldo.

## Configuración

Node 24 y pnpm 12. Copiar `.env.example` a `.env.local` y completar en el servidor. API local 8081, frontend 3054; iniciar con `pnpm dev --port 3054` o el procedimiento habitual de producción local. No versionar documentos, sesiones, logs ni cachés. Google usa `/api/auth/booking-social/google/callback` del origen configurado y el mismo Client ID en el API. Con HTTPS, configurar origen/callback HTTPS, cookies seguras y CORS limitado. Stripe y Gmail se configuran solo en backend. El traductor LibreTranslate local requiere modelos ES/EN.

El backend se entrega en su repositorio. Sus migraciones representan esquema, catálogo e inventario; PostgreSQL local y archivos privados no se transfieren con Git. No copiar un volcado con datos personales.

## Validación y límites

**Por instrucción expresa no se ejecutaron pruebas, compilación ni instalación durante esta publicación.** Solo inventario y revisión de archivos incluidos para excluir secretos y datos personales. Las pruebas entregadas como fuentes no acreditan ejecución ni seguridad completa. La continuidad completa y evidencias locales quedan privadas en el directorio original.

Pendientes: Facebook tras HTTPS; cancelación interactiva Google; recepción con nuevos participantes autorizados; carrera directa de renovación; archivo propio tras logout en sesión exclusiva; límites distribuidos y auditoría Java/imagen vigente. Servicios físicos/experiencias requieren sus contratos; FEL y desembolsos bancarios no implementados. Personalización Stripe detenida: Sandbox sin reclamar y permisos limitados, sin crear otro ni cambiar apariencia. No repetir pagos/correos para comprobar esta rama.

Sin merge, despliegue ni PR.
