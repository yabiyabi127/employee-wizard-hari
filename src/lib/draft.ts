export type Role = "admin" | "ops";
export const draftKey = (role: Role) => (role === "admin" ? "draft_admin" : "draft_ops");

export function loadDraft<T>(role: Role): T | null {
  try {
    const raw = localStorage.getItem(draftKey(role));
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function saveDraft<T>(role: Role, data: T) {
  localStorage.setItem(draftKey(role), JSON.stringify(data));
}

export function clearDraft(role: Role) {
  localStorage.removeItem(draftKey(role));
}
