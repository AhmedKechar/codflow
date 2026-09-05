function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function baseLayout(content: string, dir: "rtl" | "ltr" = "rtl"): string {
  const align = dir === "rtl" ? "right" : "left";
  return `<!DOCTYPE html>
<html dir="${dir}" lang="${dir === "rtl" ? "ar" : "en"}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CodFlow</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;">
          <tr>
            <td style="background-color:#111827;padding:24px 32px;">
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:600;">CodFlow</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;text-align:${align};">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="background-color:#f9fafb;padding:16px 32px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="margin:0;color:#6b7280;font-size:12px;">
                CodFlow &mdash; ${dir === "rtl" ? "منصة التجارة الإلكترونية" : "E-commerce Platform"}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Team Invite Email ──────────────────────────────────────────────────────

const INVITE_SUBJECT_AR = "دعوة للانضمام إلى فريق المتجر";
const INVITE_SUBJECT_EN = "Invite to Join Store Team";

const INVITE_BODY_AR = (storeName: string, temporaryPassword: string, signInUrl: string) => `
<h2 style="margin:0 0 16px;color:#111827;font-size:18px;">مرحباً بك في فريق ${escapeHtml(storeName)}</h2>
<p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
  لقد تمت دعوتك للانضمام إلى فريق المتجر. يمكنك تسجيل الدخول باستخدام كلمة المرور المؤقتة التالية:
</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;width:100%;">
  <tr>
    <td style="background-color:#f3f4f6;border:1px solid #d1d5db;border-radius:6px;padding:12px 16px;">
      <p style="margin:0;color:#6b7280;font-size:12px;">كلمة المرور المؤقتة</p>
      <p style="margin:4px 0 0;color:#111827;font-size:16px;font-family:monospace;direction:ltr;unicode-bidi:embed;" dir="ltr">${escapeHtml(temporaryPassword)}</p>
    </td>
  </tr>
</table>
<p style="margin:0 0 8px;color:#374151;font-size:15px;line-height:1.6;">
  اضغط على الزر أدناه لتسجيل الدخول. يُنصح بتغيير كلمة المرور بعد تسجيل الدخول.
</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
  <tr>
    <td style="background-color:#2563eb;border-radius:6px;">
      <a href="${escapeHtml(signInUrl)}" style="display:inline-block;padding:12px 24px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">
        تسجيل الدخول
      </a>
    </td>
  </tr>
</table>
<p style="margin:0;color:#6b7280;font-size:13px;line-height:1.5;">
  إذا لم تطلب هذه الدعوة، يمكنك تجاهل هذه الرسالة بأمان.
</p>`;

const INVITE_BODY_EN = (storeName: string, temporaryPassword: string, signInUrl: string) => `
<h2 style="margin:0 0 16px;color:#111827;font-size:18px;">Welcome to ${escapeHtml(storeName)} Team</h2>
<p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
  You've been invited to join the store team. Sign in using the temporary password below:
</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;width:100%;">
  <tr>
    <td style="background-color:#f3f4f6;border:1px solid #d1d5db;border-radius:6px;padding:12px 16px;">
      <p style="margin:0;color:#6b7280;font-size:12px;">Temporary Password</p>
      <p style="margin:4px 0 0;color:#111827;font-size:16px;font-family:monospace;">${escapeHtml(temporaryPassword)}</p>
    </td>
  </tr>
</table>
<p style="margin:0 0 8px;color:#374151;font-size:15px;line-height:1.6;">
  Click the button below to sign in. We recommend changing your password after logging in.
</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
  <tr>
    <td style="background-color:#2563eb;border-radius:6px;">
      <a href="${escapeHtml(signInUrl)}" style="display:inline-block;padding:12px 24px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">
        Sign In
      </a>
    </td>
  </tr>
</table>
<p style="margin:0;color:#6b7280;font-size:13px;line-height:1.5;">
  If you didn't request this invite, you can safely ignore this email.
</p>`;

export function renderInviteEmail(
  lang: "ar" | "en",
  storeName: string,
  temporaryPassword: string,
  signInUrl: string
): { subject: string; html: string } {
  const isAr = lang === "ar";
  const subject = isAr ? INVITE_SUBJECT_AR : INVITE_SUBJECT_EN;
  const body = isAr
    ? INVITE_BODY_AR(storeName, temporaryPassword, signInUrl)
    : INVITE_BODY_EN(storeName, temporaryPassword, signInUrl);
  return { subject, html: baseLayout(body, isAr ? "rtl" : "ltr") };
}

// ─── Password Reset Email ───────────────────────────────────────────────────

const RESET_SUBJECT_AR = "إعادة تعيين كلمة المرور";
const RESET_SUBJECT_EN = "Reset Your Password";

const RESET_BODY_AR = (resetUrl: string) => `
<h2 style="margin:0 0 16px;color:#111827;font-size:18px;">إعادة تعيين كلمة المرور</h2>
<p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
  تلقينا طلباً لإعادة تعيين كلمة المرور الخاص بك. اضغط على الزر أدناه لإنشاء كلمة مرور جديدة.
  هذا الرابط صالح لمدة ساعة واحدة.
</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
  <tr>
    <td style="background-color:#2563eb;border-radius:6px;">
      <a href="${escapeHtml(resetUrl)}" style="display:inline-block;padding:12px 24px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">
        إعادة تعيين كلمة المرور
      </a>
    </td>
  </tr>
</table>
<p style="margin:0;color:#6b7280;font-size:13px;line-height:1.5;">
  إذا لم تطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذه الرسالة بأمان. لن يتم تغيير كلمة مرورك حتى تقوم بإنشاء كلمة مرور جديدة.
</p>`;

const RESET_BODY_EN = (resetUrl: string) => `
<h2 style="margin:0 0 16px;color:#111827;font-size:18px;">Reset Your Password</h2>
<p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
  We received a request to reset your password. Click the button below to create a new password.
  This link expires in 1 hour.
</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
  <tr>
    <td style="background-color:#2563eb;border-radius:6px;">
      <a href="${escapeHtml(resetUrl)}" style="display:inline-block;padding:12px 24px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">
        Reset Password
      </a>
    </td>
  </tr>
</table>
<p style="margin:0;color:#6b7280;font-size:13px;line-height:1.5;">
  If you didn't request a password reset, you can safely ignore this email. Your password won't be changed until you create a new one.
</p>`;

export function renderPasswordResetEmail(
  lang: "ar" | "en",
  resetUrl: string
): { subject: string; html: string } {
  const isAr = lang === "ar";
  const subject = isAr ? RESET_SUBJECT_AR : RESET_SUBJECT_EN;
  const body = isAr ? RESET_BODY_AR(resetUrl) : RESET_BODY_EN(resetUrl);
  return { subject, html: baseLayout(body, isAr ? "rtl" : "ltr") };
}
