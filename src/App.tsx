import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  LayoutDashboard, 
  CalendarDays, 
  UsersRound, 
  UserSquare2, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Info,
  RotateCcw
} from 'lucide-react';

import { Therapist, Patient, ScheduleEntry, ScheduleResult } from './types';
import { INITIAL_THERAPISTS, INITIAL_PATIENTS } from './data/initialData';
import { validateSchedule, generateOptimalSchedule } from './utils/scheduler';

import Dashboard from './components/Dashboard';
import ScheduleGrid from './components/ScheduleGrid';
import TherapistList from './components/TherapistList';
import PatientList from './components/PatientList';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'schedule' | 'therapists' | 'patients'>('dashboard');
  
  // Roster States
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [entries, setEntries] = useState<ScheduleEntry[]>([]);
  
  // Optimization feedback states
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationProgress, setOptimizationProgress] = useState(0);

  // Initialize data from LocalStorage or defaults
  useEffect(() => {
    const storedTherapists = localStorage.getItem('reha_therapists');
    const storedPatients = localStorage.getItem('reha_patients');
    const storedEntries = localStorage.getItem('reha_entries');

    let loadedTherapists = INITIAL_THERAPISTS;
    let loadedPatients = INITIAL_PATIENTS;
    let loadedEntries: ScheduleEntry[] = [];

    if (storedTherapists) {
      try { loadedTherapists = JSON.parse(storedTherapists); } catch (e) { console.error(e); }
    }
    if (storedPatients) {
      try { loadedPatients = JSON.parse(storedPatients); } catch (e) { console.error(e); }
    }
    if (storedEntries) {
      try { loadedEntries = JSON.parse(storedEntries); } catch (e) { console.error(e); }
    }

    setTherapists(loadedTherapists);
    setPatients(loadedPatients);

    // If there is no prior schedule, auto-generate one initially to give a beautiful, complete out-of-the-box look!
    if (loadedEntries.length === 0) {
      const res = generateOptimalSchedule(loadedTherapists, loadedPatients);
      setEntries(res.entries);
      localStorage.setItem('reha_entries', JSON.stringify(res.entries));
    } else {
      setEntries(loadedEntries);
    }
  }, []);

  // Sync state with LocalStorage
  useEffect(() => {
    if (therapists.length > 0) {
      localStorage.setItem('reha_therapists', JSON.stringify(therapists));
    }
  }, [therapists]);

  useEffect(() => {
    if (patients.length > 0) {
      localStorage.setItem('reha_patients', JSON.stringify(patients));
    }
  }, [patients]);

  const handleUpdateEntries = (newEntries: ScheduleEntry[]) => {
    setEntries(newEntries);
    localStorage.setItem('reha_entries', JSON.stringify(newEntries));
  };

  // Run Constraint Solver Engine
  const handleRunOptimizer = () => {
    setIsOptimizing(true);
    setOptimizationProgress(0);
    
    // Simulate real-time progress for professional UI pacing
    let prog = 0;
    const interval = setInterval(() => {
      prog += 10;
      setOptimizationProgress(prog);
      if (prog >= 100) {
        clearInterval(interval);
        
        // Solve constraint satisfaction problem
        const result = generateOptimalSchedule(therapists, patients);
        handleUpdateEntries(result.entries);
        setIsOptimizing(false);
      }
    }, 60);
  };

  // Manual Edit Handlers
  const handleAddManualEntry = (newEntry: Omit<ScheduleEntry, 'id'>) => {
    const entryId = `${newEntry.patientId}-${newEntry.role}-${newEntry.slot}-${Date.now()}`;
    // Overwrite any existing entry for this therapist-slot to avoid direct collision right away
    const filteredEntries = entries.filter(
      e => !(e.therapistId === newEntry.therapistId && e.slot === newEntry.slot)
    );
    
    const updated = [...filteredEntries, { ...newEntry, id: entryId }];
    handleUpdateEntries(updated);
  };

  const handleRemoveManualEntry = (entryId: string) => {
    const updated = entries.filter(e => e.id !== entryId);
    handleUpdateEntries(updated);
  };

  // Therapist CRUD
  const handleAddTherapist = (newT: Omit<Therapist, 'id'>) => {
    const id = `t-${newT.role.toLowerCase()}-${Date.now()}`;
    setTherapists([...therapists, { ...newT, id }]);
  };

  const handleRemoveTherapist = (id: string) => {
    setTherapists(therapists.filter(t => t.id !== id));
    // Remove related schedule slots to maintain integrity
    handleUpdateEntries(entries.filter(e => e.therapistId !== id));
  };

  const handleUpdateTherapist = (updatedT: Therapist) => {
    setTherapists(therapists.map(t => t.id === updatedT.id ? updatedT : t));
  };

  // Patient CRUD
  const handleAddPatient = (newP: Omit<Patient, 'id'>) => {
    const id = `p-${Date.now()}`;
    setPatients([...patients, { ...newP, id }]);
  };

  const handleRemovePatient = (id: string) => {
    setPatients(patients.filter(p => p.id !== id));
    // Remove related schedule slots
    handleUpdateEntries(entries.filter(e => e.patientId !== id));
  };

  const handleUpdatePatient = (updatedP: Patient) => {
    setPatients(patients.map(p => p.id === updatedP.id ? updatedP : p));
  };

  // Import/Export Data
  const handleExportData = () => {
    const configData = {
      therapists,
      patients,
      entries
    };
    const blob = new Blob([JSON.stringify(configData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rehab_scheduler_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.therapists && parsed.patients && parsed.entries) {
          setTherapists(parsed.therapists);
          setPatients(parsed.patients);
          handleUpdateEntries(parsed.entries);
          alert('設定とスケジュールが正常にインポートされました！');
        } else {
          alert('インポート形式が不正です。必要なフィールド（therapists, patients, entries）が見つかりません。');
        }
      } catch (err) {
        alert('JSONファイルの解析に失敗しました。');
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = () => {
    if (window.confirm('すべての設定とスケジュールをサンプルの初期状態に戻しますか？（現在の編集内容は上書きされます）')) {
      setTherapists(INITIAL_THERAPISTS);
      setPatients(INITIAL_PATIENTS);
      
      const res = generateOptimalSchedule(INITIAL_THERAPISTS, INITIAL_PATIENTS);
      handleUpdateEntries(res.entries);
      
      localStorage.setItem('reha_therapists', JSON.stringify(INITIAL_THERAPISTS));
      localStorage.setItem('reha_patients', JSON.stringify(INITIAL_PATIENTS));
      localStorage.setItem('reha_entries', JSON.stringify(res.entries));
      
      setActiveTab('dashboard');
    }
  };

  // Perform full validation for current state
  const validationResult = validateSchedule(entries, therapists, patients);

  const activeTabStyle = "bg-indigo-50 border-l-4 border-indigo-600 text-indigo-700 font-bold rounded-r-xl shadow-sm";
  const inactiveTabStyle = "text-slate-600 hover:bg-slate-50 hover:text-slate-800 border-l-4 border-transparent font-medium rounded-r-xl";

  const todayString = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col md:flex-row">
      
      {/* LEFT NAVIGATION DRAWER / SIDEBAR */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-100 flex-shrink-0 flex flex-col justify-between shadow-sm z-30">
        <div>
          {/* Logo / Title Block */}
          <div className="p-6 border-b border-slate-100 flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-100">
              <Sparkles size={18} />
            </div>
            <div>
              <h1 className="text-sm font-extrabold tracking-tight text-slate-800">リハサポ <span className="text-slate-400 font-light">| Planner</span></h1>
              <span className="text-[10px] text-slate-400 font-mono tracking-wider font-bold block uppercase">Optimization Engine</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-xs transition-all ${activeTab === 'dashboard' ? activeTabStyle : inactiveTabStyle}`}
            >
              <LayoutDashboard size={16} />
              <span>ダッシュボード</span>
            </button>

            <button
              onClick={() => setActiveTab('schedule')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-xs transition-all ${activeTab === 'schedule' ? activeTabStyle : inactiveTabStyle}`}
            >
              <CalendarDays size={16} />
              <span>予定管理ボード</span>
            </button>

            <button
              onClick={() => setActiveTab('therapists')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-xs transition-all ${activeTab === 'therapists' ? activeTabStyle : inactiveTabStyle}`}
            >
              <UsersRound size={16} />
              <span>療法士設定 ({therapists.length}名)</span>
            </button>

            <button
              onClick={() => setActiveTab('patients')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-xs transition-all ${activeTab === 'patients' ? activeTabStyle : inactiveTabStyle}`}
            >
              <UserSquare2 size={16} />
              <span>患者オーダー ({patients.length}名)</span>
            </button>
          </nav>
        </div>

        {/* Footer info box with live check */}
        <div className="p-4 border-t border-slate-100">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
            <div className="flex items-center gap-2 mb-2">
              {validationResult.hardViolations.length > 0 ? (
                <div className="w-5 h-5 bg-red-50 rounded-full flex items-center justify-center text-red-600">
                  <AlertTriangle size={12} />
                </div>
              ) : (
                <div className="w-5 h-5 bg-emerald-50 rounded-full flex items-center justify-center text-indigo-600">
                  <CheckCircle2 size={12} />
                </div>
              )}
              <span className="font-bold text-slate-700">リアルタイム制約検証</span>
            </div>
            
            <p className="text-[11px] text-slate-500 leading-relaxed">
              {validationResult.hardViolations.length > 0 
                ? `現在、重篤な制約違反が ${validationResult.hardViolations.length}件 検出されています。自動生成を行うか、手動で調整してください。` 
                : 'すべてのハード制約（重複なし、休憩時間、NG療法士）を完全に満たしています。'}
            </p>
          </div>
        </div>
      </aside>

      {/* MAIN LAYOUT CANVAS */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* Header bar */}
        <header className="bg-white border-b border-slate-100 h-16 px-6 flex items-center justify-between sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-slate-800">
              {activeTab === 'dashboard' && 'ダッシュボード'}
              {activeTab === 'schedule' && 'リハビリスケジュール表'}
              {activeTab === 'therapists' && '療法士（PT / OT / ST）マスタ設定'}
              {activeTab === 'patients' && '患者・本日オーダー登録管理'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Dynamic Japanese Date stamp from Design HTML */}
            <div className="text-xs text-indigo-600 font-semibold px-3 py-1 bg-indigo-50 rounded-full">
              {todayString}
            </div>

            {/* Admin status avatar badge from Design HTML */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-rose-500 border-2 border-white shadow-sm flex items-center justify-center text-xs text-rose-700 font-bold select-none">
                管
              </div>
              <span className="text-xs font-semibold text-slate-600 hidden md:inline">管理者モード</span>
            </div>

            <div className="h-4 w-px bg-slate-100 hidden sm:block"></div>
            
            {/* Quick trigger optimization button */}
            {activeTab !== 'dashboard' && (
              <button
                onClick={handleRunOptimizer}
                disabled={isOptimizing}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg text-xs font-semibold shadow transition-all"
              >
                <Sparkles size={13} />
                {isOptimizing ? '最適化中...' : '自動スケジューリング'}
              </button>
            )}
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-y-auto max-w-7xl w-full mx-auto">
          
          {/* Real-time Optimizer loading overlay */}
          {isOptimizing && (
            <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
              <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 w-full max-w-sm text-center space-y-4">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto animate-pulse">
                  <Sparkles size={32} className="animate-spin" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base">スケジュール自動生成中</h3>
                  <p className="text-xs text-slate-500 mt-1">制約を満たしつつ担当枠の平準化を最大化する計算を行っています...</p>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-600 h-full transition-all duration-300 rounded-full"
                    style={{ width: `${optimizationProgress}%` }}
                  />
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  Progress: {optimizationProgress}%
                </div>
              </div>
            </div>
          )}

          {/* Active View Routing */}
          <div className="space-y-6">
            {activeTab === 'dashboard' && (
              <Dashboard
                therapists={therapists}
                patients={patients}
                scheduleResult={validationResult}
                isOptimizing={isOptimizing}
                onOptimize={handleRunOptimizer}
                onResetData={handleResetData}
                onImportData={handleImportData}
                onExportData={handleExportData}
              />
            )}

            {activeTab === 'schedule' && (
              <ScheduleGrid
                therapists={therapists}
                patients={patients}
                entries={entries}
                onAddEntry={handleAddManualEntry}
                onRemoveEntry={handleRemoveManualEntry}
              />
            )}

            {activeTab === 'therapists' && (
              <TherapistList
                therapists={therapists}
                onAddTherapist={handleAddTherapist}
                onRemoveTherapist={handleRemoveTherapist}
                onUpdateTherapist={handleUpdateTherapist}
              />
            )}

            {activeTab === 'patients' && (
              <PatientList
                patients={patients}
                therapists={therapists}
                entries={entries}
                onAddPatient={handleAddPatient}
                onRemovePatient={handleRemovePatient}
                onUpdatePatient={handleUpdatePatient}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
