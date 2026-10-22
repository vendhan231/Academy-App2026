import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck,
  Phone,
  Lock,
  KeyRound,
  UserCircle,
  X,
  Sparkles,
  Smartphone,
  CheckCircle2,
  Database,
  ArrowRight,
  Server,
  AlertCircle,
} from 'lucide-react';
import { INITIAL_USERS } from '../../data/initialData';
import { User } from '../../types';

interface AuthSimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthSimulationModal: React.FC<AuthSimulationModalProps> = ({ isOpen, onClose }) => {
  const { loginAsUser, setActiveChildId, activeStudents, addToast } = useApp();

  const [activeTab, setActiveTab] = useState<'CREDENTIALS' | 'WHATSAPP_OTP' | 'MONGODB'>('CREDENTIALS');

  // Direct Credential Form
  const [loginId, setLoginId] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Parent WhatsApp OTP Form
  const [phone, setPhone] = useState('+1 (987) 654-3210');
  const [otpCode, setOtpCode] = useState('482901');
  const [otpSent, setOtpSent] = useState(false);
  const [selectedChildPicker, setSelectedChildPicker] = useState<string | null>(null);

  // MongoDB status
  const [mongoUriInput, setMongoUriInput] = useState('');
  const [mongoStatus, setMongoStatus] = useState<{
    configured: boolean;
    connected: boolean;
    message: string;
    maskedUri?: string | null;
  }>({
    configured: false,
    connected: false,
    message: 'Checking database connection...',
  });
  const [mongoLoading, setMongoLoading] = useState(false);

  // Check MongoDB status
  useEffect(() => {
    if (isOpen) {
      fetch('/api/mongodb-status')
        .then((res) => res.json())
        .then((data) => {
          setMongoStatus(data);
        })
        .catch(() => {
          setMongoStatus({
            configured: false,
            connected: false,
            message: 'Operating with in-memory persistence and localStorage synchronization.',
          });
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCredentialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: loginId, password }),
      });

      const data = await res.json();
      if (data.success && data.user) {
        loginAsUser(data.user);
        if (data.activeStudent) {
          setActiveChildId(data.activeStudent.id);
        }
        onClose();
        return;
      }
    } catch {
      // Fallback to client-side verification
    } finally {
      setLoading(false);
    }

    // Client-side matching:
    const idClean = loginId.trim().toLowerCase();
    const pwClean = password.trim();

    // 1. Admin: admin / admin123
    if ((idClean === 'admin' || idClean === 'admin@vendhansports.com') && pwClean === 'admin123') {
      const admin = INITIAL_USERS.find((u) => u.role === 'ADMIN') || INITIAL_USERS[0];
      loginAsUser(admin);
      onClose();
      return;
    }

    // 2. Coach: coach / coach123
    if ((idClean === 'coach' || idClean === 'coach@vendhansports.com') && pwClean === 'coach123') {
      const coach = INITIAL_USERS.find((u) => u.role === 'COACH') || INITIAL_USERS[1];
      loginAsUser(coach);
      onClose();
      return;
    }

    // 3. Student: 001, 002, 003 etc. / vendhan
    const matchedStudent = activeStudents.find(
      (s) =>
        s.loginId === idClean ||
        s.studentCode.toLowerCase() === idClean ||
        s.firstName.toLowerCase() === idClean ||
        s.studentCode.toLowerCase().endsWith(idClean)
    );

    if (matchedStudent && pwClean === 'vendhan') {
      const parentUser: User = {
        id: matchedStudent.parentUserId,
        role: 'STUDENT_PARENT',
        username: matchedStudent.loginId || '001',
        password: 'vendhan',
        name: `${matchedStudent.parentName} (${matchedStudent.firstName}'s Guardian)`,
        phoneNumber: matchedStudent.parentPhone,
        avatar: matchedStudent.photoUrl,
        parentLinkedStudentIds: [matchedStudent.id],
      };
      loginAsUser(parentUser);
      setActiveChildId(matchedStudent.id);
      onClose();
      return;
    }

