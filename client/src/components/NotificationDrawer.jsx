import React from 'react';
import { X, Mail, Bell, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function NotificationDrawer({ isOpen, onClose, notifications = [] }) {
  if (!isOpen) return null;

  const getTypeBadge = (type) => {
    switch (type) {
      case 'BOOKING_CONFIRMATION':
        return { label: 'Confirmation Email', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 };
      case 'LEAVE_ALERT':
        return { label: 'Urgent Leave Alert', bg: 'bg-amber-50 text-amber-700 border-amber-200', icon: AlertTriangle };
      case 'MEDICATION_REMINDER':
        return { label: 'Medication Alarm', bg: 'bg-blue-50 text-blue-700 border-blue-200', icon: Clock };
      case 'APPOINTMENT_REMINDER':
        return { label: '24h Reminder', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: Bell };
      default:
        return { label: 'Notification', bg: 'bg-slate-100 text-slate-700 border-slate-200', icon: Mail };
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-slate-200 shadow-xl flex flex-col">
          
          {/* Drawer Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Email Notification Feed</h3>
                <p className="text-[11px] text-slate-500">Outbound patient & doctor emails log</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg bg-slate-100 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* List of Notifications */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {notifications.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                <Mail className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
                <p>No notifications or outbound emails recorded yet.</p>
              </div>
            ) : (
              notifications.map((n) => {
                const badge = getTypeBadge(n.type);
                const IconComponent = badge.icon;
                return (
                  <div key={n.id} className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3.5 space-y-2 hover:border-slate-300 transition">
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${badge.bg}`}>
                        <IconComponent className="w-3 h-3" />
                        <span>{badge.label}</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 font-medium">
                      To: <span className="text-slate-900 font-semibold">{n.recipient_name} ({n.recipient_email})</span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900">{n.title}</h4>
                    
                    <div className="text-[11px] text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200 whitespace-pre-line leading-relaxed max-h-32 overflow-y-auto font-sans">
                      {n.message}
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
