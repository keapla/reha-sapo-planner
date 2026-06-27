import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Plus, 
  Trash2, 
  Search, 
  Clock, 
  Coffee, 
  AlertCircle, 
  X,
  PlusCircle,
  Briefcase,
  Download,
  Upload
} from 'lucide-react';
import { Therapist, RoleType, TIME_SLOTS, ScheduleEntry } from '../types';

interface TherapistListProps {
  therapists: Therapist[];
  entries: ScheduleEntry[];
  onAddTherapist: (therapist: Omit<Therapist, 'id'>) => void;
  onRemoveTherapist: (id: string) => void;
  onUpdateTherapist: (therapist: Therapist) => void;
  onImportExcel: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExportExcel: () => void;
}

const BREAK_OPTIONS = [
  { startSlot: 8, label: "11:40 - 12:40 (9〜11枠)" },
  { startSlot: 9, label: "12:00 - 13:00 (10〜12枠)" },
  { startSlot: 10, label: "12:20 - 13:20 (11〜13枠)" },
  { startSlot: 11, label: "12:40 - 13:40 (12〜14枠)" },
  { startSlot: 12, label: "13:00 - 14:00 (13〜15枠)" },
  { startSlot: 13, label: "13:20 - 14:20 (14〜16枠)" },
  { startSlot: 14, label: "13:40 - 14:40 (15〜17枠)" },
];

