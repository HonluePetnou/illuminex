export function calculateThermalComfort(formData, climateData, month, hour) {
  const ALLSKY = climateData?.ALLSKY || 0;
  const T2M = climateData?.T2M || 28;
  const WS10M = climateData?.WS10M || 3;

  const room = formData?.room || {};
  const glazingType = room.glazingType || 'Double standard';
  
  const GLAZING = {
    'Simple vitrage': { T: 0.85, SHGC: 0.85 },
    'Double standard': { T: 0.72, SHGC: 0.65 },
    'Double low-E': { T: 0.65, SHGC: 0.35 },
    'Triple vitrage': { T: 0.55, SHGC: 0.25 },
    'Vitrage teinté': { T: 0.45, SHGC: 0.25 }
  };
  const SHGC = GLAZING[glazingType]?.SHGC || 0.65;

  const L = parseFloat(room.length) || 7;
  const W = parseFloat(room.width) || 6;
  const H = parseFloat(room.ceilingHeight) || 3;

  const S_sol = L * W;
  const S_murs = 2 * (L + W) * H;
  const S_totale = S_sol * 2 + S_murs;
  const S_fenetres = parseFloat(formData?.naturalLight?.windowArea) || 0;
  const ratioFenetres = S_totale > 0 ? (S_fenetres / S_totale) : 0;

  const windowsOpen = formData?.naturalLight?.windowsOpen !== false;

  const T_rm = T2M;
  const T_confort = 0.31 * T_rm + 17.8;

  let DeltaT_gain_solaire = 0;
  let DeltaT_vent = 0;
  let T_ressentie = 0;
  let plageConf = '';

  if (windowsOpen) {
    DeltaT_gain_solaire = (ALLSKY / 1000) * SHGC * ratioFenetres * 2.5;
    DeltaT_vent = 0.15 * Math.max(0, WS10M - 0.2);
    T_ressentie = T2M + DeltaT_gain_solaire - DeltaT_vent;

    if (T_ressentie < T_confort - 3.5) plageConf = 'Trop froid';
    else if (T_ressentie <= T_confort + 2.5) plageConf = 'Confortable';
    else if (T_ressentie <= T_confort + 3.5) plageConf = 'Légèrement chaud';
    else plageConf = 'Trop chaud';

  } else {
    DeltaT_gain_solaire = (ALLSKY / 1000) * SHGC * ratioFenetres * 4.0;
    DeltaT_vent = 0;
    T_ressentie = T2M + DeltaT_gain_solaire;

    if (T_ressentie < T_confort - 3.5) plageConf = 'Trop froid';
    else if (T_ressentie <= T_confort + 3.5) plageConf = 'Confortable';
    else if (T_ressentie <= T_confort + 4.5) plageConf = 'Légèrement chaud';
    else plageConf = 'Trop chaud';
  }

  const conseils = [];
  if (glazingType === 'Simple vitrage' && (formData?.location?.climate?.includes('ropical') || formData?.location?.climate?.includes('quatorial'))) {
    conseils.push("Vitrage : Passer au double vitrage low-E réduira les apports thermiques tout en gardant une bonne lumière naturelle.");
  }
  if (!windowsOpen && T_ressentie > T_confort + 1.5) {
    conseils.push(`Fenêtres : Ouvrir les fenêtres pourrait réduire la température ressentie d'environ ${DeltaT_vent.toFixed(1)}°C grâce à la ventilation.`);
  }

  return {
    T2M: T2M.toFixed(1),
    WS10M: WS10M.toFixed(1),
    T_confort: T_confort.toFixed(1),
    T_ressentie: T_ressentie.toFixed(1),
    DeltaT_gain_solaire: DeltaT_gain_solaire.toFixed(2),
    DeltaT_vent: DeltaT_vent.toFixed(2),
    statut: plageConf,
    conseils,
    glazingType,
    windowsOpen
  };
}
