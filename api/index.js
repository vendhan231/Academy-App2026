import app from '../server.js';
import { connectDB } from '../models/dbAdapter.js';
import { seedInitialData } from '../server.js';

await connectDB();
await seedInitialData();

export default app;