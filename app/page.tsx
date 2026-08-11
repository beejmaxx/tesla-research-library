"use client";

import { useEffect, useMemo, useState } from "react";

type Source = {
  source_id: string;
  title: string;
  creator: string;
  evidence_tier: string;
  pages: number;
  chunks: number;
  needs_ocr: boolean;
};

type Chunk = { chunk_id: string; source_id: string; page: number; text: string };
type ResearchIndex = { built_at: string; sources: Source[]; chunks: Chunk[] };

const concepts = [
  { id: "rotating magnetic field", title: "The rotating magnetic field", idea: "Coordination in time can create motion in space.", level: "Start here" },
  { id: "induction motor", title: "The induction motor", idea: "A moving field induces current in a rotor, and the interaction produces torque.", level: "Core idea" },
  { id: "resonance", title: "Resonance & tuned circuits", idea: "Energy moves back and forth between electric and magnetic storage.", level: "Core idea" },
  { id: "high frequency", title: "High-frequency currents", idea: "Changing frequency changes how current behaves, radiates, and interacts with matter.", level: "Experiments" },
  { id: "wireless", title: "Wireless signaling & power", idea: "Separate demonstrated communication and control from the larger transmission proposal.", level: "Deep dive" },
  { id: "telautomatics", title: "Telautomatics", idea: "Remote control becomes a first step toward machines that select and execute commands.", level: "Deep dive" },
  { id: "turbine", title: "Turbines & fluid machines", idea: "Viscosity and adhesion can transfer momentum without conventional blades.", level: "Mechanical" },
  { id: "visualization", title: "Tesla’s method", idea: "Mental simulation, physical demonstration, and patent strategy formed one working method.", level: "Practice" },
];

function excerpt(text: string, terms: string[]) {
  const lower = text.toLowerCase();
  const positions = terms.map((term) => lower.indexOf(term)).filter((position) => position >= 0);
  const startAt = positions.length ? Math.max(0, Math.min(...positions) - 150) : 0;
  const value = text.slice(startAt, startAt + 520).trim();
  return `${startAt > 0 ? "…" : ""}${value}${startAt + 520 < text.length ? "…" : ""}`;
}

