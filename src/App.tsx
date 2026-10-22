import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { Toaster } from './components/layout/Toaster';

// Admin Components
import { AdminDashboard } from './components/admin/AdminDashboard';
import { ActiveStudentsDirectory } from './components/admin/ActiveStudentsDirectory';
import { ArchivedStudentsVault } from './components/admin/ArchivedStudentsVault';
import { BulkIngestionEngine } from './components/admin/BulkIngestionEngine';
import { FeesManagement } from './components/admin/FeesManagement';
import { CoachPayrollEngine } from './components/admin/CoachPayrollEngine';

// Coach Components
import { CoachDashboard } from './components/coach/CoachDashboard';
import { StudentAttendanceModule } from './components/coach/StudentAttendanceModule';
import { CoachSelfAttendance } from './components/coach/CoachSelfAttendance';
import { SkillProgressionModule } from './components/coach/SkillProgressionModule';
import { IncidentReportingModule } from './components/coach/IncidentReportingModule';

// Parent Components
import { ParentDashboard } from './components/parent/ParentDashboard';

// Cross-Role Components
import { CourtBookingManager } from './components/facilities/CourtBookingManager';
import { EmergencyBroadcastCenter } from './components/broadcast/EmergencyBroadcastCenter';
import { MediaGallery } from './components/media/MediaGallery';
import { EmergencyBroadcastDrawer } from './components/broadcast/EmergencyBroadcastDrawer';

