"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Item = {
  Equipamento?: string;
  Preço?: string;
  Descrição?: string;
  Espaço?: string;
  Dano?: string;
  Crítico?: string;
  Alcance?: string;
  Tipo?: string;
  Categoria?: string;
  Local?: string[];
  nome_arquivo_imagem?: string;
  [key: string]: unknown;
};

function clean(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function field(label: string, value: unknown) {
  const v = clean(value) || "—";
  return (
    <div className="rounded-sm border-2 border-[#660000] bg-[#2a0a0a] px-4 py-3">
      <div className="text-xs text-[#a0a0a0]">{label}</div>
      <div className="mt-1 wrap-break-word text-sm font-semibold text-[#e8e8e8]">
        {v}
      </div>
    </div>
  );
}

function decodeItemParam(raw: string) {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function CatalogPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const q = searchParams.get("q") ?? "";
  const category = searchParams.get("categoria") ?? "";
  const location = searchParams.get("local") ?? "";
  const itemFromUrl = searchParams.get("item");

  const setFilterParams = useCallback(
    (updates: Record<string, string | null | undefined>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === undefined || value === "") {
          next.delete(key);
        } else {
          next.set(key, value);
        }
      }
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentIndex, setCurrentIndex] = useState(-1);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const cache = process.env.NODE_ENV === "development" ? "no-store" : "force-cache";
        const res = await fetch("/itens.json", { cache });
        if (!res.ok) throw new Error(`Falha ao carregar itens (${res.status})`);
        const data = (await res.json()) as unknown;
        if (!Array.isArray(data)) throw new Error("JSON inválido (esperava array)");
        if (!cancelled) setItems(data as Item[]);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Erro desconhecido");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const i of items) {
      const c = clean(i.Categoria);
      if (c) set.add(c);
    }
    return [...set].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [items]);

  const locations = useMemo(() => {
    const set = new Set<string>();
    for (const i of items) {
      const locs = i.Local;
      if (Array.isArray(locs)) {
        locs.forEach((loc) => {
          const s = String(loc).trim();
          if (s) set.add(s);
        });
      }
    }
    return [...set].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [items]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return items
      .filter((item) => {
        const okCategory = !category || clean(item.Categoria) === category;
        const locs = Array.isArray(item.Local) ? item.Local : [];
        const okLocation = !location || locs.some((loc) => String(loc).trim() === location);
        if (!okCategory || !okLocation) return false;
        if (!term) return true;
        const hay = Object.values(item).join(" ").toLowerCase();
        return hay.includes(term);
      })
      .sort((a, b) =>
        clean(a.Equipamento).localeCompare(clean(b.Equipamento), "pt-BR"),
      );
  }, [items, q, category, location]);

  useEffect(() => {
    if (filtered.length === 0) {
      setCurrentIndex(-1);
      return;
    }
    if (itemFromUrl) {
      const decoded = decodeItemParam(itemFromUrl);
      const found = filtered.findIndex((i) => clean(i.Equipamento) === decoded);
      if (found >= 0) {
        setCurrentIndex(found);
        return;
      }
      setFilterParams({ item: null });
    }
    setCurrentIndex((idx) => {
      if (idx < 0) return 0;
      if (idx >= filtered.length) return 0;
      return idx;
    });
  }, [filtered, itemFromUrl, setFilterParams]);

  const current = currentIndex >= 0 ? filtered[currentIndex] : null;
  const imgKey = clean(current?.nome_arquivo_imagem);
  const imgSrc = imgKey ? `/images/${encodeURIComponent(imgKey)}` : "";
  const title = clean(current?.Equipamento);
  const desc = clean(current?.Descrição) || "Sem descrição.";

  const selectItem = (idx: number) => {
    setCurrentIndex(idx);
    setDrawerOpen(false);
    const name = clean(filtered[idx]?.Equipamento);
    if (name) {
      setFilterParams({ item: encodeURIComponent(name) });
    } else {
      setFilterParams({ item: null });
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] text-[#e8e8e8]">
      {/* Mobile header */}
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b-2 border-[#660000] bg-[#1a0505] px-4 py-3 lg:hidden">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="rounded-sm p-2 text-[#ff0000] transition-colors hover:bg-[#440000] hover:shadow-[0_0_8px_rgba(255,0,0,0.3)]"
          aria-label="Abrir lista de itens"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="flex-1 truncate font-tormenta text-lg text-[#ff0000]">
          {current ? title || "Sem nome" : "Catálogo de Itens T20"}
        </h1>
      </header>

      {/* Backdrop (mobile) */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setDrawerOpen(false)}
        onKeyDown={(e) => e.key === "Escape" && setDrawerOpen(false)}
        className={[
          "fixed inset-0 z-30 bg-black/80 transition-opacity lg:hidden",
          drawerOpen ? "opacity-100" : "pointer-events-none opacity-0",
        ].join(" ")}
        aria-hidden="true"
      />

      {/* Grid: drawer/sidebar + main */}
      <div className="lg:grid lg:min-h-screen lg:grid-cols-[360px_1fr]">
        {/* Drawer (mobile) / Sidebar (desktop) */}
        <aside
          className={[
            "fixed inset-y-0 left-0 z-40 flex w-[min(320px,85vw)] flex-col border-r-2 border-[#660000] bg-[#1a0505] p-4 shadow-[0_0_24px_rgba(255,0,0,0.15)] transition-transform duration-300 ease-out lg:static lg:inset-auto lg:z-0 lg:h-screen lg:w-auto lg:translate-x-0 lg:shadow-none",
            drawerOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          ].join(" ")}
        >
          <div className="flex items-center justify-between lg:block">
            <h1 className="font-tormenta text-xl text-[#ff0000]">Catálogo de Itens T20</h1>
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="rounded-sm p-2 text-[#a0a0a0] transition-colors hover:bg-[#440000] hover:text-[#ff0000] lg:hidden"
              aria-label="Fechar menu"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="mt-1 text-sm text-[#a0a0a0]">Busca e filtro por categoria.</p>

          <div className="mt-4 grid gap-2.5">
            <input
              value={q}
              onChange={(e) => setFilterParams({ q: e.target.value || null })}
              placeholder="Buscar por nome, descrição…"
              className="w-full rounded-sm border-2 border-[#660000] bg-[#1a0505] px-3 py-2.5 text-sm text-[#e8e8e8] outline-none placeholder:text-[#666] focus:border-[#ff0000] focus:ring-1 focus:ring-[#ff0000]"
            />
            <select
              value={category}
              onChange={(e) => setFilterParams({ categoria: e.target.value || null })}
              className="w-full rounded-sm border-2 border-[#660000] bg-[#1a0505] px-3 py-2.5 text-sm text-[#e8e8e8] outline-none focus:border-[#ff0000]"
            >
              <option value="">Todas as categorias</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              value={location}
              onChange={(e) => setFilterParams({ local: e.target.value || null })}
              className="w-full rounded-sm border-2 border-[#660000] bg-[#1a0505] px-3 py-2.5 text-sm text-[#e8e8e8] outline-none focus:border-[#ff0000]"
            >
              <option value="">Todos os locais</option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>

            <div className="text-xs text-[#a0a0a0]">
              {loading ? "Carregando…" : error ? `Erro: ${error}` : `${filtered.length} item(ns)`}
            </div>
          </div>

          <div className="mt-3 min-h-0 flex-1 overflow-auto pb-8">
            <div className="grid gap-2">
              {filtered.map((row, idx) => {
                const active = idx === currentIndex;
                const name = clean(row.Equipamento) || "Sem nome";
                const locStr = Array.isArray(row.Local) ? row.Local.join(", ") : "";
                const meta = [clean(row.Preço), clean(row.Categoria), locStr].filter(Boolean).join(" • ");
                return (
                  <button
                    key={`${name}-${idx}`}
                    onClick={() => selectItem(idx)}
                    className={[
                      "w-full rounded-sm border-2 px-3 py-3 text-left transition-all",
                      active
                        ? "border-[#ff0000] bg-[#440000] shadow-[0_0_12px_rgba(255,0,0,0.3)]"
                        : "border-[#660000] bg-[#2a0a0a] hover:border-[#cc0000] hover:bg-[#440000] hover:shadow-[0_0_8px_rgba(255,0,0,0.2)]",
                    ].join(" ")}
                  >
                    <div className="text-sm font-semibold text-[#e8e8e8]">{name}</div>
                    <div className="mt-1 text-xs text-[#a0a0a0]">{meta || "—"}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="min-h-[calc(100vh-3.5rem)] p-4 lg:min-h-screen lg:p-6">
        {!current ? (
          <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center text-[#a0a0a0]">
            {loading ? (
              "Carregando…"
            ) : (
              <>
                <p className="max-w-xs">Toque no menu para ver a lista de itens e selecionar um.</p>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(true)}
                  className="rounded-sm border-2 border-[#660000] bg-[#2a0a0a] px-4 py-2 text-sm font-medium text-[#e8e8e8] transition-all hover:border-[#ff0000] hover:shadow-[0_0_12px_rgba(255,0,0,0.3)]"
                >
                  Abrir lista
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="mx-auto max-w-4xl overflow-hidden rounded-sm border-2 border-[#660000] bg-[#2a0a0a] shadow-[0_0_24px_rgba(255,0,0,0.1)]">
            {/* Mobile: imagem em destaque no topo */}
            <div className="border-b-2 border-[#660000] bg-[#0d0202] p-4">
              {imgSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imgSrc}
                  alt={title || "Imagem do item"}
                  className="mx-auto max-h-70 w-full rounded-sm object-contain sm:max-h-85"
                  loading="lazy"
                />
              ) : (
                <div className="grid min-h-50 place-items-center text-center text-sm text-[#a0a0a0] sm:min-h-70">
                  Sem imagem.
                </div>
              )}
            </div>

            <div className="p-4 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h2 className="font-tormenta text-2xl leading-tight text-[#ff0000] sm:text-3xl">
                  {title || "Sem nome"}
                </h2>
                {clean(current.Categoria) ? (
                  <span className="inline-flex shrink-0 rounded-sm border-2 border-[#ff0000] bg-[#440000] px-3 py-1 text-xs font-medium text-[#ff0000]">
                    {clean(current.Categoria)}
                  </span>
                ) : null}
              </div>

              <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-[#e8e8e8]">{desc}</p>

              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {field("Preço", current.Preço)}
                {field("Espaço", current.Espaço)}
                {field("Dano", current.Dano)}
                {field("Crítico", current.Crítico)}
                {field("Alcance", current.Alcance)}
                {field("Tipo", current.Tipo)}
                {Array.isArray(current.Local) && current.Local.length > 0
                  ? field("Disponível em", current.Local.join(", "))
                  : null}
              </div>
            </div>
          </div>
        )}
        </main>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#000000] text-[#a0a0a0]">
          Carregando…
        </div>
      }
    >
      <CatalogPage />
    </Suspense>
  );
}
