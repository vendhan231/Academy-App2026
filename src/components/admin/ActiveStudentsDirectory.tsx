import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ActiveStudent, BloodGroup, ArchivedStudent } from '../../types';
import {
  Search,
  Plus,
  Archive,
  Phone,
  Mail,
  Heart,
  FileCheck,
  Trophy,
  Filter,
  X,
  Eye,
  Award,
} from 'lucide-react';

export const ActiveStudentsDirectory: React.FC = () => {
  const { activeStudents, addActiveStudent, archiveStudent, coaches } = useApp();

  const [search, setSearch] = useState('');
  const [sportFilter, setSportFilter] = useState('ALL');
  const [selectedStudent, setSelectedStudent] = useState<ActiveStudent | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<ActiveStudent | null>(null);
  const [archiveReason, setArchiveReason] = useState<ArchivedStudent['archivalReason']>('Graduated');
  const [archiveNotes, setArchiveNotes] = useState('');

  // Add Student Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dob: '2014-05-12',
    gender: 'Male' as const,
    bloodGroup: 'O+' as BloodGroup,
    medicalNotes: 'No chronic restrictions.',
    chronicAilments: '',
    allergies: '',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    doctorName: 'Dr. Gregory House, MD',
    doctorPhone: '+15559871234',
    doctorClinic: 'West Hills Pediatric Sports Medicine',
    enrolledSports: ['Tennis'],
    batchShift: 'Morning 06:00 - 08:00 Squad',
    primaryAssignedCoachId: coaches[0]?.id || 'coach-1',
    residentialAddress: '742 Academy Drive',
    digitalLiabilityWaiverSigned: true,
  });

  const allSports = Array.from(new Set(activeStudents.flatMap((s) => s.enrolledSports)));

  const filteredStudents = activeStudents.filter((student) => {
    const matchesSearch =
      `${student.firstName} ${student.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      student.studentCode.toLowerCase().includes(search.toLowerCase()) ||
      student.parentPhone.includes(search);
    const matchesSport = sportFilter === 'ALL' || student.enrolledSports.includes(sportFilter);
    return matchesSearch && matchesSport;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const coach = coaches.find((c) => c.id === formData.primaryAssignedCoachId);
    addActiveStudent({
      firstName: formData.firstName,
      lastName: formData.lastName,
      dob: formData.dob,
      gender: formData.gender,
      bloodGroup: formData.bloodGroup,
      medicalNotes: formData.medicalNotes,
      chronicAilments: formData.chronicAilments ? formData.chronicAilments.split(',').map((s) => s.trim()) : [],
      allergies: formData.allergies ? formData.allergies.split(',').map((s) => s.trim()) : [],
      parentName: formData.parentName,
      parentPhone: formData.parentPhone,
      parentEmail: formData.parentEmail,
      emergencyDoctorContact: {
        name: formData.doctorName,
        phone: formData.doctorPhone,
        clinic: formData.doctorClinic,
      },
      enrolledSports: formData.enrolledSports,
      batchShift: formData.batchShift,
      primaryAssignedCoachId: formData.primaryAssignedCoachId,
      primaryAssignedCoachName: coach?.name || 'Head Coach',
      residentialAddress: formData.residentialAddress,
      digitalLiabilityWaiverSigned: formData.digitalLiabilityWaiverSigned,
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    });
    setIsAddModalOpen(false);
  };

  const confirmArchive = () => {
    if (archiveTarget) {
      archiveStudent(archiveTarget.id, archiveReason, archiveNotes);
      setArchiveTarget(null);
      setArchiveNotes('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Active Student Directory</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time athlete cohort management, medical profiles & verified guardian contacts.
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Register Active Student</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name, ACAD code, or parent WhatsApp phone..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-sm">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Sport:</span>
            <select
              value={sportFilter}
              onChange={(e) => setSportFilter(e.target.value)}
              className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Sports ({activeStudents.length})</option>
              {allSports.map((sp) => (
                <option key={sp} value={sp}>
                  {sp}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Mobile Student Cards (<md) */}
      <div className="md:hidden space-y-3">
        {filteredStudents.length === 0 ? (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
            No active student records match your search query.
          </div>
        ) : (
          filteredStudents.map((student) => (
            <div
              key={student.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={student.photoUrl}
                    alt={student.firstName}
                    className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shrink-0"
                  />
                  <div>
                    <div className="font-extrabold text-slate-900 text-sm">
                      {student.firstName} {student.lastName}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="font-mono text-[10px] text-indigo-600 font-bold px-1.5 py-0.2 rounded bg-indigo-50 border border-indigo-100">
                        {student.studentCode}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {student.gender} • {student.dob}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setSelectedStudent(student)}
                    className="p-2 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 min-h-[40px] min-w-[40px] flex items-center justify-center transition-colors"
                    title="View Dossier"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setArchiveTarget(student)}
                    className="p-2 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 min-h-[40px] min-w-[40px] flex items-center justify-center transition-colors"
                    title="Archive Athlete"
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Sports & Medical */}
              <div className="flex flex-wrap items-center gap-1.5">
                {student.enrolledSports.map((sp) => (
                  <span
                    key={sp}
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100"
                  >
                    {sp}
                  </span>
                ))}
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold text-[10px] border border-rose-100">
                  <Heart className="w-3 h-3 text-rose-500" />
                  <span>{student.bloodGroup}</span>
                </span>
                {student.digitalLiabilityWaiverSigned ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <FileCheck className="w-3 h-3 text-emerald-600" />
                    <span>Waiver Signed</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    Pending Waiver
                  </span>
                )}
              </div>

              {/* Medical notes alert if present */}
              {student.chronicAilments.length > 0 && (
                <div className="text-[10px] text-amber-800 bg-amber-50 p-2 rounded-xl border border-amber-200/80 font-medium">
                  ⚠️ <strong>Condition:</strong> {student.chronicAilments.join(', ')}
                </div>
              )}

              {/* Guardian & Coach Info */}
              <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Guardian</span>
                  <div className="font-semibold text-slate-800 truncate">{student.parentName}</div>
                  <a
                    href={`https://wa.me/${student.parentPhone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-mono font-bold mt-0.5 hover:underline"
                  >
                    <Phone className="w-3 h-3 text-emerald-600" />
                    <span>{student.parentPhone}</span>
                  </a>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Assigned Coach</span>
                  <div className="font-semibold text-slate-800 truncate">{student.primaryAssignedCoachName}</div>
                  <div className="text-[10px] text-slate-500 truncate">{student.batchShift}</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Student Table (>=md) */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Student Athlete</th>
                <th className="py-3.5 px-4">Enrolled Sports</th>
                <th className="py-3.5 px-4">Medical & Blood Group</th>
                <th className="py-3.5 px-4">Parent / Guardian</th>
                <th className="py-3.5 px-4">Assigned Coach & Batch</th>
                <th className="py-3.5 px-4">Waiver Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-slate-50/60 transition-colors">
                  {/* Athlete Info */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={student.photoUrl}
                        alt={student.firstName}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                      />
                      <div>
                        <div className="font-bold text-slate-900 text-xs">
                          {student.firstName} {student.lastName}
                        </div>
                        <div className="font-mono text-[10px] text-indigo-600 font-semibold">
                          {student.studentCode}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          DOB: {student.dob} ({student.gender})
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Sports */}
                  <td className="py-3.5 px-4">
                    <div className="flex flex-wrap gap-1">
                      {student.enrolledSports.map((sp) => (
                        <span
                          key={sp}
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100"
                        >
                          {sp}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Medical */}
                  <td className="py-3.5 px-4">
                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 font-bold text-[10px] border border-rose-100">
                        <Heart className="w-3 h-3 text-rose-500" />
                        <span>Type: {student.bloodGroup}</span>
                      </div>
                      {student.chronicAilments.length > 0 && (
                        <div className="text-[10px] text-amber-700 font-medium">
                          ⚠️ {student.chronicAilments.join(', ')}
                        </div>
                      )}
                      {student.allergies.length > 0 && (
                        <div className="text-[10px] text-slate-500">
                          Allergies: {student.allergies.join(', ')}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Parent */}
                  <td className="py-3.5 px-4">
                    <div>
                      <div className="font-semibold text-slate-800">{student.parentName}</div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono mt-0.5">
                        <Phone className="w-3 h-3 text-emerald-600" />
                        <span>{student.parentPhone}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 truncate">
                        <Mail className="w-3 h-3" />
                        <span>{student.parentEmail}</span>
                      </div>
                    </div>
                  </td>

                  {/* Coach & Batch */}
                  <td className="py-3.5 px-4">
                    <div>
                      <div className="font-semibold text-slate-800">{student.primaryAssignedCoachName}</div>
                      <div className="text-[10px] text-slate-500">{student.batchShift}</div>
                    </div>
                  </td>

                  {/* Liability Waiver */}
                  <td className="py-3.5 px-4">
                    {student.digitalLiabilityWaiverSigned ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <FileCheck className="w-3 h-3 text-emerald-600" />
                        <span>Signed ({student.waiverSignedDate || 'Valid'})</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        Pending Waiver
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedStudent(student)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        title="View Full Athlete Dossier"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setArchiveTarget(student)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                        title="Archive Athlete (Move to Vault)"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Details Dossier Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white relative">
              <button
                onClick={() => setSelectedStudent(null)}
                className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-4">
                <img
                  src={selectedStudent.photoUrl}
                  alt={selectedStudent.firstName}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-400 shadow-md"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black">
                      {selectedStudent.firstName} {selectedStudent.lastName}
                    </h3>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                      {selectedStudent.studentCode}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Enrolled: {selectedStudent.enrolledSports.join(', ')} • Joined {selectedStudent.dateOfJoining}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Coach: {selectedStudent.primaryAssignedCoachName} • {selectedStudent.batchShift}
                  </p>
                </div>
              </div>
            </div>

            {/* Content Tabs / Info */}
            <div className="p-6 space-y-6">
              {/* Medical & Guardian Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Medical Card */}
                <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-100 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-rose-900">
                    <span className="flex items-center gap-1.5">
                      <Heart className="w-4 h-4 text-rose-600" /> Medical Profile
                    </span>
                    <span className="px-2 py-0.5 rounded bg-rose-200 text-rose-800 font-mono">
                      Blood: {selectedStudent.bloodGroup}
                    </span>
                  </div>
                  <div className="text-xs text-rose-950">
                    <span className="font-semibold">Notes:</span> {selectedStudent.medicalNotes}
                  </div>
                  {selectedStudent.chronicAilments.length > 0 && (
                    <div className="text-xs text-rose-800">
                      <span className="font-semibold">Chronic Conditions:</span> {selectedStudent.chronicAilments.join(', ')}
                    </div>
                  )}
                  <div className="pt-2 border-t border-rose-200/60 text-[11px] text-rose-900">
                    <span className="font-semibold">Emergency Physician:</span> {selectedStudent.emergencyDoctorContact.name} ({selectedStudent.emergencyDoctorContact.clinic}) • {selectedStudent.emergencyDoctorContact.phone}
                  </div>
                </div>

                {/* Guardian Card */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="text-xs font-bold text-slate-900">Guardian & Liability Profile</div>
                  <div className="text-xs text-slate-700 space-y-1">
                    <div>
                      <span className="font-semibold">Guardian:</span> {selectedStudent.parentName}
                    </div>
                    <div className="flex items-center gap-1 font-mono text-emerald-700">
                      <Phone className="w-3.5 h-3.5" /> WhatsApp: {selectedStudent.parentPhone}
                    </div>
                    <div>
                      <span className="font-semibold">Email:</span> {selectedStudent.parentEmail}
                    </div>
                    <div>
                      <span className="font-semibold">Address:</span> {selectedStudent.residentialAddress}
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
                    <span>Digital Liability Waiver:</span>
                    <span className="font-bold text-emerald-700">Verified Signed</span>
                  </div>
                </div>
              </div>

              {/* Skill Matrix */}
              <div className="p-4 rounded-xl bg-slate-900 text-white space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    4-Pillar Skill Progression
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Rated by {selectedStudent.skillRatings.updatedByCoachName} on {selectedStudent.skillRatings.lastUpdated}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center">
                  {[
                    { label: 'Stamina', score: selectedStudent.skillRatings.stamina },
                    { label: 'Agility', score: selectedStudent.skillRatings.agility },
                    { label: 'Technique', score: selectedStudent.skillRatings.technique },
                    { label: 'Discipline', score: selectedStudent.skillRatings.discipline },
                  ].map((pillar) => (
                    <div key={pillar.label} className="p-2 rounded-lg bg-slate-800 border border-slate-700">
                      <div className="text-[11px] text-slate-300">{pillar.label}</div>
                      <div className="text-lg font-black text-amber-400 mt-0.5">
                        {pillar.score} / 5
                      </div>
                      <div className="text-[10px] text-slate-400">★ ★ ★ ★ ★</div>
                    </div>
                  ))}
                </div>
                <div className="text-xs text-slate-300 italic bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                  &ldquo;{selectedStudent.skillRatings.coachFeedbackNotes}&rdquo;
                </div>
              </div>

              {/* Achievements Wall */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-amber-500" /> Achievements & Badges ({selectedStudent.achievements.length})
                </h4>
                {selectedStudent.achievements.length === 0 ? (
                  <div className="text-xs text-slate-400 italic">No achievements logged yet.</div>
                ) : (
                  <div className="space-y-2">
                    {selectedStudent.achievements.map((ach) => (
                      <div
                        key={ach.id}
                        className="flex items-start gap-3 p-3 rounded-xl bg-amber-50/50 border border-amber-200/70"
                      >
                        <Award className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900">{ach.title}</span>
                            <span className="text-[10px] font-mono text-slate-500">{ach.awardedDate}</span>
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5">{ach.description}</p>
                          <div className="text-[10px] text-amber-800 font-semibold mt-1">
                            {ach.sport} • Awarded by {ach.coachName}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h3 className="font-extrabold text-slate-900 text-base">Register New Athlete</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full p-2 border rounded-xl"
                    placeholder="Marcus"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full p-2 border rounded-xl"
                    placeholder="Vance"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Date of Birth</label>
                  <input
                    type="date"
                    required
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full p-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                    className="w-full p-2 border rounded-xl bg-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Blood Group</label>
                  <select
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value as BloodGroup })}
                    className="w-full p-2 border rounded-xl bg-white font-bold"
                  >
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Medical Notes / Chronic Conditions</label>
                <input
                  type="text"
                  value={formData.medicalNotes}
                  onChange={(e) => setFormData({ ...formData, medicalNotes: e.target.value })}
                  className="w-full p-2 border rounded-xl"
                  placeholder="e.g. Exercise-induced asthma, dust allergy"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="font-bold text-slate-900 text-xs">Parent / Guardian WhatsApp Contact</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-600 block mb-1">Guardian Full Name</label>
                    <input
                      type="text"
                      required
                      value={formData.parentName}
                      onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                      className="w-full p-2 border rounded-xl bg-white"
                      placeholder="Sarah Vance"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-600 block mb-1">WhatsApp Mobile Phone</label>
                    <input
                      type="tel"
                      required
                      value={formData.parentPhone}
                      onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                      className="w-full p-2 border rounded-xl bg-white font-mono"
                      placeholder="+19876543210"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-slate-600 block mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formData.parentEmail}
                    onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
                    className="w-full p-2 border rounded-xl bg-white"
                    placeholder="sarah.vance@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Enrolled Sport</label>
                  <select
                    value={formData.enrolledSports[0]}
                    onChange={(e) => setFormData({ ...formData, enrolledSports: [e.target.value] })}
                    className="w-full p-2 border rounded-xl bg-white font-bold"
                  >
                    <option value="Tennis">Tennis</option>
                    <option value="Swimming">Swimming</option>
                    <option value="Badminton">Badminton</option>
                    <option value="Football">Football</option>
                    <option value="Athletics">Athletics</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Primary Coach</label>
                  <select
                    value={formData.primaryAssignedCoachId}
                    onChange={(e) => setFormData({ ...formData, primaryAssignedCoachId: e.target.value })}
                    className="w-full p-2 border rounded-xl bg-white"
                  >
                    {coaches.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.sports.join('/')})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <input
                  type="checkbox"
                  id="waiver"
                  checked={formData.digitalLiabilityWaiverSigned}
                  onChange={(e) => setFormData({ ...formData, digitalLiabilityWaiverSigned: e.target.checked })}
                  className="rounded text-emerald-600"
                />
                <label htmlFor="waiver" className="text-xs text-emerald-950 font-semibold cursor-pointer">
                  Digital Liability & Medical Waiver Signed by Guardian
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700"
                >
                  Confirm Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Archive Confirmation Modal */}
      {archiveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center">
                <Archive className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Archive Student Record</h3>
                <p className="text-xs text-slate-500">Move to Admin-Exclusive Historical Vault</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              You are archiving <strong className="text-slate-900">{archiveTarget.firstName} {archiveTarget.lastName}</strong> ({archiveTarget.studentCode}). This student will be moved out of active training batches and into the secure Admin Archives. Coaches and Parents will have zero access to this record.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Exit Reason</label>
                <select
                  value={archiveReason}
                  onChange={(e) => setArchiveReason(e.target.value as any)}
                  className="w-full p-2 border rounded-xl bg-white text-xs font-bold"
                >
                  <option value="Graduated">Graduated (e.g. to College/National League)</option>
                  <option value="Relocated">Relocated (Overseas or Interstate)</option>
                  <option value="Transferred">Transferred to another academy</option>
                  <option value="Dropped Out">Dropped Out</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Exit Audit Notes</label>
                <textarea
                  value={archiveNotes}
                  onChange={(e) => setArchiveNotes(e.target.value)}
                  placeholder="Provide context for historical audit trail (e.g. Scholarship awarded, relocation destination)..."
                  className="w-full p-2 border rounded-xl text-xs h-20"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setArchiveTarget(null)}
                className="px-4 py-2 border rounded-xl text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={confirmArchive}
                className="px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700"
              >
                Archive to Historical Vault
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
