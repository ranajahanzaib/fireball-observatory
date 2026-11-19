# Data Dictionary & Scientific Semantics

## Dataset Provenance

- **Dataset Name:** Global Meteor Network Trajectory Data
- **Source Repository:** [Hugging Face: juliensimon/global-meteor-network](https://huggingface.co/datasets/juliensimon/global-meteor-network)
- **Source Revision:** `a4fa100587ced657b6f16b35ea7234fcb9c59294`
- **License:** Creative Commons Attribution 4.0 International (CC BY 4.0)
- **Original Curator:** Julien Simon
- **Underlying Observation Network:** [Global Meteor Network (GMN)](https://globalmeteornetwork.org), volunteer-operated multi-station all-sky video cameras worldwide.
- **Total Records:** 3,707,142 meteor trajectory solutions
- **Temporal Coverage:** 2018-12-10T01:06:56Z through 2024-07-02T13:46:17Z (plus 1 clock anomaly record at 1970-01-01T00:00:00Z)

---

## Column Specifications

The original Parquet dataset contains 15 columns per record. Every column is preserved in original scientific units.

| Column Name          | Source Type     | Semantic Meaning                                     | Units                            | Valid / Typical Range     | Handling of Extremes & Nulls                                                                                                                       |
| -------------------- | --------------- | ---------------------------------------------------- | -------------------------------- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `datetime_utc`       | `Timestamp(ns)` | Peak brightness timestamp in UTC                     | UTC ISO-8601 string              | 2018-12-10 to present     | Zero nulls. Formatted to millisecond precision (`YYYY-MM-DDTHH:MM:SS.sssZ`).                                                                       |
| `shower_code`        | `LargeUtf8`     | IAU meteor shower code or sporadic marker            | 3-character code                 | e.g. `PER`, `GEM`, `...`  | `...` indicates a sporadic background meteor (2,698,702 records). 427 IAU showers (1,008,440 records).                                             |
| `radiant_ra_deg`     | `Float64`       | Geocentric apparent radiant Right Ascension          | Degrees ($^\circ$)               | $[0.0, 360.0)$            | Celestial coordinate (J2000).                                                                                                                      |
| `radiant_dec_deg`    | `Float64`       | Geocentric apparent radiant Declination              | Degrees ($^\circ$)               | $[-90.0, +90.0]$          | Celestial coordinate (J2000).                                                                                                                      |
| `v_g_kms`            | `Float64`       | Geocentric entry velocity outside Earth's atmosphere | $\text{km/s}$                    | $[11.0, 74.0]$            | Physical lower bound is Earth's escape velocity (~11.2 km/s); solar escape velocity at 1 AU is ~72.8 km/s.                                         |
| `a_au`               | `Float64`       | Semi-major axis of heliocentric orbit                | Astronomical Units ($\text{AU}$) | $(0, \infty)$ or negative | Can be negative for hyperbolic orbits ($e > 1.0$), representing unbound interstellar or severe measurement error trajectories. Null/NaN preserved. |
| `e`                  | `Float64`       | Orbital eccentricity                                 | Dimensionless                    | $[0.0, \infty)$           | $e < 1.0$: elliptical; $e = 1.0$: parabolic; $e > 1.0$: hyperbolic.                                                                                |
| `i_deg`              | `Float64`       | Orbital inclination to ecliptic plane                | Degrees ($^\circ$)               | $[0.0, 180.0]$            | $i > 90^\circ$ denotes retrograde orbital motion (e.g., Perseids, Orionids).                                                                       |
| `peri_deg`           | `Float64`       | Argument of perihelion ($\omega$)                    | Degrees ($^\circ$)               | $[0.0, 360.0)$            | Keplerian orbital orientation angle.                                                                                                               |
| `node_deg`           | `Float64`       | Longitude of the ascending node ($\Omega$)           | Degrees ($^\circ$)               | $[0.0, 360.0)$            | Keplerian orbital plane intersection angle with ecliptic.                                                                                          |
| `q_au`               | `Float64`       | Perihelion distance                                  | Astronomical Units ($\text{AU}$) | $(0.0, \infty)$           | Closest orbital distance to the Sun. For Earth-intersecting orbits, typically $q \le 1.017\text{ AU}$.                                             |
| `peak_abs_magnitude` | `Float64`       | Absolute magnitude at peak brightness                | Stellar magnitude                | $[-45.57, +11.83]$        | Standard astronomical definition: normalized to a hypothetical distance of 100 km at zenith. Negative numbers mean brighter events.                |
| `peak_height_km`     | `Float64`       | Altitude above mean sea level at peak brightness     | Kilometers ($\text{km}$)         | $[19.7, 169.5]$           | Typical meteor ablation layer is between 75 km and 115 km. Values $< 50\text{ km}$ represent massive, deeply penetrating bolides.                  |
| `duration_sec`       | `Float64`       | Visible atmospheric trajectory duration              | Seconds ($\text{s}$)             | $[0.01, 15.6]$            | Time span during which video cameras maintained automated tracking.                                                                                |
| `n_stations`         | `Int64`         | Number of synchronized observing stations            | Integer count                    | $[2, 38]$                 | Minimum is 2 for stereoscopic triangulation. Higher station counts yield more robust trajectory solutions.                                         |

---

## Critical Astronomical Definitions

### 1. Absolute Magnitude ($M_V$ or $M_{abs}$)

In optical meteor astronomy, the **absolute magnitude** of a meteor is defined differently from stellar astronomy:
$$M_{abs} = m_{app} - 5 \log_{10}\left(\frac{R}{100\text{ km}}\right) - \Delta M_{ext}$$
where:

- $m_{app}$ is the apparent visual magnitude observed by the camera.
- $R$ is the slant range distance from the camera to the meteor in kilometers.
- The standard normalization distance is **100 km at the observer's zenith**.
- $\Delta M_{ext}$ is the atmospheric extinction correction.

Because stellar magnitudes are logarithmic with an inverse base ($\sqrt[5]{100} \approx 2.512$):

- Magnitude $0.0$: Brightness comparable to the star Vega.
- Magnitude $-4.0$: Brightness comparable to the planet Venus at maximum elongation.
- Magnitude $-10.0$: Quarter Moon brightness.
- Magnitude $-12.6$: Full Moon brightness.
- Magnitude $-26.7$: Daytime Sun brightness.

### 2. Operational Fireball Threshold

In the astronomical literature (International Meteor Organization and IAU Commission F1), a **fireball** is generally defined as any meteor reaching an absolute magnitude of **$-4.0$ or brighter** ($M_{abs} \le -4.0$).

> **Important:** The original Global Meteor Network Parquet dataset **does not contain an explicit fireball boolean column**. Fireball Observatory calculates this classification dynamically based on the configurable threshold `peak_abs_magnitude <= threshold` (defaulting to $-4.0$). Users can adjust this threshold dynamically in the UI (e.g. $-3.0$ or $-6.0$).

Across the 3,707,142 records in the dataset, exactly **14,484 meteors** meet the standard operational threshold ($M_{abs} \le -4.0$).

### 3. Shower Codes & Sporadic Meteors

- `shower_code = "..."` indicates a **sporadic meteor** (background interplanetary dust particle not associated with a recognized annual meteor shower). Sporadics account for **72.8% (2,698,702 records)** of the entire dataset.
- 3-letter strings (e.g., `PER`, `GEM`, `ETA`, `LEO`, `QUA`) correspond to official codes established by the **IAU Meteor Data Center (MDC)**.
- Unrecognized or non-standard 3-letter codes are labeled faithfully as `Shower <CODE>` without fabricating shower associations.

### 4. Keplerian & Hyperbolic Orbit Semantics

- **Elliptical Orbit ($e < 1.0$, $a > 0$):** Bound to the Solar System. Most meteoroids originate from comets or asteroids within the Kuiper Belt, Oort cloud, or Main Asteroid Belt.
- **Hyperbolic Trajectories ($e > 1.0$, $a < 0$ or non-finite):** Trajectories with speeds exceeding solar system escape velocity ($v_{\infty} > 0$). While true interstellar meteoroids exist (such as the parent bodies 1I/'Oumuamua and 2I/Borisov), high-eccentricity meteor solutions frequently arise from tiny astrometric or timing measurement errors amplified through orbital back-propagation. Fireball Observatory preserves and highlights these observations with transparent scientific notes.

---

## Stable Event Identifiers

To guarantee permalink persistence and URL safety, Fireball Observatory assigns each event a deterministic identifier:

```
gmn_YYYYMMDD_HHMMSS_ffffff_XXXX
```

- `YYYYMMDD`: UTC calendar date
- `HHMMSS`: UTC time (hours, minutes, seconds)
- `ffffff`: Fractional second microseconds (6 digits)
- `XXXX`: 4-character deterministic hex hash of the physical parameters (`radiant_ra`, `radiant_dec`, `v_g`, `peak_mag`, `n_stations`) to resolve any theoretical microsecond timestamp collisions.

Across all 3,707,142 records in the GMN dataset, **zero duplicate timestamps exist**, ensuring 100% collision-free identification.
