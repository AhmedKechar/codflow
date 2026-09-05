import { OpenAPIHono, z } from "@hono/zod-openapi";
import type { AppContext } from "@/types";
import { storeAuthMiddleware } from "@/middleware/storeAuth";
import { sendOtp, verifyOtp } from "./handlers";

const sendOtpSchema = z.object({
  phone: z.string().min(5).max(20),
});

const verifyOtpSchema = z.object({
  phone: z.string().min(5).max(20),
  requestId: z.string().min(1),
  code: z.string().length(6),
});

const router = new OpenAPIHono<AppContext>();

// POST /store/otp/send
router.post(
  "/otp/send",
  storeAuthMiddleware,
  async (c, next) => {
    const body = await c.req.json();
    const parsed = sendOtpSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: "Validation error", details: parsed.error.flatten() }, 400);
    }
    return sendOtp(c);
  }
);

// POST /store/otp/verify
router.post(
  "/otp/verify",
  storeAuthMiddleware,
  async (c, next) => {
    const body = await c.req.json();
    const parsed = verifyOtpSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: "Validation error", details: parsed.error.flatten() }, 400);
    }
    return verifyOtp(c);
  }
);

export default router;
