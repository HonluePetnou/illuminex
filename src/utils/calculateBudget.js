/**
 * calculateBudget.js
 * Centralise tous les calculs de coûts et consommation énergétique.
 * Utilisé par ScreenBudget et ScreenRapport.
 */
import { COUT_KWH_PAR_PAYS } from '../data/luminaires-library';

/**
 * Calcule les estimations budgétaires et la consommation énergétique.
 *
 * @param {Object} formData   — état global du formulaire
 * @param {Object} lightingResult — résultat de calculateLighting
 * @returns {Object} budgetResult
 */
export function calculateBudget(formData, lightingResult) {
  const N          = lightingResult?.N          || 0;
  const totalPower = lightingResult?.totalPower || 0;

  const prixUnitaire  = parseFloat(formData?.luminaire?.prix)            || 0;
  const coutInstall   = parseFloat(formData?.budget?.coutInstallation)   || 0;
  const heuresParJour = parseFloat(formData?.budget?.heuresParJour)      || parseFloat(formData?.occupation?.hoursPerDay) || 8;
  const daysPerWeek   = parseFloat(formData?.occupation?.daysPerWeek)    || 5;

  // Coût kWh selon le pays — avec fallback
  const country = formData?.location?.country || 'default';
  const coutKwh = parseFloat(formData?.budget?.coutKwh)
    || COUT_KWH_PAR_PAYS[country]
    || COUT_KWH_PAR_PAYS['default'];

  // ── Estimation budgétaire ──────────────────────────────────────
  const coutLuminaires = N * prixUnitaire;
  const coutTotal      = coutLuminaires + coutInstall;

  // ── Consommation énergétique ──────────────────────────────────
  // Formules document de référence :
  // Puissance totale = N × puissance_unitaire (W)
  // Coût mensuel     = (Puissance_totale × heures_jour × 30) / 1000 × coût_kWh
  // Coût annuel      = Coût_mensuel × 12

  const kwhParJour  = (totalPower * heuresParJour) / 1000;
  const coutJour    = kwhParJour * coutKwh;

  const kwhMensuel  = kwhParJour * 30;
  const coutMensuel = kwhMensuel * coutKwh;

  const kwhAnnuel   = kwhMensuel * 12;
  const coutAnnuel  = coutMensuel * 12;

  // Jours ouvrés (pour info)
  const kwhParSemaine = kwhParJour * daysPerWeek;

  return {
    // Budgétaire
    coutLuminaires,
    coutInstall,
    coutTotal,
    prixUnitaire,

    // Énergie
    puissanceTotale: totalPower,
    heuresParJour,
    coutKwh,

    kwhParJour,
    coutJour,
    kwhMensuel,
    coutMensuel,
    kwhAnnuel,
    coutAnnuel,
    kwhParSemaine,
  };
}
