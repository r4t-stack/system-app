// Shared shape returned by Server Actions used with useActionState / forms.
export type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export function actionError(
  error: string,
  fieldErrors?: Record<string, string[]>,
): ActionResult<never> {
  return { ok: false, error, fieldErrors };
}

export function actionOk<T>(data?: T): ActionResult<T> {
  return { ok: true, data };
}
