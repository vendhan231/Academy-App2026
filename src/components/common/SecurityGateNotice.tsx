import React from 'react';
import { ShieldAlert, ArrowRight, Lock } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface SecurityGateNoticeProps {
  moduleName: string;
  requiredRole?: string;
  reason?: string;
}

export const SecurityGateNotice: React.FC<SecurityGateNoticeProps> = ({
  moduleName,
  requiredRole = 'ADMIN',
  reason = 'Strict Role-Based Access Control (RBAC) blocks this resource. Student archives and bulk ingestion are strictly restricted to Academy Administrators to prevent unauthorized student data exposure.',
}) => {
  const { switchRole, currentRole } = useApp();

  return (
    <div className="bg-white rounded-2xl border border-rose-200/80 shadow-sm p-8 text-center max-w-xl mx-auto my-12">
      <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto mb-4 text-rose-600">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 mb-3">
        <Lock className="w-3.5 h-3.5" /> RBAC Access Denied: 403 Forbidden
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-2">
        {moduleName} is Protected
      </h3>
      <p className="text-sm text-slate-600 mb-6 leading-relaxed">
        {reason}
      </p>

      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-left mb-6 text-xs space-y-1.5">
        <div className="flex justify-between">
          <span className="text-slate-500">Current Session Role:</span>
          <span className="font-semibold text-slate-800">{currentRole}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Required Minimum Role:</span>
          <span className="font-semibold text-rose-600">{requiredRole}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Policy Rule:</span>
          <span className="font-mono text-slate-700">Strictly Forbidden for Coach & Parent</span>
        </div>
      </div>

      <button
        onClick={() => switchRole('ADMIN')}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white font-medium text-sm hover:bg-slate-800 transition-all shadow-sm"
      >
        <span>Switch to Admin Persona to View</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};
