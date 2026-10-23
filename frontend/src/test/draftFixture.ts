import { journey, request } from "./fixtures";
import { snapshotProgram, teacherSnapshot, teachingContent } from "../draftStorage";
import type { DraftPayload, LocalDraft } from "../draftStorage";
export function draftPayload(): DraftPayload {
    return { program: snapshotProgram(journey, request), teacher: teacherSnapshot(request), original: teachingContent(journey.ai_teaching_suggestions), edited: teachingContent(journey.ai_teaching_suggestions), notes: "", inquiry: "Please confirm capacity and availability.", reviewed: false };
}
export function savedDraft(): LocalDraft {
    return { schema_version: 1, draft_id: "local-document-12345", created_at: "2026-10-23T12:00:00.000Z", edited_at: "2026-10-23T12:00:00.000Z", ...draftPayload() };
}
