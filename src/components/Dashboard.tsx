import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Play, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon, 
  Users, 
  Calendar, 
  TrendingDown, 
  Download, 
  Upload 
} from 'lucide-react';
import { Therapist, Patient, ScheduleResult, TIME_SLOTS } from '../types';

interface DashboardProps {
  therapists: Therapist[];
  patients: Patient[];
  scheduleResult: ScheduleResult;
  isOptimizing: boolean;
  onOptimize: () => void;
  onResetData: () => void;
  onImportData: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExportData: () => void;
}

export default function Dashboard({
  therapists,
  patients,
  scheduleResult,
  isOptimizing,
  onOptimize,
  onResetData,
  onImportData,
  onExportData
}: DashboardProps) {
  const [showAllSoftViolations, setShowAllSoftViolations] = useState(false);

  // Calculate order metrics
  const totalOrders = patients.reduce(
    (sum, p) => sum + p.orders.PT + p.orders.OT + p.orders.ST, 
    0
  );
  const assignedCount = scheduleResult.entries.length;
  const fillRate = totalOrders > 0 ? (assignedCount / totalOrders) * 100 : 0;

  // Calculate Average load
  const activeTherapistCount = therapists.length;
  const avgLoad = activeTherapistCount > 0 ? assignedCount / activeTherapistCount : 0;

  // Sort stats for the chart
  const sortedStats = [...scheduleResult.therapistStats].sort((a, b) => b.assignedCount - a.assignedCount);
  const maxAssigned = sortedStats.reduce((max, s) => Math.max(max, s.assignedCount), 1) || 1;

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-6 rounded-3xl border border-slate-100 shadow-sm gap-4">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-800">リハビリ業務自動スケジューラー</h2>
          <p className="text-sm text-slate-500 mt-1">
            療法士 {therapists.length}名、患者 {patients.length}名の制約条件をクリアし、最適なスケジュールを策定します。
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Hidden file input for import */}
          <label className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-full text-xs font-semibold hover:bg-slate-50 cursor-pointer transition-colors">
            <Upload size={14} />
            インポート
            <input 
              type="file" 
              accept=".json" 
              onChange={onImportData} 
              className="hidden" 
            />
          </label>

          <button
            onClick={onExportData}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-full text-xs font-semibold hover:bg-slate-50 transition-colors"
          >
            <Download size={14} />
            エクスポート
          </button>

          <button
            onClick={onResetData}
            className="flex items-center gap-2 px-4 py-2 border border-red-100 text-red-600 bg-red-50/50 rounded-full text-xs font-semibold hover:bg-red-50 transition-colors"
            title="設定とスケジュールを初期状態にリセットします"
          >
            <RefreshCw size={14} />
            リセット
          </button>

          <button
            onClick={onOptimize}
            disabled={isOptimizing}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-full text-xs font-bold shadow-sm transition-all relative overflow-hidden"
          >
            {isOptimizing ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                自動生成中...
              </>
            ) : (
              <>
                <Play size={14} fill="currentColor" />
                自動スケジューリング
              </>
            )}
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Fill Rate Card */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-start gap-4">
          <div className="p-3 bg-emerald-50 text-indigo-600 rounded-2xl">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">オーダー充足率</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-extrabold text-slate-800">{fillRate.toFixed(1)}%</span>
              <span className="text-xs text-slate-500">({assignedCount}/{totalOrders}枠)</span>
            </div>
            {scheduleResult.unassignedOrders.length > 0 ? (
              <span className="text-xs text-red-600 font-semibold block mt-1">未割当: {scheduleResult.unassignedOrders.length}件</span>
            ) : (
              <span className="text-xs text-indigo-600 font-bold block mt-1">すべて割り当て済み</span>
            )}
          </div>
        </div>

        {/* Hard Constraint Card */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-start gap-4">
          <div className={`p-3 rounded-2xl ${scheduleResult.hardViolations.length > 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-indigo-600'}`}>
            <AlertOctagon size={24} />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">制約違反（NG予定）</span>
            <span className="text-2xl font-extrabold text-slate-800 mt-1 block">
              {scheduleResult.hardViolations.length} <span className="text-sm font-normal text-slate-500">件</span>
            </span>
            {scheduleResult.hardViolations.length > 0 ? (
              <span className="text-xs text-red-600 font-semibold block mt-1">修正が必要です</span>
            ) : (
              <span className="text-xs text-indigo-600 font-bold block mt-1">制約を100%クリア！</span>
            )}
          </div>
        </div>

        {/* Soft Constraint Card */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-start gap-4">
          <div className={`p-3 rounded-2xl ${scheduleResult.softViolations.length > 0 ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-indigo-600'}`}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">ソフト警告（努力目標）</span>
            <span className="text-2xl font-extrabold text-slate-800 mt-1 block">
              {scheduleResult.softViolations.length} <span className="text-sm font-normal text-slate-500">件</span>
            </span>
            <span className="text-xs text-slate-500 block mt-1">同一患者の連続リハビリ</span>
          </div>
        </div>

        {/* Burden leveling (Variance / Standard Deviation) */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-start gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
            <TrendingDown size={24} />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">負荷平準化（標準偏差）</span>
            <span className="text-2xl font-extrabold text-slate-800 mt-1 block">
              {scheduleResult.loadStdDev.toFixed(2)} <span className="text-sm font-normal text-slate-500">枠</span>
            </span>
            <span className="text-xs text-slate-500 block mt-1">平均: {avgLoad.toFixed(1)}枠 / 療法士</span>
          </div>
        </div>
      </div>

      {/* Load Balancing Chart & Quick List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Burden Leveling Visualization (Custom SVG Chart) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-extrabold text-slate-800 flex items-center gap-2">
                <Users className="text-indigo-600" size={18} />
                療法士の負担平準化（担当枠数）
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">療法士ごとの割り当て枠数を比較し、業務負荷が均等に分散されているかを示します。</p>
            </div>
            <div className="flex gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-indigo-500 rounded"></span>PT</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-teal-500 rounded"></span>OT</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-rose-500 rounded"></span>ST</span>
            </div>
          </div>

          {/* SVG Custom Bar Chart */}
          <div className="h-64 w-full relative mt-6 flex flex-col justify-end">
            <div className="flex h-48 items-end gap-1 px-2 relative border-b border-slate-100">
              {/* Average load threshold line */}
              {maxAssigned > 0 && (
                <div 
                  className="absolute left-0 right-0 border-t border-dashed border-red-400/80 z-10 pointer-events-none transition-all duration-300"
                  style={{ bottom: `${(avgLoad / maxAssigned) * 100}%` }}
                >
                  <span className="absolute -top-5 right-2 text-[10px] font-bold text-red-500 bg-white px-1.5 py-0.5 rounded-full shadow-sm border border-red-100">
                    平均: {avgLoad.toFixed(1)}枠
                  </span>
                </div>
              )}

              {sortedStats.map((item, idx) => {
                const pct = (item.assignedCount / maxAssigned) * 100;
                let barColor = "bg-indigo-500 hover:bg-indigo-600";
                if (item.role === 'OT') barColor = "bg-teal-500 hover:bg-teal-600";
                if (item.role === 'ST') barColor = "bg-rose-500 hover:bg-rose-600";

                return (
                  <div key={item.therapistId} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full mb-2 bg-slate-800 text-white text-xs py-1.5 px-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md z-20 flex flex-col items-center">
                      <span className="font-semibold">{item.therapistName} ({item.role})</span>
                      <span>担当: {item.assignedCount} 枠 ({(item.assignedCount * 20)}分)</span>
                      <div className="w-2 h-2 bg-slate-800 rotate-45 -mt-1"></div>
                    </div>

                    {/* Bar */}
                    <div 
                      className={`w-full rounded-t-sm transition-all duration-500 ${barColor}`}
                      style={{ height: `${pct || 4}%` }} // Min height so we can hover
                    />
                    
                    {/* Tiny initial label for mobile/tablet */}
                    <span className="text-[9px] text-slate-400 mt-1 font-mono tracking-tight hidden sm:inline truncate max-w-[40px]">
                      {item.therapistName.split(' ')[0]}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 mt-2 font-mono px-2">
              <span>高負荷 ({sortedStats[0]?.assignedCount || 0}枠)</span>
              <span>療法士 {sortedStats.length}名 (担当数順)</span>
              <span>低負荷 ({sortedStats[sortedStats.length - 1]?.assignedCount || 0}枠)</span>
            </div>
          </div>
        </div>

        {/* Progress and Solver Status */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-slate-800 flex items-center gap-2 mb-3">
              <Calendar className="text-indigo-600" size={18} />
              自動スケジュールの作成基準
            </h3>
            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-3 bg-indigo-50/50 rounded-2xl border border-indigo-50">
                <span className="font-bold text-indigo-800 block mb-0.5">時間枠の定義</span>
                1枠20分、9:00〜17:00（計24枠）でスケジュールを組んでいます。
              </div>
              <div className="p-3 bg-amber-50/50 rounded-2xl border border-amber-50">
                <span className="font-bold text-amber-800 block mb-0.5">ハード制約（厳守）</span>
                重複割当禁止、患者のNG療法士回避、オーダーの完全割当、療法士ごとの60分連続休憩。
              </div>
              <div className="p-3 bg-emerald-50/50 rounded-2xl border border-emerald-50">
                <span className="font-bold text-indigo-600 block mb-0.5">ソフト制約（努力義務）</span>
                同一患者のリハビリが重なる場合、インターバルを40分（2枠）以上空けるようにします。
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4">
            <button
              onClick={onOptimize}
              disabled={isOptimizing}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-sm font-bold transition-all shadow-sm"
            >
              <RefreshCw size={14} className={isOptimizing ? "animate-spin" : ""} />
              再最適化を試行
            </button>
          </div>
        </div>
      </div>

      {/* Constraint health details */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <h3 className="font-extrabold text-slate-800 flex items-center gap-2 mb-4">
          <AlertOctagon className="text-indigo-600" size={18} />
          スケジュール検証・エラーチェック
        </h3>

        {scheduleResult.hardViolations.length === 0 && scheduleResult.softViolations.length === 0 && (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mb-3">
              <CheckCircle2 size={36} />
            </div>
            <h4 className="font-bold text-slate-800 text-lg">すべての制約を完全に満たしています！</h4>
            <p className="text-slate-500 text-sm mt-1 max-w-md">
              ハード制約（重複なし、休憩確保など）はすべて守られており、ソフト制約（リハビリ間隔40分以上）も完璧にクリアしています。
            </p>
          </div>
        )}

        <div className="space-y-4">
          {/* Hard Violations */}
          {scheduleResult.hardViolations.length > 0 && (
            <div className="border border-red-100 rounded-xl overflow-hidden">
              <div className="bg-red-50 px-4 py-3 border-b border-red-100 flex items-center gap-2">
                <AlertOctagon className="text-red-500" size={18} />
                <h4 className="font-bold text-red-800 text-sm">
                  ハード制約違反 ({scheduleResult.hardViolations.length}件) - スケジュールが成立していません
                </h4>
              </div>
              <div className="p-4 bg-white max-h-60 overflow-y-auto space-y-2">
                {scheduleResult.hardViolations.map((v, i) => (
                  <div key={i} className="text-xs text-red-600 bg-red-50/50 p-2.5 rounded-lg flex items-start gap-2">
                    <span className="font-bold">🚨</span>
                    <span>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Unassigned orders */}
          {scheduleResult.unassignedOrders.length > 0 && (
            <div className="border border-red-100 rounded-xl overflow-hidden">
              <div className="bg-red-50/50 px-4 py-3 border-b border-red-100 flex items-center gap-2">
                <AlertOctagon className="text-red-600" size={18} />
                <h4 className="font-bold text-red-800 text-sm">
                  未割り当てのオーダー ({scheduleResult.unassignedOrders.length}人の患者)
                </h4>
              </div>
              <div className="p-4 bg-white max-h-60 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {scheduleResult.unassignedOrders.map((uo, i) => {
                  const patient = patients.find(p => p.id === uo.patientId);
                  return (
                    <div key={i} className="text-xs border border-red-100 bg-red-50/30 p-2.5 rounded-lg">
                      <span className="font-semibold text-slate-800">{patient?.name || uo.patientId}</span>
                      <div className="text-red-600 font-medium mt-1">
                        {uo.role}リハビリが <span className="font-bold">{uo.count}枠</span> 未割り当て
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Soft Violations */}
          {scheduleResult.softViolations.length > 0 && (
            <div className="border border-amber-100 rounded-xl overflow-hidden">
              <div className="bg-amber-50 px-4 py-3 border-b border-amber-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="text-amber-500" size={18} />
                  <h4 className="font-bold text-amber-800 text-sm">
                    ソフト制約警告 ({scheduleResult.softViolations.length}件) - 努力義務違反（同一患者の間隔不足）
                  </h4>
                </div>
                {scheduleResult.softViolations.length > 5 && (
                  <button 
                    onClick={() => setShowAllSoftViolations(!showAllSoftViolations)}
                    className="text-xs text-amber-700 font-semibold hover:underline"
                  >
                    {showAllSoftViolations ? "たたむ" : `残り ${scheduleResult.softViolations.length - 5}件をすべて表示`}
                  </button>
                )}
              </div>
              <div className="p-4 bg-white max-h-60 overflow-y-auto space-y-2">
                {(showAllSoftViolations ? scheduleResult.softViolations : scheduleResult.softViolations.slice(0, 5)).map((v, i) => (
                  <div key={i} className="text-xs text-amber-700 bg-amber-50/30 p-2.5 rounded-lg flex items-start gap-2">
                    <span className="font-bold text-amber-500">⚠️</span>
                    <span>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
