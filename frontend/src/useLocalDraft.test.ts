import { renderHook, act } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useLocalDraft, SAVE_DELAY } from "./useLocalDraft";
import { DRAFT_KEY, readDraft, serializeDraft } from "./draftStorage";
import { draftPayload, savedDraft } from "./test/draftFixture";
beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());
function setup() { return renderHook(({ payload }) => useLocalDraft(payload), { initialProps: { payload: draftPayload() } }); }
const tick = () => act(() => vi.advanceTimersByTime(SAVE_DELAY));
it("debounces an initial generated plan and avoids repeated identical writes", () => {
    const write = vi.spyOn(Storage.prototype, "setItem"), h = setup();
    act(() => h.result.current.beginNew());
    expect(h.result.current.status).toBe("saving");
    act(() => vi.advanceTimersByTime(SAVE_DELAY - 1));
    expect(write).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(write).toHaveBeenCalledTimes(1);
    expect(h.result.current.status).toBe("saved");
    h.rerender({ payload: draftPayload() });
    tick();
    expect(write).toHaveBeenCalledTimes(1);
});
it("debounces changes across phases, notes, inquiry and review status", () => {
    const h = setup();
    act(() => h.result.current.beginNew());
    tick();
    const p = draftPayload();
    p.edited.before.learning_objectives[0] = "Objective edit";
    h.rerender({ payload: p });
    act(() => vi.advanceTimersByTime(400));
    const q = structuredClone(p);
    q.edited.during.evidence_collection[0] = "Observe safely";
    q.edited.after.assessment[0] = "Assess actual observations";
    q.notes = "Notes";
    q.inquiry = "Edited inquiry";
    q.reviewed = true;
    h.rerender({ payload: q });
    tick();
    expect(readDraft().draft).toMatchObject(q);
    expect(readDraft().draft?.edited_at).not.toBe(readDraft().draft?.created_at);
});
it.each(["pagehide", "visibilitychange"])("flushes pending edits on %s", event => {
    const h = setup();
    act(() => h.result.current.beginNew());
    if (event === "visibilitychange")
        vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
    act(() => event === "pagehide" ? window.dispatchEvent(new Event(event)) : document.dispatchEvent(new Event(event)));
    expect(readDraft().draft).not.toBeNull();
    expect(h.result.current.status).toBe("saved");
});
it("restores a saved document without a redundant write", () => {
    localStorage.setItem(DRAFT_KEY, serializeDraft(savedDraft()));
    const write = vi.spyOn(Storage.prototype, "setItem"), h = setup();
    act(() => h.result.current.adopt(readDraft()));
    tick();
    expect(write).not.toHaveBeenCalled();
    expect(h.result.current.status).toBe("saved");
});
it.each(["quota", "unexpected"])("reports %s write failure without claiming saved", reason => {
    const h = setup();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw reason === "quota" ? new DOMException("Full", "QuotaExceededError") : Error(reason); });
    act(() => h.result.current.beginNew());
    tick();
    expect(h.result.current.status).toBe("error");
    expect(readDraft().draft).toBeNull();
});
it("blocks replacement until explicitly authorized", () => {
    const old = serializeDraft(savedDraft());
    localStorage.setItem(DRAFT_KEY, old);
    const h = setup();
    act(() => h.result.current.beginNew());
    tick();
    expect(h.result.current.status).toBe("replacement");
    expect(localStorage.getItem(DRAFT_KEY)).toBe(old);
    act(() => h.result.current.authorize(old));
    expect(readDraft().draft?.draft_id).not.toBe(savedDraft().draft_id);
});
it("deletion cancels pending saves and keeps edits local until explicit saving", () => {
    const h = setup();
    act(() => h.result.current.beginNew());
    tick();
    const p = draftPayload();
    p.notes = "Pending";
    h.rerender({ payload: p });
    act(() => h.result.current.remove());
    tick();
    act(() => window.dispatchEvent(new Event("pagehide")));
    expect(localStorage.getItem(DRAFT_KEY)).toBeNull();
    expect(h.result.current.status).toBe("deleted");
    p.notes = "Later edit";
    h.rerender({ payload: { ...p } });
    tick();
    expect(readDraft().draft).toBeNull();
    act(() => h.result.current.authorize(null));
    expect(readDraft().draft?.notes).toBe("Later edit");
});
it("does not claim deletion on failed removal", () => {
    const h = setup();
    act(() => h.result.current.beginNew());
    tick();
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => { throw Error("blocked"); });
    act(() => h.result.current.remove());
    expect(h.result.current.status).toBe("error");
    expect(readDraft().draft).not.toBeNull();
});
it("detects another tab and pauses rather than overwriting", () => {
    const h = setup();
    act(() => h.result.current.beginNew());
    tick();
    const other = savedDraft();
    other.notes = "Other tab";
    const raw = serializeDraft(other);
    localStorage.setItem(DRAFT_KEY, raw);
    act(() => window.dispatchEvent(new StorageEvent("storage", { key: DRAFT_KEY, newValue: raw })));
    tick();
    expect(h.result.current.status).toBe("conflict");
    expect(readDraft().draft?.notes).toBe("Other tab");
});
it("checks storage again before writing even if no storage event arrived", () => {
    const h = setup();
    act(() => h.result.current.beginNew());
    localStorage.setItem(DRAFT_KEY, serializeDraft(savedDraft()));
    tick();
    expect(h.result.current.status).toBe("conflict");
    expect(readDraft().draft?.draft_id).toBe(savedDraft().draft_id);
});
it("rejects stale replacement and deletion consent after another tab changed storage", () => {
    const h = setup();
    act(() => h.result.current.beginNew());
    const raw = serializeDraft(savedDraft());
    localStorage.setItem(DRAFT_KEY, raw);
    act(() => h.result.current.authorize(null));
    expect(h.result.current.status).toBe("conflict");
    act(() => h.result.current.remove(null));
    expect(localStorage.getItem(DRAFT_KEY)).toBe(raw);
});
it("does not activate saving when storage reads are blocked", () => {
  const h = setup();
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new DOMException("Denied", "SecurityError"); });
  act(() => h.result.current.beginNew()); tick();
  expect(h.result.current.status).toBe("error"); expect(h.result.current.enabled).toBe(false);
});
