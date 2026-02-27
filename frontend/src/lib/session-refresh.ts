import type { Session } from "next-auth";

type UpdateSessionFn = (data?: unknown) => Promise<Session | null | undefined>;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Refresh session claims with small retries to avoid JWT propagation races.
 */
export async function refreshSessionWithRetry(
  updateSession: UpdateSessionFn,
  shouldAccept: (session: Session) => boolean = () => true,
  attempts: number = 4
): Promise<Session | null> {
  for (let i = 0; i < attempts; i++) {
    try {
      const session = await updateSession();
      if (session && shouldAccept(session)) return session;
    } catch {
      // Retry on transient session refresh errors.
    }
    if (i < attempts - 1) await sleep(150 * (i + 1));
  }
  return null;
}
