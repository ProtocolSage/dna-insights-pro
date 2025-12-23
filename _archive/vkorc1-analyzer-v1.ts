/**
 * VKORC1 Pharmacogenomics Analyzer
 * 
 * VKORC1 (Vitamin K Epoxide Reductase Complex Subunit 1) is THE most important
 * gene for warfarin dosing - accounts for 25-30% of dose variability.
 * 
 * KEY CONCEPTS:
 * - VKORC1 is the molecular target of warfarin
 * - Genetic variants affect warfarin sensitivity (not metabolism)
 * - Different from CYP2C9 which affects warfarin clearance
 * - COMBINED CYP2C9 + VKORC1 explains 40-50% of dose variance
 * 
 * CRITICAL VARIANT: rs9923231 (-1639G>A)
 * - A allele = INCREASED warfarin sensitivity = LOWER doses needed
 * - Located in promoter region, affects VKORC1 expression
 * - AA genotype: need 30-50% LESS warfarin than GG
 * - Most important single variant for warfarin dosing
 * 
 * HAPLOTYPE GROUPS:
 * Group A (high sensitivity): Contains rs9923231 A allele - LOW dose
 * Group B (low sensitivity): Contains rs9923231 G allele - HIGH dose
 * 
 * CLINICAL IMPACT:
 * - AA genotype: Start 0.5-2mg/day, target ~21mg/week
 * - AG genotype: Start 2-3mg/day, target ~28mg/week
 * - GG genotype: Start 5-7mg/day, target ~42mg/week
 * 
 * FDA-APPROVED DOSING ALGORITHMS:
 * - IWPC (International Warfarin Pharmacogenetics Consortium)
 * - Gage algorithm
 * - Both integrate VKORC1 + CYP2C9 + clinical factors
 */

export interface VKORC1Haplotype {
  name: string;
  rs9923231: string; // -1639G>A (THE critical variant)
  rs9934438?: string; // Additional tagging SNP
  sensitivity: 'High' | 'Intermediate' | 'Low';
  frequency: string;
  description: string;
}

export interface VKORC1Genotype {
  rs9923231Genotype: string;
  haplotypeGroup: 'A' | 'B' | 'A/B';
  sensitivity: 'High' | 'Intermediate' | 'Low';
  confidence: 'high' | 'medium' | 'low';
}

export interface WarfarinDosingEstimate {
  weeklyDose: {
    low: number;
    high: number;
    target: number;
  };
  startingDose: {
    low: number;
    high: number;
    recommended: number;
  };
  vkorc1Contribution: string;
  cyp2c9Contribution: string;
  combinedRisk: string;
  adjustmentFactors: string[];
}

export interface VKORC1AnalysisResult {
  genotype: VKORC1Genotype;
  clinicalSummary: string;
  warfarinDosing: WarfarinDosingEstimate;
  safetyAlerts: string[];
  monitoringRecommendations: string[];
  populationContext: string;
  fdaGuidance: string[];
}

// VKORC1 Haplotype Definitions
export const VKORC1_HAPLOTYPES: Record<string, VKORC1Haplotype> = {
  'Group_A': {
    name: 'Group A (High Sensitivity)',
    rs9923231: 'A/A',
    sensitivity: 'High',
    frequency: '10-15% Europeans, 85-90% Asians',
    description: 'High warfarin sensitivity - requires LOW doses (30-50% reduction)'
  },
  'Group_A/B': {
    name: 'Group A/B (Intermediate Sensitivity)',
    rs9923231: 'A/G or G/A',
    sensitivity: 'Intermediate',
    frequency: '40-50% Europeans, 5-10% Asians',
    description: 'Intermediate warfarin sensitivity - requires MODERATE dose reduction (15-25%)'
  },
  'Group_B': {
    name: 'Group B (Low Sensitivity)',
    rs9923231: 'G/G',
    sensitivity: 'Low',
    frequency: '35-45% Europeans, 1-5% Asians',
    description: 'Low warfarin sensitivity - requires STANDARD or HIGHER doses'
  }
};

