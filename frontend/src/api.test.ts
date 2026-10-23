import { it, expect, vi } from "vitest";
import { api, ApiError, errorMessage } from "./api";
import { request } from "./test/fixtures";
it("posts the real teacher schema only through the local API", async () => {
  const mock = vi
    .spyOn(globalThis, "fetch")
    .mockResolvedValue(new Response(JSON.stringify({ ok: true })));
  await api.recommend(request);
  expect(mock.mock.calls[0][0]).toBe("/api/recommend");
  expect(JSON.parse(String(mock.mock.calls[0][1]?.body))).toEqual(request);
  expect(mock.mock.calls[0][1]?.headers).not.toHaveProperty("Authorization");
});
it("passes capability only in the journey header, with explicit selection", async () => {
  const mock = vi
    .spyOn(globalThis, "fetch")
    .mockResolvedValue(new Response("{}"));
  await api.journey("wf", "ewm-catapult", false, "private-token");
  const [url, options] = mock.mock.calls[0];
  expect(url).toBe("/api/journey");
  expect(options?.headers).toHaveProperty("X-Workflow-Token", "private-token");
  expect(JSON.parse(String(options?.body))).toEqual({
    workflow_id: "wf",
    program_id: "ewm-catapult",
    teacher_selected: true,
    acknowledge_unknown: false,
  });
  expect(String(options?.body)).not.toContain("private-token");
});
it("does not expose server response text in an error", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(
      JSON.stringify({
        error: {
          code: "provider_unavailable",
          message: "SECRET upstream trace",
        },
      }),
      { status: 502 },
    ),
  );
  try {
    await api.health();
    throw Error("should fail");
  } catch (e) {
    expect(errorMessage(e)).not.toContain("SECRET");
    expect(errorMessage(e)).toContain("temporarily unavailable");
  }
});
it.each([
  "missing_configuration",
  "provider_timeout",
  "workflow_not_found",
  "workflow_consumed",
  "catalog_changed",
  "invalid_model_output",
  "invalid_input",
  "execution_limit",
  "network",
])("provides a safe recovery message for %s", (code) => {
  const msg = errorMessage(new ApiError(code));
  expect(msg.length).toBeGreaterThan(30);
  expect(msg).not.toMatch(/stack|Traceback|API_KEY/);
});
it("handles offline/network failure", async () => {
  vi.spyOn(globalThis, "fetch").mockRejectedValue(Error("secret body"));
  await expect(api.health()).rejects.toMatchObject({ code: "network" });
});
