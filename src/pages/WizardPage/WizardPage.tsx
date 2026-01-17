import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { API1, API2, getJSON, postJSON } from "../../lib/api";
import { clearDraft, loadDraft, saveDraft, type Role } from "../../lib/draft";
import { fileToBase64 } from "../../lib/file";
import { sleep } from "../../lib/sleep";
import { step1Schema } from "../../lib/validators";
import { Field } from "../../components/Field/Field";
import { Autocomplete } from "../../components/Autocomplete/Autocomplete";
import {  Progress, type LogItem } from "../../components/Progress/Progress";
import "./WizardPage.css";

type Step = 1 | 2;

type Step1 = {
  fullName: string;
  email: string;
  department: string;
  role: "Ops" | "Admin" | "Engineer" | "Finance";
  employeeId: string;
};

type Step2 = {
  photoBase64?: string;
  employmentType?: "Full-time" | "Part-time" | "Contract" | "Intern";
  officeLocation?: string;
  notes?: string;
};

type Draft = { step: Step; step1: Step1; step2: Step2 };

const emptyStep1: Step1 = { fullName: "", email: "", department: "", role: "Ops", employeeId: "___-___" };
const emptyStep2: Step2 = { photoBase64: "", employmentType: "Full-time", officeLocation: "", notes: "" };

function useRoleFromQuery(): Role {
  const loc = useLocation();
  return useMemo(() => {
    const p = new URLSearchParams(loc.search);
    return p.get("role") === "ops" ? "ops" : "admin";
  }, [loc.search]);
}

