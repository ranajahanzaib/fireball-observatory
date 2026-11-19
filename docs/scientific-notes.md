# Scientific Notes & Methodology

## 1. Global Meteor Network Observational Principles

The [Global Meteor Network (GMN)](https://globalmeteornetwork.org) is a citizen-science initiative operating hundreds of low-cost, high-sensitivity video cameras equipped with Sony Starvis CMOS sensors and wide-angle lenses.

### Multi-Station Stereoscopic Triangulation

Single-station camera observations cannot directly compute physical trajectory heights or geocentric velocities because the distance to the meteor is unknown. When two or more calibrated cameras at separated geographic locations observe the same luminous streak simultaneously:

1. **Ray Intersection:** The lines of sight from each camera to corresponding points along the streak are intersected in 3D space using planes of intersection.
2. **Atmospheric Trajectory:** The straight-line trajectory vector is computed, yielding entry angle, beginning height, altitude of peak brightness ($H_{peak}$), and terminal height.
3. **Deceleration & Geocentric Velocity ($v_g$):** By measuring along-track deceleration against atmospheric drag models, the pre-atmospheric entry velocity ($v_{\infty}$ or $v_g$) outside Earth's gravitational acceleration is derived.
4. **Heliocentric Orbit:** Using the precise UTC timestamp, radiant Right Ascension and Declination, and geocentric velocity, the heliocentric orbital elements ($a, e, i, \omega, \Omega, q$) are calculated by back-propagating through Earth's gravitational field and correcting for diurnal aberration and Earth's orbital velocity.

---

## 2. Atmospheric Penetration vs. Velocity Dynamics

One of the most revealing scientific relationships in meteor physics is the correlation between **geocentric velocity ($v_g$)** and **altitude at peak brightness ($H_{peak}$)**.

```
Altitude (km)
 ▲
 │                 Fast Meteors (v_g ~ 60–71 km/s)
120│             • High ablation layer (95–115 km)
 │             • Rapid thermal evaporation
100│                  • Orionids (ORI), Perseids (PER), Leonids (LEO)
 │
 80│                            Slow Meteors (v_g ~ 11–35 km/s)
 │                            • Deeper penetration (60–85 km)
 60│                            • Geminids (GEM), Taurids (STA/NTA)
 │
 40│                                  Dense Bolides (Massive Asteroidal)
 │                                  • Terminal heights < 40 km
 0 └─────────────────────────────────────────────────────────────────▶
   10      20      30      40      50      60      70      80  Velocity (km/s)
```

- **Energy Dissipation Rate:** The kinetic energy per unit mass is $E_k = \frac{1}{2} v^2$. A Leonid entering at $71\text{ km/s}$ carries nearly **28 times** more kinetic energy per gram than an asteroidal meteoroid entering at $13.5\text{ km/s}$.
- **Ablation Ceiling:** Hypervelocity meteors deposit their kinetic energy in the rarefied upper atmosphere ($95\text{–}115\text{ km}$ altitude) as high-temperature shock ionization and molecular dissociation occur before the body can penetrate deeply.
- **Deep Penetration ($< 60\text{ km}$):** Slower, mechanically coherent meteoroids (often with high bulk densities or metallic composition) survive into denser mesospheric layers, occasionally dropping meteorites.

---

## 3. Outlier Detection Methodology

Fireball Observatory identifies unusual and extreme observations using transparent, physically grounded criteria rather than black-box scoring:

| Anomaly Classification             | Physical Definition           | Observational & Physical Interpretation                                                                                                                                                                           |
| ---------------------------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Extreme Superbolide**            | $M_{abs} \le -10.0$           | Events exceeding quarter-moon brightness. Includes exceptional daylight superbolides (e.g., event `-45.57 mag` observed on 2022-02-14 with 9 synchronized stations).                                              |
| **Deep Atmospheric Penetration**   | $H_{peak} \le 50.0\text{ km}$ | High-density asteroidal debris penetrating deep into the mesosphere/stratosphere. Primary candidates for meteorite recovery searches.                                                                             |
| **Hypervelocity Trajectory**       | $v_g \ge 72.0\text{ km/s}$    | Velocities near or exceeding solar system parabolic escape velocity at 1 AU ($72.8\text{ km/s}$). Represents either hyperbolic interstellar candidates or solutions sensitive to radiant measurement uncertainty. |
| **Ultra-Long Duration**            | $\Delta t \ge 4.0\text{ s}$   | Earth-grazing trajectories entering at very shallow angles relative to local horizon, traveling hundreds of kilometers across the upper atmosphere before skipping or disintegrating.                             |
| **Extreme Multi-Station Solution** | $N_{stations} \ge 10$         | Highest-precision stereoscopic solutions with cross-validation across 10 or more independent optical cameras.                                                                                                     |

---

## 4. Observational Limitations & Data Nuances

When exploring the dataset, researchers and users must keep several observational realities in mind:

1. **Weather and Geographic Selection Effects:**
   Camera networks are concentrated in Europe, North America, Australia, and New Zealand. Clear skies and localized cloud cover introduce seasonal and geographic biases in detection frequency.
2. **Optical Saturation for Superbolides:**
   Cameras optimized to detect faint meteors ($+4\text{ mag}$) experience pixel saturation and blooming when an extreme fireball ($-12\text{ mag}$ or brighter) occurs. In such cases, magnitude estimates may carry higher photometric uncertainty.
3. **Hyperbolic Solutions ($e > 1.0$):**
   A small fraction of orbits have $e > 1.05$. While tantalizing as potential interstellar particles, small errors in radiant positioning ($\approx 0.5^\circ$) or velocity ($\approx 1\text{ km/s}$) can push an orbit with an aphelion near the Oort cloud across the parabolic boundary ($e \ge 1.0$).
4. **Clock Lock Anomaly:**
   The dataset contains exactly one record with a timestamp of `1970-01-01T00:00:00.000000Z`, resulting from a temporary GPS clock-sync lock failure on an early camera station during network initialization. In accordance with open data preservation principles, this observation is preserved faithfully without silent omission.
5. **No Direct Physical Quantities:**
   The dataset does not measure infrasound impact energy, atmospheric shock overpressure, pre-atmospheric mass, or ground impact coordinates. Absolute magnitudes and heights are purely optical trajectory solutions.
