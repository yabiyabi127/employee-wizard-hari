import { useEffect, useMemo, useState } from "react";
import { API1, API2, getJSON } from "../../lib/api";
import { mergeEmployees, type BasicInfo, type Details } from "../../lib/merge";
import "./EmployeesPage.css";

export function EmployeesPage() {
  const [page, setPage] = useState(1);
  const limit = 2;

  const [basic, setBasic] = useState<BasicInfo[]>([]);
  const [details, setDetails] = useState<Details[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const [b, d] = await Promise.all([
          getJSON<BasicInfo[]>(`${API1}/basicInfo`),
          getJSON<Details[]>(`${API2}/details`),
        ]);
        if (!alive) return;
        setBasic(b);
        setDetails(d);
      } catch (e: any) {
        setErr(e?.message ?? "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const merged = useMemo(() => mergeEmployees(basic, details), [basic, details]);

  const totalPages = Math.max(1, Math.ceil(merged.length / limit));
  const pageSafe = Math.min(page, totalPages);
  const rows = merged.slice((pageSafe - 1) * limit, pageSafe * limit);

  return (
    <>
      <div className="topbar">
        <div className="topbar__inner">
          <div className="brand">
            <div className="brand__logo" />
            <div>
              <div className="brand__title">Employees</div>
              <div className="sub">Merged from /basicInfo + /details</div>
            </div>
          </div>
          <a className="btn btn--primary" href="/wizard?role=admin">+ Add Employee</a>
        </div>
      </div>

      <div className="container">
        <div className="card">
          <div className="card__header">
            <div>
              <h1 className="h1">Employee List</h1>
              <p className="sub">Field yang missing ditampilkan sebagai “—”.</p>
            </div>
            <span className="badge">{merged.length} records</span>
          </div>

          <div className="card__body">
            {loading && <div className="helper">Loading…</div>}
            {err && <div className="err">{err}</div>}

            {!loading && !err && (
              <>
                <div className="table">
                  <div className="table__head">
                    <div>Name</div>
                    <div>Department</div>
                    <div>Role</div>
                    <div>Location</div>
                    <div>Photo</div>
                  </div>

                  {rows.map((r) => (
                    <div className="table__row" key={r.key}>
                      <div className="cell strong">{r.fullName ?? "—"}</div>
                      <div className="cell">{r.department ?? "—"}</div>
                      <div className="cell">{r.role ?? "—"}</div>
                      <div className="cell">{r.officeLocation ?? "—"}</div>
                      <div className="cell">
                        {r.photoBase64 ? <img className="thumb" src={r.photoBase64} alt="Employee photo" /> : <span className="muted">—</span>}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pager">
                  <button className="btn" disabled={pageSafe <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                    ← Prev
                  </button>
                  <span className="badge">Page {pageSafe} / {totalPages}</span>
                  <button className="btn" disabled={pageSafe >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                    Next →
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
