import { evaluate } from 'mathjs';

export class LightingCalculator {
  constructor() {
    this.constants = {
      LUMEN_PER_WATT_LED: 100,
      LUMEN_PER_WATT_INCANDESCENT: 15,
      LUMEN_PER_WATT_FLUORESCENT: 60,
      REFLECTANCE_DARK: 0.1,
      REFLECTANCE_MEDIUM: 0.5,
      REFLECTANCE_LIGHT: 0.8,
      MAINTENANCE_FACTOR: 0.8,
      COEFFICIENT_OF_UTILIZATION: 0.7
    };
  }

  calculateLuminosity(intensity, distance, angle = 0) {
    // Luminous intensity in candela
    const luminousIntensity = intensity * 1000; // Convert from relative units
    
    // Calculate luminous flux (lumens) using inverse square law
    const luminousFlux = luminousIntensity * 4 * Math.PI * Math.pow(distance, 2);
    
    // Apply angle correction (Lambert's cosine law)
    const angleCorrection = Math.cos(angle * Math.PI / 180);
    
    return Math.round(luminousFlux * angleCorrection);
  }

  calculateIlluminance(luminousFlux, area, reflectance = this.constants.REFLECTANCE_MEDIUM) {
    // Illuminance in lux (lumens per square meter)
    const directIlluminance = luminousFlux / area;
    
    // Apply reflectance (interreflections)
    const totalIlluminance = directIlluminance * (1 + reflectance);
    
    // Apply maintenance factor
    const maintainedIlluminance = totalIlluminance * this.constants.MAINTENANCE_FACTOR;
    
    return Math.round(maintainedIlluminance);
  }

  calculatePowerConsumption(luminousFlux, bulbType = 'LED') {
    const lumenPerWatt = this.constants[`LUMEN_PER_WATT_${bulbType.toUpperCase()}`];
    return Math.round((luminousFlux / lumenPerWatt) * 10) / 10;
  }

  calculateEnergyEfficiency(luminousFlux, powerConsumption) {
    return Math.round(luminousFlux / powerConsumption);
  }

  calculateRoomLighting(roomDimensions, lightPositions, lightIntensities) {
    const { length, width, height } = roomDimensions;
    const roomArea = length * width;
    const roomVolume = length * width * height;
    
    let totalLuminosity = 0;
    let totalPowerConsumption = 0;
    
    // Calculate for each light source
    lightPositions.forEach((position, index) => {
      const intensity = lightIntensities[index] || 1;
      const distance = Math.sqrt(
        Math.pow(position[0], 2) + 
        Math.pow(position[1], 2) + 
        Math.pow(position[2], 2)
      );
      
      const luminosity = this.calculateLuminosity(intensity, distance);
      const power = this.calculatePowerConsumption(luminosity);
      
      totalLuminosity += luminosity;
      totalPowerConsumption += power;
    });
    
    // Calculate average illuminance
    const averageIlluminance = this.calculateIlluminance(
      totalLuminosity, 
      roomArea,
      this.constants.REFLECTANCE_MEDIUM
    );
    
    // Calculate uniformity ratio
    const uniformityRatio = this.calculateUniformityRatio(lightPositions, lightIntensities, roomDimensions);
    
    return {
      totalLuminosity,
      averageIlluminance,
      totalPowerConsumption,
      energyEfficiency: this.calculateEnergyEfficiency(totalLuminosity, totalPowerConsumption),
      uniformityRatio,
      roomArea,
      roomVolume,
      recommendedLuxLevel: this.getRecommendedLuxLevel('office')
    };
  }

