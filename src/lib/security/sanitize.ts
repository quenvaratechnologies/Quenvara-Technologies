import sanitizeHtml from "sanitize-html";

const ALLOWED_TAGS = [
  "h2", "h3", "h4", "p", "br", "strong", "em", "u", "s", "ul", "ol", "li",
  "blockquote", "a", "img", "pre", "code", "hr", "figure", "figcaption",
  "table", "thead", "tbody", "tr", "th", "td",
];

/**
 * Allow-list sanitizer for all rich content (editor output is untrusted).
 * Applied on render AND before save. Never render CMS HTML without this.
 */
export function sanitizeRichText(html: string): string {
  return sanitizeHtml(html ?? "", {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      a: ["href", "title", "target", "rel"],
      img: ["src", "alt", "title", "width", "height", "loading"],
      th: ["colspan", "rowspan"],
      td: ["colspan", "rowspan"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: { img: ["http", "https"] },
    allowProtocolRelative: false,
    transformTags: {
      a: (tagName, attribs) => {
        const external = /^https?:\/\//i.test(attribs.href ?? "");
        return {
          tagName,
          attribs: {
            ...attribs,
            ...(external ? { target: "_blank", rel: "noopener noreferrer nofollow" } : {}),
          },
        };
      },
      img: (tagName, attribs) => ({ tagName, attribs: { ...attribs, loading: "lazy" } }),
    },
    disallowedTagsMode: "discard",
  });
}

/** Plain text only — strips every tag. */
export function stripTags(input: string): string {
  return sanitizeHtml(input ?? "", { allowedTags: [], allowedAttributes: {} }).trim();
}
