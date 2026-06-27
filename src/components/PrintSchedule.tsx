import React from 'react';
import { Therapist, Patient, ScheduleEntry, TIME_SLOTS } from '../types';
import { isTherapistOnBreak } from '../utils/scheduler';

interface PrintScheduleProps {
  therapists: Therapist[];
  patients: Patient[];
  entries: ScheduleEntry[];
  anonymize: boolean;
}

export default function PrintSchedule({
  therapists,
  patients,
  entries,
  anonymize
}: PrintScheduleProps) {
  
  const getPatientLabel = (patientId: string): string => {
    if (anonymize) return patientId;
    const p = patients.find(pat => pat.id === patientId);
    return p ? p.name : patientId;
  };

  // Group therapists by roles
  const pts = therapists.filter(t => t.role === 'PT');
  const ots = therapists.filter(t => t.role === 'OT');
  const sts = therapists.filter(t => t.role === 'ST');

  // Find all active schedule entries for a patient
  const getPatientSessions = (patientId: string) => {
    return entries.filter(e => e.patientId === patientId).sort((a, b) => a.slot - b.slot);
  };

  // Filter patients who actually have schedules today to save paper
  const scheduledPatients = patients.filter(p => 
    entries.some(e => e.patientId === p.id)
  );

  const todayStr = new Date().toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });

  return (
    <div className="text-black font-sans bg-white p-4">
      {/* 1. Cover Page / Title Header */}
      <div className="mb-8 border-b-2 border-black pb-4 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">リハビリ業務 自動作成予定表</h1>
          {anonymize && (
            <span className="text-xs bg-gray-100 text-gray-800 border border-gray-300 font-bold px-2 py-0.5 rounded-full mt-1 inline-block">
              個人情報保護モード：患者氏名 匿名化表示（ID表示）中
            </span>
          )}
        </div>
        <div className="text-right text-xs">
          <div><strong>対象日:</strong> {todayStr}</div>
          <div><strong>印刷日時:</strong> {new Date().toLocaleString('ja-JP')}</div>
        </div>
      </div>

      {/* 2. PT Schedule Sheet (理学療法士) */}
      <div className="page-break mb-12">
        <h2 className="text-sm font-bold bg-slate-100 px-3 py-1.5 border border-slate-300 border-b-0 inline-block rounded-t-lg">
          【理学療法 (PT)】担当予定表
        </h2>
        <table className="w-full text-center text-[10px] border-collapse border border-slate-400">
          <thead>
            <tr>
              <th className="border border-slate-400 bg-slate-50 font-bold text-[9px] w-16">時間枠</th>
              {pts.map(t => (
                <th key={t.id} className="border border-slate-400 bg-slate-50 font-bold text-[9px] min-w-16">
                  {t.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIME_SLOTS.map(slot => (
              <tr key={slot.index} className={slot.index % 2 === 0 ? 'bg-slate-50/30' : ''}>
                <td className="border border-slate-400 font-mono text-[9px] font-medium whitespace-nowrap px-1">
                  {slot.label}
                </td>
                {pts.map(t => {
                  if (isTherapistOnBreak(t, slot.index)) {
                    return <td key={t.id} className="border border-slate-400 bg-amber-50 text-amber-800 font-bold text-[9px]">休憩</td>;
                  }
                  if (t.busySlots.includes(slot.index)) {
                    return <td key={t.id} className="border border-slate-400 bg-slate-100 text-slate-500 text-[9px]">業務外</td>;
                  }
                  const entry = entries.find(e => e.therapistId === t.id && e.slot === slot.index);
                  return (
                    <td key={t.id} className="border border-slate-400 p-1 text-[10px] font-semibold">
                      {entry ? getPatientLabel(entry.patientId) : ''}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 3. OT Schedule Sheet (作業療法士) */}
      {ots.length > 0 && (
        <div className="page-break mb-12">
          <h2 className="text-sm font-bold bg-slate-100 px-3 py-1.5 border border-slate-300 border-b-0 inline-block rounded-t-lg">
            【作業療法 (OT)】担当予定表
          </h2>
          <table className="w-full text-center text-[10px] border-collapse border border-slate-400">
            <thead>
              <tr>
                <th className="border border-slate-400 bg-slate-50 font-bold text-[9px] w-16">時間枠</th>
                {ots.map(t => (
                  <th key={t.id} className="border border-slate-400 bg-slate-50 font-bold text-[9px] min-w-16">
                    {t.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TIME_SLOTS.map(slot => (
                <tr key={slot.index} className={slot.index % 2 === 0 ? 'bg-slate-50/30' : ''}>
                  <td className="border border-slate-400 font-mono text-[9px] font-medium whitespace-nowrap px-1">
                    {slot.label}
                  </td>
                  {ots.map(t => {
                    if (isTherapistOnBreak(t, slot.index)) {
                      return <td key={t.id} className="border border-slate-400 bg-amber-50 text-amber-800 font-bold text-[9px]">休憩</td>;
                    }
                    if (t.busySlots.includes(slot.index)) {
                      return <td key={t.id} className="border border-slate-400 bg-slate-100 text-slate-500 text-[9px]">業務外</td>;
                    }
                    const entry = entries.find(e => e.therapistId === t.id && e.slot === slot.index);
                    return (
                      <td key={t.id} className="border border-slate-400 p-1 text-[10px] font-semibold">
                        {entry ? getPatientLabel(entry.patientId) : ''}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 4. ST Schedule Sheet (言語聴覚士) */}
      {sts.length > 0 && (
        <div className="page-break mb-12">
          <h2 className="text-sm font-bold bg-slate-100 px-3 py-1.5 border border-slate-300 border-b-0 inline-block rounded-t-lg">
            【言語聴覚療法 (ST)】担当予定表
          </h2>
          <table className="w-full text-center text-[10px] border-collapse border border-slate-400">
            <thead>
              <tr>
                <th className="border border-slate-400 bg-slate-50 font-bold text-[9px] w-16">時間枠</th>
                {sts.map(t => (
                  <th key={t.id} className="border border-slate-400 bg-slate-50 font-bold text-[9px] min-w-16">
                    {t.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TIME_SLOTS.map(slot => (
                <tr key={slot.index} className={slot.index % 2 === 0 ? 'bg-slate-50/30' : ''}>
                  <td className="border border-slate-400 font-mono text-[9px] font-medium whitespace-nowrap px-1">
                    {slot.label}
                  </td>
                  {sts.map(t => {
                    if (isTherapistOnBreak(t, slot.index)) {
                      return <td key={t.id} className="border border-slate-400 bg-amber-50 text-amber-800 font-bold text-[9px]">休憩</td>;
                    }
                    if (t.busySlots.includes(slot.index)) {
                      return <td key={t.id} className="border border-slate-400 bg-slate-100 text-slate-500 text-[9px]">業務外</td>;
                    }
                    const entry = entries.find(e => e.therapistId === t.id && e.slot === slot.index);
                    return (
                      <td key={t.id} className="border border-slate-400 p-1 text-[10px] font-semibold">
                        {entry ? getPatientLabel(entry.patientId) : ''}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 5. Patient-Specific Schedule Sheet */}
      <div>
        <h2 className="text-sm font-bold bg-slate-100 px-3 py-1.5 border border-slate-300 border-b-0 inline-block rounded-t-lg">
          患者別スケジュール一覧
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 border border-slate-300 p-4 rounded-b-lg bg-white">
          {scheduledPatients.map(p => {
            const sessions = getPatientSessions(p.id);
            return (
              <div key={p.id} className="border border-slate-200 p-2.5 rounded-lg text-xs bg-slate-50/30">
                <div className="font-bold border-b border-slate-300 pb-1 mb-1.5 flex justify-between">
                  <span>{getPatientLabel(p.id)}</span>
                  <span className="text-[9px] text-slate-500 font-mono">ID: {p.id}</span>
                </div>
                <div className="space-y-1">
                  {sessions.map(s => {
                    const therapist = therapists.find(t => t.id === s.therapistId);
                    return (
                      <div key={s.id} className="flex justify-between items-center text-[10px] py-0.5">
                        <span className="font-mono text-slate-600">{TIME_SLOTS[s.slot].label}</span>
                        <span className="font-bold">
                          [{s.role}] {therapist?.name || s.therapistId}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
