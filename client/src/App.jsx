import React, { useState, useEffect } from 'react';
import Header from './components/Header.jsx';
import PatientPortal from './portals/PatientPortal.jsx';
import DoctorPortal from './portals/DoctorPortal.jsx';
import AdminPortal from './portals/AdminPortal.jsx';
import NotificationDrawer from './components/NotificationDrawer.jsx';
import { RefreshCw } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL;

export default function App() {
  const [currentRole, setCurrentRole] = useState('PATIENT');

  const [users, setUsers] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const [activePatient, setActivePatient] = useState(null);
  const [activeDoctor, setActiveDoctor] = useState(null);

  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);

      const [usersRes, doctorsRes, apptsRes, notifsRes] = await Promise.all([
        fetch(`${API_URL}/api/auth/users`),
        fetch(`${API_URL}/api/doctors`),
        fetch(`${API_URL}/api/appointments`),
        fetch(`${API_URL}/api/notifications`)
      ]);

      if (
        !usersRes.ok ||
        !doctorsRes.ok ||
        !apptsRes.ok ||
        !notifsRes.ok
      ) {
        throw new Error('Failed to load data from backend');
      }

      const usersData = await usersRes.json();
      const doctorsData = await doctorsRes.json();
      const apptsData = await apptsRes.json();
      const notifsData = await notifsRes.json();

      setUsers(usersData || []);
      setDoctors(doctorsData || []);
      setAppointments(apptsData || []);
      setNotifications(notifsData || []);

      setActivePatient((prev) => {
        if (!prev && usersData.length > 0) {
          return usersData.find((u) => u.role === 'PATIENT') || usersData[0];
        }
        return prev;
      });

      setActiveDoctor((prev) => {
        if (!prev && doctorsData.length > 0) {
          return doctorsData[0];
        }

        if (prev && doctorsData.length > 0) {
          const matchingDoc = doctorsData.find((d) => d.id === prev.id);
          return matchingDoc || prev;
        }

        return prev;
      });
    } catch (err) {
      console.error('Error loading platform data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const interval = setInterval(() => {
      loadData();
    }, 20000);

    return () => clearInterval(interval);
  }, []);

  const getActiveUserForHeader = () => {
    if (currentRole === 'PATIENT') {
      return activePatient;
    }

    if (currentRole === 'DOCTOR') {
      return activeDoctor
        ? {
            name: activeDoctor.name,
            avatar: activeDoctor.avatar
          }
        : null;
    }

    return {
      name: 'Admin',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=RajeshAdmin'
    };
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      <Header
        currentRole={currentRole}
        setCurrentRole={setCurrentRole}
        activeUser={getActiveUserForHeader()}
        notificationCount={notifications.length}
        onOpenNotifications={() => setIsNotificationDrawerOpen(true)}
        onRefresh={loadData}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading && doctors.length === 0 ? (
          <div className="py-24 text-center space-y-3">
            <RefreshCw className="w-6 h-6 text-slate-400 animate-spin mx-auto" />
            <p className="text-xs font-medium text-slate-500">
              Loading Healthcare Platform...
            </p>
          </div>
        ) : (
          <>
            {currentRole === 'PATIENT' && activePatient && (
              <PatientPortal
                patient={activePatient}
                doctors={doctors}
                appointments={appointments}
                onRefresh={loadData}
              />
            )}

            {currentRole === 'DOCTOR' && activeDoctor && (
              <DoctorPortal
                doctor={activeDoctor}
                doctors={doctors}
                onSelectDoctor={(doc) => setActiveDoctor(doc)}
                appointments={appointments}
                onRefresh={loadData}
              />
            )}

            {currentRole === 'ADMIN' && (
              <AdminPortal
                doctors={doctors}
                appointments={appointments}
                onRefresh={loadData}
              />
            )}
          </>
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white py-5 text-center text-xs text-slate-500 mt-auto">
        <p>
          © 2026 PulseCare Healthcare Platform • Minimal & Human-Centric Medical Follow-Up System
        </p>
      </footer>

      <NotificationDrawer
        isOpen={isNotificationDrawerOpen}
        onClose={() => setIsNotificationDrawerOpen(false)}
        notifications={notifications}
      />
    </div>
  );
}