/**
 * Determine VKORC1 genotype and warfarin sensitivity
 */
export function determineVKORC1Genotype(
  rs9923231: string | null
): VKORC1Genotype {
  if (!rs9923231) {
    return {
      rs9923231Genotype: 'Unknown',
      haplotypeGroup: 'B', // Assume low sensitivity (safer - higher doses)
      sensitivity: 'Low',
      confidence: 'low'
    };
  }

  const normalized = rs9923231.replace('/', '').toUpperCase();
  
  if (normalized === 'AA') {
    return {
      rs9923231Genotype: 'A/A',
      haplotypeGroup: 'A',
      sensitivity: 'High',
      confidence: 'high'
    };
  } else if (normalized === 'AG' || normalized === 'GA') {
    return {
      rs9923231Genotype: 'A/G',
      haplotypeGroup: 'A/B',
      sensitivity: 'Intermediate',
      confidence: 'high'
    };
  } else if (normalized === 'GG') {
    return {
      rs9923231Genotype: 'G/G',
      haplotypeGroup: 'B',
      sensitivity: 'Low',
      confidence: 'high'
    };
  }

  // Unknown genotype format
  return {
    rs9923231Genotype: rs9923231,
    haplotypeGroup: 'B',
    sensitivity: 'Low',
    confidence: 'low'
  };
}

/**
 * Calculate warfarin dosing estimate based on VKORC1 + CYP2C9
 * Integrates both genes for comprehensive dosing guidance
 */
export function calculateWarfarinDosing(
  vkorc1Sensitivity: string,
  cyp2c9Phenotype?: string // Optional - from CYP2C9 analyzer
): WarfarinDosingEstimate {
  // Base weekly doses by VKORC1 genotype (mg/week)
  let baseWeeklyDose = { low: 35, high: 49, target: 42 }; // GG baseline
  let baseStartingDose = { low: 5, high: 7, recommended: 5 }; // GG baseline

  // Adjust for VKORC1
  if (vkorc1Sensitivity === 'High') {
    // AA genotype - HIGH sensitivity
    baseWeeklyDose = { low: 14, high: 28, target: 21 };
    baseStartingDose = { low: 0.5, high: 2, recommended: 1 };
  } else if (vkorc1Sensitivity === 'Intermediate') {
    // AG genotype - INTERMEDIATE sensitivity  
    baseWeeklyDose = { low: 21, high: 35, target: 28 };
    baseStartingDose = { low: 2, high: 4, recommended: 3 };
  }

  const adjustmentFactors: string[] = [];
  let vkorc1Contribution = '';
  let cyp2c9Contribution = 'Not analyzed';
  let combinedRisk = 'Moderate';

  // VKORC1 contribution
  if (vkorc1Sensitivity === 'High') {
    vkorc1Contribution = 'HIGH SENSITIVITY - Requires 30-50% dose reduction';
    adjustmentFactors.push('VKORC1 AA: Reduce dose by 30-50%');
    combinedRisk = 'Elevated';
  } else if (vkorc1Sensitivity === 'Intermediate') {
    vkorc1Contribution = 'MODERATE SENSITIVITY - Requires 15-25% dose reduction';
    adjustmentFactors.push('VKORC1 AG: Reduce dose by 15-25%');
  } else {
    vkorc1Contribution = 'LOW SENSITIVITY - Standard or higher dosing';
    adjustmentFactors.push('VKORC1 GG: Standard dosing');
  }

  // CYP2C9 contribution (if provided)
  if (cyp2c9Phenotype) {
    if (cyp2c9Phenotype.includes('Poor')) {
      cyp2c9Contribution = 'POOR METABOLIZER - Additional 50-75% reduction needed';
      adjustmentFactors.push('CYP2C9 PM: Reduce dose by 50-75%');
      
      // Compound reduction
      baseWeeklyDose.target *= 0.35; // 65% total reduction
      baseWeeklyDose.low *= 0.25;
      baseWeeklyDose.high *= 0.5;
      baseStartingDose.recommended *= 0.35;
      baseStartingDose.low *= 0.25;
      baseStartingDose.high *= 0.5;
      
      combinedRisk = 'VERY HIGH';
    } else if (cyp2c9Phenotype.includes('Intermediate')) {
      cyp2c9Contribution = 'INTERMEDIATE METABOLIZER - Additional 15-30% reduction needed';
      adjustmentFactors.push('CYP2C9 IM: Reduce dose by 15-30%');
      
      // Additional reduction
      baseWeeklyDose.target *= 0.75; // 25% additional reduction
      baseWeeklyDose.low *= 0.7;
      baseWeeklyDose.high *= 0.85;
      baseStartingDose.recommended *= 0.75;
      baseStartingDose.low *= 0.7;
      baseStartingDose.high *= 0.85;
      
      if (vkorc1Sensitivity === 'High') {
        combinedRisk = 'HIGH';
      } else {
        combinedRisk = 'Elevated';
      }
    } else {
      cyp2c9Contribution = 'NORMAL METABOLIZER - No additional adjustment';
      adjustmentFactors.push('CYP2C9 NM: No adjustment needed');
    }
  }

  // Round doses to reasonable precision
  baseWeeklyDose.low = Math.round(baseWeeklyDose.low * 10) / 10;
  baseWeeklyDose.high = Math.round(baseWeeklyDose.high * 10) / 10;
  baseWeeklyDose.target = Math.round(baseWeeklyDose.target * 10) / 10;
  baseStartingDose.low = Math.round(baseStartingDose.low * 10) / 10;
  baseStartingDose.high = Math.round(baseStartingDose.high * 10) / 10;
  baseStartingDose.recommended = Math.round(baseStartingDose.recommended * 10) / 10;

  return {
    weeklyDose: baseWeeklyDose,
    startingDose: baseStartingDose,
    vkorc1Contribution,
    cyp2c9Contribution,
    combinedRisk,
    adjustmentFactors
  };
}

