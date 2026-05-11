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

jest.mock("@/lib/public-articles", () => ({
  loadArticles: jest.fn(),
}));

import BlogPage from "@/app/blog/page";
import { loadArticles } from "@/lib/public-articles";

const rows: Article[] = [
  {
    slug: "b",
    title: "Second",
    excerpt: "B",
    category: "articles",
    publishedAt: "2026-02-01",
    readingTimeMinutes: 4,
    paragraphs: [],
  },
  {
    slug: "a",
    title: "First by date",
    excerpt: "A",
    category: "news",
    publishedAt: "2026-06-01",
    readingTimeMinutes: 2,
    paragraphs: [],
  },
];

describe("Blog page", () => {
  beforeEach(() => {
    jest.mocked(loadArticles).mockResolvedValue(rows);
  });

  it("lists articles sorted by newest first", async () => {
    const ui = await BlogPage();
    render(ui);

    expect(
      screen.getByRole("heading", { level: 1, name: /^blog$/i }),
    ).toBeInTheDocument();

    const links = screen.getAllByRole("link", { name: /read on site/i });
    expect(links[0]).toHaveAttribute("href", "/blog/a");
    expect(links[1]).toHaveAttribute("href", "/blog/b");
  });
});
