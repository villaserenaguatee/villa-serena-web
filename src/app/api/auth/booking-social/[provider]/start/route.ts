// Retired in issue #60; no provider calls or verified-email proofs.
export async function POST() { return Response.json({codigo: 'FUNCION_NO_DISPONIBLE'}, {status: 410, headers: {'Cache-Control': 'no-store'}}); }
