/**
 * IAU Meteor Data Center (MDC) Shower Code to Name Mapping
 * Code "..." represents sporadic meteors.
 */

export const SHOWER_NAMES: Record<string, string> = {
  "...": "Sporadic",
  GEM: "Geminids",
  PER: "Perseids",
  ORI: "Orionids",
  QUA: "Quadrantids",
  ETA: "eta Aquariids",
  LYR: "Lyrids",
  LEO: "Leonids",
  URS: "Ursids",
  CAP: "alpha Capricornids",
  SDA: "Southern delta Aquariids",
  NDA: "Northern delta Aquariids",
  NTA: "Northern Taurids",
  STA: "Southern Taurids",
  TAW: "Northern Taurids",
  MON: "Monocerotids",
  HYD: "sigma Hydrids",
  COM: "Coma Berenicids",
  AND: "Andromedids",
  DRA: "Draconids",
  GIA: "Draconids (Giacobinids)",
  AUR: "Aurigids",
  EVI: "eta Virginids",
  GNO: "gamma Normids",
  PUP: "pi Puppids",
  ELY: "eta Lyrids",
  JBO: "June Bootids",
  PAU: "Piscis Austrinids",
  KCG: "kappa Cygnids",
  SPE: "September epsilon Perseids",
  OCT: "October Camelopardalids",
  LMI: "Leonis Minorids",
  DLE: "Daytime Leonids",
  ARI: "Daytime Arietids",
  ZCA: "zeta Cancrids",
  DAU: "Daytime Aurigids",
  BUM: "Daytime beta Ursae Majorids",
  AVB: "alpha Virginids",
  SZC: "Daytime sextantids",
  TPC: "tau Piscids",
  EPC: "epsilon Piscids",
  OCC: "October Cygnids",
  EUM: "epsilon Ursae Majorids",
  NOO: "Northern October Orionids",
  XRI: "x Arietids",
  NZP: "Northern zeta Perseids",
  SZP: "Southern zeta Perseids",
};

/**
 * Returns the human-readable shower name or documented fallback.
 * Strictly adheres to not fabricating arbitrary names for unknown codes.
 */
export function getShowerName(code: string): string {
  if (!code || code === "...") {
    return "Sporadic";
  }
  const clean = code.trim().toUpperCase();
  return SHOWER_NAMES[clean] || `Shower ${clean}`;
}

export function isSporadic(code: string): boolean {
  return !code || code === "..." || code.trim() === "...";
}
