/**
 * Restrict callback URLs to in-app relative paths to prevent open redirects.
 */
export function getSafeCallbackPath(
  rawCallbackUrl: string | null | undefined,
  fallback: string = "/home"
): string {
  if (!rawCallbackUrl) return fallback;

  try {
    // Resolve relative callback URLs safely in browser and server contexts.
    const base =
      typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost";
    const parsed = new URL(rawCallbackUrl, base);

    // Reject cross-origin redirects and protocol-relative URLs.
    if (parsed.origin !== base) return fallback;
    if (!parsed.pathname.startsWith("/") || parsed.pathname.startsWith("//")) {
      return fallback;
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

