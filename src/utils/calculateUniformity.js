import { getERequired, NORMS } from '../data/norms';

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

    // STEP 3 — Grid layout and positions
    let cols = 1;
    let rows = 1;
    let positions = [];

    if (N > 0) {
      const layoutResult = generateLuminairePositions(N, length, width, ceilingHeight, workPlaneHeight, d);
      positions = layoutResult.positions;
      cols = layoutResult.cols;
      rows = layoutResult.rows;
    }

    const spacingX = N > 0 ? (length / cols) : 0;
    const spacingY = N > 0 ? (width / rows) : 0;

    // STEP 4 — Real uniformity calculation based on point-by-point grid analysis (3 rows x 4 columns)
    const zoneRows = 3;
    const zoneCols = 4;
    const cellW = width / zoneCols;
    const cellH = length / zoneRows;
    const hmDistance = Hm > 0 ? Hm : 0.85;
    const zones = [];

    for (let r = 0; r < zoneRows; r++) {
      for (let c = 0; c < zoneCols; c++) {
        const cx = (c + 0.5) * cellW; // along width
        const cy = (r + 0.5) * cellH; // along length

        let totalContrib = 0;
        for (const p of positions) {
          // p.x is along length, p.y along width in the generator
          const dx = cx - p.y;
          const dy = cy - p.x;
          const distSq = dx * dx + dy * dy + hmDistance * hmDistance;
          totalContrib += 1.0 / distSq;
        }
        zones.push({ cx, cy, contrib: totalContrib });
      }
    }

    const roomType = formData?.room?.type || 'Bureau';
    const buildingType = formData?.occupation?.buildingType || '';
    const targetE = getERequired(roomType, buildingType);

    // Normalize zones so average matches E_real
    const avgContrib = zones.reduce((s, z) => s + z.contrib, 0) / zones.length;
    const scale = avgContrib > 0 ? E_real / avgContrib : 0;

    const computedZones = zones.map((z, i) => {
      const e = Math.round(z.contrib * scale);
      const zoneU = E_real > 0 ? Math.round((Math.min(e, E_real) / Math.max(e, E_real)) * 100) / 100 : 0;
      return {
        zone: `${((i % 4) * (width / 4)).toFixed(1)}–${(((i % 4) + 1) * (width / 4)).toFixed(1)} m × ${(Math.floor(i / 4) * (length / 3)).toFixed(1)}–${((Math.floor(i / 4) + 1) * (length / 3)).toFixed(1)} m`,
        e,
        u: zoneU,
        ok: e >= targetE,
      };
    });

    // Compute actual uniformity U0 = E_min / E_moy
    let U0 = 0.60;
    let E_min = 0;
    let E_moy = 0;
    let E_max = 0;

    if (computedZones.length > 0 && E_real > 0) {
      const luxValues = computedZones.map(z => z.e);
      E_min = Math.min(...luxValues);
      E_max = Math.max(...luxValues);
      E_moy = Math.round(luxValues.reduce((a, b) => a + b, 0) / luxValues.length);
      U0 = E_moy > 0 ? E_min / E_moy : 0;
      U0 = Math.max(0.10, Math.min(0.99, U0));
      U0 = Math.round(U0 * 100) / 100;
    }

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
      positions,
      zones: computedZones
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

/**
 * Custom layout generation based on Room aspect ratio and target number of luminaires.
 */
