import { z } from "zod";
import { PERMISSIONS } from "@/lib/constants";

export const shareWithUserSchema = z.object({
  groupId: z.string().cuid(),
  email: z.string().email("Enter a valid email"),
  permission: z.enum(PERMISSIONS),
});
export type ShareWithUserInput = z.infer<typeof shareWithUserSchema>;

export const shareWithTeamSchema = z.object({
  groupId: z.string().cuid(),
  teamId: z.string().cuid(),
  permission: z.enum(PERMISSIONS),
});

export const createTeamSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
});
