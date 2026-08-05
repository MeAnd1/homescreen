const EDITOR_API_URL = "https://09176645.xyz/github-pages-editor";
const PROJECT_ID = "kataa-homescreen";

function getStorageKey(): string {
  return `editor_password_${PROJECT_ID}`;
}

export function getSavedPassword(): string | null {
  return localStorage.getItem(getStorageKey());
}

export function savePassword(password: string): void {
  localStorage.setItem(getStorageKey(), password);
}

export function clearPassword(): void {
  localStorage.removeItem(getStorageKey());
}

export async function verifyPassword(password: string): Promise<boolean> {
  const response = await fetch(`${EDITOR_API_URL}/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectId: PROJECT_ID, password }),
  });
  return response.ok;
}

export interface SaveResult {
  success: boolean;
  message: string;
  warnings?: string[];
  error?: string;
  /** Set on 429 so the UI can offer a retry rather than reporting a hard failure. */
  rateLimited?: boolean;
}

async function post(
  path: string,
  body: Record<string, unknown>,
): Promise<SaveResult> {
  const response = await fetch(`${EDITOR_API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectId: PROJECT_ID, ...body }),
  });

  if (response.status === 401) {
    clearPassword();
    return { success: false, message: "", error: "Invalid password" };
  }

  if (response.status === 429) {
    return {
      success: false,
      message: "",
      error: "Too many requests. Wait a moment and try again.",
      rateLimited: true,
    };
  }

  return (await response.json()) as SaveResult;
}

export function saveAndPush(
  fileId: string,
  content: unknown,
  password: string,
): Promise<SaveResult> {
  return post("/save", {
    fileId,
    content,
    password,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Removes a file and pushes the removal. Sibling of saveAndPush.
 *
 * Only fileIds the server marks deletable can be removed; others return 400. A 404 means
 * the file was already gone, and is reported rather than swallowed. Callers must confirm
 * with the user first.
 */
export function deleteAndPush(
  fileId: string,
  password: string,
): Promise<SaveResult> {
  return post("/delete", { fileId, password });
}
