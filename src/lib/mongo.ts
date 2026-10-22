import { MongoClient, Db } from 'mongodb';

/**
 * Server-side MongoDB access for the Next.js route handlers.
 *
 * The academy is designed to run with zero configuration: when no usable
 * connection string is present the API falls back to the seeded mock data so
 * the whole product works out of the box.
 */

const DB_NAME = 'vendhan_sports_academy';

const PLACEHOLDER_MONGODB_HOSTS = new Set(['cluster.mongodb.net']);

interface MongoState {
  client: MongoClient | null;
  db: Db | null;
  configured: boolean;
  connected: boolean;
  error: string | null;
  message: string;
}

const globalForMongo = globalThis as unknown as {
  __vendhanMongo?: MongoState;
};

function createState(): MongoState {
  return {
    client: null,
    db: null,
    configured: false,
    connected: false,
    error: null,
    message: 'Waiting for MongoDB URL to be provided.',
  };
}

export const mongoState: MongoState = globalForMongo.__vendhanMongo ?? createState();
let connectPromise: Promise<boolean> | null = null;

if (!globalForMongo.__vendhanMongo) {
  globalForMongo.__vendhanMongo = mongoState;
}

export function isPlaceholderOrInvalidUri(uri: string | undefined): boolean {
  if (!uri || typeof uri !== 'string') return true;
  const trimmed = uri.trim();
  if (!trimmed.startsWith('mongodb://') && !trimmed.startsWith('mongodb+srv://')) {
    return true;
  }
  if (
    trimmed.includes('username:password') ||
    trimmed.includes('<username>') ||
    trimmed.includes('<password>') ||
    trimmed.includes('MY_MONGODB_URI')
  ) {
    return true;
  }
  try {
    const hostname = new URL(trimmed.replace('mongodb+srv://', 'mongodb://')).hostname.toLowerCase();
    if (PLACEHOLDER_MONGODB_HOSTS.has(hostname)) return true;
  } catch {
    return true;
  }
  return false;
}

export function maskMongoUri(uri: string | undefined): string | null {
  if (!uri) return null;
  try {
    return uri.replace(/(mongodb(?:\+srv)?:\/\/[^:]+:)[^@]+(@.+)/, '$1••••••$2');
  } catch {
    return 'Configured (Masked)';
  }
}

export async function connectToMongo(uri?: string): Promise<boolean> {
  const targetUri = (uri || process.env.MONGODB_URI || '').trim();

  if (isPlaceholderOrInvalidUri(targetUri)) {
    mongoState.configured = false;
    mongoState.connected = false;
    mongoState.error = null;
    mongoState.message =
      'MongoDB URI is ready for your connection string. You can paste your MongoDB URL in the MongoDB tab anytime.';
    return false;
  }

  if (mongoState.connected && mongoState.db) return true;
  if (connectPromise) return connectPromise;

  connectPromise = (async () => {
    try {
      mongoState.configured = true;
      mongoState.message = 'Connecting to MongoDB cluster...';

      if (mongoState.client) {
        await mongoState.client.close();
      }

      mongoState.client = new MongoClient(targetUri, {
        serverSelectionTimeoutMS: 4000,
        connectTimeoutMS: 6000,
      });

      await mongoState.client.connect();
      mongoState.db = mongoState.client.db(DB_NAME);
      mongoState.connected = true;
      mongoState.error = null;
      mongoState.message = `Connected successfully to MongoDB database: ${DB_NAME}`;
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Connection failed';
      const isAuth =
        message.includes('auth') ||
        message.includes('Authentication') ||
        (err as { code?: number }).code === 8000;

      mongoState.connected = false;
      mongoState.error = isAuth
        ? 'Authentication failed: Please check your MongoDB username & password, and ensure special characters in password are URL-encoded.'
        : message;
      mongoState.message = mongoState.error;
      return false;
    } finally {
      connectPromise = null;
    }
  })();

  return connectPromise;
}

/** Returns the live database handle, or null when running on mock data. */
export function getDb(): Db | null {
  return mongoState.connected ? mongoState.db : null;
}

export async function seedMongoIfEmpty(
  seed: {
    users: unknown[];
    students: unknown[];
    coaches: unknown[];
  }
): Promise<void> {
  const db = getDb();
  if (!db) return;
  try {
    const usersCount = await db.collection('users').countDocuments();
    if (usersCount === 0 && seed.users.length) {
      await db.collection('users').insertMany(seed.users as never[]);
    }

    const studentsCount = await db.collection('students').countDocuments();
    if (studentsCount === 0 && seed.students.length) {
      await db.collection('students').insertMany(seed.students as never[]);
    }

    const coachesCount = await db.collection('coaches').countDocuments();
    if (coachesCount === 0 && seed.coaches.length) {
      await db.collection('coaches').insertMany(seed.coaches as never[]);
    }
  } catch {
    // Seeding is best-effort; the API keeps serving mock data on failure.
  }
}
