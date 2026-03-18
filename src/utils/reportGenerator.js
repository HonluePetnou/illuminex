import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

/**
 * PART A - Assembler les données pour le générateur de rapport
 * 
 * @param {Object} formData 
 * @param {Object} allResults 
 * @returns {Object} Structured report data
 */
export function buildReportData(formData, allResults) {
  const date = new Date().toLocaleDateString('fr-FR');
  const lr = allResults.lighting || {};
  const ur = allResults.uniformity || {};
  const cr = allResults.climate || {};
  const usar = allResults.usage || {};
  const nlr = allResults.naturalLight || {};

  return {
    meta: {
      title: "Rapport de dimensionnement ILLUMINEX-BJ",
      buildingType: formData?.occupation?.buildingType || 'Non spécifié',
      date: date,
      version: "1.0",
      zone: formData?.location?.zone || 'Non spécifiée'
    },
    inputs: {
      room: {
        length: formData?.room?.length || 0,
        width: formData?.room?.width || 0,
        ceilingHeight: formData?.room?.ceilingHeight || 0,
        workPlaneHeight: formData?.room?.workPlaneHeight || 0,
        surface: lr.S || 0
      },
      occupation: {
        buildingType: formData?.occupation?.buildingType || '',
        occupationType: formData?.occupation?.occupationType || '',
        occupants: formData?.occupation?.occupants || 0,
        hoursPerDay: formData?.occupation?.hoursPerDay || 0,
        daysPerWeek: formData?.occupation?.daysPerWeek || 0
      },
      luminaire: {
        type: formData?.luminaire?.type || '',
        fluxPerUnit: formData?.luminaire?.fluxPerUnit || 0,
        powerPerUnit: formData?.luminaire?.powerPerUnit || 0
      },
      naturalLight: {
        hasWindows: formData?.naturalLight?.hasWindows || false,
        orientation: formData?.naturalLight?.orientation || '',
        windowArea: formData?.naturalLight?.windowArea || 0
      }
    },
    lighting: {
      N: lr.N || 0,
      E_real: lr.E_real || 0,
      E_required: lr.E_required || 0,
      RI: lr.RI || 0,
      CU: lr.CU || 0,
      MF: lr.MF || 0,
      U0: ur.U0 || 0,
      U0_status: ur.status || 'Inconnu',
      U0_color: ur.statusColor || '#000',
      layout: ur.layout || { rows: 0, cols: 0, spacingX: 0, spacingY: 0, spacingWarning: false, S_max: 0 },
      totalPower: lr.totalPower || 0
    },
    climate: {
      season: cr.climate?.season || 'Inconnue',
      dayDuration: cr.climate?.dayDuration || 0,
      FLN: cr.naturalLight?.FLN || 0,
      E_natural: cr.naturalLight?.E_natural || 0,
      N_adjusted: cr.adjusted?.N_adjusted || 0,
      luminairesSaved: cr.savings?.luminairesSaved || 0,
      savingsPercent: cr.savings?.savingsPercent || 0
    },
    energy: {
      H_real: usar.usageFactors?.H_real || 0,
      simultaneity: usar.usageFactors?.simultaneity || 0.8,
      daily: usar.consumption?.daily || 0,
      monthly: usar.consumption?.monthly || 0,
      annual: usar.consumption?.annual || 0,
      cost_daily: usar.cost?.daily || 0,
      cost_monthly: usar.cost?.monthly || 0,
      cost_annual: usar.cost?.annual || 0,
      annualSavings: usar.savings?.annualSavings || 0,
      savingsPercent: usar.savings?.savingsPercent || 0
    },
    solar: {
      sunriseHour: nlr.solar?.sunriseHour || 6,
      sunsetHour: nlr.solar?.sunsetHour || 18,
      daylightHours: nlr.solar?.daylightHours || 12,
      hoursNatural: nlr.summary?.hoursNatural || 0,
      hoursMixed: nlr.summary?.hoursMixed || 0,
      hoursArtificial: nlr.summary?.hoursArtificial || 0,
      hourlyProfile: nlr.hourlyProfile || []
    },
    // We will compute recommendations immediately based on the generated reportData
    recommendations: generateRecommendations({
       inputs: formData,
       lighting: { ...lr, ...ur },
       climate: cr,
       energy: usar
    })
  };
}

