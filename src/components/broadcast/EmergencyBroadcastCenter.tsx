import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Bell,
  Send,
  Smartphone,
  ShieldCheck,
  CheckCheck,
  AlertTriangle,
  Users,
  Flame,
  CloudRain,
  Bus,
  MapPin,
  Clock,
  Sparkles,
  Lock,
} from 'lucide-react';
import { EmergencyBroadcast } from '../../types';
import { SecurityGateNotice } from '../common/SecurityGateNotice';

export const EmergencyBroadcastCenter: React.FC = () => {
  const { currentRole, currentUser, activeStudents, broadcasts, sendEmergencyBroadcast } = useApp();

  // RBAC Guard: Inbound Receiver Only for parents
  const canSend = currentRole === 'ADMIN' || currentRole === 'COACH';

  // Form State
  const [templateKey, setTemplateKey] = useState<EmergencyBroadcast['templateKey']>('WEATHER_CLOSURE');
  const [targetType, setTargetType] = useState<'ALL_PARENTS' | 'SPORT' | 'BATCH'>('ALL_PARENTS');
  const [targetValue, setTargetValue] = useState('Tennis');
  const [channel, setChannel] = useState<'WHATSAPP' | 'SMS_FALLBACK'>('WHATSAPP');
  const [customTitle, setCustomTitle] = useState('Flash Thunderstorm Warning: Outdoor Sessions Moved Indoors');
  const [customBody, setCustomBody] = useState(
    '🚨 VENDHAN SPORTS ACADEMY URGENT ALERT: Due to severe thunderstorm warnings, all outdoor court and turf sessions for this afternoon are shifted to Indoor Multi-Sport Arena & Gym Studio B. Bus departures remain on normal schedule. Please verify pickup bays in your parent portal.'
  );

  const TEMPLATES: Record<
    EmergencyBroadcast['templateKey'],
    { title: string; body: string; icon: React.ReactNode }
  > = {
    WEATHER_CLOSURE: {
      title: 'Flash Weather Alert: Outdoor Sessions Moved Indoors',
      body: '🚨 VENDHAN SPORTS ACADEMY URGENT ALERT: Due to severe thunderstorm warnings, all outdoor court and turf sessions for this afternoon are shifted to Indoor Multi-Sport Arena & Gym Studio B. Bus departures remain on normal schedule. Please verify pickup bays in your parent portal.',
      icon: <CloudRain className="w-4 h-4 text-blue-500" />,
    },
    VENUE_CHANGE: {
      title: 'Venue Relocation: Academy Match Transferred to Stadium 2',
      body: '🏟️ VENDHAN NOTICE: Due to scheduled court surface resurfacing, today’s 16:30 Tennis Match play has been relocated to Center Court 2. All equipment and warm-up areas are prepared.',
      icon: <MapPin className="w-4 h-4 text-amber-500" />,
    },
    TRANSPORT_DELAY: {
      title: 'Academy Transit Bus Route 4: 20-Minute Delay',
      body: '🚌 TRANSPORT ADVISORY: Academy Shuttle Bus #4 (West Hills / North Ridge route) is delayed by approximately 20 minutes due to unexpected road construction on Highway 101. Student tracking is live.',
      icon: <Bus className="w-4 h-4 text-emerald-500" />,
    },
    URGENT_MEDICAL: {
      title: 'Medical Advisory: Severe Heat Wave Protocol Enacted',
      body: '🌡️ MEDICAL BULLETIN: Ambient court temperatures have exceeded 34°C. Mandatory 15-minute hydration and shaded recovery intervals are enforced for all active training sessions today.',
      icon: <AlertTriangle className="w-4 h-4 text-rose-500" />,
    },
    TOURNAMENT_ALERT: {
      title: 'Tournament Fixture: Kickoff Moved 45 Minutes Earlier',
      body: '🏆 TOURNAMENT UPDATE: Saturday junior tournament match timings have shifted 45 mins earlier to accommodate broadcast schedule. Report to locker rooms at 07:00 AM sharp.',
      icon: <Flame className="w-4 h-4 text-orange-500" />,
    },
    CUSTOM: {
      title: 'Urgent Academy Bulletin',
      body: '📢 VENDHAN SPORTS ACADEMY BROADCAST: Official notification from Academy Directors regarding training schedule adjustments.',
      icon: <Bell className="w-4 h-4 text-indigo-500" />,
    },
  };

  const handleTemplateSelect = (key: EmergencyBroadcast['templateKey']) => {
    setTemplateKey(key);
    setCustomTitle(TEMPLATES[key].title);
    setCustomBody(TEMPLATES[key].body);
  };

  const handleDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    sendEmergencyBroadcast({
      targetType,
      targetValue: targetType === 'ALL_PARENTS' ? undefined : targetValue,
      templateKey,
      templateTitle: customTitle,
      messageContent: customBody,
      channel,
    });
  };

  // Recipient calculation
  let recipientCount = activeStudents.length;
  if (targetType === 'SPORT') {
    recipientCount = activeStudents.filter((s) => s.enrolledSports.includes(targetValue)).length;
  } else if (targetType === 'BATCH') {
    recipientCount = activeStudents.filter((s) => s.batchShift === targetValue).length;
  }
  if (recipientCount === 0) recipientCount = 1;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30 mb-2">
              <ShieldCheck className="w-3.5 h-3.5" /> WhatsApp Business Cloud API (Meta Verified)
            </div>
            <h1 className="text-2xl sm:text-3xl font-black">
              Emergency Broadcast Subsystem
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1 leading-relaxed">
              Dispatches Meta-compliant HSM templates to parent phones within seconds. Automatic 3-minute webhook failover to Twilio/AWS SMS gateway if WhatsApp encounters delivery delays.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-slate-800 text-amber-300 border border-slate-700 text-xs font-mono font-bold">
              Target Parents: {recipientCount} Recipients
            </span>
          </div>
        </div>
      </div>

      {!canSend ? (
        <SecurityGateNotice
          moduleName="Emergency Broadcast Dispatcher"
          requiredRole="ADMIN or COACH"
          reason="Student / Parent accounts are Inbound Receivers only. Only Academy Administrators and authorized Coaches hold cryptographic keys to initiate mass broadcasts."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Broadcast Configurator Form (7 Cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-base">Configure Alert Dispatch</h3>
              <span className="text-xs text-slate-500 font-mono">Channel: WhatsApp HSM</span>
            </div>

            {/* Step 1: Pre-approved Meta HSM Templates */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2">
                1. Select Meta-Compliant HSM Template
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(Object.keys(TEMPLATES) as EmergencyBroadcast['templateKey'][]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleTemplateSelect(key)}
                    className={`p-3 rounded-2xl border text-left text-xs transition-all flex items-start gap-2 ${
                      templateKey === key
                        ? 'border-amber-500 bg-amber-50/70 font-bold text-amber-950 ring-1 ring-amber-400'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">{TEMPLATES[key].icon}</div>
                    <span className="truncate leading-snug">{key.replace('_', ' ')}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Target Audience Segmentation */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2">
                2. Target Audience Segmentation
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setTargetType('ALL_PARENTS')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-center ${
                    targetType === 'ALL_PARENTS'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  All Parents ({activeStudents.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTargetType('SPORT')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-center ${
                    targetType === 'SPORT'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  By Sport
                </button>
                <button
                  type="button"
                  onClick={() => setTargetType('BATCH')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-center ${
                    targetType === 'BATCH'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  By Batch / Shift
                </button>
              </div>

              {targetType === 'SPORT' && (
                <div className="mt-2">
                  <select
                    value={targetValue}
                    onChange={(e) => setTargetValue(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-900"
                  >
                    <option value="Tennis">All Tennis Athletes</option>
                    <option value="Football">All Football Athletes</option>
                    <option value="Swimming">All Swimming Athletes</option>
                    <option value="Badminton">All Badminton Athletes</option>
                  </select>
                </div>
              )}

              {targetType === 'BATCH' && (
                <div className="mt-2">
                  <select
                    value={targetValue}
                    onChange={(e) => setTargetValue(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-900"
                  >
                    <option value="Morning 06:00 - 08:00 Squad">Morning 06:00 - 08:00 Squad</option>
                    <option value="Evening Elite 16:30 - 18:30">Evening Elite 16:30 - 18:30</option>
                  </select>
                </div>
              )}
            </div>

            {/* Step 3: Message Content */}
            <form onSubmit={handleDispatch} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Alert Headline / Subject</label>
                <input
                  type="text"
                  required
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full p-2.5 border rounded-xl font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  HSM Message Body (WhatsApp Payload)
                </label>
                <textarea
                  required
                  value={customBody}
                  onChange={(e) => setCustomBody(e.target.value)}
                  className="w-full p-3 border rounded-xl h-28 font-sans text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              {/* Failover Channel Selector */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block text-xs">Failover Delivery Channel</span>
                  <span className="text-[11px] text-slate-500">
                    Auto-switch to SMS Gateway if WhatsApp webhook pending &gt; 3 mins
                  </span>
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setChannel('WHATSAPP')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                      channel === 'WHATSAPP'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white border text-slate-600'
                    }`}
                  >
                    WhatsApp Primary
                  </button>
                  <button
                    type="button"
                    onClick={() => setChannel('SMS_FALLBACK')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                      channel === 'SMS_FALLBACK'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border text-slate-600'
                    }`}
                  >
                    SMS Force
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4 fill-current" />
                <span>Trigger WhatsApp Cloud Broadcast to {recipientCount} Guardians</span>
              </button>
            </form>
          </div>

          {/* Right: Simulated Mobile Phone Receiver Preview (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col items-center w-full">
            <div className="w-full max-w-[320px] sm:max-w-sm bg-slate-950 rounded-[36px] sm:rounded-[44px] p-3 sm:p-4 border-4 sm:border-[6px] border-slate-800 shadow-2xl relative mx-auto">
              {/* Notch */}
              <div className="w-32 h-5 bg-slate-800 rounded-b-xl mx-auto mb-3 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-slate-950" />
              </div>

              {/* Phone Header */}
              <div className="bg-[#075E54] text-white p-3 rounded-2xl flex items-center justify-between mb-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-400 text-slate-950 font-bold flex items-center justify-center text-xs">
                    VA
                  </div>
                  <div>
                    <div className="font-bold text-xs flex items-center gap-1">
                      <span>Vendhan Sports Academy</span>
                      <CheckCheck className="w-3.5 h-3.5 text-emerald-300" />
                    </div>
                    <div className="text-[10px] text-emerald-200">Official Academy Broadcast</div>
                  </div>
                </div>
                <span className="text-[10px] text-emerald-200 font-mono">10:42 PM</span>
              </div>

              {/* Chat Bubble Simulation */}
              <div className="space-y-3 min-h-[340px] flex flex-col justify-end p-2 bg-[#E5DDD5] rounded-2xl">
                <div className="bg-white p-3.5 rounded-2xl rounded-tl-xs shadow-sm max-w-[90%] space-y-2 border border-slate-200/50">
                  <div className="flex items-center gap-1.5 text-rose-700 font-extrabold text-[11px] pb-1 border-b border-slate-100">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>{customTitle}</span>
                  </div>

                  <p className="text-xs text-slate-800 leading-relaxed font-sans">{customBody}</p>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-400">
                    <span>Meta HSM Verified</span>
                    <span className="flex items-center gap-1 text-emerald-600 font-bold">
                      <span>Just now</span>
                      <CheckCheck className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>

              {/* Phone Home Bar */}
              <div className="w-24 h-1 bg-slate-700 rounded-full mx-auto mt-4" />
            </div>

            <p className="text-[11px] text-slate-500 text-center mt-3 max-w-xs">
              Live smartphone mockup demonstrating instant WhatsApp delivery to Sarah Vance and academy guardian group.
            </p>
          </div>
        </div>
      )}

      {/* Historical Broadcast Audit Logs */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h3 className="font-extrabold text-slate-900 text-sm">Dispatched Broadcast Logs & Delivery Metrics</h3>

        <div className="space-y-3">
          {broadcasts.map((b) => (
            <div
              key={b.id}
              className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-500" />
                  <span>{b.templateTitle}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 font-mono">
                    {b.channel}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                    {b.deliveredCount} Delivered • {b.readCount} Read
                  </span>
                </div>
              </div>

              <p className="text-slate-600 leading-relaxed">{b.messageContent}</p>

              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/60">
                <span>Sender: <strong>{b.senderName}</strong></span>
                <span>Sent: {new Date(b.sentAt).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
