import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SetupScreen } from './components/SetupScreen';
import { TrackerGrid } from './components/TrackerGrid';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { GlobalTimerControls } from './components/GlobalTimerControls';
import { Question, QuestionStatus, AppConfig, DEFAULT_CONFIG } from './types';
import { Timer } from 'lucide-react';
import clsx from 'clsx';

enum AppView {
  SETUP = 'SETUP',
  TRACKER = 'TRACKER',
  ANALYTICS = 'ANALYTICS',
}

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.SETUP);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeQuestionId, setActiveQuestionId] = useState<number | null>(null);
  
  // App Configuration (Time Limits, Subject, etc.)
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);

  // Global Timer State
  const [totalAllocatedTimeMs, setTotalAllocatedTimeMs] = useState<number>(0);
  const [remainingTimeMs, setRemainingTimeMs] = useState<number>(0);
  const [isGlobalPaused, setIsGlobalPaused] = useState<boolean>(false);
  const [showGlobalTimerControls, setShowGlobalTimerControls] = useState<boolean>(false);

  // Ref to track the interval ID
  const timerIntervalRef = useRef<number | null>(null);
  // Ref to track the last tick time to ensure accurate delta additions
  const lastTickRef = useRef<number>(0);

  // Initialize questions
  const handleStartSession = (count: number, newConfig: AppConfig) => {
    setConfig(newConfig); // Apply the config selected in Setup
    
    const newQuestions: Question[] = Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      status: QuestionStatus.NOT_STARTED,
      timeSpentMs: 0,
      wasSkipped: false,
    }));
    setQuestions(newQuestions);
    
    // Initialize Global Timer using the CUSTOM ideal time
    const allocatedMs = Math.floor(count * newConfig.idealTimePerQuestionMin * 60 * 1000);
    setTotalAllocatedTimeMs(allocatedMs);
    setRemainingTimeMs(allocatedMs);
    setIsGlobalPaused(false);
    
    setView(AppView.TRACKER);
  };

  // Main Timer Loop (Handles both Question timers and Global timer)
  useEffect(() => {
    // Clear existing interval if we are pausing or leaving tracker
    if (view !== AppView.TRACKER || isGlobalPaused) {
      if (timerIntervalRef.current) {
        window.clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      return;
    }

    // Start timer logic
    if (!timerIntervalRef.current) {
      lastTickRef.current = Date.now();
      timerIntervalRef.current = window.setInterval(() => {
        const now = Date.now();
        const delta = now - lastTickRef.current;
        lastTickRef.current = now;

        // 1. Update Global Timer
        setRemainingTimeMs(prev => prev - delta);

        // 2. Update Active Question Timer (only if a question is active)
        if (activeQuestionId !== null) {
          setQuestions(prev => prev.map(q => {
            if (q.id === activeQuestionId && q.status === QuestionStatus.ACTIVE) {
              return { ...q, timeSpentMs: q.timeSpentMs + delta };
            }
            return q;
          }));
        }
      }, 100);
    }

    return () => {
      if (timerIntervalRef.current) {
        window.clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [view, isGlobalPaused, activeQuestionId]); 

  // Question Interactions
  const updateQuestionStatus = useCallback((id: number, newStatus: QuestionStatus) => {
    setQuestions(prev => prev.map(q => {
      if (q.id !== id) return q;

      const updatedQ = { ...q, status: newStatus };

      if (newStatus === QuestionStatus.ACTIVE) {
        setActiveQuestionId(id);
        lastTickRef.current = Date.now(); // Sync tick to prevent jump
      } else if (newStatus === QuestionStatus.SKIPPED) {
        updatedQ.wasSkipped = true;
        setActiveQuestionId(null);
      } else if (newStatus === QuestionStatus.COMPLETED) {
        setActiveQuestionId(null);
      }
      
      return updatedQ;
    }));
  }, []);

  const handleFinishSession = () => {
    setActiveQuestionId(null);
    setIsGlobalPaused(true); // Pause global timer when done
    setView(AppView.ANALYTICS);
  };

  const handleRestart = () => {
    setView(AppView.SETUP);
    setQuestions([]);
    setActiveQuestionId(null);
    setRemainingTimeMs(0);
    setIsGlobalPaused(false);
    // Note: We keep the 'config' (subject, etc) unless they change it in setup screen again
  };

  // Global Timer Helpers
  const formatGlobalTime = (ms: number) => {
    const isNegative = ms < 0;
    const absMs = Math.abs(ms);
    const totalSeconds = Math.floor(absMs / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${isNegative ? '-' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-slate-800 relative">
      <header className="bg-white shadow-sm border-b border-gray-200 p-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            JEE Time Tracker
          </h1>
          
          {view === AppView.TRACKER && (
             <div className="flex items-center gap-4 sm:gap-6">
               <div className="text-sm font-medium text-gray-500 hidden sm:block">
                 {config.subject && <span className="mr-3 font-bold text-blue-600 border border-blue-100 bg-blue-50 px-2 py-1 rounded text-xs">{config.subject}</span>}
                 {questions.filter(q => q.status === QuestionStatus.COMPLETED).length} / {questions.length} Done
               </div>
               
               {/* Global Timer Button */}
               <button 
                 onClick={() => setShowGlobalTimerControls(true)}
                 className={clsx(
                   "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all font-mono font-bold text-lg shadow-sm active:scale-95",
                   remainingTimeMs < 0 
                    ? "bg-red-50 border-red-200 text-red-600 animate-pulse" 
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50",
                   isGlobalPaused && "opacity-60 grayscale"
                 )}
                 title="Ideal Session Timer"
               >
                 <Timer size={18} />
                 {formatGlobalTime(remainingTimeMs)}
               </button>
             </div>
          )}
        </div>
      </header>

      {/* Global Timer Overlay */}
      <GlobalTimerControls 
        isOpen={showGlobalTimerControls}
        isPaused={isGlobalPaused}
        remainingTimeMs={remainingTimeMs}
        totalTimeMs={totalAllocatedTimeMs}
        onPause={() => setIsGlobalPaused(true)}
        onResume={() => {
          setIsGlobalPaused(false);
          lastTickRef.current = Date.now();
        }}
        onClose={() => setShowGlobalTimerControls(false)}
      />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-4 h-full">
          {view === AppView.SETUP && (
            <SetupScreen 
              onStart={handleStartSession} 
              initialConfig={config}
            />
          )}
          {view === AppView.TRACKER && (
            <TrackerGrid 
              questions={questions} 
              onUpdateStatus={updateQuestionStatus} 
              onFinish={handleFinishSession}
              activeQuestionId={activeQuestionId}
            />
          )}
          {view === AppView.ANALYTICS && (
            <AnalyticsDashboard 
              questions={questions} 
              idealTimeMs={totalAllocatedTimeMs}
              onRestart={handleRestart}
              config={config}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;