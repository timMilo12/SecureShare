import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import * as path from "path";
import * as fs from "fs";
import { randomBytes } from "crypto";
import rateLimit from "express-rate-limit";
import * as cron from "node-cron";
import type { CreateSlotResponse, AccessSlotResponse, PublicSlot, Slot } from "@shared/schema";

function sanitizeSlot(slot: Slot): PublicSlot {
  return {
    id: slot.id,
    createdAt: slot.createdAt,
    expiresAt: slot.expiresAt,
  };
}

const UPLOADS_DIR = path.join(process.cwd(), "uploads");

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = randomBytes(16).toString("hex");
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({ storage: multerStorage });

const accessLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests, please try again later.",
});

cron.schedule("0 * * * *", async () => {
  console.log("Running cleanup job...");
  try {
    await storage.deleteExpiredSlots();
    console.log("Cleanup completed successfully");
  } catch (error) {
    console.error("Cleanup job failed:", error);
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/slot", async (req, res) => {
    try {
      const { password } = req.body;

      if (!password || password.length < 4) {
        return res.status(400).json({ error: "Password must be at least 4 characters" });
      }

      const slot = await storage.createSlot(password);

      const response: CreateSlotResponse = {
        slotId: slot.id,
        expiresAt: slot.expiresAt,
      };

      res.json(response);
    } catch (error) {
      console.error("Create slot error:", error);
      res.status(500).json({ error: "Failed to create slot" });
    }
  });

  app.post("/api/upload/:slotId", upload.array("files", 50), async (req, res) => {
    try {
      const { slotId } = req.params;
      const { password, text } = req.body;

      const slot = await storage.getSlot(slotId);
      if (!slot) {
        return res.status(404).json({ error: "Slot not found" });
      }

      if (Date.now() > slot.expiresAt) {
        await storage.deleteSlot(slotId);
        return res.status(410).json({ error: "Slot has expired" });
      }

      const isValid = await storage.verifySlotPassword(slotId, password);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid password" });
      }

      const files = req.files as Express.Multer.File[];

      for (const file of files || []) {
        await storage.addFile({
          id: randomBytes(16).toString("hex"),
          slotId,
          filename: file.filename,
          originalName: file.originalname,
          size: file.size,
          mimeType: file.mimetype,
          uploadedAt: Date.now(),
        });
      }

      if (text && text.trim()) {
        await storage.addTextContent({
          slotId,
          content: text,
        });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Failed to upload files" });
    }
  });

  app.post("/api/slot/:slotId", accessLimiter, async (req, res) => {
    try {
      const { slotId } = req.params;
      const { password } = req.body;

      const slot = await storage.getSlot(slotId);
      if (!slot) {
        return res.status(404).json({ error: "Slot not found" });
      }

      if (Date.now() > slot.expiresAt) {
        await storage.deleteSlot(slotId);
        return res.status(410).json({ error: "Slot has expired" });
      }

      const isValid = await storage.verifySlotPassword(slotId, password);
      
      if (!isValid) {
        const failedAttempts = await storage.incrementFailedAttempts(slotId);
        const remainingAttempts = 3 - failedAttempts;

        if (remainingAttempts <= 0) {
          await storage.deleteSlot(slotId);
          return res.status(403).json({ error: "Too many failed attempts. Slot deleted." });
        }

        return res.status(401).json({ 
          error: `Invalid password. ${remainingAttempts} attempts remaining.` 
        });
      }

      const files = await storage.getFiles(slotId);
      const textContent = await storage.getTextContent(slotId);

      const response: AccessSlotResponse = {
        slot: sanitizeSlot(slot),
        files,
        textContent,
      };

      res.json(response);
    } catch (error) {
      console.error("Access slot error:", error);
      res.status(500).json({ error: "Failed to access slot" });
    }
  });

  app.get("/api/download/:slotId/:fileId", async (req, res) => {
    try {
      const { slotId, fileId } = req.params;
      const { password } = req.query;

      const slot = await storage.getSlot(slotId);
      if (!slot) {
        return res.status(404).json({ error: "Slot not found" });
      }

      if (Date.now() > slot.expiresAt) {
        await storage.deleteSlot(slotId);
        return res.status(410).json({ error: "Slot has expired" });
      }

      const isValid = await storage.verifySlotPassword(slotId, password as string);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid password" });
      }

      const file = await storage.getFile(fileId);
      if (!file || file.slotId !== slotId) {
        return res.status(404).json({ error: "File not found" });
      }

      const filePath = path.join(UPLOADS_DIR, file.filename);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: "File not found on disk" });
      }

      res.download(filePath, file.originalName);
    } catch (error) {
      console.error("Download error:", error);
      res.status(500).json({ error: "Failed to download file" });
    }
  });

  app.delete("/api/slot/:slotId", async (req, res) => {
    try {
      const { slotId } = req.params;
      const { password } = req.body;

      const slot = await storage.getSlot(slotId);
      if (!slot) {
        return res.status(404).json({ error: "Slot not found" });
      }

      if (Date.now() > slot.expiresAt) {
        await storage.deleteSlot(slotId);
        return res.status(410).json({ error: "Slot has expired" });
      }

      const isValid = await storage.verifySlotPassword(slotId, password);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid password" });
      }

      await storage.deleteSlot(slotId);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete slot error:", error);
      res.status(500).json({ error: "Failed to delete slot" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
