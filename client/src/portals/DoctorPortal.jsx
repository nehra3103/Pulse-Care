import React, { useState } from 'react';
import PreVisitSummaryCard from '../components/PreVisitSummaryCard.jsx';
import PostVisitModal from '../components/PostVisitModal.jsx';
import { Calendar, FileText, CheckCircle2, Trash2, UserCheck } from 'lucide-react';

export default function DoctorPortal({ doctor, doctors = [], onSelectDoctor, appointments, onRefresh }) {
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedApptForPostVisit, setSelectedApptForPostVisit] = useState(null);

  if (!doctor) {
    return (
      <div className="bg-white rounded-xl p-8 text-center text-slate-500 text-xs border border-slate-200">
        Loading doctor schedule...
      </div>
    );
  }

  const doctorAppointments = appointments.filter(a => a.doctor_id === doctor.id);
  const filtered = doctorAppointments.filter(a => filterStatus === 'ALL' || a.status === filterStatus);

  return (
    <div className="space-y-6">
      
      {/* Doctor Banner with Doctor Switcher Dropdown */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <img src={doctor.avatar} alt={doctor.name} className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 object-cover" />
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md">
                Doctor Portal
              </span>
              <span className="text-xs text-slate-500">{doctor.specialization}</span>
            </div>

            {/* Doctor Profile Selector Dropdown */}
            <div className="flex items-center space-x-2">
              <UserCheck className="w-4 h-4 text-slate-400" />
              <select
                value={doctor.id}
                onChange={(e) => {
                  const targetDoc = doctors.find(d => d.id === e.target.value);
                  if (targetDoc && onSelectDoctor) {
                    onSelectDoctor(targetDoc);
                  }
                }}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-600 cursor-pointer"
              >
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.specialization})
                  </option>
                ))}
              </select>
            </div>

            <p className="text-xs text-slate-500">Working Hours: {doctor.working_hours_start} - {doctor.working_hours_end} | {doctor.slot_duration_mins}m slots</p>
          </div>
        </div>

        {/* Metrics */}
        <div className="flex items-center space-x-3">
          <div className="bg-slate-50 px-4 py-3 rounded-xl border border-slate-200/80 text-center min-w-24">
            <div className="text-lg font-bold text-amber-700">{doctorAppointments.filter(a => a.status === 'SCHEDULED').length}</div>
            <div className="text-[10px] uppercase font-semibold text-slate-500">Pending</div>
          </div>
          <div className="bg-slate-50 px-4 py-3 rounded-xl border border-slate-200/80 text-center min-w-24">
            <div className="text-lg font-bold text-emerald-700">{doctorAppointments.filter(a => a.status === 'COMPLETED').length}</div>
            <div className="text-[10px] uppercase font-semibold text-slate-500">Completed</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-3">
        {['ALL', 'SCHEDULED', 'COMPLETED'].map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
              filterStatus === status
                ? 'bg-slate-900 text-white font-semibold shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {status === 'ALL' ? 'All Patients' : status === 'SCHEDULED' ? 'Pending Consultations' : 'Completed Consultations'}
          </button>
        ))}
      </div>

      {/* Appointment Schedule List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl p-10 text-center border border-slate-200 space-y-2">
            <Calendar className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-sm font-bold text-slate-900">No Consultations Found</h3>
            <p className="text-xs text-slate-500">There are no patient appointments scheduled for {doctor.name} in this view.</p>
          </div>
        ) : (
          filtered.map(appt => (
            <div key={appt.id} className="bg-white rounded-xl p-5 border border-slate-200/80 space-y-4 shadow-xs">
              
              {/* Patient Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-3">
                  <img src={appt.patient_avatar} alt={appt.patient_name} className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 object-cover" />
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-bold text-slate-900">{appt.patient_name}</h3>
                      <span className="text-xs text-slate-500">({appt.patient_email})</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Scheduled: <strong className="text-slate-800">{appt.appointment_date}</strong> at <strong className="text-slate-800">{appt.time_slot}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                    appt.status === 'SCHEDULED' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    appt.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    'bg-red-50 text-red-700 border-red-200'
                  }`}>
                    {appt.status}
                  </span>

                  {appt.status === 'SCHEDULED' && (
                    <button
                      onClick={() => setSelectedApptForPostVisit(appt)}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs flex items-center space-x-1.5 transition"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Complete Visit</span>
                    </button>
                  )}

                  <button
                    onClick={async () => {
                      if (confirm(`Are you sure you want to delete this appointment entry?`)) {
                        await fetch(`/api/appointments/${appt.id}`, { method: 'DELETE' });
                        onRefresh();
                      }
                    }}
                    className="px-2.5 py-1 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md border border-red-100 transition flex items-center space-x-1"
                    title="Delete Appointment Entry"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>

              {/* Pre-Visit AI Triage Card */}
              <PreVisitSummaryCard appointment={appt} />

              {/* Display Post-Visit Summary if completed */}
              {appt.status === 'COMPLETED' && appt.post_visit_summary && (
                <div className="p-3.5 rounded-lg bg-emerald-50/50 border border-emerald-200 space-y-1.5">
                  <h4 className="text-xs font-semibold text-emerald-800 flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Completed Visit Summary & Patient Instructions</span>
                  </h4>
                  <div className="text-xs text-slate-800 whitespace-pre-line leading-relaxed bg-white p-3 rounded-md border border-slate-200">
                    {appt.post_visit_summary}
                  </div>
                </div>
              )}

            </div>
          ))
        )}
      </div>

      {/* Post-Visit Modal */}
      {selectedApptForPostVisit && (
        <PostVisitModal
          appointment={selectedApptForPostVisit}
          onClose={() => setSelectedApptForPostVisit(null)}
          onSuccess={() => {
            setSelectedApptForPostVisit(null);
            onRefresh();
          }}
        />
      )}

    </div>
  );
}
