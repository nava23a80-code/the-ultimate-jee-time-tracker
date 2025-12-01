import React, { useState } from 'react';
import { Question, QuestionStatus } from '../types';
import { ControlOverlay } from './ControlOverlay';
import { CheckCircle2, Play, Pause, FastForward, Timer } from 'lucide-react';
import clsx from 'clsx';

interface TrackerGridProps {
  questions: Question[];
  onUpdateStatus: (id: number, status: QuestionStatus) => void;
  onFinish: () => void;
  activeQuestionId: number | null;
}

export const TrackerGrid: React.FC<TrackerGridProps> = ({ 
  questions, 
  onUpdateStatus, 
  onFinish,
  activeQuestionId 
}) => {
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null);

  const selectedQuestion = questions.find(q => q.id === selectedQuestionId);

  // Helper to format time for the sticky footer
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (q: Question) => {
    switch (q.status) {
      case QuestionStatus.COMPLETED:
        return q.wasSkipped 
          ? 'bg-orange-500 text-white border-orange-600' // Resumed & Completed
          : 'bg-green-500 text-white border-green-600'; // Normal Completed
      case QuestionStatus.SKIPPED:
        return 'bg-blue-500 text-white border-blue-600';
      case QuestionStatus.ACTIVE:
        return 'bg-gray-200 text-gray-900 border-blue-500 ring-2 ring-blue-300';
      case QuestionStatus.PAUSED:
        return 'bg-gray-200 text-gray-900 border-yellow-500 ring-2 ring-yellow-200';
      default:
        return 'bg-gray-200 text-gray-500 border-transparent hover:bg-gray-300';
    }
  };

  return (
    <div className="pb-24">
      {/* Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
        {questions.map((q) => (
          <button
            key={q.id}
            onClick={() => setSelectedQuestionId(q.id)}
            className={clsx(
              "aspect-square rounded-xl shadow-sm border-2 flex flex-col items-center justify-center transition-all duration-200 relative overflow-hidden",
              getStatusColor(q),
              "hover:scale-105 active:scale-95"
            )}
          >
            <span className="text-2xl font-bold">{q.id}</span>
            {/* Mini status indicator icons */}
            {q.status === QuestionStatus.ACTIVE && <Play size={16} className="mt-1 animate-pulse text-blue-600" fill="currentColor" />}
            {q.status === QuestionStatus.PAUSED && <Pause size={16} className="mt-1 text-yellow-600" fill="currentColor" />}
            {q.status === QuestionStatus.COMPLETED && <CheckCircle2 size={16} className="mt-1 opacity-80" />}
            {q.status === QuestionStatus.SKIPPED && <FastForward size={16} className="mt-1 opacity-80" />}
            
            {/* Show time if some progress made, for quick glance */}
            {q.timeSpentMs > 0 && q.status !== QuestionStatus.COMPLETED && q.status !== QuestionStatus.SKIPPED && (
               <span className="absolute bottom-1 text-[10px] font-mono opacity-60">
                 {formatTime(q.timeSpentMs)}
               </span>
            )}
          </button>
        ))}
      </div>

      {/* Control Overlay */}
      {selectedQuestion && (
        <ControlOverlay
          question={selectedQuestion}
          onClose={() => setSelectedQuestionId(null)}
          onUpdateStatus={onUpdateStatus}
          isActive={activeQuestionId === selectedQuestion.id}
        />
      )}

      {/* Done Button Area */}
      <div className="mt-12 flex justify-center">
        <button
          onClick={onFinish}
          className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 px-12 rounded-full shadow-lg transition-all transform hover:-translate-y-1 flex items-center gap-2"
        >
          <CheckCircle2 size={24} />
          Done & View Analytics
        </button>
      </div>

      {/* Sticky Bottom Bar for Active Timer */}
      {activeQuestionId && !selectedQuestion && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] p-4 z-40 animate-slide-up">
           <div className="max-w-5xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                 <span className="font-medium text-gray-700">Question {activeQuestionId} is running...</span>
              </div>
              <div className="font-mono text-2xl font-bold text-blue-600 flex items-center gap-2">
                 <Timer size={24} />
                 {formatTime(questions.find(q => q.id === activeQuestionId)?.timeSpentMs || 0)}
              </div>
              <button 
                onClick={() => setSelectedQuestionId(activeQuestionId)}
                className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg font-medium text-sm hover:bg-blue-200 transition-colors"
              >
                Open Controls
              </button>
           </div>
        </div>
      )}
    </div>
  );
};
