const COOKIE_NAME = "mock_user_email";

/**
 * Dev-only session storage: which demo identity the browser is "logged in" as. Backed by a
 * plain cookie so the same value can move to a real session/token without touching call sites.
 */
export function getMockUserEmail(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function setMockUserEmail(email: string) {
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(email)}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
}

export function clearMockUserEmail() {
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`;
}
