import { ImageResponse } from "next/og";

export const alt = "The EWU Express — The Student News Publication of East West University";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Default social-card image for every URL without its own (home, categories,
 * search, policies). Navy masthead field with the serif brand name and the
 * site description — the same identity as the email header. Uses a generic
 * serif stack because OG rendering cannot load webfonts.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #0f2a5c 0%, #16386f 55%, #0b1f42 100%)",
          padding: "72px 80px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div
            style={{
              fontSize: 26,
              letterSpacing: 8,
              color: "#c9a227",
              textTransform: "uppercase",
            }}
          >
            East West University
          </div>
          <div
            style={{
              fontSize: 24,
              letterSpacing: 4,
              color: "#f5efe0",
              border: "2px solid #c9a227",
              borderRadius: 999,
              padding: "8px 28px",
            }}
          >
            Student News
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 96,
              fontWeight: 700,
              letterSpacing: -1,
              color: "#f5efe0",
              fontFamily: "Georgia, 'Times New Roman', serif",
              lineHeight: 1.05,
            }}
          >
            The EWU Express
          </div>
          <div
            style={{
              marginTop: 28,
              fontSize: 34,
              color: "rgba(245,239,224,0.78)",
              maxWidth: 900,
              fontFamily: "Georgia, serif",
            }}
          >
            Campus heat, real stories, student voice — reported with care.
          </div>
        </div>

        <div
          style={{
            width: "100%",
            height: 6,
            background: "#c9a227",
          }}
        />
      </div>
    ),
    size
  );
}
