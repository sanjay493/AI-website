import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "@/app/auth/login/page";

const replace = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: jest.fn(), prefetch: jest.fn() }),
}));

const signIn = jest.fn(async () => {});

jest.mock("@/components/providers/auth-provider", () => ({
  useAuth: () => ({
    signIn,
    user: null,
    signOut: jest.fn(),
    signUp: jest.fn(),
    loading: false,
    refreshSession: jest.fn(),
    accessToken: null,
    refreshToken: null,
  }),
}));

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

describe("Login page", () => {
  beforeEach(() => {
    signIn.mockResolvedValue(undefined);
    replace.mockClear();
  });

  it("calls signIn when form is valid", async () => {
    const user = userEvent.setup();

    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "password123");

    const submit = screen.getByRole("button", { name: /continue/i });
    expect(submit).toBeEnabled();

    await user.click(submit);

    expect(signIn).toHaveBeenCalledWith("test@example.com", "password123");
  });

  it("keeps submit disabled until email and password satisfy rules", async () => {
    render(<LoginPage />);

    expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled();

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/email/i), "notvalid");
    await user.type(screen.getByLabelText(/^password$/i), "short");

    expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled();
  });
});
