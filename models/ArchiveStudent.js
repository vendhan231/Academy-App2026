import mongoose from 'mongoose';
import crypto from 'crypto';
import { getIsMongoConnected, getLocalStore, persistLocalStore } from './dbAdapter.js';

const ArchiveStudentSchema = new mongoose.Schema({
  studentName: {
    type: String,
    required: true,
    trim: true
  },
  sportsSelected: {
    type: String,
    default: 'General'
  },
  dateOfBirth: {
    type: String,
    default: null
  },
  gender: {
    type: String,
    default: null
  },
  parentName: {
    type: String,
    default: null
  },
  permanentAddress: {
    type: String,
    default: null
  },
  contactNumber: {
    type: String,
    default: null
  },
  enrollmentDate: {
    type: String,
    default: null
  },
  archivedAt: {
    type: Date,
    default: Date.now
  }
});

const MongoArchiveModel = mongoose.models.ArchiveStudent || mongoose.model('ArchiveStudent', ArchiveStudentSchema);

class ArchiveStudentWrapper {
  static schema = ArchiveStudentSchema;

  static async find(filter = {}, options = {}) {
    if (getIsMongoConnected()) {
      return await MongoArchiveModel.find(filter).sort({ archivedAt: -1, _id: -1 });
    }

    const store = getLocalStore();
    if (!Array.isArray(store.archiveStudents)) {
      store.archiveStudents = [];
    }

    let results = [...store.archiveStudents];

    // If a search query is passed in filter
    if (filter._search) {
      const term = String(filter._search).toLowerCase().trim();
      results = results.filter((item) => {
        const name = (item.studentName || '').toLowerCase();
        const sport = (item.sportsSelected || '').toLowerCase();
        const contact = (item.contactNumber || '').toLowerCase();
        const address = (item.permanentAddress || '').toLowerCase();
        const parent = (item.parentName || '').toLowerCase();
        return (
          name.includes(term) ||
          sport.includes(term) ||
          contact.includes(term) ||
          address.includes(term) ||
          parent.includes(term)
        );
      });
    } else {
      // Standard field filtering if specified
      for (const [key, val] of Object.entries(filter)) {
        if (key !== '_search' && val !== undefined) {
          results = results.filter((item) => {
            if (typeof val === 'string') {
              return (item[key] || '').toLowerCase() === val.toLowerCase();
            }
            return item[key] === val;
          });
        }
      }
    }

    return results.map((r) => ArchiveStudentWrapper.enrichDoc(r));
  }

  static async findById(id) {
    if (getIsMongoConnected()) {
      return await MongoArchiveModel.findById(id);
    }
    const store = getLocalStore();
    const item = (store.archiveStudents || []).find((s) => s._id === id || s.id === id);
    return item ? ArchiveStudentWrapper.enrichDoc(item) : null;
  }

  static async findOne(query) {
    if (getIsMongoConnected()) {
      return await MongoArchiveModel.findOne(query);
    }
    const store = getLocalStore();
    const item = (store.archiveStudents || []).find((s) => {
      for (const [k, v] of Object.entries(query)) {
        if (s[k] !== v) return false;
      }
      return true;
    });
    return item ? ArchiveStudentWrapper.enrichDoc(item) : null;
  }

  static async create(data) {
    if (getIsMongoConnected()) {
      return await MongoArchiveModel.create(data);
    }

    const store = getLocalStore();
    if (!Array.isArray(store.archiveStudents)) {
      store.archiveStudents = [];
    }

    const newDoc = {
      _id: 'arch_' + crypto.randomUUID().slice(0, 12),
      studentName: (data.studentName || '').trim(),
      sportsSelected: data.sportsSelected || 'General',
      dateOfBirth: data.dateOfBirth || null,
      gender: data.gender || null,
      parentName: data.parentName || null,
      permanentAddress: data.permanentAddress || null,
      contactNumber: data.contactNumber || null,
      enrollmentDate: data.enrollmentDate || null,
      archivedAt: data.archivedAt || new Date().toISOString()
    };

    store.archiveStudents.unshift(newDoc);
    persistLocalStore();
    return ArchiveStudentWrapper.enrichDoc(newDoc);
  }

  static async insertMany(records) {
    if (getIsMongoConnected()) {
      return await MongoArchiveModel.insertMany(records);
    }

    const store = getLocalStore();
    if (!Array.isArray(store.archiveStudents)) {
      store.archiveStudents = [];
    }

    const created = records.map((r) => ({
      _id: 'arch_' + crypto.randomUUID().slice(0, 12),
      studentName: (r.studentName || '').trim(),
      sportsSelected: r.sportsSelected || 'General',
      dateOfBirth: r.dateOfBirth || null,
      gender: r.gender || null,
      parentName: r.parentName || null,
      permanentAddress: r.permanentAddress || null,
      contactNumber: r.contactNumber || null,
      enrollmentDate: r.enrollmentDate || null,
      archivedAt: r.archivedAt || new Date().toISOString()
    }));

    store.archiveStudents.push(...created);
    persistLocalStore();
    return created.map((c) => ArchiveStudentWrapper.enrichDoc(c));
  }

  static async countDocuments(query = {}) {
    if (getIsMongoConnected()) {
      return await MongoArchiveModel.countDocuments(query);
    }
    const store = getLocalStore();
    if (!Array.isArray(store.archiveStudents)) return 0;
    return store.archiveStudents.length;
  }

  static enrichDoc(raw) {
    const doc = { ...raw };
    doc.id = doc._id;
    doc.toObject = () => ({ ...doc });
    doc.toJSON = () => ({ ...doc });
    return doc;
  }
}

export default ArchiveStudentWrapper;
export { MongoArchiveModel, ArchiveStudentSchema };
