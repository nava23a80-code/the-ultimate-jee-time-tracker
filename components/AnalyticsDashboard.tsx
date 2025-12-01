import React, { useState, useRef } from 'react';
import { Question, QuestionStatus, StatusDistribution, TimeDistribution, AppConfig } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie
} from 'recharts';
import { RotateCcw, Clock, Target, Download, TrendingUp, Camera, Check, BrainCircuit, Calculator, BookOpen } from 'lucide-react';
import html2canvas from 'html2canvas';
import clsx from 'clsx';

interface AnalyticsDashboardProps {
  questions: Question[];
  idealTimeMs: number;
  onRestart: () => void;
  config: AppConfig;
}

interface ReviewState {
  isCorrect: boolean;
  isHard: boolean;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ questions, idealTimeMs, onRestart, config }) => {
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [reviewData, setReviewData] = useState<Record<number, ReviewState>>({});
  const [isFinalized, setIsFinalized] = useState(false);

  // Dynamic Constants from Config
  const RANGE_1_MS = config.range1Limit * 60 * 1000;
  const RANGE_2_LOWER_MS = config.range2Lower * 60 * 1000;
  const RANGE_2_UPPER_MS = config.range2Upper * 60 * 1000;
  const RANGE_3_MS = config.range3Limit * 60 * 1000;
  
  const LONG_QUESTION_THRESHOLD_MS = config.longQuestionThresholdMin * 60 * 1000;

  // Metrics Calculation (Standard)
  const totalQuestions = questions.length;
  const totalTimeSpentMs = questions.reduce((acc, q) => acc + q.timeSpentMs, 0);
  const timeDifferenceMs = idealTimeMs - totalTimeSpentMs;
  const isUnderBudget = timeDifferenceMs >= 0;

  // Identify Long Questions
  const longQuestions = questions.filter(q => q.timeSpentMs >= LONG_QUESTION_THRESHOLD_MS);

  // Split Logic for Analytics
  const skippedLongQuestions = longQuestions.filter(q => q.status === QuestionStatus.SKIPPED); // Category 1
  const answeredLongQuestions = longQuestions.filter(q => q.status === QuestionStatus.COMPLETED); // Category 2

  // Time Distribution Data - STRICTLY EXCLUDE INCOMPLETE (NOT_STARTED, ACTIVE, PAUSED)
  // Only include COMPLETED and SKIPPED
  const finishedQuestions = questions.filter(q => 
    q.status === QuestionStatus.COMPLETED || q.status === QuestionStatus.SKIPPED
  );
  
  const totalFinished = finishedQuestions.length;

  const underRange1 = finishedQuestions.filter(q => q.timeSpentMs < RANGE_1_MS).length;
  const range2 = finishedQuestions.filter(q => q.timeSpentMs >= RANGE_2_LOWER_MS && q.timeSpentMs <= RANGE_2_UPPER_MS).length;
  const overRange3 = finishedQuestions.filter(q => q.timeSpentMs > RANGE_3_MS).length;

  const timeData: TimeDistribution[] = [
    { label: `< ${config.range1Limit} mins`, count: underRange1, percentage: totalFinished > 0 ? (underRange1 / totalFinished) * 100 : 0, color: '#22c55e' },
    { label: `${config.range2Lower}-${config.range2Upper} mins`, count: range2, percentage: totalFinished > 0 ? (range2 / totalFinished) * 100 : 0, color: '#eab308' },
    { label: `> ${config.range3Limit} mins`, count: overRange3, percentage: totalFinished > 0 ? (overRange3 / totalFinished) * 100 : 0, color: '#ef4444' },
  ];

  const greenCount = questions.filter(q => q.status === QuestionStatus.COMPLETED && !q.wasSkipped).length;
  const orangeCount = questions.filter(q => q.status === QuestionStatus.COMPLETED && q.wasSkipped).length;
  const blueCount = questions.filter(q => q.status === QuestionStatus.SKIPPED).length;
  const grayCount = totalQuestions - (greenCount + orangeCount + blueCount);

  const statusData: StatusDistribution[] = [
    { statusLabel: 'Completed (Clean)', count: greenCount, percentage: (greenCount / totalQuestions) * 100, color: '#22c55e' },
    { statusLabel: 'Resumed & Done', count: orangeCount, percentage: (orangeCount / totalQuestions) * 100, color: '#f97316' },
    { statusLabel: 'Skipped', count: blueCount, percentage: (blueCount / totalQuestions) * 100, color: '#3b82f6' },
    { statusLabel: 'Incomplete', count: grayCount, percentage: (grayCount / totalQuestions) * 100, color: '#9ca3af' },
  ];

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(Math.abs(ms) / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}m ${s}s`;
  };

  const toggleReviewState = (id: number, field: keyof ReviewState) => {
    setReviewData(prev => ({
      ...prev,
      [id]: {
        isCorrect: prev[id]?.isCorrect || false,
        isHard: prev[id]?.isHard || false,
        [field]: !prev[id]?.[field]
      }
    }));
  };

  // --- Final Analytics Logic ---
  const calculateFinalMetrics = () => {
    const totalLongCount = longQuestions.length;
    const hardMarkedCount = longQuestions.filter(q => reviewData[q.id]?.isHard).length;
    const hardPercentage = totalLongCount > 0 ? (hardMarkedCount / totalLongCount) * 100 : 0;

    const correctAndHardCount = longQuestions.filter(q => reviewData[q.id]?.isHard && reviewData[q.id]?.isCorrect).length;
    const hardAccuracy = hardMarkedCount > 0 ? (correctAndHardCount / hardMarkedCount) * 100 : 0;

    const longSkippedCount = skippedLongQuestions.length;
    const skippedPercentage = totalQuestions > 0 ? (longSkippedCount / totalQuestions) * 100 : 0;

    const answeredLongCount = answeredLongQuestions.length;
    const correctAnsweredLongCount = answeredLongQuestions.filter(q => reviewData[q.id]?.isCorrect).length;
    const totalAccuracy = answeredLongCount > 0 ? (correctAnsweredLongCount / answeredLongCount) * 100 : 0;

    return {
      hardMarkedCount,
      totalLongCount,
      hardPercentage,
      correctAndHardCount,
      hardAccuracy,
      longSkippedCount,
      totalQuestions,
      skippedPercentage,
      correctAnsweredLongCount,
      answeredLongCount,
      totalAccuracy
    };
  };

  const metrics = calculateFinalMetrics();

  const handleExportCSV = () => {
    const now = new Date();
    const day = now.getDate().toString().padStart(2, '0');
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const year = now.getFullYear();
    const dateStr = `${day}/${month}/${year}`;

    // Section 1: Session Details
    const sessionInfoRows = [
      ['SESSION ANALYTICS REPORT'],
      ['Date', dateStr],
      ['Subject', config.subject || 'Not Selected'],
      ['Total Questions', totalQuestions.toString()],
      ['Total Time Spent', formatTime(totalTimeSpentMs)],
      ['Ideal Time Allocated', formatTime(idealTimeMs)],
      ['Efficiency', isUnderBudget ? `Under Budget by ${formatTime(Math.abs(timeDifferenceMs))}` : `Over Budget by ${formatTime(Math.abs(timeDifferenceMs))}`],
      [] // Spacer
    ];

    // Section 2: Time Distribution (Excluding Incomplete)
    const timeDistRows = [
      ['TIME DISTRIBUTION (Excluding Incomplete)'],
      ['Range', 'Count', 'Percentage'],
      ...timeData.map(d => [d.label, d.count.toString(), `${d.percentage.toFixed(2)}%`]),
      [] // Spacer
    ];

    // Section 3: Status Breakdown
    const statusRows = [
      ['STATUS BREAKDOWN'],
      ['Status', 'Count', 'Percentage'],
      ...statusData.map(d => [d.statusLabel, d.count.toString(), `${d.percentage.toFixed(2)}%`]),
      [] // Spacer
    ];

    // Section 4: Long Question Analysis
    // Note: We export the current calculated metrics even if "Finalize" button wasn't clicked visually
    const longAnalysisRows = [
      [`LONG QUESTION ANALYSIS (>= ${config.longQuestionThresholdMin} min)`],
      ['Metric', 'Count', 'Total Reference', 'Percentage'],
      ['Hard / Lengthy', metrics.hardMarkedCount.toString(), metrics.totalLongCount.toString(), `${metrics.hardPercentage.toFixed(2)}%`],
      ['Accuracy in Hard', metrics.correctAndHardCount.toString(), metrics.hardMarkedCount.toString(), `${metrics.hardAccuracy.toFixed(2)}%`],
      ['Long Skipped', metrics.longSkippedCount.toString(), metrics.totalQuestions.toString(), `${metrics.skippedPercentage.toFixed(2)}%`],
      ['Total Accuracy (Answered)', metrics.correctAnsweredLongCount.toString(), metrics.answeredLongCount.toString(), `${metrics.totalAccuracy.toFixed(2)}%`]
    ];

    const csvContent = [
      ...sessionInfoRows.map(r => r.join(',')),
      ...timeDistRows.map(r => r.join(',')),
      ...statusRows.map(r => r.join(',')),
      ...longAnalysisRows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `jee_analytics_${config.subject || 'session'}_${day}_${month}_${year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPhoto = async () => {
    if (dashboardRef.current) {
      const canvas = await html2canvas(dashboardRef.current, {
        backgroundColor: '#f9fafb',
        scale: 2
      });
      const image = canvas.toDataURL("image/png");
      const link = document.createElement('a');
      link.href = image;
      link.download = `jee_analytics_screenshot.png`;
      link.click();
    }
  };

  return (
    <div ref={dashboardRef} className="pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700 bg-gray-50 p-4">
      {/* Header Summary */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
             <h2 className="text-3xl font-bold text-gray-900">Session Analytics</h2>
             {config.subject && (
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-bold rounded-lg border border-blue-200">
                  {config.subject}
                </span>
             )}
          </div>
          <p className="text-gray-500 mt-1">Breakdown of your performance vs. Ideal targets</p>
        </div>
        <div className="flex gap-6 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
          <div className="text-right">
            <p className="text-xs text-gray-400 uppercase font-semibold">Total Time</p>
            <p className="text-xl font-mono font-bold text-gray-800">{formatTime(totalTimeSpentMs)}</p>
          </div>
          <div className="w-px bg-gray-200"></div>
          <div className="text-right">
            <p className="text-xs text-gray-400 uppercase font-semibold">Ideal Time</p>
            <p className="text-xl font-mono font-bold text-gray-500">{formatTime(idealTimeMs)}</p>
          </div>
        </div>
      </div>

      {/* Comparison Badge */}
      <div className={`mb-8 p-6 rounded-2xl border flex items-center gap-4 ${
        isUnderBudget 
        ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
        : 'bg-amber-50 border-amber-100 text-amber-800'
      }`}>
        <div className={`p-3 rounded-full ${isUnderBudget ? 'bg-emerald-100' : 'bg-amber-100'}`}>
           <TrendingUp size={24} />
        </div>
        <div>
          <h4 className="font-bold text-lg mb-1">
            {isUnderBudget ? 'Great Efficiency!' : 'Time Management Alert'}
          </h4>
          <p className="opacity-90">
            You were <span className="font-mono font-bold">{formatTime(Math.abs(timeDifferenceMs))}</span> {isUnderBudget ? 'faster' : 'slower'} than the allocated {formatTime(idealTimeMs)}.
            {isUnderBudget ? ' Keep up the good pace!' : ' Try to stick closer to the ' + config.idealTimePerQuestionMin + ' min/question average.'}
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {/* Time Distribution Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-6">
            <Clock className="text-blue-500" size={20} />
            <h3 className="font-semibold text-lg text-gray-800">Time Distribution</h3>
          </div>
          <p className="text-xs text-gray-400 mb-4 -mt-4 italic">Excluding incomplete questions</p>
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#f9fafb'}}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} 
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={50}>
                  {timeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
             {timeData.map((d) => (
               <div key={d.label} className="p-2 rounded-lg bg-gray-50">
                  <div className="font-semibold" style={{ color: d.color }}>{d.count}</div>
                  <div className="text-xs text-gray-500">{d.label}</div>
                  <div className="text-[10px] text-gray-400">{d.percentage.toFixed(0)}%</div>
               </div>
             ))}
          </div>
        </div>

        {/* Status Distribution Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-6">
            <Target className="text-indigo-500" size={20} />
            <h3 className="font-semibold text-lg text-gray-800">Status Breakdown</h3>
          </div>
          <div className="flex items-center">
            <div className="h-64 w-1/2">
                <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="count"
                    >
                    {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                    </Pie>
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white px-3 py-2 rounded-lg shadow-md border border-gray-100 text-sm">
                              <p className="font-semibold" style={{ color: data.color }}>
                                {data.statusLabel}
                              </p>
                              <p className="text-gray-600">
                                {data.percentage.toFixed(1)}%
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                </PieChart>
                </ResponsiveContainer>
            </div>
            <div className="w-1/2 space-y-3 pl-4">
                {statusData.map((d) => (
                    <div key={d.statusLabel} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></div>
                            <span className="text-sm text-gray-600 font-medium">{d.statusLabel}</span>
                        </div>
                        <div className="text-sm font-bold text-gray-800">
                            {d.count} <span className="text-xs text-gray-400 font-normal">({d.percentage.toFixed(0)}%)</span>
                        </div>
                    </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* --- LONG DURATION ANALYSIS (≥ Configured Threshold) --- */}
      <div className="bg-white rounded-3xl shadow-sm border border-red-100 overflow-hidden mb-12">
        <div className="bg-red-50 p-6 border-b border-red-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-red-900 flex items-center gap-2">
              <Clock className="text-red-600" />
              Long Duration Analysis ({longQuestions.length})
            </h3>
            <p className="text-red-700 text-sm mt-1">Review questions that took ≥ {config.longQuestionThresholdMin} minutes</p>
          </div>
          
          {longQuestions.length > 0 && !isFinalized && (
            <button 
              onClick={() => setIsFinalized(true)}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold shadow-md transition-all flex items-center gap-2"
            >
              <Calculator size={18} /> Finalize Analysis
            </button>
          )}
        </div>
        
        <div className="p-6 space-y-4">
          {longQuestions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg font-medium">Excellent! No questions exceeded {config.longQuestionThresholdMin} minutes.</p>
              <p className="text-sm">You kept a great pace throughout the session.</p>
            </div>
          ) : (
            <>
              {/* Results Panel (Only shows after finalizing) */}
              {isFinalized && (
                <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-4">
                   <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                      <h4 className="font-bold text-gray-700 mb-2 text-sm uppercase">Hard / Lengthy %</h4>
                      <p className="text-xl font-mono font-bold text-purple-600">
                        {metrics.hardMarkedCount} out of {metrics.totalLongCount}
                      </p>
                      <p className="text-sm text-gray-500 font-semibold mt-1">({metrics.hardPercentage.toFixed(2)}%)</p>
                   </div>
                   <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                      <h4 className="font-bold text-gray-700 mb-2 text-sm uppercase">Accuracy in Hard</h4>
                      <p className="text-xl font-mono font-bold text-blue-600">
                        {metrics.correctAndHardCount} out of {metrics.hardMarkedCount}
                      </p>
                      <p className="text-sm text-gray-500 font-semibold mt-1">({metrics.hardAccuracy.toFixed(2)}%)</p>
                   </div>
                   <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                      <h4 className="font-bold text-gray-700 mb-2 text-sm uppercase">Long Skipped %</h4>
                      <p className="text-xl font-mono font-bold text-orange-600">
                        {metrics.longSkippedCount} out of {metrics.totalQuestions}
                      </p>
                      <p className="text-sm text-gray-500 font-semibold mt-1">({metrics.skippedPercentage.toFixed(2)}%)</p>
                   </div>
                   <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                      <h4 className="font-bold text-gray-700 mb-2 text-sm uppercase">Total Accuracy (Ans)</h4>
                      <p className="text-xl font-mono font-bold text-green-600">
                        {metrics.correctAnsweredLongCount} out of {metrics.answeredLongCount}
                      </p>
                      <p className="text-sm text-gray-500 font-semibold mt-1">({metrics.totalAccuracy.toFixed(2)}%)</p>
                   </div>
                </div>
              )}

              {/* Review List */}
              <div className="grid grid-cols-1 gap-4">
                {longQuestions.map(q => {
                   const review = reviewData[q.id] || { isCorrect: false, isHard: false };
                   const isSkipped = q.status === QuestionStatus.SKIPPED;
                   
                   return (
                    <div key={q.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-100 gap-4">
                      <div className="flex items-center gap-4">
                        <div className={clsx(
                          "w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg",
                          isSkipped ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"
                        )}>
                          {q.id}
                        </div>
                        <div>
                          <div className="font-mono font-bold text-xl text-gray-800">
                            {formatTime(q.timeSpentMs)}
                          </div>
                          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            {isSkipped ? 'Skipped Question' : 'Answered Question'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Only show Correct button if NOT skipped (Category 2) */}
                        {!isSkipped && (
                          <button
                            onClick={() => toggleReviewState(q.id, 'isCorrect')}
                            disabled={isFinalized}
                            className={clsx(
                              "flex items-center gap-2 px-4 py-2 rounded-lg font-medium border transition-all",
                              review.isCorrect 
                                ? "bg-green-100 border-green-200 text-green-800" 
                                : "bg-white border-gray-200 text-gray-500 hover:bg-gray-100",
                              isFinalized && "opacity-60 cursor-not-allowed"
                            )}
                          >
                            <Check size={18} /> Correct
                          </button>
                        )}
                        
                        {/* Always show Hard button for long questions (Category 1 & 2) */}
                        <button
                           onClick={() => toggleReviewState(q.id, 'isHard')}
                           disabled={isFinalized}
                           className={clsx(
                            "flex items-center gap-2 px-4 py-2 rounded-lg font-medium border transition-all",
                            review.isHard 
                              ? "bg-purple-100 border-purple-200 text-purple-800" 
                              : "bg-white border-gray-200 text-gray-500 hover:bg-gray-100",
                            isFinalized && "opacity-60 cursor-not-allowed"
                          )}
                        >
                          <BrainCircuit size={18} /> Hard / Lengthy
                        </button>
                      </div>
                    </div>
                   );
                })}
              </div>
            </>
          )}
        </div>
        
        {/* Step 4: Export Buttons for this specific page */}
        <div className="bg-gray-50 p-6 border-t border-gray-100 flex flex-col sm:flex-row justify-end gap-4">
           <button
             onClick={handleExportCSV}
             className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium shadow-sm hover:shadow-md active:scale-95"
           >
             <Download size={18} /> Export CSV
           </button>
           <button
             onClick={handleExportPhoto}
             className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors font-medium shadow-sm hover:shadow-md active:scale-95"
           >
             <Camera size={18} /> Export Photo
           </button>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="flex justify-center pt-8 border-t border-gray-200">
        <button
          onClick={onRestart}
          className="flex items-center gap-2 px-8 py-3 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors font-medium shadow-lg hover:shadow-xl transform active:scale-95"
        >
          <RotateCcw size={18} /> Start New Session
        </button>
      </div>
    </div>
  );
};