/**
 * Generate safety alerts based on VKORC1 genotype and CYP2C9
 */
function generateSafetyAlerts(
  sensitivity: string,
  cyp2c9Phenotype?: string
): string[] {
  const alerts: string[] = [];

  // VKORC1-specific alerts
  if (sensitivity === 'High') {
    alerts.push('🚨 HIGH WARFARIN SENSITIVITY: AA genotype requires 30-50% dose reduction');
    alerts.push('⚠️ BLEEDING RISK: Start with LOW doses (0.5-2mg/day) to prevent over-anticoagulation');
    alerts.push('⚠️ MONITORING: Check INR after 3 doses, then frequently until stable');
  } else if (sensitivity === 'Intermediate') {
    alerts.push('⚠️ MODERATE WARFARIN SENSITIVITY: AG genotype requires 15-25% dose reduction');
    alerts.push('💡 STARTING DOSE: Begin with 2-4mg/day, adjust based on INR response');
    alerts.push('💡 MONITORING: Standard INR monitoring protocol');
  } else {
    alerts.push('✅ STANDARD WARFARIN SENSITIVITY: GG genotype, typical dosing appropriate');
    alerts.push('💡 STARTING DOSE: Begin with 5-7mg/day, adjust based on INR response');
    alerts.push('💡 MONITORING: Standard INR monitoring protocol');
  }

  // Combined VKORC1 + CYP2C9 alerts
  if (cyp2c9Phenotype && cyp2c9Phenotype.includes('Poor') && sensitivity === 'High') {
    alerts.push('🚨 🚨 EXTREME BLEEDING RISK: Both VKORC1 AA + CYP2C9 PM');
    alerts.push('🚨 CRITICAL: Start with 0.5-1mg/day warfarin, check INR after 2-3 doses');
    alerts.push('🚨 CONSIDER ALTERNATIVES: NOACs (apixaban, rivaroxaban) may be safer');
    alerts.push('⚠️ TOTAL DOSE REDUCTION: Up to 65-75% reduction from standard dosing');
  } else if (cyp2c9Phenotype && 
             (cyp2c9Phenotype.includes('Poor') || cyp2c9Phenotype.includes('Intermediate')) &&
             sensitivity !== 'Low') {
    alerts.push('⚠️ HIGH BLEEDING RISK: Combined VKORC1 + CYP2C9 variant effects');
    alerts.push('⚠️ CLOSE MONITORING: More frequent INR checks recommended');
    alerts.push('💡 ALTERNATIVE THERAPY: Consider NOACs if appropriate');
  }

  // General warfarin safety
  alerts.push('💡 DRUG INTERACTIONS: Many medications affect warfarin (antibiotics, NSAIDs, etc.)');
  alerts.push('💡 DIET: Vitamin K intake affects INR - maintain consistent dietary habits');
  alerts.push('💡 PATIENT EDUCATION: Signs of bleeding, when to seek immediate care');

  return alerts;
}

