import { execFileSync } from "node:child_process";
import type { NextConfig } from "next";

/**
 * Build ID dari commit Git, bukan angka acak. Rebuild tanpa perubahan kode
 * memakai ID yang sama sehingga tidak memicu pemberitahuan versi baru.
 */
function buildIdDariGit(): string | null {
  const dariEnv =
    process.env.GIT_COMMIT ??
    process.env.GITHUB_SHA ??
    process.env.CI_COMMIT_SHA ??
    process.env.VERCEL_GIT_COMMIT_SHA;
  if (dariEnv?.trim()) return dariEnv.trim();

  try {
    return execFileSync("git", ["rev-parse", "--short=16", "HEAD"], {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim() || null;
  } catch {
    return null;
  }
}

const nextConfig: NextConfig = {
  generateBuildId: async () => buildIdDariGit(),

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
