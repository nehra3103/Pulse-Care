import React from 'react';
import { Star, Clock, Calendar, Award, ArrowRight } from 'lucide-react';

export default function DoctorCard({ doctor, onBook }) {
  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col justify-between">
      <div>
        {/* Doctor Header */}
        <div className="flex items-start space-x-3.5">
          <img
            src={doctor.avatar}
            alt={doctor.name}
            className="w-14 h-14 rounded-xl bg-slate-100 object-cover border border-slate-200"
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-100">
                {doctor.specialization}
              </span>
              <div className="flex items-center space-x-1 text-slate-700 text-xs font-semibold">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{doctor.rating ? doctor.rating.toFixed(1) : '4.9'}</span>
              </div>
            </div>

            <h3 className="text-base font-semibold text-slate-900 mt-1">
              {doctor.name}
            </h3>

            <div className="flex items-center space-x-2 text-xs text-slate-500 mt-0.5">
              <span className="flex items-center space-x-1">
                <Award className="w-3 h-3 text-slate-400" />
                <span>{doctor.experience_years} yrs experience</span>
              </span>
            </div>
          </div>
        </div>

        {/* Bio */}
        <p className="text-xs text-slate-600 mt-3.5 line-clamp-2 leading-relaxed">
          {doctor.bio || 'Experienced medical professional committed to providing personalized patient care.'}
        </p>

        {/* Working Hours & Fee */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center space-x-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{doctor.working_hours_start} - {doctor.working_hours_end}</span>
          </div>
          <div className="font-semibold text-slate-900">
            ₹{doctor.consultation_fee} <span className="text-[10px] text-slate-500 font-normal">/ visit</span>
          </div>
        </div>
      </div>

      {/* Book Button CTA */}
      <button
        onClick={() => onBook(doctor)}
        className="mt-5 w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 px-4 rounded-lg text-xs flex items-center justify-center space-x-1.5 transition"
      >
        <span>Book Appointment</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
