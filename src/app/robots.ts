import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/account/"],
      },
    ],
    sitemap: "https://madhur-expenses.vercel.app/sitemap.xml",
  };
}
