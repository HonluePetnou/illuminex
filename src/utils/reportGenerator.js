import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { calculateThermalComfort } from './thermalComfort';
import { NORMS } from '../data/norms';

/**
 * Calcul des recommandations et niveau d'économie pour la lumière naturelle.
 */
export function calculateDaylightRecommendations(E_moyen_naturel, E_norme_piece) {
  let status = "";
  let comment = "";
  let recs = [];
  let shortMsg = "";
  let economyMsg = "";

  if (E_moyen_naturel > 2 * E_norme_piece) {
    status = "Éclairement naturel trop élevé";
    comment = "L’apport de lumière naturelle est très important. Bien qu’il permette de réduire fortement l’éclairage artificiel, il peut également provoquer de l’éblouissement ou une gêne visuelle.";
    recs = [
      "installer des stores, rideaux ou brise-soleil ;",
      "éviter l’exposition directe prolongée des postes de travail ;",
      "utiliser des vitrages à contrôle solaire ;",
      "réorganiser les postes sensibles à l’éblouissement ;",
      "prévoir une gestion par zones de l’éclairage artificiel."
    ];
    shortMsg = "L’apport naturel est très élevé. Il permet des économies importantes, mais peut entraîner un risque d’éblouissement.";
    economyMsg = "Économie potentielle très élevée, mais à surveiller ⚡";
  } else if (E_moyen_naturel >= E_norme_piece) {
    status = "Lumière naturelle suffisante";
    comment = "L’apport de lumière naturelle est suffisant pour couvrir les besoins lumineux de la pièce durant la période analysée. L’utilisation de l’éclairage artificiel peut être fortement réduite, voire évitée pendant cette tranche horaire.";
    recs = [
      "privilégier l’éclairage naturel durant cette période ;",
      "prévoir une commande séparée des luminaires proches des ouvertures ;",
      "installer des détecteurs de luminosité ou variateurs si possible ;",
      "éviter l’allumage systématique de tous les luminaires en journée."
    ];
    shortMsg = "La lumière naturelle couvre les besoins lumineux pendant la période analysée. L’éclairage artificiel peut être fortement réduit.";
    economyMsg = "Économie potentielle élevée ✅";
  } else if (E_moyen_naturel >= 0.7 * E_norme_piece) {
    status = "Lumière naturelle partiellement suffisante";
    comment = "L’apport de lumière naturelle couvre une partie importante des besoins lumineux, mais il reste insuffisant pour garantir seul le niveau d’éclairement recommandé dans toute la pièce.";
    recs = [
      "conserver un éclairage artificiel complémentaire ;",
      "allumer prioritairement les luminaires situés dans les zones éloignées des ouvertures ;",
      "séparer les circuits d’éclairage par zones ;",
      "exploiter la lumière naturelle près des fenêtres ;",
      "éviter l’allumage complet de tous les luminaires si certaines zones sont déjà bien éclairées."
    ];
    shortMsg = "La lumière naturelle contribue significativement à l’éclairage de la pièce, mais un complément artificiel reste nécessaire.";
    economyMsg = "Économie potentielle moyenne ⚠️";
  } else if (E_moyen_naturel >= 0.3 * E_norme_piece) {
    status = "Lumière naturelle insuffisante";
    comment = "L’apport de lumière naturelle reste insuffisant pour assurer seul le confort visuel requis. L’éclairage artificiel demeure nécessaire pour atteindre le niveau recommandé.";
    recs = [
      "maintenir l’éclairage artificiel en fonctionnement ;",
      "améliorer si possible l’accès à la lumière naturelle ;",
      "utiliser des couleurs claires sur les murs et le plafond ;",
      "éviter les obstacles devant les fenêtres ;",
      "optimiser la disposition du mobilier afin de ne pas bloquer la lumière naturelle."
    ];
    shortMsg = "L’éclairage naturel ne permet pas d’atteindre seul le niveau recommandé. L’éclairage artificiel reste nécessaire.";
    economyMsg = "Économie potentielle faible ⚠️";
  } else {
    status = "Lumière naturelle très faible";
    comment = "L’apport de lumière naturelle est très faible. La pièce dépend principalement de l’éclairage artificiel pour atteindre le niveau d’éclairement recommandé.";
    recs = [
      "prévoir un éclairage artificiel permanent pendant les heures d’occupation ;",
      "améliorer les ouvertures si possible ;",
      "augmenter la réflectance des surfaces intérieures ;",
      "vérifier l’orientation du bâtiment et les éventuels masques solaires ;",
      "privilégier des luminaires LED efficaces pour limiter la consommation."
    ];
    shortMsg = "La pièce dépend principalement de l’éclairage artificiel. Les économies liées à la lumière naturelle sont limitées.";
    economyMsg = "Économie potentielle très limitée ❌";
  }

  const taux = E_norme_piece > 0 ? (E_moyen_naturel / E_norme_piece) : 0;
  const economie_pct = Math.round(Math.min(1.0, taux) * 100);

  return { status, comment, recs, shortMsg, economyMsg, economie_pct };
}


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

  const E_moyen_nat = cr.naturalLight?.E_natural || 0;
  const E_norme = lr.E_required || 300;
  const daylightInfo = calculateDaylightRecommendations(E_moyen_nat, E_norme);

  const reportData = {
    meta: {
      title: "Rapport de dimensionnement ILLUMINEX-BJ",
      buildingType: formData?.occupation?.buildingType || 'Non spécifié',
      roomType: formData?.room?.type || 'Bureau',
      date: date,
      version: "1.0",
      zone: formData?.location?.zone || 'Non spécifiée'
    },
    daylightInfo: daylightInfo,
    inputs: {
      room: {
        length: formData?.room?.length || 0,
        width: formData?.room?.width || 0,
        ceilingHeight: formData?.room?.ceilingHeight || 0,
        workPlaneHeight: formData?.room?.workPlaneHeight || 0,
        surface: lr.S || 0,
        reflectance: {
          ceiling: Math.round((parseFloat(formData?.materiaux?.rPlafond) || 0.85) * 100),
          walls:   Math.round((parseFloat(formData?.materiaux?.rMurs)    || 0.80) * 100),
          floor:   Math.round((parseFloat(formData?.materiaux?.rSol)     || 0.70) * 100),
        }
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
      totalPower: lr.totalPower || 0,
      UGR: lr.UGR || 19,
      zones: ur.zones || []
    },
    climate: {
      type:            cr.climate?.type      || 'Inconnu',
      city:            cr.climate?.city      || '',
      country:         cr.climate?.country   || '',
      season:          cr.climate?.season    || 'Inconnue',
      dayDuration:     cr.climate?.dayDuration || 0,
      E_exterior:      cr.climate?.E_exterior || 0,
      solarIrradiance: cr.climate?.solarIrradiance || 5.2,
      FLN:             cr.naturalLight?.FLN   || 0,
      E_natural:       cr.naturalLight?.E_natural || 0,
      N_adjusted:      cr.adjusted?.N_adjusted || 0,
      luminairesSaved: cr.savings?.luminairesSaved || 0,
      savingsPercent:  cr.savings?.savingsPercent  || 0,
      hourlyIrradiance: cr.hourlyIrradiance || [],
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
    thermal: calculateThermalComfort(
       formData, 
       formData?.results?.solarData || {},
       formData?.results?.solarData?.simMonth || 1,
       formData?.results?.solarData?.simHour || 12
    )
  };

  // We will compute recommendations immediately based on the generated reportData
  reportData.recommendations = generateRecommendations(reportData);

  return reportData;
}

/**
 * PART B - Auto-générer les recommandations textuelles
 * 
 * @param {Object} reportData 
 * @returns {Array} Array of strings with recommendations
 */
export function generateRecommendations(reportData) {
  const recs = { general: [], thermal: null, daylight: null };
  
  const U0 = reportData.lighting?.U0 || 0;
  const layout = reportData.lighting?.layout || {};
  const savingsPercent = reportData.climate?.savingsPercent || 0;
  const season = reportData.climate?.season || '';
  const N_adjusted = reportData.climate?.N_adjusted;
  const buildingType = reportData.inputs?.occupation?.buildingType || '';
  const cost_annual = reportData.energy?.cost_annual || 0;
  const thermalStatus = reportData.thermal?.statut || '';

  if (U0 < 0.50) {
    recs.general.push("Uniformité insuffisante. Réduire l'espacement entre les luminaires.");
  }
  
  if (savingsPercent > 50) {
    recs.general.push("L'apport en lumière naturelle est très significatif. Il est vivement conseillé d'installer des détecteurs de luminosité et des variateurs pour maximiser ces économies.");
  }

  if (season === "Pluvieuse") {
    recs.general.push("Saison pluvieuse : L'ensoleillement étant incertain, prévoir un circuit d'éclairage de secours ou renforcer l'éclairage artificiel pour les jours de forte couverture nuageuse.");
  }

  if (N_adjusted === 0 && (buildingType !== '')) {
    recs.general.push("Durant la journée, l'éclairage naturel est amplement suffisant. L'usage de l'éclairage artificiel ne s'imposera que pour la nuit ou les jours exceptionnellement sombres.");
  }

  if (buildingType === "École/Salle de classe" || buildingType === "Scolaire") {
    recs.general.push("Pour un environnement scolaire optimal, veillez à orienter les tubes/dalles LED perpendiculairement au tableau pour éviter les problèmes d'éblouissement ou de reflets perturbants.");
  }

  if (cost_annual > 100000) {
    recs.general.push("Coût d'exploitation annuel élevé (> 100 000 FCFA). Un investissement dans un système de gestion automatique centralisée (DALI, KNX) serait très vite rentabilisé sur ce projet.");
  }

  // Apport en Lumière Naturelle
  const daylightInfo = reportData.daylightInfo;
  if (daylightInfo) {
    recs.daylight = {
      status: daylightInfo.status,
      message: daylightInfo.comment,
      bullets: daylightInfo.recs
    };
  }

  if (thermalStatus === "Très confortable") {
    recs.thermal = {
      status: "Très confortable",
      message: "Les conditions thermiques de la pièce sont jugées très satisfaisantes pour les occupants. Aucun ajustement majeur n’est nécessaire.",
      bullets: [
        "Maintenir les conditions actuelles ;",
        "Assurer une ventilation régulière ;",
        "Préserver l’entretien des ouvertures et équipements de ventilation ;",
        "Optimiser l’éclairage naturel afin de réduire les consommations énergétiques."
      ]
    };
  } else if (thermalStatus === "Confortable") {
    recs.thermal = {
      status: "Confortable",
      message: "Les conditions thermiques sont globalement acceptables pour une occupation normale.",
      bullets: [
        "Favoriser la ventilation naturelle durant les périodes les moins chaudes ;",
        "Limiter les apports solaires directs pendant les heures critiques ;",
        "Utiliser des couleurs claires pour améliorer la réflexion lumineuse et limiter les gains thermiques ;",
        "Vérifier l’orientation des ouvertures."
      ]
    };
  } else if (thermalStatus === "Légèrement chaud") {
    recs.thermal = {
      status: "Légèrement chaud",
      message: "Une légère sensation d’inconfort thermique peut être ressentie par les occupants, notamment en période chaude.",
      bullets: [
        "Augmenter le renouvellement d’air naturel ou mécanique ;",
        "Installer ou améliorer les protections solaires (stores, rideaux, casquettes, brise-soleil) ;",
        "Réduire les charges internes inutiles (équipements électriques, éclairage excessif) ;",
        "Utiliser des luminaires LED à faible dégagement thermique ;",
        "Améliorer l’isolation de la toiture si possible."
      ]
    };
  } else if (thermalStatus === "Chaud") {
    recs.thermal = {
      status: "Chaud",
      message: "Les conditions thermiques sont susceptibles de provoquer un inconfort significatif pour les occupants.",
      bullets: [
        "Mettre en place une ventilation mécanique adaptée ;",
        "Réduire les surfaces vitrées exposées directement au soleil ;",
        "Installer des vitrages à contrôle solaire ;",
        "Ajouter des protections solaires extérieures ;",
        "Réduire la densité d’occupation si nécessaire ;",
        "Étudier l’intégration d’un système de climatisation performant ;",
        "Optimiser l’inertie thermique des parois."
      ]
    };
  } else if (thermalStatus === "Très chaud") {
    recs.thermal = {
      status: "Très chaud",
      message: "Les conditions thermiques observées sont défavorables au confort des occupants et nécessitent des actions correctives importantes.",
      bullets: [
        "Installer un système de refroidissement adapté ;",
        "Revoir l’orientation et la conception bioclimatique de la pièce ;",
        "Renforcer fortement les protections solaires ;",
        "Réduire les gains thermiques internes ;",
        "Ajouter une isolation thermique performante ;",
        "Étudier des solutions passives : ventilation traversante, toiture ventilée, végétalisation, brasseurs d’air ;",
        "Réaliser une analyse thermique approfondie du bâtiment."
      ]
    };
  } else if (thermalStatus === "Froid" || thermalStatus === "Frais") {
    recs.thermal = {
      status: "Frais",
      message: "Les conditions thermiques sont inférieures à la zone de confort recommandée (sensation de fraîcheur).",
      bullets: [
        "Réduire les infiltrations d’air ;",
        "Améliorer l’isolation des parois ;",
        "Augmenter les apports solaires passifs ;",
        "Vérifier l’étanchéité des ouvertures ;",
        "Étudier un système de chauffage adapté si nécessaire."
      ]
    };
  }

  return recs;
}

/**
 * PART C - Exporter le rapport au format PDF
 * 
 * @param {Object} reportData 
 */
/**
 * PART C - Exporter le rapport au format PDF (Style DIALux)
 * 
 * @param {Object} reportData 
 */
export function exportToPDF(reportData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;

  // Helpers
  const addPageHeader = (title, subtitle = null) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text("Project", margin, 20);
    
    doc.setFontSize(24);
    doc.setTextColor(29, 78, 216); // Bleu Illuminex
    doc.text("ILLUMINEX", pageWidth - margin, 20, { align: 'right' });
    
    doc.setTextColor(0, 0, 0);
    let y = 40;
    if (title) {
      doc.setFontSize(16);
      doc.text(title, margin, y);
      y += 10;
    }
    if (subtitle) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(subtitle, margin, y);
      y += 10;
    }
    return y;
  };

  const addFooter = (pageNum) => {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 150, 150);
    doc.text(`${pageNum}`, pageWidth - margin, pageHeight - 15, { align: 'right' });
  };

  // ==========================================
  // PAGE 1: COVER
  // ==========================================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text("Date", margin, 20);
  doc.setFont('helvetica', 'normal');
  doc.text(reportData.meta.date, margin + 20, 20);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(29, 78, 216);
  doc.text("ILLUMINEX", pageWidth - margin, 20, { align: 'right' });

  // Placeholder ou rendu 3D
  if (reportData.meta.coverImage) {
    try {
      doc.addImage(reportData.meta.coverImage, 'PNG', 0, 50, pageWidth, 120);
    } catch (e) {
      doc.setFillColor(245, 245, 245);
      doc.rect(0, 50, pageWidth, 120, 'F');
      doc.setTextColor(150, 150, 150);
      doc.setFontSize(12);
      doc.text("Erreur lors de l'intégration du rendu", pageWidth/2, 110, { align: 'center' });
    }
  } else {
    doc.setFillColor(245, 245, 245);
    doc.rect(0, 50, pageWidth, 120, 'F');
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(12);
    doc.text("Aperçu de l'espace simulé", pageWidth/2, 110, { align: 'center' });
  }

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text("Projet d'Éclairage", margin, 200);
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(`${reportData.meta.buildingType}`, margin, 210);
  doc.text(`Zone: ${reportData.meta.zone}`, margin, 218);
  if (reportData.meta.client) doc.text(`Client: ${reportData.meta.client}`, margin, 226);

  addFooter(1);

  // ==========================================
  // PAGE 2: TABLE OF CONTENTS
  // ==========================================
  doc.addPage();
  addPageHeader("Sommaire");

  let tocY = 60;
  const addTocEntry = (title, page) => {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(title, margin, tocY);
    const textWidth = doc.getTextWidth(title);
    const dotWidth = doc.getTextWidth('.');
    const dotsCount = Math.floor((pageWidth - margin * 2 - textWidth - 10) / dotWidth);
    doc.text('.'.repeat(Math.max(0, dotsCount)), margin + textWidth + 2, tocY);
    doc.text(`${page}`, pageWidth - margin, tocY, { align: 'right' });
    tocY += 10;
  };

  addTocEntry("Page de garde", 1);
  addTocEntry("Sommaire", 2);
  addTocEntry("Résumé de la pièce & Liste des luminaires", 3);
  addTocEntry("Plan d'implantation des luminaires", 4);
  addTocEntry("Uniformité de l'Éclairage (Carte de distribution lumineuse)", 5);
  addTocEntry("Analyse Énergétique et Confort Thermique", 6);
  
  let nextPage = 7;
  if(reportData.recommendations && ((reportData.recommendations.general && reportData.recommendations.general.length > 0) || reportData.recommendations.thermal)) {
    addTocEntry("Recommandations techniques", nextPage);
    nextPage++;
  }
  addTocEntry("Glossaire des Termes Techniques", nextPage);
  nextPage++;
  addTocEntry("Normes et Références Techniques", nextPage);

  addFooter(2);

  // ==========================================
  // PAGE 3: ROOM SUMMARY
  // ==========================================
  doc.addPage();
  let currentY = addPageHeader("Bâtiment 1 · Niveau 1 (Scène d'éclairage 1)", "Liste des pièces");

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text("Pièce 1", margin, currentY);
  currentY += 10;

  doc.setFillColor(245, 245, 245);
  doc.rect(margin, currentY, 40, 20, 'F');
  doc.rect(margin + 45, currentY, 40, 20, 'F');
  doc.rect(margin + 90, currentY, 80, 20, 'F');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text("P totale", margin + 5, currentY + 7);
  doc.text("Surface (A)", margin + 50, currentY + 7);
  doc.text("Densité de puissance d'éclairage", margin + 95, currentY + 7);

  doc.setFont('helvetica', 'normal');
  doc.text(`${Math.round(reportData.lighting.totalPower)} W`, margin + 5, currentY + 15);
  doc.text(`${reportData.inputs.room.surface.toFixed(2)} m²`, margin + 50, currentY + 15);
  const lpd = (reportData.lighting.totalPower / Math.max(reportData.inputs.room.surface, 1)).toFixed(2);
  doc.text(`${lpd} W/m²`, margin + 95, currentY + 15);

  currentY += 30;

  doc.autoTable({
    startY: currentY,
    head: [['Qté.', 'Modèle / Article', 'P unitaire', 'Efficacité']],
    body: [
      [
        `${Math.round(reportData.lighting.N)}`,
        reportData.inputs.luminaire.type,
        `${reportData.inputs.luminaire.powerPerUnit} W`,
        `${Math.round(reportData.inputs.luminaire.fluxPerUnit / Math.max(reportData.inputs.luminaire.powerPerUnit, 1))} lm/W`
      ]
    ],
    theme: 'grid',
    headStyles: { fontStyle: 'bold', fillColor: [29, 78, 216], textColor: [255, 255, 255], halign: 'center' },
    bodyStyles: { textColor: [50, 50, 50], halign: 'center' },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    margin: { left: margin, right: margin }
  });

  currentY = doc.lastAutoTable.finalY + 20;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text("Résultats", margin, currentY);
  currentY += 10;

  const targetE = Math.round(reportData.lighting.E_required);
  const realE = Math.round(reportData.lighting.E_real);
  const checkE = realE >= targetE ? '__PASS__' : '__FAIL__';
  const u0 = reportData.lighting.U0.toFixed(2);
  const checkU = reportData.lighting.U0 >= 0.40 ? '__PASS__' : '__FAIL__';
  const ugr = reportData.lighting.UGR || 19;
  const roomType = reportData.meta?.roomType || 'Bureau';
  const targetUgr = NORMS[roomType]?.ugrMax || 19;
  const checkUGR = ugr <= targetUgr ? '__PASS__' : '__FAIL__';

  doc.autoTable({
    startY: currentY,
    head: [['Propriétés', 'Calculé', 'Cible', 'Check']],
    body: [
      ['E_perpendiculaire (Plan utile)', `${realE} lx`, `>= ${targetE} lx`, checkE],
      ['Uniformité Uo (g1)', `${u0}`, `>= 0.40`, checkU],
      ['Indice d\'éblouissement (UGR)', `${ugr}`, `<= ${targetUgr}`, checkUGR],
      ['Densité de puissance', `${lpd} W/m²`, '-', '-']
    ],
    theme: 'grid',
    headStyles: { fontStyle: 'bold', fillColor: [29, 78, 216], textColor: [255, 255, 255], halign: 'center' },
    bodyStyles: { textColor: [50, 50, 50], halign: 'center' },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    margin: { left: margin, right: margin },
    didParseCell: function(data) {
      if (data.section === 'body' && data.column.index === 3) {
        if (data.cell.raw === '__PASS__' || data.cell.raw === '__FAIL__') {
          data.cell.text = ['']; // Empêcher l'affichage de texte
        }
      }
    },
    didDrawCell: function(data) {
      if (data.section === 'body' && data.column.index === 3) {
        const raw = data.cell.raw;
        if (raw === '__PASS__' || raw === '__FAIL__') {
          const x = data.cell.x + data.cell.width / 2;
          const y = data.cell.y + data.cell.height / 2;
          
          doc.setLineWidth(1.5);
          if (raw === '__PASS__') {
            // Dessiner une coche verte
            doc.setDrawColor(34, 197, 94);
            doc.line(x - 3, y, x - 1, y + 2.5);
            doc.line(x - 1, y + 2.5, x + 3, y - 3);
          } else {
            // Dessiner une croix rouge
            doc.setDrawColor(239, 68, 68);
            doc.line(x - 2.5, y - 2.5, x + 2.5, y + 2.5);
            doc.line(x + 2.5, y - 2.5, x - 2.5, y + 2.5);
          }
        }
      }
    }
  });

  currentY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text("Calculs effectués selon les recommandations de la norme EN 12464-1.", margin, currentY);
  doc.setTextColor(0, 0, 0);

  addFooter(3);

  // ==========================================
  // PAGE 4: LAYOUT PLAN
  // ==========================================
  doc.addPage();
  currentY = addPageHeader("Bâtiment 1 · Niveau 1 · Pièce 1", "Plan d'implantation des luminaires");

  const drawW = pageWidth - margin * 2;
  const drawH = 120;
  
  doc.setDrawColor(0,0,0);
  doc.setLineWidth(0.5);
  doc.rect(margin, currentY, drawW, drawH);
  
  const layout = reportData.lighting.layout || { rows: 2, cols: 2 };
  const rows = layout.rows > 0 ? layout.rows : 2;
  const cols = layout.cols > 0 ? layout.cols : 2;
  const stepX = drawW / cols;
  const stepY = drawH / rows;

  doc.setDrawColor(29, 78, 216); // luminaires en bleu
  doc.setLineWidth(0.3);

  let lumIdx = 1;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (lumIdx > reportData.lighting.N) break;
      const x = margin + (c + 0.5) * stepX;
      const y = currentY + (r + 0.5) * stepY;
      doc.rect(x - 3, y - 3, 6, 6);
      lumIdx++;
    }
  }

  currentY += drawH + 20;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Surface au sol : ${reportData.inputs.room.surface.toFixed(2)} m²`, margin, currentY);
  doc.text(`Hauteur libre : ${reportData.inputs.room.ceilingHeight.toFixed(3)} m`, margin + 70, currentY);
  
  currentY += 10;
  currentY += 10;
  doc.text(`Facteurs de réflexion : Plafond ${Math.round(reportData.inputs.room.reflectance.ceiling)}%, Murs ${Math.round(reportData.inputs.room.reflectance.walls)}%, Sol ${Math.round(reportData.inputs.room.reflectance.floor)}%`, margin, currentY);
  
  currentY += 10;
  doc.text(`Plan utile : ${reportData.inputs.room.workPlaneHeight.toFixed(3)} m`, margin, currentY);

  addFooter(4);

  // ==========================================
  // PAGE 5: LIGHT UNIFORMITY (CARTE DE DISTRIBUTION LUMINEUSE)
  // ==========================================
  doc.addPage();
  currentY = addPageHeader("Bâtiment 1 · Niveau 1 · Pièce 1", "Uniformité de l'Éclairage (Carte de distribution lumineuse)");

  const hmWidth = pageWidth - margin * 2;
  const hmHeight = 120;
  
  const E_moy = Math.round(reportData.lighting.E_real) || 500;
  const u0_val = reportData.lighting.U0 || 0.6;
  const E_min = Math.round(E_moy * u0_val);
  const E_max = Math.round(E_moy * (2 - u0_val));

  // Always show the clean analysis grid with real zone values
  currentY = drawMockGridInline(currentY);

  // Optionally add the 2D canvas capture below the grid as a supplementary visual
  if (reportData.meta.cover2DImage) {
    try {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(50, 50, 50);
      doc.text("Aperçu 2D de la simulation", margin, currentY);
      currentY += 5;
      const imgH = 70;
      doc.addImage(reportData.meta.cover2DImage, 'PNG', margin, currentY, hmWidth, imgH);
      currentY += imgH + 10;
    } catch (e) {
      console.error("Failed to add 2D capture image:", e);
    }
  }

  function drawMockGridInline(startY) {
    const realZones = reportData.lighting.zones || [];
    const hasRealZones = realZones.length === 12;

    // Always use 4 cols × 3 rows (matching the analysis grid)
    const hmCols = 4;
    const hmRows = 3;
    const cellW = hmWidth / hmCols;
    const cellH = hmHeight / hmRows;

    doc.setLineWidth(0.5);
    doc.setDrawColor(200, 200, 200);

    for (let r = 0; r < hmRows; r++) {
      for (let c = 0; c < hmCols; c++) {
        const idx = r * hmCols + c;
        const cx = margin + c * cellW;
        const cy = startY + r * cellH;
        
        let cellLux;
        if (hasRealZones) {
          cellLux = realZones[idx]?.e || 0;
        } else {
          // Fallback: distance-based estimation
          const distCenterR = Math.abs((r + 0.5) - (hmRows / 2)) / (hmRows / 2);
          const distCenterC = Math.abs((c + 0.5) - (hmCols / 2)) / (hmCols / 2);
          const dist = (distCenterR + distCenterC) / 2;
          cellLux = Math.round(E_max - dist * (E_max - E_min));
          cellLux = Math.max(E_min, Math.min(cellLux, E_max));
        }

        const targetE = reportData.lighting.E_required || 500;
        let rFill = 255, gFill = 255, bFill = 255;
        
        if (cellLux < targetE * 0.8) {
          rFill = 253; gFill = 224; bFill = 224;
        } else if (cellLux < targetE) {
          rFill = 254; gFill = 243; bFill = 199;
        } else {
          rFill = 220; gFill = 252; bFill = 231;
        }

        doc.setFillColor(rFill, gFill, bFill);
        doc.rect(cx, cy, cellW, cellH, 'FD');
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(50, 50, 50);
        
        const textW = doc.getTextWidth(cellLux.toString());
        doc.text(cellLux.toString(), cx + cellW/2 - textW/2, cy + cellH/2);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        const luxLabelW = doc.getTextWidth("Lux");
        doc.text("Lux", cx + cellW/2 - luxLabelW/2, cy + cellH/2 + 5);
      }
    }

    const legendY = startY + hmHeight + 15;
    doc.setFillColor(220, 252, 231);
    doc.rect(margin, legendY, 4, 4, 'F');
    doc.setFontSize(9);
    doc.setTextColor(50, 50, 50);
    doc.text(`>= ${reportData.lighting.E_required} lux (Bon)`, margin + 6, legendY + 3.5);

    doc.setFillColor(254, 243, 199);
    doc.rect(margin + 60, legendY, 4, 4, 'F');
    doc.text("Moyen", margin + 66, legendY + 3.5);

    doc.setFillColor(253, 224, 224);
    doc.rect(margin + 100, legendY, 4, 4, 'F');
    doc.text("Insuffisant", margin + 106, legendY + 3.5);

    return legendY + 20;
  }

  // Global Results
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text("Résultats globaux", margin, currentY);
  currentY += 8;
  
  doc.autoTable({
    startY: currentY,
    body: [
      ['Zone', `${reportData.inputs.room.length} x ${reportData.inputs.room.width} m`, 'Nb. luminaires', `${Math.round(reportData.lighting.N)}`],
      ['Puissance totale', `${Math.round(reportData.lighting.totalPower)} W`, 'Efficacité énergie', `${(reportData.lighting.totalPower / Math.max(reportData.inputs.room.surface, 1)).toFixed(2)} W/m²`],
      ['Écl. Min.', `${E_min} Lux`, 'Écl. Max.', `${E_max} Lux`]
    ],
    theme: 'grid',
    bodyStyles: { textColor: [50, 50, 50], fillColor: [245, 247, 250], halign: 'center' },
    margin: { left: margin, right: margin }
  });

  currentY = doc.lastAutoTable.finalY + 15;

  // Comment based on uniformity
  doc.setFontSize(11);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(29, 78, 216);
  let uniformiteComment = "";
  if (u0_val >= 0.70) {
    uniformiteComment = "La répartition lumineuse est excellente et très uniforme dans toute la pièce.";
  } else if (u0_val >= 0.40) {
    uniformiteComment = "L'éclairage est relativement uniforme dans la pièce, conforme aux normes recommandées.";
  } else {
    uniformiteComment = "L'éclairage présente des zones d'ombre significatives. L'uniformité est insuffisante.";
  }
  
  doc.text(uniformiteComment, margin, currentY);
  doc.setTextColor(0, 0, 0);

  addFooter(5);

  // ==========================================
  // PAGE 6: ENERGY & CLIMATE
  // ==========================================
  doc.addPage();
  currentY = addPageHeader("Bâtiment 1 · Niveau 1 · Pièce 1", "Analyse Énergétique & Confort");

  // Helper to strip emojis for PDF rendering
  const stripEmojis = (text) => {
    if (typeof text !== 'string') return text;
    return text
      .replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, '')
      .trim();
  };

  doc.autoTable({
    startY: currentY,
    head: [['Paramètre Climatique / Thermique', 'Valeur']],
    body: [
      ['Type de climat', reportData.climate.type],
      ['Ville', reportData.climate.city || '-'],
      ['Saison', reportData.climate.season],
      ['Facteur Lumière du Jour (FLN)', reportData.climate.FLN.toFixed(3)],
      ['Économie due à la lumière naturelle', stripEmojis(reportData.daylightInfo?.economyMsg || '—')],
      ['T. Extérieure / Vent', `${reportData.thermal.T2M}°C / ${reportData.thermal.WS10M}m/s`],
      ['Température ressentie', `${reportData.thermal.T_ressentie} °C`],
      ['Vent utilisé', `${reportData.thermal.WS10M} m/s`],
      ['État des ouvertures', reportData.thermal.windowsOpen ? 'ouvertes' : 'fermées'],
      ['Température de Confort', `${reportData.thermal.T_confort}°C`],
      ['Statut Thermique', reportData.thermal.statut]
    ],
    theme: 'grid',
    headStyles: { fontStyle: 'bold', fillColor: [29, 78, 216], textColor: [255, 255, 255] },
    bodyStyles: { textColor: [50, 50, 50] },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    margin: { left: margin, right: margin },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { cellWidth: 'auto' }
    }
  });

  currentY = doc.lastAutoTable.finalY + 15;

  const tarifKwh = reportData.energy?.cost_annual ? Math.round(reportData.energy.cost_annual / reportData.energy.annual) : 120;
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text("Consommation Estimée & Coûts", margin, currentY);
  currentY += 8;

  doc.autoTable({
    startY: currentY,
    head: [['Période', 'Consommation', `Coût (${tarifKwh} FCFA/kWh)`]],
    body: [
      ['Journalier', `${reportData.energy.daily.toFixed(1)} kWh`, `${Math.round(reportData.energy.cost_daily).toLocaleString()} FCFA`],
      ['Mensuel', `${reportData.energy.monthly.toFixed(1)} kWh`, `${Math.round(reportData.energy.cost_monthly).toLocaleString()} FCFA`],
      ['Annuel', `${reportData.energy.annual.toFixed(1)} kWh`, `${Math.round(reportData.energy.cost_annual).toLocaleString()} FCFA`]
    ],
    theme: 'grid',
    headStyles: { fontStyle: 'bold', fillColor: [29, 78, 216], textColor: [255, 255, 255], halign: 'center' },
    bodyStyles: { textColor: [50, 50, 50], halign: 'center' },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    margin: { left: margin, right: margin }
  });

  addFooter(6);

  // ==========================================
  // PAGE 7: RECOMMENDATIONS (Optional)
  // ==========================================
  const recsData = reportData.recommendations;
  if (recsData && ((recsData.general && recsData.general.length > 0) || recsData.thermal || recsData.daylight)) {
    doc.addPage();
    currentY = addPageHeader("Recommandations Techniques");
    
    if (recsData.general && recsData.general.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text("Éclairage et Énergie", margin, currentY);
      currentY += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      recsData.general.forEach((rec) => {
        const splitText = doc.splitTextToSize(`• ${rec}`, pageWidth - margin * 2);
        doc.text(splitText, margin, currentY);
        currentY += (splitText.length * 6) + 4;
      });
      currentY += 5;
    }

    if (recsData.daylight) {
      // Check space
      if (currentY > pageHeight - 60) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text("Apport en Lumière Naturelle", margin, currentY);
      currentY += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`Statut : ${recsData.daylight.status}`, margin, currentY);
      currentY += 6;

      doc.setFont('helvetica', 'italic');
      const msgLines = doc.splitTextToSize(recsData.daylight.message, pageWidth - margin * 2);
      doc.text(msgLines, margin, currentY);
      currentY += (msgLines.length * 5) + 4;

      doc.setFont('helvetica', 'normal');
      recsData.daylight.bullets.forEach((bullet) => {
        const bulletLines = doc.splitTextToSize(`• ${bullet}`, pageWidth - margin * 2);
        doc.text(bulletLines, margin, currentY);
        currentY += (bulletLines.length * 5) + 2;
      });
      currentY += 5;
    }

    if (recsData.thermal) {
      // Check space, if not enough, add new page
      if (currentY > pageHeight - 60) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text("Confort Thermique", margin, currentY);
      currentY += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`Statut : ${recsData.thermal.status}`, margin, currentY);
      currentY += 6;

      doc.setFont('helvetica', 'italic');
      const msgLines = doc.splitTextToSize(recsData.thermal.message, pageWidth - margin * 2);
      doc.text(msgLines, margin, currentY);
      currentY += (msgLines.length * 5) + 4;

      doc.setFont('helvetica', 'normal');
      recsData.thermal.bullets.forEach((bullet) => {
        const bulletLines = doc.splitTextToSize(`• ${bullet}`, pageWidth - margin * 2);
        doc.text(bulletLines, margin, currentY);
        currentY += (bulletLines.length * 5) + 2;
      });
    }

    addFooter(doc.internal.getNumberOfPages());
  }

  // ==========================================
  // PAGE 7: GLOSSAIRE
  // ==========================================
  doc.addPage();
  currentY = addPageHeader("Glossaire des Termes Techniques");
  
  const terms = [
    { title: "Éclairement moyen (E_moyen)", text: "Décrit le rapport entre le flux lumineux qui frappe une certaine surface et la taille de cette surface (lm/m² = lx). Il s'agit de la moyenne de la lumière reçue sur le plan de travail, sans évaluer la perception humaine." },
    { title: "Uniformité (U0 ou g1)", text: "Désigne l'uniformité globale de l'éclairement sur une surface. Il s'agit du quotient de E_min (minimum) sur E_moyen, exigé par la norme EN 12464-1 pour assurer un confort visuel sans taches d'ombres." },
    { title: "Éblouissement d'inconfort (UGR)", text: `Unified Glare Rating. Mesure de l'effet d'éblouissement psychologique en intérieur. Plus la valeur est faible, moins le luminaire est éblouissant. Un UGR <= ${NORMS[reportData.meta?.roomType]?.ugrMax || 19} est recommandé pour ce type de local.` },
    { title: "Facteur de maintenance (MF)", text: "Facteur sous forme de nombre décimal qui décrit la réduction du flux lumineux au fil du temps (salissure des luminaires et baisse de rendement de la source). Souvent pris à 0.80 pour les environnements propres." },
    { title: "Densité de puissance d'éclairage (LPD)", text: "Lighting Power Density. Ratio de la puissance électrique totale consommée par l'éclairage divisée par la surface de la pièce (exprimé en W/m²). Un LPD bas indique une bonne efficacité énergétique." },
    { title: "Facteur Lumière du Jour (FLN)", text: "Rapport entre l'éclairement intérieur dû uniquement à la lumière du jour et l'éclairement horizontal extérieur. Un FLN élevé (souvent supérieur à 2%) permet de réduire l'éclairage artificiel en journée." }
  ];

  terms.forEach(term => {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(term.title, margin, currentY);
    currentY += 6;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(term.text, pageWidth - margin * 2);
    doc.text(lines, margin, currentY);
    currentY += (lines.length * 5) + 6;
  });

  addFooter(doc.internal.getNumberOfPages());

  // ==========================================
  // PAGE: NORMES ET RÉFÉRENCES
  // ==========================================
  doc.addPage();
  currentY = addPageHeader("Normes, données climatiques et références techniques utilisées");

  doc.autoTable({
    startY: currentY + 10,
    head: [['Référence', 'Utilisation dans le rapport']],
    body: [
      ['EN 12464-1:2021', 'Valeurs d\'éclairement, uniformité minimale et UGR pour les lieux de travail intérieurs'],
      ['CIE 97:2005', 'Facteur de maintenance et dépréciation du flux lumineux'],
      ['IESNA Lighting Handbook, 10e éd.', 'Méthode des lumens, coefficient d\'utilisation, principes de répartition lumineuse'],
      ['EN 15251:2007', 'Modèle de confort thermique adaptatif'],
      ['ASHRAE Standard 55-2020', 'Critères généraux de confort thermique des occupants'],
      ['EN 410:2011', 'Propriétés lumineuses et solaires des vitrages'],
      ['NASA POWER', 'Données climatiques : température, vent, irradiance solaire']
    ],
    theme: 'grid',
    headStyles: { fontStyle: 'bold', fillColor: [29, 78, 216], textColor: [255, 255, 255], halign: 'left' },
    bodyStyles: { textColor: [50, 50, 50] },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    margin: { left: margin, right: margin },
    columnStyles: {
      0: { cellWidth: 50, fontStyle: 'bold' }
    }
  });

  addFooter(doc.internal.getNumberOfPages());

  // Add Page Numbers (Correction pour toutes les pages si nécessaire, mais géré par addFooter)
  const cleanDate = reportData.meta.date.replace(/\//g, '-');
  doc.save(`ILLUMINEX_Rapport_${cleanDate}.pdf`);
}

