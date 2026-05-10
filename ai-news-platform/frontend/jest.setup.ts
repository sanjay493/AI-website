import "@testing-library/jest-dom";

jest.mock("next/font/google", () => ({
  Geist: () => ({
    variable: "--font-geist-sans-mock",
    className: "font-geist-mock",
  }),
  Geist_Mono: () => ({
    variable: "--font-geist-mono-mock",
    className: "font-geist-mono-mock",
  }),
}));
