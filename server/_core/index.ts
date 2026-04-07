import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import multer from "multer";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { handleStripeWebhook } from "../stripe/webhookHandler";
import { storagePut } from "../storage";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { nanoid } from "nanoid";
import { SignJWT, jwtVerify } from "jose";
import { parse as parseCookieHeader } from "cookie";
import { COOKIE_NAME, ONE_DAY_MS, THIRTY_DAYS_MS } from "@shared/const";
import { ENV } from "./env";
import { clearSessionCookie, getSessionCookieOptions } from "./cookies";
import bcrypt from "bcryptjs";
import * as db from "../db";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  // Trust proxy headers (X-Forwarded-Host, X-Forwarded-Proto, etc.) from Cloudflare/Cloud Run
  app.set('trust proxy', true);
  const server = createServer(app);
  
  // Stripe webhook - MUST be before express.json() middleware for raw body
  app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);
  
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "150mb" }));
  app.use(express.urlencoded({ limit: "150mb", extended: true }));

  // Direct file upload route (much more robust than base64 chunks via tRPC)
  const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 500 * 1024 * 1024 } // 500MB
  });

  app.post('/api/upload-video', upload.single('video'), async (req, res) => {
    try {
      // Auth is optional - try to get userId from cookie if available
      let userId: number = 0;
      try {
        const cookieHeader = req.headers.cookie;
        if (cookieHeader) {
          const cookies = parseCookieHeader(cookieHeader);
          const token = cookies[COOKIE_NAME];
          if (token) {
            const secretKey = new TextEncoder().encode(ENV.cookieSecret);
            const { payload } = await jwtVerify(token, secretKey, { algorithms: ['HS256'] });
            userId = (payload.userId as number) || 0;
          }
        }
      } catch {
        // Auth failed, continue as anonymous
        userId = 0;
      }
      console.log(`[Upload] userId: ${userId} (0 = anonymous)`);

      const file = req.file;
      if (!file) {
        res.status(400).json({ error: 'No se recibió ningún archivo' });
        return;
      }

      // Detect proper mime type (multer sometimes returns application/octet-stream)
      const extMimeMap: Record<string, string> = {
        '.mp4': 'video/mp4', '.mov': 'video/quicktime', '.avi': 'video/x-msvideo',
        '.webm': 'video/webm', '.mkv': 'video/x-matroska', '.mpeg': 'video/mpeg',
        '.mpg': 'video/mpeg', '.3gp': 'video/3gpp', '.flv': 'video/x-flv',
        '.ogg': 'video/ogg', '.wmv': 'video/x-ms-wmv', '.m4v': 'video/mp4',
      };
      const ext = '.' + file.originalname.split('.').pop()?.toLowerCase();
      const mimeType = (file.mimetype === 'application/octet-stream' && extMimeMap[ext]) 
        ? extMimeMap[ext] 
        : file.mimetype;

      console.log(`[Upload] Direct upload: ${file.originalname} (${(file.size / 1024 / 1024).toFixed(2)} MB, ${mimeType})`);

      // Upload to S3 in one go
      const fileKey = `videos/${userId}/${nanoid()}-${file.originalname}`;
      const { url } = await storagePut(fileKey, file.buffer, mimeType);

      console.log(`[Upload] Uploaded to S3: ${fileKey}`);
      res.json({ fileKey, url, fileName: file.originalname, fileSize: file.size, mimeType });
    } catch (error: any) {
      console.error('[Upload] Direct upload error:', error);
      res.status(500).json({ error: error.message || 'Error al subir el archivo' });
    }
  });
  
  // ============================================
  // Direct auth endpoints (bypass tRPC streaming)
  // tRPC httpBatchLink with streaming sends headers before mutations can set cookies.
  // These Express routes handle auth directly so Set-Cookie always works.
  // ============================================
  
  function getJwtSecret() {
    return new TextEncoder().encode(ENV.cookieSecret);
  }
  
  async function createJwtToken(userId: number, name: string, durationMs: number): Promise<string> {
    const expirationSeconds = Math.floor((Date.now() + durationMs) / 1000);
    return new SignJWT({ userId, name })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime(expirationSeconds)
      .sign(getJwtSecret());
  }

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password, rememberMe = true } = req.body;
      if (!email || !password) {
        res.status(400).json({ error: 'Email y contraseña son obligatorios' });
        return;
      }

      const user = await db.getUserByEmail(email);
      if (!user || !user.passwordHash) {
        res.status(401).json({ error: 'Email o contraseña incorrectos' });
        return;
      }

      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        res.status(401).json({ error: 'Email o contraseña incorrectos' });
        return;
      }

      // Update last signed in
      await db.upsertUser({ openId: user.openId, lastSignedIn: new Date() });

      const sessionDuration = rememberMe ? THIRTY_DAYS_MS : ONE_DAY_MS;
      const token = await createJwtToken(user.id, user.name || '', sessionDuration);
      const cookieOptions = getSessionCookieOptions(req);
      
      console.log(`[Auth] Login success: ${email}, cookie domain: ${JSON.stringify(cookieOptions)}`);
      
      res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: sessionDuration });
      res.json({
        success: true,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
      });
    } catch (error: any) {
      console.error('[Auth] Login error:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });

  app.post('/api/auth/register', async (req, res) => {
    try {
      const { name, email, password } = req.body;
      if (!name || !email || !password) {
        res.status(400).json({ error: 'Nombre, email y contraseña son obligatorios' });
        return;
      }
      if (password.length < 6) {
        res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
        return;
      }

      const existing = await db.getUserByEmail(email);
      if (existing) {
        res.status(409).json({ error: 'Ya existe una cuenta con este email' });
        return;
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const userId = await db.createUserWithPassword({ name, email, passwordHash });
      const user = await db.getUserById(userId);
      if (!user) {
        res.status(500).json({ error: 'Error al crear la cuenta' });
        return;
      }

      const sessionDuration = ONE_DAY_MS;
      const token = await createJwtToken(user.id, user.name || '', sessionDuration);
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: sessionDuration });
      res.json({
        success: true,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
      });
    } catch (error: any) {
      console.error('[Auth] Register error:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    clearSessionCookie(res, req);
    res.json({ success: true });
  });

  app.get('/api/auth/me', async (req, res) => {
    try {
      const cookieHeader = req.headers.cookie;
      if (!cookieHeader) {
        res.json({ user: null });
        return;
      }
      const cookies = parseCookieHeader(cookieHeader);
      const token = cookies[COOKIE_NAME];
      if (!token) {
        res.json({ user: null });
        return;
      }
      const { payload } = await jwtVerify(token, getJwtSecret(), { algorithms: ['HS256'] });
      const userId = payload.userId as number;
      if (!userId) {
        clearSessionCookie(res, req);
        res.json({ user: null });
        return;
      }
      const user = await db.getUserById(userId);
      if (!user) {
        clearSessionCookie(res, req);
        res.json({ user: null });
        return;
      }
      res.json({
        user: { id: user.id, name: user.name, email: user.email, role: user.role, openId: user.openId },
      });
    } catch {
      clearSessionCookie(res, req);
      res.json({ user: null });
    }
  });

  // tRPC API (still available for all other procedures)
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
