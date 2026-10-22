import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Bell,
  CheckCheck,
  AlertTriangle,
  Send,
  ShieldCheck,
  Phone,
  Flame,
  CloudRain,
  Bus,
  MapPin,
  ExternalLink,
} from 'lucide-react';

interface EmergencyBroadcastDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToCenter: () => void;
}

export const EmergencyBroadcastDrawer: React.FC<EmergencyBroadcastDrawerProps> = ({
  isOpen,
  onClose,
  onNavigateToCenter,
}) => {
  const { broadcasts, currentRole, currentUser } = useApp();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-slate-200">
          {/* Drawer Header */}
          <div className="p-5 bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-sm">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm tracking-tight">WhatsApp Emergency Hub</h3>
                <p className="text-[11px] text-amber-200/80">Meta HSM Certified Broadcast Stream</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Info bar */}
          <div className="p-3 bg-amber-50/80 border-b border-amber-200/70 text-[11px] text-amber-950 flex items-center justify-between">
            <span className="font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Cloud API Webhook: Active</span>
            </span>
            <button
              onClick={() => {
                onClose();
                onNavigateToCenter();
              }}
              className="font-bold text-amber-900 hover:text-amber-950 underline flex items-center gap-1"
            >
              <span>Broadcast Desk</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          {/* Broadcasts Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {broadcasts.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No emergency broadcasts dispatched yet.
              </div>
            ) : (
              broadcasts.map((b) => (
                <div
                  key={b.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 font-mono">
                      {b.channel}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(b.sentAt).toLocaleDateString()} at {new Date(b.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <h4 className="font-black text-slate-900 text-sm leading-snug">
                    {b.templateTitle}
                  </h4>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-700 leading-relaxed font-sans">
                    {b.messageContent}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                    <span>Sender: <strong>{b.senderName}</strong></span>
                    <span className="flex items-center gap-1 text-emerald-600 font-bold">
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>{b.deliveredCount} Delivered</span>
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Drawer Footer */}
          <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              Role: <strong className="text-slate-800">{currentRole}</strong>
            </span>
            {(currentRole === 'ADMIN' || currentRole === 'COACH') && (
              <button
                onClick={() => {
                  onClose();
                  onNavigateToCenter();
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-sm transition-colors flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Compose New Alert</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