/**
 * Generate monitoring recommendations
 */
function generateMonitoringRecommendations(
  sensitivity: string,
  cyp2c9Phenotype?: string
): string[] {
  const recommendations: string[] = [];

  if (sensitivity === 'High' || (cyp2c9Phenotype && cyp2c9Phenotype.includes('Poor'))) {
    recommendations.push('Check INR after 2-3 doses (vs standard 3-5 doses)');
    recommendations.push('More frequent INR monitoring during dose titration');
    recommendations.push('Target INR range may need adjustment (discuss with provider)');
    recommendations.push('Consider genetic-guided dosing algorithms (IWPC, Gage)');
  } else if (sensitivity === 'Intermediate' || (cyp2c9Phenotype && cyp2c9Phenotype.includes('Intermediate'))) {
    recommendations.push('Check INR after 3-4 doses');
    recommendations.push('Standard to increased INR monitoring frequency');
    recommendations.push('Use pharmacogenetic dosing calculator for initial dose');
  } else {
    recommendations.push('Standard INR monitoring protocol');
    recommendations.push('Check INR after 3-5 doses');
    recommendations.push('May consider genetic-guided dosing for optimization');
  }

  recommendations.push('Monitor for signs of bleeding or over-anticoagulation');
  recommendations.push('Educate patient on dietary vitamin K consistency');
  recommendations.push('Review all medications for potential interactions');

  return recommendations;
}

/**
 * Main VKORC1 analysis function
 */
