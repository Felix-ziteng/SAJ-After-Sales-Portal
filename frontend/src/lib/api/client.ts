export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

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
 * Thin fetch wrapper every API call goes through. Identity travels as an HttpOnly session
 * cookie the browser attaches on its own (`credentials: "include"`) — nothing here reads or
 * sets it, unlike the old mock-header days.
 */
export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

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