export default function TherapistList({
  therapists,
  entries,
  onAddTherapist,
  onRemoveTherapist,
  onUpdateTherapist,
  onImportExcel,
  onExportExcel
}: TherapistListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleType | 'ALL'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // New Therapist Form State
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<RoleType>('PT');
  const [newBreakStart, setNewBreakStart] = useState(11); // default 12:40
  const [newBusySlots, setNewBusySlots] = useState<number[]>([]);
  const [newPastUnits, setNewPastUnits] = useState<number>(0);

  // Filtering
  const filtered = therapists.filter(t => {
    const matchesRole = roleFilter === 'ALL' || t.role === roleFilter;
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const handleOpenAddModal = () => {
    setNewName('');
    setNewRole('PT');
    setNewBreakStart(11);
    setNewBusySlots([]);
    setNewPastUnits(0);
    setIsModalOpen(true);
  };

  const handleAddTherapistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    onAddTherapist({
      name: newName,
      role: newRole,
      breakStartSlot: newBreakStart,
      busySlots: newBusySlots,
      pastUnits: newPastUnits
    });

    setIsModalOpen(false);
  };

  const toggleBusySlot = (slotIdx: number) => {
    if (newBusySlots.includes(slotIdx)) {
      setNewBusySlots(newBusySlots.filter(s => s !== slotIdx));
    } else {
      setNewBusySlots([...newBusySlots, slotIdx]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Actions Header */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {/* Role filter buttons */}
          <div className="flex bg-slate-100 p-0.5 rounded-full border border-slate-200 w-fit">
            {(['ALL', 'PT', 'OT', 'ST'] as const).map(role => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${roleFilter === role ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
              >
                {role === 'ALL' ? '全員' : role}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Excel Import */}
          <label className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-xs font-bold hover:bg-emerald-100/60 cursor-pointer transition-all whitespace-nowrap">
            <Upload size={14} />
            Excelインポート
            <input 
              type="file" 
              accept=".xlsx,.xls" 
              onChange={onImportExcel} 
              className="hidden" 
            />
          </label>

          {/* Excel Export */}
          <button
            onClick={onExportExcel}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-xs font-bold hover:bg-emerald-100/60 transition-all whitespace-nowrap"
          >
            <Download size={14} />
            Excelエクスポート
          </button>

          {/* Search bar */}
          <div className="relative flex-1 sm:flex-initial min-w-[150px]">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="療法士を検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm bg-slate-50/50 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
            />
          </div>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-xs font-bold shadow-sm transition-all whitespace-nowrap"
          >
            <Plus size={16} />
            療法士を追加
          </button>
        </div>
      </div>

      {/* Grid of Therapist Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(t => {
          let roleTagColor = "bg-indigo-50 border-indigo-100 text-indigo-700";
          if (t.role === 'OT') roleTagColor = "bg-teal-50 border-teal-100 text-teal-700";
          if (t.role === 'ST') roleTagColor = "bg-rose-50 border-rose-100 text-rose-700";

          const breakLabel = BREAK_OPTIONS.find(b => b.startSlot === t.breakStartSlot)?.label || `枠 ${t.breakStartSlot}`;
          const assignedCount = entries.filter(e => e.therapistId === t.id).length;
          const pastCount = t.pastUnits || 0;
          const totalCount = pastCount + assignedCount;
          const totalHours = (totalCount * 20) / 60;
          const pastHours = (pastCount * 20) / 60;
          const assignedHours = (assignedCount * 20) / 60;
          const isOverLimit = totalHours > 108;

          return (
            <motion.div
              layout
              key={t.id}
              className={`bg-white p-5 rounded-3xl border shadow-sm flex flex-col justify-between hover:shadow-md transition-all relative group ${isOverLimit ? 'border-red-200 bg-red-50/10' : 'border-slate-100'}`}
            >
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-800 text-base">{t.name}</h4>
                    <span className={`inline-block text-[10px] px-2 py-0.5 rounded font-bold border mt-1.5 ${roleTagColor}`}>
                      {t.role === 'PT' ? '理学療法士 (PT)' : t.role === 'OT' ? '作業療法士 (OT)' : '言語聴覚士 (ST)'}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => onRemoveTherapist(t.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                    title="療法士を削除"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Hours Limit Meter */}
                <div className="mt-4 pt-4 border-t border-slate-50 space-y-2 text-xs">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-500">週合計勤務時間（上限108h）:</span>
                    <span className={`font-bold ${isOverLimit ? 'text-red-600' : 'text-slate-700'}`}>
                      {totalHours.toFixed(1)} / 108 時間
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${isOverLimit ? 'bg-red-500 animate-pulse' : totalHours > 90 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.min(100, (totalHours / 108) * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>過去消化: {pastCount}単位 ({pastHours.toFixed(1)}h)</span>
                    <span>本日予定: {assignedCount}単位 ({assignedHours.toFixed(1)}h)</span>
                  </div>
                </div>

                <div className="mt-4 space-y-2 pt-4 border-t border-slate-50 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Coffee size={14} className="text-slate-400" />
                    <span>
                      <strong className="text-slate-700">休憩:</strong> {breakLabel}
                    </span>
                  </div>

                  <div className="flex items-start gap-2">
                    <Briefcase size={14} className="text-slate-400 mt-0.5" />
                    <div className="flex-1">
                      <strong className="text-slate-700">業務外枠:</strong>{' '}
                      {t.busySlots.length > 0 ? (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {t.busySlots.sort((a,b)=>a-b).map(slot => (
                            <span key={slot} className="px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 rounded text-[9px] font-semibold">
                              {TIME_SLOTS[slot].label} ({TIME_SLOTS[slot].timeRange.split(' - ')[0]})
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">なし（全時間枠で稼働可能）</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Inline Break Modifier */}
              <div className="mt-4 pt-3 border-t border-slate-50 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold text-slate-400">休憩時間の変更:</span>
                  <select
                    value={t.breakStartSlot}
                    onChange={(e) => onUpdateTherapist({ ...t, breakStartSlot: parseInt(e.target.value, 10) })}
                    className="px-2 py-1 text-[11px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-600 max-w-[130px]"
                  >
                    {BREAK_OPTIONS.map(opt => (
                      <option key={opt.startSlot} value={opt.startSlot}>{opt.label.split(' (')[0]}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-semibold text-slate-400">過去勤務（消化）単位数:</span>
                    <span className="text-[9px] text-slate-400">({((t.pastUnits || 0) * 20 / 60).toFixed(1)}時間)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      max={324}
                      value={t.pastUnits !== undefined ? t.pastUnits : 0}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        onUpdateTherapist({ ...t, pastUnits: isNaN(val) ? 0 : Math.min(324, Math.max(0, val)) });
                      }}
                      className="w-14 px-1.5 py-0.5 text-right text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700 font-bold"
                    />
                    <span className="text-[10px] text-slate-400">単位</span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-full bg-white p-12 text-center rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
            <Users size={40} className="stroke-1 mb-2 text-slate-300" />
            <span className="text-sm">該当する療法士が見つかりません。</span>
          </div>
        )}
      </div>

      {/* Add Therapist Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-xl border border-slate-100 w-full max-w-lg overflow-hidden"
            >
              <form onSubmit={handleAddTherapistSubmit}>
                {/* Header */}
                <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PlusCircle className="text-indigo-600" size={18} />
                    <h3 className="font-bold text-slate-800">新規療法士の登録</h3>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="p-1 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Content */}
                <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                  {/* Name field */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">氏名</label>
                    <input
                      type="text"
                      required
                      placeholder="例：山田 健二"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm animate-none"
                    />
                  </div>

                  {/* Role Type */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 block">職種 / 資格</label>
                    <div className="grid grid-cols-3 gap-2 mt-1">
                      {(['PT', 'OT', 'ST'] as const).map(role => (
                        <button
                          key={role}
                          type="button"
                          onClick={() => setNewRole(role)}
                          className={`py-2 px-4 rounded-full text-xs font-bold border transition-all ${newRole === role ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}
                        >
                          {role === 'PT' ? '理学療法 (PT)' : role === 'OT' ? '作業療法 (OT)' : '言語聴覚 (ST)'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Break window selection */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">お昼休憩（連続60分・3枠）</label>
                    <select
                      value={newBreakStart}
                      onChange={(e) => setNewBreakStart(parseInt(e.target.value, 10))}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm mt-1"
                    >
                      {BREAK_OPTIONS.map(opt => (
                        <option key={opt.startSlot} value={opt.startSlot}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Busy Slots check box grid */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 block">業務外枠（会議、他業務等で割り当て不可の枠）</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mt-2 max-h-40 overflow-y-auto p-2 border border-slate-100 bg-slate-50/50 rounded-2xl">
                      {TIME_SLOTS.map(slot => {
                        const isChecked = newBusySlots.includes(slot.index);
                        return (
                          <label 
                            key={slot.index} 
                            className={`flex items-center gap-2 p-1.5 rounded-xl border text-[11px] cursor-pointer transition-all select-none ${isChecked ? 'bg-amber-50 border-amber-200 text-amber-800 font-semibold' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleBusySlot(slot.index)}
                              className="accent-amber-500"
                            />
                            <div className="truncate">
                              <div>{slot.label}</div>
                              <div className="text-[9px] opacity-70">{slot.timeRange.split(' - ')[0]}</div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Past Units Input */}
                  <div className="space-y-1 pt-2">
                    <label className="text-xs font-semibold text-slate-500 block">今週の過去勤務（消化）単位数</label>
                    <div className="flex items-center gap-3 mt-1">
                      <input
                        type="number"
                        min={0}
                        max={324}
                        value={newPastUnits}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setNewPastUnits(isNaN(val) ? 0 : Math.min(324, Math.max(0, val)));
                        }}
                        className="w-24 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold text-slate-700"
                      />
                      <span className="text-[11px] text-slate-500 leading-tight">
                        単位（週108時間上限の計算用。今週すでに消化した総単位数です。108時間＝324単位。現在: {((newPastUnits * 20) / 60).toFixed(1)}時間）
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-sm transition-colors"
                  >
                    登録する
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
