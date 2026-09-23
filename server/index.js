import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import './config/firebase.js';
import './config/firebase-admin.js';

import authRouter from './routes/auth.js';
import postsRouter from './routes/posts.js';
import commentsRouter from './routes/comments.js';
import pollsRouter from './routes/polls.js';
import reactionsRouter from './routes/reactions.js';
import leadersRouter from './routes/leaders.js';
import topicsRouter from './routes/topics.js';
import adminRouter from './routes/admin.js';
import insightsRouter from './routes/insights.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS setup to allow client requests
app.use(cors({
  origin: '*',
  credentials: true
}));

app.use(express.json());

// Healthcheck endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'VotersMood Express API Backend (Vercel Serverless)',
    projectId: process.env.FIREBASE_PROJECT_ID || 'votersmood78',
    timestamp: new Date().toISOString(),
    secretsIsolated: true
  });
});

// API Route Endpoints
app.use('/api/auth', authRouter);
app.use('/api/posts', postsRouter);
app.use('/api/comments', commentsRouter);
app.use('/api/polls', pollsRouter);
app.use('/api/reactions', reactionsRouter);
app.use('/api/leaders', leadersRouter);
app.use('/api/topics', topicsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/insights', insightsRouter);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

if (process.env.VERCEL !== '1' && !process.env.VERCEL_ENV) {
  app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 VotersMood Express Backend Server running on http://localhost:${PORT}`);
    console.log(`🔒 Project: ${process.env.FIREBASE_PROJECT_ID || 'votersmood78'} (Keys 100% Server Isolated)`);
    console.log(`======================================================\n`);
  });
}

export default app;
