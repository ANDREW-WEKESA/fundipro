import { useEffect, useState } from "react";
import FundiLayout from "./FundiLayout";
import { StatCard, Spinner, Banner } from "../../components/ui";
import api from "../../lib/api";

export default function Statistics() {
  const [summary, setSummary] = useState(null);
  const [jobs, setJobs] = useState(null);
  const [reportStatus, setReportStatus] = useState(null);
  const [reports, setReports] = useState([]);
  const [generating, setGenerating] = useState(false);

  function loadAll() {
    api.get("/jobs/summary").then(({ data }) => setSummary(data));
    api.get("/jobs").then(({ data }) => setJobs(data.jobs));
    api.get("/reports/status").then(({ data }) => setReportStatus(data));
    api.get("/reports").then(({ data }) => setReports(data.reports));
  }
  useEffect(loadAll, []);

  async function downloadReport() {
    setGenerating(true);
    try {
      const res = await api.get("/reports/generate", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `FundiPro-Statement-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      loadAll();
    } finally {
      setGenerating(false);
    }
  }

  if (!summary || !jobs) return <FundiLayout title="Statistics & Reports"><Spinner /></FundiLayout>;

  const bestJob = jobs.reduce((best, j) => (!best || j.profit > best.profit ? j : best), null);
  const avgMargin = jobs.length ? Math.round(jobs.reduce((a, j) => a + j.margin_pct, 0) / jobs.length) : 0;

  return (
    <FundiLayout title="Statistics & Reports">
      <div className="space-y-8">
        {reportStatus?.due && (
          <Banner kind="warn">
            📄 Your {reportStatus.interval_days}-day statement is ready to generate
            {reportStatus.last_generated_at ? ` (last one was ${reportStatus.days_since} days ago)` : " — this is your first one"}.
            <button onClick={downloadReport} disabled={generating} className="font-semibold underline ml-1">
              {generating ? "Generating…" : "Download it now"}
            </button>
          </Banner>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard label="Lifetime jobs" value={summary.all_time.jobs} />
          <StatCard label="Lifetime revenue" value={`KES ${summary.all_time.revenue.toLocaleString()}`} />
          <StatCard label="Lifetime profit" value={`KES ${summary.all_time.profit.toLocaleString()}`} accent="text-good" />
          <StatCard label="Average margin" value={`${avgMargin}%`} sub="across every job" />
        </div>

        {bestJob && (
          <div className="card">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted dark:text-sand/50">Your most profitable job</p>
            <p className="font-display text-xl font-bold text-bark dark:text-sand mt-1">{bestJob.title}</p>
            <p className="text-sm text-good font-semibold mt-1">KES {bestJob.profit.toLocaleString()} profit ({bestJob.margin_pct}% margin)</p>
          </div>
        )}

        <div className="card">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="font-display font-bold text-bark dark:text-sand">Your business statement</h2>
              <p className="text-xs text-muted dark:text-sand/50 mt-1">
                A full PDF summary of your jobs, orders, and material stock — generated automatically every {reportStatus?.interval_days || 20} days,
                or any time you want one.
              </p>
            </div>
            <button onClick={downloadReport} disabled={generating} className="btn-primary shrink-0">
              {generating ? "Generating…" : "Download statement (PDF)"}
            </button>
          </div>

          {reports.length > 0 && (
            <div className="mt-5 pt-4 border-t border-bark/10 dark:border-white/10">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted dark:text-sand/50 mb-2">Past statements</p>
              <div className="space-y-1.5">
                {reports.map((r) => (
                  <div key={r.id} className="flex items-center justify-between text-sm">
                    <span className="text-ink/80 dark:text-sand/70">
                      {r.period_start.slice(0, 10)} → {r.period_end.slice(0, 10)}
                    </span>
                    <span className="text-muted dark:text-sand/50">{r.jobs_count} jobs · KES {r.profit.toLocaleString()} profit</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </FundiLayout>
  );
}
