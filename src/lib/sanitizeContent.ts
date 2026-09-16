import sanitizeHtml from "sanitize-html";

/**
 * Sanitizes story HTML before it is rendered.
 *
 * Deliberately pure JavaScript (sanitize-html, no DOM/jsdom): the previous
 * DOMPurify-with-jsdom approach pulled a heavyweight, Node-version-sensitive
 * dependency into the article render path, which is fragile on serverless and
 * slow on cold start. This runs anywhere, including Next.js server rendering,
 * with predictable output.
 *
 * The allowlist matches what the TipTap editor can produce plus the legacy
 * hand-written HTML already stored in the database.
 */
const ALLOWED_TAGS = [
  "p", "h1", "h2", "h3", "h4", "h5", "h6",
  "blockquote", "ul", "ol", "li", "a", "strong", "b", "em", "i",
  "u", "s", "strike", "mark", "code", "pre", "sub", "sup",
  "img", "br", "hr", "span", "div", "figure", "figcaption", "table",
  "thead", "tbody", "tr", "th", "td",
];

export function sanitizeStoryHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      a: ["href", "title", "target", "rel"],
      img: ["src", "alt", "title", "width", "height", "loading"],
      "*": ["class", "style"],
      ol: ["start"],
      td: ["colspan", "rowspan"],
      th: ["colspan", "rowspan"],
    },
    // Only harmless presentation styles survive — no url(), no expressions.
    allowedStyles: {
      "*": {
        "text-align": [/^(left|right|center|justify)$/],
        "font-weight": [/^\d{3}$|^(normal|bold|bolder|lighter)$/],
        "font-style": [/^(normal|italic)$/],
        "text-decoration": [/^(none|underline|line-through)$/],
      },
    },
    // Block dangerous URL schemes in both links and images.
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: { img: ["http", "https"] },
    allowProtocolRelative: false,
    transformTags: {
      // External links open safely; internal links stay in the same tab.
      a: (tagName, attribs) => {
        const href = attribs.href ?? "";
        const isExternal = /^https?:\/\//i.test(href);
        return {
          tagName,
          attribs: isExternal
            ? { ...attribs, target: "_blank", rel: "noopener noreferrer" }
            : { ...attribs, rel: "noopener" },
        };
      },
    },
    // Strip the contents of script/style entirely rather than escaping them.
    nonTextTags: ["style", "script", "textarea", "option", "noscript"],
    // exclusiveFilter returning true = drop the tag. Stories only ever embed
    // images hosted on a real https origin, so anything else goes.
    exclusiveFilter: (frame) =>
      frame.tag === "img" && !/^https?:\/\//i.test(frame.attribs?.src ?? ""),
  });
}
