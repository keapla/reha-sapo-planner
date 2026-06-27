import { Therapist, Patient, RoleType } from '../types';

// Let's create exactly 30 therapists with realistic Japanese names and roles
// PT (Physical Therapist / 理学療法士) - 14 therapists
// OT (Occupational Therapist / 作業療法士) - 10 therapists
// ST (Speech Therapist / 言語聴覚士) - 6 therapists
export const INITIAL_THERAPISTS: Therapist[] = [
  // PTs (14)
  { id: "t-pt-01", name: "佐藤 健一", role: "PT", breakStartSlot: 8, busySlots: [0] }, // busy 9:00 - 9:20
  { id: "t-pt-02", name: "鈴木 美咲", role: "PT", breakStartSlot: 8, busySlots: [] },
  { id: "t-pt-03", name: "高橋 浩二", role: "PT", breakStartSlot: 8, busySlots: [23] }, // busy 16:40 - 17:00
  { id: "t-pt-04", name: "田中 結衣", role: "PT", breakStartSlot: 9, busySlots: [] },
  { id: "t-pt-05", name: "渡辺 翔太", role: "PT", breakStartSlot: 9, busySlots: [] },
  { id: "t-pt-06", name: "伊藤 さくら", role: "PT", breakStartSlot: 11, busySlots: [] },
  { id: "t-pt-07", name: "山本 拓海", role: "PT", breakStartSlot: 11, busySlots: [4] },
  { id: "t-pt-08", name: "中村 陽子", role: "PT", breakStartSlot: 11, busySlots: [] },
  { id: "t-pt-09", name: "小林 大介", role: "PT", breakStartSlot: 12, busySlots: [] },
  { id: "t-pt-10", name: "加藤 恵", role: "PT", breakStartSlot: 12, busySlots: [] },
  { id: "t-pt-11", name: "吉田 蓮", role: "PT", breakStartSlot: 14, busySlots: [] },
  { id: "t-pt-12", name: "山田 真一", role: "PT", breakStartSlot: 14, busySlots: [] },
  { id: "t-pt-13", name: "佐々木 葵", role: "PT", breakStartSlot: 14, busySlots: [] },
  { id: "t-pt-14", name: "山口 健太", role: "PT", breakStartSlot: 14, busySlots: [] },

  // OTs (10)
  { id: "t-ot-01", name: "斎藤 まどか", role: "OT", breakStartSlot: 8, busySlots: [] },
  { id: "t-ot-02", name: "松本 裕太", role: "OT", breakStartSlot: 9, busySlots: [] },
  { id: "t-ot-03", name: "井上 杏奈", role: "OT", breakStartSlot: 9, busySlots: [] },
  { id: "t-ot-04", name: "木村 駿", role: "OT", breakStartSlot: 11, busySlots: [] },
  { id: "t-ot-05", name: "林 七海", role: "OT", breakStartSlot: 11, busySlots: [] },
  { id: "t-ot-06", name: "清水 竜也", role: "OT", breakStartSlot: 12, busySlots: [] },
  { id: "t-ot-07", name: "山崎 美優", role: "OT", breakStartSlot: 12, busySlots: [] },
  { id: "t-ot-08", name: "池田 和也", role: "OT", breakStartSlot: 13, busySlots: [] },
  { id: "t-ot-09", name: "阿部 楓", role: "OT", breakStartSlot: 13, busySlots: [] },
  { id: "t-ot-10", name: "橋本 陸", role: "OT", breakStartSlot: 14, busySlots: [] },

  // STs (6)
  { id: "t-st-01", name: "森下 理沙", role: "ST", breakStartSlot: 8, busySlots: [] },
  { id: "t-st-02", name: "石川 雅人", role: "ST", breakStartSlot: 9, busySlots: [] },
  { id: "t-st-03", name: "前田 愛", role: "ST", breakStartSlot: 11, busySlots: [] },
  { id: "t-st-04", name: "小川 裕介", role: "ST", breakStartSlot: 12, busySlots: [] },
  { id: "t-st-05", name: "藤田 美紀", role: "ST", breakStartSlot: 13, busySlots: [] },
  { id: "t-st-06", name: "後藤 颯太", role: "ST", breakStartSlot: 14, busySlots: [] },
];