export default function Home() {
  const [data, setData] = useState<ResearchIndex | null>(null);
  const [query, setQuery] = useState("");
  const [activeSource, setActiveSource] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/data/research-index.json")
      .then((response) => response.json())
      .then((index: ResearchIndex) => setData(index))
      .finally(() => setLoading(false));
  }, []);

  const sourceMap = useMemo(() => new Map(data?.sources.map((source) => [source.source_id, source]) ?? []), [data]);
  const terms = useMemo(
    () => query.toLowerCase().trim().split(/\s+/).filter((term) => term.length > 1),
    [query],
  );
  const results = useMemo(() => {
    if (!data || !terms.length) return [];
    return data.chunks
      .filter((chunk) => activeSource === "all" || chunk.source_id === activeSource)
      .map((chunk) => {
        const haystack = chunk.text.toLowerCase();
        const score = terms.reduce((total, term) => total + (haystack.split(term).length - 1), 0);
        return { ...chunk, score };
      })
      .filter((chunk) => chunk.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 40);
  }, [activeSource, data, terms]);

  const chooseConcept = (id: string) => {
    setQuery(id);
    setActiveSource("all");
    requestAnimationFrame(() => document.getElementById("search")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  return (
    <main className="study-shell">
      <header className="topbar">
        <a href="#top" className="brand"><span className="brand-dot" /> Tesla Study</a>
        <div className="corpus-count">{data ? `${data.sources.length} sources · ${data.chunks.length.toLocaleString()} passages` : "Loading private library…"}</div>
        <div className="local-badge"><span /> Local & private</div>
      </header>

      <div className="workspace" id="top">
        <aside className="sidebar">
          <div className="side-label">Study</div>
          <nav>
            <a className="selected" href="#start">Start here</a>
            <a href="#concepts">Concepts</a>
            <a href="#search">Search library</a>
            <a href="#sources">Sources</a>
          </nav>
          <div className="side-label second">Principle</div>
          <p className="side-note">Build the simple picture first. Add Tesla’s own language second. Keep speculation visible, but separate.</p>
        </aside>

        <section className="content">
          <div className="intro" id="start">
            <div className="kicker">A PERSONAL KNOWLEDGE BASE</div>
            <h1>Understand the work,<br />one idea at a time.</h1>
            <p>This is a reading room for everything you have on Tesla. It turns books, patents, interviews, and notes into a single searchable library—then organizes that material into explanations you can actually build on.</p>
            <button onClick={() => chooseConcept("rotating magnetic field")} className="start-button">Begin with the rotating field <span>→</span></button>
          </div>

          <section className="how-it-works">
            <div className="section-title"><span>How to use this</span></div>
            <div className="steps">
              <div><b>1</b><h3>Choose an idea</h3><p>Start with a concept rather than a book or a date.</p></div>
              <div><b>2</b><h3>Read across the library</h3><p>See Tesla, patents, biographies, and your notes together.</p></div>
              <div><b>3</b><h3>Build your model</h3><p>Keep what clarifies the mechanism; mark what still feels unresolved.</p></div>
            </div>
          </section>

          <section className="concept-section" id="concepts">
            <div className="section-heading">
              <div><div className="kicker">LEARNING MAP</div><h2>Core concepts</h2></div>
              <p>These will become full explanations as the library is worked through.</p>
            </div>
            <div className="concept-list">
              {concepts.map((concept, index) => (
                <button key={concept.id} onClick={() => chooseConcept(concept.id)} className="concept-row">
                  <span className="concept-number">{String(index + 1).padStart(2, "0")}</span>
                  <span className="concept-main"><b>{concept.title}</b><small>{concept.idea}</small></span>
                  <span className="concept-level">{concept.level}</span>
                  <span className="concept-arrow">→</span>
                </button>
              ))}
            </div>
          </section>

          <section className="search-section" id="search">
            <div className="section-heading compact">
              <div><div className="kicker">FULL-TEXT SEARCH</div><h2>Search your library</h2></div>
              <p>Searches all extracted books, patents, papers, and personal notes.</p>
            </div>
            <div className="search-controls">
              <label className="search-input"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try ‘magnifying transmitter’ or ‘resonance’" /></label>
              <select value={activeSource} onChange={(event) => setActiveSource(event.target.value)} aria-label="Limit search to one source">
                <option value="all">All sources</option>
                {data?.sources.map((source) => <option value={source.source_id} key={source.source_id}>{source.title}</option>)}
              </select>
            </div>

            <div className="search-meta">
              {loading ? "Preparing the library…" : terms.length ? `${results.length}${results.length === 40 ? "+" : ""} matching passages` : "Enter a term or choose a concept above"}
            </div>
            <div className="results">
              {results.map((result) => {
                const source = sourceMap.get(result.source_id);
                return (
                  <article className="result" key={result.chunk_id}>
                    <div className="result-meta"><span>{source?.title ?? result.source_id}</span><span>{source?.pages === 1 ? "Digital text" : `Page ${result.page}`}</span></div>
                    <p>{excerpt(result.text, terms)}</p>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="source-section" id="sources">
            <div className="section-heading compact">
              <div><div className="kicker">INGESTED MATERIAL</div><h2>What is here</h2></div>
              <p>Exact duplicates are excluded. Difficult scans will be OCR’d separately.</p>
            </div>
            <div className="source-table">
              {data?.sources.map((source) => (
                <button key={source.source_id} onClick={() => { setActiveSource(source.source_id); setQuery(""); document.getElementById("search")?.scrollIntoView({ behavior: "smooth" }); }}>
                  <span className="tier">{source.evidence_tier}</span>
                  <span className="source-name"><b>{source.title}</b><small>{source.creator}</small></span>
                  <span>{source.pages === 1 ? `${source.chunks} sections` : `${source.pages} pages`}</span>
                  <span>Search →</span>
                </button>
              ))}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
