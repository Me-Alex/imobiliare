const PRODUCTION_AUTH_ORIGIN = "https://hqsimobiliare.ro"

function getConfiguredAuthOrigin() {
  const configuredOrigin =
    process.env.NEXT_PUBLIC_AUTH_REDIRECT_ORIGIN || process.env.NEXT_PUBLIC_SITE_URL || PRODUCTION_AUTH_ORIGIN

  try {
    const parsedOrigin = new URL(configuredOrigin)
    const origin = parsedOrigin.origin
    const hostname = parsedOrigin.hostname

    if (parsedOrigin.protocol !== "https:" || hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1" || hostname === "[::1]") {
      return PRODUCTION_AUTH_ORIGIN
    }

    return origin.replace(/\/$/, "")
  } catch {
    return PRODUCTION_AUTH_ORIGIN
  }
}

export function getAuthRedirectUrl(path = "/portal") {
  const redirectPath = path.startsWith("/") ? path : `/${path}`
  return `${getConfiguredAuthOrigin()}${redirectPath}`
}