/**
 * PART B - Auto-générer les recommandations textuelles
 * 
 * @param {Object} reportData 
 * @returns {Array} Array of strings with recommendations
 */
export function generateRecommendations(reportData) {
  const recs = [];
  
  const U0 = reportData.lighting?.U0 || 0;
  const layout = reportData.lighting?.layout || {};
  const savingsPercent = reportData.climate?.savingsPercent || 0;
  const season = reportData.climate?.season || '';
  const N_adjusted = reportData.climate?.N_adjusted;
  const buildingType = reportData.inputs?.occupation?.buildingType || '';
  const cost_annual = reportData.energy?.cost_annual || 0;

  if (U0 < 0.50) {
    recs.push("⚠️ Uniformité insuffisante. Réduire l'espacement entre les luminaires.");
  }
  
  if (layout.spacingWarning) {
    recs.push(`⚠️ Espacement trop grand détecté. Envisager d'ajouter des luminaires ou d'ajuster leur hauteur.`);
  }

  if (savingsPercent > 50) {
    recs.push("✅ L'apport en lumière naturelle est très significatif. Il est vivement conseillé d'installer des détecteurs de luminosité et des variateurs pour maximiser ces économies.");
  }

  if (season === "Pluvieuse") {
    recs.push("🌧️ Saison pluvieuse : L'ensoleillement étant incertain, prévoir un circuit d'éclairage de secours ou renforcer l'éclairage artificiel pour les jours de forte couverture nuageuse.");
  }

  if (N_adjusted === 0 && (buildingType !== '')) {
    recs.push("☀️ Durant la journée, l'éclairage naturel est amplement suffisant. L'usage de l'éclairage artificiel ne s'imposera que pour la nuit ou les jours exceptionnellement sombres.");
  }

  if (buildingType === "École/Salle de classe" || buildingType === "Scolaire") {
    recs.push("📚 Pour un environnement scolaire optimal, veillez à orienter les tubes/dalles LED perpendiculairement au tableau pour éviter les problèmes d'éblouissement ou de reflets perturbants.");
  }

  if (cost_annual > 100000) {
    recs.push("💡 Coût d'exploitation annuel élevé (> 100 000 FCFA). Un investissement dans un système de gestion automatique centralisée (DALI, KNX) serait très vite rentabilisé sur ce projet.");
  }

  return recs;
}

/**
 * PART C - Exporter le rapport au format PDF
 * 
 * @param {Object} reportData 
 */
