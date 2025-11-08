import Database from "better-sqlite3";
import { randomBytes } from "crypto";
import * as argon2 from "argon2";
import { type Slot, type File as FileData, type TextContent } from "@shared/schema";
import * as fs from "fs";
import * as path from "path";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export interface IStorage {
  createSlot(password: string): Promise<Slot>;
  getSlot(slotId: string): Promise<Slot | null>;
  verifySlotPassword(slotId: string, password: string): Promise<boolean>;
  incrementFailedAttempts(slotId: string): Promise<number>;
  addFile(file: FileData): Promise<void>;
  getFiles(slotId: string): Promise<FileData[]>;
  getFile(fileId: string): Promise<FileData | null>;
  addTextContent(textContent: TextContent): Promise<void>;
  getTextContent(slotId: string): Promise<TextContent | null>;
  deleteSlot(slotId: string): Promise<void>;
  getExpiredSlots(): Promise<Slot[]>;
  deleteExpiredSlots(): Promise<void>;
}

export class SqliteStorage implements IStorage {
  private db: Database.Database;

  constructor() {
    this.db = new Database("secureshare.db");
    this.initDatabase();
  }

  private initDatabase() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS slots (
        id TEXT PRIMARY KEY,
        passwordHash TEXT NOT NULL,
        createdAt INTEGER NOT NULL,
        expiresAt INTEGER NOT NULL,
        failedAttempts INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS files (
        id TEXT PRIMARY KEY,
        slotId TEXT NOT NULL,
        filename TEXT NOT NULL,
        originalName TEXT NOT NULL,
        size INTEGER NOT NULL,
        mimeType TEXT,
        uploadedAt INTEGER NOT NULL,
        FOREIGN KEY (slotId) REFERENCES slots (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS text_contents (
        slotId TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        FOREIGN KEY (slotId) REFERENCES slots (id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_slots_expires ON slots (expiresAt);
      CREATE INDEX IF NOT EXISTS idx_files_slot ON files (slotId);
    `);
  }

  private generateSlotId(): string {
    const length = Math.floor(Math.random() * 3) + 6;
    let id = "";
    for (let i = 0; i < length; i++) {
      id += Math.floor(Math.random() * 10);
    }
    return id;
  }

  async createSlot(password: string): Promise<Slot> {
    let slotId = this.generateSlotId();
    
    while (this.db.prepare("SELECT id FROM slots WHERE id = ?").get(slotId)) {
      slotId = this.generateSlotId();
    }

    const passwordHash = await argon2.hash(password);
    const createdAt = Date.now();
    const expiresAt = createdAt + 24 * 60 * 60 * 1000;

    const slot: Slot = {
      id: slotId,
      passwordHash,
      createdAt,
      expiresAt,
      failedAttempts: 0,
    };

    this.db.prepare(`
      INSERT INTO slots (id, passwordHash, createdAt, expiresAt, failedAttempts)
      VALUES (?, ?, ?, ?, ?)
    `).run(slot.id, slot.passwordHash, slot.createdAt, slot.expiresAt, slot.failedAttempts);

    return slot;
  }

  async getSlot(slotId: string): Promise<Slot | null> {
    const row = this.db.prepare("SELECT * FROM slots WHERE id = ?").get(slotId);
    return row as Slot | null;
  }

  async verifySlotPassword(slotId: string, password: string): Promise<boolean> {
    const slot = await this.getSlot(slotId);
    if (!slot) return false;

    try {
      return await argon2.verify(slot.passwordHash, password);
    } catch {
      return false;
    }
  }

  async incrementFailedAttempts(slotId: string): Promise<number> {
    this.db.prepare(`
      UPDATE slots SET failedAttempts = failedAttempts + 1 WHERE id = ?
    `).run(slotId);

    const slot = await this.getSlot(slotId);
    return slot?.failedAttempts || 0;
  }

  async addFile(file: FileData): Promise<void> {
    this.db.prepare(`
      INSERT INTO files (id, slotId, filename, originalName, size, mimeType, uploadedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(file.id, file.slotId, file.filename, file.originalName, file.size, file.mimeType, file.uploadedAt);
  }

  async getFiles(slotId: string): Promise<FileData[]> {
    const rows = this.db.prepare("SELECT * FROM files WHERE slotId = ?").all(slotId);
    return rows as FileData[];
  }

  async getFile(fileId: string): Promise<FileData | null> {
    const row = this.db.prepare("SELECT * FROM files WHERE id = ?").get(fileId);
    return row as FileData | null;
  }

  async addTextContent(textContent: TextContent): Promise<void> {
    this.db.prepare(`
      INSERT OR REPLACE INTO text_contents (slotId, content)
      VALUES (?, ?)
    `).run(textContent.slotId, textContent.content);
  }

  async getTextContent(slotId: string): Promise<TextContent | null> {
    const row = this.db.prepare("SELECT * FROM text_contents WHERE slotId = ?").get(slotId);
    return row as TextContent | null;
  }

  async deleteSlot(slotId: string): Promise<void> {
    const files = await this.getFiles(slotId);
    
    for (const file of files) {
      const filePath = path.join(UPLOADS_DIR, file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    this.db.prepare("DELETE FROM slots WHERE id = ?").run(slotId);
  }

  async getExpiredSlots(): Promise<Slot[]> {
    const now = Date.now();
    const rows = this.db.prepare("SELECT * FROM slots WHERE expiresAt <= ?").all(now);
    return rows as Slot[];
  }

  async deleteExpiredSlots(): Promise<void> {
    const expiredSlots = await this.getExpiredSlots();
    
    for (const slot of expiredSlots) {
      await this.deleteSlot(slot.id);
    }
  }
}

export const storage = new SqliteStorage();
