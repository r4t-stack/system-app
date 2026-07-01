import { z } from "zod";

const hexColor = z
  .string()
  .regex(/^#([0-9a-fA-F]{6})$/, "Use a hex colour like #4f46e5")
  .optional()
  .or(z.literal(""));

export const createGroupSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  color: hexColor,
  parentId: z.string().cuid().nullish(),
});
export type CreateGroupInput = z.infer<typeof createGroupSchema>;

export const updateGroupSchema = z.object({
  id: z.string().cuid(),
  name: z.string().trim().min(1, "Name is required").max(120),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  color: hexColor,
});
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;

export const moveGroupSchema = z.object({
  id: z.string().cuid(),
  parentId: z.string().cuid().nullable(),
  sortOrder: z.number().int().min(0).optional(),
});
export type MoveGroupInput = z.infer<typeof moveGroupSchema>;
