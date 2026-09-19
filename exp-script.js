function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function statusMarkup(status) {
  const label = STATUS_LABELS[status] || "Neutral";
  return `<span class="status-dot"></span><span class="status-text">${label}</span>`;
}

// ---------- Homepage ----------

function renderExperimentList() {
  const list = document.getElementById("experiment-list");
  if (!list) return;

  list.innerHTML = EXPERIMENTS.map((exp) => `
    <a class="experiment-row" href="experiment-detail.html?slug=${encodeURIComponent(exp.slug)}">
      <div class="main">
        <div class="name">${escapeHtml(exp.name)}</div>
        <div class="oneliner">${escapeHtml(exp.oneLiner)}</div>
        <div class="tags">
          <span class="tag">${escapeHtml(exp.pageType)}</span>
          <span class="tag">${escapeHtml(exp.testType)}</span>
        </div>
      </div>
      <div class="result-block">
        <div class="result-num">${escapeHtml(exp.result)}</div>
        <div class="result-kpi">${escapeHtml(exp.resultLabel)}</div>
        <div class="status-line status-${exp.status}">${statusMarkup(exp.status)}</div>
      </div>
    </a>
  `).join("");
}

function renderStats() {
  const el = document.getElementById("stats-row");
  if (!el) return;

  const total = EXPERIMENTS.length;
  const winners = EXPERIMENTS.filter((e) => e.status === "winner").length;

  const cvrLifts = EXPERIMENTS
    .map((e) => e.resultsTable.find((r) => r.metric.startsWith("Conversion Rate") && !r.metric.includes("Returning") && !r.metric.includes("New")))
    .filter(Boolean)
    .map((r) => parseFloat(r.change))
    .filter((n) => !Number.isNaN(n));

  const avgLift = cvrLifts.length
    ? (cvrLifts.reduce((a, b) => a + b, 0) / cvrLifts.length).toFixed(1)
    : "—";

  const stats = [
    { num: String(total), lbl: "Experiments Documented" },
    { num: String(winners), lbl: "Winning Tests" },
    { num: `+${avgLift}%`, lbl: "Avg. Conversion Lift" },
    { num: "Shopify", lbl: "Primary Platform" }
  ];

  el.innerHTML = stats.map((s) => `
    <div class="stat">
      <div class="num">${s.num}</div>
      <div class="lbl">${s.lbl}</div>
    </div>
  `).join("");
}

// ---------- Detail page ----------

function getSlugFromQuery() {
  const params = new URLSearchParams(window.location.search);
  return params.get("slug");
}

function resultsTableMarkup(exp) {
  const hasControlVariation = exp.resultsTable.some((r) => r.control);
  const rows = exp.resultsTable.map((r) => {
    const isNeg = String(r.change).trim().startsWith("-");
    const changeClass = r.change === "flat" ? "" : (isNeg ? "change-neg" : "change-pos");
    if (hasControlVariation) {
      return `<tr>
        <td>${escapeHtml(r.metric)}</td>
        <td>${r.control ? escapeHtml(r.control) : "—"}</td>
        <td>${r.variation ? escapeHtml(r.variation) : "—"}</td>
        <td class="${changeClass}">${escapeHtml(r.change)}</td>
      </tr>`;
    }
    return `<tr>
      <td>${escapeHtml(r.metric)}</td>
      <td class="${changeClass}">${escapeHtml(r.change)}</td>
    </tr>`;
  }).join("");

  const head = hasControlVariation
    ? `<tr><th>Metric</th><th>Control</th><th>Variation</th><th>Change</th></tr>`
    : `<tr><th>Metric</th><th>Change</th></tr>`;

  return `<table class="results-table"><thead>${head}</thead><tbody>${rows}</tbody></table>`;
}

