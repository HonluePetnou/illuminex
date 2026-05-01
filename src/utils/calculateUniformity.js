/**
 * Uniformity and Layout Calculation Engine (Pure JavaScript)
 * Calculates the grid layout, spacing validity, uniformity status, and coordinates for the 2D visual simulation.
 *
 * @param {Object} formData User inputs from the form (room dimensions, luminaire type, etc.)
 * @param {Object} lightingResult Results from the calculateLighting function (N, E_real, S)
 * @returns {Object} Uniformity analysis and grid layout coordinate array
 */
export function calculateUniformity(formData, lightingResult) {
  try {
    // Safely extract values to prevent calculation errors
    const length = parseFloat(formData?.room?.length) || 10;
    const width = parseFloat(formData?.room?.width) || 10;
    const ceilingHeight = parseFloat(formData?.room?.ceilingHeight) || 3.0;
    const workPlaneHeight = parseFloat(formData?.room?.workPlaneHeight) || 0.85;
    const luminaireType = formData?.luminaire?.type || 'Autre';

    const rMoyen = parseFloat(formData?.materiaux?.rMoyen) || 0.50;

    const N = lightingResult?.N || 0;
    const E_real = lightingResult?.E_real || 0;

    // STEP 1 — Spacing factor by luminaire type
    let d = 1.0;
    if (luminaireType.toLowerCase().includes('tube')) {
      d = 1.5;
    } else if (luminaireType.toLowerCase().includes('dalle')) {
      d = 1.2;
    } else if (luminaireType.toLowerCase().includes('led')) {
      d = 1.0;
    }

    // STEP 2 — Max allowed spacing
    const Hm = ceilingHeight - workPlaneHeight;
    const S_max = d * (Hm > 0 ? Hm : 1);

    // STEP 3 — Grid layout
    // cols based on room aspect ratio so spacing is as square as possible
    let cols = 1;
    let rows = 1;

    if (N > 0) {
      cols = Math.ceil(Math.sqrt(N * length / width));
      if (cols < 1) cols = 1;
      rows = Math.ceil(N / cols);
    }

    const spacingX = length / cols;
    const spacingY = width / rows;

    // STEP 4 — Real uniformity calculation based on spacing analysis
    // U0 depends on: spacing vs max spacing, asymmetry, and surface reflectance
    const maxSpacingRatio = Math.max(spacingX, spacingY) / S_max;
    const asymmetry = Math.max(spacingX, spacingY) > 0
      ? Math.abs(spacingX - spacingY) / Math.max(spacingX, spacingY)
      : 0;

    // Reflectance bonus: higher average reflectance → more inter-reflections → better uniformity
    // rMoyen typically 0.3–0.85; centered around 0.5
    const reflectanceBonus = (rMoyen - 0.50) * 0.10;

    let baseU0;
    if (maxSpacingRatio <= 0.8) {
      baseU0 = 0.85;
    } else if (maxSpacingRatio <= 1.0) {
      // Linear interpolation: 0.85 → 0.70
      baseU0 = 0.85 - (maxSpacingRatio - 0.8) * 0.75;
    } else if (maxSpacingRatio <= 1.5) {
      // Linear interpolation: 0.70 → 0.50
      baseU0 = 0.70 - (maxSpacingRatio - 1.0) * 0.40;
    } else {
      baseU0 = Math.max(0.25, 0.50 - (maxSpacingRatio - 1.5) * 0.30);
    }

    let U0 = baseU0 - asymmetry * 0.08 + reflectanceBonus;
    U0 = Math.max(0.10, Math.min(0.95, U0));
    U0 = Math.round(U0 * 100) / 100;

    // Derived illuminance values
    const E_min = Math.round(E_real * U0);
    const E_moy = Math.round(E_real);
    const E_max = Math.round(E_real * (2 - U0)); // symmetric assumption

    // STEP 5 — Conformity check
    let status = "Insuffisante";
    let statusColor = "#ef4444";

    if (U0 >= 0.70) {
      status = "Excellente";
      statusColor = "#22c55e";
    } else if (U0 >= 0.50) {
      status = "Acceptable";
      statusColor = "#f59e0b";
    }

    // STEP 6 — Spacing conformity
    let spacingWarning = false;
    let warningMessage = null;

    if (spacingX > S_max || spacingY > S_max) {
      spacingWarning = true;
      warningMessage = "Espacement trop grand, ajouter des luminaires";
    }

    // STEP 7 — Grid positions
    const positions = [];
    if (N > 0) {
      let count = 0;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (count < N) {
            const x = (spacingX / 2) + (c * spacingX);
            const y = (spacingY / 2) + (r * spacingY);

            positions.push({
              x: Math.round(x * 100) / 100,
              y: Math.round(y * 100) / 100
            });
            count++;
          }
        }
      }
    }

    return {
      U0,
      E_min,
      E_moy,
      E_max,
      status,
      statusColor,
      layout: {
        rows,
        cols,
        spacingX: Math.round(spacingX * 100) / 100,
        spacingY: Math.round(spacingY * 100) / 100,
        S_max: Math.round(S_max * 100) / 100,
        spacingWarning,
        warningMessage
      },
      positions
    };

  } catch (error) {
    console.error("Uniformity calculation failed:", error);
    return {
      U0: 0, E_min: 0, E_moy: 0, E_max: 0,
      status: "Insuffisante", statusColor: "#ef4444",
      layout: { rows: 0, cols: 0, spacingX: 0, spacingY: 0, S_max: 0, spacingWarning: false, warningMessage: null },
      positions: []
    };
  }
}
