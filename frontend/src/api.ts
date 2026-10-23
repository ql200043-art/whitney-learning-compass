import type {
  Teacher,
  Recommendation,
  Journey,
  Activity,
  Facts,
} from "./types";
export class ApiError extends Error {
  constructor(public code: string) {
    super(code);
  }
}
export function errorMessage(error: unknown): string {
  const code = error instanceof ApiError ? error.code : "network";
  const messages: Record<string, string> = {
    network:
      "We could not reach the local service. Check that the backend is running, then try again.",
    missing_configuration:
      "The course model connection is not configured. Ask the person running this app to set the server-side course key.",
    provider_timeout:
      "The planning request took too long. Please start a new search before trying again.",
    provider_unavailable:
      "The planning service is temporarily unavailable. Please try again later.",
    provider_connection:
      "The planning service could not connect. Please try again later.",
    invalid_input:
      "Please review your class-level requirements. Avoid student identities, private records, or instructions to override program rules.",
    workflow_not_found:
      "This planning session has expired or the backend restarted. Start a new search to continue.",
    workflow_consumed:
      "This session has already used its plan-generation attempt. Start a new search to continue.",
    catalog_changed:
      "Program information changed since your search. Start a new search to review the updated choices.",
    invalid_model_output:
      "The generated response did not pass our checks. Please start a new search; no unvalidated plan is shown.",
    execution_limit:
      "This request reached its planning limit. Start a new search with a focused learning goal.",
    service_capacity:
      "The planning service is busy. Please wait and try again.",
    invalid_selection:
      "Please start a new search and select one of the programs returned.",
    rejected_selection:
      "This program no longer meets your requirements. Please start a new search.",
    acknowledgment_required:
      "Please acknowledge the unresolved mandatory requirements before requesting a provisional plan.",
  };
  return (
    messages[code] ??
    "This request could not complete safely. Please start a new search or ask the person running this app for help."
  );
}
async function request<T>(
  path: string,
  body?: unknown,
  token?: string,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 100_000);
  try {
    const response = await fetch("/api" + path, {
      method: body === undefined ? "GET" : "POST",
      headers: {
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token ? { "X-Workflow-Token": token } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
      cache: "no-store",
    });
    const data = await response.json();
    if (!response.ok)
      throw new ApiError(
        typeof data?.error?.code === "string" ? data.error.code : "unknown",
      );
    return data as T;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    if (e instanceof DOMException && e.name === "AbortError")
      throw new ApiError("provider_timeout");
    throw new ApiError("network");
  } finally {
    clearTimeout(timer);
  }
}
export const api = {
  health: () => request<{ status: string }>("/health"),
  catalog: () => request<{ programs: Facts[] }>("/programs"),
  recommend: (teacher: Teacher) =>
    request<Recommendation>("/recommend", teacher),
  journey: (
    workflow_id: string,
    program_id: string,
    acknowledge_unknown: boolean,
    token: string,
  ) =>
    request<Journey>(
      "/journey",
      { workflow_id, program_id, teacher_selected: true, acknowledge_unknown },
      token,
    ),
  activity: (id: string, token: string) =>
    request<Activity>("/runs/" + encodeURIComponent(id), undefined, token),
};