export function WizardPage() {
  const role = useRoleFromQuery();
  const nav = useNavigate();

  const initial = useMemo<Draft>(() => {
    const saved = loadDraft<Draft>(role);
    if (saved) return saved;
    return { step: role === "ops" ? 2 : 1, step1: emptyStep1, step2: emptyStep2 };
  }, [role]);

  const [step, setStep] = useState<Step>(initial.step);
  const [s1, setS1] = useState<Step1>(initial.step1);
  const [s2, setS2] = useState<Step2>(initial.step2);

  // ✅ NEW: touched + attemptedNext
  const [touched1, setTouched1] = useState<Record<string, boolean>>({});
  const [attemptedNext, setAttemptedNext] = useState(false);

  const touch = (name: string) => setTouched1((p) => ({ ...p, [name]: true }));

  // Load draft on role change
  useEffect(() => {
    const saved = loadDraft<Draft>(role);
    if (saved) {
      setStep(saved.step);
      setS1(saved.step1);
      setS2(saved.step2);
    } else {
      setStep(role === "ops" ? 2 : 1);
      setS1(emptyStep1);
      setS2(emptyStep2);
    }

    // ✅ reset a11y validation state when role changes
    setTouched1({});
    setAttemptedNext(false);
  }, [role]);

  // Auto-save: 2s idle debounced
  const saveTimer = useRef<number | null>(null);
  useEffect(() => {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      saveDraft(role, { step, step1: s1, step2: s2 });
    }, 2000);
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [role, step, s1, s2]);

  // Employee ID generation (simple, based on count by department)
  async function recomputeEmployeeId(department: string) {
    const dep = department.trim();
    const prefix = dep.slice(0, 3).toUpperCase().padEnd(3, "_");

    if (prefix.includes("_")) {
      setS1((p) => ({ ...p, employeeId: `${prefix}-___` }));
      return;
    }

    try {
      const rows = await getJSON<any[]>(`${API1}/basicInfo?department=${encodeURIComponent(dep)}`);
      const seq = String(rows.length + 1).padStart(3, "0");
      setS1((p) => ({ ...p, employeeId: `${prefix}-${seq}` }));
    } catch {
      setS1((p) => ({ ...p, employeeId: `${prefix}-001` }));
    }
  }

  // Step1 validation map (still computed, but display is controlled)
  const step1Errors = useMemo(() => {
    const parsed = step1Schema.safeParse(s1);
    if (parsed.success) return null;
    const map: Record<string, string> = {};
    for (const issue of parsed.error.issues) map[issue.path[0] as string] = issue.message;
    return map;
  }, [s1]);

  const step1Valid = role === "admin" ? !step1Errors : true;

  // ✅ NEW: helper to decide whether error should be shown
  const showErr = (name: string) => !!step1Errors?.[name] && (attemptedNext || touched1[name]);

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [progress, setProgress] = useState(0);

  const pushLog = (text: string, tone: LogItem["tone"] = "muted") =>
    setLogs((p) => [...p, { id: crypto.randomUUID(), text, tone }]);

  async function onSubmit() {
    if (submitting) return;
    setSubmitting(true);
    setLogs([]);
    setProgress(0);

    try {
      if (role === "admin") {
        pushLog("⏳ Submitting basicInfo…");
        setProgress(15);
        await sleep(3000);
        await postJSON(`${API1}/basicInfo`, s1);
        pushLog("✅ basicInfo saved!", "ok");
        setProgress(55);
      } else {
        setProgress(35);
      }

      pushLog("⏳ Submitting details…");
      await sleep(3000);
      await postJSON(`${API2}/details`, {
        ...s2,
        email: role === "admin" ? s1.email : undefined,
        employeeId: role === "admin" ? s1.employeeId : undefined,
      });
      pushLog("✅ details saved!", "ok");
      setProgress(92);

      pushLog("🎉 All data processed successfully!", "ok");
      setProgress(100);

      clearDraft(role);
      setTimeout(() => nav("/employees"), 350);
    } catch (e: any) {
      pushLog(`⚠️ Submit failed: ${e?.message ?? "Unknown error"}`, "warn");
      setProgress(100);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="topbar">
        <div className="topbar__inner">
          <div className="brand">
            <div className="brand__logo" />
            <div>
              <div className="brand__title">Employee Wizard</div>
              <div className="sub">Accessible form</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <span className="badge">Role: {role}</span>

            <a className="btn" href={`/wizard?role=${role === "admin" ? "ops" : "admin"}`}>
              Switch to {role === "admin" ? "ops" : "admin"}
            </a>

            <button
              className="btn btn--danger"
              type="button"
              onClick={() => {
                clearDraft(role);
                setStep(role === "ops" ? 2 : 1);
                setS1(emptyStep1);
                setS2(emptyStep2);

                // ✅ reset validation state
                setTouched1({});
                setAttemptedNext(false);
              }}
            >
              Clear Draft
            </button>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="grid grid--2">
          <div className="card">
            <div className="card__header">
              <div>
                <h1 className="h1">{step === 1 ? "Step 1 · Basic Info" : "Step 2 · Details & Submit"}</h1>
                <p className="sub">
                  {role === "admin"
                    ? "Admin mengisi Step 1 lalu Step 2. Error muncul setelah disentuh atau klik Next."
                    : "Ops langsung ke Step 2 (tidak ada Step 1)."}
                </p>
              </div>
              <span className="badge">{role === "ops" ? "Step 2 only" : `Step ${step} / 2`}</span>
            </div>

            <div className="card__body">
              {step === 1 && role === "admin" && (
                <div className="row">
                  <div className="row row--2">
                    <Field
                      label="Full Name"
                      htmlFor="fullName"
                      error={showErr("fullName") ? step1Errors?.fullName ?? null : null}
                    >
                      <input
                        id="fullName"
                        className="input"
                        value={s1.fullName}
                        onChange={(e) => setS1({ ...s1, fullName: e.target.value })}
                        onBlur={() => touch("fullName")}
                        aria-invalid={showErr("fullName")}
                        aria-describedby={showErr("fullName") ? "fullName-error" : undefined}
                        autoComplete="name"
                      />
                    </Field>

                    <Field
                      label="Email"
                      htmlFor="email"
                      error={showErr("email") ? step1Errors?.email ?? null : null}
                    >
                      <input
                        id="email"
                        className="input"
                        value={s1.email}
                        onChange={(e) => setS1({ ...s1, email: e.target.value })}
                        onBlur={() => touch("email")}
                        aria-invalid={showErr("email")}
                        aria-describedby={showErr("email") ? "email-error" : undefined}
                        autoComplete="email"
                        inputMode="email"
                      />
                    </Field>
                  </div>

                  <div className="row row--2">
                    <Field
                      label="Department"
                      htmlFor="department"
                      hint="Ketik untuk mencari. Enter untuk pilih suggestion."
                      error={showErr("department") ? step1Errors?.department ?? null : null}
                    >
                      <Autocomplete
                        id="department"
                        value={s1.department}
                        placeholder="e.g. Engineering"
                        fetchUrl={(q) => `${API1}/departments?name_like=${encodeURIComponent(q)}`}
                        onChange={(v) => setS1({ ...s1, department: v })}
                        onSelect={(v) => recomputeEmployeeId(v)}
                        onBlur={() => touch("department")}
                        showOnFocus
                        minChars={1}
                      />
                    </Field>

                    <Field
                      label="Role"
                      htmlFor="role"
                      error={showErr("role") ? step1Errors?.role ?? null : null}
                    >
                      <select
                        id="role"
                        className="select"
                        value={s1.role}
                        onChange={(e) => setS1({ ...s1, role: e.target.value as Step1["role"] })}
                        onBlur={() => touch("role")}
                      >
                        <option>Ops</option>
                        <option>Admin</option>
                        <option>Engineer</option>
                        <option>Finance</option>
                      </select>
                    </Field>
                  </div>

                  <Field
                    label="Employee ID (auto)"
                    htmlFor="employeeId"
                    hint="Format: ABC-001 (3 huruf dept uppercase + 3 digit sequence)."
                    error={showErr("employeeId") ? step1Errors?.employeeId ?? null : null}
                  >
                    <input
                      id="employeeId"
                      className="input"
                      value={s1.employeeId}
                      readOnly
                      onBlur={() => touch("employeeId")}
                      aria-invalid={showErr("employeeId")}
                      aria-describedby={showErr("employeeId") ? "employeeId-error" : undefined}
                    />
                  </Field>
                </div>
              )}

              {step === 2 && (
                <div className="row">
                  <div className="row row--2">
                    <Field label="Employment Type" htmlFor="employmentType">
                      <select
                        id="employmentType"
                        className="select"
                        value={s2.employmentType ?? "Full-time"}
                        onChange={(e) => setS2({ ...s2, employmentType: e.target.value as any })}
                      >
                        <option>Full-time</option>
                        <option>Part-time</option>
                        <option>Contract</option>
                        <option>Intern</option>
                      </select>
                    </Field>

                    <Field label="Office Location" htmlFor="officeLocation" hint="Ketik untuk cari lokasi kantor.">
                      <Autocomplete
                        id="officeLocation"
                        value={s2.officeLocation ?? ""}
                        placeholder="e.g. Jakarta"
                        fetchUrl={(q) => `${API2}/locations?name_like=${encodeURIComponent(q)}`}
                        onChange={(v) => setS2({ ...s2, officeLocation: v })}
                        showOnFocus
                        minChars={1}
                      />
                    </Field>
                  </div>

                  <Field label="Photo" htmlFor="photo" hint="Upload → preview → disimpan sebagai Base64.">
                    <input
                      id="photo"
                      className="input"
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        const b64 = await fileToBase64(f);
                        setS2((p) => ({ ...p, photoBase64: b64 }));
                      }}
                    />
                    {s2.photoBase64 ? (
                      <div className="photo">
                        <img src={s2.photoBase64} alt="Uploaded preview" />
                      </div>
                    ) : null}
                  </Field>

                  <Field label="Notes" htmlFor="notes">
                    <textarea
                      id="notes"
                      className="textarea"
                      rows={4}
                      value={s2.notes ?? ""}
                      onChange={(e) => setS2({ ...s2, notes: e.target.value })}
                    />
                  </Field>
                </div>
              )}

              <div className="wiz__actions">
                {role === "admin" && step === 2 && (
                  <button className="btn" type="button" onClick={() => setStep(1)} disabled={submitting}>
                    ← Back
                  </button>
                )}

                <div style={{ display: "flex", gap: 10, marginLeft: "auto" }}>
                  {role === "admin" && step === 1 && (
                    <button
                      className="btn btn--primary"
                      type="button"
                      disabled={submitting}
                      onClick={() => {
                        // ✅ This is the key: clicking Next triggers error visibility
                        setAttemptedNext(true);
                        if (step1Valid) setStep(2);
                      }}
                    >
                      Next →
                    </button>
                  )}

                  {step === 2 && (
                    <button className="btn btn--primary" type="button" disabled={submitting} onClick={onSubmit}>
                      {submitting ? "Submitting…" : "Submit"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card__header">
              <div>
                <h1 className="h1">Progress</h1>
                <p className="sub">Simulasi 2 POST berurutan + delay 3 detik.</p>
              </div>
              <a className="btn" href="/employees">Employees →</a>
            </div>
            <div className="card__body">
              <Progress logs={logs} progress={progress} />
              <div className="helper" style={{ marginTop: 14 }}>
                Draft auto-save setelah 2 detik idle ke <code>draft_{role}</code>.
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
