import React from 'react';
import { Play, Pause, X, Timer } from 'lucide-react';
import clsx from 'clsx';

interface GlobalTimerControlsProps {
  isOpen: boolean;
  isPaused: boolean;
  remainingTimeMs: number;
  totalTimeMs: number;
  onPause: () => void;
  onResume: () => void;
  onClose: () => void;
}

export const GlobalTimerControls: React.FC<GlobalTimerControlsProps> = ({
  isOpen,
  isPaused,
  remainingTimeMs,
  totalTimeMs,
  onPause,
  onResume,
  onClose,
}) => {
  if (!isOpen) return null;

  const formatTime = (ms: number) => {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progress = Math.max(0, Math.min(100, (remainingTimeMs / totalTimeMs) * 100));
  const isOvertime = remainingTimeMs < 0;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[60] flex items-start justify-end p-4">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose} />
      
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-80 relative mt-16 animate-in slide-in-from-top-4 duration-200 overflow-hidden z-10">
        <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <Timer size={18} className="text-blue-600" />
            Session Timer
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 bg-white border border-gray-200 rounded-full p-1">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 text-center">
          <div className={clsx(
            "text-4xl font-mono font-bold mb-2 tabular-nums",
            isOvertime ? "text-red-500" : "text-gray-800"
          )}>
             {isOvertime ? '-' : ''}{formatTime(Math.abs(remainingTimeMs))}
          </div>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-6">
            {isOvertime ? 'Overtime' : 'Remaining Ideal Time'}
          </p>

          {/* Progress Bar */}
          {!isOvertime && (
            <div className="w-full h-2 bg-gray-100 rounded-full mb-6 overflow-hidden">
              <div 
                className={clsx("h-full transition-all duration-1000", progress < 20 ? "bg-red-500" : "bg-blue-500")}
                style={{ width: `${progress}%` }} 
              />
            </div>
          )}

          <div className="flex gap-3">
            {!isPaused ? (
              <button 
                onClick={onPause}
                className="flex-1 flex items-center justify-center gap-2 bg-yellow-50 text-yellow-700 py-3 rounded-xl font-semibold hover:bg-yellow-100 transition-colors border border-yellow-200"
              >
                <Pause size={18} fill="currentColor" /> Pause
              </button>
            ) : (
              <button 
                onClick={onResume}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
              >
                <Play size={18} fill="currentColor" /> Resume
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};