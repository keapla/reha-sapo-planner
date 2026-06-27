import * as XLSX from 'xlsx';
import { Therapist, Patient, RoleType } from '../types';

/**
 * Exports therapists, patients, and NG list to a single Excel file with 3 sheets.
 */
export function exportToExcel(therapists: Therapist[], patients: Patient[]) {
  const wb = XLSX.utils.book_new();

  // 1. Therapist Sheet
  const therapistRows = therapists.map(t => ({
    '療法士ID': t.id,
    '名前': t.name,
    '職種(PT/OT/ST)': t.role,
    '休憩開始枠(1-22)': t.breakStartSlot + 1, // 0-indexed to 1-indexed for Excel users
    '業務外時間枠(1-24のカンマ区切り)': t.busySlots.map(s => s + 1).join(', ') // 0-indexed to 1-indexed
  }));
  const wsTherapists = XLSX.utils.json_to_sheet(therapistRows);
  XLSX.utils.book_append_sheet(wb, wsTherapists, '療法士マスター');

  // 2. Patient Sheet
  const patientRows = patients.map(p => ({
    '患者ID': p.id,
    '名前': p.name,
    'PTオーダー枠数': p.orders.PT,
    'OTオーダー枠数': p.orders.OT,
    'STオーダー枠数': p.orders.ST
  }));
  const wsPatients = XLSX.utils.json_to_sheet(patientRows);
  XLSX.utils.book_append_sheet(wb, wsPatients, '患者・オーダーマスター');

  // 3. NG List Sheet
  const ngRows: any[] = [];
  patients.forEach(p => {
    p.ngTherapistIds.forEach(tId => {
      const therapist = therapists.find(t => t.id === tId);
      ngRows.push({
        '患者ID': p.id,
        '患者名': p.name,
        'NG療法士ID': tId,
        'NG療法士名': therapist ? therapist.name : '不明'
      });
    });
  });
  const wsNG = XLSX.utils.json_to_sheet(ngRows);
  XLSX.utils.book_append_sheet(wb, wsNG, 'NGリスト');

  // Export File
  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `rehab_master_data_${dateStr}.xlsx`);
}

/**
 * Parses Excel workbook file and returns parsed therapists and patients.
 * Performs format validation and reports errors if parsing fails.
 */
export async function importFromExcel(file: File): Promise<{
  therapists: Therapist[];
  patients: Patient[];
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        // Check if sheets exist
        const sheetNames = workbook.SheetNames;
        if (!sheetNames.includes('療法士マスター') || !sheetNames.includes('患者・オーダーマスター')) {
          throw new Error('必要なシート（「療法士マスター」および「患者・オーダーマスター」）が見つかりません。');
        }

        // Parse therapists
        const wsTherapists = workbook.Sheets['療法士マスター'];
        const rawTherapists = XLSX.utils.sheet_to_json<any>(wsTherapists);
        const parsedTherapists: Therapist[] = [];

        for (const r of rawTherapists) {
          const id = String(r['療法士ID'] || '').trim();
          const name = String(r['名前'] || '').trim();
          const role = String(r['職種(PT/OT/ST)'] || '').trim().toUpperCase() as RoleType;
          
          if (!id || !name || !role) continue;
          if (role !== 'PT' && role !== 'OT' && role !== 'ST') {
            throw new Error(`療法士「${name}」の職種「${role}」が不正です。PT/OT/STのいずれかである必要があります。`);
          }

          // Parse break start (1-indexed to 0-indexed)
          let breakStartSlot = parseInt(r['休憩開始枠(1-22)'], 10);
          if (isNaN(breakStartSlot) || breakStartSlot < 1 || breakStartSlot > 22) {
            breakStartSlot = 10; // Default: Slot 10 (12:00 - 12:20)
          } else {
            breakStartSlot = breakStartSlot - 1; // 0-indexed
          }

          // Parse busy slots (comma separated, 1-indexed to 0-indexed)
          const busyStr = String(r['業務外時間枠(1-24のカンマ区切り)'] || '').trim();
          const busySlots: number[] = [];
          if (busyStr && busyStr !== 'undefined') {
            busyStr.split(/[,,、]/).forEach(s => {
              const val = parseInt(s.trim(), 10);
              if (!isNaN(val) && val >= 1 && val <= 24) {
                busySlots.push(val - 1); // 0-indexed
              }
            });
          }

          parsedTherapists.push({
            id,
            name,
            role,
            breakStartSlot,
            busySlots
          });
        }

        // Parse patients
        const wsPatients = workbook.Sheets['患者・オーダーマスター'];
        const rawPatients = XLSX.utils.sheet_to_json<any>(wsPatients);
        const parsedPatientsMap = new Map<string, Patient>();

        for (const r of rawPatients) {
          const id = String(r['患者ID'] || '').trim();
          const name = String(r['名前'] || '').trim();
          
          if (!id || !name) continue;

          const orderPT = parseInt(r['PTオーダー枠数'], 10) || 0;
          const orderOT = parseInt(r['OTオーダー枠数'], 10) || 0;
          const orderST = parseInt(r['STオーダー枠数'], 10) || 0;

          parsedPatientsMap.set(id, {
            id,
            name,
            orders: {
              PT: orderPT,
              OT: orderOT,
              ST: orderST
            },
            ngTherapistIds: []
          });
        }

        // Parse NG list if sheet exists
        if (sheetNames.includes('NGリスト')) {
          const wsNG = workbook.Sheets['NGリスト'];
          const rawNG = XLSX.utils.sheet_to_json<any>(wsNG);

          for (const r of rawNG) {
            const pId = String(r['患者ID'] || '').trim();
            const tId = String(r['NG療法士ID'] || '').trim();

            if (!pId || !tId) continue;

            const patient = parsedPatientsMap.get(pId);
            if (patient) {
              // Add NG therapist ID if not already added
              if (!patient.ngTherapistIds.includes(tId)) {
                patient.ngTherapistIds.push(tId);
              }
            }
          }
        }

        resolve({
          therapists: parsedTherapists,
          patients: Array.from(parsedPatientsMap.values())
        });
      } catch (err: any) {
        reject(new Error(err.message || 'Excelファイルの読み込みに失敗しました。ファイル破損や構造の違いがないかご確認ください。'));
      }
    };

    reader.onerror = () => {
      reject(new Error('ファイルの読み込み中にエラーが発生しました。'));
    };

    reader.readAsArrayBuffer(file);
  });
}
