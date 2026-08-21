/**
 * Release notes rendering.
 *
 * GitHub release notes can arrive as HTML or as a plain/markdown string. This
 * module turns either form into safe, readable HTML so raw source never leaks
 * into the UI: HTML input is sanitized through a strict allow-list, and plain
 * text/markdown is escaped and formatted with a small safe subset.
 */

const ALLOWED_TAGS = new Set([
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "P",
  "BR",
  "HR",
  "B",
  "STRONG",
  "I",
  "EM",
  "U",
  "S",
  "UL",
  "OL",
  "LI",
  "A",
  "CODE",
  "PRE",
  "BLOCKQUOTE",
]);
const DROP_TAGS = new Set([
  "SCRIPT",
  "STYLE",
  "IFRAME",
  "IMG",
  "OBJECT",
  "EMBED",
  "LINK",
  "META",
  "FORM",
  "INPUT",
  "BUTTON",
]);

/** Sanitize HTML: keep only allow-listed tags and safe http(s)/mailto links. */
function sanitizeHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const nodes = Array.from(doc.body.querySelectorAll("*"));
  for (const el of nodes) {
    if (DROP_TAGS.has(el.tagName)) {
      el.remove();
      continue;
    }
    if (!ALLOWED_TAGS.has(el.tagName)) {
      // unwrap unknown inline tags (span/font/div…), keep their text
      el.replaceWith(...Array.from(el.childNodes));
      continue;
    }
    if (el.tagName === "A") {
      const href = el.getAttribute("href") || "";
      Array.from(el.attributes).forEach((a) => el.removeAttribute(a.name));
      if (/^(https?:|mailto:)/i.test(href)) {
        el.setAttribute("href", href);
        el.setAttribute("target", "_blank");
        el.setAttribute("rel", "noreferrer");
      }
    } else {
      Array.from(el.attributes).forEach((a) => el.removeAttribute(a.name));
    }
  }
  return doc.body.innerHTML;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Inline markdown transforms (operates on already-escaped text). */
function inline(text: string): string {
  let s = text.replace(/`([^`]+)`/g, "<code>$1</code>");
  s = s.replace(
    /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
    '<a href="$2" target="_blank" rel="noreferrer">$1</a>',
  );
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/__([^_]+)__/g, "<strong>$1</strong>");
  s = s.replace(/(^|[^*])\*([^*\s][^*]*)\*/g, "$1<em>$2</em>");
  return s;
}

/** Render escaped plain/markdown text as safe HTML. */
function renderMarkdown(md: string): string {
  const lines = escapeHtml(md).split(/\r?\n/);
  const out: string[] = [];
  let inUl = false;
  let inOl = false;
  let inPre = false;

  const closeLists = () => {
    if (inUl) {
      out.push("</ul>");
      inUl = false;
    }
    if (inOl) {
      out.push("</ol>");
      inOl = false;
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (/^```/.test(line)) {
      inPre = !inPre;
      out.push(inPre ? "<pre>" : "</pre>");
      continue;
    }
    if (inPre) {
      out.push(line);
      continue;
    }
    if (/^\s*$/.test(line)) {
      closeLists();
      out.push("");
      continue;
    }
    const h = /^(#{1,6})\s+(.+)$/.exec(line);
    if (h) {
      closeLists();
      out.push(`<h3>${inline(h[2])}</h3>`);
      continue;
    }
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line)) {
      closeLists();
      out.push("<hr/>");
      continue;
    }
    const ul = /^[-*+]\s+(.+)$/.exec(line);
    if (ul) {
      if (inOl) {
        out.push("</ol>");
        inOl = false;
      }
      if (!inUl) {
        out.push("<ul>");
        inUl = true;
      }
      out.push(`<li>${inline(ul[1])}</li>`);
      continue;
    }
    const ol = /^\d+[.)]\s+(.+)$/.exec(line);
    if (ol) {
      if (inUl) {
        out.push("</ul>");
        inUl = false;
      }
      if (!inOl) {
        out.push("<ol>");
        inOl = true;
      }
      out.push(`<li>${inline(ol[1])}</li>`);
      continue;
    }
    closeLists();
    out.push(`<p>${inline(line)}</p>`);
  }
  closeLists();
  if (inPre) out.push("</pre>");
  return out.join("\n");
}

/** Public entry: turn raw release notes into safe displayable HTML. */
export function renderReleaseNotes(notes: string): string {
  if (!notes) return "";
  return /<[a-z][^>]*>/i.test(notes)
    ? sanitizeHtml(notes)
    : renderMarkdown(notes);
}
