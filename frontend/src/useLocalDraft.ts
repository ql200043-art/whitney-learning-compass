import { useEffect, useRef, useState } from "react";
import { DRAFT_KEY, readDraft, serializeDraft } from "./draftStorage";
import type { DraftPayload, DraftRead, LocalDraft } from "./draftStorage";
export const SAVE_DELAY = 650;
export type SaveState = "idle" | "saving" | "saved" | "error" | "replacement" | "conflict" | "deleted" | "paused";
export function useLocalDraft(payload: DraftPayload | null) {
    const [stored, setStored] = useState<DraftRead>(() => readDraft());
    const [status, setStatus] = useState<SaveState>("idle");
    const [enabled, setEnabled] = useState(false);
    const active = useRef(false), expected = useRef(stored.raw), latest = useRef(payload);
    const session = useRef<{
        id: string;
        created: string;
    } | null>(null);
    const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const previous = useRef<string | null>(null);
    latest.current = payload;
    function cancel() { clearTimeout(timer.current); timer.current = undefined; }
    function pause(next: SaveState) { cancel(); active.current = false; setEnabled(false); setStatus(next); }
    function refresh() { const value = readDraft(); setStored(value); return value; }
    function conflict(value: DraftRead) { setStored(value); pause("conflict"); }
    function flush() {
        cancel();
        if (!active.current || !session.current || !latest.current)
            return;
        const signature = JSON.stringify(latest.current);
        if (signature === previous.current)
            return;
        const now = readDraft();
        if (now.problem === "unavailable") {
            setStored(now);
            pause("error");
            return;
        }
        if (now.raw !== expected.current) {
            conflict(now);
            return;
        }
        const draft: LocalDraft = { schema_version: 1, draft_id: session.current.id, created_at: session.current.created, edited_at: new Date().toISOString(), ...latest.current };
        try {
            const raw = serializeDraft(draft);
            window.localStorage.setItem(DRAFT_KEY, raw);
            expected.current = raw;
            previous.current = signature;
            setStored({ raw, draft, problem: null });
            setStatus("saved");
        }
        catch {
            pause("error");
        }
    }
    function beginNew() {
        cancel();
        previous.current = null;
        session.current = { id: crypto.randomUUID(), created: new Date().toISOString() };
        const now = refresh();
        expected.current = now.raw;
        const allow = now.raw === null && now.problem === null;
        active.current = allow;
        setEnabled(allow);
        setStatus(now.problem === "unavailable" ? "error" : allow ? "saving" : "replacement");
    }
    function adopt(value: DraftRead) {
        if (!value.draft)
            return;
        cancel();
        expected.current = value.raw;
        session.current = { id: value.draft.draft_id, created: value.draft.created_at };
        const { schema_version: _v, draft_id: _id, created_at: _c, edited_at: _e, ...content } = value.draft;
        previous.current = JSON.stringify(content);
        setStored(value);
        active.current = true;
        setEnabled(true);
        setStatus("saved");
    }
    // UI must explicitly confirm replacement; re-read immediately before authorizing.
    function authorize(consentedRaw: string | null) {
        const now = refresh();
        if (now.problem === "unavailable") {
            pause("error");
            return;
        }
        if (now.raw !== consentedRaw) {
            conflict(now);
            return;
        }
        expected.current = now.raw;
        previous.current = null;
        if (!session.current)
            session.current = { id: crypto.randomUUID(), created: new Date().toISOString() };
        active.current = true;
        setEnabled(true);
        setStatus("saving");
        // Explicit action also retries a failed write, without waiting for another edit.
        flush();
    }
    function remove(consentedRaw: string | null = expected.current) {
        // Cancel before reading/removing: queued edits and pagehide cannot recreate a deletion.
        pause("paused");
        const now = readDraft();
        if (now.problem === "unavailable") {
            setStored(now);
            setStatus("error");
            return false;
        }
        if (now.raw !== consentedRaw) {
            conflict(now);
            return false;
        }
        try {
            window.localStorage.removeItem(DRAFT_KEY);
            expected.current = null;
            previous.current = null;
            setStored({ raw: null, draft: null, problem: null });
            setStatus("deleted");
            return true;
        }
        catch {
            setStatus("error");
            return false;
        }
    }
    function release() { flush(); cancel(); active.current = false; setEnabled(false); session.current = null; previous.current = null; setStatus("idle"); }
    const signature = payload ? JSON.stringify(payload) : null;
    useEffect(() => {
        cancel();
        if (enabled && signature && signature !== previous.current) {
            setStatus("saving");
            timer.current = setTimeout(flush, SAVE_DELAY);
        }
        return cancel;
        // The current payload is held in a ref for lifecycle flushes; identity changes alone don't write.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [signature, enabled]);
    useEffect(() => {
        const storage = (event: StorageEvent) => { if (event.key === DRAFT_KEY || event.key === null)
            conflict(readDraft()); };
        const hidden = () => { if (document.visibilityState === "hidden")
            flush(); };
        const hide = () => flush();
        window.addEventListener("storage", storage);
        window.addEventListener("pagehide", hide);
        document.addEventListener("visibilitychange", hidden);
        return () => { cancel(); window.removeEventListener("storage", storage); window.removeEventListener("pagehide", hide); document.removeEventListener("visibilitychange", hidden); };
    }, []);
    return { stored, status, enabled, beginNew, adopt, authorize, remove, release, flush, refresh };
}
