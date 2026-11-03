// #region Config

// Overridable so the editor can point at a local static-page-editors server and a scratch repo.
export const EDITOR_API_URL =
  import.meta.env.VITE_EDITOR_API_URL ?? "https://09176645.xyz/github-pages-editor";
export const PROJECT_ID =
  import.meta.env.VITE_EDITOR_PROJECT_ID ?? "kataa-homescreen";

const PASSWORD_STORAGE_KEY = `editor_password_${PROJECT_ID}`;

export interface SaveResult {
  success: boolean;
  message: string;
  warnings?: string[];
  error?: string;
  /** Set on 429 so the UI can offer a retry rather than reporting a hard failure. */
  rateLimited?: boolean;
}

// #endregion

// #region Password

export function getSavedPassword(): string | null {
  return localStorage.getItem(PASSWORD_STORAGE_KEY);
}

export function savePassword(password: string): void {
  localStorage.setItem(PASSWORD_STORAGE_KEY, password);
}

export function clearPassword(): void {
  localStorage.removeItem(PASSWORD_STORAGE_KEY);
}

export async function verifyPassword(password: string): Promise<boolean> {
  const response = await fetch(`${EDITOR_API_URL}/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectId: PROJECT_ID, password }),
  });
  return response.ok;
}

// #endregion

// #region Save and delete

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
 * Removes a file and pushes the removal. Only fileIds the server marks deletable can go
 * (others return 400); a 404 means it was already gone and is reported, not swallowed.
 * Callers must confirm with the user first.
 */
export function deleteAndPush(
  fileId: string,
  password: string,
): Promise<SaveResult> {
  return post("/delete", { fileId, password });
}

/** Where a save lands, for the UI to show before it happens. */
export const describeTarget = (fileId: string): string =>
  `${PROJECT_ID} · ${fileId}`;

// #endregion

// #region Helpers

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

// #endregion
