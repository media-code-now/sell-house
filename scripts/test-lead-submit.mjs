import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";

const leadId = "11111111-1111-4111-8111-111111111111";
const contact = {
  draftToken: leadId, firstName: "Test", lastName: "Seller",
  phone: "7025550123", email: "test@example.com", contactConsent: true,
  turnstileToken: "verified-token",
};
const source = fs.readFileSync(new URL("../src/app/api/leads/submit/route.ts", import.meta.url), "utf8");
const code = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function handler({ verified = true, origin = true, allowed = true, savedId = leadId } = {}) {
  const exports = {};
  const calls = [];
  vm.runInNewContext(code, {
    exports, process, console: { error() {} },
    require(name) {
      if (name === "next/server") return {
        NextResponse: { json: (body, options) => ({ body, status: options?.status ?? 200 }) },
      };
      if (name === "@/lib/supabase/server") return {
        createServiceClient: () => ({ rpc: async (...args) => {
          calls.push(args);
          return { data: savedId, error: null };
        } }),
      };
      if (name === "@/lib/public-api-security") return {
        sameOrigin: () => origin,
        withinRateLimit: async () => allowed,
        verifyTurnstile: async (_request, token, action) => {
          assert.equal(token, contact.turnstileToken);
          assert.equal(action, "lead_submit");
          return verified;
        },
      };
      throw new Error(`Unexpected import: ${name}`);
    },
  });
  return { post: (body) => exports.POST({ json: async () => body, headers: new Headers() }), calls };
}

test("verified submissions save with or without an autofilled legacy spam field", async () => {
  for (const extra of [{}, { hpCheck: "autofilled by a password manager" }]) {
    const { post, calls } = handler();
    const result = await post({ ...contact, ...extra });
    assert.equal(result.status, 200);
    assert.equal(result.body.leadId, leadId);
    assert.equal(calls.length, 1);
    assert.equal(calls[0][0], "finalize_lead_draft");
    assert.equal(calls[0][1].p_draft_token, contact.draftToken);
  }
});

test("invalid security checks still block submissions before saving", async () => {
  for (const [options, status] of [[{ verified: false }, 422], [{ origin: false }, 403], [{ allowed: false }, 429]]) {
    const { post, calls } = handler(options);
    assert.equal((await post({ ...contact, hpCheck: "autofilled" })).status, status);
    assert.equal(calls.length, 0);
  }
});

test("a missing saved lead ID never reports success", async () => {
  const { post } = handler({ savedId: null });
  const result = await post(contact);
  assert.equal(result.status, 500);
  assert.equal(result.body.submitted, undefined);
});
