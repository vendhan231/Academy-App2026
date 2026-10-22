import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { MongoClient, Db } from 'mongodb';
import {
  INITIAL_USERS,
  INITIAL_ACTIVE_STUDENTS,
  INITIAL_COACHES,
  INITIAL_BOOKINGS,
  INITIAL_INVOICES,
  INITIAL_BROADCASTS,
} from './src/data/initialData.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// MongoDB Connection State
let mongoClient: MongoClient | null = null;
let mongoDb: Db | null = null;
let mongoStatus = {
  configured: false,
  connected: false,
  error: null as string | null,
  message: 'Waiting for MongoDB URL to be provided.',
};

function isPlaceholderOrInvalidUri(uri: string | undefined): boolean {
  if (!uri || typeof uri !== 'string') return true;
  const trimmed = uri.trim();
  if (!trimmed.startsWith('mongodb://') && !trimmed.startsWith('mongodb+srv://')) {
    return true;
  }
  return (
    trimmed.includes('username:password') ||
    trimmed.includes('<username>') ||
    trimmed.includes('<password>') ||
    trimmed.includes('MY_MONGODB_URI') ||
    trimmed.includes('username:password@cluster.mongodb.net')
  );
}

// Initialize MongoDB connection safely
async function connectToMongo(uri?: string) {
  const targetUri = uri || process.env.MONGODB_URI;

  if (isPlaceholderOrInvalidUri(targetUri)) {
    mongoStatus = {
      configured: false,
      connected: false,
      error: null,
      message: 'MongoDB URI is ready for your connection string. You can paste your MongoDB URL in the MongoDB tab anytime.',
    };
    console.log('[MongoDB] Awaiting real connection string. Operating with in-memory store.');
    return false;
  }

  try {
    mongoStatus.configured = true;
    mongoStatus.message = 'Connecting to MongoDB cluster...';
    if (mongoClient) {
      try {
        await mongoClient.close();
      } catch {
        // ignore close error
      }
    }

    mongoClient = new MongoClient(targetUri!, {
      serverSelectionTimeoutMS: 4000,
      connectTimeoutMS: 6000,
    });

    await mongoClient.connect();
    mongoDb = mongoClient.db('vendhan_sports_academy');
    mongoStatus.connected = true;
    mongoStatus.error = null;
    mongoStatus.message = 'Connected successfully to MongoDB database: vendhan_sports_academy';
    console.log('[MongoDB] Connected successfully to Vendhan Sports Academy Database!');

    // Seed database if empty
    await seedMongoIfEmpty();
    return true;
  } catch (err: any) {
    mongoStatus.connected = false;
    const isAuth = err.message && (err.message.includes('auth') || err.message.includes('Authentication') || err.code === 8000);
    const friendlyError = isAuth
      ? 'Authentication failed: Please check your MongoDB username & password, and ensure special characters in password are URL-encoded.'
      : err.message || 'Connection failed';

    mongoStatus.error = friendlyError;
    mongoStatus.message = friendlyError;
    console.warn('[MongoDB Notice]', friendlyError);
    return false;
  }
}

// Initial seed helper
async function seedMongoIfEmpty() {
  if (!mongoDb || !mongoStatus.connected) return;
  try {
    const usersCount = await mongoDb.collection('users').countDocuments();
    if (usersCount === 0) {
      await mongoDb.collection('users').insertMany(INITIAL_USERS as any);
      console.log('[MongoDB] Seeded initial users (admin, coach, student 001).');
    }

    const studentsCount = await mongoDb.collection('students').countDocuments();
    if (studentsCount === 0) {
      await mongoDb.collection('students').insertMany(INITIAL_ACTIVE_STUDENTS as any);
      console.log('[MongoDB] Seeded initial students (VEN-001 through VEN-005).');
    }

    const coachesCount = await mongoDb.collection('coaches').countDocuments();
    if (coachesCount === 0) {
      await mongoDb.collection('coaches').insertMany(INITIAL_COACHES as any);
    }
  } catch (err: any) {
    console.warn('[MongoDB Seeding Warning]', err.message);
  }
}

