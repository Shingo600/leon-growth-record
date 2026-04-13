import type { AppData } from "@/lib/types";
import { normalizeAppData } from "@/lib/storage";

const snapshotEndpoint = "/api/snapshot";
const authEndpoint = "/api/snapshot/auth";

export type CloudErrorCode = "not-configured" | "auth-required" | "request-failed";

type CloudSuccess<T> = {
  ok: true;
  data: T;
};

type CloudFailure = {
  ok: false;
  code: CloudErrorCode;
  message: string;
};

export type CloudResult<T> = CloudSuccess<T> | CloudFailure;

function formatCloudError(message: string) {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("statement timeout")) {
    return "同期処理が混み合っていました。少し待ってからもう一度お試しください。";
  }

  if (lowerMessage.includes("network") || lowerMessage.includes("failed to fetch")) {
    return "通信状態が安定しませんでした。接続を確認してから再度お試しください。";
  }

  return message;
}

function classifyResponse(status: number): CloudErrorCode {
  if (status === 503) {
    return "not-configured";
  }

  if (status === 401) {
    return "auth-required";
  }

  return "request-failed";
}

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function withRetry<T>(task: () => Promise<CloudResult<T>>, retries = 1): Promise<CloudResult<T>> {
  let lastResult = await task();

  for (let index = 0; index < retries; index += 1) {
    if (lastResult.ok) {
      return lastResult;
    }

    if (!lastResult.message.toLowerCase().includes("statement timeout")) {
      return lastResult;
    }

    await sleep(400);
    lastResult = await task();
  }

  return lastResult;
}

async function parseMessage(response: Response) {
  const body = (await response.json().catch(() => null)) as { message?: string; data?: unknown } | null;
  return body?.message ?? response.statusText ?? "クラウド同期に失敗しました。";
}

export async function fetchCloudAppData(): Promise<CloudResult<AppData | null>> {
  return withRetry(async () => {
    const response = await fetch(snapshotEndpoint, {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store"
    }).catch(() => null);

    if (!response) {
      return {
        ok: false,
        code: "request-failed",
        message: formatCloudError("failed to fetch")
      };
    }

    if (!response.ok) {
      return {
        ok: false,
        code: classifyResponse(response.status),
        message: formatCloudError(await parseMessage(response))
      };
    }

    const body = (await response.json()) as { data: Partial<AppData> | null };
    return {
      ok: true,
      data: body.data ? normalizeAppData(body.data) : null
    };
  });
}

export async function saveCloudAppData(appData: AppData): Promise<CloudResult<null>> {
  return withRetry(async () => {
    const response = await fetch(snapshotEndpoint, {
      method: "PUT",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(appData)
    }).catch(() => null);

    if (!response) {
      return {
        ok: false,
        code: "request-failed",
        message: formatCloudError("failed to fetch")
      };
    }

    if (!response.ok) {
      return {
        ok: false,
        code: classifyResponse(response.status),
        message: formatCloudError(await parseMessage(response))
      };
    }

    return { ok: true, data: null };
  });
}

export async function connectCloudSync(passcode: string): Promise<CloudResult<null>> {
  const response = await fetch(authEndpoint, {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ passcode })
  }).catch(() => null);

  if (!response) {
    return {
      ok: false,
      code: "request-failed",
      message: formatCloudError("failed to fetch")
    };
  }

  if (!response.ok) {
    return {
      ok: false,
      code: classifyResponse(response.status),
      message: formatCloudError(await parseMessage(response))
    };
  }

  return { ok: true, data: null };
}

export async function disconnectCloudSync() {
  await fetch(authEndpoint, {
    method: "DELETE",
    credentials: "same-origin"
  }).catch(() => null);
}