function renderExperimentDetail() {
  const root = document.getElementById("exp-root");
  if (!root) return;

  const slug = getSlugFromQuery();
  const exp = EXPERIMENTS.find((e) => e.slug === slug);

  if (!exp) {
    root.innerHTML = `
      <div class="exp-header">
        <h1>Experiment not found</h1>
        <p style="color:var(--ink-soft); margin-top:16px;">This test may have been renamed or removed. Head back to the full library.</p>
        <a class="back-link" href="experiments.html">Back to Experiments</a>
      </div>`;
    document.title = "Experiment not found";
    return;
  }

  document.title = `${exp.name} — CRO Experiment Library`;

  const setup = exp.testSetup;

  root.innerHTML = `
    <a class="back-link" href="experiments.html">&larr; All experiments</a>

    <header class="exp-header">
      <div class="tags">
        <span class="tag">${escapeHtml(exp.pageType)}</span>
        <span class="tag">${escapeHtml(exp.testType)}</span>
        <span class="tag">${escapeHtml(exp.device)}</span>
      </div>
      <h1>${escapeHtml(exp.name)}</h1>
      <div class="result-row">
        <div class="result-num">${escapeHtml(exp.result)}</div>
        <div class="result-kpi">${escapeHtml(exp.resultLabel)}</div>
        <div class="status-line status-${exp.status}" style="margin-top:0;">${statusMarkup(exp.status)}</div>
      </div>
      <div class="decision"><strong>Decision:</strong> ${escapeHtml(exp.decision)}</div>
    </header>

    <div class="exp-body">
      <div class="exp-main">

        <section class="exp-sec">
          <h3>Context</h3>
          <p>${escapeHtml(exp.context)}</p>
        </section>

        <section class="exp-sec">
          <h3>Research &amp; Evidence</h3>
          <p>${escapeHtml(exp.research)}</p>
        </section>

        <section class="exp-sec">
          <h3>Hypothesis</h3>
          <div class="hypothesis-box">
            <p>${escapeHtml(exp.hypothesis)}</p>
          </div>
        </section>

        <section class="exp-sec">
          <h3>Test Setup</h3>
          <div class="compare">
            <div class="col">
              <div class="lbl">Control</div>
              <p>${escapeHtml(setup.control)}</p>
            </div>
            <div class="col">
              <div class="lbl">Variation</div>
              <p>${escapeHtml(setup.variation)}</p>
            </div>
          </div>
          <div class="meta-grid">
            <div class="meta-row"><div class="k">Traffic</div><div class="v">${escapeHtml(setup.traffic)}</div></div>
            <div class="meta-row"><div class="k">Audience</div><div class="v">${escapeHtml(setup.audience)}</div></div>
            <div class="meta-row"><div class="k">Device</div><div class="v">${escapeHtml(setup.device)}</div></div>
            <div class="meta-row"><div class="k">Duration</div><div class="v">${escapeHtml(setup.duration)}</div></div>
            <div class="meta-row"><div class="k">Primary metric</div><div class="v">${escapeHtml(setup.primaryMetric)}</div></div>
            <div class="meta-row"><div class="k">Secondary metrics</div><div class="v">${escapeHtml(setup.secondaryMetrics)}</div></div>
            <div class="meta-row"><div class="k">Confidence</div><div class="v">${escapeHtml(setup.confidence)}</div></div>
          </div>
        </section>

        <section class="exp-sec">
          <h3>Results</h3>
          <div class="results-primary">
            <div class="big-num">${escapeHtml(exp.result)}</div>
            <div class="result-kpi">${escapeHtml(exp.resultLabel)}</div>
          </div>
          ${resultsTableMarkup(exp)}
        </section>

        <section class="exp-sec">
          <h3>Learnings</h3>
          <p>${escapeHtml(exp.learnings)}</p>
        </section>

        <section class="exp-sec">
          <h3>Business Impact</h3>
          <p>${escapeHtml(exp.businessImpact)}</p>
        </section>

        <section class="exp-sec">
          <h3>Next Steps</h3>
          <p>${escapeHtml(exp.nextSteps)}</p>
        </section>

      </div>

      <aside class="exp-side">
        <div class="side-block">
          <h4>Brand</h4>
          <p>${escapeHtml(exp.brand)}</p>
        </div>
        <div class="side-block">
          <h4>Page type</h4>
          <p>${escapeHtml(exp.pageType)}</p>
        </div>
        <div class="side-block">
          <h4>Test type</h4>
          <p>${escapeHtml(exp.testType)}</p>
        </div>
        <div class="side-block">
          <h4>Primary KPI</h4>
          <p>${escapeHtml(exp.primaryKPI)}</p>
        </div>
        <div class="side-block">
          <h4>Status</h4>
          <p class="status-${exp.status}" style="font-weight:500;">${STATUS_LABELS[exp.status]}</p>
        </div>
      </aside>
    </div>
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  renderStats();
  renderExperimentList();
  renderExperimentDetail();
});
