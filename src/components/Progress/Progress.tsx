import "./Progress.css";

export type LogItem = { id: string; text: string; tone: "muted" | "ok" | "warn" };

export function Progress({ logs, progress }: { logs: LogItem[]; progress: number }) {
  return (
    <div>
      <div className="pr__bar" aria-label="progress bar">
        <div className="pr__fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="pr__logs" aria-live="polite">
        {logs.map((l) => (
          <div key={l.id} className={`pr__line pr__line--${l.tone}`}>{l.text}</div>
        ))}
      </div>
    </div>
  );
}
