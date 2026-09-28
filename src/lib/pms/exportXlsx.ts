import * as XLSX from 'xlsx';
type Cell = string | number | boolean | Date | null | undefined;
type SheetData = {
  name: string;
  rows: Cell[][];
};
function safeSheetName(name: string,
  used: Set<string>) {
  const base = (name || 'Hoja').replace(/[\\/?*\[\]:]/g, ' ').trim().slice(0, 31) || 'Hoja';
  let candidate = base;
  let i = 2;
  while (used.has(candidate)) {
    const suffix = ` ${i++}`;
    candidate = `${base.slice(0, 31 - suffix.length)}${suffix}`;
  }
  used.add(candidate);
  return candidate;
}
export function exportXlsx(filename: string,
  sheets: SheetData[]) {
  const workbook = XLSX.utils.book_new();
  const used = new Set<string>();
  for (const sheet of sheets) {
    const worksheet = XLSX.utils.aoa_to_sheet(sheet.rows);
    const widths = sheet.rows.reduce<number[]>((acc,
      row) => {
      row.forEach((value, index) => {
        const length = value == null ? 0 : String(value).length;
        acc[index] = Math.min(42, Math.max(acc[index] ?? 10, length + 2));
      });
      return acc;
    },
      []);
    worksheet['!cols'] = widths.map(wch => ({ wch }));
    XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName(sheet.name, used));
  }
  XLSX.writeFile(workbook, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`, {
    bookType: 'xlsx',
    compression: true,
  });
}
