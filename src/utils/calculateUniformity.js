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
    const length = parseFloat(formData?.room?.length) || 1;
    const width = parseFloat(formData?.room?.width) || 1;
    const ceilingHeight = parseFloat(formData?.room?.ceilingHeight) || 3.0;
    const workPlaneHeight = parseFloat(formData?.room?.workPlaneHeight) || 0.85;
    const luminaireType = formData?.luminaire?.type || 'Autre';

    const N = lightingResult?.N || 0;
    const E_real = lightingResult?.E_real || 0;

    // STEP 1 — Spacing factor by luminaire type
    let d = 1.0;
    if (luminaireType === "Tube LED") {
      d = 1.5;
    } else if (luminaireType === "Dalle LED") {
      d = 1.2;
    } else if (luminaireType === "Ampoule LED") {
      d = 1.0;
    }

    // STEP 2 — Max allowed spacing
    // Hm = ceilingHeight - workPlaneHeight
    // S_max = d × Hm
    const Hm = ceilingHeight - workPlaneHeight;
    const S_max = d * (Hm > 0 ? Hm : 1);

    // STEP 3 — Grid layout
    // cols = Math.ceil(Math.sqrt(N × length / width))
    // rows = Math.ceil(N / cols)
    let cols = 1;
    let rows = 1;
    
    if (N > 0) {
      cols = Math.ceil(Math.sqrt(N * length / width));
      if (cols < 1) cols = 1; // Safeguard
      rows = Math.ceil(N / cols);
    }
    
    // spacingX = length / cols  (spacing between columns)
    // spacingY = width / rows   (spacing between rows)
    const spacingX = length / cols;
    const spacingY = width / rows;

    // STEP 4 — Uniformity calculation
    // E_min = E_real × 0.7 (simplified: min is ~70% of average for good LED layout)
    // U0 = E_min / E_real
    const E_min = E_real * 0.7;
    const U0 = E_real > 0 ? E_min / E_real : 0;

    // STEP 5 — Conformity check
    // U0 >= 0.70 → status: "Excellente" ✅
    // U0 >= 0.50 → status: "Acceptable" ⚠️
    // U0 <  0.50 → status: "Insuffisante" ❌
    let status = "Insuffisante";
    let statusColor = "#ef4444"; // Red
    
    // We use a small tolerance buffer (0.699) due to JS float math.
    // Given our exact formula (0.7 * E_real / E_real), U0 will essentially be 0.7.
    if (U0 >= 0.699) {
      status = "Excellente";
      statusColor = "#22c55e"; // Green
    } else if (U0 >= 0.50) {
      status = "Acceptable";
      statusColor = "#f59e0b"; // Amber
    } else {
      status = "Insuffisante";
      statusColor = "#ef4444"; // Red
    }

    // STEP 6 — Spacing conformity
    // if spacingX > S_max OR spacingY > S_max:
    //   spacingWarning: true, message: "Espacement trop grand, ajouter des luminaires"
    let spacingWarning = false;
    let warningMessage = null;
    
    if (spacingX > S_max || spacingY > S_max) {
      spacingWarning = true;
      warningMessage = "Espacement trop grand, ajouter des luminaires";
    }

    // STEP 7 — Grid positions (for 2D simulation later)
    // Generate array of {x, y} coordinates for each luminaire:
    // First luminaire at (spacingX/2, spacingY/2), then increment
    const positions = [];
    if (N > 0) {
      let count = 0;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          // Only map up to exactly N luminaires
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

    // RETURN this object
    return {
      U0: Math.round(U0 * 100) / 100, // Format U0 like 0.70
      E_min: Math.round(E_min), // Round lux 
      E_moy: Math.round(E_real), // Round lux
      status: status,
      statusColor: statusColor,
      layout: {
        rows: rows,
        cols: cols,
        spacingX: Math.round(spacingX * 100) / 100,
        spacingY: Math.round(spacingY * 100) / 100,
        S_max: Math.round(S_max * 100) / 100,
        spacingWarning: spacingWarning,
        warningMessage: warningMessage
      },
      positions: positions
    };

  } catch (error) {
    console.error("Uniformity calculation failed:", error);
    // Return safe fallback
    return {
      U0: 0, E_min: 0, E_moy: 0, 
      status: "Insuffisante", statusColor: "#ef4444",
      layout: { rows: 0, cols: 0, spacingX: 0, spacingY: 0, S_max: 0, spacingWarning: false, warningMessage: null },
      positions: []
    };
  }
}
