import React, { useState, useEffect } from 'react';
import { ArrowRight, BookOpen, Settings, X, RefreshCw, Check } from 'lucide-react';
import { AppConfig, DEFAULT_CONFIG, Subject } from '../types';
import clsx from 'clsx';

interface SetupScreenProps {
  onStart: (count: number, config: AppConfig) => void;
  initialConfig: AppConfig;
}

export const SetupScreen: React.FC<SetupScreenProps> = ({ onStart, initialConfig }) => {
  const [count, setCount] = useState<string>('20');
  const [subject, setSubject] = useState<Subject>(initialConfig.subject);
  
  // Customization Modal State
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [tempConfig, setTempConfig] = useState<AppConfig>(initialConfig);

  // Sync temp config if initial config changes (e.g. restart)
  useEffect(() => {
    setTempConfig(initialConfig);
    setSubject(initialConfig.subject);
  }, [initialConfig]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(count, 10);
    if (num > 0 && num <= 200) {
      // Pass the current selected subject along with the configured parameters
      onStart(num, { ...tempConfig, subject });
    }
  };

  const handleResetDefaults = () => {
    setTempConfig({ ...DEFAULT_CONFIG, subject }); // Keep currently selected subject
    setIsCustomizeOpen(false);
  };

  const handleApplyChanges = () => {
    setIsCustomizeOpen(false);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] animate-in fade-in zoom-in duration-500 relative">
      
      {/* Subject Selection (Top Left of container or screen) */}
      <div className="absolute top-0 left-0 p-4 hidden md:block">
         {/* Desktop positioning */}
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 max-w-md w-full text-center relative">
        
        {/* Subject Selection */}
        <div className="mb-6">
           <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Select Subject</p>
           <div className="flex gap-2 justify-center">
              {(['Maths', 'Physics', 'Chemistry'] as Subject[]).map((subj) => (
                <button
                  key={subj}
                  type="button"
                  onClick={() => setSubject(subj)}
                  className={clsx(
                    "px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all",
                    subject === subj
                      ? "bg-blue-600 text-white border-blue-600 shadow-md transform scale-105"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                  )}
                >
                  {subj}
                </button>
              ))}
           </div>
        </div>

        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <BookOpen size={32} />
        </div>
        <h2 className="text-2xl font-bold mb-2 text-gray-800">Start New Session</h2>
        <p className="text-gray-500 mb-8">Enter the total number of questions for your JEE practice session.</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="questionCount" className="block text-sm font-medium text-gray-700 mb-2 text-left">
              Number of Questions
            </label>
            <input
              type="number"
              id="questionCount"
              min="1"
              max="200"
              value={count}
              onChange={(e) => setCount(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-lg"
              placeholder="e.g. 20"
              required
            />
          </div>
          
          <button
            type="button"
            onClick={() => setIsCustomizeOpen(true)}
            className="w-full py-2 text-sm text-gray-600 font-medium hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center gap-2 border border-dashed border-gray-300"
          >
            <Settings size={16} /> Customize Time Parameters
          </button>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 group shadow-lg shadow-blue-200"
          >
            Start Session
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </form>
      </div>

      {/* Customize Modal */}
      {isCustomizeOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
              <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center">
                 <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <Settings size={18} /> Customize Parameters
                 </h3>
                 <button onClick={() => setIsCustomizeOpen(false)} className="text-gray-400 hover:text-gray-600">
                    <X size={20} />
                 </button>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
                 
                 {/* Section A */}
                 <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                    <h4 className="font-bold text-blue-800 mb-3 text-sm uppercase">Section A — Session Analytics Time Ranges</h4>
                    <div className="space-y-3">
                       <div className="flex items-center justify-between">
                          <label className="text-sm text-gray-600">Less than X minutes</label>
                          <input 
                            type="number" step="0.1" 
                            value={tempConfig.range1Limit}
                            onChange={(e) => setTempConfig({...tempConfig, range1Limit: parseFloat(e.target.value)})}
                            className="w-20 p-1 border rounded text-center font-mono"
                          />
                       </div>
                       <div className="flex items-center justify-between">
                          <label className="text-sm text-gray-600">Between X and Y minutes</label>
                          <div className="flex items-center gap-2">
                             <input 
                                type="number" step="0.1"
                                value={tempConfig.range2Lower}
                                onChange={(e) => setTempConfig({...tempConfig, range2Lower: parseFloat(e.target.value)})}
                                className="w-16 p-1 border rounded text-center font-mono"
                             />
                             <span className="text-gray-400">-</span>
                             <input 
                                type="number" step="0.1"
                                value={tempConfig.range2Upper}
                                onChange={(e) => setTempConfig({...tempConfig, range2Upper: parseFloat(e.target.value)})}
                                className="w-16 p-1 border rounded text-center font-mono"
                             />
                          </div>
                       </div>
                       <div className="flex items-center justify-between">
                          <label className="text-sm text-gray-600">Greater than Z minutes</label>
                          <input 
                            type="number" step="0.1"
                            value={tempConfig.range3Limit}
                            onChange={(e) => setTempConfig({...tempConfig, range3Limit: parseFloat(e.target.value)})}
                            className="w-20 p-1 border rounded text-center font-mono"
                          />
                       </div>
                    </div>
                 </div>

                 {/* Section B */}
                 <div className="bg-red-50/50 p-4 rounded-xl border border-red-100">
                    <h4 className="font-bold text-red-800 mb-2 text-sm uppercase">Section B — Hard Question Threshold</h4>
                    <p className="text-xs text-red-600 mb-3">Default parameter = 3.5 minutes</p>
                    <div className="flex items-center justify-between">
                       <label className="text-sm text-gray-600">Time Limit (mins)</label>
                       <input 
                          type="number" step="0.1"
                          value={tempConfig.longQuestionThresholdMin}
                          onChange={(e) => setTempConfig({...tempConfig, longQuestionThresholdMin: parseFloat(e.target.value)})}
                          className="w-20 p-1 border rounded text-center font-mono focus:ring-red-200"
                        />
                    </div>
                 </div>

                 {/* Section C */}
                 <div className="bg-green-50/50 p-4 rounded-xl border border-green-100">
                    <h4 className="font-bold text-green-800 mb-2 text-sm uppercase">Section C — Ideal Time Per Question</h4>
                    <p className="text-xs text-green-600 mb-3">Default Ideal Time = 2.4 minutes</p>
                    <div className="flex items-center justify-between">
                       <label className="text-sm text-gray-600">Time (mins)</label>
                       <input 
                          type="number" step="0.1"
                          value={tempConfig.idealTimePerQuestionMin}
                          onChange={(e) => setTempConfig({...tempConfig, idealTimePerQuestionMin: parseFloat(e.target.value)})}
                          className="w-20 p-1 border rounded text-center font-mono focus:ring-green-200"
                        />
                    </div>
                 </div>

              </div>

              {/* Section D - Buttons */}
              <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row gap-3">
                 <button 
                   onClick={handleResetDefaults}
                   className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 text-gray-600 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
                 >
                   <RefreshCw size={18} /> Run Default Parameters
                 </button>
                 <button 
                   onClick={handleApplyChanges}
                   className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100"
                 >
                   <Check size={18} /> Save & Apply
                 </button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};