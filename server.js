import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import fs from 'fs';

import { connectDB, getLocalStore, persistLocalStore } from './models/dbAdapter.js';
import User from './models/User.js';
import Attendance from './models/Attendance.js';
import AcademyInfo from './models/AcademyInfo.js';
import ArchiveStudent from './models/ArchiveStudent.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'vendhan_sports_academy_secure_jwt_secret_token_2026';

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, 'public')));

// -------------------------------------------------------------
// Authentication & Authorization Middlewares
// -------------------------------------------------------------
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid token: user not found.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

export const authorize = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access requires one of the following roles: [${allowedRoles.join(', ')}]`
      });
    }
    next();
  };
};

// -------------------------------------------------------------
// Auto-Seeding Routine
// -------------------------------------------------------------
export async function seedInitialData() {
  try {
    console.log('[Seed] Verifying system credentials, 6 sports disciplines, and dual fee accounts...');

    const adminUsername = (process.env.ADMIN_USERNAME || 'admin').trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || 'vendhan@123';
    // 1. Ensure Admin exists
    let adminUser = await User.findOne({ username: adminUsername });
    if (!adminUser) {
      adminUser = await User.create({
        username: adminUsername,
        password: adminPassword,
        name: 'Super Administrator',
        role: 'admin',
        phone: '+91 98765 43210',
        sport: 'All',
        fees: { total: 0, paid: 0, due: 0 },
        kitFees: { total: 0, paid: 0, due: 0 },
        coachSalary: { amount: 0, status: 'Paid' }
      });
      console.log('[Seed] Seeded default admin account: admin');
    } else if (adminUser.role !== 'admin') {
      adminUser.role = 'admin';
      await adminUser.save();
    }

    const headCoachUsername = (process.env.HEAD_COACH_USERNAME || 'vendhan').trim().toLowerCase();
    const headCoachPassword = process.env.HEAD_COACH_PASSWORD || 'vendhan@123';
    // 2. Ensure Head Coach exists
    let headCoachUser = await User.findOne({ username: headCoachUsername });
    if (!headCoachUser) {
      headCoachUser = await User.create({
        username: headCoachUsername,
        password: headCoachPassword,
        name: 'Master Vendhan (Head Coach & Founder)',
        role: 'head_coach',
        phone: '+91 98765 43211',
        sport: 'All',
        fees: { total: 0, paid: 0, due: 0 },
        kitFees: { total: 0, paid: 0, due: 0 },
        coachSalary: { amount: 65000, status: 'Paid' }
      });
      console.log('[Seed] Seeded default Head Coach: vendhan');
    } else if (headCoachUser.role !== 'head_coach') {
      headCoachUser.role = 'head_coach';
      headCoachUser.name = 'Master Vendhan (Head Coach & Founder)';
      await headCoachUser.save();
      console.log('[Seed] Updated vendhan account to role: head_coach');
    }

    // Legacy alias headcoach if needed
    const legacyHeadCoach = await User.findOne({ username: 'headcoach' });
    if (!legacyHeadCoach) {
      await User.create({
        username: 'headcoach',
        password: 'vendhan@123',
        name: 'Master Rajesh Kumar',
        role: 'head_coach',
        sport: 'Physical Fitness',
        phone: '+91 98765 11001',
        coachSalary: { amount: 55000, status: 'Paid' },
        fees: { total: 0, paid: 0, due: 0 },
        kitFees: { total: 0, paid: 0, due: 0 }
      });
    }

    // 3. Ensure Regular Coach exists: "coach" / "vendhan@123"
    let defaultRegularCoach = await User.findOne({ username: 'coach' });
    if (!defaultRegularCoach) {
      defaultRegularCoach = await User.create({
        username: 'coach',
        password: 'vendhan@123',
        name: 'Coach R. Ramanathan',
        role: 'coach',
        sport: 'Roller Skating',
        phone: '+91 98765 22001',
        coachSalary: { amount: 38000, status: 'Paid' },
        fees: { total: 0, paid: 0, due: 0 },
        kitFees: { total: 0, paid: 0, due: 0 }
      });
      console.log('[Seed] Seeded default Regular Coach: coach');
    }

    // 3. Ensure Disciplines Coaches exist across all 6 core sports
    const defaultCoaches = [
      {
        username: 'coach_skating',
        name: 'Arun Victor',
        role: 'coach',
        sport: 'Roller Skating',
        phone: '+91 98765 22002',
        coachSalary: { amount: 38000, status: 'Paid' }
      },
      {
        username: 'coach_archery',
        name: 'Deepika Kumari',
        role: 'coach',
        sport: 'Archery',
        phone: '+91 98765 44004',
        coachSalary: { amount: 40000, status: 'Paid' }
      },
      {
        username: 'coach_football',
        name: 'Marcus Sterling',
        role: 'coach',
        sport: 'Football',
        phone: '+91 98765 33003',
        coachSalary: { amount: 42000, status: 'Pending' }
      },
      {
        username: 'coach_yoga',
        name: 'Sunita Acharya',
        role: 'coach',
        sport: 'Yoga',
        phone: '+91 98765 55005',
        coachSalary: { amount: 32000, status: 'Paid' }
      },
      {
        username: 'coach_fitness',
        name: 'Sanjay Verma',
        role: 'coach',
        sport: 'Physical Fitness',
        phone: '+91 98765 66006',
        coachSalary: { amount: 35000, status: 'Paid' }
      },
      {
        username: 'coach_silambam',
        name: 'Karthik Raja (Aasan)',
        role: 'coach',
        sport: 'Silambam',
        phone: '+91 98765 77007',
        coachSalary: { amount: 39000, status: 'Paid' }
      }
    ];

    for (const c of defaultCoaches) {
      const exists = await User.findOne({ username: c.username });
      if (!exists) {
        await User.create({
          ...c,
          password: 'vendhan@123',
          fees: { total: 0, paid: 0, due: 0 },
          kitFees: { total: 0, paid: 0, due: 0 }
        });
        console.log(`[Seed] Seeded coach: ${c.username} (${c.sport})`);
      }
    }

    // 4. Ensure Students exist across all 6 core sports with dual fee structures
    const defaultStudents = [
      {
        username: 'student1',
        name: 'Kavya Ramesh',
        role: 'student',
        sport: 'Roller Skating',
        phone: '+91 98401 12345',
        fees: { total: 18000, paid: 15000, due: 3000 },
        kitFees: { total: 4500, paid: 4500, due: 0 }
      },
      {
        username: 'student2',
        name: 'Rohit Sharma',
        role: 'student',
        sport: 'Football',
        phone: '+91 98402 23456',
        fees: { total: 20000, paid: 20000, due: 0 },
        kitFees: { total: 3500, paid: 2000, due: 1500 }
      },
      {
        username: 'student3',
        name: 'Ananya Iyer',
        role: 'student',
        sport: 'Archery',
        phone: '+91 98403 34567',
        fees: { total: 22000, paid: 12000, due: 10000 },
        kitFees: { total: 6000, paid: 3000, due: 3000 }
      },
      {
        username: 'student4',
        name: 'Vihaan Patel',
        role: 'student',
        sport: 'Yoga',
        phone: '+91 98404 45678',
        fees: { total: 14000, paid: 7000, due: 7000 },
        kitFees: { total: 2500, paid: 2500, due: 0 }
      },
      {
        username: 'student5',
        name: 'Aditya Nair',
        role: 'student',
        sport: 'Physical Fitness',
        phone: '+91 98405 56789',
        fees: { total: 16000, paid: 16000, due: 0 },
        kitFees: { total: 3000, paid: 1500, due: 1500 }
      },
      {
        username: 'student6',
        name: 'Murugan Vel',
        role: 'student',
        sport: 'Silambam',
        phone: '+91 98406 67890',
        fees: { total: 15000, paid: 10000, due: 5000 },
        kitFees: { total: 4000, paid: 2000, due: 2000 }
      }
    ];

    for (const s of defaultStudents) {
      const exists = await User.findOne({ username: s.username });
      if (!exists) {
        await User.create({
          ...s,
          password: 'vendhan@123',
          coachSalary: { amount: 0, status: 'Paid' }
        });
        console.log(`[Seed] Seeded student: ${s.username} (${s.sport})`);
      } else if (!exists.kitFees) {
        // Upgrade existing records with kitFees
        await User.findByIdAndUpdate(exists._id, { kitFees: s.kitFees });
      }
    }

    // 5. Ensure Academy Info exists with all 6 sports
    const academyInfo = await AcademyInfo.findOne();
    if (!academyInfo.sportsAvailable.includes('Silambam')) {
      await AcademyInfo.updateInfo({
        sportsAvailable: [
          'Roller Skating',
          'Archery',
          'Football',
          'Yoga',
          'Physical Fitness',
          'Silambam'
        ]
      });
    }

    // 6. Ensure historical attendance records exist
    const attCount = await Attendance.countDocuments();
    if (attCount === 0) {
      const coaches = await User.find({ role: 'coach' });
      const students = await User.find({ role: 'student' });
      const adminUser = await User.findOne({ username: 'admin' });
      const headUser = await User.findOne({ username: 'headcoach' });

      const today = new Date();
      const dates = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        dates.push(d.toISOString().slice(0, 10));
      }

      for (const d of dates) {
        // Coaches attendance
        for (const coach of coaches) {
          const statuses = ['Present', 'Present', 'Present', 'Late', 'Present'];
          const st = statuses[Math.floor(Math.random() * statuses.length)];
          await Attendance.create({
            targetUserId: coach._id,
            targetRole: 'coach',
            sport: coach.sport || 'Physical Fitness',
            date: d,
            status: st,
            markedBy: headUser ? headUser._id : adminUser._id
          });
        }

        // Students attendance
        for (const st of students) {
          const statuses = ['Present', 'Present', 'Late', 'Present', 'Absent'];
          const s = statuses[Math.floor(Math.random() * statuses.length)];
          await Attendance.create({
            targetUserId: st._id,
            targetRole: 'student',
            sport: st.sport || 'Physical Fitness',
            date: d,
            status: s,
            markedBy: coaches[0] ? coaches[0]._id : adminUser._id
          });
        }
      }
      console.log('[Seed] Seeded historical attendance logs for all 6 disciplines.');
    }

    // 7. Ensure Historical Archive Students (85 legacy admissions) are seeded
    const archiveCount = await ArchiveStudent.countDocuments();
    if (archiveCount === 0) {
      const seedFilePath = path.join(__dirname, 'data', 'archiveStudentsSeed.json');
      if (fs.existsSync(seedFilePath)) {
        const rawSeed = fs.readFileSync(seedFilePath, 'utf-8');
        const seedData = JSON.parse(rawSeed);
        await ArchiveStudent.insertMany(seedData);
        console.log(`[Seed] Successfully auto-seeded all ${seedData.length} historical archive student records into database.`);
      }
    }

    console.log('[Seed] Auto-seeding completed successfully.');
  } catch (err) {
    console.error('[Seed] Error during seeding:', err);
  }
}

// -------------------------------------------------------------
// API Endpoints
// -------------------------------------------------------------

// 1. POST /api/login: Authenticate and return JWT token + user profile
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Please provide both username and password.' });
    }

    const user = await User.findOne({ username: username.trim().toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid username or password.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid username or password.' });
    }

    const payload = {
      id: user._id,
      username: user.username,
      role: user.role,
      name: user.name,
      sport: user.sport
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        name: user.name,
        sport: user.sport,
        phone: user.phone,
        fees: user.fees || { total: 0, paid: 0, due: 0 },
        kitFees: user.kitFees || { total: 0, paid: 0, due: 0 },
        coachSalary: user.coachSalary
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Server error during authentication.' });
  }
});

// 2. GET /api/academy-info & PUT /api/academy-info
app.get('/api/academy-info', async (req, res) => {
  try {
    const info = await AcademyInfo.findOne();
    return res.json({ success: true, data: info });
  } catch (err) {
    console.error('Error fetching academy info:', err);
    return res.status(500).json({ success: false, message: 'Unable to retrieve academy information.' });
  }
});

app.put('/api/academy-info', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const updated = await AcademyInfo.updateInfo(req.body);
    return res.json({
      success: true,
      message: 'Academy CMS details updated successfully.',
      data: updated
    });
  } catch (err) {
    console.error('Error updating academy info:', err);
    return res.status(500).json({ success: false, message: 'Failed to update academy details.' });
  }
});

// Admin Only: Upload and update academy logo
app.post('/api/academy-logo', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { logoUrl } = req.body;
    if (!logoUrl) {
      return res.status(400).json({ success: false, message: 'logoUrl is required.' });
    }
    const updated = await AcademyInfo.updateInfo({ logoUrl });
    return res.json({
      success: true,
      message: 'Academy logo updated successfully by Administrator.',
      logoUrl: updated.logoUrl
    });
  } catch (err) {
    console.error('Error saving academy logo:', err);
    return res.status(500).json({ success: false, message: 'Error saving academy logo.' });
  }
});

// 3. POST /api/users: [Admin] Create new student/coach with fee and kit fee structures
app.post('/api/users', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { username, password, role, name, sport, phone, fees, kitFees, coachSalary } = req.body;

    if (!username || !role || !name) {
      return res.status(400).json({
        success: false,
        message: 'Username, role, and name are required fields.'
      });
    }

    const validRoles = ['admin', 'head_coach', 'coach', 'student'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Must be one of: ${validRoles.join(', ')}`
      });
    }

    const existing = await User.findOne({ username: username.trim().toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Username is already taken. Please choose another.' });
    }

    const totalFee = Number(fees?.total || 0);
    const paidFee = Number(fees?.paid || 0);
    const dueFee = Math.max(0, totalFee - paidFee);

    const kitTotal = Number(kitFees?.total || 0);
    const kitPaid = Number(kitFees?.paid || 0);
    const kitDue = Math.max(0, kitTotal - kitPaid);

    const newUser = await User.create({
      username: username.trim().toLowerCase(),
      password: password || 'vendhan@123',
      role,
      name: name.trim(),
      sport: sport || 'Physical Fitness',
      phone: phone || '',
      fees: {
        total: totalFee,
        paid: paidFee,
        due: dueFee
      },
      kitFees: {
        total: kitTotal,
        paid: kitPaid,
        due: kitDue
      },
      coachSalary: {
        amount: Number(coachSalary?.amount || 0),
        status: coachSalary?.status || 'Pending'
      }
    });

    return res.status(201).json({
      success: true,
      message: `User created successfully as ${role}.`,
      user: newUser.toJSON ? newUser.toJSON() : newUser
    });
  } catch (err) {
    console.error('Error creating user:', err);
    return res.status(500).json({ success: false, message: err.message || 'Error creating user.' });
  }
});

