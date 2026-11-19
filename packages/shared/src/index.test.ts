import { describe, expect, it } from "vitest";
import {
  formatAltitude,
  formatMagnitude,
  formatVelocity,
  getOrbitClassification,
  getShowerName,
} from "./index";

describe("Shared Astronomy Helpers", () => {
  it("correctly maps shower codes", () => {
    expect(getShowerName("...")).toBe("Sporadic");
    expect(getShowerName("GEM")).toBe("Geminids");
    expect(getShowerName("PER")).toBe("Perseids");
    expect(getShowerName("XYZ_UNKNOWN")).toBe("Shower XYZ_UNKNOWN");
  });

  it("formats scientific metrics accurately", () => {
    expect(formatMagnitude(-4.5)).toBe("-4.5 mag");
    expect(formatMagnitude(1.2)).toBe("+1.2 mag");
    expect(formatVelocity(58.34)).toBe("58.3 km/s");
    expect(formatAltitude(88.2)).toBe("88.2 km");
  });

  it("classifies orbital solutions accurately", () => {
    const bound = getOrbitClassification(0.85, 2.3);
    expect(bound.type).toBe("elliptical");

    const parabolic = getOrbitClassification(1.0, 100.0);
    expect(parabolic.type).toBe("parabolic");

    const hyperbolic = getOrbitClassification(1.15, -5.0);
    expect(hyperbolic.type).toBe("hyperbolic");

    const indeterminate = getOrbitClassification(null, null);
    expect(indeterminate.type).toBe("unknown");
  });
});
