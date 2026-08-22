import React from 'react';
import { Stethoscope, User, Shield, Bell, RefreshCw } from 'lucide-react';

export default function Header({ currentRole, setCurrentRole, activeUser, notificationCount, onOpenNotifications, onRefresh }) {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        
        {/* Logo & Brand */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentRole('PATIENT')}>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-bold">
            <Stethoscope className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg text-slate-900 tracking-tight">
                PulseCare
              </span>
              <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                Clinic Platform
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">Healthcare Appointments & Follow-up</p>
          </div>
        </div>

        {/* Minimal Role Switcher Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/60">
          <button
            onClick={() => setCurrentRole('PATIENT')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              currentRole === 'PATIENT'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Patient</span>
          </button>

          <button
            onClick={() => setCurrentRole('DOCTOR')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              currentRole === 'DOCTOR'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>Doctor</span>
          </button>

          <button
            onClick={() => setCurrentRole('ADMIN')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              currentRole === 'ADMIN'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Admin</span>
          </button>
        </div>

        {/* Actions & Notification Drawer Trigger */}
        <div className="flex items-center space-x-2.5">
          
          <button
            onClick={onRefresh}
            title="Refresh Data"
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Email Inbox / Notifications Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition flex items-center space-x-1.5"
          >
            <Bell className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-medium hidden md:inline">Email Feed</span>
            {notificationCount > 0 && (
              <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {notificationCount}
              </span>
            )}
          </button>

          {/* User Profile Avatar Pill */}
          {activeUser && (
            <div className="hidden lg:flex items-center space-x-2 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
              <img src={activeUser.avatar} alt={activeUser.name} className="w-6 h-6 rounded-full bg-slate-200" />
              <span className="text-xs font-medium text-slate-700">{activeUser.name}</span>
            </div>
          )}

        </div>

      </div>
    </header>
  );
}
