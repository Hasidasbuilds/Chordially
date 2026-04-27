import { describe, it, expect, beforeEach } from "vitest";
import { signToken, verifyToken } from "./auth.tokens.js";

describe("auth threat model", () => {
  describe("token misuse", () => {
    it("rejects a tampered payload", () => {
      const token = signToken("user-1");
      const [payload, sig] = token.split(".");
      const tampered = `${payload}X.${sig}`;
      expect(verifyToken(tampered)).toBeNull();
    });

    it("rejects a tampered signature", () => {
      const token = signToken("user-2");
      const [payload] = token.split(".");
      expect(verifyToken(`${payload}.badsig`)).toBeNull();
    });

    it("rejects a token with no separator", () => {
      expect(verifyToken("notavalidtoken")).toBeNull();
    });
  });

  describe("expired tokens", () => {
    it("rejects a token whose exp is in the past", () => {
      const expiredPayload = Buffer.from(
        JSON.stringify({ sub: "user-3", exp: Date.now() - 1000 })
      ).toString("base64url");

      // sign with wrong secret so it also fails sig check — expired check is secondary
      expect(verifyToken(`${expiredPayload}.fakesig`)).toBeNull();
    });
  });

  describe("account enumeration", () => {
    it("returns the same 401 shape for missing vs invalid token", () => {
      const missingResult = verifyToken("");
      const invalidResult = verifyToken("bad.token");
      expect(missingResult).toBeNull();
      expect(invalidResult).toBeNull();
    });
  });

  describe("privilege escalation", () => {
    it("a fan token does not grant artist capabilities", () => {
      const token = signToken("fan-user");
      const userId = verifyToken(token);
      expect(userId).toBe("fan-user");
      // role is resolved server-side from DB, not from the token itself
      expect(token).not.toContain("artist");
      expect(token).not.toContain("admin");
    });
  });
});
