import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  User, 
  Trash2, 
  Plus, 
  Coffee, 
  X, 
  Calendar, 
  Clock, 
  ShieldAlert, 
  Filter 
} from 'lucide-react';
import { Therapist, Patient, ScheduleEntry, RoleType, TIME_SLOTS } from '../types';
import { isTherapistOnBreak } from '../utils/scheduler';

interface ScheduleGridProps {
  therapists: Therapist[];
  patients: Patient[];
  entries: ScheduleEntry[];
  onAddEntry: (entry: Omit<ScheduleEntry, 'id'>) => void;
  onRemoveEntry: (id: string) => void;
}

export default function ScheduleGrid({
  therapists,
  patients,
  entries,
  onAddEntry,
  onRemoveEntry
}: ScheduleGridProps) {
  const [viewType, setViewType] = useState<'therapist' | 'patient'>('therapist');
  const [roleFilter, setRoleFilter] = useState<RoleType | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Manual edit state
  const [activeCell, setActiveCell] = useState<{ therapistId: string; slot: number } | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState('');

  // 1. Filter Therapists
  const filteredTherapists = therapists.filter(t => {
    const matchesRole = roleFilter === 'ALL' || t.role === roleFilter;
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesSearch;
  });

  // 2. Filter Patients (only show those with active schedule entries or active orders to avoid rendering all 79 column headers in grid)
  const patientsWithSchedule = patients.filter(p => {
    const hasSess = entries.some(e => e.patientId === p.id);
    const hasOrder = p.orders.PT > 0 || p.orders.OT > 0 || p.orders.ST > 0;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return (hasSess || hasOrder) && matchesSearch;
  });

  // Map to speed up queries
  const therapistMap = new Map<string, Therapist>(therapists.map(t => [t.id, t]));
  const patientMap = new Map<string, Patient>(patients.map(p => [p.id, p]));

  // Get entry by therapist and slot
  const getTherapistSlotEntry = (therapistId: string, slot: number) => {
    return entries.find(e => e.therapistId === therapistId && e.slot === slot);
  };

  // Get entries by patient and slot
  const getPatientSlotEntries = (patientId: string, slot: number) => {
    return entries.filter(e => e.patientId === patientId && e.slot === slot);
  };

  const handleOpenAssignModal = (therapistId: string, slot: number) => {
    setActiveCell({ therapistId, slot });
    setSelectedPatientId('');
  };

  const handleAssignPatient = () => {
    if (!activeCell || !selectedPatientId) return;
    
    const therapist = therapistMap.get(activeCell.therapistId);
    if (!therapist) return;

    onAddEntry({
      patientId: selectedPatientId,
      therapistId: activeCell.therapistId,
      slot: activeCell.slot,
      role: therapist.role,
      isManual: true
    });

    setActiveCell(null);
  };

  return (
    <div className="space-y-4">
      {/* View Toggle & Filters */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Toggle View */}
        <div className="flex bg-slate-100 p-1 rounded-full w-fit">
          <button
            onClick={() => { setViewType('therapist'); setSearchQuery(''); }}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${viewType === 'therapist' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            療法士別スケジュール
          </button>
          <button
            onClick={() => { setViewType('patient'); setSearchQuery(''); }}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${viewType === 'patient' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            患者別スケジュール
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {viewType === 'therapist' && (
            <div className="flex rounded-full border border-slate-200 p-0.5 bg-slate-50/50">
              {(['ALL', 'PT', 'OT', 'ST'] as const).map(role => (
                <button
                  key={role}
                  onClick={() => setRoleFilter(role)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${roleFilter === role ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-800'}`}
                >
                  {role === 'ALL' ? '全員' : role}
                </button>
              ))}
            </div>
          )}

          {/* Search Bar */}
          <div className="relative min-w-[200px]">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              placeholder={viewType === 'therapist' ? "療法士名を検索..." : "患者名を検索..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm bg-slate-50/50 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
            />
          </div>
        </div>
      </div>

      {/* Grid Container */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        {/* Horizontal Scroll wrapper for desktop/mobile timeline */}
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            
            {/* VIEW 1: THERAPIST TIMELINE GRID */}
            {viewType === 'therapist' && (
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100">
                    <th className="p-3 text-xs font-bold text-slate-500 sticky left-0 bg-slate-50/90 w-32 z-10">時間枠</th>
                    {filteredTherapists.map(t => {
                      let tagColor = "bg-indigo-100 text-indigo-700";
                      if (t.role === 'OT') tagColor = "bg-teal-100 text-teal-700";
                      if (t.role === 'ST') tagColor = "bg-rose-100 text-rose-700";

                      return (
                        <th key={t.id} className="p-3 border-l border-slate-100 min-w-[140px] text-center">
                          <span className="font-bold text-slate-800 text-sm block">{t.name}</span>
                          <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded font-mono font-bold mt-1 ${tagColor}`}>
                            {t.role}
                          </span>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {TIME_SLOTS.map(slot => (
                    <tr key={slot.index} className="border-b border-slate-50 hover:bg-slate-50/30">
                      {/* Left Header - Time Slot */}
                      <td className="p-3 text-xs font-mono font-semibold text-slate-500 bg-slate-50/30 sticky left-0 z-10 border-r border-slate-100 shadow-[2px_0_5px_rgba(0,0,0,0.01)]">
                        <div className="font-bold text-slate-700">{slot.label}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{slot.timeRange}</div>
                      </td>

                      {/* Columns per Therapist */}
                      {filteredTherapists.map(therapist => {
                        const entry = getTherapistSlotEntry(therapist.id, slot.index);
                        const patient = entry ? patientMap.get(entry.patientId) : null;
                        const onBreak = isTherapistOnBreak(therapist, slot.index);
                        const isBusy = therapist.busySlots.includes(slot.index);

                        return (
                          <td 
                            key={therapist.id} 
                            className="p-1.5 border-l border-slate-100 align-middle text-center h-16 relative"
                          >
                            {/* Break Display */}
                            {onBreak && (
                              <div className="w-full h-full rounded-xl bg-slate-50 border border-slate-200/60 flex flex-col items-center justify-center text-slate-400 select-none">
                                <Coffee size={14} className="text-slate-400" />
                                <span className="text-[10px] font-medium mt-0.5">休憩 (60分)</span>
                              </div>
                            )}

                            {/* Busy Display */}
                            {!onBreak && isBusy && (
                              <div className="w-full h-full rounded-xl bg-amber-50/30 border border-dashed border-amber-200/50 flex flex-col items-center justify-center text-amber-500/80 select-none">
                                <span className="text-[10px] font-semibold">業務外 / 休診</span>
                              </div>
                            )}

                            {/* Assigned Entry */}
                            {!onBreak && !isBusy && entry && patient && (
                              <div className="group w-full h-full p-2 rounded-xl bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100 flex flex-col justify-between items-center relative transition-colors shadow-sm">
                                <span className="text-xs font-bold text-slate-700 line-clamp-1 block pr-4">
                                  {patient.name.split(' (')[0]}
                                </span>
                                <div className="flex items-center justify-between w-full mt-1">
                                  <span className="text-[9px] text-indigo-600 font-bold tracking-wider font-mono">
                                    {entry.role}
                                  </span>
                                  {entry.isManual && (
                                    <span className="text-[8px] bg-indigo-100 text-indigo-700 px-1 rounded font-medium">
                                      手動
                                    </span>
                                  )}
                                </div>

                                {/* Delete button on hover */}
                                <button
                                  onClick={() => onRemoveEntry(entry.id)}
                                  className="absolute top-1 right-1 p-1 bg-red-50 hover:bg-red-100 rounded text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="予定を削除"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            )}

                            {/* Empty Assignable Slot */}
                            {!onBreak && !isBusy && !entry && (
                              <button
                                onClick={() => handleOpenAssignModal(therapist.id, slot.index)}
                                className="w-full h-full border border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/20 rounded-xl flex items-center justify-center text-slate-300 hover:text-indigo-500 transition-all group"
                                title="新規リハビリ割り当て"
                              >
                                <Plus size={14} className="group-hover:scale-110 transition-transform" />
                              </button>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* VIEW 2: PATIENT TIMELINE GRID */}
            {viewType === 'patient' && (
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100">
                    <th className="p-3 text-xs font-bold text-slate-500 sticky left-0 bg-slate-50/90 w-32 z-10">時間枠</th>
                    {patientsWithSchedule.map(p => {
                      const totalOrders = p.orders.PT + p.orders.OT + p.orders.ST;
                      return (
                        <th key={p.id} className="p-3 border-l border-slate-100 min-w-[140px] text-center">
                          <span className="font-bold text-slate-800 text-sm block truncate max-w-[150px]">{p.name.split(' (')[0]}</span>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            要リハ: {totalOrders}枠 (PT:{p.orders.PT} OT:{p.orders.OT} ST:{p.orders.ST})
                          </span>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {TIME_SLOTS.map(slot => (
                    <tr key={slot.index} className="border-b border-slate-50 hover:bg-slate-50/30">
                      {/* Left Header - Time Slot */}
                      <td className="p-3 text-xs font-mono font-semibold text-slate-500 bg-slate-50/30 sticky left-0 z-10 border-r border-slate-100 shadow-[2px_0_5px_rgba(0,0,0,0.01)]">
                        <div className="font-bold text-slate-700">{slot.label}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{slot.timeRange}</div>
                      </td>

                      {/* Columns per Patient */}
                      {patientsWithSchedule.map(patient => {
                        const sEntries = getPatientSlotEntries(patient.id, slot.index);

                        return (
                          <td 
                            key={patient.id} 
                            className="p-1.5 border-l border-slate-100 align-middle text-center h-16"
                          >
                            {sEntries.length > 0 ? (
                              <div className="flex flex-col gap-1">
                                {sEntries.map(entry => {
                                  const therapist = therapistMap.get(entry.therapistId);
                                  let roleColor = "bg-indigo-50 border-indigo-100 text-indigo-800";
                                  if (entry.role === 'OT') roleColor = "bg-teal-50 border-teal-100 text-teal-800";
                                  if (entry.role === 'ST') roleColor = "bg-rose-50 border-rose-100 text-rose-800";

                                  return (
                                    <div 
                                      key={entry.id} 
                                      className={`group p-2 rounded-xl border flex flex-col justify-between relative shadow-sm text-left ${roleColor}`}
                                    >
                                      <span className="text-xs font-bold block line-clamp-1 pr-4">
                                        {therapist?.name || entry.therapistId}
                                      </span>
                                      <div className="flex items-center justify-between w-full mt-0.5">
                                        <span className="text-[9px] font-bold tracking-wide font-mono opacity-80">
                                          {entry.role}
                                        </span>
                                      </div>

                                      {/* Delete button on hover */}
                                      <button
                                        onClick={() => onRemoveEntry(entry.id)}
                                        className="absolute top-1 right-1 p-0.5 bg-red-50 hover:bg-red-100 rounded text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="予定を削除"
                                      >
                                        <Trash2 size={10} />
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-200">
                                <span className="text-[10px] font-mono">-</span>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

          </div>
        </div>
      </div>

      {/* Manual Patient Assign Modal */}
      <AnimatePresence>
        {activeCell && (
          <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-xl border border-slate-100 w-full max-w-md overflow-hidden"
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="text-indigo-600" size={18} />
                  <h3 className="font-bold text-slate-800">スケジュール新規追加</h3>
                </div>
                <button 
                  onClick={() => setActiveCell(null)}
                  className="p-1 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Content */}
              <div className="p-5 space-y-4">
                <div className="space-y-2 p-3 bg-slate-50 rounded-2xl text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>担当療法士:</span>
                    <span className="font-bold text-slate-800">
                      {therapistMap.get(activeCell.therapistId)?.name} ({therapistMap.get(activeCell.therapistId)?.role})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>時間帯:</span>
                    <span className="font-bold text-slate-800">
                      {TIME_SLOTS[activeCell.slot].label} ({TIME_SLOTS[activeCell.slot].timeRange})
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 block">患者を選択</label>
                  <select
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  >
                    <option value="">-- 患者を選択してください --</option>
                    
                    {/* Patients group with unassigned orders for this role */}
                    <optgroup label="✨ 本日オーダーがあり未割り当ての患者">
                      {patients
                        .filter(p => {
                          const role = therapistMap.get(activeCell.therapistId)?.role as RoleType;
                          const ordered = p.orders[role];
                          const assigned = entries.filter(e => e.patientId === p.id && e.role === role).length;
                          const hasUnassigned = ordered > assigned;
                          const isNg = p.ngTherapistIds.includes(activeCell.therapistId);
                          return hasUnassigned && !isNg;
                        })
                        .map(p => {
                          const role = therapistMap.get(activeCell.therapistId)?.role as RoleType;
                          return (
                            <option key={p.id} value={p.id}>
                              {p.name.split(' (')[0]} (未割当:{p.orders[role] - entries.filter(e => e.patientId === p.id && e.role === role).length}枠)
                            </option>
                          );
                        })}
                    </optgroup>

                    {/* All other patients */}
                    <optgroup label="その他の患者">
                      {patients
                        .filter(p => {
                          // Filter out NG therapists and those already in optgroup
                          const role = therapistMap.get(activeCell.therapistId)?.role as RoleType;
                          const ordered = p.orders[role];
                          const assigned = entries.filter(e => e.patientId === p.id && e.role === role).length;
                          const hasUnassigned = ordered > assigned;
                          const isNg = p.ngTherapistIds.includes(activeCell.therapistId);
                          return !hasUnassigned && !isNg;
                        })
                        .map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name.split(' (')[0]}
                          </option>
                        ))}
                    </optgroup>

                    {/* NG patients (disabled just for reference or skipped) */}
                    <optgroup label="⚠️ NG登録されているため選択不可の患者">
                      {patients
                        .filter(p => p.ngTherapistIds.includes(activeCell.therapistId))
                        .map(p => (
                          <option key={p.id} value={p.id} disabled>
                            {p.name.split(' (')[0]} (NG指定)
                          </option>
                        ))}
                    </optgroup>
                  </select>
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
                <button
                  onClick={() => setActiveCell(null)}
                  className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleAssignPatient}
                  disabled={!selectedPatientId}
                  className="px-5 py-2 text-sm font-bold bg-indigo-600 disabled:bg-indigo-400 text-white rounded-full shadow-sm transition-all hover:bg-indigo-700"
                >
                  割り当てる
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
