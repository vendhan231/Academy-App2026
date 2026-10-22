import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
  Filter,
  Shield,
  Trash2,
} from 'lucide-react';
import { Facility, FacilityBooking } from '../../types';

export const CourtBookingManager: React.FC = () => {
  const { facilities, bookings, createBooking, cancelBooking, currentRole, currentUser } = useApp();

  const [selectedSport, setSelectedSport] = useState('ALL');
  const [selectedDate, setSelectedDate] = useState('2026-10-22');
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);

  // New Booking Form
  const [targetFacilityId, setTargetFacilityId] = useState(facilities[0]?.id || '');
  const [startTime, setStartTime] = useState('16:00');
  const [endTime, setEndTime] = useState('17:00');
  const [bookingNotes, setBookingNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const sports = Array.from(new Set(facilities.map((f) => f.sport)));

  const filteredFacilities = facilities.filter(
    (f) => selectedSport === 'ALL' || f.sport === selectedSport
  );

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const facility = facilities.find((f) => f.id === targetFacilityId);
    if (!facility) return;

    if (startTime >= endTime) {
      setErrorMessage('End time must be after start time.');
      return;
    }

    const res = createBooking({
      facilityId: facility.id,
      facilityName: facility.name,
      sport: facility.sport,
      bookedByUserId: currentUser.id,
      bookedByName: currentUser.name,
      bookedByRole: currentRole,
      date: selectedDate,
      startTime,
      endTime,
      notes: bookingNotes,
    });

    if (!res.success) {
      setErrorMessage(res.message);
    } else {
      setIsBookModalOpen(false);
      setBookingNotes('');
    }
  };

  const TIME_SLOTS = [
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
    '18:00', '19:00', '20:00', '21:00'
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Facility & Court Reservation Engine
            </h2>
            {currentRole === 'ADMIN' && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                Admin Full Override Active
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Multi-court visual schedule grid with automated buffer intervals & collision prevention rules.
          </p>
        </div>

        <button
          onClick={() => {
            setErrorMessage('');
            setIsBookModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Reserve Court Slot</span>
        </button>
      </div>

      {/* Date & Sport Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-700">Date:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="p-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <span className="text-xs font-bold text-slate-500">Sport:</span>
          <button
            onClick={() => setSelectedSport('ALL')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              selectedSport === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Courts ({facilities.length})
          </button>
          {sports.map((sp) => (
            <button
              key={sp}
              onClick={() => setSelectedSport(sp)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                selectedSport === sp
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {sp}
            </button>
          ))}
        </div>
      </div>

      {/* Multi-Court Visual Schedule Grid */}
      <div className="space-y-4">
        {filteredFacilities.map((facility) => {
          const facilityBookings = bookings.filter(
            (b) => b.facilityId === facility.id && b.date === selectedDate && b.status !== 'CANCELLED'
          );

          return (
            <div
              key={facility.id}
              className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
                <div className="flex items-center gap-3">
                  <img
                    src={facility.imageUrl}
                    alt={facility.name}
                    className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shadow-xs shrink-0"
                  />
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">{facility.name}</h3>
                    <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                      <span>Sport: <strong className="text-indigo-600">{facility.sport}</strong></span>
                      <span>• Max {facility.maxPlayers} Players</span>
                      <span>• {facility.bufferMinutes}m buffer buffer time</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
                    {facilityBookings.length} Bookings on {selectedDate}
                  </span>
                </div>
              </div>

              {/* Time Slots Visualization Ribbon (Responsive 4-col on mobile, 8-col on tablet, 16-col on desktop) */}
              <div className="grid grid-cols-4 sm:grid-cols-8 lg:grid-cols-8 xl:grid-cols-16 gap-1.5 pt-1">
                {TIME_SLOTS.map((slot) => {
                  const bookingAtSlot = facilityBookings.find(
                    (b) => slot >= b.startTime && slot < b.endTime
                  );

                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => {
                        if (!bookingAtSlot) {
                          setTargetFacilityId(facility.id);
                          setStartTime(slot);
                          const nextHour = String(Number(slot.split(':')[0]) + 1).padStart(2, '0') + ':00';
                          setEndTime(nextHour);
                          setIsBookModalOpen(true);
                        }
                      }}
                      className={`p-2 rounded-xl text-center border transition-all text-xs min-h-[44px] flex flex-col items-center justify-center ${
                        bookingAtSlot
                          ? 'bg-amber-50 border-amber-300 text-amber-950 font-bold cursor-default'
                          : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-indigo-400 hover:bg-indigo-50/50 cursor-pointer'
                      }`}
                      title={
                        bookingAtSlot
                          ? `Booked: ${bookingAtSlot.startTime}-${bookingAtSlot.endTime} by ${bookingAtSlot.bookedByName} (${bookingAtSlot.notes || 'No notes'})`
                          : `Available: ${slot} (Click to reserve)`
                      }
                    >
                      <div className="text-[10px] font-mono font-bold">{slot}</div>
                      <div className="text-[9px] mt-0.5 truncate max-w-full">
                        {bookingAtSlot ? bookingAtSlot.bookedByName.split(' ')[0] : 'Available'}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Bookings detail list for this court */}
              {facilityBookings.length > 0 && (
                <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2">
                  {facilityBookings.map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                    >
                      <Clock className="w-3.5 h-3.5 text-indigo-600" />
                      <span className="font-bold text-slate-900 font-mono">
                        {b.startTime} - {b.endTime}
                      </span>
                      <span className="text-slate-600">({b.bookedByName})</span>
                      {b.notes && <span className="text-slate-400 italic text-[11px]">&ldquo;{b.notes}&rdquo;</span>}
                      {(currentRole === 'ADMIN' || b.bookedByUserId === currentUser.id) && (
                        <button
                          onClick={() => cancelBooking(b.id)}
                          className="ml-1 text-slate-400 hover:text-rose-600 p-0.5 rounded transition-colors"
                          title="Release / Cancel Booking"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Book Slot Modal */}
      {isBookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-base">Reserve Court / Field Slot</h3>
              <button
                onClick={() => setIsBookModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-950 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleBookingSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Facility / Court</label>
                <select
                  value={targetFacilityId}
                  onChange={(e) => setTargetFacilityId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 focus:outline-none"
                >
                  {facilities.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.sport})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Reservation Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-mono font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Purpose / Notes</label>
                <input
                  type="text"
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  placeholder="e.g. Tactical Sparring Drills / Member Practice"
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <span className="font-bold text-slate-800">Reservation Rules Enforced:</span>
                <div>• Minimum 10-min buffer buffer automatically applied</div>
                <div>• Instant conflict resolution against existing coach/academy sessions</div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsBookModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700"
                >
                  Confirm Reservation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