// Icons
import {
  LayoutDashboard,
  Users,
  Archive,
  UploadCloud,
  DollarSign,
  FileCheck2,
  Calendar,
  Bell,
  Image,
  UserCheck,
  MapPin,
  Trophy,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';

const MainApp: React.FC = () => {
  const { currentRole } = useApp();

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (currentRole === 'ADMIN') return 'admin-overview';
    if (currentRole === 'COACH') return 'coach-overview';
    return 'parent-dashboard';
  });

  const [isEmergencyDrawerOpen, setIsEmergencyDrawerOpen] = useState(false);

  // Sync tab default when role switches
  React.useEffect(() => {
    if (currentRole === 'ADMIN' && (activeTab.startsWith('coach-') || activeTab === 'parent-dashboard')) {
      setActiveTab('admin-overview');
    } else if (currentRole === 'COACH' && (activeTab.startsWith('admin-') || activeTab === 'parent-dashboard')) {
      setActiveTab('coach-overview');
    } else if (currentRole === 'STUDENT_PARENT' && (activeTab.startsWith('admin-') || activeTab.startsWith('coach-'))) {
      setActiveTab('parent-dashboard');
    }
  }, [currentRole]);

  // Tab definitions per role
  const getTabsForRole = () => {
    if (currentRole === 'ADMIN') {
      return [
        { id: 'admin-overview', label: 'Operations Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
        { id: 'admin-students', label: 'Active Directory', icon: <Users className="w-4 h-4" /> },
        {
          id: 'admin-archives',
          label: 'Student Archives (2024-2026)',
          icon: <Archive className="w-4 h-4 text-amber-500" />,
          badge: 'Admin Exclusive',
        },
        {
          id: 'admin-bulk-ingest',
          label: 'Bulk Ingestion Engine',
          icon: <UploadCloud className="w-4 h-4 text-indigo-400" />,
          badge: 'Admin Exclusive',
        },
        { id: 'admin-fees', label: 'Fees & Invoicing', icon: <DollarSign className="w-4 h-4" /> },
        { id: 'admin-payroll', label: 'Coach Payroll Engine', icon: <FileCheck2 className="w-4 h-4" /> },
        { id: 'facilities', label: 'Court Reservations', icon: <Calendar className="w-4 h-4" /> },
        { id: 'broadcast', label: 'WhatsApp Broadcasts', icon: <Bell className="w-4 h-4" /> },
        { id: 'media', label: 'Media Gallery', icon: <Image className="w-4 h-4" /> },
      ];
    }

    if (currentRole === 'COACH') {
      return [
        { id: 'coach-overview', label: 'Coach Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
        { id: 'coach-attendance', label: 'Student Attendance', icon: <UserCheck className="w-4 h-4" /> },
        { id: 'coach-self-attendance', label: 'Geofenced Shift Clock', icon: <MapPin className="w-4 h-4" /> },
        { id: 'coach-skills', label: 'Skill Matrix & Badges', icon: <Trophy className="w-4 h-4" /> },
        { id: 'coach-incidents', label: 'Injury & Incident Desk', icon: <ShieldAlert className="w-4 h-4" /> },
        { id: 'facilities', label: 'Court Reservations', icon: <Calendar className="w-4 h-4" /> },
        { id: 'broadcast', label: 'WhatsApp Broadcasts', icon: <Bell className="w-4 h-4" /> },
        { id: 'media', label: 'Media Gallery', icon: <Image className="w-4 h-4" /> },
      ];
    }

    // STUDENT_PARENT
    return [
      { id: 'parent-dashboard', label: "Mother's View & Profile", icon: <Trophy className="w-4 h-4 text-amber-500" /> },
      { id: 'facilities', label: 'Court Reservations', icon: <Calendar className="w-4 h-4" /> },
      { id: 'broadcast', label: 'Emergency Bulletins', icon: <Bell className="w-4 h-4" /> },
      { id: 'media', label: 'Academy Media Gallery', icon: <Image className="w-4 h-4" /> },
    ];
  };

  const tabs = getTabsForRole();

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-900">
      {/* Navbar Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openEmergencyDrawer={() => setIsEmergencyDrawerOpen(true)}
      />

      {/* Role Navigation Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-16 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1.5 overflow-x-auto py-2.5 no-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                  activeTab === tab.id
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-white text-slate-600 border-transparent hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8">
        {/* Admin Views */}
        {activeTab === 'admin-overview' && (
          <AdminDashboard
            onNavigate={(t) => setActiveTab(t)}
            openEmergencyDrawer={() => setIsEmergencyDrawerOpen(true)}
          />
        )}
        {activeTab === 'admin-students' && <ActiveStudentsDirectory />}
        {activeTab === 'admin-archives' && <ArchivedStudentsVault />}
        {activeTab === 'admin-bulk-ingest' && <BulkIngestionEngine />}
        {activeTab === 'admin-fees' && <FeesManagement />}
        {activeTab === 'admin-payroll' && <CoachPayrollEngine />}

        {/* Coach Views */}
        {activeTab === 'coach-overview' && (
          <CoachDashboard
            onNavigate={(t) => setActiveTab(t)}
            openEmergencyDrawer={() => setIsEmergencyDrawerOpen(true)}
          />
        )}
        {activeTab === 'coach-attendance' && <StudentAttendanceModule />}
        {activeTab === 'coach-self-attendance' && <CoachSelfAttendance />}
        {activeTab === 'coach-skills' && <SkillProgressionModule />}
        {activeTab === 'coach-incidents' && <IncidentReportingModule />}

        {/* Parent Views */}
        {activeTab === 'parent-dashboard' && (
          <ParentDashboard
            onNavigate={(t) => setActiveTab(t)}
            openEmergencyDrawer={() => setIsEmergencyDrawerOpen(true)}
          />
        )}

        {/* Common Shared Views */}
        {activeTab === 'facilities' && <CourtBookingManager />}
        {activeTab === 'broadcast' && <EmergencyBroadcastCenter />}
        {activeTab === 'media' && <MediaGallery />}
      </main>

      {/* Mobile Sticky Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 shadow-2xl px-2 py-1.5 flex items-center justify-around">
        {currentRole === 'ADMIN' && (
          <>
            <button
              onClick={() => setActiveTab('admin-overview')}
              className={`flex flex-col items-center justify-center p-1 rounded-xl text-[10px] font-bold min-w-[56px] transition-colors ${
                activeTab === 'admin-overview' ? 'text-amber-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-5 h-5 mb-0.5" />
              <span>Overview</span>
            </button>
            <button
              onClick={() => setActiveTab('admin-students')}
              className={`flex flex-col items-center justify-center p-1 rounded-xl text-[10px] font-bold min-w-[56px] transition-colors ${
                activeTab === 'admin-students' ? 'text-amber-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-5 h-5 mb-0.5" />
              <span>Athletes</span>
            </button>
            <button
              onClick={() => setActiveTab('admin-fees')}
              className={`flex flex-col items-center justify-center p-1 rounded-xl text-[10px] font-bold min-w-[56px] transition-colors ${
                activeTab === 'admin-fees' ? 'text-amber-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              <DollarSign className="w-5 h-5 mb-0.5" />
              <span>Fees</span>
            </button>
            <button
              onClick={() => setActiveTab('facilities')}
              className={`flex flex-col items-center justify-center p-1 rounded-xl text-[10px] font-bold min-w-[56px] transition-colors ${
                activeTab === 'facilities' ? 'text-amber-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calendar className="w-5 h-5 mb-0.5" />
              <span>Courts</span>
            </button>
            <button
              onClick={() => setIsEmergencyDrawerOpen(true)}
              className="flex flex-col items-center justify-center p-1 rounded-xl text-[10px] font-bold min-w-[56px] text-amber-400 hover:text-amber-300 transition-colors"
            >
              <Bell className="w-5 h-5 mb-0.5 animate-pulse" />
              <span>Alerts</span>
            </button>
          </>
        )}

        {currentRole === 'COACH' && (
          <>
            <button
              onClick={() => setActiveTab('coach-overview')}
              className={`flex flex-col items-center justify-center p-1 rounded-xl text-[10px] font-bold min-w-[56px] transition-colors ${
                activeTab === 'coach-overview' ? 'text-amber-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-5 h-5 mb-0.5" />
              <span>Coach Desk</span>
            </button>
            <button
              onClick={() => setActiveTab('coach-attendance')}
              className={`flex flex-col items-center justify-center p-1 rounded-xl text-[10px] font-bold min-w-[56px] transition-colors ${
                activeTab === 'coach-attendance' ? 'text-amber-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserCheck className="w-5 h-5 mb-0.5" />
              <span>Roster</span>
            </button>
            <button
              onClick={() => setActiveTab('coach-self-attendance')}
              className={`flex flex-col items-center justify-center p-1 rounded-xl text-[10px] font-bold min-w-[56px] transition-colors ${
                activeTab === 'coach-self-attendance' ? 'text-amber-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              <MapPin className="w-5 h-5 mb-0.5" />
              <span>GPS Clock</span>
            </button>
            <button
              onClick={() => setActiveTab('coach-skills')}
              className={`flex flex-col items-center justify-center p-1 rounded-xl text-[10px] font-bold min-w-[56px] transition-colors ${
                activeTab === 'coach-skills' ? 'text-amber-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Trophy className="w-5 h-5 mb-0.5" />
              <span>Skills</span>
            </button>
            <button
              onClick={() => setActiveTab('coach-incidents')}
              className={`flex flex-col items-center justify-center p-1 rounded-xl text-[10px] font-bold min-w-[56px] transition-colors ${
                activeTab === 'coach-incidents' ? 'text-amber-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldAlert className="w-5 h-5 mb-0.5" />
              <span>Safety</span>
            </button>
          </>
        )}

        {currentRole === 'STUDENT_PARENT' && (
          <>
            <button
              onClick={() => setActiveTab('parent-dashboard')}
              className={`flex flex-col items-center justify-center p-1 rounded-xl text-[10px] font-bold min-w-[64px] transition-colors ${
                activeTab === 'parent-dashboard' ? 'text-emerald-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Trophy className="w-5 h-5 mb-0.5" />
              <span>Child Profile</span>
            </button>
            <button
              onClick={() => setActiveTab('facilities')}
              className={`flex flex-col items-center justify-center p-1 rounded-xl text-[10px] font-bold min-w-[64px] transition-colors ${
                activeTab === 'facilities' ? 'text-emerald-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calendar className="w-5 h-5 mb-0.5" />
              <span>Courts</span>
            </button>
            <button
              onClick={() => setActiveTab('broadcast')}
              className={`flex flex-col items-center justify-center p-1 rounded-xl text-[10px] font-bold min-w-[64px] transition-colors ${
                activeTab === 'broadcast' ? 'text-emerald-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Bell className="w-5 h-5 mb-0.5" />
              <span>Bulletins</span>
            </button>
            <button
              onClick={() => setActiveTab('media')}
              className={`flex flex-col items-center justify-center p-1 rounded-xl text-[10px] font-bold min-w-[64px] transition-colors ${
                activeTab === 'media' ? 'text-emerald-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Image className="w-5 h-5 mb-0.5" />
              <span>Gallery</span>
            </button>
          </>
        )}
      </div>

      {/* Emergency Drawer */}
      <EmergencyBroadcastDrawer
        isOpen={isEmergencyDrawerOpen}
        onClose={() => setIsEmergencyDrawerOpen(false)}
        onNavigateToCenter={() => setActiveTab('broadcast')}
      />

      {/* Toast Notification Container */}
      <Toaster />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-5 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-900">VENDHAN SPORTS ACADEMY</span>
            <span>• Multi-Tenant RBAC Architecture & MongoDB</span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            Role-Based Access Control: Admin | Coach | Student-Parent
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
