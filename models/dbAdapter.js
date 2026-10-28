import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let isMongoConnected = false;
let localStore = {
  users: [],
  attendances: [],
  academyInfo: null,
  archiveStudents: []
};

// Load or save local storage
function loadLocalStore() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      localStore = JSON.parse(data);
      if (!Array.isArray(localStore.archiveStudents)) {
        localStore.archiveStudents = [];
      }
    }
  } catch (err) {
    console.error('Error reading local database file:', err.message);
  }
}

function persistLocalStore() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(localStore, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error persisting local database file:', err.message);
  }
}

loadLocalStore();

export async function connectDB(mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sports_academy') {
  try {
    mongoose.set('strictQuery', false);
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 2000
    });
    isMongoConnected = true;
    console.log(`[MongoDB] Connected successfully to: ${conn.connection.host}`);
  } catch (err) {
    isMongoConnected = false;
    console.log(`[Database] MongoDB not reachable (${err.message}). Using resilient embedded JSON persistence engine at /data/database.json.`);
  }
  return isMongoConnected;
}

export function getIsMongoConnected() {
  return isMongoConnected;
}

export function getLocalStore() {
  return localStore;
}

export { persistLocalStore };
