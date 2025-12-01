import React, { useEffect, useState } from 'react';
import { Question, QuestionStatus } from '../types';
import { Play, Pause, Square, FastForward, X, RotateCw } from 'lucide-react';
import clsx from 'clsx';

interface ControlOverlayProps {
  question: Question;
  isActive: boolean;
  onClose: () => void;
  onUpdateStatus: (id: number, status: QuestionStatus) => void;
}

export const ControlOverlay: React.FC<ControlOverlayProps> = ({
  question,
  isActive,
  onClose,
  onUpdateStatus,
}) => {
  // Local time state for smoother UI updates inside overlay (synced with prop)
  const [displayTime, setDisplayTime] = useState(question.timeSpentMs);

  useEffect(() => {
    setDisplayTime(question.timeSpentMs);
  }, [question.timeSpentMs]);

  const formatTimeBig = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const actions = {
    start: () => onUpdateStatus(question.id, QuestionStatus.ACTIVE),
    pause: () => onUpdateStatus(question.id, QuestionStatus.PAUSED),
    resume: () => onUpdateStatus(question.id, QuestionStatus.ACTIVE),
    stop: () => {
      onUpdateStatus(question.id, QuestionStatus.COMPLETED);
      onClose();
    },
    skip: () => {
      onUpdateStatus(question.id, QuestionStatus.SKIPPED);
      onClose();
    }
  };

  // Determine available buttons based on state
  const renderButtons = () => {
    const { status, wasSkipped } = question;

    if (status === QuestionStatus.COMPLETED) {
        return (
            <div className="text-center">
                <p className="text-green-600 font-semibold mb-4">Question Completed!</p>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 mb-4">
                  <span className="text-sm text-gray-500">Final Time</span>
                  <div className="text-3xl font-mono font-bold text-gray-800">{formatTimeBig(displayTime)}</div>
                </div>
                <button onClick={onClose} className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors">
                    Close
                </button>
            </div>
        )
    }

    return (
      <div className="grid grid-cols-1 gap-3 w-full">
        {/* Primary Action Button */}
        {status === QuestionStatus.NOT_STARTED && (
          <button 
            onClick={actions.start}
            className="flex items-center justify-center gap-2 w-full py-4 bg-blue-600 text-white rounded-xl text-lg font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
          >
            <Play fill="currentColor" /> Start Timer
          </button>
        )}

        {(status === QuestionStatus.ACTIVE) && (
          <button 
            onClick={actions.pause}
            className="flex items-center justify-center gap-2 w-full py-4 bg-yellow-500 text-white rounded-xl text-lg font-bold hover:bg-yellow-600 transition-colors shadow-lg shadow-yellow-200"
          >
            <Pause fill="currentColor" /> Pause
          </button>
        )}

        {(status === QuestionStatus.PAUSED) && (
          <button 
            onClick={actions.resume}
            className="flex items-center justify-center gap-2 w-full py-4 bg-blue-600 text-white rounded-xl text-lg font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
          >
            <Play fill="currentColor" /> Resume Pause
          </button>
        )}

        {(status === QuestionStatus.SKIPPED) && (
            <button 
            onClick={actions.resume}
            className="flex items-center justify-center gap-2 w-full py-4 bg-orange-500 text-white rounded-xl text-lg font-bold hover:bg-orange-600 transition-colors shadow-lg shadow-orange-200"
            >
            <RotateCw /> Resume Skip
            </button>
        )}

        {/* Secondary Actions */}
        {(status !== QuestionStatus.NOT_STARTED && status !== QuestionStatus.SKIPPED) && (
           <div className="grid grid-cols-2 gap-3 mt-2">
              <button 
                onClick={actions.stop}
                className="flex flex-col items-center justify-center gap-1 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors"
              >
                <Square size={20} fill="currentColor" /> Stop & Complete
              </button>
              
              <button 
                onClick={actions.skip}
                className="flex flex-col items-center justify-center gap-1 py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors"
              >
                <FastForward size={20} fill="currentColor" /> Skip Question
              </button>
           </div>
        )}

        {status === QuestionStatus.SKIPPED && (
             <button 
                onClick={actions.stop}
                className="flex flex-col items-center justify-center gap-1 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors mt-2"
              >
                <Square size={20} fill="currentColor" /> Stop & Complete
            </button>
        )}
      </div>
    );
  };

  return (
    <div 
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 relative">
        {/* Header */}
        <div className="bg-gray-50 p-6 border-b border-gray-100 flex justify-between items-center">
            <div>
                <h3 className="text-2xl font-bold text-gray-800">Question {question.id}</h3>
                <p className="text-sm text-gray-500 font-medium tracking-wide uppercase mt-1">
                    {question.status.replace('_', ' ')}
                </p>
            </div>
            <button onClick={onClose} className="p-2 bg-white rounded-full text-gray-400 hover:text-gray-600 shadow-sm border hover:bg-gray-50 transition-all">
                <X size={20} />
            </button>
        </div>

        {/* Timer Display */}
        <div className="p-8 flex flex-col items-center justify-center bg-white">
            <div className={clsx(
                "text-6xl font-mono font-bold tracking-tighter transition-colors duration-300 tabular-nums",
                question.status === QuestionStatus.ACTIVE ? "text-blue-600" : "text-gray-700"
            )}>
                {formatTimeBig(displayTime)}
            </div>
            <p className="text-xs text-gray-400 mt-2 font-medium tracking-widest uppercase">Time Elapsed</p>
        </div>

        {/* Controls */}
        <div className="p-6 bg-gray-50 border-t border-gray-100">
            {renderButtons()}
        </div>
      </div>
    </div>
  );
};
