import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { chromium } from "playwright";

const base = (process.argv[2] || "http://127.0.0.1:3107").replace(/\/$/, "");
const systemChrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const executablePath = process.env.MOBILE_CHROME_PATH || (existsSync(systemChrome) ? systemChrome : undefined);
const browser = await chromium.launch({ executablePath, headless: true });
const storageKey = "haven-seller-questionnaire-v1";
const tokenKey = "haven-seller-draft-token-v1";
const address = "123 Test Street, Las Vegas, NV";
const leadId = "11111111-1111-4111-8111-111111111111";

async function session({ width = 390, draftDelay = 0, failDraft = false, blockStorage = false, stored } = {}) {
  const context = await browser.newContext({ viewport: { width, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const calls = [], errors = [];
  const draftConcurrency = { active: 0, maximum: 0 };
  // Every API request is intercepted, including when this script targets production.
  await context.route("**/api/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const body = request.postDataJSON();
    calls.push({ path, body });
    if (path === "/api/leads/draft") {
      draftConcurrency.active++;
      draftConcurrency.maximum = Math.max(draftConcurrency.maximum, draftConcurrency.active);
      if (draftDelay) await new Promise((resolve) => setTimeout(resolve, draftDelay));
    }
    await route.fulfill({
      status: path === "/api/leads/draft" && failDraft ? 503 : 200,
      json: path === "/api/leads/submit" ? { submitted: true, leadId } : path === "/api/leads/draft" && failDraft ? { error: "Test save unavailable" } : { saved: true },
    }).catch(() => {});
    if (path === "/api/leads/draft") draftConcurrency.active--;
  });
  await context.route("https://www.googletagmanager.com/**", (route) => route.fulfill({ body: "", contentType: "application/javascript" }));
  await context.route(/https:\/\/[^/]*google-analytics\.com\//, (route) => route.fulfill({ status: 204 }));
  if (blockStorage) await context.addInitScript(() => {
    for (const key of ["localStorage", "sessionStorage"]) Object.defineProperty(window, key, { get() { throw new DOMException("Storage blocked", "SecurityError"); } });
  });
  if (stored) await context.addInitScript(({ storageKey, tokenKey, stored, leadId }) => {
    localStorage.setItem(storageKey, JSON.stringify(stored));
    localStorage.setItem(tokenKey, leadId);
  }, { storageKey, tokenKey, stored, leadId });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  page.setDefaultTimeout(8000);
  return { context, page, calls, errors, draftConcurrency };
}

async function noOverflow(page) {
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, "Horizontal overflow");
}

async function next(page) { await page.getByRole("button", { name: /^(Next|Continue)$/ }).click(); }

async function reachContact(page) {
  await page.getByRole("textbox", { name: "Property address", exact: true }).fill(address);
  await next(page);
  for (const choice of ["Single Family", "Good", "Relocating", "Within 30 days"]) {
    await page.getByRole("button", { name: choice, exact: true }).click();
    await next(page);
  }
  await page.getByRole("textbox", { name: "Estimated property value" }).fill("250,000");
  await page.getByRole("textbox", { name: "Estimated property value" }).press("Enter");
  await page.getByRole("heading", { name: "Where should we send your offer?" }).waitFor();
}

async function fillContact(page) {
  for (const [name, value] of [["First name", "Test"], ["Last name", "Seller"], ["Phone", "7025550123"], ["Email", "mobile-test@example.com"]]) await page.getByRole("textbox", { name, exact: true }).fill(value);
  await page.getByRole("checkbox").first().check();
}

try {
  for (const width of [320, 390, 412]) {
    const { context, page, errors } = await session({ width });
    await page.goto(base + "/", { waitUntil: "networkidle" });
    await noOverflow(page);
    assert.equal(await page.locator("header").getByRole("link", { name: "Get My Cash Offer", exact: true }).isVisible(), false, "Desktop CTA appears on mobile");
    await page.getByRole("button", { name: "Toggle navigation" }).click();
    assert.equal(await page.getByRole("navigation", { name: "Mobile navigation" }).isVisible(), true);
    await page.getByRole("button", { name: "Toggle navigation" }).click();
    await page.getByRole("textbox", { name: "Property address" }).first().focus();
    assert.equal(await page.locator(".mobile-offer-cta").isVisible(), false, "Fixed CTA obscures focused address form");
    await page.getByRole("textbox", { name: "Property address" }).first().fill(address);
    await page.getByRole("textbox", { name: "Property address" }).first().press("Enter");
    await page.waitForURL(/\/offer/);
    await page.getByRole("textbox", { name: "Property address", exact: true }).waitFor();
    await page.waitForFunction((address) => document.querySelector('input[aria-label="Property address"]')?.value === address, address);
    await reachContact(page);
    await noOverflow(page);
    assert.equal(await page.evaluate(() => document.activeElement?.tagName), "H1", "New step does not receive accessible focus");
    assert.deepEqual(errors, []);
    await context.close();
    console.log(`PASS mobile layout and complete questionnaire navigation at ${width}px`);
  }

  {
    const { context, page, errors } = await session({ draftDelay: 4000 });
    await page.goto(base + "/offer/", { waitUntil: "networkidle" });
    assert.notEqual(await page.evaluate(() => document.activeElement?.tagName), "INPUT", "Initial page opens the keyboard automatically");
    await page.getByRole("textbox", { name: "Property address", exact: true }).fill(address);
    const start = Date.now();
    await page.getByRole("textbox", { name: "Property address", exact: true }).press("Enter");
    await page.getByRole("heading", { name: "What type of property is it?" }).waitFor();
    const elapsed = Date.now() - start;
    assert.ok(elapsed < 1500, `Navigation waited for a server save (${elapsed}ms)`);
    await page.getByRole("button", { name: "Go back" }).click();
    assert.equal(await page.evaluate(() => document.activeElement?.tagName), "H1");
    assert.deepEqual(errors, []);
    await context.close();
    console.log(`PASS slow draft save: next step visible in ${elapsed}ms with a 4000ms server delay`);
  }

  {
    const { context, page, calls, errors } = await session({ blockStorage: true });
    await page.goto(base + "/offer/", { waitUntil: "networkidle" });
    await reachContact(page);
    await fillContact(page);
    await page.getByRole("button", { name: "Get My Offer", exact: true }).click();
    await page.waitForURL(/\/offer\/thank-you/);
    await page.getByRole("heading", { name: "We’re Reviewing Your Property" }).waitFor();
    const submitted = calls.find((call) => call.path === "/api/leads/submit");
    assert.ok(submitted?.body.draftToken);
    assert.equal(submitted.body.marketingConsent, false);
    assert.equal(calls.filter((call) => call.path === "/api/leads/submit").length, 1);
    const finalDraft = calls.filter((call) => call.path === "/api/leads/draft").at(-1);
    assert.equal(finalDraft.body.step, 6);
    assert.equal(finalDraft.body.answers.estimatedValue, "250,000");
    assert.deepEqual(errors, []);
    await context.close();
    console.log("PASS blocked local/session storage: full submission and confirmation, with API writes mocked");
  }

  {
    const { context, page, calls, draftConcurrency } = await session({ draftDelay: 1000 });
    await page.goto(base + "/offer/", { waitUntil: "networkidle" });
    await reachContact(page);
    await fillContact(page);
    await page.getByRole("button", { name: "Get My Offer", exact: true }).click();
    await page.waitForURL(/\/offer\/thank-you/);
    assert.equal(draftConcurrency.maximum, 1, "Concurrent draft writes could overwrite newer answers");
    const finalSaveIndex = calls.findLastIndex((call) => call.path === "/api/leads/draft");
    const submissionIndex = calls.findIndex((call) => call.path === "/api/leads/submit");
    assert.ok(finalSaveIndex < submissionIndex);
    assert.equal(calls[finalSaveIndex].body.step, 6);
    assert.equal(calls[finalSaveIndex].body.answers.estimatedValue, "250,000");
    const completedSteps = new Set(calls.filter((call) => call.path === "/api/analytics/events" && call.body?.eventType === "offer_form_step_completed").map((call) => call.body.metadata.step));
    assert.deepEqual([...completedSteps].sort(), [1, 2, 3, 4, 5, 6], "Coalescing saves dropped step-completion analytics");
    await context.close();
    console.log("PASS background saves remain ordered and the latest answers are saved before submission");
  }

  {
    const { context, page, calls, errors } = await session({ failDraft: true });
    await page.goto(base + "/offer/", { waitUntil: "networkidle" });
    await reachContact(page);
    await fillContact(page);
    await page.getByRole("button", { name: "Get My Offer", exact: true }).click();
    await page.getByRole("alert").filter({ hasText: "Test save unavailable" }).waitFor();
    assert.equal(calls.some((call) => call.path === "/api/leads/submit"), false, "Submission bypassed the required final save");
    assert.equal(await page.getByRole("button", { name: "Get My Offer", exact: true }).isEnabled(), true);
    assert.deepEqual(errors, []);
    await context.close();
    console.log("PASS failed final draft save keeps submission retryable and prevents an incomplete lead");
  }

  for (const changedProperty of [false, true]) {
    const stored = { answers: { address, propertyType: "Condo", condition: "", reasons: [], timeline: "", estimatedValue: "" }, lastCompletedStep: 2 };
    const { context, page } = await session({ stored });
    const requested = changedProperty ? "456 New Street, Henderson, NV" : address;
    await page.goto(base + "/offer/?address=" + encodeURIComponent(requested), { waitUntil: "networkidle" });
    await page.getByRole("heading", { name: changedProperty ? "What’s the property address?" : "What condition is the property in?" }).waitFor();
    if (changedProperty) assert.equal(await page.getByRole("textbox", { name: "Property address", exact: true }).inputValue(), requested);
    await context.close();
  }
  console.log("PASS saved progress resumes for the same property and resets for a different address");
} finally {
  await browser.close();
}