function generateLuminairePositions(N, length, width, height, workplane = 0.8, SHR = 1.5) {
  if (!N || N <= 0) return { positions: [], cols: 1, rows: 1 };

  const roomRatio = width / length;

  if (N === 1) {
    return {
      positions: [{ x: length / 2, y: width / 2 }],
      cols: 1,
      rows: 1
    };
  }

  if (N === 2) {
    if (roomRatio > 0.6) {
      return {
        positions: [
          { x: length * 0.50, y: width * 0.33 },
          { x: length * 0.50, y: width * 0.67 }
        ],
        cols: 1,
        rows: 2
      };
    } else {
      return {
        positions: [
          { x: length * 0.33, y: width / 2 },
          { x: length * 0.67, y: width / 2 }
        ],
        cols: 2,
        rows: 1
      };
    }
  }

  if (N === 3) {
    if (roomRatio > 0.6) {
      return {
        positions: [
          { x: length * 0.33, y: width * 0.25 },
          { x: length * 0.67, y: width * 0.25 },
          { x: length * 0.50, y: width * 0.75 }
        ],
        cols: 2,
        rows: 2
      };
    } else {
      return {
        positions: [
          { x: length * 0.25, y: width / 2 },
          { x: length * 0.50, y: width / 2 },
          { x: length * 0.75, y: width / 2 }
        ],
        cols: 3,
        rows: 1
      };
    }
  }

  if (N === 4) {
    return {
      positions: [
        { x: length * 0.25, y: width * 0.25 },
        { x: length * 0.75, y: width * 0.25 },
        { x: length * 0.25, y: width * 0.75 },
        { x: length * 0.75, y: width * 0.75 }
      ],
      cols: 2,
      rows: 2
    };
  }

  if (N === 5) {
    return {
      positions: [
        { x: length * 0.25, y: width * 0.25 },
        { x: length * 0.75, y: width * 0.25 },
        { x: length * 0.50, y: width * 0.50 },
        { x: length * 0.25, y: width * 0.75 },
        { x: length * 0.75, y: width * 0.75 }
      ],
      cols: 3,
      rows: 3
    };
  }

  if (N === 6) {
    return {
      positions: [
        { x: length * 0.25, y: width * 0.25 },
        { x: length * 0.50, y: width * 0.25 },
        { x: length * 0.75, y: width * 0.25 },
        { x: length * 0.25, y: width * 0.75 },
        { x: length * 0.50, y: width * 0.75 },
        { x: length * 0.75, y: width * 0.75 }
      ],
      cols: 3,
      rows: 2
    };
  }

  // Pour N >= 7 : recherche automatique de grille optimale
  let bestCols = 1;
  let bestRows = 1;
  let bestScore = Infinity;
  const mountingHeight = height - workplane;
  const maxSpacing = SHR * mountingHeight;

  for (let cols = 1; cols <= N; cols++) {
    const rows = Math.ceil(N / cols);
    const capacity = cols * rows;
    const spacingX = length / cols;
    const spacingY = width / rows;
    const gridRatio = cols / rows;
    const ratioPenalty = Math.abs(gridRatio - (length / width)) / (length / width);
    const asymmetryPenalty = Math.abs(spacingX - spacingY) / Math.max(spacingX, spacingY);
    const wastedPenalty = (capacity - N) / N;
    const spacingPenalty = spacingX > maxSpacing || spacingY > maxSpacing ? 10 : 0;
    const score =
      ratioPenalty      * 2   +
      asymmetryPenalty  * 1.5 +
      wastedPenalty     * 0.5 +
      spacingPenalty;
    if (score < bestScore) {
      bestScore = score;
      bestCols  = cols;
      bestRows  = rows;
    }
  }

  // Distribution équilibrée : les rangées "extra" reçoivent un luminaire de plus
  const positions = [];
  const basePerRow = Math.floor(N / bestRows);
  const extra      = N % bestRows;

  for (let row = 0; row < bestRows; row++) {
    const countInRow = basePerRow + (row < extra ? 1 : 0);
    const rowY       = (width / bestRows) * row + (width / bestRows) / 2;
    const spacingX   = length / countInRow;
    for (let col = 0; col < countInRow; col++) {
      const x = spacingX / 2 + col * spacingX;
      positions.push({
        x: Math.round(x    * 100) / 100,
        y: Math.round(rowY * 100) / 100
      });
    }
  }

  return { positions, cols: Math.ceil(N / bestRows), rows: bestRows };
}
