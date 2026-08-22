import React, { useState } from 'react';
import { Sparkles, CheckSquare, Square, FileText, Activity } from 'lucide-react';

export default function PreVisitSummaryCard({ appointment }) {
  const [checkedQuestions, setCheckedQuestions] = useState({});

  const toggleQuestion = (idx) => {
    setCheckedQuestions(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const urgency = appointment.urgency_level || 'Medium';

  const getUrgencyStyles = (u) => {
    switch (u) {
      case 'High':
        return {
          badge: 'bg-red-50 text-red-700 border-red-200',
          title: 'High Priority'
        };
      case 'Medium':
        return {
          badge: 'bg-amber-50 text-amber-700 border-amber-200',
          title: 'Moderate Priority'
        };
      default:
        return {
          badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          title: 'Standard Priority'
        };
    }
  };

  const styles = getUrgencyStyles(urgency);
  const questions = Array.isArray(appointment.suggested_questions)
    ? appointment.suggested_questions
    : (typeof appointment.suggested_questions === 'string' ? JSON.parse(appointment.suggested_questions || '[]') : []);

  return (
    <div className="bg-white rounded-xl p-4 border border-slate-200/80 space-y-3.5">
      
      {/* Header with AI Badge & Urgency Chip */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div className="flex items-center space-x-2">
          <div className="p-1 rounded bg-blue-50 text-blue-600">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-900">AI Pre-Visit Triage Summary</h4>
            <p className="text-[10px] text-slate-500">Doctor Consultation Brief</p>
          </div>
        </div>

        {/* Urgency Badge */}
        <div className={`px-2.5 py-0.5 rounded-full border text-xs font-semibold ${styles.badge}`}>
          Urgency: {urgency}
        </div>
      </div>

      {/* Chief Complaint */}
      <div className="space-y-1">
        <div className="flex items-center space-x-1 text-xs text-slate-500 font-medium">
          <FileText className="w-3.5 h-3.5 text-slate-400" />
          <span>Chief Complaint</span>
        </div>
        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs text-slate-800 font-medium">
          {appointment.chief_complaint || appointment.symptoms}
        </div>
      </div>

      {/* Symptoms & Severity */}
      <div className="flex items-center justify-between text-[11px] text-slate-600 bg-slate-50/80 px-2.5 py-1.5 rounded-lg border border-slate-100">
        <span className="truncate max-w-[70%]">
          <strong className="text-slate-800">Symptoms:</strong> {appointment.symptoms}
        </span>
        <span className="flex items-center space-x-1 font-medium text-slate-700">
          <Activity className="w-3 h-3 text-slate-400" />
          <span>Severity: <strong>{appointment.severity || 5}/10</strong></span>
        </span>
      </div>

      {/* Suggested Questions for Doctor */}
      {questions.length > 0 && (
        <div className="space-y-1.5 pt-2 border-t border-slate-100">
          <h5 className="text-xs font-semibold text-slate-700 flex items-center justify-between">
            <span>Suggested Questions for Consultation</span>
            <span className="text-[10px] font-normal text-slate-400">3 Prompts</span>
          </h5>

          <div className="space-y-1">
            {questions.map((q, idx) => {
              const isChecked = checkedQuestions[idx];
              return (
                <div
                  key={idx}
                  onClick={() => toggleQuestion(idx)}
                  className={`flex items-start space-x-2 p-2 rounded-lg border transition cursor-pointer text-xs ${
                    isChecked
                      ? 'bg-slate-50 border-slate-200 text-slate-400 line-through'
                      : 'bg-white border-slate-100 hover:border-slate-200 text-slate-700'
                  }`}
                >
                  <button type="button" className="mt-0.5 text-slate-400 shrink-0">
                    {isChecked ? <CheckSquare className="w-3.5 h-3.5 text-blue-600" /> : <Square className="w-3.5 h-3.5 text-slate-400" />}
                  </button>
                  <span className="leading-snug">{q}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
