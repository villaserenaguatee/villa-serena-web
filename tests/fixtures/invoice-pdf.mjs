// Deterministic, single-page PDF for the connected invoice viewer. No browser
// or PDF generator is required to serve this external-provider fixture.
export function invoicePdf(invoice) {
  const lines = [`Factura ${invoice.serie}-${invoice.numero}`, `Reserva ${invoice.codigoReserva}`, `Total Q ${invoice.total}`];
  const escape = value => String(value).replace(/[^\x20-\x7e]/g, '?').replace(/[\\()]/g, '\\$&');
  const stream = `BT /F1 16 Tf 40 760 Td ${lines.map((line, i) => `${i ? '0 -24 Td ' : ''}(${escape(line)}) Tj`).join('\n')} ET`;
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
  ];
  let pdf = '%PDF-1.4\n'; const offsets = [0];
  objects.forEach((object, index) => { offsets.push(Buffer.byteLength(pdf)); pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.slice(1).map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`).join('');
  return Buffer.from(pdf + `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
}