  calculateUniformityRatio(lightPositions, lightIntensities, roomDimensions) {
    // Simplified uniformity calculation
    const { length, width } = roomDimensions;
    const roomArea = length * width;
    
    // Calculate illuminance at different points
    const testPoints = [
      [0, 0], [length/2, 0], [length, 0],
      [0, width/2], [length/2, width/2], [length, width/2],
      [0, width], [length/2, width], [length, width]
    ];
    
    const illuminanceValues = testPoints.map(point => {
      let totalIlluminance = 0;
      
      lightPositions.forEach((position, index) => {
        const intensity = lightIntensities[index] || 1;
        const distance = Math.sqrt(
          Math.pow(point[0] - position[0], 2) + 
          Math.pow(point[1] - position[1], 2) + 
          Math.pow(position[2], 2)
        );
        
        const luminosity = this.calculateLuminosity(intensity, distance);
        totalIlluminance += this.calculateIlluminance(luminosity, 1); // Per square meter
      });
      
      return totalIlluminance;
    });
    
    const minIlluminance = Math.min(...illuminanceValues);
    const maxIlluminance = Math.max(...illuminanceValues);
    const averageIlluminance = illuminanceValues.reduce((a, b) => a + b, 0) / illuminanceValues.length;
    
    return {
      min: minIlluminance,
      max: maxIlluminance,
      average: averageIlluminance,
      uniformityRatio: minIlluminance / averageIlluminance
    };
  }

  getRecommendedLuxLevel(roomType) {
    const recommendations = {
      'office': 500,
      'classroom': 300,
      'hospital': 500,
      'retail': 750,
      'warehouse': 200,
      'residential': 150,
      'corridor': 100
    };
    
    return recommendations[roomType] || 300;
  }

  calculateOptimalLighting(roomDimensions, targetLuxLevel, bulbType = 'LED') {
    const { length, width, height } = roomDimensions;
    const roomArea = length * width;
    
    // Calculate required luminous flux
    const requiredFlux = (targetLuxLevel * roomArea) / 
      (this.constants.COEFFICIENT_OF_UTILIZATION * this.constants.MAINTENANCE_FACTOR);
    
    // Calculate required power
    const lumenPerWatt = this.constants[`LUMEN_PER_WATT_${bulbType.toUpperCase()}`];
    const requiredPower = requiredFlux / lumenPerWatt;
    
    // Recommend number of fixtures
    const typicalFixtureOutput = lumenPerWatt * 10; // 10W per fixture
    const numberOfFixtures = Math.ceil(requiredFlux / typicalFixtureOutput);
    
    return {
      requiredLuminousFlux: Math.round(requiredFlux),
      requiredPower: Math.round(requiredPower),
      recommendedFixtures: numberOfFixtures,
      fixtureSpacing: Math.sqrt(roomArea / numberOfFixtures),
      estimatedEnergyCost: this.calculateAnnualEnergyCost(requiredPower)
    };
  }

  calculateAnnualEnergyCost(powerConsumption, hoursPerDay = 8, costPerKWh = 0.12) {
    const dailyConsumption = (powerConsumption * hoursPerDay) / 1000; // Convert to kWh
    const annualConsumption = dailyConsumption * 365;
    const annualCost = annualConsumption * costPerKWh;
    
    return {
      dailyConsumption: Math.round(dailyConsumption * 100) / 100,
      annualConsumption: Math.round(annualConsumption * 100) / 100,
      annualCost: Math.round(annualCost * 100) / 100
    };
  }

  evaluateLightingQuality(calculations) {
    const { averageIlluminance, uniformityRatio, energyEfficiency } = calculations;
    const recommendedLux = this.getRecommendedLuxLevel('office');
    
    let score = 0;
    let recommendations = [];
    
    // Illuminance adequacy
    if (averageIlluminance >= recommendedLux * 0.9 && averageIlluminance <= recommendedLux * 1.1) {
      score += 30;
    } else if (averageIlluminance < recommendedLux * 0.9) {
      recommendations.push('Increase light levels to meet recommended standards');
    } else {
      recommendations.push('Consider reducing light levels to save energy');
    }
    
    // Uniformity
    if (uniformityRatio >= 0.7) {
      score += 30;
    } else {
      recommendations.push('Improve light distribution for better uniformity');
    }
    
    // Energy efficiency
    if (energyEfficiency >= 80) {
      score += 40;
    } else if (energyEfficiency >= 60) {
      score += 30;
    } else {
      recommendations.push('Consider more efficient lighting technology');
    }
    
    return {
      overallScore: score,
      grade: score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F',
      recommendations
    };
  }
}

export default LightingCalculator;
