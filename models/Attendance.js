import mongoose from 'mongoose';
import crypto from 'crypto';
import { getIsMongoConnected, getLocalStore, persistLocalStore } from './dbAdapter.js';
import User from './User.js';

const AttendanceSchema = new mongoose.Schema({
  targetUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  targetRole: {
    type: String,
    enum: ['coach', 'student'],
    required: true
  },
  sport: {
    type: String,
    default: ''
  },
  date: {
    type: String, // YYYY-MM-DD
    required: true
  },
  status: {
    type: String,
    enum: ['Present', 'Absent', 'Late'],
    default: 'Present',
    required: true
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound unique index ensuring one attendance record per user per date
AttendanceSchema.index({ targetUserId: 1, date: 1 }, { unique: true });

const MongoAttendanceModel = mongoose.models.Attendance || mongoose.model('Attendance', AttendanceSchema);

class AttendanceModelWrapper {
  static schema = AttendanceSchema;

  static async find(query = {}) {
    if (getIsMongoConnected()) {
      return await MongoAttendanceModel.find(query)
        .populate('targetUserId', 'name username role sport phone fees kitFees')
        .populate('markedBy', 'name username role')
        .sort({ date: -1, createdAt: -1 });
    }

    const store = getLocalStore();
    const records = store.attendances.filter((att) => {
      for (const key of Object.keys(query)) {
        if (query[key] !== undefined && att[key] !== query[key]) return false;
      }
      return true;
    });

    const enriched = await Promise.all(
      records.map(async (record) => {
        const doc = { ...record };
        if (typeof doc.targetUserId === 'string') {
          const user = await User.findById(doc.targetUserId);
          if (user) {
            doc.targetUserId = {
              _id: user._id,
              name: user.name,
              username: user.username,
              role: user.role,
              sport: user.sport,
              phone: user.phone,
              fees: user.fees,
              kitFees: user.kitFees
            };
            if (!doc.sport && user.sport) {
              doc.sport = user.sport;
            }
          }
        }
        if (typeof doc.markedBy === 'string') {
          const marker = await User.findById(doc.markedBy);
          if (marker) {
            doc.markedBy = {
              _id: marker._id,
              name: marker.name,
              username: marker.username,
              role: marker.role
            };
          }
        }
        return doc;
      })
    );

    return enriched.sort((a, b) => (b.date > a.date ? 1 : -1));
  }

  static async findOne(query) {
    if (getIsMongoConnected()) {
      return await MongoAttendanceModel.findOne(query);
    }
    const store = getLocalStore();
    const match = store.attendances.find((att) => {
      for (const key of Object.keys(query)) {
        if (query[key] !== undefined && att[key] !== query[key]) return false;
      }
      return true;
    });
    return match ? { ...match } : null;
  }

  static async findOneAndUpdate(query, update, options = { upsert: true, new: true }) {
    if (getIsMongoConnected()) {
      return await MongoAttendanceModel.findOneAndUpdate(query, update, options);
    }

    const store = getLocalStore();
    const updateFields = update.$set || update;
    const index = store.attendances.findIndex((att) => {
      for (const key of Object.keys(query)) {
        if (att[key] !== query[key]) return false;
      }
      return true;
    });

    if (index !== -1) {
      store.attendances[index] = {
        ...store.attendances[index],
        ...updateFields,
        updatedAt: new Date().toISOString()
      };
      persistLocalStore();
      return { ...store.attendances[index] };
    } else if (options.upsert) {
      const newDoc = {
        _id: 'att_' + crypto.randomUUID().slice(0, 12),
        ...query,
        ...updateFields,
        createdAt: new Date().toISOString()
      };
      store.attendances.push(newDoc);
      persistLocalStore();
      return { ...newDoc };
    }

    return null;
  }

  static async create(data) {
    if (getIsMongoConnected()) {
      return await MongoAttendanceModel.create(data);
    }
    return await AttendanceModelWrapper.findOneAndUpdate(
      { targetUserId: data.targetUserId, date: data.date },
      data,
      { upsert: true, new: true }
    );
  }

  static async countDocuments(query = {}) {
    if (getIsMongoConnected()) {
      return await MongoAttendanceModel.countDocuments(query);
    }
    const store = getLocalStore();
    return store.attendances.filter((att) => {
      for (const key of Object.keys(query)) {
        if (query[key] !== undefined && att[key] !== query[key]) return false;
      }
      return true;
    }).length;
  }
}

export default AttendanceModelWrapper;
export { MongoAttendanceModel, AttendanceSchema };
