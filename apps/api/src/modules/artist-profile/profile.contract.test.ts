// CHORD-060: Contract tests for profile APIs and slug behavior

import { resolveSlug } from "./slug.js";
import { isProfileVisible, setModerationState, initModeration } from "./moderation.js";
import { resolveDisplayName, setGlobalDisplayMode } from "./fan-privacy.js";
import { attachWallet, verifyWallet, getWallet } from "./wallet.js";

type TestResult = { name: string; passed: boolean; error?: string };
const results: TestResult[] = [];

function test(name: string, fn: () => void) {
  try {
    fn();
    results.push({ name, passed: true });
  } catch (e) {
    results.push({ name, passed: false, error: String(e) });
  }
}

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(`Assertion failed: ${msg}`);
}

// Slug contract tests
test("slug resolves lowercase hyphenated form", () => {
  const slug = resolveSlug("My Artist Name");
  assert(slug === slug.toLowerCase(), "slug must be lowercase");
  assert(!slug.includes(" "), "slug must not contain spaces");
});

test("slug rejects empty string", () => {
  let threw = false;
  try { resolveSlug(""); } catch { threw = true; }
  assert(threw, "empty slug should throw");
});

// Moderation visibility contract
test("new profile is visible by default", () => {
  initModeration("artist-vis-1");
  assert(isProfileVisible("artist-vis-1"), "active profile should be visible");
});

test("hidden profile is not visible", () => {
  setModerationState("artist-vis-2", "hidden", "admin-1");
  assert(!isProfileVisible("artist-vis-2"), "hidden profile should not be visible");
});

// Fan privacy display name contract
test("anonymous mode returns Anonymous", () => {
  setGlobalDisplayMode("fan-1", "anonymous");
  assert(resolveDisplayName("fan-1", "Alice") === "Anonymous", "anonymous mode must return Anonymous");
});

test("pseudonym mode returns pseudonym", () => {
  setGlobalDisplayMode("fan-2", "pseudonym", "StarGazer");
  assert(resolveDisplayName("fan-2", "Bob") === "StarGazer", "pseudonym mode must return pseudonym");
});

// Wallet attachment contract
test("wallet attaches and verifies", () => {
  attachWallet({ artistId: "artist-w1", address: "0xabc", network: "ethereum", verified: false, lastValidatedAt: null });
  const verified = verifyWallet("artist-w1");
  assert(verified.verified === true, "wallet should be verified after verifyWallet");
  assert(getWallet("artist-w1")?.address === "0xabc", "wallet address should persist");
});

test("wallet attach requires address", () => {
  let threw = false;
  try { attachWallet({ artistId: "artist-w2", address: "", network: "solana", verified: false, lastValidatedAt: null }); }
  catch { threw = true; }
  assert(threw, "empty address should throw");
});

export function runContractTests(): TestResult[] {
  const passed = results.filter((r) => r.passed).length;
  console.log(`Contract tests: ${passed}/${results.length} passed`);
  results.filter((r) => !r.passed).forEach((r) => console.error(`  FAIL: ${r.name} — ${r.error}`));
  return results;
}
