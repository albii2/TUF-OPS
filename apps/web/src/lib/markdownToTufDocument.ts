/**
 * Markdown → TUF PDF-Style HTML converter
 *
 * Takes .md content + optional frontmatter and outputs HTML that exactly
 * matches the design system from the TUF Territory Account Executive
 * Launch Packet PDF:
 *
 *   - White page background
 *   - Barlow Condensed for headlines, Inter/sans-serif for body
 *   - ALL-CAPS section labels with letter-spacing on dark (#0a0a0a) bands
 *   - Clean bordered tables with dark headers and alternating rows
 *   - 52px margins, ~508px content width
 *   - Metadata footer line
 */

export interface TufDocMeta {
  title?: string;
  subtitle?: string;
  confidential?: string;
  version?: string;
  date?: string;
}

function parseFrontmatter(md: string): { meta: TufDocMeta; body: string } {
  const fmMatch = md.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  if (!fmMatch) return { meta: {}, body: md };

  const raw = fmMatch[1];
  const meta: TufDocMeta = {};
  for (const line of raw.split('\n')) {
    const m = line.match(/^(\w[\w\s]*?):\s*(.*)/);
    if (m) {
      const key = m[1].trim().toLowerCase();
      const val = m[2].trim();
      if (key === 'title') meta.title = val;
      if (key === 'subtitle') meta.subtitle = val;
      if (key === 'confidential') meta.confidential = val;
      if (key === 'version') meta.version = val;
      if (key === 'date') meta.date = val;
    }
  }

  return { meta, body: md.slice(fmMatch[0].length) };
}

// ── inline markdown: bold, italic, code ──
function parseInline(text: string): string {
  let out = text
    // Bold **text** → <strong>
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic *text* → <em>
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

  return out;
}

function makeSectionLabel(label: string): string {
  return (
    `<div class="section-label-band">` +
    `<span class="section-label-text">${label.toUpperCase()}</span>` +
    `</div>`
  );
}

function parseTable(rows: string[][]): string {
  if (rows.length === 0) return '';
  const headerRow = rows[0];
  const dataRows = rows.slice(1);

  let html = '<table class="tuf-table">';

  // Header
  html += '<thead><tr>';
  for (const cell of headerRow) {
    html += `<th>${parseInline(cell.trim())}</th>`;
  }
  html += '</tr></thead>';

  // Body
  html += '<tbody>';
  for (const row of dataRows) {
    html += '<tr>';
    for (const cell of row) {
      html += `<td>${parseInline(cell.trim())}</td>`;
    }
    html += '</tr>';
  }
  html += '</tbody></table>';

  return html;
}

function parseList(lines: string[], isOrdered: boolean): string {
  const tag = isOrdered ? 'ol' : 'ul';
  let html = `<${tag} class="tuf-list">`;
  for (const line of lines) {
    const content = isOrdered
      ? line.replace(/^\d+\.\s*/, '')
      : line.replace(/^[-*]\s*/, '');
    html += `<li>${parseInline(content)}</li>`;
  }
  html += `</${tag}>`;
  return html;
}

function parseCallout(text: string): string {
  return (
    `<div class="callout-box">` +
    `<p class="callout-text">${parseInline(text)}</p>` +
    `</div>`
  );
}

