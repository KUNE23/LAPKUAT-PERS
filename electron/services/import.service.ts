import ExcelJS from "exceljs";
import type { PrismaClient } from "@prisma/client";

function valueOf(value: any) {
  return value && typeof value === "object" && "result" in value
    ? value.result
    : value;
}
function text(value: any) {
  const result = valueOf(value);
  return result == null || result === "" ? undefined : String(result).trim();
}
function header(value: any) {
  return text(value)
    ?.toLowerCase()
    .replace(/[^a-z0-9]/gi, "");
}
function dateValue(value: any) {
  const result = valueOf(value);
  if (result instanceof Date) return result;
  if (typeof result === "number")
    return new Date(Math.round((result - 25569) * 86400 * 1000));
  return undefined;
}

export async function importPersonnelWorkbook(
  prisma: PrismaClient,
  filePath: string,
) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.getWorksheet("DATA") || workbook.worksheets[0];
  if (!worksheet) throw new Error("Worksheet Excel tidak ditemukan.");
  const headers = new Map<string, number>();
  worksheet.getRow(1).eachCell((cell, index) => {
    const key = header(cell.value);
    if (key) headers.set(key, index);
  });
  const read = (row: ExcelJS.Row, ...names: string[]) => {
    const index = names
      .map(header)
      .map((name) => name && headers.get(name))
      .find(Boolean);
    return index ? row.getCell(index).value : undefined;
  };
  const rows = worksheet.getRows(2, worksheet.rowCount) || [];
  let successRows = 0;
  let failedRows = 0;
  for (const row of rows) {
    const nrp = text(read(row, "nrp", "nrpnip"));
    const nama = text(read(row, "nama", "namalengkap", "nam"));
    if (!nrp || !nama) {
      failedRows++;
      continue;
    }
    try {
      const data: any = {
        nrp,
        nama,
        urut: Number(text(read(row, "no", "urut"))) || undefined,
        pktKorp: text(read(row, "pktkorp", "pangkat")),
        pangkat: text(read(row, "pkt", "pangkat")),
        kodePangkat: text(read(row, "pkt1")),
        kategoriPangkat: text(read(row, "pkt2", "kategoripangkat")),
        korps: text(read(row, "korps", "corp")),
        jabatan: text(read(row, "jaborganik", "jabatan")),
        jabDalamLat: text(read(row, "jabdlmlat")),
        divisi: text(read(row, "divisi")),
        brigade: text(read(row, "brigade")),
        kelompok: text(read(row, "kelompok")),
        satminkal: text(read(row, "satminkal")),
        bagKompi: text(read(row, "bagkompi")),
        ton: text(read(row, "ton")),
        ru: text(read(row, "ru")),
        keterangan: text(read(row, "ket", "keterangan")),
      };
      const existing = await (prisma as any).personnel.findFirst({
        where: { nrp },
        select: { id: true },
      });
      if (existing)
        await (prisma as any).personnel.update({
          where: { id: existing.id },
          data,
        });
      else await (prisma as any).personnel.create({ data });
      successRows++;
    } catch {
      failedRows++;
    }
  }
  return { canceled: false, totalRows: rows.length, successRows, failedRows };
}
