import { describe, it, expect } from "vitest";
import { entryCreateSchema, looksLikeRawSecret } from "./entry";

const GROUP_ID = "clabcdefghijklmnopqrstuvw";

describe("looksLikeRawSecret", () => {
  it("flags a URI with embedded credentials", () => {
    expect(looksLikeRawSecret("postgres://user:S3cretPass@host/db")).toBe(true);
  });
  it("flags a long high-entropy token", () => {
    expect(looksLikeRawSecret("Abcd1234EfghXYZ9longtokenvalue")).toBe(true);
  });
  it("allows a Vault path reference", () => {
    expect(looksLikeRawSecret("secret/data/prod/db#password")).toBe(false);
  });
  it("allows an env var name", () => {
    expect(looksLikeRawSecret("DB_PASSWORD")).toBe(false);
  });
  it("allows an AWS ARN", () => {
    expect(
      looksLikeRawSecret("arn:aws:secretsmanager:us-east-1:1:secret:db"),
    ).toBe(false);
  });
});

describe("entryCreateSchema", () => {
  it("accepts a valid DB connection with a reference", () => {
    const res = entryCreateSchema.safeParse({
      type: "DB_CONNECTION",
      name: "DB",
      groupId: GROUP_ID,
      dbEngine: "postgres",
      dbHost: "db",
      dbPort: "5432",
      secretProvider: "VAULT",
      secretRef: "secret/data/db#password",
    });
    expect(res.success).toBe(true);
    if (res.success && res.data.type === "DB_CONNECTION") {
      expect(res.data.dbPort).toBe(5432); // coerced to number
    }
  });

  it("rejects a DB connection whose secretRef is a raw credential", () => {
    const res = entryCreateSchema.safeParse({
      type: "DB_CONNECTION",
      name: "DB",
      groupId: GROUP_ID,
      dbEngine: "postgres",
      dbHost: "db",
      secretProvider: "ENV",
      secretRef: "postgres://user:S3cretPass@host/db",
    });
    expect(res.success).toBe(false);
  });

  it("requires a valid URL for links", () => {
    expect(
      entryCreateSchema.safeParse({
        type: "LINK",
        name: "L",
        groupId: GROUP_ID,
        url: "not-a-url",
      }).success,
    ).toBe(false);
  });
});
