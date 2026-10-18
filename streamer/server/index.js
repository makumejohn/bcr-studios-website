import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { clearSessionCookie, hasValidSession, makeSessionCookie, safeEqual } from './security.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const dataDir = path.resolve(process.env.DATA_DIR || path.join(__dirname, 'data'));
const uploadDir = path.join(dataDir, 'uploads');
const tracksFile = path.join(dataDir, 'tracks.json');
const distDir = path.join(projectRoot, 'dist');
const app = express();
const PORT = Number(process.env.PORT) || 4173;
const AUDIO_EXTENSIONS = new Set(['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac', '.opus', '.webm']);
const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_LOCK_MS = 15 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 6;
const loginAttempts = new Map();

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(express.json({ limit: '1mb' }));

function isSecureRequest(req) {
  return process.env.NODE_ENV === 'production' || req.secure;
}

function isAdmin(req) {
  return hasValidSession(req.headers.cookie, process.env.ADMIN_SESSION_SECRET, Date.now());
}

function requireAdmin(req, res, next) {
  if (!isAdmin(req)) {
    return res.status(401).json({ error: 'Please sign in with the upload password before managing music.' });
  }
  next();
}

function publicTrack(track) {
  return {
    id: track.id,
    title: track.title,
    artist: track.artist,
    uploadedAt: track.uploadedAt,
    url: `/uploads/${encodeURIComponent(track.fileName)}`,
  };
}

async function readTracks() {
  try {
    const content = await fs.readFile(tracksFile, 'utf8');
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

async function writeTracks(tracks) {
  const tempFile = `${tracksFile}.${crypto.randomUUID()}.tmp`;
  await fs.writeFile(tempFile, JSON.stringify(tracks, null, 2), { mode: 0o600 });
  await fs.rename(tempFile, tracksFile);
}

function loginState(ip) {
  const now = Date.now();
  const state = loginAttempts.get(ip);
  if (!state) return { count: 0, lockedUntil: 0, firstAt: now };
  if (state.lockedUntil > now) return state;
  if (now - state.firstAt > LOGIN_WINDOW_MS) {
    const reset = { count: 0, lockedUntil: 0, firstAt: now };
    loginAttempts.set(ip, reset);
    return reset;
  }
  return state;
}

function recordLoginFailure(ip) {
  const now = Date.now();
  const state = loginState(ip);
  state.count += 1;
  if (state.count >= MAX_LOGIN_ATTEMPTS) state.lockedUntil = now + LOGIN_LOCK_MS;
  loginAttempts.set(ip, state);
}

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, uploadDir),
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    callback(null, `${crypto.randomUUID()}${extension}`);
  },
});

const uploadAudio = multer({
  storage,
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const mimeAllowed = file.mimetype.startsWith('audio/') || file.mimetype === 'application/octet-stream';
    if (!AUDIO_EXTENSIONS.has(extension) || !mimeAllowed) {
      return callback(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'audio'));
    }
    callback(null, true);
  },
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', app: 'BCR Streamer' });
});

app.get('/api/tracks', async (_req, res, next) => {
  try {
    const tracks = await readTracks();
    res.set('Cache-Control', 'no-store');
    res.json(tracks.map(publicTrack));
  } catch (error) {
    next(error);
  }
});

app.get('/api/admin/session', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({ authenticated: isAdmin(req) });
});

