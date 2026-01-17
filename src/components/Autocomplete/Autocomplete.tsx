import { useEffect, useId, useMemo, useRef, useState } from "react";
import "./Autocomplete.css";

type Item = { id: number; name: string };

type Props = {
  id: string;
  value: string;
  placeholder?: string;
  fetchUrl: (q: string) => string;
  onChange: (v: string) => void;
  onSelect?: (v: string) => void;
  onBlur?: () => void;

  /**
   * If true: when input is focused while empty, fetch and show default suggestions (topN).
   * This fixes the "press Enter with empty query -> no suggestions" expectation by showing a list on focus.
   */
  showOnFocus?: boolean;

  /** Limit default list size when showOnFocus is true */
  defaultLimit?: number;

  /** If set, requires at least N chars to trigger search (for typed queries). Default 1 */
  minChars?: number;
};

export function Autocomplete({
  id,
  value,
  placeholder,
  fetchUrl,
  onChange,
  onSelect,
  onBlur,
  showOnFocus = false,
  defaultLimit = 10,
  minChars = 1,
}: Props) {
  const listboxId = useId();
  const [items, setItems] = useState<Item[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<number>(-1);
  const [loading, setLoading] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  const q = value.trim();
  const url = useMemo(() => fetchUrl(q), [fetchUrl, q]);

  const close = () => {
    setOpen(false);
    setActive(-1);
  };

  const applyFilter = (data: Item[], needle: string) => {
    const n = needle.toLowerCase();
    // startsWith filter (case-insensitive)
    return data.filter((it) => it.name.toLowerCase().startsWith(n));
  };

  const pick = (name: string) => {
    onChange(name);
    onSelect?.(name);
    close();
  };

  // Typed search (debounced)
  useEffect(() => {
    // if empty query: do not auto fetch here (handled by showOnFocus logic)
    if (!q) {
      setItems([]);
      close();
      abortRef.current?.abort();
      return;
    }

    // enforce min chars for typed search
    if (q.length < minChars) {
      setItems([]);
      close();
      abortRef.current?.abort();
      return;
    }

    const t = window.setTimeout(async () => {
      try {
        abortRef.current?.abort();
        const ac = new AbortController();
        abortRef.current = ac;

        setLoading(true);
        const res = await fetch(url, { signal: ac.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = (await res.json()) as Item[];
        const filtered = applyFilter(data, q);

        setItems(filtered);
        setOpen(filtered.length > 0);
        setActive(filtered.length ? 0 : -1);
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        setItems([]);
        close();
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => window.clearTimeout(t);
  }, [q, url, minChars]);

  // Fetch default list on focus (when empty)
  async function fetchDefaultList() {
    try {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;

      setLoading(true);
      const res = await fetch(fetchUrl(""), { signal: ac.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = (await res.json()) as Item[];

      // limit so it doesn't show "everything"
      const top = data.slice(0, defaultLimit);

      setItems(top);
      setOpen(top.length > 0);
      setActive(top.length ? 0 : -1);
    } catch (e: any) {
      if (e?.name === "AbortError") return;
      setItems([]);
      close();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ac">
      <div className="ac__wrap">
        <input
          id={id}
          className="input"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            // ✅ If empty and showOnFocus -> fetch and show defaults
            if (!value.trim() && showOnFocus) {
              fetchDefaultList();
              return;
            }
            // if we already have items (from previous search), allow open
            if (items.length) setOpen(true);
          }}
          onBlur={() => {
            onBlur?.();
            // allow click selection before closing
            setTimeout(() => close(), 120);
          }}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-activedescendant={active >= 0 ? `${listboxId}-opt-${active}` : undefined}
          onKeyDown={(e) => {
            // If dropdown is closed but empty + showOnFocus, Enter should show defaults
            if (e.key === "Enter" && !open && !value.trim() && showOnFocus) {
              e.preventDefault();
              fetchDefaultList();
              return;
            }

            if (!open) return;

            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((p) => Math.min(items.length - 1, p + 1));
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((p) => Math.max(0, p - 1));
            }
            if (e.key === "Enter") {
              if (active >= 0 && items[active]) {
                e.preventDefault();
                pick(items[active].name);
              }
            }
            if (e.key === "Escape") {
              e.preventDefault();
              close();
            }
          }}
        />

        {loading && <div className="ac__spinner" aria-label="loading" />}
      </div>

      {open && items.length > 0 && (
        <div className="ac__menu" id={listboxId} role="listbox">
          {items.map((it, idx) => (
            <button
              key={it.id}
              type="button"
              id={`${listboxId}-opt-${idx}`}
              className={`ac__item ${idx === active ? "is-active" : ""}`}
              role="option"
              aria-selected={idx === active}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setActive(idx)}
              onClick={() => pick(it.name)}
            >
              {it.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
