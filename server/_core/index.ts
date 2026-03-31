import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import multer from "multer";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
// OAuth removed - using password auth
import { appRouter } from "../routers";
import { handleStripeWebhook } from "../stripe/webhookHandler";
import { storagePut } from "../storage";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { nanoid } from "nanoid";
import { jwtVerify } from "jose";
import { parse as parseCookieHeader } from "cookie";
import { COOKIE_NAME } from "@shared/const";
import { ENV } from "./env";
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
      // Verify auth using same method as context.ts
      const cookieHeader = req.headers.cookie;
      if (!cookieHeader) {
        res.status(401).json({ error: 'No autenticado' });
        return;
      }
      const cookies = parseCookieHeader(cookieHeader);
      const token = cookies[COOKIE_NAME];
      if (!token) {
        res.status(401).json({ error: 'No autenticado' });
        return;
      }
      let userId: number;
      try {
        const secretKey = new TextEncoder().encode(ENV.cookieSecret);
        const { payload } = await jwtVerify(token, secretKey, { algorithms: ['HS256'] });
        userId = payload.userId as number;
        if (!userId) throw new Error('No userId in token');
      } catch {
        res.status(401).json({ error: 'Sesión expirada' });
        return;
      }

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
  
  // Password auth handled via tRPC auth router
  // tRPC API
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
