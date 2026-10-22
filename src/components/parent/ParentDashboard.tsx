import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Trophy,
  Star,
  Calendar,
  CreditCard,
  Heart,
  CheckCircle2,
  Clock,
  Download,
  AlertCircle,
  FileCheck,
  Flame,
  Zap,
  Target,
  Shield,
  Phone,
  Sparkles,
  Receipt,
  X,
} from 'lucide-react';
import { StudentInvoice } from '../../types';

interface ParentDashboardProps {
  onNavigate: (tab: string) => void;
  openEmergencyDrawer: () => void;
}

export const ParentDashboard: React.FC<ParentDashboardProps> = ({ onNavigate }) => {
  const {
    currentUser,
    activeChild,
    activeChildId,
    setActiveChildId,
    activeStudents,
    invoices,
    payInvoice,
    studentAttendance,
    bookings,
  } = useApp();

  const [paymentModalInvoice, setPaymentModalInvoice] = useState<StudentInvoice | null>(null);
  const [selectedPayMethod, setSelectedPayMethod] = useState('Credit Card (Stripe)');
  const [cardNumber, setCardNumber] = useState('•••• •••• •••• 4242');
  const [isPaying, setIsPaying] = useState(false);

  // Linked children for this parent
  const linkedChildren = activeStudents.filter((s) => {
    if (currentUser.parentLinkedStudentIds && currentUser.parentLinkedStudentIds.length > 0) {
      return currentUser.parentLinkedStudentIds.includes(s.id);
    }
    return s.parentUserId === currentUser.id || s.parentPhone === currentUser.phoneNumber;
  });

  const children = linkedChildren.length > 0 ? linkedChildren : activeStudents.slice(0, 2);
  const child = activeChild || children[0];

  // Invoices for this child or parent
  const childInvoices = invoices.filter(
    (inv) => inv.studentId === child?.id || inv.parentPhone === currentUser.phoneNumber
  );

  // Attendance for this child
  const childAttendance = studentAttendance.filter((a) => a.studentId === child?.id);
  const presentCount = childAttendance.filter((a) => a.status === 'PRESENT').length;
  const attendanceRate = childAttendance.length > 0 ? Math.round((presentCount / childAttendance.length) * 100) : 96;

  const handleExecutePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalInvoice) return;
    setIsPaying(true);
    setTimeout(() => {
      payInvoice(paymentModalInvoice.id, `${selectedPayMethod} - Ending in 4242`);
      setIsPaying(false);
      setPaymentModalInvoice(null);
    }, 800);
  };

  return (
    <div className="space-y-6">
      {/* Multi-Child Profile Switcher Header */}
      {children.length > 1 && (
        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2">
              Select Child Profile:
            </span>
            <div className="flex gap-2">
              {children.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveChildId(c.id)}
                  className={`flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    c.id === child?.id
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <img
                    src={c.photoUrl}
                    alt={c.firstName}
                    className="w-5 h-5 rounded-full object-cover border border-white/50"
                  />
                  <span>
                    {c.firstName} {c.lastName}
                  </span>
                  <span className="text-[10px] opacity-75 hidden sm:inline">
                    ({c.enrolledSports.join(', ')})
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
            Mother&apos;s View: Context-Isolated Guardian Portal
          </div>
        </div>
      )}

      {/* Child Hero Showcase */}
      {child && (
        <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-5">
              <img
                src={child.photoUrl}
                alt={child.firstName}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-emerald-400 shadow-xl shrink-0"
              />
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-black">{child.firstName} {child.lastName}</h1>
                  <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 font-bold">
                    {child.studentCode}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {child.enrolledSports.map((sp) => (
                    <span
                      key={sp}
                      className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/10 text-emerald-200 border border-white/15"
                    >
                      {sp}
                    </span>
                  ))}
                  <span className="text-xs text-slate-300">
                    • Coach: <strong className="text-white">{child.primaryAssignedCoachName}</strong>
                  </span>
                </div>

                <div className="text-xs text-slate-300 mt-1 flex items-center gap-3">
                  <span>Shift: {child.batchShift}</span>
                  <span className="inline-flex items-center gap-1 text-rose-300 font-bold">
                    <Heart className="w-3.5 h-3.5 fill-rose-400 text-rose-400" />
                    Blood Type: {child.bloodGroup}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
              <button
                onClick={() => onNavigate('facilities')}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs transition-colors shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                <span>Book Practice Court</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4-Pillar Visual Skill Progression Card */}
      {child && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <h3 className="font-extrabold text-slate-900 text-base">
                  4-Pillar Athletic Skill Progression Card
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Evaluated by Head Coach {child.skillRatings.updatedByCoachName} on {child.skillRatings.lastUpdated}
              </p>
            </div>
            <div className="flex items-center gap-1 bg-amber-50 px-3 py-1 rounded-xl border border-amber-200 text-amber-900 text-xs font-bold">
              <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
              <span>
                Average Rating: {(
                  (child.skillRatings.stamina +
                    child.skillRatings.agility +
                    child.skillRatings.technique +
                    child.skillRatings.discipline) /
                  4
                ).toFixed(1)}{' '}
                / 5.0
              </span>
            </div>
          </div>

          {/* Pillars Visual Progress Bars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Stamina */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-amber-950">
                <span className="flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-600" /> Stamina
                </span>
                <span className="text-base font-black text-amber-700">{child.skillRatings.stamina} / 5</span>
              </div>
              <div className="w-full bg-amber-200/60 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${(child.skillRatings.stamina / 5) * 100}%` }}
                />
              </div>
              <div className="text-[10px] text-amber-900/80">Aerobic capacity & recovery</div>
            </div>

            {/* Agility */}
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-blue-950">
                <span className="flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-blue-600" /> Agility
                </span>
                <span className="text-base font-black text-blue-700">{child.skillRatings.agility} / 5</span>
              </div>
              <div className="w-full bg-blue-200/60 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${(child.skillRatings.agility / 5) * 100}%` }}
                />
              </div>
              <div className="text-[10px] text-blue-900/80">Footwork & lateral speed</div>
            </div>

            {/* Technique */}
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-950">
                <span className="flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-emerald-600" /> Technique
                </span>
                <span className="text-base font-black text-emerald-700">{child.skillRatings.technique} / 5</span>
              </div>
              <div className="w-full bg-emerald-200/60 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${(child.skillRatings.technique / 5) * 100}%` }}
                />
              </div>
              <div className="text-[10px] text-emerald-900/80">Biomechanics & precision</div>
            </div>

            {/* Discipline */}
            <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-purple-950">
                <span className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-purple-600" /> Discipline
                </span>
                <span className="text-base font-black text-purple-700">{child.skillRatings.discipline} / 5</span>
              </div>
              <div className="w-full bg-purple-200/60 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-purple-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${(child.skillRatings.discipline / 5) * 100}%` }}
                />
              </div>
              <div className="text-[10px] text-purple-900/80">Work ethic & sportsmanship</div>
            </div>
          </div>

          {/* Coach's Evaluation Box */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Coach Assessment & Recommendation:
            </span>
            <p className="text-xs text-slate-700 italic leading-relaxed">
              &ldquo;{child.skillRatings.coachFeedbackNotes}&rdquo;
            </p>
          </div>
        </div>
      )}

      {/* Achievements Wall & Badges Showcase */}
      {child && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h3 className="font-extrabold text-slate-900 text-base">
                Achievements Wall & Certified Badges
              </h3>
            </div>
            <span className="text-xs text-slate-500">{child.achievements.length} Honors Awarded</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {child.achievements.map((ach) => (
              <div
                key={ach.id}
                className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/80 via-orange-50/50 to-white border border-amber-200 shadow-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200/80 text-amber-900 font-mono">
                    {ach.medalType || 'Honor'}
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm leading-tight">{ach.title}</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-snug">{ach.description}</p>
                </div>
                <div className="text-[10px] text-slate-400 pt-1 border-t border-amber-100">
                  {ach.sport} • {ach.awardedDate} by {ach.coachName}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two Column Section: Live Academy Pulse + Invoices & Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Academy Live Pulse & Upcoming Events */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              <h3 className="font-extrabold text-slate-900 text-base">Academy Live Pulse & Clinics</h3>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              Active Term
            </span>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-1 text-xs">
              <div className="flex items-center justify-between font-bold text-indigo-950">
                <span>Regional Youth Championship Trials</span>
                <span className="text-[10px] text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                  Oct 28–30
                </span>
              </div>
              <p className="text-[11px] text-slate-600">
                Official ranking tournament for State U-12 and U-14 squads. Venue: Vendhan Center Courts 1–4.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-1 text-xs">
              <div className="flex items-center justify-between font-bold text-emerald-950">
                <span>Sports Nutrition & Hydration Workshop</span>
                <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Nov 04
                </span>
              </div>
              <p className="text-[11px] text-slate-600">
                Dr. Gregory House guest lecture on optimal youth recovery windows and electrolyte balance.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
              <div className="flex items-center justify-between font-bold text-slate-900">
                <span>Winter High-Performance Intensive Camp</span>
                <span className="text-[10px] text-slate-600 bg-slate-200 px-2 py-0.5 rounded-full">
                  Dec 15–22
                </span>
              </div>
              <p className="text-[11px] text-slate-600">
                Intensive 2-a-day tactical training with guest Olympic master coaches. Early registration open.
              </p>
            </div>
          </div>
        </div>

        {/* Self-Service: Fee Invoices & Payment Engine */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              <h3 className="font-extrabold text-slate-900 text-base">Academy Fees & Receipts</h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">Stripe & Razorpay Integration</span>
          </div>

          <div className="space-y-3">
            {childInvoices.map((inv) => (
              <div
                key={inv.id}
                className="p-4 rounded-2xl border border-slate-200 hover:border-slate-300 transition-all flex items-center justify-between gap-4 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900">{inv.invoiceNumber}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        inv.status === 'PAID'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : inv.status === 'OVERDUE'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </div>
                  <div className="font-bold text-slate-800 text-sm mt-0.5">${inv.amount.toFixed(2)}</div>
                  <div className="text-[11px] text-slate-500">
                    {inv.period} • Due: {inv.dueDate}
                  </div>
                </div>

                <div>
                  {inv.status === 'PAID' ? (
                    <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                      <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Receipt Paid</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => setPaymentModalInvoice(inv)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs transition-colors shadow-sm flex items-center gap-1.5"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Pay Now</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payment Checkout Modal (Stripe Style) */}
      {paymentModalInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-slate-900 text-base">Secure Academy Payment</h3>
              </div>
              <button
                onClick={() => setPaymentModalInvoice(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-emerald-800 font-semibold block">Total Amount Due</span>
                <span className="text-2xl font-black text-emerald-950">
                  ${paymentModalInvoice.amount.toFixed(2)} USD
                </span>
              </div>
              <span className="text-xs font-mono text-emerald-800 bg-white/80 px-2 py-1 rounded-lg border border-emerald-200">
                {paymentModalInvoice.invoiceNumber}
              </span>
            </div>

            <form onSubmit={handleExecutePayment} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Select Gateway</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPayMethod('Stripe Credit Card')}
                    className={`p-2.5 rounded-xl border text-left font-bold transition-all ${
                      selectedPayMethod.includes('Stripe')
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    Stripe Card
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPayMethod('Razorpay Instant UPI')}
                    className={`p-2.5 rounded-xl border text-left font-bold transition-all ${
                      selectedPayMethod.includes('Razorpay')
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    Razorpay UPI
                  </button>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Card Number</label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full p-2.5 border rounded-xl font-mono text-xs font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Expiry Date</label>
                  <input
                    type="text"
                    defaultValue="08/29"
                    className="w-full p-2.5 border rounded-xl font-mono text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">CVC Code</label>
                  <input
                    type="password"
                    defaultValue="891"
                    maxLength={4}
                    className="w-full p-2.5 border rounded-xl font-mono text-xs font-bold"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isPaying}
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 mt-2"
              >
                {isPaying ? (
                  <span>Contacting Stripe Gateway...</span>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>Pay ${paymentModalInvoice.amount.toFixed(2)} & Generate Receipt</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
