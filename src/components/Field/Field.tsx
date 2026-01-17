import "./Field.css";

type Props = {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string | null;
  children: React.ReactNode;
};

export function Field({ label, htmlFor, hint, error, children }: Props) {
  const describedBy = [
    hint ? `${htmlFor}-hint` : null,
    error ? `${htmlFor}-error` : null,
  ]
    .filter(Boolean)
    .join(" ") || undefined;

  return (
    <div className="field">
      <label className="field__label" htmlFor={htmlFor}>
        {label}
      </label>

      <div className="field__control" data-describedby={describedBy}>
        {children}
      </div>

      <div className="field__meta">
        {error ? (
          <div className="err" id={`${htmlFor}-error`}>
            {error}
          </div>
        ) : hint ? (
          <div className="helper" id={`${htmlFor}-hint`}>
            {hint}
          </div>
        ) : (
          <span aria-hidden="true" />
        )}
      </div>
    </div>
  );
}
