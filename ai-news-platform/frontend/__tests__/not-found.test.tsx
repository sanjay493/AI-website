import React from "react";
import { render, screen } from "@testing-library/react";
import NotFound from "@/app/not-found";

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

describe("not-found page", () => {
  it("shows 404 messaging and link home", () => {
    render(<NotFound />);

    expect(screen.getByText("404")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /page not found/i })).toBeInTheDocument();

    const homeLink = screen.getByRole("link", { name: /go home/i });
    expect(homeLink).toHaveAttribute("href", "/");
  });
});
