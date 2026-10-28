import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { getIsMongoConnected, getLocalStore, persistLocalStore } from './dbAdapter.js';

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'head_coach', 'coach', 'student'],
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  sport: {
    type: String,
    enum: ['Roller Skating', 'Archery', 'Football', 'Yoga', 'Physical Fitness', 'Silambam', 'All'],
    default: 'Physical Fitness'
  },
  phone: {
    type: String,
    default: ''
  },
  parentName: {
    type: String,
    default: ''
  },
  address: {
    type: String,
    default: ''
  },
  dateOfBirth: {
    type: Date,
    default: null
  },
  gender: {
    type: String,
    default: ''
  },
  sportLevel: {
    type: String,
    default: ''
  },
  enrollmentDate: {
    type: Date,
    default: null
  },
  bio: {
    type: String,
    default: ''
  },
  profilePhoto: {
    type: String,
    default: ''
  },
  email: { type: String, default: '' },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  kitType: { type: String, default: 'No Kit' },
  assignedCoach: { type: String, default: '' },
  // Tuition / Academy Fees
  fees: {
    total: { type: Number, default: 0 },
    paid: { type: Number, default: 0 },
    due: { type: Number, default: 0 },
    paymentMethod: { type: String, default: '' }
  },
  // Sports Kit / Uniform Fees
  kitFees: {
    total: { type: Number, default: 0 },
    paid: { type: Number, default: 0 },
    due: { type: Number, default: 0 },
    paymentMethod: { type: String, default: '' }
  },
  coachSalary: {
    amount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['Paid', 'Pending'],
      default: 'Pending'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save hook to hash password
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const MongoUserModel = mongoose.models.User || mongoose.model('User', UserSchema);

// Resilient wrapper providing seamless API across both Mongo & LocalStore
class UserModelWrapper {
  static schema = UserSchema;

  static async findOne(query) {
    if (getIsMongoConnected()) {
      return await MongoUserModel.findOne(query);
    }
    const store = getLocalStore();
    const user = store.users.find((u) => {
      for (const key of Object.keys(query)) {
        if (query[key] !== undefined && u[key] !== query[key]) return false;
      }
      return true;
    });
    if (!user) return null;
    return UserModelWrapper.enrichDoc(user);
  }

  static async findById(id) {
    if (getIsMongoConnected()) {
      return await MongoUserModel.findById(id);
    }
    const store = getLocalStore();
    const user = store.users.find((u) => u._id === id || u.id === id);
    if (!user) return null;
    return UserModelWrapper.enrichDoc(user);
  }

  static async find(query = {}) {
    if (getIsMongoConnected()) {
      return await MongoUserModel.find(query).sort({ createdAt: -1 });
    }
    const store = getLocalStore();
    const matches = store.users.filter((u) => {
      for (const key of Object.keys(query)) {
        if (query[key] !== undefined) {
          if (query[key] && typeof query[key] === 'object' && Array.isArray(query[key].$in)) {
            if (!query[key].$in.includes(u[key])) return false;
          } else if (u[key] !== query[key]) {
            return false;
          }
        }
      }
      return true;
    });
    return matches.map((u) => UserModelWrapper.enrichDoc(u));
  }

  static async findOneAndUpdate(query, update, options = {}) {
    if (getIsMongoConnected()) {
      return await MongoUserModel.findOneAndUpdate(query, update, { new: true, ...options });
    }
    const user = await this.findOne(query);
    if (!user) return null;
    return await this.findByIdAndUpdate(user._id, update, options);
  }

  static async findByIdAndUpdate(id, update, options = {}) {
    if (getIsMongoConnected()) {
      return await MongoUserModel.findByIdAndUpdate(id, update, { new: true, ...options });
    }
    const store = getLocalStore();
    const index = store.users.findIndex((u) => u._id === id || u.id === id);
    if (index === -1) return null;

    const current = store.users[index];
    const updateObj = update.$set || update;

    // Handle nested tuition fees
    if (updateObj.fees) {
      const tot = Number(updateObj.fees.total ?? current.fees?.total ?? 0);
      const pd = Number(updateObj.fees.paid ?? current.fees?.paid ?? 0);
      current.fees = {
        total: tot,
        paid: pd,
        due: Math.max(0, tot - pd),
        paymentMethod: updateObj.fees.paymentMethod ?? current.fees?.paymentMethod ?? ''
      };
      delete updateObj.fees;
    }

    // Handle nested kit/uniform fees
    if (updateObj.kitFees) {
      const kTot = Number(updateObj.kitFees.total ?? current.kitFees?.total ?? 0);
      const kPd = Number(updateObj.kitFees.paid ?? current.kitFees?.paid ?? 0);
      current.kitFees = {
        total: kTot,
        paid: kPd,
        due: Math.max(0, kTot - kPd),
        paymentMethod: updateObj.kitFees.paymentMethod ?? current.kitFees?.paymentMethod ?? ''
      };
      delete updateObj.kitFees;
    }

    // Handle coach salary
    if (updateObj.coachSalary) {
      current.coachSalary = {
        amount: Number(updateObj.coachSalary.amount ?? current.coachSalary?.amount ?? 0),
        status: updateObj.coachSalary.status ?? current.coachSalary?.status ?? 'Pending'
      };
      delete updateObj.coachSalary;
    }

    Object.assign(current, updateObj);
    persistLocalStore();
    return UserModelWrapper.enrichDoc(current);
  }

  static async create(userData) {
    let hashedPassword = userData.password;
    if (hashedPassword && !hashedPassword.startsWith('$2')) {
      hashedPassword = await bcrypt.hash(hashedPassword, 10);
    }

    if (getIsMongoConnected()) {
      return await MongoUserModel.create({
        ...userData,
        password: hashedPassword
      });
    }

    const store = getLocalStore();
    const existing = store.users.find((u) => u.username.toLowerCase() === userData.username.toLowerCase());
    if (existing) {
      const err = new Error('Username already exists');
      err.code = 11000;
      throw err;
    }

    const totalFee = Number(userData.fees?.total || 0);
    const paidFee = Number(userData.fees?.paid || 0);
    const dueFee = Math.max(0, totalFee - paidFee);

    const kitTotal = Number(userData.kitFees?.total || 0);
    const kitPaid = Number(userData.kitFees?.paid || 0);
    const kitDue = Math.max(0, kitTotal - kitPaid);

    const newDoc = {
      _id: 'usr_' + crypto.randomUUID().slice(0, 12),
      username: userData.username.trim().toLowerCase(),
      password: hashedPassword,
      role: userData.role,
      name: userData.name.trim(),
      sport: userData.sport || 'Physical Fitness',
      phone: userData.phone || '',
      parentName: userData.parentName || '',
      address: userData.address || '',
      dateOfBirth: userData.dateOfBirth || null,
      gender: userData.gender || '',
      sportLevel: userData.sportLevel || '',
      enrollmentDate: userData.enrollmentDate || null,
      bio: userData.bio || '',
      profilePhoto: userData.profilePhoto || '',
     email: userData.email || '',
     status: userData.status || 'Active',
     kitType: userData.kitType || 'No Kit',
     assignedCoach: userData.assignedCoach || '',
      fees: {
        total: totalFee,
        paid: paidFee,
        due: dueFee,
        paymentMethod: userData.fees?.paymentMethod || ''
      },
      kitFees: {
        total: kitTotal,
        paid: kitPaid,
        due: kitDue,
        paymentMethod: userData.kitFees?.paymentMethod || ''
      },
      coachSalary: {
        amount: Number(userData.coachSalary?.amount || 0),
        status: userData.coachSalary?.status || 'Pending'
      },
      createdAt: new Date().toISOString()
    };

    store.users.unshift(newDoc);
    persistLocalStore();
    return UserModelWrapper.enrichDoc(newDoc);
  }

  static async countDocuments(query = {}) {
    if (getIsMongoConnected()) {
      return await MongoUserModel.countDocuments(query);
    }
    const store = getLocalStore();
    return store.users.filter((u) => {
      for (const key of Object.keys(query)) {
        if (query[key] !== undefined && u[key] !== query[key]) return false;
      }
      return true;
    }).length;
  }

  static enrichDoc(rawUser) {
    const doc = { ...rawUser };
    doc.id = doc._id;
    if (!doc.kitFees) {
      doc.kitFees = { total: 0, paid: 0, due: 0, paymentMethod: '' };
    }
    if (!doc.fees) {
      doc.fees = { total: 0, paid: 0, due: 0, paymentMethod: '' };
    }
    if (doc.fees && doc.fees.paymentMethod === undefined) doc.fees.paymentMethod = '';
    if (doc.kitFees && doc.kitFees.paymentMethod === undefined) doc.kitFees.paymentMethod = '';
    doc.comparePassword = async function (candidatePassword) {
      return bcrypt.compare(candidatePassword, doc.password);
    };
    doc.save = async function () {
      await UserModelWrapper.findByIdAndUpdate(doc._id, {
        role: doc.role,
        name: doc.name,
        sport: doc.sport,
        phone: doc.phone,
        parentName: doc.parentName,
        address: doc.address,
        fees: doc.fees,
        kitFees: doc.kitFees,
        coachSalary: doc.coachSalary
      });
      return doc;
    };
    doc.toObject = () => ({ ...doc });
    doc.toJSON = () => {
      const clone = { ...doc };
      delete clone.password;
      return clone;
    };
    return doc;
  }
}

export default UserModelWrapper;
export { MongoUserModel, UserSchema };
