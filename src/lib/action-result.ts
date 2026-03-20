import { ZodError } from "zod";

export type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function safeAction<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    const data = await fn();
    return { success: true, data };
  } catch (err) {
    if (err instanceof ZodError) {
      const first = err.issues[0];
      return { success: false, error: first?.message ?? "Validation failed" };
    }
    if (err instanceof Error) {
      return { success: false, error: err.message };
    }
    return { success: false, error: "Something went wrong" };
  }
}
