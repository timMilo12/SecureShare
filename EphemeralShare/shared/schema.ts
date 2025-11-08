import { z } from "zod";

export const slotSchema = z.object({
  id: z.string(),
  passwordHash: z.string(),
  createdAt: z.number(),
  expiresAt: z.number(),
  failedAttempts: z.number().default(0),
});

export const fileSchema = z.object({
  id: z.string(),
  slotId: z.string(),
  filename: z.string(),
  originalName: z.string(),
  size: z.number(),
  mimeType: z.string().optional(),
  uploadedAt: z.number(),
});

export const textContentSchema = z.object({
  slotId: z.string(),
  content: z.string(),
});

export const createSlotSchema = z.object({
  password: z.string().min(4, "Password must be at least 4 characters"),
});

export const accessSlotSchema = z.object({
  slotId: z.string(),
  password: z.string(),
});

export const uploadTextSchema = z.object({
  slotId: z.string(),
  password: z.string(),
  text: z.string(),
});

export type Slot = z.infer<typeof slotSchema>;
export type File = z.infer<typeof fileSchema>;
export type TextContent = z.infer<typeof textContentSchema>;
export type CreateSlot = z.infer<typeof createSlotSchema>;
export type AccessSlot = z.infer<typeof accessSlotSchema>;
export type UploadText = z.infer<typeof uploadTextSchema>;

export const publicSlotSchema = z.object({
  id: z.string(),
  createdAt: z.number(),
  expiresAt: z.number(),
});

export type PublicSlot = z.infer<typeof publicSlotSchema>;

export interface SlotData {
  slot: PublicSlot;
  files: File[];
  textContent: TextContent | null;
}

export interface CreateSlotResponse {
  slotId: string;
  expiresAt: number;
}

export interface AccessSlotResponse extends SlotData {}