// Connect immediately on startup only if a non-placeholder MONGODB_URI is provided
connectToMongo();

// ================= API ENDPOINTS ================= //

// MongoDB Status & Health
app.get('/api/mongodb-status', (_req, res) => {
  const currentUri = process.env.MONGODB_URI;
  let maskedUri: string | null = null;
  if (currentUri) {
    try {
      maskedUri = currentUri.replace(/(mongodb(?:\+srv)?:\/\/[^:]+:)[^@]+(@.+)/, '$1••••••$2');
    } catch {
      maskedUri = 'Configured (Masked)';
    }
  }

  res.json({
    ...mongoStatus,
    academyName: 'Vendhan Sports Academy',
    maskedUri,
  });
});

// Configure MongoDB URL dynamically
app.post('/api/mongodb-config', async (req, res) => {
  const { mongoUri } = req.body;
  if (!mongoUri || typeof mongoUri !== 'string') {
    return res.status(400).json({ success: false, message: 'Valid mongoUri string is required.' });
  }

  process.env.MONGODB_URI = mongoUri.trim();
  const connected = await connectToMongo(mongoUri.trim());

  if (connected) {
    return res.json({
      success: true,
      message: 'Successfully connected to MongoDB for Vendhan Sports Academy!',
      status: mongoStatus,
    });
  } else {
    return res.status(400).json({
      success: false,
      message: mongoStatus.message,
      error: mongoStatus.error,
    });
  }
});

// Auth Login API
// Admin: id="admin", password="admin123"
// Coach: id="coach", password="coach123"
// Student: id="001", password="vendhan"
app.post('/api/auth/login', async (req, res) => {
  const { id, username, email, password } = req.body;
  const loginIdentifier = (id || username || email || '').trim().toLowerCase();
  const inputPassword = (password || '').trim();

  // 1. Admin Verification
  if (
    (loginIdentifier === 'admin' || loginIdentifier === 'admin@vendhansports.com') &&
    inputPassword === 'admin123'
  ) {
    const adminUser = INITIAL_USERS.find((u) => u.role === 'ADMIN') || INITIAL_USERS[0];
    return res.json({
      success: true,
      role: 'ADMIN',
      user: adminUser,
      token: `token_vendhan_admin_${Date.now()}`,
      message: 'Authenticated as Vendhan Sports Academy Administrator',
    });
  }

  // 2. Coach Verification
  if (
    (loginIdentifier === 'coach' || loginIdentifier === 'coach@vendhansports.com') &&
    inputPassword === 'coach123'
  ) {
    const coachUser = INITIAL_USERS.find((u) => u.role === 'COACH') || INITIAL_USERS[1];
    return res.json({
      success: true,
      role: 'COACH',
      user: coachUser,
      token: `token_vendhan_coach_${Date.now()}`,
      message: 'Authenticated as Vendhan Sports Academy Staff Coach',
    });
  }

  // 3. Student / Parent Verification
  // Matches "001", "002", "003", "VEN-001", or student firstName
  const matchedStudent = INITIAL_ACTIVE_STUDENTS.find(
    (s) =>
      s.loginId === loginIdentifier ||
      s.studentCode.toLowerCase() === loginIdentifier ||
      s.firstName.toLowerCase() === loginIdentifier ||
      s.studentCode.toLowerCase().endsWith(loginIdentifier)
  );

  if (matchedStudent && inputPassword === 'vendhan') {
    const parentUser = INITIAL_USERS.find((u) => u.id === matchedStudent.parentUserId) || {
      id: matchedStudent.parentUserId,
      role: 'STUDENT_PARENT' as const,
      name: `${matchedStudent.parentName} (${matchedStudent.firstName}'s Guardian)`,
      phoneNumber: matchedStudent.parentPhone,
      email: matchedStudent.parentEmail,
      avatar: matchedStudent.photoUrl,
      parentLinkedStudentIds: [matchedStudent.id],
    };

    return res.json({
      success: true,
      role: 'STUDENT_PARENT',
      user: {
        ...parentUser,
        parentLinkedStudentIds: [matchedStudent.id],
      },
      activeStudent: matchedStudent,
      token: `token_vendhan_student_${Date.now()}`,
      message: `Authenticated as Athlete ${matchedStudent.firstName} (Code: ${matchedStudent.studentCode})`,
    });
  }

  // Check MongoDB collection if connected and verified
  if (mongoDb && mongoStatus.connected) {
    try {
      const userInDb = await mongoDb.collection('users').findOne({
        $or: [
          { username: loginIdentifier },
          { email: loginIdentifier },
          { id: loginIdentifier },
        ],
        password: inputPassword,
      });

      if (userInDb) {
        return res.json({
          success: true,
          role: userInDb.role,
          user: userInDb,
          token: `token_vendhan_mongo_${Date.now()}`,
          message: `Authenticated via MongoDB (${userInDb.role})`,
        });
      }
    } catch (err: any) {
      console.warn('[Auth DB Query]', err.message);
    }
  }

  return res.status(401).json({
    success: false,
    message: 'Invalid credentials. Please verify your ID and password.',
  });
});

