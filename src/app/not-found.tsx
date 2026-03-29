import Link from "next/link"

export default function NotFound() {
  return (
    <div
      style={{
        background: "#273E47",
        color: "#f8fafc",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
      }}
    >
      <h1
        style={{
          fontSize: "48px",
          fontWeight: 700,
          marginBottom: "8px",
          color: "#5B9BAA",
        }}
      >
        404
      </h1>
      <p style={{ fontSize: "14px", color: "#94a3b8", marginBottom: "24px" }}>
        This page could not be found.
      </p>
      <Link
        href="/"
        style={{
          fontSize: "14px",
          color: "#5B9BAA",
          textDecoration: "none",
        }}
      >
        Go home
      </Link>
    </div>
  )
}
