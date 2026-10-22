import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Trophy,
  Shield,
  UserCheck,
  Users,
  Bell,
  RefreshCw,
  LogIn,
  ChevronDown,
  Sparkles,
  Database,
  Menu,
  X,
  ChevronRight,
  LayoutDashboard,
  Calendar,
  Image as ImageIcon,
  DollarSign,
  Archive,
  UploadCloud,
  FileCheck2,
  MapPin,
  ShieldAlert,
} from 'lucide-react';
import { UserRole } from '../../types';
import { AuthSimulationModal } from '../auth/AuthSimulationModal';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openEmergencyDrawer: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  openEmergencyDrawer,
}) => {
  const {
    currentUser,
    currentRole,
    switchRole,
    activeChild,
    activeChildId,
    setActiveChildId,
    activeStudents,
    broadcasts,
    resetAllData,
  } = useApp();

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [showChildDropdown, setShowChildDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Filter children linked to this parent (or all if simulated)
  const linkedChildren = activeStudents.filter((s) => {
    if (currentUser.parentLinkedStudentIds && currentUser.parentLinkedStudentIds.length > 0) {
      return currentUser.parentLinkedStudentIds.includes(s.id);
    }
    return s.parentUserId === currentUser.id || s.parentPhone === currentUser.phoneNumber;
  });

  const childrenToDisplay = linkedChildren.length > 0 ? linkedChildren : activeStudents.slice(0, 2);

  // Navigation items per role for the mobile quick drawer
  const getNavItemsForRole = () => {
    if (currentRole === 'ADMIN') {
      return [
        { id: 'admin-overview', label: 'Operations Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
        { id: 'admin-students', label: 'Active Student Directory', icon: <Users className="w-4 h-4" /> },
        { id: 'admin-archives', label: 'Student Archives (2024-2026)', icon: <Archive className="w-4 h-4 text-amber-500" /> },
        { id: 'admin-bulk-ingest', label: 'Bulk Ingestion Engine', icon: <UploadCloud className="w-4 h-4 text-indigo-400" /> },
        { id: 'admin-fees', label: 'Fees & Invoicing Engine', icon: <DollarSign className="w-4 h-4" /> },
        { id: 'admin-payroll', label: 'Coach Payroll Engine', icon: <FileCheck2 className="w-4 h-4" /> },
        { id: 'facilities', label: 'Court Reservations', icon: <Calendar className="w-4 h-4" /> },
        { id: 'broadcast', label: 'WhatsApp Broadcasts', icon: <Bell className="w-4 h-4" /> },
        { id: 'media', label: 'Media Gallery', icon: <ImageIcon className="w-4 h-4" /> },
      ];
    }
    if (currentRole === 'COACH') {
      return [
        { id: 'coach-overview', label: 'Coach Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
        { id: 'coach-attendance', label: 'Student Session Attendance', icon: <UserCheck className="w-4 h-4" /> },
        { id: 'coach-self-attendance', label: 'Geofenced GPS Shift Clock', icon: <MapPin className="w-4 h-4" /> },
        { id: 'coach-skills', label: 'Skill Matrix & Badges', icon: <Trophy className="w-4 h-4" /> },
        { id: 'coach-incidents', label: 'Injury & Incident Desk', icon: <ShieldAlert className="w-4 h-4" /> },
        { id: 'facilities', label: 'Court Reservations', icon: <Calendar className="w-4 h-4" /> },
        { id: 'broadcast', label: 'WhatsApp Broadcasts', icon: <Bell className="w-4 h-4" /> },
        { id: 'media', label: 'Media Gallery', icon: <ImageIcon className="w-4 h-4" /> },
      ];
    }
    return [
      { id: 'parent-dashboard', label: "Mother's View & Child Profile", icon: <Trophy className="w-4 h-4 text-amber-500" /> },
      { id: 'facilities', label: 'Court Reservations', icon: <Calendar className="w-4 h-4" /> },
      { id: 'broadcast', label: 'Emergency Alerts Hub', icon: <Bell className="w-4 h-4" /> },
      { id: 'media', label: 'Academy Media Gallery', icon: <ImageIcon className="w-4 h-4" /> },
    ];
  };

  const navItems = getNavItemsForRole();

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-900 text-white border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
            {/* Logo & Brand */}
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-300 flex items-center justify-center shadow-lg shadow-orange-500/20 text-slate-950 font-black shrink-0">
                <Trophy className="w-5 h-5 text-slate-950" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="font-extrabold text-sm sm:text-base tracking-tight text-white truncate">
                    VENDHAN SPORTS ACADEMY
                  </span>
                  <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                    Pro
                  </span>
                </div>
                <div className="text-[10px] sm:text-[11px] text-slate-400 hidden md:block">
                  Next-Gen Sports Academy Platform • MongoDB Connected
                </div>
              </div>
            </div>

            {/* Quick Role Switcher Pill Bar (Interactive RBAC Engine) - Desktop */}
            <div className="hidden lg:flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700/80 shadow-inner">
              <span className="text-[11px] font-semibold text-slate-400 px-2.5">Role Matrix:</span>
              <button
                onClick={() => {
                  switchRole('ADMIN');
                  setActiveTab('admin-overview');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  currentRole === 'ADMIN'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin</span>
              </button>
              <button
                onClick={() => {
                  switchRole('COACH');
                  setActiveTab('coach-overview');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  currentRole === 'COACH'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Coach</span>
              </button>
              <button
                onClick={() => {
                  switchRole('STUDENT_PARENT');
                  setActiveTab('parent-dashboard');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  currentRole === 'STUDENT_PARENT'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Parent / Student</span>
              </button>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              {/* Parent Context: Child Profile Switcher (Tablet & Desktop) */}
              {currentRole === 'STUDENT_PARENT' && (
                <div className="relative hidden sm:block">
                  <button
                    onClick={() => setShowChildDropdown(!showChildDropdown)}
                    className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-700/80 hover:bg-emerald-900/80 transition-all text-left shadow-sm min-h-[36px]"
                  >
                    <div className="w-6 h-6 rounded-full overflow-hidden border border-emerald-400 shrink-0">
                      <img
                        src={activeChild?.photoUrl}
                        alt={activeChild?.firstName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="hidden md:block">
                      <div className="text-[9px] text-emerald-400 font-semibold uppercase leading-tight">
                        Child Profile
                      </div>
                      <div className="text-xs font-bold text-white leading-tight">
                        {activeChild ? `${activeChild.firstName} ${activeChild.lastName}` : 'Select Child'}
                      </div>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-emerald-300 ml-1" />
                  </button>

                  {showChildDropdown && (
                    <div className="absolute right-0 mt-2 w-64 bg-slate-900 rounded-xl shadow-xl border border-slate-700 p-2 z-50">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 mb-1">
                        Linked Children (Mother&apos;s View)
                      </div>
                      {childrenToDisplay.map((child) => (
                        <button
                          key={child.id}
                          onClick={() => {
                            setActiveChildId(child.id);
                            setShowChildDropdown(false);
                          }}
                          className={`w-full flex items-center gap-2.5 p-2 rounded-lg text-left transition-all ${
                            child.id === activeChildId
                              ? 'bg-emerald-900/50 text-white border border-emerald-700'
                              : 'hover:bg-slate-800 text-slate-300'
                          }`}
                        >
                          <img
                            src={child.photoUrl}
                            alt={child.firstName}
                            className="w-8 h-8 rounded-full object-cover border border-slate-600"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold truncate">
                              {child.firstName} {child.lastName}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">
                              {child.enrolledSports.join(', ')} • {child.studentCode}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* MongoDB Status Pill */}
              <button
                onClick={() => setAuthModalOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 transition-all text-xs font-bold min-h-[36px]"
                title="MongoDB Live Database Status (Click to connect or view URL)"
              >
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">MongoDB</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </button>

              {/* Emergency Alerts Pill */}
              <button
                onClick={openEmergencyDrawer}
                className="relative flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/40 text-amber-300 hover:bg-amber-500/20 transition-all text-xs font-bold min-h-[36px]"
                title="WhatsApp Cloud API Emergency Alerts"
              >
                <Bell className="w-4 h-4 text-amber-400 animate-pulse" />
                <span className="hidden sm:inline">Alerts</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-slate-950 font-black">
                  {broadcasts.length}
                </span>
              </button>

              {/* User Profile / Auth trigger */}
              <button
                onClick={() => setAuthModalOpen(true)}
                className="flex items-center gap-2 px-2 sm:px-2.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 hover:border-slate-600 text-left transition-all group min-h-[36px]"
                title="Manage Sign In & Credentials"
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-7 h-7 rounded-full object-cover border border-slate-600 group-hover:border-indigo-400"
                />
                <div className="hidden xl:block">
                  <div className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">
                    {currentUser.name}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400">
                    <span className="font-semibold text-indigo-400">{currentUser.role}</span>
                    {currentUser.mfaEnabled && (
                      <span className="text-[9px] px-1 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                        MFA
                      </span>
                    )}
                  </div>
                </div>
                <LogIn className="w-3.5 h-3.5 text-slate-400 group-hover:text-white ml-0.5 hidden sm:block" />
              </button>

              {/* Reset seed data button */}
              <button
                onClick={resetAllData}
                title="Reset academy data to initial pristine demo state"
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              {/* Mobile Hamburger Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 hover:text-white hover:bg-slate-700 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                aria-label="Toggle mobile menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5 text-amber-400" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-slate-950 border-t border-slate-800 px-4 py-4 space-y-4 shadow-2xl animate-in slide-in-from-top-2 duration-150 max-h-[85vh] overflow-y-auto">
            {/* Role Switcher */}
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Select Active Role (RBAC)</span>
                <span className="text-amber-400 font-mono text-[10px]">Instant Switch</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => {
                    switchRole('ADMIN');
                    setActiveTab('admin-overview');
                    setMobileMenuOpen(false);
                  }}
                  className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-bold transition-all min-h-[48px] border ${
                    currentRole === 'ADMIN'
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  <Shield className="w-4 h-4 mb-1" />
                  <span>Admin</span>
                </button>
                <button
                  onClick={() => {
                    switchRole('COACH');
                    setActiveTab('coach-overview');
                    setMobileMenuOpen(false);
                  }}
                  className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-bold transition-all min-h-[48px] border ${
                    currentRole === 'COACH'
                      ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  <UserCheck className="w-4 h-4 mb-1" />
                  <span>Coach</span>
                </button>
                <button
                  onClick={() => {
                    switchRole('STUDENT_PARENT');
                    setActiveTab('parent-dashboard');
                    setMobileMenuOpen(false);
                  }}
                  className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-bold transition-all min-h-[48px] border ${
                    currentRole === 'STUDENT_PARENT'
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  <Users className="w-4 h-4 mb-1" />
                  <span>Student/Parent</span>
                </button>
              </div>
            </div>

            {/* Child Profile Switcher (Mobile) */}
            {currentRole === 'STUDENT_PARENT' && (
              <div className="bg-slate-900 p-3 rounded-2xl border border-emerald-900/40">
                <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-2">
                  Linked Child Profile (Mother&apos;s View)
                </div>
                <div className="space-y-1.5">
                  {childrenToDisplay.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setActiveChildId(c.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-bold transition-all ${
                        c.id === activeChildId
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <img
                          src={c.photoUrl}
                          alt={c.firstName}
                          className="w-7 h-7 rounded-full object-cover border border-white/30"
                        />
                        <div className="text-left">
                          <div>{c.firstName} {c.lastName}</div>
                          <div className="text-[10px] opacity-80">{c.studentCode} • {c.enrolledSports.join(', ')}</div>
                        </div>
                      </div>
                      {c.id === activeChildId && <span className="text-[10px] font-mono bg-emerald-800 px-2 py-0.5 rounded-full">Active</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Current Role Navigation Shortcuts */}
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                {currentRole === 'ADMIN' ? 'Admin Director Modules' : currentRole === 'COACH' ? 'Coach Staff Modules' : 'Parent & Athlete Services'}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all min-h-[44px] ${
                      activeTab === item.id
                        ? 'bg-slate-800 text-amber-300 border border-slate-700 font-bold'
                        : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Actions Footer */}
            <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setAuthModalOpen(true);
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs font-bold border border-slate-700 min-h-[44px]"
              >
                <LogIn className="w-4 h-4 text-indigo-400" />
                <span>Account Credentials & MongoDB Settings</span>
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  openEmergencyDrawer();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold min-h-[44px]"
              >
                <Bell className="w-4 h-4" />
                <span>Open WhatsApp Alerts Hub ({broadcasts.length})</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Auth Modal */}
      <AuthSimulationModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </>
  );
};
