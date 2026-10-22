import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  CreditCard,
  DollarSign,
  Send,
  CheckCircle2,
  AlertCircle,
  Plus,
  Receipt,
  X,
  FileText,
  Search,
} from 'lucide-react';
import { StudentInvoice } from '../../types';

export const FeesManagement: React.FC = () => {
  const {
    invoices,
    activeStudents,
    generateNewInvoice,
    payInvoice,
    sendWhatsAppPaymentReminder,
  } = useApp();

  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'PENDING' | 'OVERDUE'>('ALL');
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [viewReceipt, setViewReceipt] = useState<StudentInvoice | null>(null);

  // New Invoice Form
  const [selectedStudentId, setSelectedStudentId] = useState(activeStudents[0]?.id || '');
  const [amount, setAmount] = useState(380);
  const [period, setPeriod] = useState('November 2026');
  const [dueDate, setDueDate] = useState('2026-11-25');
  const [sports, setSports] = useState('Tennis High Performance');

  const totalInvoiced = invoices.reduce((acc, curr) => acc + curr.amount, 0);
  const totalPaid = invoices.filter((i) => i.status === 'PAID').reduce((acc, curr) => acc + curr.amount, 0);
  const totalPending = invoices.filter((i) => i.status !== 'PAID').reduce((acc, curr) => acc + curr.amount, 0);
  const collectionRate = totalInvoiced > 0 ? Math.round((totalPaid / totalInvoiced) * 100) : 0;

  const filteredInvoices = invoices.filter((inv) => {
    const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    const matchesSearch =
      inv.studentName.toLowerCase().includes(search.toLowerCase()) ||
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      inv.parentPhone.includes(search);
    return matchesStatus && matchesSearch;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const student = activeStudents.find((s) => s.id === selectedStudentId);
    if (!student) return;

    generateNewInvoice({
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      parentName: student.parentName,
      parentPhone: student.parentPhone,
      amount: Number(amount),
      period,
      sportsIncluded: sports.split(',').map((s) => s.trim()),
      dueDate,
      status: 'PENDING',
    });

    setIsCreateOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Stats */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Student Fees & Financials Engine</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated recurring invoice generation, Stripe/Razorpay webhooks, and WhatsApp dues reminders.
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Generate New Invoice</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold text-slate-600">Total Billed</span>
            <DollarSign className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">${totalInvoiced.toLocaleString()}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Across {invoices.length} issued invoices</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold text-emerald-700">Collected Revenue</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">${totalPaid.toLocaleString()}</div>
          <div className="text-[10px] text-emerald-600 mt-0.5">{collectionRate}% collection efficiency</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold text-amber-700">Pending & Dues</span>
            <AlertCircle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700">${totalPending.toLocaleString()}</div>
          <div className="text-[10px] text-amber-600 mt-0.5">Automated WhatsApp links active</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold text-indigo-700">Payment Gateway</span>
            <CreditCard className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-sm font-bold text-slate-900">Stripe & Razorpay</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Webhooks active & verified</div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoices by student, INV number, or parent phone..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm"
          />
        </div>
        <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 text-xs shadow-sm">
          {(['ALL', 'PAID', 'PENDING', 'OVERDUE'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Table */}
      {/* Mobile Invoice Cards (<md) */}
      <div className="md:hidden space-y-3">
        {filteredInvoices.length === 0 ? (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
            No invoices match your selected filter.
          </div>
        ) : (
          filteredInvoices.map((inv) => (
            <div
              key={inv.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 text-xs">
                      {inv.invoiceNumber}
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        inv.status === 'PAID'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : inv.status === 'OVERDUE'
                          ? 'bg-rose-50 text-rose-800 border border-rose-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </div>
                  <div className="font-bold text-slate-900 text-sm mt-1">{inv.studentName}</div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    {inv.parentName} • {inv.parentPhone}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xl font-black text-slate-900">${inv.amount.toFixed(2)}</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">Due: {inv.dueDate}</div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <span className="font-semibold text-slate-700">{inv.period}: </span>
                <span className="text-slate-500">{inv.sportsIncluded.join(', ')}</span>
              </div>

              {/* Mobile Actions */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                {inv.status === 'PAID' ? (
                  <button
                    onClick={() => setViewReceipt(inv)}
                    className="flex-1 py-2 px-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center justify-center gap-1.5 min-h-[40px]"
                  >
                    <Receipt className="w-3.5 h-3.5 text-slate-500" />
                    <span>View Official Receipt</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => sendWhatsAppPaymentReminder(inv.id)}
                      className="flex-1 py-2 px-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 font-bold text-xs flex items-center justify-center gap-1.5 min-h-[40px]"
                      title="Send payment link to guardian phone"
                    >
                      <Send className="w-3.5 h-3.5 text-emerald-600" />
                      <span>WhatsApp Link</span>
                    </button>
                    <button
                      onClick={() => payInvoice(inv.id, 'Admin Override (Cash / POS)')}
                      className="py-2 px-3 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-bold text-xs min-h-[40px]"
                    >
                      <span>Mark Paid</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Invoices Table (>=md) */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Invoice #</th>
                <th className="py-3.5 px-4">Student & Guardian</th>
                <th className="py-3.5 px-4">Period & Sports</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Due Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4">
                    <span className="font-mono font-bold text-slate-900 text-xs">
                      {inv.invoiceNumber}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <div>
                      <div className="font-bold text-slate-900">{inv.studentName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {inv.parentName} • {inv.parentPhone}
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div>
                      <div className="font-semibold text-slate-800">{inv.period}</div>
                      <div className="text-[10px] text-slate-500 truncate max-w-xs">
                        {inv.sportsIncluded.join(', ')}
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-black text-slate-900">
                    ${inv.amount.toFixed(2)}
                  </td>

                  <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                    {inv.dueDate}
                  </td>

                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        inv.status === 'PAID'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : inv.status === 'OVERDUE'
                          ? 'bg-rose-50 text-rose-800 border border-rose-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {inv.status === 'PAID' ? (
                        <button
                          onClick={() => setViewReceipt(inv)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-[11px]"
                        >
                          <Receipt className="w-3.5 h-3.5 text-slate-500" />
                          <span>Receipt</span>
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => sendWhatsAppPaymentReminder(inv.id)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 font-bold text-[11px]"
                            title="Send payment link to guardian phone"
                          >
                            <Send className="w-3 h-3 text-emerald-600" />
                            <span>WhatsApp Link</span>
                          </button>
                          <button
                            onClick={() => payInvoice(inv.id, 'Admin Override (Cash / POS)')}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 font-bold text-[11px]"
                          >
                            <span>Mark Paid</span>
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Invoice Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-base">Generate Academy Invoice</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Select Student</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full p-2 border rounded-xl bg-white font-medium"
                >
                  {activeStudents.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.firstName} {s.lastName} ({s.studentCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Billing Amount ($)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full p-2 border rounded-xl font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full p-2 border rounded-xl font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Billing Period</label>
                <input
                  type="text"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="w-full p-2 border rounded-xl"
                  placeholder="November 2026 / Q4"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Enrolled Programs</label>
                <input
                  type="text"
                  value={sports}
                  onChange={(e) => setSports(e.target.value)}
                  className="w-full p-2 border rounded-xl"
                  placeholder="Tennis High Performance, Swimming"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 border rounded-xl text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700"
                >
                  Create & Send Dues
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {viewReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">Payment Receipt</h3>
              </div>
              <button onClick={() => setViewReceipt(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Receipt #:</span>
                <span className="font-bold">{viewReceipt.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Transaction ID:</span>
                <span className="text-indigo-600">{viewReceipt.transactionId || 'ch_live_382901'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Student Athlete:</span>
                <span className="font-bold">{viewReceipt.studentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Billed Guardian:</span>
                <span>{viewReceipt.parentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Paid Timestamp:</span>
                <span>{viewReceipt.paidAt ? new Date(viewReceipt.paidAt).toLocaleString() : 'Settled'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Method:</span>
                <span>{viewReceipt.paymentMethod || 'Stripe Electronic Card'}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-black text-slate-900">
                <span>Amount Paid:</span>
                <span>${viewReceipt.amount.toFixed(2)} USD</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setViewReceipt(null)}
                className="px-4 py-2 border rounded-xl text-xs font-semibold text-slate-700"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
