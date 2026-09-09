/* Read-only, data-driven technical-dimensions catalogue for the Mech site. */
(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
  const safeURL = value => {
    try {
      const url = new URL(value);
      return ['https:', 'http:'].includes(url.protocol) ? url.href : '#';
    } catch {
      return '#';
    }
  };

  /* Lucide icons, matching the line-icon family used by the site footer. */
  const icons = {
    'rotate-cw': '<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/>',
    'mouse-pointer-click': '<path d="M14 4.1 12 6"/><path d="m5.1 8-2.9-.8"/><path d="m6 12-1.9 2"/><path d="M7.2 2.2 8 5.1"/><path d="M9.037 9.69a.498.498 0 0 1 .653-.653l11 4.5a.5.5 0 0 1-.074.949l-4.349 1.041a1 1 0 0 0-.74.739l-1.04 4.35a.5.5 0 0 1-.95.074z"/>',
    blocks: '<path d="M10 22V7a1 1 0 0 0-1-1H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5a1 1 0 0 0-1-1H2"/><rect x="14" y="2" width="8" height="8" rx="1"/>',
    'code-xml': '<path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/>',
    layers: '<path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"/><path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17"/>',
    'monitor-smartphone': '<path d="M18 8V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h8"/><path d="M10 19v-3.96 3.15"/><path d="M7 19h5"/><rect width="6" height="10" x="16" y="12" rx="2"/>',
    network: '<rect x="16" y="16" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><rect x="9" y="2" width="6" height="6" rx="1"/><path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"/><path d="M12 12V8"/>',
    equal: '<path d="M5 9h14M5 15h14"/>',
    'badge-check': '<path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/><path d="m16 9-5.5 5.5L8 12"/>',
    shapes: '<path d="M8.3 10a.7.7 0 0 1-.626-1.079L11.4 3a.7.7 0 0 1 1.198-.043L16.3 8.9a.7.7 0 0 1-.572 1.1Z"/><rect x="3" y="14" width="7" height="7" rx="1"/><circle cx="17.5" cy="17.5" r="3.5"/>',
    'mop-sparkles': '<path d="M10 22a3 3 0 0 1-3-3"/><path d="M10 22c2.761 0 5-1.79 5-4-4.42 0-4.08-5-8.5-5a4.501 4.501 0 0 0 0 9z"/><path d="M10 3H8"/><path d="M12.5 11.5 22 2"/><path d="M20 13v4"/><path d="M22 15h-4"/><path d="M4 5v4"/><path d="M6 7H2"/><path d="m6.98 13.02 2.665-2.664a1.21 1.21 0 0 1 1.71 0l2.29 2.288a1.21 1.21 0 0 1 0 1.712l-2.088 2.087"/><path d="M9 2v2"/>',
    copy: '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    'clock-3': '<circle cx="12" cy="12" r="10"/><path d="M12 6v6h4"/>',
    'external-link': '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    recycle: '<path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5M11 19h8.203a1.83 1.83 0 0 0 1.556-.89 1.784 1.784 0 0 0 0-1.775l-1.226-2.12m-5.533 1.785-3 3 3 3M8.293 13.596 7.196 9.5 3.1 10.598m6.244-4.787 1.093-1.892A1.83 1.83 0 0 1 11.985 3a1.784 1.784 0 0 1 1.546.888l3.943 6.843m-4.096-1.098 4.096 1.098 1.097-4.096"/>',
    package: '<path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/><path d="M12 22V12"/><polyline points="3.29 7 12 12 20.71 7"/><path d="m7.5 4.27 9 5.15"/>',
    bot: '<path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2M20 14h2M15 13v2M9 13v2"/>',
    'scan-search': '<path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><circle cx="12" cy="12" r="3"/><path d="m16 16-1.9-1.9"/>',
    radar: '<path d="M19.07 4.93A10 10 0 0 0 6.99 3.34"/><path d="M4 6h.01"/><path d="M2.29 9.62A10 10 0 1 0 21.31 8.35"/><path d="M16.24 7.76A6 6 0 1 0 8.23 16.67"/><path d="M12 18h.01"/><path d="M17.99 11.66A6 6 0 0 1 15.77 16.67"/><circle cx="12" cy="12" r="2"/><path d="m13.41 10.59 5.66-5.66"/>',
    'graduation-cap': '<path d="M21.42 10.92a1 1 0 0 0-.02-1.84l-8.57-3.9a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0z"/><path d="M22 10v6M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>',
    micromika: 'micromika',
    siren: '<path d="M7 18v-6a5 5 0 1 1 10 0v6"/><path d="M5 21a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-1a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2z"/><path d="M21 12h1"/><path d="M18.5 4.5 18 5"/><path d="M2 12h1"/><path d="M12 2v1"/><path d="m4.929 4.929.707.707"/><path d="M12 12v6"/>',
    'book-open': '<path d="M12 5v16M20.001 19A2 2 0 0 0 22 17V5a2 2 0 0 0-1.999-2L16 3.002A5 5 0 0 0 12 5a5 5 0 0 0-4-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 1.999 2H8a5 5 0 0 1 4 2 5 5 0 0 1 4-2z"/>',
    'messages-square': '<path d="M16 10a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 14.286V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/><path d="M20 9a2 2 0 0 1 2 2v10.286a.71.71 0 0 1-1.212.502l-2.202-2.202A2 2 0 0 0 17.172 19H10a2 2 0 0 1-2-2v-1"/>'
  };

  let data;
  let benchmarkData;
  let mechContent;
  let formattedExamples;
  let state;
  let systems;
  let dimensions;
  let clusters;
  const comparisonMode = document.documentElement.dataset.exploreMode === 'comparison';

  const defaultSelection = () => data.defaults.systems.filter(id => systems.has(id));
  const selectedSystems = () => state.systems.map(id => systems.get(id)).filter(Boolean);

  function iconSVG(name) {
    if (name === 'micromika') return '<span class="ex-micromika" aria-hidden="true">╭⦿╮</span>';
    const paths = icons[name] || icons.boxes;
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
  }

  function externalLinkIcon() {
    return `<svg class="ex-external-link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons['external-link']}</svg>`;
  }

  function dimensionColor(dimension) {
    return /^--mech-[a-z0-9-]+$/.test(dimension.color || '') ? `var(${dimension.color})` : 'var(--mech-brand)';
  }

  function systemColor(system) {
    return /^--mech-[a-z0-9-]+$/.test(system?.color || '') ? `var(${system.color})` : 'var(--mech-brand)';
  }

  function parseState() {
    const params = new URLSearchParams(location.hash.slice(1));
    const chosen = comparisonMode && params.has('systems')
      ? params.get('systems').split(',').filter(id => systems.has(id))
      : comparisonMode ? defaultSelection() : ['mech'];
    const requestedDimension = params.get('dimension');
    const dimension = dimensions.has(requestedDimension)
      ? requestedDimension
      : (comparisonMode ? null : data.dimensions[0].id);
    return {
      systems: Array.from(new Set(chosen)),
      dimension
    };
  }

  function hashFor(next) {
    const params = new URLSearchParams();
    if (comparisonMode) params.set('systems', next.systems.join(','));
    if (next.dimension) params.set('dimension', next.dimension);
    return '#' + params.toString().replaceAll('%2C', ',');
  }

  function go(patch, {replace = false} = {}) {
    state = {...state, ...patch};
    history[replace ? 'replaceState' : 'pushState'](null, '', hashFor(state));
    render();
  }

  function sourceLinks(ids) {
    const entries = (ids || []).map(id => data.sources[id]).filter(Boolean);
    if (!entries.length) return '';
    return `<ul class="ex-source-links" aria-label="Sources">${entries.map(source =>
      `<li><a href="${escapeHTML(safeURL(source.url))}" target="_blank" rel="noopener noreferrer">${escapeHTML(source.title)}${externalLinkIcon()}</a></li>`
    ).join('')}</ul>`;
  }

  function profileScope(system) {
    return `<details class="ex-profile-scope"><summary>Scope</summary><p>${escapeHTML(system.scope)}</p><p><em>Not included:</em> ${escapeHTML(system.excluded)}</p></details>`;
  }

  function assessment(systemId, dimensionId) {
    return data.assessments[systemId]?.[dimensionId] || null;
  }

  function renderSystems() {
    $('#ex-system-options').innerHTML = data.systems.map(system => {
      const selected = state.systems.includes(system.id);
      return `<button class="ex-system-toggle" type="button" data-system="${escapeHTML(system.id)}" aria-pressed="${selected}" aria-label="${escapeHTML(system.name)}"><span class="ex-toggle-check" aria-hidden="true">${selected ? '✓' : ''}</span><span>${escapeHTML(system.name)}</span></button>`;
    }).join('');
    const count = state.systems.length;
    $('#ex-selection-count').textContent = `${count} ${count === 1 ? 'language' : 'languages'} selected`;
  }

  function assessmentCard(system, dimension) {
    const entry = assessment(system.id, dimension.id);
    if (!entry) {
      return `<article class="ex-assessment-card" data-system="${escapeHTML(system.id)}"><h3>${escapeHTML(system.name)}</h3><strong class="ex-assessment-label">Not yet assessed</strong><p class="ex-assessment-summary">No entry has been written for this dimension.</p>${profileScope(system)}</article>`;
    }
    return `<article class="ex-assessment-card" data-system="${escapeHTML(system.id)}"><h3>${escapeHTML(system.name)}</h3><strong class="ex-assessment-label">${escapeHTML(entry.label)}</strong><p class="ex-assessment-summary">${escapeHTML(entry.summary)}</p><details><summary>Tradeoff and sources</summary><p>${escapeHTML(entry.tradeoff)}</p>${sourceLinks(entry.sources)}</details>${profileScope(system)}</article>`;
  }

  function mechNotes(dimension) {
    const note = dimension.mechTreatment;
    if (!note || !state.systems.includes('mech')) return '';
    return `<details class="ex-mech-notes"><summary>Mech design notes</summary><div class="ex-mech-notes-grid"><div><h4>Current direction</h4><p>${escapeHTML(note.position)}</p></div><div><h4>Documented basis</h4><p>${escapeHTML(note.evidence)}</p></div><div><h4>Proposed work</h4><p>${escapeHTML(note.proposal)}</p></div><div><h4>Tradeoff</h4><p>${escapeHTML(note.tension)}</p></div></div>${sourceLinks(note.refs)}</details>`;
  }

  function dimensionButton(dimension) {
    const active = state.dimension === dimension.id;
    const cluster = clusters.get(dimension.cluster);
    const comparisonLabel = comparisonMode ? `<span class="ex-dimension-number">${escapeHTML(dimension.number)} · ${escapeHTML(cluster.title)}</span>` : '';
    return `<button class="ex-dimension-card${active ? ' is-active' : ''}" type="button" role="tab" data-dimension="${escapeHTML(dimension.id)}" aria-selected="${active}" aria-controls="ex-detail-${escapeHTML(dimension.id)}" style="--dimension-accent:${dimensionColor(dimension)}"><span class="ex-dimension-icon">${iconSVG(dimension.icon)}</span><span class="ex-dimension-title">${comparisonLabel}${escapeHTML(dimension.title)}</span></button>`;
  }

  function comparisonDetail(dimension) {
    const cards = selectedSystems().map(system => assessmentCard(system, dimension)).join('');
    const comparisons = cards || '<div class="ex-empty"><h3>No languages selected</h3><p>Select at least one language above to compare this dimension.</p><button type="button" data-reset>Restore the starting selection</button></div>';
    const content = mechContent.dimensions[dimension.id];
    return `<article class="ex-dimension-detail" id="ex-detail-${escapeHTML(dimension.id)}" style="--dimension-accent:${dimensionColor(dimension)}"><header class="ex-detail-heading"><span class="ex-dimension-icon">${iconSVG(dimension.icon)}</span><div><span class="ex-dimension-number">${escapeHTML(dimension.number)}</span><h3>${escapeHTML(dimension.title)}</h3></div></header>${dimensionQuestion(dimension)}<p class="ex-dimension-definition">${escapeHTML(content.description)}</p><div class="ex-assessment-grid">${comparisons}</div>${mechNotes(dimension)}</article>`;
  }

  function technicalDimensionsURL(dimension) {
    const routes = {
      feedback: 'interaction,feedback-loops',
      modes: 'interaction,modes-of-interaction',
      abstraction: 'interaction,abstraction-construction',
      'notational-structure': 'notation,notational-structure',
      surface: 'notation,surface-internal-notation',
      primary: 'notation,primary-secondary-notations',
      geography: 'notation,expression-geography',
      uniformity: 'notation,uniformity-of-notations',
      integrity: 'conceptual-structure,integrity-openness',
      composability: 'conceptual-structure,composability',
      convenience: 'conceptual-structure,convenience',
      commonality: 'conceptual-structure,commonality',
      staging: 'customizability,staging',
      addressing: 'customizability,addressing',
      'self-sustainability': 'customizability,self-sustainability',
      factoring: 'complexity,factoring',
      automation: 'complexity,automation',
      detection: 'errors,error-detection',
      response: 'errors,error-response',
      learnability: 'adoptability,learnability',
      sociability: 'adoptability,sociability'
    };
    const route = routes[dimension.id];
    return `https://tomasp.net/techdims/#top=dimensions/${route};footer=index,navigation`;
  }

  function dimensionQuestion(dimension) {
    return `<blockquote class="ex-dimension-question">“${escapeHTML(dimension.question)}”</blockquote>`;
  }

  function mechDetail(dimension) {
    const content = mechContent.dimensions[dimension.id];
    const codeLabel = `ex-code-${dimension.id}`;
    const formattedCode = formattedExamples.examples[dimension.id];
    return `<article class="ex-dimension-detail ex-mech-detail" role="tabpanel" id="ex-detail-${escapeHTML(dimension.id)}" style="--dimension-accent:${dimensionColor(dimension)}"><header class="ex-detail-heading"><span class="ex-dimension-icon">${iconSVG(dimension.icon)}</span><h3>${escapeHTML(dimension.title)}</h3><details class="ex-dimension-help"><summary aria-label="About this technical dimension">?</summary><div class="ex-dimension-help-popover"><p>${escapeHTML(content.description)}</p><a href="${escapeHTML(technicalDimensionsURL(dimension))}" target="_blank" rel="noopener noreferrer">Read this dimension in the catalogue${externalLinkIcon()}</a></div></details></header>${dimensionQuestion(dimension)}<div class="ex-mech-detail-flow"><aside class="mech-fenced-mech-block no-output ex-code-example" aria-labelledby="${escapeHTML(codeLabel)}"><div class="mech-code-block-namespace" id="${escapeHTML(codeLabel)}">${escapeHTML(content.example.title)}</div>${formattedCode}</aside><div class="ex-mech-explanation"><p>${escapeHTML(content.mech)}</p></div></div></article>`;
  }

  function dimensionDetail(dimension) {
    return comparisonMode ? comparisonDetail(dimension) : mechDetail(dimension);
  }

  function renderDimensions() {
    const groups = data.clusters.map(cluster => {
      const members = data.dimensions.filter(dimension => dimension.cluster === cluster.id);
      if (!members.length) return '';
      const color = dimensionColor(members[0]);
      const active = members.find(dimension => dimension.id === state.dimension);
      const description = comparisonMode ? '' : `<p class="ex-group-description">${escapeHTML(mechContent.groups[cluster.id])}</p>`;
      return `<section class="ex-dimension-group" id="${escapeHTML(cluster.id)}" aria-labelledby="ex-group-${escapeHTML(cluster.id)}" style="--group-accent:${color}"><div class="ex-group-heading"><span class="ex-group-number">Section ${Number(cluster.number)}</span><h2 class="section-heading" id="ex-group-${escapeHTML(cluster.id)}">${escapeHTML(cluster.title)}</h2></div>${description}<div class="ex-dimension-workspace"><div class="ex-dimension-list" role="tablist" aria-label="${escapeHTML(cluster.title)} dimensions" style="--dimension-count:${members.length}">${members.map(dimensionButton).join('')}</div>${active ? dimensionDetail(active) : ''}</div></section>`;
    }).join('');
    $('#ex-view').innerHTML = groups;
  }

  function formatBenchmark(value) {
    if (value === null || value === undefined) return 'Not measured';
    const number = Number(value);
    const digits = Math.abs(number) > 0 && Math.abs(number) < 0.1 ? 2 : 1;
    return number.toLocaleString('en-US', {minimumFractionDigits: digits, maximumFractionDigits: digits});
  }

  function formatBenchmarkTick(value) {
    return Number(value).toLocaleString('en-US', {maximumFractionDigits: Number(value) < 1 ? 2 : 0});
  }

  function benchmarkPosition(value, scale) {
    const minimum = Number(scale.minimum);
    const offset = Number(scale.offset);
    const maximum = Math.log10(1 + ((Number(scale.maximum) - minimum) / offset));
    const position = Math.log10(1 + ((Math.max(minimum, Number(value)) - minimum) / offset));
    return Math.max(0, Math.min(100, (position / maximum) * 100));
  }

  function benchmarkAxis(scale) {
    const ticks = scale.ticks.map((tick, index) => `<i class="ex-benchmark-tick${index === 0 ? ' is-first' : ''}${index === scale.ticks.length - 1 ? ' is-last' : ''}" style="--tick-position:${benchmarkPosition(tick, scale).toFixed(3)}%">${formatBenchmarkTick(tick)}</i>`).join('');
    return `<div class="ex-benchmark-axis" aria-hidden="true"><span></span><span class="ex-benchmark-axis-scale">${ticks}</span></div>`;
  }

  function benchmarkSeries(row, measure, scale, unit) {
    const value = row[measure];
    if (value === null || value === undefined) return '';
    const system = systems.get(row.system);
    const width = Math.max(0.6, benchmarkPosition(value, scale));
    const label = measure[0].toUpperCase() + measure.slice(1);
    return `<div class="ex-benchmark-series"><span class="ex-benchmark-measure">${label}</span><div class="ex-benchmark-track" style="--bar-width:${width.toFixed(3)}%;--bar-color:${systemColor(system)}"><span class="ex-benchmark-bar" data-device="${escapeHTML(row.device)}" data-measure="${escapeHTML(measure)}"></span></div><span class="ex-benchmark-value">${formatBenchmark(value)}</span><span class="ex-sr-only">${escapeHTML(system?.name || row.system)}, ${escapeHTML(row.label)}, ${label.toLocaleLowerCase()}, ${formatBenchmark(value)} ${escapeHTML(unit)}, ${escapeHTML(row.device.toUpperCase())}</span></div>`;
  }

  function benchmarkRow(row, scale, unit) {
    const system = systems.get(row.system);
    const series = ['checked', 'unchecked'].map(measure => benchmarkSeries(row, measure, scale, unit)).join('');
    return `<article class="ex-benchmark-row" style="--system-color:${systemColor(system)}"><div class="ex-benchmark-row-heading"><span class="ex-benchmark-language"><span aria-hidden="true"></span>${escapeHTML(system?.name || row.system)}</span><a href="${escapeHTML(safeURL(row.evidence))}" target="_blank" rel="noopener noreferrer">${escapeHTML(row.label)}${externalLinkIcon()}</a><span class="ex-benchmark-device" data-device="${escapeHTML(row.device)}">${escapeHTML(row.device.toUpperCase())}</span></div><div class="ex-benchmark-series-list">${series}</div></article>`;
  }

  function renderBenchmarks() {
    const selected = new Set(comparisonMode ? state.systems : ['mech']);
    const scale = benchmarkData.scale;
    const suites = benchmarkData.suites.map(suite => {
      const rows = suite.rows.filter(row => selected.has(row.system));
      return {
        ...suite,
        rows
      };
    }).filter(suite => suite.rows.length);
    const section = $('#benchmarks');
    section.hidden = suites.length === 0;
    if (!suites.length) {
      $('#ex-benchmark-content').innerHTML = '';
      return;
    }
    const introduction = benchmarkData.introduction.map(paragraph => `<p>${escapeHTML(paragraph)}</p>`).join('');
    $('#ex-benchmark-content').innerHTML = `<div class="ex-benchmark-introduction">${introduction}</div><div class="ex-benchmark-key" aria-label="Benchmark color and pattern key"><span><i class="ex-measure-swatch" data-measure="checked" aria-hidden="true"></i>Checked</span><span><i class="ex-measure-swatch" data-measure="unchecked" aria-hidden="true"></i>Unchecked</span><span><i class="ex-device-swatch" data-device="cpu" aria-hidden="true"></i>CPU</span><span><i class="ex-device-swatch" data-device="gpu" aria-hidden="true"></i>GPU</span></div>${suites.map(suite => `<article class="ex-benchmark-suite"><h3>${escapeHTML(suite.title)}</h3><p class="ex-benchmark-note">${escapeHTML(comparisonMode && suite.comparisonNote ? suite.comparisonNote : suite.note)}</p><div class="ex-benchmark-chart" role="region" aria-label="${escapeHTML(suite.title)} bar chart">${benchmarkAxis(scale)}${suite.rows.map(row => benchmarkRow(row, scale, suite.unit)).join('')}</div></article>`).join('')}<aside class="ex-benchmark-methodology" aria-label="Benchmark methodology"><p><strong>Methodology.</strong> ${escapeHTML(benchmarkData.methodology)} <span>Results indexed ${escapeHTML(benchmarkData.reviewedAt)}.</span></p></aside>`;
  }

  function render() {
    const activeSystem = document.activeElement?.dataset?.system;
    const activeDimensionButton = document.activeElement?.dataset?.dimension;
    $('.landing-title').textContent = comparisonMode ? 'Comparison' : 'Explore';
    const intro = $('#ex-intro');
    if (comparisonMode) {
      intro.textContent = 'Technical dimensions describe programming systems along specific axes, with each axis spanning a range of design choices and trade-offs. This page compares how selected languages approach those dimensions.';
    } else {
      intro.innerHTML = `Mech is a programming system as well as a programming language. Its design includes the language’s type system and memory model, together with the ways programs are written, run, inspected, adapted, and shared. The technical dimensions framework<span class="ex-citation"><a class="ex-citation-link" href="#technical-dimensions-citation" data-citation-toggle aria-controls="technical-dimensions-citation" aria-expanded="false" aria-label="View citation 1">[1]</a><span class="ex-citation-popover" id="technical-dimensions-citation" role="note" hidden>J. Jakubovic, J. Edwards, and T. Petricek, “Technical Dimensions of Programming Systems,” <cite>The Art, Science, and Engineering of Programming</cite>, vol. 7, no. 3, pp. 13:1–13:59, Feb. 2023, doi: 10.22152/programming-journal.org/2023/7/13. <a href="https://doi.org/10.22152/programming-journal.org/2023/7/13" target="_blank" rel="noopener noreferrer">View paper${externalLinkIcon()}</a></span></span> provides a taxonomy for describing and comparing programming systems across this broader range of concerns. This page applies the framework to Mech through descriptions and working examples.`;
    }
    $('#ex-contribute-copy').textContent = comparisonMode
      ? 'Add a language, propose a dimension, or correct an entry by opening a pull request.'
      : 'Correct a Mech entry, propose a dimension, or add evidence by opening a pull request.';
    const editLink = $('#ex-edit-link');
    editLink.href = comparisonMode
      ? 'https://github.com/mech-web/website/edit/main/public/explore/data/dimensions.json'
      : 'https://github.com/mech-web/website/edit/main/public/explore/data/mech-content.json';
    editLink.firstChild.textContent = comparisonMode ? 'Edit the comparison ' : 'Edit the Mech descriptions ';
    $('#ex-system-selection').hidden = !comparisonMode;
    if (comparisonMode) renderSystems();
    renderDimensions();
    renderBenchmarks();
    const activeDimension = state.dimension ? dimensions.get(state.dimension) : null;
    document.title = `${activeDimension ? activeDimension.title + ' · ' : ''}${comparisonMode ? 'Comparison' : 'Explore'} · Mech`;
    if (activeSystem) $(`.ex-system-toggle[data-system="${activeSystem}"]`)?.focus({preventScroll: true});
    if (activeDimensionButton) $(`.ex-dimension-card[data-dimension="${activeDimensionButton}"]`)?.focus({preventScroll: true});
  }

  function bind() {
    document.addEventListener('click', event => {
      const openHelp = $('.ex-dimension-help[open]');
      if (openHelp && !openHelp.contains(event.target)) openHelp.removeAttribute('open');

      const openCitation = $('.ex-citation-link[aria-expanded="true"]');
      if (openCitation && !openCitation.closest('.ex-citation').contains(event.target)) {
        openCitation.setAttribute('aria-expanded', 'false');
        $(`#${openCitation.getAttribute('aria-controls')}`).hidden = true;
      }

      const target = event.target.closest('button, a, summary');
      if (!target) return;
      if (target.tagName === 'A' && (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)) return;

      if (target.matches('[data-citation-toggle]')) {
        event.preventDefault();
        const popover = $(`#${target.getAttribute('aria-controls')}`);
        const willOpen = target.getAttribute('aria-expanded') !== 'true';
        target.setAttribute('aria-expanded', String(willOpen));
        popover.hidden = !willOpen;
      } else if (comparisonMode && target.matches('.ex-system-toggle')) {
        const id = target.dataset.system;
        const next = state.systems.includes(id)
          ? state.systems.filter(systemId => systemId !== id)
          : [...state.systems, id];
        go({systems: next});
      } else if (target.hasAttribute('data-select-all')) {
        go({systems: data.systems.map(system => system.id)});
      } else if (target.hasAttribute('data-reset')) {
        go({systems: defaultSelection(), dimension: null});
      } else if (target.matches('summary[data-dimension]')) {
        event.preventDefault();
      } else if (target.hasAttribute('data-dimension')) {
        const id = target.dataset.dimension;
        go({dimension: state.dimension === id ? null : id});
      } else if (target.matches('.top-nav a.active') && location.protocol === 'file:') {
        event.preventDefault();
        go({systems: defaultSelection(), dimension: null});
        window.scrollTo(0, 0);
      }
    });

    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return;
      const openCitation = $('.ex-citation-link[aria-expanded="true"]');
      if (!openCitation) return;
      openCitation.setAttribute('aria-expanded', 'false');
      $(`#${openCitation.getAttribute('aria-controls')}`).hidden = true;
      openCitation.focus();
    });
    window.addEventListener('popstate', () => { state = parseState(); render(); });
    window.addEventListener('hashchange', () => { state = parseState(); render(); });
  }

  function validateDimensions(candidate) {
    if (!candidate || candidate.schemaVersion !== 2 || !Array.isArray(candidate.systems) || !Array.isArray(candidate.dimensions) || !Array.isArray(candidate.clusters) || !candidate.assessments || !candidate.sources) {
      throw new Error('Unsupported or incomplete dimensions data.');
    }
    for (const collection of [candidate.systems, candidate.dimensions, candidate.clusters]) {
      if (new Set(collection.map(item => item.id)).size !== collection.length) throw new Error('Duplicate identifiers in dimensions data.');
    }
    for (const system of candidate.systems) {
      if (!/^--mech-[a-z0-9-]+$/.test(system.color || '')) throw new Error(`Missing palette color for ${system.id}.`);
    }
    for (const dimension of candidate.dimensions) {
      if (!icons[dimension.icon] || !/^--mech-[a-z0-9-]+$/.test(dimension.color || '')) throw new Error(`Missing icon or palette color for ${dimension.id}.`);
    }
    return candidate;
  }

  function validateBenchmarks(candidate) {
    if (!candidate || candidate.schemaVersion !== 1 || !Array.isArray(candidate.introduction) || !candidate.introduction.length || !Array.isArray(candidate.suites)) throw new Error('Unsupported benchmarks data.');
    for (const suite of candidate.suites) {
      if (!Array.isArray(suite.rows)) throw new Error('Invalid benchmark suite.');
      for (const row of suite.rows) {
        if (!row.system || !row.label || !['cpu', 'gpu'].includes(row.device) || safeURL(row.evidence) === '#') throw new Error('Invalid benchmark row.');
      }
    }
    return candidate;
  }

  async function loadJSON(id, path) {
    const inline = document.getElementById(id);
    if (inline) return JSON.parse(inline.textContent);
    const response = await fetch(new URL(path, document.baseURI), {cache: 'no-cache'});
    if (!response.ok) throw new Error(`Data request failed (${response.status}).`);
    return response.json();
  }

  async function start() {
    try {
      const [dimensionResponse, benchmarkResponse, mechContentResponse, formattedExamplesResponse] = await Promise.all([
        loadJSON('explore-data', 'data/dimensions.json'),
        loadJSON('benchmark-data', 'data/benchmarks.json'),
        loadJSON('mech-content-data', 'data/mech-content.json'),
        loadJSON('formatted-examples-data', 'data/formatted-examples.json')
      ]);
      data = validateDimensions(dimensionResponse);
      benchmarkData = validateBenchmarks(benchmarkResponse);
      mechContent = mechContentResponse;
      formattedExamples = formattedExamplesResponse;
      if (!mechContent || mechContent.schemaVersion !== 1 || !mechContent.groups || !mechContent.dimensions) throw new Error('Unsupported Mech content data.');
      if (!formattedExamples || formattedExamples.schemaVersion !== 1 || !formattedExamples.examples || data.dimensions.some(dimension => !formattedExamples.examples[dimension.id]?.includes('mech-code-block'))) throw new Error('Missing Mech-formatted examples.');
      systems = new Map(data.systems.map(system => [system.id, system]));
      dimensions = new Map(data.dimensions.map(dimension => [dimension.id, dimension]));
      clusters = new Map(data.clusters.map(cluster => [cluster.id, cluster]));
      state = parseState();
      bind();
      render();
      document.documentElement.dataset.exploreReady = 'true';
    } catch (error) {
      $('#ex-view').innerHTML = `<div class="ex-empty"><h2 class="section-heading">Explore could not load</h2><p>${escapeHTML(error.message)}</p><p>Serve this directory over HTTP, or open the standalone preview file.</p></div>`;
      document.documentElement.dataset.exploreReady = 'error';
    }
  }

  start();
})();
