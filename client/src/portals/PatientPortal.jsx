import React, { useState, useEffect } from 'react';
import DoctorCard from '../components/DoctorCard.jsx';
import BookingModal from '../components/BookingModal.jsx';
import { Search, Calendar, Pill, CheckCircle2, Download, ExternalLink, Sparkles, FileText, Activity, Trash2 } from 'lucide-react';

export default function PatientPortal({ patient, doctors, appointments, onRefresh }) {
  const [activeTab, setActiveTab] = useState('EXPLORE');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpec, setSelectedSpec] = useState('ALL');
  const [selectedDoctorForBooking, setSelectedDoctorForBooking] = useState(null);
  
  const [prescriptions, setPrescriptions] = useState([]);

  useEffect(() => {
    if (!patient) return;
    fetch(`/api/prescriptions/patient/${patient.id}`)
      .then(res => res.json())
      .then(data => setPrescriptions(data || []))
      .catch(console.error);
  }, [patient, appointments]);

  const specializations = ['ALL', ...new Set(doctors.map(d => d.specialization))];

  const filteredDoctors = doctors.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) || doc.specialization.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpec = selectedSpec === 'ALL' || doc.specialization === selectedSpec;
    return matchesSearch && matchesSpec;
  });

  const patientAppointments = appointments.filter(a => a.patient_id === patient.id);

  return (
    <div className="space-y-6">
      
      {/* Patient Hero Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-md">
              Patient Portal
            </span>
            <span className="text-xs text-slate-500">Welcome,</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            {patient.name}
          </h1>
          <p className="text-xs text-slate-600 max-w-lg">
            Search specialist doctors across India, book instant consultation slots, submit pre-visit symptoms for AI triage, and track post-visit care plans.
          </p>
        </div>

        {/* Metrics */}
        <div className="flex items-center space-x-3">
          <div className="bg-slate-50 px-4 py-3 rounded-xl border border-slate-200/80 text-center min-w-24">
            <div className="text-lg font-bold text-slate-900">{patientAppointments.filter(a => a.status === 'SCHEDULED').length}</div>
            <div className="text-[10px] uppercase font-semibold text-slate-500">Upcoming</div>
          </div>
          <div className="bg-slate-50 px-4 py-3 rounded-xl border border-slate-200/80 text-center min-w-24">
            <div className="text-lg font-bold text-emerald-700">{patientAppointments.filter(a => a.status === 'COMPLETED').length}</div>
            <div className="text-[10px] uppercase font-semibold text-slate-500">Completed</div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('EXPLORE')}
          className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition ${
            activeTab === 'EXPLORE'
              ? 'bg-slate-900 text-white font-semibold shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>Find Specialist Doctors</span>
        </button>

        <button
          onClick={() => setActiveTab('APPOINTMENTS')}
          className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition ${
            activeTab === 'APPOINTMENTS'
              ? 'bg-slate-900 text-white font-semibold shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>My Appointments ({patientAppointments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('MEDICATIONS')}
          className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition ${
            activeTab === 'MEDICATIONS'
              ? 'bg-slate-900 text-white font-semibold shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Pill className="w-3.5 h-3.5" />
          <span>Medication Tracker ({prescriptions.length})</span>
        </button>
      </div>

      {/* TAB 1: EXPLORE & BOOK DOCTORS */}
      {activeTab === 'EXPLORE' && (
        <div className="space-y-5">
          {/* Search & Filter Bar */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by doctor name or specialty..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
              />
            </div>

            {/* Specialization Tags */}
            <div className="flex items-center space-x-1 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
              {specializations.map(spec => (
                <button
                  key={spec}
                  onClick={() => setSelectedSpec(spec)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition ${
                    selectedSpec === spec
                      ? 'bg-blue-50 text-blue-700 border border-blue-200 font-semibold'
                      : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {spec}
                </button>
              ))}
            </div>
          </div>

          {/* Doctor Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredDoctors.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-500 text-xs">
                No doctors matching your criteria found.
              </div>
            ) : (
              filteredDoctors.map(doc => (
                <DoctorCard
                  key={doc.id}
                  doctor={doc}
                  onBook={(doctor) => setSelectedDoctorForBooking(doctor)}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MY APPOINTMENTS */}
      {activeTab === 'APPOINTMENTS' && (
        <div className="space-y-4">
          {patientAppointments.length === 0 ? (
            <div className="bg-white rounded-xl p-10 text-center border border-slate-200 space-y-3">
              <Calendar className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-sm font-bold text-slate-900">No Appointments Scheduled</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">Book a consultation to unlock AI pre-visit triage notes and post-visit doctor instructions.</p>
              <button
                onClick={() => setActiveTab('EXPLORE')}
                className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs"
              >
                Find a Doctor
              </button>
            </div>
          ) : (
            patientAppointments.map(appt => (
              <div key={appt.id} className="bg-white rounded-xl p-5 border border-slate-200/80 space-y-4 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-bold text-slate-900">{appt.doctor_name}</h3>
                        <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                          {appt.doctor_specialization}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Date: <strong className="text-slate-800">{appt.appointment_date}</strong> at <strong className="text-slate-800">{appt.time_slot}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      appt.status === 'SCHEDULED' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      appt.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      'bg-red-50 text-red-700 border-red-200'
                    }`}>
                      {appt.status}
                    </span>

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

                {/* Pre-Visit Symptoms & Urgency */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1">
                    <span className="text-slate-500 font-medium block flex items-center space-x-1">
                      <Activity className="w-3.5 h-3.5 text-slate-400" />
                      <span>Submitted Symptoms</span>
                    </span>
                    <p className="text-slate-800">{appt.symptoms}</p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1">
                    <span className="text-slate-500 font-medium block flex items-center space-x-1">
                      <Sparkles className="w-3.5 h-3.5 text-slate-400" />
                      <span>AI Triage Summary</span>
                    </span>
                    <p className="font-semibold text-slate-800">
                      Urgency: <span className={appt.urgency_level === 'High' ? 'text-red-700 font-bold' : 'text-amber-700'}>{appt.urgency_level || 'Medium'}</span>
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">{appt.chief_complaint}</p>
                  </div>
                </div>

                {/* Post Visit Summary */}
                {appt.status === 'COMPLETED' && appt.post_visit_summary && (
                  <div className="p-3.5 rounded-lg bg-emerald-50/50 border border-emerald-200 space-y-2">
                    <h4 className="text-xs font-semibold text-emerald-800 flex items-center space-x-1.5">
                      <FileText className="w-4 h-4 text-emerald-600" />
                      <span>Doctor Post-Visit Instructions & Care Plan</span>
                    </h4>
                    <div className="text-xs text-slate-800 whitespace-pre-line leading-relaxed bg-white p-3 rounded-md border border-slate-200">
                      {appt.post_visit_summary}
                    </div>
                  </div>
                )}

                {/* Calendar Sync Links */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex items-center space-x-2">
                    <a
                      href={appt.google_calendar_link || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-1 px-3 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 transition"
                    >
                      <ExternalLink className="w-3 h-3 text-slate-500" />
                      <span>Google Calendar Sync</span>
                    </a>

                    <a
                      href={`/api/appointments/${appt.id}/ical`}
                      download
                      className="flex items-center space-x-1 px-3 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 transition"
                    >
                      <Download className="w-3 h-3 text-slate-500" />
                      <span>Download .ICS</span>
                    </a>
                  </div>
                </div>

              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: MEDICATION TRACKER */}
      {activeTab === 'MEDICATIONS' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Pill className="w-4 h-4 text-blue-600" />
              <span>Prescribed Medication Schedule</span>
            </h3>

            {prescriptions.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No active prescriptions assigned yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {prescriptions.map((p) => (
                  <div key={p.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900">{p.medication_name}</h4>
                      <span className="text-[11px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-semibold border border-blue-100">
                        {p.dosage}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 space-y-0.5">
                      <p>• <strong>Frequency:</strong> {p.frequency}</p>
                      <p>• <strong>Duration:</strong> {p.duration_days} Days</p>
                      <p>• <strong>Instructions:</strong> {p.instructions || 'Take as directed'}</p>
                      <p className="text-slate-500 text-[11px] pt-1">Doctor: {p.doctor_name} ({p.specialization})</p>
                    </div>

                    <div className="pt-1">
                      <button
                        onClick={() => alert(`Recorded dose of ${p.medication_name} (${p.dosage}) for today!`)}
                        className="w-full py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold rounded-md text-xs flex items-center justify-center space-x-1.5 transition"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Mark Dose as Taken</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Booking Modal Popup */}
      {selectedDoctorForBooking && (
        <BookingModal
          doctor={selectedDoctorForBooking}
          patient={patient}
          onClose={() => setSelectedDoctorForBooking(null)}
          onBookingSuccess={() => {
            setSelectedDoctorForBooking(null);
            onRefresh();
            setActiveTab('APPOINTMENTS');
          }}
        />
      )}

    </div>
  );
}
