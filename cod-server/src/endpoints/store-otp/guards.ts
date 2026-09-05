const PHONE_COOLDOWN_SECONDS = 60;
const IP_LIMIT_PER_HOUR = 20;

export interface OtpSendGuards {
  check(kv: KVNamespace, storeId: string, phone: string, ip: string): Promise<{ allowed: boolean; reason?: string; retryAfterSeconds?: number }>;
}

export function createOtpSendGuards(): OtpSendGuards {
  return {
    async check(kv: KVNamespace, storeId: string, phone: string, ip: string) {
      // Check phone cooldown
      const cooldownKey = `otp:cooldown:${storeId}:${phone}`;
      const cooldown = await kv.get(cooldownKey);
      if (cooldown) {
        const retryAfter = Math.ceil(
          (Number(cooldown) + PHONE_COOLDOWN_SECONDS * 1000 - Date.now()) / 1000
        );
        if (retryAfter > 0) {
          return { allowed: false, reason: "cooldown", retryAfterSeconds: retryAfter };
        }
      }

      // Check IP hourly limit
      const ipKey = `otp:ip:${storeId}:${ip}`;
      const ipCount = await kv.get(ipKey);
      if (ipCount && Number(ipCount) >= IP_LIMIT_PER_HOUR) {
        return { allowed: false, reason: "ip_limit" };
      }

      return { allowed: true };
    },
  };
}

export async function recordOtpSend(
  kv: KVNamespace,
  storeId: string,
  phone: string,
  ip: string
): Promise<void> {
  // Set phone cooldown (fire-and-forget)
  const cooldownKey = `otp:cooldown:${storeId}:${phone}`;
  await kv.put(cooldownKey, String(Date.now()), {
    expirationTtl: PHONE_COOLDOWN_SECONDS,
  }).catch(() => {});

  // Increment IP counter (fire-and-forget)
  const ipKey = `otp:ip:${storeId}:${ip}`;
  const current = await kv.get(ipKey);
  const next = current ? Number(current) + 1 : 1;
  await kv.put(ipKey, String(next), {
    expirationTtl: 3600,
  }).catch(() => {});
}
