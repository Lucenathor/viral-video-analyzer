import type { CookieOptions, Request } from "express";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function isIpAddress(host: string) {
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;
  return host.includes(":");
}

function isSecureRequest(req: Request) {
  if (req.protocol === "https") return true;

  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;

  const protoList = Array.isArray(forwardedProto)
    ? forwardedProto
    : forwardedProto.split(",");

  return protoList.some(proto => proto.trim().toLowerCase() === "https");
}

/**
 * Extract the root domain for cookie sharing across subdomains.
 * e.g. "app.viralpro.io" -> ".viralpro.io"
 * e.g. "3000-xxx.sg1.manus.computer" -> undefined (dev, don't set domain)
 */
function getRootDomain(hostname: string): string | undefined {
  if (LOCAL_HOSTS.has(hostname) || isIpAddress(hostname)) return undefined;
  
  // For manus.computer dev domains, don't set domain to avoid issues
  if (hostname.includes("manus.computer") || hostname.includes("manus.space")) {
    return undefined;
  }

  // For internal Cloud Run domains, don't set domain
  if (hostname.includes("run.app")) {
    return undefined;
  }

  // For custom domains like viralpro.io, set the root domain
  const parts = hostname.split(".");
  if (parts.length >= 2) {
    return `.${parts.slice(-2).join(".")}`;  
  }
  return undefined;
}

export function getSessionCookieOptions(
  req: Request
): Pick<CookieOptions, "domain" | "httpOnly" | "path" | "sameSite" | "secure"> {
  // Use X-Forwarded-Host or Host header to get the real hostname (behind proxies like Cloudflare)
  const forwardedHost = req.headers["x-forwarded-host"];
  const realHost = typeof forwardedHost === "string" ? forwardedHost.split(",")[0].trim() : req.hostname;
  const secure = isSecureRequest(req);
  const domain = getRootDomain(realHost);
  console.log(`[Cookie] hostname=${req.hostname}, x-forwarded-host=${forwardedHost}, realHost=${realHost}, domain=${domain}, secure=${secure}`);

  return {
    httpOnly: true,
    path: "/",
    // Use "lax" for same-site navigation (most common case)
    // This is much more reliable than "none" which requires secure + third-party cookie support
    sameSite: "lax",
    secure,
    ...(domain ? { domain } : {}),
  };
}
