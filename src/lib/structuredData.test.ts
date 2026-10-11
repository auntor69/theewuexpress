import { describe, expect, it } from "vitest";
import {
  ORGANIZATION_ID,
  PUBLISHER_NAME,
  SITE_DESCRIPTION,
  WEBSITE_ID,
  breadcrumbNode,
  collectionPageNode,
  isoDate,
  itemListNode,
  jsonLdGraph,
  newsArticleNode,
  organizationNode,
  parseTags,
  serializeJsonLd,
  webPageNode,
  websiteNode,
  type SiteIdentity,
  type StructuredPost,
} from "./structuredData";

const site: SiteIdentity = {
  url: "https://example.com",
  logo: "https://example.com/logo.png",
};

const post: StructuredPost = {
  slug: "night-life",
  title: "The Untold Stories of Campus Night Life",
  caption: "What happens on campus after the last class ends.",
  coverImage: "https://i.ibb.co/abc/cover.jpg",
  category: "campus-heat",
  tags: '["campus","night"]',
  createdAt: "2026-09-01 10:30:00",
  updatedAt: "2026-09-04 08:00:00",
};

describe("isoDate", () => {
  it("treats the database's bare UTC datetime as UTC, not local time", () => {
    expect(isoDate("2026-09-01 10:30:00")).toBe("2026-09-01T10:30:00.000Z");
  });

  it("returns undefined for missing or unparseable values", () => {
    expect(isoDate(null)).toBeUndefined();
    expect(isoDate(undefined)).toBeUndefined();
    expect(isoDate("")).toBeUndefined();
    expect(isoDate("not a date")).toBeUndefined();
  });
});

describe("parseTags", () => {
  it("reads the JSON array stored in the tags column", () => {
    expect(parseTags('["campus","night"]')).toEqual(["campus", "night"]);
  });

  it("trims entries and drops blanks and non-strings", () => {
    expect(parseTags('[" campus ", "", 42, null, "night"]')).toEqual([
      "campus",
      "night",
    ]);
  });

  it("never throws on missing or malformed input", () => {
    expect(parseTags(null)).toEqual([]);
    expect(parseTags(undefined)).toEqual([]);
    expect(parseTags("")).toEqual([]);
    expect(parseTags("campus")).toEqual([]);
    expect(parseTags('{"a":1}')).toEqual([]);
    expect(parseTags('["unterminated')).toEqual([]);
  });
});

describe("serializeJsonLd", () => {
  it("escapes the characters that could break out of the script tag", () => {
    const json = serializeJsonLd({ headline: "</script><img src=x onerror=y>" });
    expect(json).not.toContain("<");
    expect(json).not.toContain(">");
    expect(json).toContain("\\u003c/script\\u003e");
  });

  it("stays valid JSON that parses back to the original value", () => {
    const value = { headline: "A & B </script>", count: 2 };
    expect(JSON.parse(serializeJsonLd(value))).toEqual(value);
  });
});

describe("jsonLdGraph", () => {
  it("sets the context once and drops absent nodes", () => {
    const graph = jsonLdGraph([{ "@type": "WebSite" }, undefined, null]);
    expect(graph["@context"]).toBe("https://schema.org");
    expect(graph["@graph"]).toEqual([{ "@type": "WebSite" }]);
  });
});

describe("organizationNode", () => {
  it("describes the publication with an absolute logo and id", () => {
    const node = organizationNode(site);
    expect(node["@type"]).toBe("NewsMediaOrganization");
    expect(node["@id"]).toBe(`https://example.com${ORGANIZATION_ID}`);
    expect(node.name).toBe(PUBLISHER_NAME);
    expect(node.url).toBe("https://example.com/");
    expect(node.logo.url).toBe("https://example.com/logo.png");
    expect(node.logo.width).toBeGreaterThan(0);
    expect(node.logo.height).toBeGreaterThan(0);
  });

  it("falls back to the site description", () => {
    expect(organizationNode(site).description).toBe(SITE_DESCRIPTION);
    expect(
      organizationNode({ ...site, description: "Custom" }).description
    ).toBe("Custom");
  });
});

describe("websiteNode", () => {
  it("points at the organization and exposes the sitelinks search box", () => {
    const node = websiteNode(site);
    expect(node["@type"]).toBe("WebSite");
    expect(node["@id"]).toBe(`https://example.com${WEBSITE_ID}`);
    expect(node.publisher).toEqual({
      "@id": `https://example.com${ORGANIZATION_ID}`,
    });
    expect(node.potentialAction.target.urlTemplate).toBe(
      "https://example.com/search?q={search_term_string}"
    );
    expect(node.potentialAction["query-input"]).toBe(
      "required name=search_term_string"
    );
  });
});

