import React, { useState } from 'react';
import DoctorLeaveModal from '../components/DoctorLeaveModal.jsx';
import { Plus, Calendar, Clock, UserCheck, AlertTriangle } from 'lucide-react';

export default function AdminPortal({ doctors, appointments, onRefresh }) {
  const [showAddDoctor, setShowAddDoctor] = useState(false);
  const [selectedDoctorForLeave, setSelectedDoctorForLeave] = useState(null);

  // New Doctor Form State
  const [newDoctor, setNewDoctor] = useState({
    name: '',
    email: '',
    specialization: 'Cardiology',
    bio: '',
    experience_years: 5,
    consultation_fee: 700,
    working_hours_start: '09:00',
    working_hours_end: '17:00',
    slot_duration_mins: 30
  });

  const [submittingDoctor, setSubmittingDoctor] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleCreateDoctor = async (e) => {
    e.preventDefault();
    if (!newDoctor.name || !newDoctor.email) {
      setErrorMsg('Name and email are required');
      return;
    }

    setSubmittingDoctor(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/doctors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDoctor)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create doctor profile');
      }

      setShowAddDoctor(false);
      setNewDoctor({
        name: '',
        email: '',
        specialization: 'Cardiology',
        bio: '',
        experience_years: 5,
        consultation_fee: 700,
        working_hours_start: '09:00',
        working_hours_end: '17:00',
        slot_duration_mins: 30
      });
      onRefresh();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmittingDoctor(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Admin Hero */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-100 px-2.5 py-0.5 rounded-md">
              Admin Portal
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Clinic Doctor Profiles & Leave Management
          </h1>
          <p className="text-xs text-slate-600 max-w-lg">
            Manage doctor profiles, working hours, and assign leave dates with automatic patient impact notification dispatch.
          </p>
        </div>

        <button
          onClick={() => setShowAddDoctor(true)}
          className="px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs shadow-xs flex items-center justify-center space-x-1.5 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Doctor Profile</span>
        </button>
      </div>

      {/* Add Doctor Modal Form */}
      {showAddDoctor && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
              <UserCheck className="w-4 h-4 text-blue-600" />
              <span>Create New Doctor Profile</span>
            </h3>
            <button onClick={() => setShowAddDoctor(false)} className="text-xs text-slate-500 hover:text-slate-900">
              Cancel
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-xs">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleCreateDoctor} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-slate-600 mb-1">Doctor Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Meera Deshmukh"
                  value={newDoctor.name}
                  onChange={(e) => setNewDoctor({ ...newDoctor, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-slate-600 mb-1">Doctor Email *</label>
                <input
                  type="email"
                  placeholder="dr.meera@healthclinic.in"
                  value={newDoctor.email}
                  onChange={(e) => setNewDoctor({ ...newDoctor, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-slate-600 mb-1">Specialization</label>
                <select
                  value={newDoctor.specialization}
                  onChange={(e) => setNewDoctor({ ...newDoctor, specialization: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                >
                  <option value="Cardiology">Cardiology</option>
                  <option value="Dermatology">Dermatology</option>
                  <option value="Pediatrics">Pediatrics</option>
                  <option value="Neurology">Neurology</option>
                  <option value="Orthopedics">Orthopedics</option>
                  <option value="General Medicine">General Medicine</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-600 mb-1">Working Start Time</label>
                <input
                  type="time"
                  value={newDoctor.working_hours_start}
                  onChange={(e) => setNewDoctor({ ...newDoctor, working_hours_start: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-600 mb-1">Working End Time</label>
                <input
                  type="time"
                  value={newDoctor.working_hours_end}
                  onChange={(e) => setNewDoctor({ ...newDoctor, working_hours_end: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-600 mb-1">Slot Duration (Mins)</label>
                <select
                  value={newDoctor.slot_duration_mins}
                  onChange={(e) => setNewDoctor({ ...newDoctor, slot_duration_mins: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                >
                  <option value={15}>15 Mins</option>
                  <option value={30}>30 Mins</option>
                  <option value={45}>45 Mins</option>
                  <option value={60}>60 Mins</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddDoctor(false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingDoctor}
                className="px-4 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs"
              >
                {submittingDoctor ? 'Creating...' : 'Save Doctor'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Doctors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {doctors.map(doc => (
          <div key={doc.id} className="bg-white rounded-xl p-5 border border-slate-200/80 space-y-4 shadow-xs flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center space-x-3.5">
                <img src={doc.avatar} alt={doc.name} className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 object-cover" />
                <div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-700 border border-purple-100">
                    {doc.specialization}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 mt-0.5">{doc.name}</h3>
                  <p className="text-xs text-slate-500">{doc.email}</p>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs space-y-1.5 text-slate-600">
                <div className="flex items-center justify-between">
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Working Hours:</span>
                  </span>
                  <strong className="text-slate-900">{doc.working_hours_start} - {doc.working_hours_end}</strong>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Slot Duration:</span>
                  </span>
                  <strong className="text-slate-900">{doc.slot_duration_mins} Mins</strong>
                </div>

                <div className="flex items-center justify-between">
                  <span>Consultation Fee:</span>
                  <strong className="text-slate-900">₹{doc.consultation_fee}</strong>
                </div>
              </div>

              {/* Leave Dates List */}
              {doc.leaves && doc.leaves.length > 0 && (
                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-100 text-xs space-y-1">
                  <span className="text-amber-800 font-semibold flex items-center space-x-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Configured Leave Dates:</span>
                  </span>
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {doc.leaves.map(l => (
                      <span key={l.leave_date} className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-medium">
                        {l.leave_date} ({l.reason})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Admin Action: Mark Leave */}
            <button
              onClick={() => setSelectedDoctorForLeave(doc)}
              className="w-full mt-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-semibold rounded-lg text-xs flex items-center justify-center space-x-1.5 transition"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>Mark Leave & Notify Patients</span>
            </button>
          </div>
        ))}
      </div>

      {/* Doctor Leave Assignment Modal */}
      {selectedDoctorForLeave && (
        <DoctorLeaveModal
          doctor={selectedDoctorForLeave}
          onClose={() => setSelectedDoctorForLeave(null)}
          onSuccess={() => {
            setSelectedDoctorForLeave(null);
            onRefresh();
          }}
        />
      )}

    </div>
  );
}
