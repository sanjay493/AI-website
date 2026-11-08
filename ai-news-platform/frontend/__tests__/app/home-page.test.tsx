import React from "react";
import { render, screen, within } from "@testing-library/react";
import type { Article } from "@/lib/content";

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean }) => {
    const { fill: _fill, ...rest } = props;
    void _fill;
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...rest} />;
  },
}));

jest.mock("@/components/seo/json-ld", () => ({
  JsonLd: () => null,
}));

jest.mock("@/lib/public-articles", () => ({
  loadArticles: jest.fn(),
}));

import HomePage from "@/app/page";
import { loadArticles } from "@/lib/public-articles";

const base = { category: "news", readingTimeMinutes: 5, paragraphs: [] as string[] };

const rows: Article[] = [
  { ...base, slug: "older-video", title: "Older video", excerpt: "Older", publishedAt: "2026-01-01",
    externalUrl: "https://www.youtube.com/watch?v=aaaaaaaaaaa", coverImageUrl: "https://i.ytimg.com/vi/aaaaaaaaaaa/hqdefault.jpg" },
  { ...base, slug: "plain-article", title: "Plain article", excerpt: "Not a video", publishedAt: "2026-09-01" },
  { ...base, slug: "newest-video", title: "Newest video", excerpt: "Newest", publishedAt: "2026-06-01",
    externalUrl: "https://youtu.be/bbbbbbbbbbb", coverImageUrl: null },
  { ...base, slug: "fake-video", title: "Lookalike domain", excerpt: "Spoof", publishedAt: "2026-07-01",
    externalUrl: "https://youtube.com.evil.example/watch?v=ccccccccccc" },
];

describe("Home page", () => {
  it("shows only YouTube videos, newest first, linking to YouTube, plus the course section", async () => {
    jest.mocked(loadArticles).mockResolvedValue(rows);
    render(await HomePage());

    expect(
      screen.getByRole("heading", { level: 1, name: /trending ai & tech videos on youtube/i }),
    ).toBeInTheDocument();

    const grid = screen.getByRole("region", { name: /trending videos/i });
    const items = within(grid).getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(within(items[0]).getByRole("heading", { name: "Newest video" })).toBeInTheDocument();
    expect(within(items[1]).getByRole("heading", { name: "Older video" })).toBeInTheDocument();

    const firstLink = within(items[0]).getByRole("link");
    expect(firstLink).toHaveAttribute("href", "https://youtu.be/bbbbbbbbbbb");
    expect(firstLink).toHaveAttribute("target", "_blank");
    expect(firstLink).toHaveAttribute("rel", "noopener noreferrer");

    expect(screen.queryByText("Plain article")).not.toBeInTheDocument();
    expect(screen.queryByText("Lookalike domain")).not.toBeInTheDocument();

    expect(screen.getByRole("heading", { name: /linux & powershell professional mastery/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /start the course/i })).toHaveAttribute(
      "href",
      expect.stringMatching(/^https:\/\//),
    );
  });

  it("shows an empty state when no videos are available", async () => {
    jest.mocked(loadArticles).mockResolvedValue([rows[1]]);
    render(await HomePage());
    expect(screen.getByText(/no trending videos are available/i)).toBeInTheDocument();
  });
});