function blockToHtml(block: string): string {
  const lines = block.split('\n');
  const firstLine = lines[0];
  const rest = lines.slice(1);

  // ── Headers ──
  const h1Match = firstLine.match(/^# (.+)$/);
  if (h1Match) return `<h1 class="doc-h1">${parseInline(h1Match[1])}</h1>`;

  const h2Match = firstLine.match(/^## (.+)$/);
  if (h2Match) {
    const label = h2Match[1].toUpperCase();
    return makeSectionLabel(label);
  }

  const h3Match = firstLine.match(/^### (.+)$/);
  if (h3Match) return `<h3 class="doc-h3">${parseInline(h3Match[1])}</h3>`;

  const h4Match = firstLine.match(/^#### (.+)$/);
  if (h4Match) return `<h4 class="doc-h4">${parseInline(h4Match[1])}</h4>`;

  // ── Horizontal rule ──
  if (firstLine.match(/^---$/)) return '<hr class="tuf-hr">';

  // ── Callout (> text) ──
  if (firstLine.startsWith('> ')) {
    return parseCallout(firstLine.slice(2));
  }

  // ── Table detection ──
  if (firstLine.startsWith('|') && lines.length >= 2 && lines[1].startsWith('|')) {
    const tableRows: string[][] = [];
    for (const line of lines) {
      if (!line.startsWith('|')) break;
      // Skip separator row
      if (/^\|[\s\-:]+\|$/.test(line)) continue;
      const cells = line
        .split('|')
        .map((c) => c.trim())
        .filter((c) => c !== '');
      if (cells.length > 0) tableRows.push(cells);
    }
    if (tableRows.length > 0) return parseTable(tableRows);
  }

  // ── Unordered list ──
  if (firstLine.match(/^[-*] /)) {
    return parseList(lines, false);
  }

  // ── Ordered list ──
  if (firstLine.match(/^\d+\. /)) {
    return parseList(lines, true);
  }

  // ── Paragraph ──
  const paraText = lines.map((l) => parseInline(l)).join(' ');
  return `<p class="doc-p">${paraText}</p>`;
}

function splitBlocks(md: string): string[] {
  const blocks: string[] = [];
  let current: string[] = [];
  let inTable = false;
  let inList = false;
  let inCallout = false;

  const lines = md.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const nextLine = lines[i + 1] || '';

    // Callout
    if (line.startsWith('> ')) {
      if (current.length > 0) { blocks.push(current.join('\n')); current = []; }
      current.push(line);
      continue;
    }

    // Table detection
    if (line.startsWith('|') && nextLine.startsWith('|')) {
      if (current.length > 0 && !inTable) { blocks.push(current.join('\n')); current = []; }
      inTable = true;
      current.push(line);
      continue;
    }
    if (inTable) {
      if (line.startsWith('|')) {
        current.push(line);
        continue;
      } else {
        blocks.push(current.join('\n'));
        current = [];
        inTable = false;
      }
    }

    // List detection
    const isListItem = /^[-*] /.test(line) || /^\d+\. /.test(line);
    if (isListItem) {
      if (current.length > 0 && !inList) { blocks.push(current.join('\n')); current = []; }
      inList = true;
      current.push(line);
      continue;
    }
    if (inList && line.trim() === '') {
      blocks.push(current.join('\n'));
      current = [];
      inList = false;
      continue;
    }
    if (inList) {
      current.push(line);
      continue;
    }

    // Blank line = paragraph break
    if (line.trim() === '') {
      if (current.length > 0) {
        blocks.push(current.join('\n'));
        current = [];
      }
      continue;
    }

    // Header or HR
    if (/^#{1,4} /.test(line) || line === '---') {
      if (current.length > 0) {
        blocks.push(current.join('\n'));
        current = [];
      }
      blocks.push(line);
      continue;
    }

    current.push(line);
  }

  if (inTable || inList) {
    blocks.push(current.join('\n'));
  } else if (current.length > 0) {
    blocks.push(current.join('\n'));
  }

  return blocks.filter((b) => b.trim() !== '');
}

export function convertMarkdownToTufHtml(markdown: string): string {
  const { meta, body } = parseFrontmatter(markdown);
  const blocks = splitBlocks(body);

  const title = meta.title || '';
  const subtitle = meta.subtitle || '';
  const confidential = meta.confidential || 'CONFIDENTIAL';
  const version = meta.version || '';
  const date = meta.date || '';

  // Build title/header section
  let titleHtml = '';
  if (title) {
    titleHtml += `<div class="doc-title-section">`;
    titleHtml += `<h1 class="doc-title">${title}</h1>`;
    if (subtitle) {
      titleHtml += `<p class="doc-subtitle">${subtitle}</p>`;
    }
    titleHtml += `</div>`;
  }

  // Body content
  const bodyHtml = blocks.map(blockToHtml).join('\n');

  // Metadata footer line
  const footerParts: string[] = [];
  if (confidential) footerParts.push(confidential.toUpperCase());
  if (version) footerParts.push(`VERSION ${version}`);
  if (date) footerParts.push(date);
  const footerText = footerParts.join('  ·  ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title || 'TUF Document'}</title>
  <style>
    /* ── Reset & Base ── */
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #ffffff;
      color: #000000;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, sans-serif;
      font-size: 8pt;
      line-height: 1.55;
      max-width: 612px;
      margin: 0 auto;
      padding: 0;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    /* ── Page container ── */
    .tuf-page {
      width: 612px;
      min-height: 792px;
      padding: 0 52px 60px 52px;
      position: relative;
    }

    /* ── Font imports: Barlow Condensed ── */
    @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;700;900&family=Inter:wght@400;600;700&display=swap');

    /* ── Title section ── */
    .doc-title-section {
      padding-top: 52px;
      margin-bottom: 28px;
    }
    .doc-title {
      font-family: 'Barlow Condensed', 'Arial Narrow', 'Impact', sans-serif;
      font-weight: 900;
      font-size: 20pt;
      color: #0a0a0a;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      line-height: 1.1;
    }
    .doc-subtitle {
      font-family: 'Barlow Condensed', 'Arial Narrow', sans-serif;
      font-weight: 700;
      font-size: 11pt;
      color: #555555;
      letter-spacing: 0.8px;
      margin-top: 4px;
      text-transform: uppercase;
    }

    /* ── H1 (page title equivalent) ── */
    .doc-h1 {
      font-family: 'Barlow Condensed', 'Arial Narrow', 'Impact', sans-serif;
      font-weight: 900;
      font-size: 20pt;
      color: #0a0a0a;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      margin: 40px 0 16px;
      line-height: 1.1;
    }

    /* ── Section labels (## → dark band with white text) ── */
    .section-label-band {
      background: #0a0a0a;
      padding: 8px 16px;
      margin: 32px 0 16px;
      display: inline-block;
    }
    .section-label-text {
      font-family: 'Barlow Condensed', 'Arial Narrow', sans-serif;
      font-weight: 700;
      font-size: 13pt;
      color: #ffffff;
      letter-spacing: 2px;
      text-transform: uppercase;
    }

    /* ── H3 subheading ── */
    .doc-h3 {
      font-family: 'Barlow Condensed', 'Arial Narrow', sans-serif;
      font-weight: 700;
      font-size: 13pt;
      color: #0a0a0a;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin: 24px 0 10px;
    }

    /* ── H4 ── */
    .doc-h4 {
      font-family: 'Barlow Condensed', 'Arial Narrow', sans-serif;
      font-weight: 700;
      font-size: 10pt;
      color: #1a1a1a;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      margin: 18px 0 8px;
    }

    /* ── Body paragraph ── */
    .doc-p {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 8pt;
      color: #000000;
      line-height: 1.6;
      margin-bottom: 10px;
      max-width: 508px;
    }
    .doc-p strong {
      font-weight: 700;
      color: #0a0a0a;
    }

    /* ── Lists ── */
    .tuf-list {
      margin: 8px 0 14px 22px;
      padding: 0;
      max-width: 486px;
    }
    .tuf-list li {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 7.5pt;
      color: #000000;
      line-height: 1.6;
      margin-bottom: 4px;
    }
    .tuf-list li strong {
      font-weight: 700;
      color: #0a0a0a;
    }

    /* ── Tables ── */
    .tuf-table {
      width: 508px;
      border-collapse: collapse;
      margin: 16px 0;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }
    .tuf-table thead th {
      background: #0a0a0a;
      color: #ffffff;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      font-weight: 700;
      font-size: 6pt;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      text-align: left;
      padding: 10px 12px;
      border: none;
    }
    .tuf-table tbody td {
      padding: 9px 12px;
      font-size: 7.5pt;
      color: #000000;
      border-bottom: 1px solid #d8d8d8;
      line-height: 1.4;
    }
    .tuf-table tbody tr:nth-child(even) td {
      background: #f5f5f5;
    }

    /* ── Horizontal rule ── */
    .tuf-hr {
      border: none;
      border-top: 1px solid #d8d8d8;
      margin: 24px 0;
      width: 508px;
    }

    /* ── Callout box ── */
    .callout-box {
      border: 1px solid #d8d8d8;
      padding: 14px 18px;
      margin: 16px 0;
      max-width: 508px;
      background: #fafafa;
    }
    .callout-text {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 8pt;
      color: #0a0a0a;
      font-style: italic;
      line-height: 1.6;
    }

    /* ── Inline code ── */
    .inline-code {
      font-family: 'SF Mono', 'Menlo', 'Consolas', monospace;
      font-size: 7pt;
      background: #f0f0f0;
      padding: 1px 5px;
      border-radius: 2px;
    }

    /* ── Metadata footer ── */
    .meta-footer {
      position: absolute;
      bottom: 28px;
      left: 52px;
      right: 52px;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 5.25pt;
      color: #8c8c8c;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      text-align: center;
      padding-top: 8px;
      border-top: 1px solid #d8d8d8;
    }

    /* ── Print styles ── */
    @media print {
      @page { size: letter; margin: 0; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="tuf-page">
    ${titleHtml}
    ${bodyHtml}
    <div class="meta-footer">${footerText}</div>
  </div>
</body>
</html>`;
}
