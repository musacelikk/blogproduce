import { Request, Response, NextFunction } from 'express';

/**
 * IP Blacklist / Whitelist middleware.
 * Env: IP_WHITELIST (comma-separated) = sadece bu IP'ler erişebilir; boş = kapalı.
 *      IP_BLACKLIST (comma-separated) = bu IP'ler 403 alır; boş = kapalı.
 * Aşırı daraltma yapılmaz: liste boşsa filtre uygulanmaz.
 */
export function ipFilterMiddleware(env: {
  IP_WHITELIST?: string;
  IP_BLACKLIST?: string;
}) {
  const whitelistRaw = (env.IP_WHITELIST || '').trim();
  const blacklistRaw = (env.IP_BLACKLIST || '').trim();

  const whitelist = whitelistRaw
    ? whitelistRaw.split(',').map((ip) => ip.trim()).filter(Boolean)
    : [];
  const blacklist = blacklistRaw
    ? blacklistRaw.split(',').map((ip) => ip.trim()).filter(Boolean)
    : [];

  if (whitelist.length === 0 && blacklist.length === 0) {
    return (_req: Request, _res: Response, next: NextFunction) => next();
  }

  return (req: Request, res: Response, next: NextFunction) => {
    const clientIp = (req.ip || req.socket?.remoteAddress || '').trim();
    const normalizedIp = clientIp.replace(/^::ffff:/, ''); // IPv4-mapped IPv6

    if (blacklist.length > 0 && (blacklist.includes(clientIp) || blacklist.includes(normalizedIp))) {
      res.status(403).json({
        success: false,
        message: 'Access denied',
      });
      return;
    }

    if (whitelist.length > 0) {
      const allowed = whitelist.includes(clientIp) || whitelist.includes(normalizedIp);
      if (!allowed) {
        res.status(403).json({
          success: false,
          message: 'Access denied',
        });
        return;
      }
    }

    next();
  };
}
