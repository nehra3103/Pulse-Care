import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Activity, AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';

const API_URL = (import.meta.env.VITE_API_URL || 'https://pulse-care-backend-pz3p.onrender.com').replace(/\/$/, '');

export default function BookingModal({ doctor, patient, onClose, onBookingSuccess }) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDateStr = tomorrow.toISOString().split('T')[0];

  const [selectedDate, setSelectedDate] = useState(defaultDateStr);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [isLeave, setIsLeave] = useState(false);
  const [leaveReason, setLeaveReason] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [onsetDate, setOnsetDate] = useState(defaultDateStr);
  const [severity, setSeverity] = useState(5);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!doctor || !selectedDate) return;
    fetchSlots();
  }, [doctor, selectedDate]);

  const fetchSlots = async () => {
    setLoadingSlots(true);
    setErrorMsg('');
    try {
      const res = await fetch(`${API_URL}/api/doctors/${doctor.id}/available-slots?date=${selectedDate}`);
      const data = await res.json();
      if (res.ok) {
        setIsLeave(data.isLeave);
        setLeaveReason(data.leaveReason || '');
        setAvailableSlots(data.slots || []);
        setSelectedTimeSlot('');
      } else {
        setErrorMsg(data.error || 'Failed to load time slots');
      }
    } catch (err) {
      setErrorMsg(`Network error fetching slots from ${API_URL}`);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTimeSlot) {
      setErrorMsg('Please select an available time slot.');
      return;
    }
    if (!symptoms.trim()) {
      setErrorMsg('Please describe your symptoms for doctor triage.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch(`${API_URL}/api/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patient.id,
          doctor_id: doctor.id,
          appointment_date: selectedDate,
          time_slot: selectedTimeSlot,
          symptoms,
          onset_date: onsetDate,
          severity
        })
      });

      const data = await res.json();

      if (res.status === 409) {
        setErrorMsg(data.message || 'This slot was just booked by another patient. Please select another slot.');
        fetchSlots();
        setSubmitting(false);
        return;
      }

      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to book appointment');
      }

      onBookingSuccess(data.appointment);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-xl rounded-2xl border border-slate-200 shadow-xl p-6 my-8 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-lg bg-slate-100 transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center space-x-3.5 border-b border-slate-100 pb-4">
          <img src={doctor.avatar} alt={doctor.name} className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 object-cover" />
          <div>
            <h2 className="text-lg font-bold text-slate-900">Book Appointment</h2>
            <p className="text-xs text-slate-500">Consultation with <strong className="text-slate-800">{doctor.name}</strong> ({doctor.specialization})</p>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-100 flex items-start space-x-2 text-red-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
            <div>
              <p className="font-semibold">Booking Alert</p>
              <p>{errorMsg}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-800 flex items-center space-x-1.5">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>1. Select Date & Time Slot</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Appointment Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">Doctor Hours</label>
                <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-600 flex items-center justify-between">
                  <span>{doctor.working_hours_start} - {doctor.working_hours_end}</span>
                  <span className="font-medium text-slate-800">{doctor.slot_duration_mins} mins</span>
                </div>
              </div>
            </div>

            {loadingSlots ? (
              <div className="py-4 text-center text-xs text-slate-500 flex items-center justify-center space-x-2">
                <Clock className="w-4 h-4 animate-spin text-blue-600" />
                <span>Checking available slots...</span>
              </div>
            ) : isLeave ? (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Doctor is on leave on {selectedDate} ({leaveReason}). Please choose another date.</span>
              </div>
            ) : (
              <div>
                <span className="block text-xs text-slate-500 mb-1.5">Available Slots for {selectedDate}:</span>
                {availableSlots.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No available slots for this date.</p>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-36 overflow-y-auto p-1">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot.time}
                        type="button"
                        disabled={!slot.available}
                        onClick={() => setSelectedTimeSlot(slot.time)}
                        className={`py-1.5 px-2.5 rounded-md text-xs font-medium border transition ${
                          !slot.available
                            ? 'bg-slate-100 text-slate-400 border-slate-200 line-through cursor-not-allowed'
                            : selectedTimeSlot === slot.time
                            ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                        }`}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-3 pt-3 border-t border-slate-100">
            <label className="text-xs font-semibold text-slate-800 flex items-center space-x-1.5">
              <Activity className="w-4 h-4 text-blue-600" />
              <span>2. Pre-Visit Symptom Form</span>
            </label>

            <div>
              <label className="block text-xs text-slate-600 mb-1">
                Describe symptoms in detail <span className="text-red-500">*</span>
              </label>
              <textarea
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="Describe your current discomfort, symptoms, and medical history..."
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Symptom Onset Date</label>
                <input
                  type="date"
                  value={onsetDate}
                  onChange={(e) => setOnsetDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs text-slate-500">Perceived Severity (1-10)</label>
                  <span className="text-xs font-semibold text-slate-800">{severity} / 10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={severity}
                  onChange={(e) => setSeverity(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting || !selectedTimeSlot || isLeave}
              className="px-5 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs disabled:opacity-50 flex items-center space-x-1.5 transition"
            >
              {submitting ? (
                <>
                  <Clock className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Confirm Appointment</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
