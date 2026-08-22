const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api"
).replace(/\/$/, "");

export const SESSION_EXPIRED_EVENT = "merhaba:session-expired";

type ErrorResponse = {
  error?: {
    code?: string;
    message?: string;
    details?: Array<{ field: string; message: string }>;
  };
};

type ApiRequestOptions = {
  body?: unknown;
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  token?: string;
};

export class ApiClientError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

export class SessionExpiredError extends ApiClientError {
  constructor(code: string, message: string) {
    super(401, code, message);
    this.name = "SessionExpiredError";
  }
}

export const apiRequest = async <T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> => {
  const requestBody: BodyInit | undefined =
    options.body instanceof FormData
      ? options.body
      : options.body === undefined
        ? undefined
        : JSON.stringify(options.body);
  const isFormData = requestBody instanceof FormData;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers: {
      ...(options.body !== undefined && !isFormData
        ? { "content-type": "application/json" }
        : {}),
      ...(options.token
        ? { authorization: `Bearer ${options.token}` }
        : {}),
    },
    body: requestBody,
    cache: "no-store",
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const responseBody = (await response.json()) as T & ErrorResponse;

  if (!response.ok) {
    const code = responseBody.error?.code ?? "REQUEST_FAILED";
    const message =
      responseBody.error?.details?.[0]?.message ??
      responseBody.error?.message ??
      "Request failed";

    if (response.status === 401 && options.token) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
      }

      throw new SessionExpiredError(code, message);
    }

    throw new ApiClientError(
      response.status,
      code,
      message,
    );
  }

  return responseBody;
};

export const getErrorMessage = (error: unknown): string | null => {
  if (error instanceof SessionExpiredError) {
    return null;
  }

  return error instanceof Error ? error.message : "Something went wrong";
};
