import { hash, verify } from "@node-rs/argon2";

// Argon2id parameters — sensible defaults for interactive logins.
const OPTS = {
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
} as const;

export function hashPassword(password: string): Promise<string> {
  return hash(password, OPTS);
}

export async function verifyPassword(
  storedHash: string,
  password: string,
): Promise<boolean> {
  try {
    return await verify(storedHash, password, OPTS);
  } catch {
    return false;
  }
}