app.post('/api/admin/login', (req, res) => {
  const expectedPassword = process.env.UPLOAD_ADMIN_PASSWORD;
  const sessionSecret = process.env.ADMIN_SESSION_SECRET;
  if (!expectedPassword || !sessionSecret || expectedPassword.startsWith('replace-this-') || sessionSecret.startsWith('replace-this-')) {
    return res.status(503).json({ error: 'Upload access is not configured yet. Set UPLOAD_ADMIN_PASSWORD and ADMIN_SESSION_SECRET in the server environment.' });
  }

  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const state = loginState(ip);
  if (state.lockedUntil > Date.now()) {
    const seconds = Math.ceil((state.lockedUntil - Date.now()) / 1000);
    res.set('Retry-After', String(seconds));
    return res.status(429).json({ error: `Too many attempts. Try again in ${Math.ceil(seconds / 60)} minutes.` });
  }

  const supplied = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!safeEqual(supplied, expectedPassword)) {
    recordLoginFailure(ip);
    return res.status(401).json({ error: 'That password is not correct. Try again.' });
  }

  loginAttempts.delete(ip);
  res.set('Set-Cookie', makeSessionCookie(sessionSecret, isSecureRequest(req)));
  res.set('Cache-Control', 'no-store');
  res.json({ authenticated: true });
});

app.post('/api/admin/logout', (req, res) => {
  res.set('Set-Cookie', clearSessionCookie(isSecureRequest(req)));
  res.json({ authenticated: false });
});

app.post('/api/tracks', requireAdmin, uploadAudio.single('audio'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Choose an audio file to upload.' });
    const title = String(req.body?.title || '').trim().slice(0, 80);
    const artist = String(req.body?.artist || '').trim().slice(0, 80);
    if (!title || !artist) {
      await fs.unlink(req.file.path).catch(() => {});
      return res.status(400).json({ error: 'Add both a song title and artist name.' });
    }

    const tracks = await readTracks();
    const track = {
      id: crypto.randomUUID(),
      title,
      artist,
      fileName: req.file.filename,
      uploadedAt: new Date().toISOString(),
    };
    tracks.unshift(track);
    await writeTracks(tracks);
    res.status(201).json({ track: publicTrack(track) });
  } catch (error) {
    if (req.file?.path) await fs.unlink(req.file.path).catch(() => {});
    next(error);
  }
});

app.delete('/api/tracks/:id', requireAdmin, async (req, res, next) => {
  try {
    const tracks = await readTracks();
    const track = tracks.find((item) => item.id === req.params.id);
    if (!track) return res.status(404).json({ error: 'Track not found.' });
    const remaining = tracks.filter((item) => item.id !== req.params.id);
    await writeTracks(remaining);
    if (track.fileName && path.basename(track.fileName) === track.fileName) {
      await fs.unlink(path.join(uploadDir, track.fileName)).catch(() => {});
    }
    res.json({ deleted: true });
  } catch (error) {
    next(error);
  }
});

app.use('/uploads', express.static(uploadDir, {
  fallthrough: true,
  dotfiles: 'deny',
  setHeaders: (res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'public, max-age=3600');
  },
}));

app.use(express.static(distDir, { index: false }));
app.get(/.*/, async (req, res, next) => {
  try {
    await fs.access(path.join(distDir, 'index.html'));
    res.sendFile(path.join(distDir, 'index.html'));
  } catch {
    if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'API endpoint not found.' });
    res.status(200).send('BCR Streamer API is running. Start Vite with `npm run dev` for the development interface, or build with `npm run build`.');
  }
});

app.use((error, _req, res, _next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'That audio file is larger than the 100 MB upload limit.' });
    return res.status(400).json({ error: 'Upload an audio file in MP3, WAV, M4A, AAC, OGG, FLAC, OPUS, or WEBM format.' });
  }
  console.error('BCR Streamer request failed:', error?.message || error);
  res.status(500).json({ error: 'Something went wrong on the server. Please try again.' });
});

await fs.mkdir(uploadDir, { recursive: true });
app.listen(PORT, () => {
  console.log(`BCR Streamer server listening on http://localhost:${PORT}`);
  if (!process.env.UPLOAD_ADMIN_PASSWORD || !process.env.ADMIN_SESSION_SECRET) {
    console.warn('Upload login is disabled until UPLOAD_ADMIN_PASSWORD and ADMIN_SESSION_SECRET are configured.');
  }
});
