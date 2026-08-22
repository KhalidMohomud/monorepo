const parseTokenPayload = (token: string): unknown => {
  const encodedPayload = token.split(".")[1];

  if (!encodedPayload) {
    return null;
  }

  const base64 = encodedPayload.replace(/-/g, "+").replace(/_/g, "/");
  const paddedBase64 = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");

  return JSON.parse(window.atob(paddedBase64)) as unknown;
};

export const getAccessTokenExpiration = (token: string): number | null => {
  try {
    const payload = parseTokenPayload(token);

    if (
      typeof payload !== "object" ||
      payload === null ||
      !("exp" in payload) ||
      typeof payload.exp !== "number" ||
      !Number.isFinite(payload.exp)
    ) {
      return null;
    }

    return payload.exp * 1_000;
  } catch {
    return null;
  }
};
