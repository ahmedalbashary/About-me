/**
 * Ahmed Ashraf – experiments.js
 * Renders the CRO Experiment Library grid and the experiment detail template
 * from experiments-data.js. Add a new test by appending an object to that
 * file's EXPERIMENTS array — nothing here needs to change.
 */

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function statusChip(status) {
  const label = STATUS_LABELS[status] || "Neutral";
  return `<span class="exp-status exp-status--${status}">${label}</span>`;
}

/* ---------- Experiments grid ---------- */

function renderExpStats() {
  const el = document.getElementById("exp-stats");
  if (!el) return;

  const total = EXPERIMENTS.length;
  const winners = EXPERIMENTS.filter((e) => e.status === "winner").length;

  const cvrLifts = EXPERIMENTS
    .map((e) => e.resultsTable.find((r) =>
      r.metric.startsWith("Conversion Rate") &&
      !r.metric.includes("Returning") &&
      !r.metric.includes("New")))
    .filter(Boolean)
    .map((r) => parseFloat(r.change))
    .filter((n) => !Number.isNaN(n));

  const avgLift = cvrLifts.length
    ? (cvrLifts.reduce((a, b) => a + b, 0) / cvrLifts.length).toFixed(1)
    : "—";

  const stats = [
    { num: String(total), label: "Experiments Documented" },
    { num: String(winners), label: "Winning Tests" },
    { num: `+${avgLift}%`, label: "Avg. Conversion Lift" },
    { num: "Shopify", label: "Primary Platform" }
  ];

  el.innerHTML = stats.map((s) => `
    <div class="stat-card">
      <span class="stat-num">${s.num}</span>
      <span class="stat-label">${s.label}</span>
    </div>
  `).join("");
}

function renderExpList() {
  const list = document.getElementById("exp-list");
  if (!list) return;

  list.innerHTML = EXPERIMENTS.map((exp, i) => `
    <a class="exp-row" href="experiment-detail.html?slug=${encodeURIComponent(exp.slug)}" style="animation-delay:${0.05 + i * 0.06}s">
      <div class="main">
        <div class="exp-name">${escapeHtml(exp.name)}</div>
        <div class="exp-oneliner">${escapeHtml(exp.oneLiner)}</div>
        <div class="exp-tags">
          <span class="tag">${escapeHtml(exp.pageType)}</span>
          <span class="tag">${escapeHtml(exp.testType)}</span>
        </div>
      </div>
      <div class="exp-result-block">
        <div class="exp-result-num">${escapeHtml(exp.result)}</div>
        <div class="exp-result-kpi">${escapeHtml(exp.resultLabel)}</div>
        ${statusChip(exp.status)}
      </div>
    </a>
  `).join("");
}

/* ---------- Experiment detail ---------- */

function getSlugFromQuery() {
  return new URLSearchParams(window.location.search).get("slug");
}

function resultsTableMarkup(exp) {
  const hasControlVariation = exp.resultsTable.some((r) => r.control);
  const rows = exp.resultsTable.map((r) => {
    const isNeg = String(r.change).trim().startsWith("-");
    const changeClass = r.change === "flat" ? "" : (isNeg ? "neg" : "pos");
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

  return `<table class="exp-results-table"><thead>${head}</thead><tbody>${rows}</tbody></table>`;
}

function renderExpDetail() {
  const root = document.getElementById("exp-detail-root");
  if (!root) return;

  const slug = getSlugFromQuery();
  const exp = EXPERIMENTS.find((e) => e.slug === slug);

  if (!exp) {
    root.innerHTML = `
      <div class="exp-detail-header">
        <h1 class="exp-detail-title">Experiment not found</h1>
        <p style="font-family:var(--font-body); color:var(--ink-light);">This test may have been renamed or removed.</p>
      </div>
      <a href="experiments.html" class="back-link">&larr; Back to Experiments</a>`;
    document.title = "Experiment not found | Ahmed Ashraf";
    return;
  }

  document.title = `${exp.name} | Ahmed Ashraf`;
  const setup = exp.testSetup;

  root.innerHTML = `
    <header class="exp-detail-header">
      <div class="exp-tags">
        <span class="tag">${escapeHtml(exp.pageType)}</span>
        <span class="tag">${escapeHtml(exp.testType)}</span>
        <span class="tag">${escapeHtml(exp.device)}</span>
      </div>
      <h1 class="exp-detail-title">${escapeHtml(exp.name)}</h1>
      <div class="exp-result-hero">
        <span class="num">${escapeHtml(exp.result)}</span>
        <span class="kpi">${escapeHtml(exp.resultLabel)}</span>
        ${statusChip(exp.status)}
      </div>
      <p class="exp-decision"><strong>Decision:</strong> ${escapeHtml(exp.decision)}</p>
    </header>

    <div class="exp-detail-body">
      <div class="exp-main-col">

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
          <div class="exp-hypothesis-box"><p>${escapeHtml(exp.hypothesis)}</p></div>
        </section>

        <section class="exp-sec">
          <h3>Test Setup</h3>
          <div class="exp-compare">
            <div class="col"><div class="lbl">Control</div><p>${escapeHtml(setup.control)}</p></div>
            <div class="col"><div class="lbl">Variation</div><p>${escapeHtml(setup.variation)}</p></div>
          </div>
          <div class="exp-meta-grid">
            <div class="exp-meta-row"><div class="k">Traffic</div><div class="v">${escapeHtml(setup.traffic)}</div></div>
            <div class="exp-meta-row"><div class="k">Audience</div><div class="v">${escapeHtml(setup.audience)}</div></div>
            <div class="exp-meta-row"><div class="k">Device</div><div class="v">${escapeHtml(setup.device)}</div></div>
            <div class="exp-meta-row"><div class="k">Duration</div><div class="v">${escapeHtml(setup.duration)}</div></div>
            <div class="exp-meta-row"><div class="k">Primary metric</div><div class="v">${escapeHtml(setup.primaryMetric)}</div></div>
            <div class="exp-meta-row"><div class="k">Secondary metrics</div><div class="v">${escapeHtml(setup.secondaryMetrics)}</div></div>
            <div class="exp-meta-row"><div class="k">Confidence</div><div class="v">${escapeHtml(setup.confidence)}</div></div>
          </div>
        </section>

        <section class="exp-sec">
          <h3>Results</h3>
          <div class="exp-results-primary">
            <div class="big">${escapeHtml(exp.result)}</div>
            <div class="kpi">${escapeHtml(exp.resultLabel)}</div>
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
        <div class="block"><h4>Brand</h4><p>${escapeHtml(exp.brand)}</p></div>
        <div class="block"><h4>Page type</h4><p>${escapeHtml(exp.pageType)}</p></div>
        <div class="block"><h4>Test type</h4><p>${escapeHtml(exp.testType)}</p></div>
        <div class="block"><h4>Primary KPI</h4><p>${escapeHtml(exp.primaryKPI)}</p></div>
        <div class="block"><h4>Status</h4><p>${STATUS_LABELS[exp.status]}</p></div>
      </aside>
    </div>
  `;
}

/* ---------- Hamburger (mirrors script.js so these pages work standalone) ---------- */

function initExpHamburger() {
  const btn = document.querySelector(".hamburger");
  const navLinks = document.querySelector(".nav-links");
  if (!btn || !navLinks) return;
  btn.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");
    btn.setAttribute("aria-expanded", isOpen);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initExpHamburger();
  renderExpStats();
  renderExpList();
  renderExpDetail();
});
