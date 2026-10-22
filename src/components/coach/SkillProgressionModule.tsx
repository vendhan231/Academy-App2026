import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Trophy,
  Star,
  Award,
  Zap,
  Target,
  Shield,
  Flame,
  CheckCircle2,
  Plus,
  Sparkles,
  Save,
} from 'lucide-react';
import { ActiveStudent } from '../../types';

export const SkillProgressionModule: React.FC = () => {
  const { activeStudents, updateStudentSkills, awardStudentAchievement } = useApp();

  const [selectedStudentId, setSelectedStudentId] = useState<string>(activeStudents[0]?.id || '');
  const student = activeStudents.find((s) => s.id === selectedStudentId) || activeStudents[0];

  // Pillar scores local state
  const [stamina, setStamina] = useState(student?.skillRatings?.stamina || 4);
  const [agility, setAgility] = useState(student?.skillRatings?.agility || 4);
  const [technique, setTechnique] = useState(student?.skillRatings?.technique || 4);
  const [discipline, setDiscipline] = useState(student?.skillRatings?.discipline || 5);
  const [coachNotes, setCoachNotes] = useState(student?.skillRatings?.coachFeedbackNotes || '');

  // Award Modal state
  const [isAwardModalOpen, setIsAwardModalOpen] = useState(false);
  const [awardTitle, setAwardTitle] = useState('');
  const [awardSport, setAwardSport] = useState(student?.enrolledSports[0] || 'Tennis');
  const [awardCategory, setAwardCategory] = useState<'Tournament' | 'Skill Badge' | 'Milestone' | 'Personal Best'>('Skill Badge');
  const [awardDesc, setAwardDesc] = useState('');
  const [medalType, setMedalType] = useState<'Gold' | 'Silver' | 'Bronze' | 'Badge' | 'Trophy'>('Badge');

  // Sync when student changes
  const handleSelectStudent = (id: string) => {
    setSelectedStudentId(id);
    const target = activeStudents.find((s) => s.id === id);
    if (target) {
      setStamina(target.skillRatings.stamina);
      setAgility(target.skillRatings.agility);
      setTechnique(target.skillRatings.technique);
      setDiscipline(target.skillRatings.discipline);
      setCoachNotes(target.skillRatings.coachFeedbackNotes);
      setAwardSport(target.enrolledSports[0] || 'Tennis');
    }
  };

  const handleSaveMatrix = () => {
    if (!student) return;
    updateStudentSkills(student.id, {
      stamina,
      agility,
      technique,
      discipline,
      coachFeedbackNotes: coachNotes,
    });
  };

  const handleBestowAward = (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;
    awardStudentAchievement(student.id, {
      title: awardTitle,
      sport: awardSport,
      category: awardCategory,
      description: awardDesc,
      awardedDate: new Date().toISOString().split('T')[0],
      coachName: 'Coach Elena Rostova',
      medalType,
    });
    setIsAwardModalOpen(false);
    setAwardTitle('');
    setAwardDesc('');
  };

  const PRESET_BADGES = [
    'Vendhan Serve Ace',
    'Court Flash',
    'Iron Lung',
    'Net Artist',
    'Golden Striker',
    'Fearless Defender',
    'Workhorse Engine',
    'Captain’s Mindset',
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Athlete Skill Progression & Badge Matrix
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            4-Pillar visual ratings (Stamina, Agility, Technique, Discipline) & certified badge awards.
          </p>
        </div>

        <button
          onClick={() => setIsAwardModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs transition-all shadow-sm"
        >
          <Trophy className="w-4 h-4 text-slate-950" />
          <span>Bestow Badge or Medal</span>
        </button>
      </div>

      {/* Student Selector Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-2 overflow-x-auto">
        <span className="text-xs font-bold text-slate-500 px-2">Select Student:</span>
        {activeStudents.map((s) => (
          <button
            key={s.id}
            onClick={() => handleSelectStudent(s.id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              s.id === selectedStudentId
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <img src={s.photoUrl} alt={s.firstName} className="w-5 h-5 rounded-full object-cover" />
            <span>
              {s.firstName} {s.lastName}
            </span>
          </button>
        ))}
      </div>

      {/* Main Skill Matrix Console */}
      {student && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 4 Pillars Interactive Ratings */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-3">
                <img
                  src={student.photoUrl}
                  alt={student.firstName}
                  className="w-12 h-12 rounded-2xl object-cover border-2 border-indigo-500"
                />
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    {student.firstName} {student.lastName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {student.studentCode} • Enrolled: {student.enrolledSports.join(', ')}
                  </p>
                </div>
              </div>

              <button
                onClick={handleSaveMatrix}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Save Matrix Ratings</span>
              </button>
            </div>

            {/* The 4 Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Stamina */}
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-amber-950">
                  <span className="flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-amber-600" /> 1. Stamina & Aerobic Engine
                  </span>
                  <span className="text-sm font-black text-amber-700">{stamina} / 5</span>
                </div>
                <div className="flex gap-1.5 pt-1">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      onClick={() => setStamina(val)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                        val <= stamina
                          ? 'bg-amber-500 text-white shadow-sm'
                          : 'bg-white border border-amber-200 text-amber-900 hover:bg-amber-100'
                      }`}
                    >
                      ★ {val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Agility */}
              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-blue-950">
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-blue-600" /> 2. Agility & Footwork Speed
                  </span>
                  <span className="text-sm font-black text-blue-700">{agility} / 5</span>
                </div>
                <div className="flex gap-1.5 pt-1">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      onClick={() => setAgility(val)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                        val <= agility
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-white border border-blue-200 text-blue-900 hover:bg-blue-100'
                      }`}
                    >
                      ★ {val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Technique */}
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-950">
                  <span className="flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-emerald-600" /> 3. Technical Mastery & Form
                  </span>
                  <span className="text-sm font-black text-emerald-700">{technique} / 5</span>
                </div>
                <div className="flex gap-1.5 pt-1">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      onClick={() => setTechnique(val)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                        val <= technique
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-white border border-emerald-200 text-emerald-900 hover:bg-emerald-100'
                      }`}
                    >
                      ★ {val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Discipline */}
              <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-purple-950">
                  <span className="flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-purple-600" /> 4. Discipline & Mental Focus
                  </span>
                  <span className="text-sm font-black text-purple-700">{discipline} / 5</span>
                </div>
                <div className="flex gap-1.5 pt-1">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      onClick={() => setDiscipline(val)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                        val <= discipline
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'bg-white border border-purple-200 text-purple-900 hover:bg-purple-100'
                      }`}
                    >
                      ★ {val}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Coach Monthly Evaluation */}
            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1">
                Coach Assessment Notes (Shared with Parent on Mother&apos;s View)
              </label>
              <textarea
                value={coachNotes}
                onChange={(e) => setCoachNotes(e.target.value)}
                placeholder="Write specific feedback on biomechanics, match temperament, and target drills..."
                className="w-full p-3 border border-slate-200 rounded-xl text-xs h-24 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          {/* Right Col: Badges & Showcase */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-5">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center justify-between">
              <span>Earned Badges & Wall</span>
              <span className="text-[11px] text-amber-600 font-bold">
                {student.achievements.length} Badges
              </span>
            </h3>

            {/* Badges List */}
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {student.achievements.map((ach) => (
                <div
                  key={ach.id}
                  className="p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span className="flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5 text-amber-600" />
                      {ach.title}
                    </span>
                    <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-amber-200 text-amber-900 font-mono">
                      {ach.medalType || 'Badge'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-tight">{ach.description}</p>
                  <div className="text-[10px] text-slate-400">
                    {ach.sport} • {ach.awardedDate} by {ach.coachName}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Badge Injector */}
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-600 block mb-2">
                Quick Preset Badge Bestow:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_BADGES.map((b) => (
                  <button
                    key={b}
                    onClick={() => {
                      awardStudentAchievement(student.id, {
                        title: b,
                        sport: student.enrolledSports[0] || 'Tennis',
                        category: 'Skill Badge',
                        description: `Demonstrated exceptional proficiency in ${b}.`,
                        awardedDate: new Date().toISOString().split('T')[0],
                        coachName: 'Elena Rostova',
                        medalType: 'Badge',
                      });
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-amber-100 hover:text-amber-900 text-slate-700 text-[10px] font-bold border border-slate-200 transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{b}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bestow Award Modal */}
      {isAwardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-slate-900 text-base">Bestow Official Achievement</h3>
              </div>
              <button onClick={() => setIsAwardModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            <form onSubmit={handleBestowAward} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Badge / Trophy Title</label>
                <input
                  type="text"
                  required
                  value={awardTitle}
                  onChange={(e) => setAwardTitle(e.target.value)}
                  placeholder="e.g. Sub-30s Freestyle Champion"
                  className="w-full p-2 border rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Category</label>
                  <select
                    value={awardCategory}
                    onChange={(e) => setAwardCategory(e.target.value as any)}
                    className="w-full p-2 border rounded-xl bg-white font-medium"
                  >
                    <option value="Tournament">Tournament Award</option>
                    <option value="Skill Badge">Skill Badge</option>
                    <option value="Personal Best">Personal Best</option>
                    <option value="Milestone">Milestone</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Medal Type</label>
                  <select
                    value={medalType}
                    onChange={(e) => setMedalType(e.target.value as any)}
                    className="w-full p-2 border rounded-xl bg-white font-medium"
                  >
                    <option value="Gold">Gold Medal</option>
                    <option value="Silver">Silver Medal</option>
                    <option value="Bronze">Bronze Medal</option>
                    <option value="Trophy">Championship Trophy</option>
                    <option value="Badge">Official Badge</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Sport</label>
                <input
                  type="text"
                  required
                  value={awardSport}
                  onChange={(e) => setAwardSport(e.target.value)}
                  className="w-full p-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Achievement Description</label>
                <textarea
                  required
                  value={awardDesc}
                  onChange={(e) => setAwardDesc(e.target.value)}
                  placeholder="Detailed context of the victory or benchmark reached..."
                  className="w-full p-2 border rounded-xl h-20"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsAwardModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl hover:bg-amber-400"
                >
                  Confirm & Bestow
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
