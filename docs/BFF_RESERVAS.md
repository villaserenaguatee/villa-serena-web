# BFF del flujo público de reservas

Primer bloque: las pantallas de resultados, detalle y datos consultan
`POST /api/public/availability` en Next.js. Se conserva el catálogo, las imágenes
y las configuraciones demo existentes. No se adopta todavía el contrato propuesto.

En demo se envía contexto temporal de habitaciones y ocupaciones, sin datos del
huésped ni pagos. El BFF valida y calcula disponibilidad; no importa ni sobrescribe
localStorage. Incluye reservas asignadas y sin asignación. Una respuesta fallida
no se presenta como lista vacía ni habilita continuar con inventario anterior.

Esta etapa es **solo consulta**: creación, pago y confirmación mantienen el código
actual de develop y se migrarán después. No hay persistencia compartida del servidor
ni garantía contra sobreventa en la creación aún. El contexto es de confianza solo
para el demo, no un inventario oficial para producción. En modo `api` devuelve 503
explícito hasta acordar y conectar disponibilidad real; no hay fallback demo automático.

Pendientes funcionales: pagar en el hotel, Stripe y transferencia/depósito a cuentas
guatemaltecas con comprobante. Banco requiere definir revisión, plazos y acceso privado.
Promociones se discute en el [issue API #7](https://github.com/villaserenaguatee/villa-serena-api/issues/7).

Verificación: `pnpm test:bff`, `pnpm check`, `pnpm build`, más los tests existentes
de scripts para comprobar que no se cambiaron los flujos locales del portal.

Resultado del primer bloque: 11 tests BFF, los siete scripts existentes, TypeScript,
i18n (57 claves) y build de producción aprobados. No se hicieron capturas ni una
prueba completa de interacción en navegador; no se conectó un backend real.
