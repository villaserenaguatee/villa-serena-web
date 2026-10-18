# Version publicada de Villa Serena

Rama: entrega/vercel-portal-chat-20261017, basada en develop 6ea785c.

Esta rama registra el frontend enviado por CLI a https://villa-serena-web.vercel.app. Proyecto Vercel: villa-serena-web. Despliegue de referencia: dpl_6Keiz2EbudBDZv1pEVp8wqyhiGVG. No se desplego desde main y no se configuro despliegue automatico por Git.

El contenido de src y public coincide con la copia publicada. Se conservan pruebas y documentos existentes de develop para facilitar revision. No se incluyen .env privados, datos, documentos de identidad, logs ni generados.

Node24.x, pnpm12.0.0. Instalar: corepack pnpm install --frozen-lockfile. Compilar: corepack pnpm build. Compilacion y tipos de Vercel correctos antes de registrar esta rama; no se repitieron suites de prueba para esta subida.

Variables BFF en Vercel: API_URL=https://api.villaserenaguate.lat, STAFF_AUTH_MODE=spring, GUEST_AUTH_MODE=spring, VILLA_SERENA_BFF_MODE=api, NEXT_PUBLIC_WS_URL=wss://api.villaserenaguate.lat/ws. Las credenciales OAuth son secretos del servidor. Gmail/Stripe/JWT/base de datos pertenecen al backend.

Pendientes: API definitivo503 en ultima comprobacion, recorrido conectado en nube no acreditado. Google requiere callback HTTPS autorizado. Traduccion local no es accesible desde Vercel y marcadores OAuth por archivo no garantizan consumo distribuido. Menus de chat comprobados localmente en computadora y movil. Excluir huespedes archivados tambien requiere el controlador actualizado del backend; no se despliega Java desde este repositorio.