// 4. GET /api/users: Fetch users filtered by role and optional sport query
app.get('/api/users', authenticate, authorize(['admin', 'head_coach', 'coach']), async (req, res) => {
  try {
    const { role, sport } = req.query;
    const query = {};

    if (role) {
      query.role = role;
    } else {
      if (req.user.role === 'head_coach') {
        // Head Coach oversees coaches and can also view students across all sports
        query.role = { $in: ['coach', 'student'] };
      } else if (req.user.role === 'coach') {
        query.role = 'student';
      }
    }

    if (sport && sport !== 'All') {
      query.sport = sport;
    }

    const users = await User.find(query);
    const sanitized = users.map((u) => (u.toJSON ? u.toJSON() : u));

    return res.json({ success: true, count: sanitized.length, data: sanitized });
  } catch (err) {
    console.error('Error fetching users:', err);
    return res.status(500).json({ success: false, message: 'Error retrieving users.' });
  }
});

// 4.1 POST /api/students: [Admin, Head Coach] Register a new regular active student
app.post('/api/students', authenticate, authorize(['admin', 'head_coach']), async (req, res) => {
  try {
    const { username, password, name, sport, phone, email, parentName, address, dateOfBirth, gender, status, kitType, assignedCoach, fees, kitFees, enrollmentDate, bio } = req.body;

    if (!username || !name) {
      return res.status(400).json({
        success: false,
        message: 'Student username (Login ID) and student full name are required.'
      });
    }

    const existing = await User.findOne({ username: username.trim().toLowerCase() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Student ID "${username}" is already in use. Please allocate a unique student ID.`
      });
    }

    const totalFee = Number(fees?.total !== undefined ? fees.total : req.body.totalFee || 0);
    const paidFee = Number(fees?.paid !== undefined ? fees.paid : req.body.paidFee || 0);
    const dueFee = Math.max(0, totalFee - paidFee);

    const kitTotal = Number(kitFees?.total !== undefined ? kitFees.total : req.body.kitTotal || 0);
    const kitPaid = Number(kitFees?.paid !== undefined ? kitFees.paid : req.body.kitPaid || 0);
    const kitDue = Math.max(0, kitTotal - kitPaid);

    const newStudent = await User.create({
      username: username.trim().toLowerCase(),
      password: password || 'vendhan@123',
      role: 'student',
      name: name.trim(),
      sport: sport || 'Physical Fitness',
      phone: phone || '',
      email: email || '',
      parentName: parentName || '',
      address: address || '',
      dateOfBirth: dateOfBirth || null,
      gender: gender || '',
      status: status || 'Active',
      kitType: kitType || 'No Kit',
      assignedCoach: assignedCoach || '',
      enrollmentDate: enrollmentDate || null,
      bio: bio || '',
      fees: {
        total: totalFee,
        paid: paidFee,
        due: dueFee
      },
      kitFees: {
        total: kitTotal,
        paid: kitPaid,
        due: kitDue
      },
      coachSalary: {
        amount: 0,
        status: 'Paid'
      }
    });

    return res.status(201).json({
      success: true,
      message: `Student ${newStudent.name} successfully registered in ${newStudent.sport}.`,
      student: newStudent.toJSON ? newStudent.toJSON() : newStudent
    });
  } catch (err) {
    console.error('Error adding regular student:', err);
    return res.status(500).json({ success: false, message: err.message || 'Error registering active student.' });
  }
});

// 4.2b GET /api/students/:id/profile: Accessible by Admin, Head Coach, Coach, and the authenticated student (self only)
app.get('/api/students/:id/profile', authenticate, async (req, res) => {
  try {
    const allowedRoles = ['admin', 'head_coach', 'coach', 'student'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    let student = await User.findById(req.params.id);
    if (!student) student = await User.findOne({ username: req.params.id });
    if (!student || student.role !== 'student') {
      return res.status(404).json({ success: false, message: 'Student record not found.' });
    }

    if (req.user.role === 'student' && String(req.user.id || req.user._id) !== String(student._id || student.id)) {
      return res.status(403).json({ success: false, message: 'Access denied to other student profiles.' });
    }

    return res.json({ success: true, data: student.toJSON ? student.toJSON() : student });
  } catch (err) {
    console.error('Error fetching student profile:', err);
    return res.status(500).json({ success: false, message: 'Error retrieving student profile.' });
  }
});

// 4.2c PUT /api/students/:id: [Admin, Head Coach only] Update personal bio, contact details, join date, and fee structures
app.put('/api/students/:id', authenticate, authorize(['admin', 'head_coach']), async (req, res) => {
  try {
    let student = await User.findById(req.params.id);
    if (!student) student = await User.findOne({ username: req.params.id });
    if (!student || student.role !== 'student') {
      return res.status(404).json({ success: false, message: 'Student record not found.' });
    }

    const {
      name, sport, phone, parentName, address, dateOfBirth, gender,
      sportLevel, enrollmentDate, bio, profilePhoto, fees, kitFees
    } = req.body;

    const update = {};
    if (name !== undefined) update.name = name;
    if (sport !== undefined) update.sport = sport;
    if (phone !== undefined) update.phone = phone;
    if (parentName !== undefined) update.parentName = parentName;
    if (address !== undefined) update.address = address;
    if (dateOfBirth !== undefined) update.dateOfBirth = dateOfBirth;
    if (gender !== undefined) update.gender = gender;
    if (sportLevel !== undefined) update.sportLevel = sportLevel;
    if (enrollmentDate !== undefined) update.enrollmentDate = enrollmentDate;
    if (bio !== undefined) update.bio = bio;
    if (profilePhoto !== undefined) update.profilePhoto = profilePhoto;
    if (fees !== undefined) update.fees = fees;
    if (kitFees !== undefined) update.kitFees = kitFees;

    const updated = await User.findByIdAndUpdate(student._id, update, { new: true });
    return res.json({ success: true, message: 'Student profile updated.', data: updated.toJSON ? updated.toJSON() : updated });
  } catch (err) {
    console.error('Error updating student:', err);
    return res.status(500).json({ success: false, message: 'Error updating student profile.' });
  }
});

// 4.2 GET /api/students: [Admin, Head Coach, Coach] Fetch active regular students (filterable by ?sport=)
app.get('/api/students', authenticate, authorize(['admin', 'head_coach', 'coach']), async (req, res) => {
  try {
    const { sport } = req.query;
    const query = { role: 'student' };

    if (sport && sport !== 'All') {
      query.sport = sport;
    }

    const students = await User.find(query);
    const sanitized = students.map((s) => (s.toJSON ? s.toJSON() : s));

    return res.json({
      success: true,
      count: sanitized.length,
      data: sanitized
    });
  } catch (err) {
    console.error('Error fetching students:', err);
    return res.status(500).json({ success: false, message: 'Error retrieving active student roster.' });
  }
});

// 4.3 GET /api/archive-students: [Admin only] Fetch historical archived students with keyword search (?search=)
app.get('/api/archive-students', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const search = req.query.search || req.query.q || '';
    let records = [];

    if (search && search.trim() !== '') {
      records = await ArchiveStudent.find({ _search: search.trim() });
    } else {
      records = await ArchiveStudent.find();
    }

    const sanitized = records.map((r) => (r.toJSON ? r.toJSON() : r));

    return res.json({
      success: true,
      count: sanitized.length,
      data: sanitized
    });
  } catch (err) {
    console.error('Error fetching archive students:', err);
    return res.status(500).json({ success: false, message: 'Error retrieving archived student records.' });
  }
});

// 4.4 POST /api/archive-students: [Admin only] Manually archive an entry
app.post('/api/archive-students', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const {
      studentName,
      sportsSelected,
      dateOfBirth,
      gender,
      parentName,
      permanentAddress,
      contactNumber,
      enrollmentDate
    } = req.body;

    if (!studentName || studentName.trim() === '') {
      return res.status(400).json({ success: false, message: 'Student Name is required for archive records.' });
    }

    const created = await ArchiveStudent.create({
      studentName: studentName.trim(),
      sportsSelected: sportsSelected || 'General',
      dateOfBirth: dateOfBirth || null,
      gender: gender || null,
      parentName: parentName || null,
      permanentAddress: permanentAddress || null,
      contactNumber: contactNumber || null,
      enrollmentDate: enrollmentDate || null
    });

    return res.status(201).json({
      success: true,
      message: `Historical record for "${created.studentName}" successfully archived.`,
      data: created.toJSON ? created.toJSON() : created
    });
  } catch (err) {
    console.error('Error saving archive student:', err);
    return res.status(500).json({ success: false, message: 'Error creating archive entry.' });
  }
});

// 5. PUT /api/students/:id/fees: [Admin, Head Coach, Coach] Update both Tuition Fees and Kit Fees
app.put('/api/students/:id/fees', authenticate, authorize(['admin', 'head_coach', 'coach']), async (req, res) => {
  try {
    const { id } = req.params;
    const { total, paid, kitTotal, kitPaid, fees, kitFees, paymentMethod, tuitionPaymentMethod, kitPaymentMethod } = req.body;

    let student = await User.findById(id);
    if (!student) {
      student = await User.findOne({ username: id });
    }
    if (!student || student.role !== 'student') {
      return res.status(404).json({ success: false, message: 'Student record not found.' });
    }

    // Support flat body or nested body
    const tuitionTotal = Number(total !== undefined ? total : fees?.total !== undefined ? fees.total : student.fees?.total || 0);
    const tuitionPaid = Number(paid !== undefined ? paid : fees?.paid !== undefined ? fees.paid : student.fees?.paid || 0);
    const tuitionDue = Math.max(0, tuitionTotal - tuitionPaid);

    const uniformTotal = Number(kitTotal !== undefined ? kitTotal : kitFees?.total !== undefined ? kitFees.total : student.kitFees?.total || 0);
    const uniformPaid = Number(kitPaid !== undefined ? kitPaid : kitFees?.paid !== undefined ? kitFees.paid : student.kitFees?.paid || 0);
    const uniformDue = Math.max(0, uniformTotal - uniformPaid);

     const tuitionPayment = tuitionPaymentMethod || paymentMethod || fees?.paymentMethod || student.fees?.paymentMethod || '';
     const kitPayment = kitPaymentMethod || paymentMethod || kitFees?.paymentMethod || student.kitFees?.paymentMethod || '';

     const updatedStudent = await User.findByIdAndUpdate(
       student._id,
       {
         fees: {
           total: tuitionTotal,
           paid: tuitionPaid,
           due: tuitionDue,
           paymentMethod: tuitionPayment
         },
         kitFees: {
           total: uniformTotal,
           paid: uniformPaid,
           due: uniformDue,
           paymentMethod: kitPayment
         }
       },
       { new: true }
     );

    return res.json({
      success: true,
      message: 'Student tuition and kit fee records updated successfully.',
      data: updatedStudent.toJSON ? updatedStudent.toJSON() : updatedStudent
    });
  } catch (err) {
    console.error('Error updating student fees:', err);
    return res.status(500).json({ success: false, message: 'Error updating student fees.' });
  }
});

// 6. PUT /api/coaches/:id/salary: [Admin] Update coach salary amount and status
app.put('/api/coaches/:id/salary', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, status } = req.body;

    let coach = await User.findById(id);
    if (!coach) {
      coach = await User.findOne({ username: id });
    }
    if (!coach || (coach.role !== 'coach' && coach.role !== 'head_coach')) {
      return res.status(404).json({ success: false, message: 'Coach record not found.' });
    }

    if (status && !['Paid', 'Pending'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Salary status must be either Paid or Pending.' });
    }

    const updatedCoach = await User.findByIdAndUpdate(
      coach._id,
      {
        coachSalary: {
          amount: amount !== undefined ? Number(amount) : coach.coachSalary?.amount || 0,
          status: status || coach.coachSalary?.status || 'Pending'
        }
      },
      { new: true }
    );

    return res.json({
      success: true,
      message: 'Coach salary status updated successfully.',
      data: updatedCoach.toJSON ? updatedCoach.toJSON() : updatedCoach
    });
  } catch (err) {
    console.error('Error updating coach salary:', err);
    return res.status(500).json({ success: false, message: 'Error updating coach salary.' });
  }
});

// 7. POST /api/attendance/student: [Admin, Head Coach, Coach] Mark student daily attendance for a specific sport
app.post('/api/attendance/student', authenticate, authorize(['admin', 'head_coach', 'coach']), async (req, res) => {
  try {
    const target = req.body.targetUserId || req.body.studentId || req.body.studentUsername;
    const { date, status, sport } = req.body;

    if (!target || !date || !status) {
      return res.status(400).json({ success: false, message: 'targetUserId, date, and status are required.' });
    }

    let student = await User.findById(target);
    if (!student) {
      student = await User.findOne({ username: target });
    }
    if (!student || student.role !== 'student') {
      return res.status(404).json({ success: false, message: 'Target user is not a valid registered student.' });
    }

    if (!['Present', 'Absent', 'Late'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be Present, Absent, or Late.' });
    }

    const assignedSport = sport || student.sport || 'General';

    const record = await Attendance.create({
      targetUserId: student._id,
      targetRole: 'student',
      sport: assignedSport,
      date,
      status,
      markedBy: req.user._id
    });

    return res.json({
      success: true,
      message: `Marked ${student.name} (${assignedSport}) as ${status} on ${date}.`,
      data: record
    });
  } catch (err) {
    console.error('Error recording student attendance:', err);
    return res.status(500).json({ success: false, message: 'Error recording student attendance.' });
  }
});

// 8. POST /api/attendance/coach: [Admin, Head Coach] Mark coach daily attendance
app.post('/api/attendance/coach', authenticate, authorize(['admin', 'head_coach']), async (req, res) => {
  try {
    const target = req.body.targetUserId || req.body.coachId || req.body.coachUsername;
    const { date, status, sport } = req.body;

    if (!target || !date || !status) {
      return res.status(400).json({ success: false, message: 'targetUserId, date, and status are required.' });
    }

    let coach = await User.findById(target);
    if (!coach) {
      coach = await User.findOne({ username: target });
    }
    if (!coach || (coach.role !== 'coach' && coach.role !== 'head_coach')) {
      return res.status(404).json({ success: false, message: 'Target user is not a valid registered coach.' });
    }

    if (!['Present', 'Absent', 'Late'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be Present, Absent, or Late.' });
    }

    const record = await Attendance.create({
      targetUserId: coach._id,
      targetRole: 'coach',
      sport: sport || coach.sport || 'Physical Fitness',
      date,
      status,
      markedBy: req.user._id
    });

    return res.json({
      success: true,
      message: `Marked coach ${coach.name} as ${status} on ${date}.`,
      data: record
    });
  } catch (err) {
    console.error('Error recording coach attendance:', err);
    return res.status(500).json({ success: false, message: 'Error recording coach attendance.' });
  }
});

// 9. GET /api/attendance: Filter attendance by role, sport, date, or user ID
app.get('/api/attendance', authenticate, async (req, res) => {
  try {
    const { role, targetUserId, date, sport } = req.query;
    const query = {};

    // Role-based authorization rules on attendance logs
    if (req.user.role === 'student') {
      // Students can ONLY view their own records
      query.targetUserId = req.user._id;
    } else if (req.user.role === 'coach') {
      // Coaches can view student attendance
      query.targetRole = 'student';
      if (targetUserId) query.targetUserId = targetUserId;
      if (sport && sport !== 'All') query.sport = sport;
    } else if (req.user.role === 'head_coach') {
      // Head coach can view coach attendance OR student attendance lists
      query.targetRole = role || 'coach';
      if (targetUserId) query.targetUserId = targetUserId;
      if (sport && sport !== 'All') query.sport = sport;
    } else if (req.user.role === 'admin') {
      if (role) query.targetRole = role;
      if (targetUserId) query.targetUserId = targetUserId;
      if (sport && sport !== 'All') query.sport = sport;
    }

    if (date) {
      query.date = date;
    }

    const records = await Attendance.find(query);
    return res.json({ success: true, count: records.length, data: records });
  } catch (err) {
    console.error('Error fetching attendance records:', err);
    return res.status(500).json({ success: false, message: 'Error fetching attendance records.' });
  }
});

// 10. GET /api/student/me: [Student] Fetch authenticated student's profile, kit fees, and attendance
app.get('/api/student/me', authenticate, authorize(['student']), async (req, res) => {
  try {
    const student = await User.findById(req.user._id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    // Find assigned coach for student's sport
    let assignedCoach = null;
    if (student.sport) {
      const coach = await User.findOne({ role: 'coach', sport: student.sport });
      if (coach) {
        assignedCoach = {
          name: coach.name,
          phone: coach.phone,
          sport: coach.sport
        };
      }
    }

    // Fetch student's attendance records to calculate stats
    const attendances = await Attendance.find({ targetUserId: student._id });
    const totalSessions = attendances.length;
    const presentCount = attendances.filter((a) => a.status === 'Present').length;
    const lateCount = attendances.filter((a) => a.status === 'Late').length;
    const absentCount = attendances.filter((a) => a.status === 'Absent').length;

    const attendanceRate = totalSessions > 0
      ? Math.round(((presentCount + lateCount * 0.5) / totalSessions) * 100)
      : 100;

    return res.json({
      success: true,
      profile: {
        id: student._id,
        username: student.username,
        name: student.name,
        sport: student.sport,
        phone: student.phone,
        createdAt: student.createdAt,
        assignedCoach: assignedCoach || { name: 'Master Rajesh Kumar (Head of Coaching)', phone: '+91 98765 11001', sport: student.sport }
      },
      student: student.toJSON ? student.toJSON() : student,
      fees: student.fees || { total: 0, paid: 0, due: 0 },
      kitFees: student.kitFees || { total: 0, paid: 0, due: 0 },
      attendanceStats: {
        totalSessions,
        presentCount,
        lateCount,
        absentCount,
        attendanceRate,
        percentage: attendanceRate
      },
      recentAttendance: attendances.slice(0, 15)
    });
  } catch (err) {
    console.error('Error fetching student profile:', err);
    return res.status(500).json({ success: false, message: 'Error retrieving student profile.' });
  }
});

// Public health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Vendhan Sports Academy API Server (6 Core Disciplines & Dual Fee Engine)'
  });
});

// SPA Fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server and Seed Database
async function startServer() {
  await connectDB();
  await seedInitialData();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n======================================================`);
    console.log(`  🏆 Vendhan Sports Academy Platform is LIVE (6 Sports)`);
    console.log(`  🚀 Server listening on http://0.0.0.0:${PORT}`);
        console.log(`======================================================\n`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
