import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Plus, 
  Trash2, 
  Search, 
  Activity, 
  HeartHandshake, 
  Calendar, 
  AlertTriangle, 
  X,
  PlusCircle,
  HelpCircle,
  ShieldCheck
} from 'lucide-react';
import { Patient, Therapist, ScheduleEntry, RoleType, TIME_SLOTS } from '../types';

interface PatientListProps {
  patients: Patient[];
  therapists: Therapist[];
  entries: ScheduleEntry[];
  onAddPatient: (patient: Omit<Patient, 'id'>) => void;
  onRemovePatient: (id: string) => void;
  onUpdatePatient: (patient: Patient) => void;
}

export default function PatientList({
  patients,
  therapists,
  entries,
  onAddPatient,
  onRemovePatient,
  onUpdatePatient
}: PatientListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [orderFilter, setOrderFilter] = useState<'ALL' | 'PT' | 'OT' | 'ST'>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');

  // New Patient Form State
  const [newName, setNewName] = useState('');
  const [newPtOrder, setNewPtOrder] = useState(0);
  const [newOtOrder, setNewOtOrder] = useState(0);
  const [newStOrder, setNewStOrder] = useState(0);
  const [newNgTherapistIds, setNewNgTherapistIds] = useState<string[]>([]);

  // Filtering
  const filtered = patients.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (orderFilter === 'ALL') return matchesSearch;
    if (orderFilter === 'PT') return matchesSearch && p.orders.PT > 0;
    if (orderFilter === 'OT') return matchesSearch && p.orders.OT > 0;
    if (orderFilter === 'ST') return matchesSearch && p.orders.ST > 0;
    return matchesSearch;
  });

  const handleOpenAddModal = () => {
    setNewName('');
    setNewPtOrder(1);
    setNewOtOrder(0);
    setNewStOrder(0);
    setNewNgTherapistIds([]);
    setIsModalOpen(true);
  };

  const handleAddPatientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    onAddPatient({
      name: newName,
      orders: {
        PT: newPtOrder,
        OT: newOtOrder,
        ST: newStOrder
      },
      ngTherapistIds: newNgTherapistIds
    });

    setIsModalOpen(false);
  };

  const toggleNgTherapist = (therapistId: string) => {
    if (newNgTherapistIds.includes(therapistId)) {
      setNewNgTherapistIds(newNgTherapistIds.filter(id => id !== therapistId));
    } else {
      setNewNgTherapistIds([...newNgTherapistIds, therapistId]);
    }
  };

  // Get current scheduled items for a patient
  const getPatientScheduledSessions = (patientId: string) => {
    return entries
      .filter(e => e.patientId === patientId)
      .sort((a, b) => a.slot - b.slot);
  };

  return (
    <div className="space-y-4">
      {/* Filters and Actions Header */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">オーダー絞り込み:</span>
            <div className="flex bg-slate-100 p-0.5 rounded-full border border-slate-200">
              {(['ALL', 'PT', 'OT', 'ST'] as const).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setOrderFilter(type)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${orderFilter === type ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
                >
                  {type === 'ALL' ? '全員' : `${type}対象`}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">表示形式:</span>
            <div className="flex bg-slate-100 p-0.5 rounded-full border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-3.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${viewMode === 'table' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                表形式 (一括確認・修正)
              </button>
              <button
                type="button"
                onClick={() => setViewMode('card')}
                className={`px-3.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${viewMode === 'card' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                カード表示
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto">
          {/* Search bar */}
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="患者名や番号を検索..."
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
            患者を追加
          </button>
        </div>
      </div>

      {/* Table View or Grid View of Patients */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-5 py-4 text-xs font-bold text-slate-500 w-24">患者ID</th>
                  <th className="px-5 py-4 text-xs font-bold text-slate-500 min-w-[160px]">患者氏名</th>
                  <th className="px-5 py-4 text-xs font-bold text-slate-500 text-center w-36">理学療法 (PT)</th>
                  <th className="px-5 py-4 text-xs font-bold text-slate-500 text-center w-36">作業療法 (OT)</th>
                  <th className="px-5 py-4 text-xs font-bold text-slate-500 text-center w-36">言語聴覚 (ST)</th>
                  <th className="px-5 py-4 text-xs font-bold text-slate-500">避けるべき療法士 (NG担当)</th>
                  <th className="px-5 py-4 text-xs font-bold text-slate-500 text-center w-20">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Patient ID */}
                    <td className="px-5 py-3.5 font-mono text-xs font-bold text-slate-400">
                      {p.id}
                    </td>

                    {/* Patient Name Input */}
                    <td className="px-5 py-3.5">
                      <input
                        type="text"
                        value={p.name}
                        onChange={(e) => onUpdatePatient({ ...p, name: e.target.value })}
                        className="bg-transparent hover:bg-slate-100/70 focus:bg-white border border-transparent hover:border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-2.5 py-1 text-sm font-bold text-slate-700 w-full max-w-[180px] transition-all font-semibold"
                      />
                    </td>

                    {/* PT Orders */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => onUpdatePatient({ ...p, orders: { ...p.orders, PT: Math.max(0, p.orders.PT - 1) } })}
                          className="w-6 h-6 bg-slate-100 hover:bg-slate-200 active:scale-90 border border-slate-200 text-slate-600 rounded-full font-bold text-xs flex items-center justify-center select-none transition-all cursor-pointer"
                        >
                          -
                        </button>
                        <span className="w-6 text-center font-bold font-mono text-sm text-indigo-600">
                          {p.orders.PT}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdatePatient({ ...p, orders: { ...p.orders, PT: p.orders.PT + 1 } })}
                          className="w-6 h-6 bg-slate-100 hover:bg-slate-200 active:scale-90 border border-slate-200 text-slate-600 rounded-full font-bold text-xs flex items-center justify-center select-none transition-all cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </td>

                    {/* OT Orders */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => onUpdatePatient({ ...p, orders: { ...p.orders, OT: Math.max(0, p.orders.OT - 1) } })}
                          className="w-6 h-6 bg-slate-100 hover:bg-slate-200 active:scale-90 border border-slate-200 text-slate-600 rounded-full font-bold text-xs flex items-center justify-center select-none transition-all cursor-pointer"
                        >
                          -
                        </button>
                        <span className="w-6 text-center font-bold font-mono text-sm text-teal-600">
                          {p.orders.OT}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdatePatient({ ...p, orders: { ...p.orders, OT: p.orders.OT + 1 } })}
                          className="w-6 h-6 bg-slate-100 hover:bg-slate-200 active:scale-90 border border-slate-200 text-slate-600 rounded-full font-bold text-xs flex items-center justify-center select-none transition-all cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </td>

                    {/* ST Orders */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => onUpdatePatient({ ...p, orders: { ...p.orders, ST: Math.max(0, p.orders.ST - 1) } })}
                          className="w-6 h-6 bg-slate-100 hover:bg-slate-200 active:scale-90 border border-slate-200 text-slate-600 rounded-full font-bold text-xs flex items-center justify-center select-none transition-all cursor-pointer"
                        >
                          -
                        </button>
                        <span className="w-6 text-center font-bold font-mono text-sm text-rose-600">
                          {p.orders.ST}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdatePatient({ ...p, orders: { ...p.orders, ST: p.orders.ST + 1 } })}
                          className="w-6 h-6 bg-slate-100 hover:bg-slate-200 active:scale-90 border border-slate-200 text-slate-600 rounded-full font-bold text-xs flex items-center justify-center select-none transition-all cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </td>

                    {/* NG Therapists selection */}
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-1 items-center max-w-sm">
                        {p.ngTherapistIds.map(id => {
                          const t = therapists.find(th => th.id === id);
                          return (
                            <span 
                              key={id} 
                              className="inline-flex items-center gap-1 pl-2 pr-1.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200/50 rounded-full text-[10px] font-bold"
                            >
                              {t?.name || id} ({t?.role || ''})
                              <button
                                type="button"
                                onClick={() => onUpdatePatient({ ...p, ngTherapistIds: p.ngTherapistIds.filter(nid => nid !== id) })}
                                className="hover:bg-rose-200 text-rose-800 rounded-full w-3.5 h-3.5 flex items-center justify-center font-extrabold text-[9px] transition-colors cursor-pointer border-0"
                              >
                                ×
                              </button>
                            </span>
                          );
                        })}
                        
                        {/* Selector */}
                        <select
                          value=""
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val && !p.ngTherapistIds.includes(val)) {
                              onUpdatePatient({ ...p, ngTherapistIds: [...p.ngTherapistIds, val] });
                            }
                          }}
                          className="text-[10px] bg-slate-50 border border-slate-200 text-slate-500 rounded-full px-2.5 py-1 font-bold hover:bg-slate-100 transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-500 max-w-[110px] cursor-pointer"
                        >
                          <option value="">+ 追加</option>
                          {therapists.map(th => (
                            <option key={th.id} value={th.id} disabled={p.ngTherapistIds.includes(th.id)}>
                              {th.name} ({th.role})
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={() => onRemovePatient(p.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all cursor-pointer border-0"
                        title="患者を削除"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-sm text-slate-400 italic">
                      該当する患者情報が見つかりません。
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(p => {
          const sessions = getPatientScheduledSessions(p.id);
          const totalRequired = p.orders.PT + p.orders.OT + p.orders.ST;
          const assignedCount = sessions.length;

          return (
            <motion.div
              layout
              key={p.id}
              className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative group"
            >
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-800 text-base">{p.name}</h4>
                    <span className="text-[10px] text-slate-400 font-mono block mt-0.5">ID: {p.id}</span>
                  </div>

                  <button
                    onClick={() => onRemovePatient(p.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                    title="患者を削除"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Rehabilitation Orders Display */}
                <div className="mt-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Activity size={12} className="text-slate-500" />
                      本日オーダー
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${assignedCount === totalRequired ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                      割当状況: {assignedCount} / {totalRequired}枠
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1 text-center">
                    <div className="bg-white p-1.5 rounded-lg border border-slate-100">
                      <span className="text-[9px] text-slate-400 block font-bold">PT</span>
                      <span className="text-sm font-bold text-indigo-600">{p.orders.PT}枠</span>
                    </div>
                    <div className="bg-white p-1.5 rounded-lg border border-slate-100">
                      <span className="text-[9px] text-slate-400 block font-bold">OT</span>
                      <span className="text-sm font-bold text-teal-600">{p.orders.OT}枠</span>
                    </div>
                    <div className="bg-white p-1.5 rounded-lg border border-slate-100">
                      <span className="text-[9px] text-slate-400 block font-bold">ST</span>
                      <span className="text-sm font-bold text-rose-600">{p.orders.ST}枠</span>
                    </div>
                  </div>
                </div>

                {/* NG therapist listing */}
                {p.ngTherapistIds.length > 0 && (
                  <div className="mt-3 text-xs flex items-start gap-1 text-amber-600 bg-amber-50/40 p-2.5 rounded-xl border border-amber-100/50">
                    <AlertTriangle size={14} className="mt-0.5 flex-shrink-0 text-amber-500" />
                    <div>
                      <strong className="font-semibold text-amber-800">避けるべき療法士 (NG):</strong>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {p.ngTherapistIds.map(ngId => {
                          const t = therapists.find(th => th.id === ngId);
                          return (
                            <span key={ngId} className="px-1.5 py-0.5 bg-white rounded border border-amber-100 font-medium text-[10px]">
                              {t?.name || ngId}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Active schedule sessions list */}
                <div className="mt-4 pt-4 border-t border-slate-50">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-2">
                    <Calendar size={12} className="text-slate-400" />
                    本日の予定一覧
                  </span>

                  {sessions.length > 0 ? (
                    <div className="space-y-1.5">
                      {sessions.map(sess => {
                        const therapist = therapists.find(th => th.id === sess.therapistId);
                        let labelColor = "bg-indigo-50 text-indigo-700";
                        if (sess.role === 'OT') labelColor = "bg-teal-50 text-teal-700";
                        if (sess.role === 'ST') labelColor = "bg-rose-50 text-rose-700";

                        return (
                          <div key={sess.id} className="flex justify-between items-center text-[11px] p-2 bg-slate-50/50 rounded-lg border border-slate-100">
                            <span className="font-mono text-slate-500">
                              {TIME_SLOTS[sess.slot].label} ({TIME_SLOTS[sess.slot].timeRange.split(' - ')[0]})
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className={`px-1 rounded text-[9px] font-bold font-mono ${labelColor}`}>
                                {sess.role}
                              </span>
                              <span className="font-semibold text-slate-700">{therapist?.name || sess.therapistId}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">本日割り当てられた予定はありません。</span>
                  )}
                </div>
              </div>

              {/* Inline quickly edit orders */}
              <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
                <span className="text-[10px] font-semibold text-slate-400">オーダー変更:</span>
                <div className="flex items-center gap-1">
                  {/* Quick plus/minus controls */}
                  <button 
                    onClick={() => {
                      if (p.orders.PT > 0) {
                        onUpdatePatient({ ...p, orders: { ...p.orders, PT: p.orders.PT - 1 } });
                      }
                    }}
                    className="w-5 h-5 bg-indigo-50 hover:bg-indigo-100 rounded text-xs text-indigo-700 font-bold flex items-center justify-center transition-colors"
                    title="PTを1枠減らす"
                  >
                    -
                  </button>
                  <span className="text-[10px] font-bold text-indigo-600 px-0.5">PT:{p.orders.PT}</span>
                  <button 
                    onClick={() => onUpdatePatient({ ...p, orders: { ...p.orders, PT: p.orders.PT + 1 } })}
                    className="w-5 h-5 bg-indigo-50 hover:bg-indigo-100 rounded text-xs text-indigo-700 font-bold flex items-center justify-center transition-colors"
                    title="PTを1枠増やす"
                  >
                    +
                  </button>

                  <span className="text-slate-200 mx-1">|</span>

                  <button 
                    onClick={() => {
                      if (p.orders.OT > 0) {
                        onUpdatePatient({ ...p, orders: { ...p.orders, OT: p.orders.OT - 1 } });
                      }
                    }}
                    className="w-5 h-5 bg-teal-50 hover:bg-teal-100 rounded text-xs text-teal-700 font-bold flex items-center justify-center transition-colors"
                    title="OTを1枠減らす"
                  >
                    -
                  </button>
                  <span className="text-[10px] font-bold text-teal-600 px-0.5">OT:{p.orders.OT}</span>
                  <button 
                    onClick={() => onUpdatePatient({ ...p, orders: { ...p.orders, OT: p.orders.OT + 1 } })}
                    className="w-5 h-5 bg-teal-50 hover:bg-teal-100 rounded text-xs text-teal-700 font-bold flex items-center justify-center transition-colors"
                    title="OTを1枠増やす"
                  >
                    +
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-full bg-white p-12 text-center rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
            <Users size={40} className="stroke-1 mb-2 text-slate-300" />
            <span className="text-sm">該当する患者が見つかりません。</span>
          </div>
        )}
      </div>
      )}

      {/* Add Patient Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-xl border border-slate-100 w-full max-w-lg overflow-hidden"
            >
              <form onSubmit={handleAddPatientSubmit}>
                {/* Header */}
                <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PlusCircle className="text-indigo-600" size={18} />
                    <h3 className="font-bold text-slate-800">新規患者の登録</h3>
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
                  {/* Name */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">患者氏名</label>
                    <input
                      type="text"
                      required
                      placeholder="例：加藤 三郎"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>

                  {/* Daily Orders */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">本日必要なリハビリ枠数（1枠20分）</label>
                    <div className="grid grid-cols-3 gap-3 mt-1">
                      <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-150 flex flex-col items-center">
                        <span className="text-xs font-bold text-indigo-700 mb-1">理学療法 (PT)</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setNewPtOrder(Math.max(0, newPtOrder - 1))}
                            className="w-7 h-7 bg-white hover:bg-slate-100 rounded-full border border-slate-200 font-bold text-sm flex items-center justify-center shadow-sm"
                          >
                            -
                          </button>
                          <span className="text-sm font-bold text-slate-800 min-w-[12px] text-center">{newPtOrder}</span>
                          <button
                            type="button"
                            onClick={() => setNewPtOrder(newPtOrder + 1)}
                            className="w-7 h-7 bg-white hover:bg-slate-100 rounded-full border border-slate-200 font-bold text-sm flex items-center justify-center shadow-sm"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-150 flex flex-col items-center">
                        <span className="text-xs font-bold text-teal-700 mb-1">作業療法 (OT)</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setNewOtOrder(Math.max(0, newOtOrder - 1))}
                            className="w-7 h-7 bg-white hover:bg-slate-100 rounded-full border border-slate-200 font-bold text-sm flex items-center justify-center shadow-sm"
                          >
                            -
                          </button>
                          <span className="text-sm font-bold text-slate-800 min-w-[12px] text-center">{newOtOrder}</span>
                          <button
                            type="button"
                            onClick={() => setNewOtOrder(newOtOrder + 1)}
                            className="w-7 h-7 bg-white hover:bg-slate-100 rounded-full border border-slate-200 font-bold text-sm flex items-center justify-center shadow-sm"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-150 flex flex-col items-center">
                        <span className="text-xs font-bold text-rose-700 mb-1">言語聴覚 (ST)</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setNewStOrder(Math.max(0, newStOrder - 1))}
                            className="w-7 h-7 bg-white hover:bg-slate-100 rounded-full border border-slate-200 font-bold text-sm flex items-center justify-center shadow-sm"
                          >
                            -
                          </button>
                          <span className="text-sm font-bold text-slate-800 min-w-[12px] text-center">{newStOrder}</span>
                          <button
                            type="button"
                            onClick={() => setNewStOrder(newStOrder + 1)}
                            className="w-7 h-7 bg-white hover:bg-slate-100 rounded-full border border-slate-200 font-bold text-sm flex items-center justify-center shadow-sm"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* NG Therapists selection */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 block">避けるべき療法士 (NG組み合わせ)</label>
                    <div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto p-2 border border-slate-100 bg-slate-50/50 rounded-2xl">
                      {therapists.map(th => {
                        const isNg = newNgTherapistIds.includes(th.id);
                        return (
                          <label 
                            key={th.id} 
                            className={`flex items-center gap-2 p-1.5 rounded-xl border text-xs cursor-pointer transition-all select-none ${isNg ? 'bg-red-50 border-red-200 text-red-800 font-semibold' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                          >
                            <input
                              type="checkbox"
                              checked={isNg}
                              onChange={() => toggleNgTherapist(th.id)}
                              className="accent-red-500"
                            />
                            <div className="truncate">
                              {th.name} <span className="text-[10px] opacity-70 font-mono">({th.role})</span>
                            </div>
                          </label>
                        );
                      })}
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