// Generates exactly 79 patients with names, varying orders and NG therapists
const PATIENT_LAST_NAMES = [
  "佐藤", "鈴木", "高橋", "田中", "渡辺", "伊藤", "山本", "中村", "小林", "加藤",
  "吉田", "山田", "佐々木", "山口", "松本", "井上", "木村", "林", "清水", "山崎",
  "中島", "池田", "阿部", "橋本", "山下", "森", "石川", "前田", "小川", "藤田"
];

const PATIENT_FIRST_NAMES = [
  "三郎", "太郎", "洋子", "和子", "恵子", "正雄", "清", "博", "隆", "茂",
  "一郎", "春子", "よしこ", "栄一", "千代", "ツネ", "ハル", "キヨ", "マサ", "コウ",
  "昭二", "敏夫", "幸子", "久美子", "美代子", "豊", "進", "勉", "稔", "操"
];

// Let's seed a reproducible list of 79 patients
export const INITIAL_PATIENTS: Patient[] = Array.from({ length: 79 }, (_, index) => {
  const pId = `p-${String(index + 1).padStart(2, '0')}`;
  
  // Choose Japanese name deterministically based on index
  const lastName = PATIENT_LAST_NAMES[index % PATIENT_LAST_NAMES.length];
  const firstName = PATIENT_FIRST_NAMES[(index * 7) % PATIENT_FIRST_NAMES.length];
  const name = `${lastName} ${firstName} (${index + 1})`;

  // Distribute orders realistically:
  // Most patients need 1 or 2 slots of PT, 0 or 1 slot of OT, 0 or 1 slot of ST.
  // We want to make sure the total sum of slots doesn't exceed 24 slots per therapist * therapist count.
  // Total therapist capacity: 30 therapists * (24 slots - 3 slots break) = 30 * 21 = 630 slots.
  // Let's target around 300 to 450 total slots of demand, which is fully packable but realistic.
  // 14 PTs * 21 = 294 slots max. Let's assign average 1.5 PT slots per patient = ~120 slots.
  // 10 OTs * 21 = 210 slots max. Let's assign average 1.0 OT slot to 50% of patients = ~40 slots.
  // 6 STs * 21 = 126 slots max. Let's assign average 1.0 ST slot to 25% of patients = ~20 slots.
  
  let ptOrder = 0;
  let otOrder = 0;
  let stOrder = 0;

  const r = index % 12;
  if (r === 0) {
    ptOrder = 2; otOrder = 1; stOrder = 0;
  } else if (r === 1) {
    ptOrder = 1; otOrder = 1; stOrder = 1;
  } else if (r === 2) {
    ptOrder = 2; otOrder = 0; stOrder = 0;
  } else if (r === 3) {
    ptOrder = 1; otOrder = 2; stOrder = 0;
  } else if (r === 4) {
    ptOrder = 1; otOrder = 0; stOrder = 1;
  } else if (r === 5) {
    ptOrder = 2; otOrder = 1; stOrder = 1;
  } else if (r === 6) {
    ptOrder = 1; otOrder = 1; stOrder = 0;
  } else if (r === 7) {
    ptOrder = 3; otOrder = 0; stOrder = 0; // Intense PT
  } else if (r === 8) {
    ptOrder = 0; otOrder = 2; stOrder = 0; // Pure OT
  } else if (r === 9) {
    ptOrder = 0; otOrder = 0; stOrder = 2; // Pure ST
  } else if (r === 10) {
    ptOrder = 1; otOrder = 0; stOrder = 0;
  } else {
    ptOrder = 2; otOrder = 2; stOrder = 0;
  }

  // Set up some NG therapist combinations
  // Assign 1 or 2 NG therapists to a few patients to test the constraint
  const ngTherapistIds: string[] = [];
  if (index % 15 === 3) {
    ngTherapistIds.push("t-pt-01"); // Cannot work with Sato
  }
  if (index % 15 === 7) {
    ngTherapistIds.push("t-ot-02"); // Cannot work with Matsumoto
  }
  if (index % 15 === 11) {
    ngTherapistIds.push("t-st-01"); // Cannot work with Morishita
  }

  return {
    id: pId,
    name,
    orders: {
      PT: ptOrder,
      OT: otOrder,
      ST: stOrder
    },
    ngTherapistIds
  };
});
