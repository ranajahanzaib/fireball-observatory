import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Footer } from "../components/layout/Footer";
import { Header } from "../components/layout/Header";

describe("Navigation and Layout Components", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders Header with navigation items and branding", () => {
    const handleOpenSearch = vi.fn();
    render(
      <MemoryRouter>
        <Header onOpenSearch={handleOpenSearch} />
      </MemoryRouter>,
    );

    expect(screen.getByText("Fireball Observatory")).toBeInTheDocument();
    expect(screen.getAllByText("Overview")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Brightest Events")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Explore Data")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Shower Comparison")[0]).toBeInTheDocument();
    expect(screen.getAllByText("About the Data")[0]).toBeInTheDocument();
  });

  it("renders Footer with mandatory CC BY 4.0 attribution and limitations notice", () => {
    render(<Footer />);

    expect(
      screen.getByText(/Scientific Limitations & Observational Scope/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Global Meteor Network Trajectory Data/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Julien Simon/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Creative Commons Attribution 4.0/i),
    ).toBeInTheDocument();
  });
});