export function exportToPDF(reportData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = 20;

  // Helpers
  const generateHeader = (title) => {
    doc.setFillColor(29, 78, 216); // #1D4ED8
    doc.rect(0, currentY, pageWidth, 12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 14, currentY + 8);
    doc.setTextColor(0, 0, 0);
    currentY += 20;
  };

  const addPageBrand = () => {
    doc.setTextColor(29, 78, 216);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text("ILLUMINEX-BJ", pageWidth - 45, 10);
    doc.setTextColor(0, 0, 0);
  };

  // ============================================
  // PAGE 1 : COVER PAGE
  // ============================================
  addPageBrand();
  
  doc.setFontSize(24);
  doc.setTextColor(29, 78, 216);
  doc.setFont('helvetica', 'bold');
  const title = "RAPPORT DE DIMENSIONNEMENT\nD'ÉCLAIRAGE";
  doc.text(title, pageWidth / 2, 100, { align: 'center' });

  doc.setFontSize(16);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  doc.text(`${reportData.meta.buildingType} - Zone : ${reportData.meta.zone}`, pageWidth / 2, 125, { align: 'center' });

  doc.setLineWidth(0.5);
  doc.setDrawColor(29, 78, 216);
  doc.line(pageWidth / 4, 135, (pageWidth / 4) * 3, 135);

  doc.setFontSize(12);
  doc.text(`Date d'édition : ${reportData.meta.date}`, pageWidth / 2, 150, { align: 'center' });
  doc.text(`Logiciel : ILLUMINEX v${reportData.meta.version}`, pageWidth / 2, 160, { align: 'center' });

  doc.addPage();
  currentY = 20;
  addPageBrand();

  // ============================================
  // PAGE 2 : DONNÉES D'ENTRÉE ET RÉSULTATS
  // ============================================
  generateHeader("DONNÉES D'ENTRÉE (CAHIER DES CHARGES)");

  doc.autoTable({
    startY: currentY,
    head: [['Paramètre', 'Valeur saisie']],
    body: [
      ['Dimension pièce (L x l)', `${reportData.inputs.room.length} m × ${reportData.inputs.room.width} m`],
      ['Surface totale', `${reportData.inputs.room.surface.toFixed(2)} m²`],
      ['Hauteur sous plafond / Plan utile', `${reportData.inputs.room.ceilingHeight} m / ${reportData.inputs.room.workPlaneHeight} m`],
      ['Type de bâtiment', reportData.inputs.occupation.buildingType],
      ['Heures d\'utilisation', `${reportData.inputs.occupation.hoursPerDay}h/j - ${reportData.inputs.occupation.daysPerWeek}j/semaine`],
      ['Type de luminaire', reportData.inputs.luminaire.type],
      ['Performance unitaire', `${reportData.inputs.luminaire.fluxPerUnit} lm / ${reportData.inputs.luminaire.powerPerUnit} W`],
      ['Apport naturel', reportData.inputs.naturalLight.hasWindows ? `Oui, Orientation ${reportData.inputs.naturalLight.orientation}` : 'Non']
    ],
    theme: 'striped',
    headStyles: { fillColor: [29, 78, 216] },
    alternateRowStyles: { fillColor: [243, 244, 246] }
  });

  currentY = doc.lastAutoTable.finalY + 15;
  generateHeader("RÉSULTATS DU CALCUL PHOTOMÉTRIQUE");

  doc.autoTable({
    startY: currentY,
    head: [['Critère', 'Valeur issue du calcul', 'Obligation']],
    body: [
      ['Éclairement cible (E_rec)', `${Math.round(reportData.lighting.E_required)} lux`, 'Norme'],
      ['Nombre calculé de luminaires (N)', `${Math.round(reportData.lighting.N)} unités`, '-'],
      ['Éclairement moyen réel', `${Math.round(reportData.lighting.E_real)} lux`, 'Norme'],
      ['Indice du local (K)', reportData.lighting.RI?.toFixed(2), '-'],
      ['Facteur de maintenance (MF)', reportData.lighting.MF?.toFixed(2), '-'],
      ['Uniformité moyenne (U0)', reportData.lighting.U0?.toFixed(2), '>= 0.70 recommandé'],
      ['Puissance totale instantanée', `${Math.round(reportData.lighting.totalPower)} W`, '-']
    ],
    theme: 'striped',
    headStyles: { fillColor: [29, 78, 216] }
  });

  currentY = doc.lastAutoTable.finalY + 15;
  
  // Badge Uniformité
  doc.setFont('helvetica', 'normal');
  doc.text("Statut de l'uniformité :", 14, currentY);
  const u0_status = reportData.lighting.U0_status;
  
  let fillStatusColor = [239, 68, 68]; // Red
  if (u0_status === 'Excellente') fillStatusColor = [34, 197, 94]; // Green
  else if (u0_status === 'Acceptable') fillStatusColor = [245, 158, 11]; // Amber

  doc.setFillColor(fillStatusColor[0], fillStatusColor[1], fillStatusColor[2]);
  doc.rect(55, currentY - 5, 40, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text(u0_status, 75, currentY, { align: 'center' });
  doc.setTextColor(0, 0, 0);

  doc.addPage();
  currentY = 20;
  addPageBrand();

  // ============================================
  // PAGE 3 : CLIMAT ET PROFIL D'USAGE (FINANCES)
  // ============================================
  generateHeader("IMPACT CLIMATIQUE ET OPTIMISATION SOLAIRE");

  doc.autoTable({
    startY: currentY,
    head: [['Paramètre Solaire', 'Analyse']],
    body: [
      ['Saison estimée', reportData.climate.season],
      ['Éclairement naturel (extérieur)', `${Math.round(reportData.climate.E_exterior)} lux`],
      ['Facteur de Lumière du Jour (FLN)', `${reportData.climate.FLN.toFixed(3)}`],
      ['Luminaires inutiles en journée', `${reportData.climate.luminairesSaved} sur ${reportData.lighting.N}`],
      ['Taux d\'économie par la lumière naturelle', `${reportData.climate.savingsPercent.toFixed(1)} %`]
    ],
    theme: 'grid',
    headStyles: { fillColor: [29, 78, 216] }
  });

  currentY = doc.lastAutoTable.finalY + 15;
  generateHeader("ESTIMATION DE LA CONSOMMATION ÉNERGÉTIQUE");

  doc.autoTable({
    startY: currentY,
    head: [['Indicateur', 'Consommation', 'Coût estimé (SBEE : 98 FCFA/kWh)']],
    body: [
      ['Journalier', `${reportData.energy.daily.toFixed(1)} kWh`, `${Math.round(reportData.energy.cost_daily).toLocaleString()} FCFA`],
      ['Mensuel', `${reportData.energy.monthly.toFixed(1)} kWh`, `${Math.round(reportData.energy.cost_monthly).toLocaleString()} FCFA`],
      ['Annuel', `${reportData.energy.annual.toFixed(1)} kWh`, `${Math.round(reportData.energy.cost_annual).toLocaleString()} FCFA`]
    ],
    theme: 'grid',
    headStyles: { fillColor: [29, 78, 216] }
  });

  currentY = doc.lastAutoTable.finalY + 10;
  
  if (reportData.energy.annualSavings > 0) {
    doc.setTextColor(34, 197, 94);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`🌟 ECONOMIE ANNUELLE REALISEE FACE AU GASPILLAGE : ${Math.round(reportData.energy.annualSavings).toLocaleString()} FCFA / an`, 14, currentY);
    doc.setTextColor(0,0,0);
  }

  // ============================================
  // PAGE 4 : RECOMMANDATIONS PROFESSIONNELLES
  // ============================================
  doc.addPage();
  currentY = 20;
  addPageBrand();

  generateHeader("RECOMMANDATIONS TECHNIQUES - ILLUMINEX");

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');

  const recs = reportData.recommendations;
  
  if (recs && recs.length > 0) {
    recs.forEach((rec, index) => {
      const splitText = doc.splitTextToSize(`${index + 1}. ${rec}`, pageWidth - 28);
      doc.text(splitText, 14, currentY);
      currentY += (splitText.length * 6) + 4;
    });
  } else {
    doc.text("L'installation mathématique semble parfaitement conforme. Aucune alerte levée.", 14, currentY);
  }

  // Add Page Numbers
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.text(`Page ${i} / ${pageCount}`, pageWidth - 20, doc.internal.pageSize.getHeight() - 10);
  }

  // DOWNLOAD COMMAND
  const cleanDate = reportData.meta.date.replace(/\//g, '-');
  doc.save(`ILLUMINEX_Rapport_${cleanDate}.pdf`);
}
