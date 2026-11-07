import { z } from "zod";
export const actions = [
  "idle",
  "look_at_user",
  "blink",
  "sit",
  "lie_down",
  "sleep",
  "wake_up",
  "walk",
  "tail_wag",
  "eat",
  "play",
  "happy",
  "curious",
  "listen",
  "speak",
] as const;
export const actionSchema = z.enum(actions);
export type Action = z.infer<typeof actionSchema>;
export const petSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1).max(24),
  personality: z.enum(["friendly", "calm", "playful", "independent"]),
  voice: z.enum(["marin", "cedar"]),
  adoptedAt: z.string().datetime(),
});
export type Pet = z.infer<typeof petSchema>;
export const messageSchema = z.object({
  id: z.string().max(100),
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
  modality: z.enum(["text", "voice"]).default("text"),
  createdAt: z.string(),
  failed: z.boolean().optional(),
});
export type Message = z.infer<typeof messageSchema>;
export const stateSchema = z.object({
  energy: z.number().min(0).max(100),
  satiety: z.number().min(0).max(100),
  mood: z.enum(["calm", "happy", "curious", "sleepy"]),
  activity: actionSchema,
  lastFedAt: z.string().nullable(),
  lastPlayedAt: z.string().nullable(),
  lastInteractionAt: z.string().nullable(),
  updatedAt: z.string(),
});
export type PetState = z.infer<typeof stateSchema>;
export const chatSchema = z
  .object({
    pet: petSchema,
    language: z.enum(["auto", "zh", "en"]).default("auto"),
    messages: z.array(messageSchema).min(1).max(30),
    state: stateSchema,
    memories: z.array(z.string().max(500)).max(12).default([]),
  })
  .refine((v) => v.messages.at(-1)?.role === "user", {
    message: "最后一条消息必须来自用户",
  });
export const replySchema = z.object({
  reply: z.string().min(1),
  action: actionSchema,
  mood: z.enum(["calm", "happy", "curious", "sleepy"]),
});
export const preferencesSchema = z.object({
  language: z.enum(["auto", "zh", "en"]).default("auto"),
  subtitles: z.boolean().default(true),
  autoSpeech: z.boolean().default(false),
  memory: z.boolean().default(false),
});
export const memorySchema = z.object({
  id: z.string(),
  content: z.string().min(1).max(500),
  createdAt: z.string(),
});
export const savedSchema = z.object({
  pet: petSchema.nullable(),
  state: stateSchema,
  messages: z.array(messageSchema).max(500),
  memories: z.array(memorySchema).max(100),
  preferences: preferencesSchema,
});
export type Saved = z.infer<typeof savedSchema>;
