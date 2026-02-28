import jsPDF from 'jspdf';

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
    
    this.doc.setDrawColor(99, 102, 241);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, 35, this.pageWidth - this.margin, 35);
    
    this.doc.setFontSize(10);
    this.doc.setFont(undefined, 'normal');
    this.doc.text(`Generated on: ${new Date().toLocaleString()}`, this.margin, 45);
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
        fillColor: [99, 102, 241],
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
    this.doc.text('Lighting Calculations', this.margin, yPosition);
    
    const calcData = [
      ['Total Luminosity', `${calculations.totalLuminosity} lm`],
      ['Average Illuminance', `${calculations.averageIlluminance} lux`],
      ['Power Consumption', `${calculations.powerConsumption} W`],
      ['Energy Efficiency', `${Math.round(calculations.totalLuminosity / calculations.powerConsumption)} lm/W`]
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

  save(filename = 'illuminex-report.pdf') {
    this.doc.save(filename);
  }

  static async exportScene(sceneData, calculations, canvas) {
    const exporter = new PDFExporter();
    
    // Add header
    exporter.addHeader('Illuminex Lighting Analysis Report');
    
    // Add project information
    let yPosition = exporter.addSection(
      'Project Information',
      `This report contains the lighting analysis results for the Illuminex 3D simulation. ` +
      `The analysis includes luminosity calculations, illuminance measurements, and power consumption estimates.`
    );
    
    // Add scene configuration
    const sceneConfig = [
      ['Parameter', 'Value'],
      ['Light Position', `(${sceneData.lightPosition.map(v => v.toFixed(2)).join(', ')})`],
      ['Light Intensity', sceneData.lightIntensity.toFixed(2)],
      ['Light Color', sceneData.lightColor],
      ['Room Dimensions', '10m × 10m × 5m'],
      ['Surface Materials', 'Standard diffuse surfaces']
    ];
    
    exporter.addTable(['Parameter', 'Value'], sceneConfig);
    
    // Add calculations
    exporter.addCalculations(calculations);
    
    // Add canvas screenshot if available
    if (canvas) {
      try {
        const imageData = canvas.toDataURL('image/png');
        exporter.addImage(imageData, '3D Scene Visualization');
      } catch (error) {
        console.warn('Could not capture canvas for PDF export:', error);
      }
    }
    
    // Add recommendations
    const recommendations = [
      'Consider using LED bulbs for better energy efficiency',
      'Optimize light placement to reduce shadows',
      'Implement daylight harvesting where possible',
      'Use dimmers for flexible lighting control'
    ];
    
    exporter.addSection(
      'Recommendations',
      recommendations.join('\n• ')
    );
    
    // Save the PDF
    exporter.save();
  }
}

export default PDFExporter;
