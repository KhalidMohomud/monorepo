const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api"
).replace(/\/$/, "");

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
    throw new ApiClientError(
      response.status,
      responseBody.error?.code ?? "REQUEST_FAILED",
      responseBody.error?.details?.[0]?.message ??
        responseBody.error?.message ??
        "Request failed",
    );
  }

  return responseBody;
};

export const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "Something went wrong";
