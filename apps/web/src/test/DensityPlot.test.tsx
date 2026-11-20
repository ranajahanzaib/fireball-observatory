import type { Density2DData } from "@fireball-observatory/shared";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DensityScatterPlot } from "../components/charts/DensityScatterPlot";

const mockDensity: Density2DData = {
  x_axis: {
    name: "Geocentric Velocity",
    unit: "km/s",
    field: "v_g_kms",
    min: 10,
    max: 75,
    step: 1,
    bins: 65,
  },
  y_axis: {
    name: "Peak Brightness Altitude",
    unit: "km",
    field: "peak_height_km",
    min: 50,
    max: 130,
    step: 1,
    bins: 80,
  },
  total_binned_points: 1000,
  max_cell_count: 50,
  grid: [
    [0, 0, 10],
    [1, 1, 25],
    [2, 2, 50],
  ],
};

describe("DensityScatterPlot Component", () => {
  it("renders without crashing with mock density and sample points", () => {
    const { container, getByText } = render(
      <DensityScatterPlot
        density={mockDensity}
        samplePoints={[
          {
            id: "gmn_20220214_103614_159347_6ed1",
            datetime_utc: "2022-02-14T10:36:14.159347+00:00",
            shower_code: "PER",
            shower_name: "Perseids",
            peak_abs_magnitude: -5.2,
            v_g_kms: 60.5,
            peak_height_km: 95.2,
            duration_sec: 1.2,
            n_stations: 4,
          },
        ]}
        unusualPoints={[
          {
            event: {
              id: "gmn_outlier_1",
              datetime_utc: "2022-02-14T10:36:14.159347+00:00",
              shower_code: "...",
              shower_name: "Sporadic",
              peak_abs_magnitude: -15.0,
              v_g_kms: 72.5,
              peak_height_km: 110.0,
              duration_sec: 0.5,
              n_stations: 3,
            },
            category: "fastest",
            title: "Hypervelocity Meteor",
            reason: "Extreme speed",
            metric_value: 72.5,
            metric_name: "Velocity",
            unit: "km/s",
            percentile_rank: ">99.9%",
          },
        ]}
        selectedEvent={null}
        onSelectEvent={() => {}}
      />,
    );
    expect(container).toBeTruthy();
    expect(
      getByText("Velocity vs. Peak Brightness Altitude"),
    ).toBeInTheDocument();
    expect(getByText("Sample Marks (1)")).toBeInTheDocument();
    expect(getByText("Outliers (1)")).toBeInTheDocument();
  });
});
