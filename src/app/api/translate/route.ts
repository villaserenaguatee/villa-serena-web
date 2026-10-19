// Retired in issue #60; stale clients must not contact a translation provider.
export async function POST() {
  return Response.json({codigo: 'FUNCION_NO_DISPONIBLE'}, {status: 410, headers: {'Cache-Control': 'no-store'}});
}
