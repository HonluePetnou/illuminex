import jsPDF from 'jspdf';

/**
 * PDFExporter - Générateur de rapport PDF bilingue pour ILLUMINEX-BJ
 * Toutes les étiquettes et titres sont en français.
 */
export class PDFExporter {
  constructor() {
    this.doc = new jsPDF();
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.margin = 20;
    this.contentWidth = this.pageWidth - (this.margin * 2);
  }

  addHeader(title) {
    this.doc.setFontSize(20);
    this.doc.setFont(undefined, 'bold');
    this.doc.text(title, this.margin, 30);
    
    this.doc.setDrawColor(29, 78, 216); // Bleu ILLUMINEX
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, 35, this.pageWidth - this.margin, 35);
    
    this.doc.setFontSize(10);
    this.doc.setFont(undefined, 'normal');
    this.doc.text(`Généré le : ${new Date().toLocaleString('fr-FR')}`, this.margin, 45);
  }

  addSection(title, content) {
    const yPosition = this.doc.lastAutoTable ? this.doc.lastAutoTable.finalY + 20 : 55;
    
    this.doc.setFontSize(14);
    this.doc.setFont(undefined, 'bold');
    this.doc.text(title, this.margin, yPosition);
    
    this.doc.setFontSize(10);
    this.doc.setFont(undefined, 'normal');
    
    const lines = this.doc.splitTextToSize(content, this.contentWidth);
    this.doc.text(lines, this.margin, yPosition + 10);
    
    return yPosition + 10 + (lines.length * 5);
  }

  addTable(headers, data) {
    const yPosition = this.doc.lastAutoTable ? this.doc.lastAutoTable.finalY + 20 : 55;
    
    this.doc.autoTable({
      head: [headers],
      body: data,
      startY: yPosition,
      theme: 'grid',
      headStyles: {
        fillColor: [29, 78, 216],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 250]
      },
      margin: { left: this.margin, right: this.margin }
    });
  }

  addCalculations(calculations) {
    const yPosition = this.doc.lastAutoTable ? this.doc.lastAutoTable.finalY + 20 : 55;
    
    this.doc.setFontSize(14);
    this.doc.setFont(undefined, 'bold');
    this.doc.text('Résultats des Calculs Photométriques', this.margin, yPosition);
    
    const calcData = [
      ['Flux total installé', `${calculations.totalLuminosity || 0} lm`],
      ['Éclairement moyen', `${calculations.averageIlluminance || 0} lux`],
      ['Puissance consommée', `${calculations.powerConsumption || 0} W`],
      ['Efficacité lumineuse', `${Math.round((calculations.totalLuminosity || 0) / Math.max(calculations.powerConsumption || 1, 1))} lm/W`]
    ];
    
    this.doc.autoTable({
      body: calcData,
      startY: yPosition + 10,
      theme: 'grid',
      margin: { left: this.margin, right: this.margin },
      columnStyles: {
        0: { fontStyle: 'bold', fillColor: [240, 240, 240] }
      }
    });
  }

  addImage(imageData, title) {
    const yPosition = this.doc.lastAutoTable ? this.doc.lastAutoTable.finalY + 20 : 55;
    
    this.doc.setFontSize(14);
    this.doc.setFont(undefined, 'bold');
    this.doc.text(title, this.margin, yPosition);
    
    const imgWidth = this.contentWidth;
    const imgHeight = 100;
    
    this.doc.addImage(imageData, 'PNG', this.margin, yPosition + 10, imgWidth, imgHeight);
  }

  save(filename = 'illuminex-bj-rapport.pdf') {
    this.doc.save(filename);
  }

  static async exportScene(sceneData, calculations, canvas) {
    const exporter = new PDFExporter();
    
    // En-tête du rapport
    exporter.addHeader('Rapport de dimensionnement ILLUMINEX-BJ');
    
    // Informations du projet
    let yPosition = exporter.addSection(
      'Informations du Projet',
      `Ce rapport contient les résultats de l'analyse d'éclairage ILLUMINEX-BJ. ` +
      `L'analyse inclut les calculs de flux lumineux, d'éclairement et d'estimation de consommation d'énergie.`
    );
    
    // Configuration de la scène
    const sceneConfig = [
      ['Paramètre', 'Valeur'],
      ['Position du luminaire', `(${(sceneData.lightPosition || [0,0,0]).map(v => v.toFixed(2)).join(', ')})`],
      ['Intensité lumineuse', (sceneData.lightIntensity || 0).toFixed(2)],
      ['Couleur de la lumière', sceneData.lightColor || '-'],
      ['Dimensions de la pièce', '7 m × 6 m × 3 m'],
      ['Matériaux des surfaces', 'Surfaces diffuses standard']
    ];
    
    exporter.addTable(['Paramètre', 'Valeur'], sceneConfig);
    
    // Résultats de calcul
    exporter.addCalculations(calculations);
    
    // Capture d'écran si disponible
    if (canvas) {
      try {
        const imageData = canvas.toDataURL('image/png');
        exporter.addImage(imageData, 'Visualisation 3D de la Scène');
      } catch (error) {
        console.warn('Impossible de capturer le canvas pour le PDF :', error);
      }
    }
    
    // Recommandations
    const recommendations = [
      'Utiliser des luminaires LED pour une meilleure efficacité énergétique',
      'Optimiser le placement des luminaires pour réduire les zones d\'ombre',
      'Implémenter un système de détection de lumière naturelle',
      'Utiliser des variateurs pour un contrôle flexible de l\'éclairage'
    ];
    
    exporter.addSection(
      'Recommandations Techniques',
      recommendations.join('\n• ')
    );
    
    // Enregistrer le PDF
    exporter.save();
  }
}

export default PDFExporter;
