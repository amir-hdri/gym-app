"use client";

import "./globals.css";

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="fa" dir="rtl">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#000",
          color: "#fafafa",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: "24px",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0 }}>
            خطایی پیش آمد
          </h1>
          <p style={{ fontSize: "0.875rem", opacity: 0.7, marginTop: 8 }}>
            برنامه به مشکل خورده است. دوباره تلاش کن.
          </p>
          <button
            onClick={() => retry()}
            style={{
              marginTop: 24,
              minHeight: 44,
              padding: "0 24px",
              borderRadius: 16,
              border: "none",
              background: "#FF375F",
              color: "#fff",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            تلاش مجدد
          </button>
          {error.digest && (
            <p style={{ fontSize: 11, opacity: 0.5, marginTop: 16 }} dir="ltr">
              {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
