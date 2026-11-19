/**
 * Formatting and astronomical calculation helpers
 */

export function formatMagnitude(mag: number | null | undefined): string {
  if (mag === null || mag === undefined || !Number.isFinite(mag)) return "N/A";
  return `${mag >= 0 ? "+" : ""}${mag.toFixed(1)} mag`;
}

export function formatVelocity(v: number | null | undefined): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return "N/A";
  return `${v.toFixed(1)} km/s`;
}

export function formatAltitude(h: number | null | undefined): string {
  if (h === null || h === undefined || !Number.isFinite(h)) return "N/A";
  return `${h.toFixed(1)} km`;
}

export function formatDuration(sec: number | null | undefined): string {
  if (sec === null || sec === undefined || !Number.isFinite(sec)) return "N/A";
  return `${sec.toFixed(2)} s`;
}

export function formatStationCount(n: number | null | undefined): string {
  if (n === null || n === undefined) return "N/A";
  return `${n} ${n === 1 ? "station" : "stations"}`;
}

export function formatDateTimeUTC(iso: string | null | undefined): string {
  if (!iso) return "N/A";
  try {
    const d = new Date(iso);
    return d.toISOString().replace("T", " ").replace("Z", " UTC");
  } catch {
    return iso;
  }
}

export function formatAU(au: number | null | undefined): string {
  if (au === null || au === undefined || !Number.isFinite(au))
    return "Unbound / Non-finite";
  return `${au.toFixed(3)} AU`;
}

export function formatDegrees(deg: number | null | undefined): string {
  if (deg === null || deg === undefined || !Number.isFinite(deg)) return "N/A";
  return `${deg.toFixed(2)}°`;
}

export function formatEccentricity(e: number | null | undefined): string {
  if (e === null || e === undefined || !Number.isFinite(e)) return "N/A";
  return e.toFixed(4);
}

/**
 * Returns human-readable orbit classification based on eccentricity
 */
export function getOrbitClassification(
  e: number | null | undefined,
  a_au: number | null | undefined,
): {
  type: "elliptical" | "parabolic" | "hyperbolic" | "unknown";
  label: string;
  description: string;
} {
  if (e === null || e === undefined || !Number.isFinite(e)) {
    return {
      type: "unknown",
      label: "Indeterminate Solution",
      description:
        "Orbital elements could not be definitively resolved from trajectory solution.",
    };
  }

  if (
    e < 0.99 &&
    a_au !== null &&
    a_au !== undefined &&
    Number.isFinite(a_au) &&
    a_au > 0
  ) {
    return {
      type: "elliptical",
      label: "Closed Elliptical Orbit",
      description:
        "Gravitationally bound solar system orbit. Typical of cometary and asteroidal meteor streams.",
    };
  }

  if (e >= 0.99 && e <= 1.01) {
    return {
      type: "parabolic",
      label: "Near-Parabolic Orbit",
      description:
        "Borderline bound orbit, typical of long-period comets from the Oort cloud (or slight deceleration noise).",
    };
  }

  return {
    type: "hyperbolic",
    label: "Hyperbolic Orbit Candidate",
    description:
      "Eccentricity > 1. Indicates an open hyperbolic trajectory (potential interstellar origin, or high observational uncertainty/atmospheric deceleration prior to triangulation).",
  };
}

/**
 * Provides astronomical comparison context for absolute magnitude
 */
export function getMagnitudeComparison(mag: number): string {
  if (mag <= -19)
    return "Extremely rare superbolide (comparable to daylight daylight-visible fireballs)";
  if (mag <= -13)
    return "Comparable to or brighter than the Full Moon (~ -12.6 mag)";
  if (mag <= -8) return "Brilliant fireball (brighter than first-quarter Moon)";
  if (mag <= -4)
    return "Bright fireball candidate (brighter than Venus at peak ~ -4.4 mag)";
  if (mag <= -2) return "Very bright meteor (brighter than Jupiter / Sirius)";
  if (mag <= 0)
    return "Bright meteor (comparable to brightest stars like Vega)";
  if (mag <= 3) return "Typical naked-eye meteor in dark skies";
  return "Faint telescopic or camera-detected meteor";
}
