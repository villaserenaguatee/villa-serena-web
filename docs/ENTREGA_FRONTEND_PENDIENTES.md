# Entrega consolidada del frontend

Rama `feat/issue-61-recurrente`, destino `develop`. Backend fuera de esta
entrega por decisión del usuario. No se autoriza merge ni despliegue.

## Incluido

- Checkout Recurrente: URL autorizada, confirmación consultada en servidor,
  estados inciertos y recuperación GET del intento original sin duplicarlo.
- Pantallas públicas, Ayuda, condiciones, privacidad y resumen compartido.
- Ajustes #60 conciliados: +502 fijo, ocho dígitos, nombres Unicode, correo,
  errores por campo, foco y llegada opcional sin valor por defecto.
  No se inventa persistencia de la hora en el API.
- Login unificado, recuperación, código de huésped, perfiles y cambio obligatorio
  de contraseña temporal; límites de solicitudes sin revelar cuentas.
- Presentación, formularios y correcciones de Huésped, Recepción, Administración,
  Limpieza, Mantenimiento y Room Service.
- Personal consume los endpoints oficiales de empleados y conserva datos laborales.
- Los seis cambios pendientes de correo público de contacto.

## Conciliación y trabajo conservado

| Origen | Tratamiento |
| --- | --- |
| `issue-60-simplificar-mvp` | Se concilian código, validaciones, presentación y pruebas, conservando tarjeta compartida y recuperación Recurrente. Se excluye el generado `next-env.d.ts`. |
| `mejoras-pago-contenido` | Se incorporan los seis cambios de contacto. El commit previo del checkout ya está en la rama. |
| `ajustes-web` | Check-in documental y acceso tienen equivalentes posteriores. Las variantes de cambio de habitación mediante almacenamiento demo, datos demo e i18n anterior se conservan fuera, por decisión del usuario. |
| `eliminar-solicitar-correccion-perfil` | El usuario decidió conservar el flujo conectado actual y dejar pendiente la variante que elimina solicitudes de corrección. |
| `issue-4`, `issue-7` | Artefactos y diferencias generadas de Next excluidos. |
| `issue-25`, `issue-26`, `issue-31` | Configuraciones locales y túneles no sustituyen el ejemplo conectado actual. |
| `issue-35` | Rutas `pruebas`, fixtures y scripts de diagnóstico local excluidos. |
| `issue-52` | Se conservan las versiones posteriores de login, portal, fotografías y adaptadores; no se reintroduce el acceso anterior ni su fixture de reserva confirmada. |
| Publicación anterior dentro de `ops` | El estado de pago tiene su versión posterior en Recurrente. No se reintroduce Stripe activo. |

Los originales permanecen en sus worktrees. Continuidad privada, capturas, logs,
respaldos, `.env`, `.local`, `.data`, `.next*`, dependencias y datos de ejecución
quedan fuera. El código del modo demo existente conserva guardas de desarrollo y
localhost; sus archivos de ejecución y accesos locales de revisión no se publican.

## Dependencias conocidas

1. Docs fijado en `1fa07d480b749c12ed20c8fff09b526a1c584928`. `estadoCheckout`,
   `accionPago` y recuperación por intento usan un adaptador temporal validado
   contra el código de Alex previamente inspeccionado. Falta conciliarlos en docs.
2. Falta distinguir de manera autorizada pagos históricos Stripe de ausencia de
   pago. Un estado incierto no habilita cobros nuevos.
3. Recuperación requiere los comprobantes originales. Si faltan o vencen, no se
   crea otra reserva para sustituir la anterior.
4. Endpoints oficiales de empleados implementados y probados de forma aislada en
   backend local, sin publicar. PostgreSQL integrado sigue pendiente por Docker
   no disponible. El recorrido conectado requiere ese backend actualizado.
5. Identidad, perfil laboral y estado se guardan en operaciones separadas. Ante
   fallo parcial se consulta la lista; no se repite automáticamente un alta
   incierta ni se sobrescriben datos laborales concurrentes.
6. Falta el recorrido con Spring y Recurrente Sandbox: webhook firmado, GTQ,
   confirmación, saldo, PDF y correos. Los mocks no acreditan esos servicios.
7. Administración demo y conectada aún son componentes distintos. Experiencias,
   extensión y controles de habitación no se presentan como conexiones reales
   cuando no hay contrato compatible.

No se declaran todos los módulos terminados. `ISSUE_61_VALIDACION.md` registra
una fase inicial; la implementación posterior sí incluye recuperación por intento.

## Validación de esta entrega

- 250 pruebas unitarias/componentes y 148 BFF: pasan.
- Contrato fijado: comprobación de tipos y 5 pruebas pasan.
- TypeScript, i18n y compilación de producción: pasan.
- Lint: 0 errores, 272 avisos existentes.
- Navegador: 22 casos completados en escritorio y móvil, con mocks. El servidor temporal quedó abierto al cerrar y se detuvo manualmente; el proceso terminó con salida 1 durante el cierre. No se oculta esta limitación del ejecutor local.
- No hubo pagos, correos ni reservas reales. CI remoto pendiente de la PR.