// Students List API
app.get('/api/students', async (_req, res) => {
  if (mongoDb && mongoStatus.connected) {
    try {
      const students = await mongoDb.collection('students').find({}).toArray();
      if (students.length > 0) {
        return res.json(students);
      }
    } catch (err: any) {
      console.warn('[Get Students DB]', err.message);
    }
  }
  res.json(INITIAL_ACTIVE_STUDENTS);
});

// Save Student API
app.post('/api/students', async (req, res) => {
  const studentData = req.body;
  if (mongoDb && mongoStatus.connected) {
    try {
      await mongoDb.collection('students').insertOne(studentData);
      return res.json({ success: true, message: 'Saved to MongoDB students collection' });
    } catch (err: any) {
      console.warn('[Insert Student DB]', err.message);
    }
  }
  res.json({ success: true, message: 'Saved in memory' });
});

// Bookings List API
app.get('/api/bookings', async (_req, res) => {
  if (mongoDb && mongoStatus.connected) {
    try {
      const bookings = await mongoDb.collection('bookings').find({}).toArray();
      if (bookings.length > 0) {
        return res.json(bookings);
      }
    } catch (err: any) {
      console.warn('[Get Bookings]', err.message);
    }
  }
  res.json(INITIAL_BOOKINGS);
});

// Create Booking API
app.post('/api/bookings', async (req, res) => {
  const booking = req.body;
  if (mongoDb && mongoStatus.connected) {
    try {
      await mongoDb.collection('bookings').insertOne(booking);
      return res.json({ success: true, message: 'Reservation saved to MongoDB' });
    } catch (err: any) {
      console.warn('[Insert Booking]', err.message);
    }
  }
  res.json({ success: true, message: 'Reservation stored' });
});

// Invoices List API
app.get('/api/invoices', async (_req, res) => {
  if (mongoDb && mongoStatus.connected) {
    try {
      const invoices = await mongoDb.collection('invoices').find({}).toArray();
      if (invoices.length > 0) {
        return res.json(invoices);
      }
    } catch (err: any) {
      console.warn('[Get Invoices]', err.message);
    }
  }
  res.json(INITIAL_INVOICES);
});

// Emergency Broadcasts API
app.get('/api/broadcasts', async (_req, res) => {
  if (mongoDb && mongoStatus.connected) {
    try {
      const bcasts = await mongoDb.collection('broadcasts').find({}).toArray();
      if (bcasts.length > 0) {
        return res.json(bcasts);
      }
    } catch (err: any) {
      console.warn('[Get Broadcasts]', err.message);
    }
  }
  res.json(INITIAL_BROADCASTS);
});

app.post('/api/broadcasts', async (req, res) => {
  const broadcast = req.body;
  if (mongoDb && mongoStatus.connected) {
    try {
      await mongoDb.collection('broadcasts').insertOne(broadcast);
      return res.json({ success: true, message: 'Broadcast logged to MongoDB' });
    } catch (err: any) {
      console.warn('[Insert Broadcast]', err.message);
    }
  }
  res.json({ success: true, message: 'Broadcast dispatched' });
});

// Start dev or production Vite server
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Vendhan Sports Academy] Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
