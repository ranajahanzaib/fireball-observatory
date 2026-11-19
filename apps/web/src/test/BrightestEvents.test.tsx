import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as hooks from "../api/hooks";
import { BrightestEventsPage } from "../routes/BrightestEventsPage";

describe("Brightest Events Catalog Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockFireballs = [
    {
      id: "gmn_20221214_010203_123456_a1b2",
      datetime_utc: "2022-12-14T01:02:03Z",
      shower_code: "GEM",
      shower_name: "Geminids",
      peak_abs_magnitude: -8.5,
      v_g_kms: 34.2,
      peak_height_km: 78.5,
      duration_sec: 1.45,
      n_stations: 6,
    },
    {
      id: "gmn_20230812_230000_654321_c3d4",
      datetime_utc: "2023-08-12T23:00:00Z",
      shower_code: "PER",
      shower_name: "Perseids",
      peak_abs_magnitude: -5.2,
      v_g_kms: 59.1,
      peak_height_km: 92.1,
      duration_sec: 0.95,
      n_stations: 3,
    },
    {
      id: "gmn_20210101_120000_111111_e5f6",
      datetime_utc: "2021-01-01T12:00:00Z",
      shower_code: "...",
      shower_name: "Sporadic",
      peak_abs_magnitude: -4.1,
      v_g_kms: 22.4,
      peak_height_km: 84.0,
      duration_sec: 1.1,
      n_stations: 2,
    },
  ];

  it("renders catalog rows and active fireball counts", async () => {
    vi.spyOn(hooks, "useFireballs").mockReturnValue({
      data: mockFireballs,
      loading: false,
      error: null,
    });

    render(
      <MemoryRouter initialEntries={["/fireballs"]}>
        <BrightestEventsPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("Brightest Meteor Catalog")).toBeInTheDocument();
    expect(
      screen.getByText("gmn_20221214_010203_123456_a1b2"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("gmn_20230812_230000_654321_c3d4"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("gmn_20210101_120000_111111_e5f6"),
    ).toBeInTheDocument();
  });

  it("filters by configurable threshold from query param", async () => {
    vi.spyOn(hooks, "useFireballs").mockReturnValue({
      data: mockFireballs,
      loading: false,
      error: null,
    });

    // Threshold <= -6 should only show the -8.5 event
    render(
      <MemoryRouter initialEntries={["/fireballs?maxMag=-6"]}>
        <BrightestEventsPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText("gmn_20221214_010203_123456_a1b2"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("gmn_20230812_230000_654321_c3d4"),
    ).not.toBeInTheDocument();
  });

  it("shows empty state when no events match filter", async () => {
    vi.spyOn(hooks, "useFireballs").mockReturnValue({
      data: mockFireballs,
      loading: false,
      error: null,
    });

    render(
      <MemoryRouter initialEntries={["/fireballs?shower=NON_EXISTENT_SHOWER"]}>
        <BrightestEventsPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(
        /No fireball candidates matched your current filter parameters/i,
      ),
    ).toBeInTheDocument();
  });
});
