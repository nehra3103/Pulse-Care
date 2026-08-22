import React, { useState } from 'react';
import { X, AlertTriangle, Send, CheckCircle2, Clock } from 'lucide-react';

export default function DoctorLeaveModal({ doctor, onClose, onSuccess }) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDateStr = tomorrow.toISOString().split('T')[0];

  const [leaveDate, setLeaveDate] = useState(defaultDateStr);
  const [reason, setReason] = useState('Medical conference attendance');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!leaveDate) {
      setErrorMsg('Please select a leave date.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch(`/api/doctors/${doctor.id}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leave_date: leaveDate, reason })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to mark leave');
      }

      setResult(data);
      if (onSuccess) onSuccess();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-xl p-6 relative">
        
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-lg bg-slate-100 transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center space-x-3 border-b border-slate-100 pb-3.5">
          <div className="p-2 rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Mark Doctor Leave Date</h3>
            <p className="text-xs text-slate-500">Doctor: <strong className="text-slate-800">{doctor.name}</strong></p>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-xs">
            {errorMsg}
          </div>
        )}

        {result ? (
          <div className="mt-5 space-y-3 text-center py-2">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Leave Saved & Processed</h4>
            <p className="text-xs text-slate-600">{result.message}</p>
            
            {result.affectedAppointmentsCount > 0 ? (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-left text-xs space-y-1.5">
                <p className="font-semibold text-amber-800 flex items-center space-x-1">
                  <Send className="w-3.5 h-3.5" />
                  <span>{result.affectedAppointmentsCount} Patient(s) Notified & Cancelled:</span>
                </p>
                <ul className="list-disc list-inside text-amber-900 text-[11px] space-y-0.5">
                  {result.affectedPatients.map((p, idx) => (
                    <li key={idx}>{p}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No existing patient bookings were affected on this date.</p>
            )}

            <button
              onClick={onClose}
              className="w-full mt-3 bg-slate-900 hover:bg-slate-800 text-white font-medium py-2 rounded-lg text-xs transition"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label className="block text-xs text-slate-600 mb-1 font-medium">Leave Date</label>
              <input
                type="date"
                value={leaveDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setLeaveDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs text-slate-600 mb-1 font-medium">Leave Reason</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason for leave"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-600"
                required
              />
            </div>

            <div className="p-3 rounded-lg bg-amber-50 border border-amber-100 text-xs text-amber-800 flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Existing bookings for Dr. {doctor.name} on this date will be automatically cancelled and affected patients will receive instant email alerts with rebooking options.
              </span>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white flex items-center space-x-1.5 transition"
              >
                {submitting ? (
                  <>
                    <Clock className="w-3.5 h-3.5 animate-spin" />
                    <span>Notifying...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Confirm Leave & Notify</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
