import type { ConfirmActionRequest, CustomerConfirmationView } from "@/lib/types/confirmation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export class ConfirmApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ConfirmApiError";
  }
}

/**
 * Deliberately separate from the staff `apiFetch` — a real customer visiting this link has no
 * mock-user cookie, no session, nothing. The token in the URL is the whole identity, so this
 * wrapper stays that simple rather than routing through anything auth-shaped.
 */
async function confirmFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = (await response.json()) as { message?: string };
      if (body.message) message = body.message;
    } catch {
      // body wasn't JSON — keep the generic message
    }
    throw new ConfirmApiError(response.status, message);
  }

  return (await response.json()) as T;
}

export const getConfirmation = (token: string) =>
  confirmFetch<CustomerConfirmationView>(`/api/confirm/${encodeURIComponent(token)}`);

export const confirmRequest = (token: string, body: ConfirmActionRequest) =>
  confirmFetch<CustomerConfirmationView>(`/api/confirm/${encodeURIComponent(token)}/confirm`, {
    method: "POST",
    body: JSON.stringify(body),
  });

export const rejectRequest = (token: string, reason: string) =>
  confirmFetch<CustomerConfirmationView>(`/api/confirm/${encodeURIComponent(token)}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
