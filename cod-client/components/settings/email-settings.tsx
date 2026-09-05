"use client";

import { useState, useEffect } from "react";
import { Mail, Loader2, CheckCircle2, XCircle, Eye, EyeOff } from "lucide-react";
import { Section, FieldRow, inputCls } from "./shared-fields";
import { useSettings } from "@/lib/translations";

interface EmailConfig {
  language: string;
  enabled: boolean;
  apiKeyMasked: string | null;
  fromEmail: string;
  fromName: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

interface TestResult {
  ok: boolean;
  message?: string;
  credits?: number;
  verifiedDomains?: string[];
}

export function EmailSettings() {
  const t = useSettings();
  const s = t.store;

  const [config, setConfig] = useState<EmailConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);

  const [enabled, setEnabled] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [fromName, setFromName] = useState("");

  useEffect(() => {
    fetchConfig();
  }, []);

  async function fetchConfig() {
    try {
      const res = await fetch("/api/stores/email-config");
      const data = (await res.json()) as { success: boolean; data: EmailConfig | null };
      if (data.success && data.data) {
        const c = data.data;
        setConfig(c);
        setEnabled(c.enabled);
        setFromEmail(c.fromEmail || "");
        setFromName(c.fromName || "");
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        enabled,
        fromEmail,
        fromName: fromName || undefined,
      };
      if (apiKey) payload.apiKey = apiKey;

      const res = await fetch("/api/stores/email-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { success: boolean; data: EmailConfig };
      if (data.success) {
        setConfig(data.data);
        setApiKey("");
        setTestResult(null);
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    try {
      const payload: Record<string, unknown> = {};
      if (apiKey) payload.apiKey = apiKey;

      const res = await fetch("/api/stores/email-config/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as TestResult;
      setTestResult(data);
    } catch {
      setTestResult({ ok: false, message: "Network error" });
    } finally {
      setTesting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-muted-foreground" size={24} />
      </div>
    );
  }

  return (
    <Section
      icon={Mail}
      title={s.email_title}
      subtitle={s.email_subtitle}
      onSave={handleSave}
      saving={saving}
      saveLabel={s.save}
      savingLabel={s.saving}
    >
      {/* Enable toggle */}
      <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-foreground">{s.email_enabled_label}</p>
          <p className="text-xs text-muted-foreground">{s.email_enabled_hint}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => setEnabled(!enabled)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
            enabled ? "bg-primary" : "bg-muted-foreground/30"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
              enabled ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      {/* API Key */}
      <FieldRow label={s.email_api_key_label} hint={s.email_api_key_hint}>
        <div className="relative">
          {config?.apiKeyMasked && !apiKey ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={config.apiKeyMasked}
                className={[inputCls, "flex-1 opacity-60"].join(" ")}
              />
              <button
                type="button"
                onClick={() => {
                  setApiKey("");
                  setShowApiKey(true);
                }}
                className="shrink-0 rounded-lg border border-border bg-muted px-3 py-2.5 text-xs font-medium text-foreground hover:bg-accent"
              >
                {s.email_api_key_stored}
              </button>
            </div>
          ) : (
            <div className="relative">
              <input
                type={showApiKey ? "text" : "password"}
                dir="ltr"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={s.email_api_key_placeholder}
                className={[inputCls, "pe-10"].join(" ")}
              />
              <button
                type="button"
                onClick={() => setShowApiKey((v) => !v)}
                tabIndex={-1}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showApiKey ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          )}
        </div>
      </FieldRow>

      {/* From Email */}
      <FieldRow label={s.email_from_email_label} hint={s.email_from_email_hint}>
        <input
          type="email"
          dir="ltr"
          value={fromEmail}
          onChange={(e) => setFromEmail(e.target.value)}
          placeholder={s.email_from_email_placeholder}
          className={inputCls}
        />
      </FieldRow>

      {/* From Name */}
      <FieldRow label={s.email_from_name_label}>
        <input
          type="text"
          value={fromName}
          onChange={(e) => setFromName(e.target.value)}
          placeholder={s.email_from_name_placeholder}
          className={inputCls}
        />
      </FieldRow>

      {/* Test Connection */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleTest}
          disabled={testing}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted px-4 py-2 text-sm font-medium text-foreground hover:bg-accent disabled:opacity-50"
        >
          {testing ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Mail size={14} />
          )}
          {testing ? s.email_testing : s.email_test_button}
        </button>

        {testResult && (
          <div className="flex items-center gap-2 text-sm">
            {testResult.ok ? (
              <>
                <CheckCircle2 size={16} className="text-green-600" />
                <span className="text-green-600">{s.email_test_ok}</span>
                {testResult.credits !== undefined && (
                  <span className="text-muted-foreground">
                    ({s.email_test_credits}: {testResult.credits})
                  </span>
                )}
              </>
            ) : (
              <>
                <XCircle size={16} className="text-destructive" />
                <span className="text-destructive">
                  {testResult.message || s.email_test_fail}
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Verified Domains */}
      {testResult?.ok && testResult.verifiedDomains && testResult.verifiedDomains.length > 0 && (
        <div className="rounded-lg border border-border bg-muted/50 px-4 py-3">
          <p className="text-xs font-semibold text-foreground mb-2">{s.email_test_domains}:</p>
          <div className="flex flex-wrap gap-2">
            {testResult.verifiedDomains.map((domain) => (
              <span
                key={domain}
                className="inline-block rounded-md bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400"
              >
                {domain}
              </span>
            ))}
          </div>
        </div>
      )}

      {testResult?.ok && testResult.verifiedDomains?.length === 0 && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 dark:border-yellow-800 dark:bg-yellow-900/20">
          <p className="text-xs text-yellow-800 dark:text-yellow-400">{s.email_domains_empty}</p>
        </div>
      )}
    </Section>
  );
}