export function analyzeVKORC1(
  rs9923231: string | null,
  cyp2c9Phenotype?: string // Optional integration with CYP2C9 analyzer
): VKORC1AnalysisResult {
  // Determine VKORC1 genotype
  const genotype = determineVKORC1Genotype(rs9923231);

  // Calculate warfarin dosing
  const warfarinDosing = calculateWarfarinDosing(genotype.sensitivity, cyp2c9Phenotype);

  // Generate safety alerts
  const safetyAlerts = generateSafetyAlerts(genotype.sensitivity, cyp2c9Phenotype);

  // Generate monitoring recommendations
  const monitoringRecommendations = generateMonitoringRecommendations(
    genotype.sensitivity,
    cyp2c9Phenotype
  );

  // Clinical summary
  const clinicalSummary = `
VKORC1 Genotype: ${genotype.rs9923231Genotype}
Haplotype Group: ${genotype.haplotypeGroup}
Warfarin Sensitivity: ${genotype.sensitivity}
Confidence: ${genotype.confidence}

VKORC1 is the molecular TARGET of warfarin. The rs9923231 variant affects VKORC1
expression levels, directly determining warfarin sensitivity.

${genotype.sensitivity === 'High'
  ? 'You carry TWO copies of the A allele (AA), resulting in HIGH warfarin sensitivity. You require 30-50% LESS warfarin than typical patients. This significantly increases bleeding risk if standard doses are used.'
  : genotype.sensitivity === 'Intermediate'
  ? 'You carry ONE copy of the A allele (AG), resulting in MODERATE warfarin sensitivity. You require 15-25% less warfarin than typical patients.'
  : 'You carry TWO copies of the G allele (GG), resulting in STANDARD warfarin sensitivity. Typical dosing is appropriate.'}

GENETIC CONTRIBUTION TO DOSING:
• VKORC1: ${warfarinDosing.vkorc1Contribution}
• CYP2C9: ${warfarinDosing.cyp2c9Contribution}
• Combined Risk Level: ${warfarinDosing.combinedRisk}

PHARMACOGENETIC DOSING ESTIMATE:
• Starting Dose: ${warfarinDosing.startingDose.recommended}mg/day (range: ${warfarinDosing.startingDose.low}-${warfarinDosing.startingDose.high}mg)
• Target Weekly Dose: ${warfarinDosing.weeklyDose.target}mg/week (range: ${warfarinDosing.weeklyDose.low}-${warfarinDosing.weeklyDose.high}mg)

CRITICAL VARIANT:
• rs9923231 (-1639G>A): ${rs9923231 || 'NOT AVAILABLE'}
  `.trim();

  // Population context
  const populationContext = genotype.sensitivity === 'High'
    ? 'Approximately 10-15% of Europeans and 85-90% of Asians carry the VKORC1 AA genotype.'
    : genotype.sensitivity === 'Intermediate'
    ? 'Approximately 40-50% of Europeans and 5-10% of Asians carry the VKORC1 AG genotype.'
    : 'Approximately 35-45% of Europeans and 1-5% of Asians carry the VKORC1 GG genotype.';

  // FDA guidance
  const fdaGuidance = [
    'FDA-approved warfarin labeling includes pharmacogenetic dosing tables',
    'CPIC guidelines recommend genotype-guided dosing for warfarin initiation',
    'Clinical dosing algorithms integrate VKORC1 + CYP2C9 + clinical factors',
    'Pharmacogenetic testing recommended BEFORE starting warfarin when possible',
    'Consider NOACs (apixaban, rivaroxaban, dabigatran) as alternatives if high bleeding risk'
  ];

  return {
    genotype,
    clinicalSummary,
    warfarinDosing,
    safetyAlerts,
    monitoringRecommendations,
    populationContext,
    fdaGuidance
  };
}

/**
 * Example usage and testing
 */
export function testVKORC1Analysis() {
  console.log('=== VKORC1 Test Cases ===\n');

  // Test Case 1: High sensitivity (A/A) alone
  console.log('Test 1: High Sensitivity (AA) - VKORC1 only');
  const result1 = analyzeVKORC1('A/A');
  console.log(result1.clinicalSummary);
  console.log('\nDosing:', result1.warfarinDosing);
  console.log('\nSafety Alerts:', result1.safetyAlerts.slice(0, 3));
  console.log('\n' + '='.repeat(80) + '\n');

  // Test Case 2: Intermediate sensitivity (A/G)
  console.log('Test 2: Intermediate Sensitivity (AG)');
  const result2 = analyzeVKORC1('A/G');
  console.log(result2.clinicalSummary);
  console.log('\nDosing:', result2.warfarinDosing);
  console.log('\n' + '='.repeat(80) + '\n');

  // Test Case 3: High sensitivity + CYP2C9 Poor Metabolizer (WORST CASE)
  console.log('Test 3: EXTREME RISK - AA + CYP2C9 Poor Metabolizer');
  const result3 = analyzeVKORC1('A/A', 'Poor Metabolizer');
  console.log(result3.clinicalSummary);
  console.log('\nDosing:', result3.warfarinDosing);
  console.log('\nSafety Alerts:', result3.safetyAlerts);
  console.log('\n' + '='.repeat(80) + '\n');

  // Test Case 4: Standard sensitivity (G/G)
  console.log('Test 4: Standard Sensitivity (GG)');
  const result4 = analyzeVKORC1('G/G');
  console.log(result4.clinicalSummary);
  console.log('\nDosing:', result4.warfarinDosing);
  console.log('\n' + '='.repeat(80) + '\n');
}
