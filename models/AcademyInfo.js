import mongoose from 'mongoose';
import { getIsMongoConnected, getLocalStore, persistLocalStore } from './dbAdapter.js';

const AchievementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  year: { type: String, required: true },
  description: { type: String, default: '' }
}, { _id: false });

const WeeklyScheduleSchema = new mongoose.Schema({
  day: { type: String, required: true },
  sport: { type: String, required: true },
  time: { type: String, required: true },
  coach: { type: String, required: true }
}, { _id: false });

const EventSchema = new mongoose.Schema({
  name: { type: String, required: true },
  date: { type: String, required: true },
  location: { type: String, required: true },
  description: { type: String, default: '' }
}, { _id: false });

const AcademyInfoSchema = new mongoose.Schema({
  startedYear: {
    type: String,
    default: '2014'
  },
  aboutText: {
    type: String,
    default: 'Vendhan Sports Academy is a premier athletic institution dedicated to elite training in Roller Skating, Archery, Football, Yoga, Physical Fitness, and traditional Silambam. We nurture grassroots talent into national and international champions through scientific coaching, rigorous discipline, and character building.'
  },
  sportsAvailable: {
    type: [String],
    default: [
      'Roller Skating',
      'Archery',
      'Football',
      'Yoga',
      'Physical Fitness',
      'Silambam'
    ]
  },
  achievements: [AchievementSchema],
  weeklySchedule: [WeeklyScheduleSchema],
  events: [EventSchema],
  gallery: {
    type: [String],
    default: []
  },
  logoUrl: {
    type: String,
    default: ''
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const MongoAcademyInfoModel = mongoose.models.AcademyInfo || mongoose.model('AcademyInfo', AcademyInfoSchema);

class AcademyInfoModelWrapper {
  static schema = AcademyInfoSchema;

  static async findOne() {
    if (getIsMongoConnected()) {
      let doc = await MongoAcademyInfoModel.findOne();
      if (!doc) {
        doc = await MongoAcademyInfoModel.create(AcademyInfoModelWrapper.getDefaultData());
      }
      return doc;
    }

    const store = getLocalStore();
    if (!store.academyInfo) {
      store.academyInfo = AcademyInfoModelWrapper.getDefaultData();
      persistLocalStore();
    }
    return { ...store.academyInfo };
  }

  static async updateInfo(updateData) {
    if (getIsMongoConnected()) {
      let doc = await MongoAcademyInfoModel.findOne();
      if (!doc) {
        doc = new MongoAcademyInfoModel(AcademyInfoModelWrapper.getDefaultData());
      }
      Object.assign(doc, updateData, { updatedAt: new Date() });
      return await doc.save();
    }

    const store = getLocalStore();
    if (!store.academyInfo) {
      store.academyInfo = AcademyInfoModelWrapper.getDefaultData();
    }
    store.academyInfo = {
      ...store.academyInfo,
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    persistLocalStore();
    return { ...store.academyInfo };
  }

  static getDefaultData() {
    return {
      startedYear: '2014',
      aboutText: 'Vendhan Sports Academy is a premier multi-sport training institution established in 2014. We specialize in six core disciplines: Roller Skating, Archery, Football, Yoga, Physical Fitness, and traditional Silambam. Equipped with a synthetic 200m banked skating track, Olympic 70m archery ranges, FIFA-standard turf pitches, dedicated yogashalas, and martial art silambam training arenas, our certified coaches prepare athletes for state, national, and world championships.',
      sportsAvailable: [
        'Roller Skating',
        'Archery',
        'Football',
        'Yoga',
        'Physical Fitness',
        'Silambam'
      ],
      achievements: [
        {
          title: 'National Speed Skating Championship - 5 Gold, 2 Silver',
          year: '2024',
          description: 'Dominant podium finishes in the 500m sprint and 3000m relay by academy cadets in Pune.'
        },
        {
          title: 'All-India Recurve & Compound Archery Cup',
          year: '2024',
          description: 'Cadet archers clinched 3 Gold and 2 Bronze medals with record precision scores.'
        },
        {
          title: 'State Youth Premier League Football Champions',
          year: '2023',
          description: 'Undefeated tournament run with 28 goals scored across 7 games.'
        },
        {
          title: 'National Silambam Federation Gold Trophy',
          year: '2025',
          description: 'Overall team championship in Traditional Weapons and Stick Combat sparring.'
        },
        {
          title: 'State Asana & Rhythmic Yoga Olympiad',
          year: '2025',
          description: 'First place in Artistic and Rhythmic Asana balance routines.'
        }
      ],
      weeklySchedule: [
        { day: 'Monday', sport: 'Roller Skating', time: '06:00 AM - 08:00 AM', coach: 'Arun Victor' },
        { day: 'Monday', sport: 'Silambam', time: '05:00 PM - 07:00 PM', coach: 'Karthik Raja' },
        { day: 'Tuesday', sport: 'Archery', time: '06:30 AM - 08:30 AM', coach: 'Deepika Kumari' },
        { day: 'Tuesday', sport: 'Yoga', time: '05:00 PM - 06:30 PM', coach: 'Sunita Acharya' },
        { day: 'Wednesday', sport: 'Physical Fitness', time: '06:00 AM - 07:30 AM', coach: 'Master Rajesh Kumar' },
        { day: 'Wednesday', sport: 'Football', time: '04:30 PM - 06:30 PM', coach: 'Marcus Sterling' },
        { day: 'Thursday', sport: 'Roller Skating', time: '06:00 AM - 08:00 AM', coach: 'Arun Victor' },
        { day: 'Thursday', sport: 'Silambam', time: '05:00 PM - 07:00 PM', coach: 'Karthik Raja' },
        { day: 'Friday', sport: 'Archery', time: '06:30 AM - 08:30 AM', coach: 'Deepika Kumari' },
        { day: 'Friday', sport: 'Yoga', time: '05:00 PM - 06:30 PM', coach: 'Sunita Acharya' },
        { day: 'Saturday', sport: 'Football', time: '07:00 AM - 09:30 AM', coach: 'Marcus Sterling' },
        { day: 'Saturday', sport: 'Physical Fitness', time: '04:00 PM - 06:00 PM', coach: 'Master Rajesh Kumar' },
        { day: 'Sunday', sport: 'Silambam & Traditional Martial Arts', time: '06:30 AM - 08:30 AM', coach: 'Karthik Raja' }
      ],
      events: [
        {
          name: 'Annual Selection Trials 2026',
          date: '2026-11-15',
          location: 'Academy Main Arena',
          description: 'Open scouting trials across Roller Skating, Archery, Football, Silambam, Yoga, and Fitness.'
        },
        {
          name: 'State Speed Skating Invitational',
          date: '2026-12-05',
          location: 'Speed Skating Oval Rink',
          description: '200m dual time trial and point-to-point endurance race.'
        },
        {
          name: 'South India Silambam Championship',
          date: '2026-12-18',
          location: 'Indoor Combat Hall',
          description: 'State tournament for single stick, double stick, and deer horn sparring.'
        },
        {
          name: 'Vendhan Football Youth Cup',
          date: '2026-12-28',
          location: 'Main Turf Pitch 1',
          description: '16-team knockout tournament featuring premier regional youth football academies.'
        }
      ],
      gallery: [
        'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1511295742362-92c96b124e52?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=1000&q=80'
      ],
      logoUrl: ''
    };
  }
}

export default AcademyInfoModelWrapper;
export { MongoAcademyInfoModel, AcademyInfoSchema };
