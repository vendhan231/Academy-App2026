import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Image,
  Video,
  Plus,
  Filter,
  CheckCircle2,
  X,
  Upload,
  Tag,
  Eye,
} from 'lucide-react';
import { MediaItem } from '../../types';

export const MediaGallery: React.FC = () => {
  const { media, currentRole, uploadMediaItem, toggleApproveMedia, activeStudents } = useApp();

  const [selectedSport, setSelectedSport] = useState('ALL');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [sport, setSport] = useState('Tennis');
  const [category, setCategory] = useState<MediaItem['category']>('Match');
  const [mediaUrl, setMediaUrl] = useState('https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=1000&auto=format&fit=crop&q=80');
  const [taggedStudent, setTaggedStudent] = useState(activeStudents[0]?.firstName || 'Marcus');

  const sports = Array.from(new Set(media.map((m) => m.sport)));

  // If Parent, only show approved media
  const visibleMedia = media.filter((m) => {
    const matchesSport = selectedSport === 'ALL' || m.sport === selectedSport;
    if (currentRole === 'STUDENT_PARENT') {
      return matchesSport && m.isApproved;
    }
    return matchesSport;
  });

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    uploadMediaItem({
      title,
      sport,
      mediaUrl,
      thumbnailUrl: mediaUrl,
      category,
      uploadedBy: currentRole === 'ADMIN' ? 'Vendhan (Director)' : 'Coach Elena Rostova',
      taggedStudentNames: [taggedStudent],
    });
    setIsUploadOpen(false);
    setTitle('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Academy Media Gallery & Match Footage
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            High-definition video reels, training breakdowns, and tournament podium photos.
          </p>
        </div>

        {currentRole !== 'STUDENT_PARENT' && (
          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Match / Training Media</span>
          </button>
        )}
      </div>

      {/* Sport Filter */}
      <div className="flex items-center gap-2 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto text-xs font-bold">
        <span className="text-slate-500 px-2">Filter Sport:</span>
        <button
          onClick={() => setSelectedSport('ALL')}
          className={`px-3 py-1.5 rounded-xl transition-all ${
            selectedSport === 'ALL'
              ? 'bg-slate-900 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          All Media ({media.length})
        </button>
        {sports.map((sp) => (
          <button
            key={sp}
            onClick={() => setSelectedSport(sp)}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              selectedSport === sp
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {sp}
          </button>
        ))}
      </div>

      {/* Media Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleMedia.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden group hover:shadow-md transition-all flex flex-col"
          >
            <div className="relative aspect-video overflow-hidden bg-slate-900 cursor-pointer" onClick={() => setSelectedMedia(item)}>
              <img
                src={item.thumbnailUrl}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-3 left-3 flex gap-1.5">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-950/70 text-white backdrop-blur border border-white/20">
                  {item.sport}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600/90 text-white backdrop-blur">
                  {item.category}
                </span>
              </div>

              {currentRole === 'ADMIN' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleApproveMedia(item.id);
                  }}
                  className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold backdrop-blur transition-all ${
                    item.isApproved
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-500 text-slate-950'
                  }`}
                >
                  {item.isApproved ? '✓ Approved' : 'Pending Review'}
                </button>
              )}
            </div>

            <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm leading-snug">{item.title}</h4>
                <div className="text-[11px] text-slate-400 mt-1">
                  Uploaded by {item.uploadedBy} on {item.uploadedAt}
                </div>
              </div>

              {item.taggedStudentNames.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  {item.taggedStudentNames.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[10px] font-semibold"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Upload Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-base">Upload Media Item</h3>
              <button onClick={() => setIsUploadOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. State Quarter-Final Highlights"
                  className="w-full p-2.5 border rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Sport</label>
                  <select
                    value={sport}
                    onChange={(e) => setSport(e.target.value)}
                    className="w-full p-2.5 border rounded-xl bg-white font-medium"
                  >
                    <option value="Tennis">Tennis</option>
                    <option value="Football">Football</option>
                    <option value="Badminton">Badminton</option>
                    <option value="Swimming">Swimming</option>
                    <option value="Athletics">Athletics</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full p-2.5 border rounded-xl bg-white font-medium"
                  >
                    <option value="Match">Match Play</option>
                    <option value="Training">Training Drill</option>
                    <option value="Award Ceremony">Award Ceremony</option>
                    <option value="Clinic">Clinic</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Media CDN URL</label>
                <input
                  type="url"
                  required
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  className="w-full p-2.5 border rounded-xl font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Tag Student</label>
                <select
                  value={taggedStudent}
                  onChange={(e) => setTaggedStudent(e.target.value)}
                  className="w-full p-2.5 border rounded-xl bg-white font-medium"
                >
                  {activeStudents.map((s) => (
                    <option key={s.id} value={`${s.firstName} ${s.lastName}`}>
                      {s.firstName} {s.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-4 py-2 border rounded-xl text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700"
                >
                  Publish Media
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {selectedMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 rounded-3xl overflow-hidden max-w-3xl w-full border border-slate-700 shadow-2xl">
            <div className="relative aspect-video">
              <img
                src={selectedMedia.mediaUrl}
                alt={selectedMedia.title}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setSelectedMedia(null)}
                className="absolute top-4 right-4 text-white bg-black/60 p-2 rounded-full hover:bg-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 text-white space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-600">
                  {selectedMedia.sport}
                </span>
                <span className="text-xs text-slate-400">• {selectedMedia.category}</span>
              </div>
              <h3 className="text-xl font-black">{selectedMedia.title}</h3>
              <p className="text-xs text-slate-300">
                Uploaded by {selectedMedia.uploadedBy} • Tagged: {selectedMedia.taggedStudentNames.join(', ')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
