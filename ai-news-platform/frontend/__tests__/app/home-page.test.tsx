import React from "react";
import { render, screen } from "@testing-library/react";
import type { Article } from "@/lib/content";

jest.mock("next/link", () => ({
  __esModule: true,
  default ({
    href,
    children,
    ...rest
  }: React.ComponentPropsWithoutRef<"a"> & { href: string }) {
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    );
  },
}));

jest.mock("@/components/seo/json-ld", () => ({
  JsonLd: () => null,
}));

jest.mock("@/components/newsletter-form", () => ({
  NewsletterForm: () => (
    <div data-testid="newsletter-placeholder">Newsletter</div>
  ),
}));

jest.mock("@/lib/public-articles", () => ({
  loadArticles: jest.fn(),
}));

import HomePage from "@/app/page";
import { loadArticles } from "@/lib/public-articles";

const mockArticles: Article[] = [
  {
    slug: "oldest",
    title: "Oldest",
    excerpt: "Oldest excerpt",
    category: "news",
    publishedAt: "2026-01-01",
    readingTimeMinutes: 5,
    paragraphs: [],
  },
  {
    slug: "mid",
    title: "Middle",
    excerpt: "Middle excerpt",
    category: "articles",
    publishedAt: "2026-03-01",
    readingTimeMinutes: 7,
    paragraphs: [],
  },
  {
    slug: "newest",
    title: "Newest",
    excerpt: "Newest excerpt",
    category: "tutorials",
    publishedAt: "2026-06-01",
    readingTimeMinutes: 9,
    paragraphs: [],
  },
  {
    slug: "extra",
    title: "Extra hidden from featured",
    excerpt: "Hidden",
    category: "trends",
    publishedAt: "2026-02-01",
    readingTimeMinutes: 3,
    paragraphs: [],
  },
];

describe("Home page", () => {
  beforeEach(() => {
    jest.mocked(loadArticles).mockResolvedValue(mockArticles);
  });

  it("renders hero, featured posts (newest first, max 3), and categories", async () => {
    const ui = await HomePage();
    render(ui);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /without the noise/i,
      }),
    ).toBeInTheDocument();

    expect(loadArticles).toHaveBeenCalled();

    expect(screen.getByRole("link", { name: /^newest$/i })).toHaveAttribute(
      "href",
      "/blog/newest",
    );
    expect(screen.getByRole("link", { name: /^middle$/i })).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: /extra hidden from featured/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /^oldest$/i }),
    ).not.toBeInTheDocument();

    expect(screen.getByRole("link", { name: /^news\b/i })).toHaveAttribute(
      "href",
      "/category/news",
    );
    expect(screen.getByTestId("newsletter-placeholder")).toBeInTheDocument();
  });
});