describe("webPageNode", () => {
  it("resolves the path against the site origin", () => {
    const node = webPageNode(site, {
      path: "/privacy",
      name: "Privacy Policy",
      description: "What we collect.",
    });
    expect(node["@type"]).toBe("WebPage");
    expect(node.url).toBe("https://example.com/privacy");
    expect(node["@id"]).toBe("https://example.com/privacy");
    expect(node.name).toBe("Privacy Policy");
    expect(node.description).toBe("What we collect.");
    expect(node.isPartOf).toEqual({
      "@id": `https://example.com${WEBSITE_ID}`,
    });
  });

  it("keeps the trailing slash for the homepage", () => {
    const node = webPageNode(site, { path: "/", name: PUBLISHER_NAME });
    expect(node.url).toBe("https://example.com/");
    expect(node).not.toHaveProperty("description");
  });
});

describe("newsArticleNode", () => {
  it("builds the article node from the published row", () => {
    const node = newsArticleNode(post, site, "Campus Heat");
    expect(node["@type"]).toBe("NewsArticle");
    expect(node.headline).toBe(post.title);
    expect(node.url).toBe("https://example.com/article/night-life");
    expect(node["@id"]).toBe("https://example.com/article/night-life#article");
    expect(node.image).toEqual([post.coverImage]);
    expect(node.datePublished).toBe("2026-09-01T10:30:00.000Z");
    expect(node.dateModified).toBe("2026-09-04T08:00:00.000Z");
    expect(node.articleSection).toBe("Campus Heat");
    expect(node.keywords).toEqual(["campus", "night"]);
    expect(node.isAccessibleForFree).toBe(true);
    expect(node.publisher).toEqual({
      "@id": `https://example.com${ORGANIZATION_ID}`,
    });
    expect(node.mainEntityOfPage).toEqual({
      "@type": "WebPage",
      "@id": "https://example.com/article/night-life",
    });
  });

  it("omits the section for an uncategorised story", () => {
    const node = newsArticleNode({ ...post, category: null }, site);
    expect(node).not.toHaveProperty("articleSection");
  });

  it("omits dates and keywords rather than emitting placeholders", () => {
    const node = newsArticleNode(
      { ...post, tags: "not json", createdAt: "", updatedAt: "" },
      site
    );
    expect(node).not.toHaveProperty("datePublished");
    expect(node).not.toHaveProperty("dateModified");
    expect(node).not.toHaveProperty("keywords");
  });
});

describe("breadcrumbNode", () => {
  it("numbers the trail and leaves the current page unlinked", () => {
    const node = breadcrumbNode([
      { name: PUBLISHER_NAME, url: "https://example.com/" },
      { name: "Campus Heat", url: "https://example.com/category/campus-heat" },
      { name: "Night Life", url: "https://example.com/article/night-life" },
    ]);

    expect(node["@type"]).toBe("BreadcrumbList");
    expect(node.itemListElement).toEqual([
      {
        "@type": "ListItem",
        position: 1,
        name: PUBLISHER_NAME,
        item: "https://example.com/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Campus Heat",
        item: "https://example.com/category/campus-heat",
      },
      { "@type": "ListItem", position: 3, name: "Night Life" },
    ]);
  });
});

describe("itemListNode", () => {
  it("counts and numbers the listed stories", () => {
    const node = itemListNode(
      [
        { name: "One", url: "https://example.com/article/one" },
        { name: "Two", url: "https://example.com/article/two" },
      ],
      "Campus Heat"
    );

    expect(node["@type"]).toBe("ItemList");
    expect(node.name).toBe("Campus Heat");
    expect(node.numberOfItems).toBe(2);
    expect(node.itemListElement[1]).toEqual({
      "@type": "ListItem",
      position: 2,
      name: "Two",
      url: "https://example.com/article/two",
    });
  });
});

describe("collectionPageNode", () => {
  it("attaches the section's stories as its main entity", () => {
    const node = collectionPageNode(
      site,
      { path: "/category/campus-heat", name: "Campus Heat" },
      [{ name: "Night Life", url: "https://example.com/article/night-life" }]
    );

    expect(node["@type"]).toBe("CollectionPage");
    expect(node.url).toBe("https://example.com/category/campus-heat");
    expect(node.mainEntity).toEqual({
      "@type": "ItemList",
      name: "Campus Heat",
      numberOfItems: 1,
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Night Life",
          url: "https://example.com/article/night-life",
        },
      ],
    });
  });

  it("omits mainEntity for an empty section", () => {
    const node = collectionPageNode(
      site,
      { path: "/category/events", name: "Events" },
      []
    );
    expect(node).not.toHaveProperty("mainEntity");
  });
});
