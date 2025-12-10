export interface RateLimitConfig {
  windowMs: number;
  max: number;
}

const trackers = new Map<string, { count: number; expiresAt: number }>();
const blockedIps = new Map<string, number>(); // IP -> blockedUntil timestamp

export function checkRateLimit(ip: string, config: RateLimitConfig = { windowMs: 60 * 1000, max: 5 }) {
  const now = Date.now();

  // Check if blocked
  const blockedUntil = blockedIps.get(ip);
  if (blockedUntil && now < blockedUntil) {
    throw new Error(`Your IP is temporarily blocked due to excessive requests. Try again in ${Math.ceil((blockedUntil - now) / 1000)}s.`);
  }

  // Get current window
  let record = trackers.get(ip);
  
  // If no record or expired, reset
  if (!record || now > record.expiresAt) {
    record = { count: 0, expiresAt: now + config.windowMs };
  }

  // Increment
  record.count++;
  trackers.set(ip, record);

  // Check limit
  if (record.count > config.max) {
    // Block for 5 minutes if limit exceeded
    const blockDuration = 5 * 60 * 1000;
    blockedIps.set(ip, now + blockDuration);
    throw new Error(`Rate limit exceeded. You are blocked for 5 minutes.`);
  }
}
