import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as hooks from "../api/hooks";
import { EventDetailPage } from "../routes/EventDetailPage";

describe("Event Detail Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockEvent = {
    id: "gmn_20221214_010203_123456_a1b2",
    datetime_utc: "2022-12-14T01:02:03Z",
    shower_code: "GEM",
    shower_name: "Geminids",
    radiant_ra_deg: 112.4,
    radiant_dec_deg: 32.5,
    v_g_kms: 34.2,
    a_au: 1.34,
    e: 0.895,
    i_deg: 23.4,
    peri_deg: 324.5,
    node_deg: 261.2,
    q_au: 0.141,
    peak_abs_magnitude: -8.5,
    peak_height_km: 78.5,
    duration_sec: 1.45,
    n_stations: 6,
    is_fireball: true,
    is_hyperbolic: false,
  };

  it("renders event measurements and orbital parameters correctly", () => {
    vi.spyOn(hooks, "useEventDetail").mockReturnValue({
      data: mockEvent,
      loading: false,
      error: null,
    });

    vi.spyOn(hooks, "useSummary").mockReturnValue({
      data: null,
      loading: false,
      error: null,
    });

    vi.spyOn(hooks, "useFireballs").mockReturnValue({
      data: [],
      loading: false,
      error: null,
    });

    render(
      <MemoryRouter
        initialEntries={["/events/gmn_20221214_010203_123456_a1b2"]}
      >
        <Routes>
          <Route path="/events/:eventId" element={<EventDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      screen.getByText("gmn_20221214_010203_123456_a1b2"),
    ).toBeInTheDocument();
    expect(screen.getAllByText("-8.5 mag")[0]).toBeInTheDocument();
    expect(screen.getAllByText("34.2 km/s")[0]).toBeInTheDocument();
    expect(screen.getAllByText("78.5 km")[0]).toBeInTheDocument();
    expect(screen.getAllByText("1.45 s")[0]).toBeInTheDocument();
    expect(screen.getByText("1.340 AU")).toBeInTheDocument();
    expect(screen.getByText("0.8950")).toBeInTheDocument();
    expect(screen.getByText("Closed Elliptical Orbit")).toBeInTheDocument();
  });

  it("handles invalid or non-existent event IDs with graceful error state", () => {
    vi.spyOn(hooks, "useEventDetail").mockReturnValue({
      data: null,
      loading: false,
      error: new Error("Event not found"),
    });

    render(
      <MemoryRouter initialEntries={["/events/invalid_id"]}>
        <Routes>
          <Route path="/events/:eventId" element={<EventDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      screen.getByText(/Observation Event Not Found/i),
    ).toBeInTheDocument();
  });
});