    setErrorMessage('Invalid credentials. Check required credentials below.');
  };

  const handleQuickFill = (id: string, pass: string) => {
    setLoginId(id);
    setPassword(pass);
    setErrorMessage('');
    setActiveTab('CREDENTIALS');
  };

  const handleConnectMongo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mongoUriInput.trim()) return;

    setMongoLoading(true);
    try {
      const res = await fetch('/api/mongodb-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mongoUri: mongoUriInput.trim() }),
      });

      const data = await res.json();
      if (data.success) {
        setMongoStatus({
          configured: true,
          connected: true,
          message: data.message,
        });
        addToast({
          type: 'success',
          title: 'MongoDB Connected',
          description: 'Vendhan Sports Academy is now actively connected to MongoDB!',
        });
      } else {
        setMongoStatus({
          configured: true,
          connected: false,
          message: data.message || 'Connection failed.',
        });
        addToast({
          type: 'error',
          title: 'MongoDB Connection Error',
          description: data.message,
        });
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Connection Error',
        description: err.message,
      });
    } finally {
      setMongoLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm tracking-tight">Vendhan Sports Academy Portal</h3>
              <p className="text-[11px] text-slate-300">Identity & Role-Based Access Control</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Credential Preset Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-100 space-y-2">
          <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Click to Load Required Credentials
            </span>
            <span className="text-[10px] text-emerald-700 font-mono bg-emerald-100 px-2 py-0.5 rounded-full">
              Vendhan Academy
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {/* Admin */}
            <button
              type="button"
              onClick={() => handleQuickFill('admin', 'admin123')}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                loginId === 'admin'
                  ? 'border-indigo-600 bg-indigo-50/80 ring-1 ring-indigo-500'
                  : 'bg-white border-slate-200 hover:border-indigo-300'
              }`}
            >
              <div className="text-[10px] uppercase font-bold text-indigo-700">Admin</div>
              <div className="text-xs font-mono font-bold text-slate-900">id: admin</div>
              <div className="text-[10px] font-mono text-slate-500">pw: admin123</div>
            </button>

            {/* Coach */}
            <button
              type="button"
              onClick={() => handleQuickFill('coach', 'coach123')}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                loginId === 'coach'
                  ? 'border-blue-600 bg-blue-50/80 ring-1 ring-blue-500'
                  : 'bg-white border-slate-200 hover:border-blue-300'
              }`}
            >
              <div className="text-[10px] uppercase font-bold text-blue-700">Coach</div>
              <div className="text-xs font-mono font-bold text-slate-900">id: coach</div>
              <div className="text-[10px] font-mono text-slate-500">pw: coach123</div>
            </button>

            {/* Student 001 */}
            <button
              type="button"
              onClick={() => handleQuickFill('001', 'vendhan')}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                loginId === '001'
                  ? 'border-emerald-600 bg-emerald-50/80 ring-1 ring-emerald-500'
                  : 'bg-white border-slate-200 hover:border-emerald-300'
              }`}
            >
              <div className="text-[10px] uppercase font-bold text-emerald-700">Student</div>
              <div className="text-xs font-mono font-bold text-slate-900">id: 001</div>
              <div className="text-[10px] font-mono text-slate-500">pw: vendhan</div>
            </button>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 px-6 pt-2">
          <button
            onClick={() => setActiveTab('CREDENTIALS')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'CREDENTIALS'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            ID & Password Sign In
          </button>
          <button
            onClick={() => setActiveTab('WHATSAPP_OTP')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'WHATSAPP_OTP'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            WhatsApp OTP
          </button>
          <button
            onClick={() => setActiveTab('MONGODB')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'MONGODB'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            MongoDB
            <span
              className={`w-2 h-2 rounded-full ${
                mongoStatus.connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
              }`}
            />
          </button>
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto flex-1">
          {activeTab === 'CREDENTIALS' && (
            <form onSubmit={handleCredentialLogin} className="space-y-4">
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  User ID / Student Code
                </label>
                <div className="relative">
                  <UserCircle className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 font-mono font-bold"
                    placeholder="e.g. admin, coach, or 001"
                    required
                  />
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Admins: <code>admin</code> • Coaches: <code>coach</code> • Students: <code>001</code>, <code>002</code>, <code>003</code>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 font-mono font-bold"
                    placeholder="Enter password"
                    required
                  />
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Admin: <code>admin123</code> • Coach: <code>coach123</code> • Student: <code>vendhan</code>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Sign In to Vendhan Sports Academy</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {activeTab === 'WHATSAPP_OTP' && (
            <div className="space-y-4">
              {!otpSent ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Parent Mobile Phone (WhatsApp Registered)
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-emerald-600 absolute left-3 top-3" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl font-medium font-mono"
                        placeholder="+1 (987) 654-3210"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setOtpSent(true)}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 shadow-sm"
                  >
                    Send One-Time Password via WhatsApp
                  </button>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-900 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>WhatsApp OTP delivered to {phone}. Auto-filled code: <strong>{otpCode}</strong></span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Enter 6-Digit WhatsApp OTP</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      className="w-full text-center text-2xl font-mono tracking-widest py-2.5 border-2 border-emerald-200 rounded-xl bg-emerald-50/30 font-bold text-emerald-950"
                    />
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <label className="block text-xs font-bold text-slate-900 mb-1.5 flex items-center justify-between">
                      <span>Select Child Profile</span>
                      <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-100 px-2 py-0.5 rounded-full">
                        2 Profiles Linked
                      </span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedChildPicker('stu-active-001')}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          selectedChildPicker === 'stu-active-001' || !selectedChildPicker
                            ? 'border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-500'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="text-xs font-bold text-slate-900">Leo Vendhan (001)</div>
                        <div className="text-[10px] text-slate-500">Tennis & Swimming</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedChildPicker('stu-active-002')}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          selectedChildPicker === 'stu-active-002'
                            ? 'border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-500'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="text-xs font-bold text-slate-900">Maya Vendhan (002)</div>
                        <div className="text-[10px] text-slate-500">Badminton & Athletics</div>
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const parentUser = INITIAL_USERS.find((u) => u.role === 'STUDENT_PARENT') || INITIAL_USERS[3];
                      loginAsUser(parentUser);
                      if (selectedChildPicker) {
                        setActiveChildId(selectedChildPicker);
                      }
                      onClose();
                    }}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 shadow-sm"
                  >
                    Verify & Open Mother&apos;s View
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'MONGODB' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-slate-800">
                    <Database className="w-4 h-4 text-emerald-600" />
                    MongoDB Connection Status
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      mongoStatus.connected
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}
                  >
                    {mongoStatus.connected ? 'Connected' : 'Ready for URL'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{mongoStatus.message}</p>
                {mongoStatus.maskedUri && (
                  <div className="text-[11px] font-mono text-slate-500 bg-white p-2 rounded-lg border border-slate-200 truncate">
                    URI: {mongoStatus.maskedUri}
                  </div>
                )}
              </div>

              <form onSubmit={handleConnectMongo} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Enter / Update MongoDB Connection URL
                  </label>
                  <input
                    type="password"
                    value={mongoUriInput}
                    onChange={(e) => setMongoUriInput(e.target.value)}
                    placeholder="mongodb+srv://<user>:<password>@cluster.mongodb.net/vendhan_sports_academy"
                    className="w-full p-2.5 border rounded-xl font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    You can paste your MongoDB connection string here whenever ready.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={mongoLoading || !mongoUriInput.trim()}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs transition-colors shadow-sm flex items-center justify-center gap-1.5"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>{mongoLoading ? 'Connecting to Cluster...' : 'Connect to MongoDB Database'}</span>
                </button>
              </form>

              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-[11px] text-amber-950 space-y-1">
                <span className="font-bold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  MongoDB Atlas Connection Tips:
                </span>
                <ul className="list-disc pl-4 space-y-0.5 text-amber-900 text-[10px]">
                  <li>Create a user in <strong>MongoDB Atlas &gt; Database Access</strong> with password.</li>
                  <li>If your password has symbols like <code>@</code>, <code>#</code>, or <code>:</code>, URL-encode them (e.g. <code>@</code> → <code>%40</code>).</li>
                  <li>In <strong>Network Access</strong>, whitelist <code>0.0.0.0/0</code> (Allow Access from Anywhere) for cloud deployment.</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-slate-400" />
            <span>Vendhan Sports Academy • Multi-Tenant RBAC</span>
          </div>
          <span className="font-mono text-slate-400">Production v3.0</span>
        </div>
      </div>
    </div>
  );
};
