import { getMockUserEmail } from "@/lib/auth/session";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public fieldErrors: Record<string, string> = {},
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Thin fetch wrapper every API call goes through. This is the one place that knows how the
 * current identity gets attached to a request — today that's the mock header, later a bearer
 * token from Entra ID. Callers never touch either directly.
 */
export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  const mockUser = getMockUserEmail();
  if (mockUser) {
    headers.set("X-Mock-User", mockUser);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    const fallback = `${options.method ?? "GET"} ${path} failed with ${response.status}`;
    try {
      const body = (await response.json()) as { message?: string; fieldErrors?: Record<string, string> };
      throw new ApiError(response.status, body.message ?? fallback, body.fieldErrors ?? {});
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw new ApiError(response.status, fallback);
    }
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
