/**
 * SLCO1B1 Pharmacogenomics Analyzer
 * 
 * SLCO1B1 encodes the OATP1B1 transporter protein responsible for hepatic uptake
 * of statins and other drugs. Variants affect statin plasma levels and myopathy risk.
 * 
 * KEY VARIANT: rs4149056 (c.521T>C, Val174Ala)
 * - THE most important pharmacogenetic variant for statin therapy
 * - C allele = decreased transporter function = higher statin levels = myopathy risk
 * - Especially critical for simvastatin (up to 17x myopathy risk in C/C carriers)
 * 
 * STAR ALLELES:
 * *1A = Normal function (reference haplotype)
 * *5 = Decreased function (rs4149056 C, rs2306283 G)
 * *15 = Decreased function (rs4149056 C, rs2306283 A)
 * *17 = Decreased function (rs4149056 C only)
 * 
 * CLINICAL IMPACT:
 * - Simvastatin: C/C carriers have 16.9x increased myopathy risk at 80mg/day
 * - Atorvastatin: 4.5x increased risk in C/C carriers
 * - Pravastatin, rosuvastatin: Lower risk but still affected
 * - CPIC guidelines recommend dose limits or alternative statins
 */

export interface SLCO1B1StarAllele {
  name: string;
  rs4149056: string; // c.521T>C (Val174Ala) - THE critical variant
  rs2306283?: string; // c.388A>G (Asn130Asp) - secondary variant
  activityScore: number; // 0 = no function, 0.5 = decreased, 1.0 = normal
  frequency: string;
  description: string;
}

export interface SLCO1B1Diplotype {
  allele1: string;
  allele2: string;
  activityScore: number; // Sum of both alleles
  phenotype: 'Normal Function' | 'Decreased Function' | 'Poor Function';
  confidence: 'high' | 'medium' | 'low';
}

export interface StatinRecommendation {
  drug: string;
  myopathyRiskIncrease: string;
  maxDose?: string;
  recommendation: string;
  alternatives: string[];
  evidenceLevel: 'Strong' | 'Moderate' | 'Weak';
  clinicalNotes: string[];
}

export interface SLCO1B1AnalysisResult {
  diplotype: SLCO1B1Diplotype;
  clinicalSummary: string;
  statinRecommendations: StatinRecommendation[];
  safetyAlerts: string[];
  populationContext: string;
}

// SLCO1B1 Star Allele Definitions
export const SLCO1B1_STAR_ALLELES: Record<string, SLCO1B1StarAllele> = {
  '*1A': {
    name: '*1A',
    rs4149056: 'T/T',
    rs2306283: 'A/A',
    activityScore: 1.0,
    frequency: '~70% in Europeans',
    description: 'Normal function (reference haplotype)'
  },
  '*1B': {
    name: '*1B',
    rs4149056: 'T/T',
    rs2306283: 'A/G or G/G',
    activityScore: 1.0,
    frequency: '~30% in Europeans',
    description: 'Normal function (rs2306283 variant has minimal impact)'
  },
  '*5': {
    name: '*5',
    rs4149056: 'T/C or C/C',
    rs2306283: 'G/G',
    activityScore: 0.5,
    frequency: '~10-15% in Europeans',
    description: 'Decreased function - increased statin levels and myopathy risk'
  },
  '*15': {
    name: '*15',
    rs4149056: 'T/C or C/C',
    rs2306283: 'A/A',
    activityScore: 0.5,
    frequency: '~5% in Europeans',
    description: 'Decreased function - increased statin levels and myopathy risk'
  },
  '*17': {
    name: '*17',
    rs4149056: 'T/C or C/C',
    rs2306283: 'A/G',
    activityScore: 0.5,
    frequency: '~2-3% in Europeans',
    description: 'Decreased function - increased statin levels and myopathy risk'
  }
};

// Statin-specific pharmacogenomic recommendations
export const STATIN_RECOMMENDATIONS: Record<string, Omit<StatinRecommendation, 'myopathyRiskIncrease' | 'recommendation'>> = {
  simvastatin: {
    drug: 'Simvastatin',
    evidenceLevel: 'Strong',
    alternatives: ['pravastatin', 'rosuvastatin', 'fluvastatin', 'pitavastatin'],
    clinicalNotes: [
      'HIGHEST RISK statin for SLCO1B1-related myopathy',
      'Extensively metabolized by CYP3A4 after OATP1B1 uptake',
      'FDA warning: avoid 80mg dose in all patients',
      'CPIC: Prescribe lower dose or alternative statin for decreased function'
    ]
  },
  atorvastatin: {
    drug: 'Atorvastatin',
    evidenceLevel: 'Strong',
    alternatives: ['pravastatin', 'rosuvastatin', 'pitavastatin'],
    clinicalNotes: [
      'Second highest risk for SLCO1B1-related myopathy',
      'Extensively metabolized by CYP3A4',
      'Consider dose reduction in decreased function patients',
      'Alternative statins may provide better safety profile'
    ]
  },
  pravastatin: {
    drug: 'Pravastatin',
    evidenceLevel: 'Moderate',
    alternatives: ['rosuvastatin', 'pitavastatin', 'fluvastatin'],
    clinicalNotes: [
      'LOWER RISK option - not metabolized by CYP3A4',
      'Hydrophilic statin with renal elimination',
      'Preferred alternative for SLCO1B1 decreased function',
      'Still monitor for myopathy symptoms'
    ]
  },
  rosuvastatin: {
    drug: 'Rosuvastatin',
    evidenceLevel: 'Moderate',
    alternatives: ['pravastatin', 'pitavastatin', 'fluvastatin'],
    clinicalNotes: [
      'LOWER RISK option - minimal CYP metabolism',
      'Hydrophilic statin',
      'Safe alternative for SLCO1B1 decreased function',
      'Very potent - lower doses often effective'
    ]
  },
  fluvastatin: {
    drug: 'Fluvastatin',
    evidenceLevel: 'Weak',
    alternatives: ['pravastatin', 'rosuvastatin', 'pitavastatin'],
    clinicalNotes: [
      'LOWEST RISK for SLCO1B1-related myopathy',
      'Metabolized by CYP2C9 instead of CYP3A4',
      'Safe alternative for decreased function patients',
      'Less potent than other statins - may need higher doses for efficacy'
    ]
  },
  pitavastatin: {
    drug: 'Pitavastatin',
    evidenceLevel: 'Weak',
    alternatives: ['pravastatin', 'rosuvastatin', 'fluvastatin'],
    clinicalNotes: [
      'MINIMAL SLCO1B1 interaction',
      'Not significantly metabolized by CYP450 enzymes',
      'Excellent alternative for decreased function patients',
      'Minimal drug interactions'
    ]
  }
};

/**
 * Infer SLCO1B1 diplotype from genotype data
 */
export function inferSLCO1B1Diplotype(
  rs4149056: string | null, // c.521T>C (THE critical variant)
  rs2306283: string | null  // c.388A>G (secondary variant)
): SLCO1B1Diplotype {
  // Default to unknown
  let diplotype: SLCO1B1Diplotype = {
    allele1: '*unknown',
    allele2: '*unknown',
    activityScore: 1.0, // Assume normal if no data
    phenotype: 'Normal Function',
    confidence: 'low'
  };

  // If we have rs4149056 (the critical variant)
  if (rs4149056) {
    const hasCAllele = rs4149056.includes('C');
    const isCCHomozygous = rs4149056 === 'C/C' || rs4149056 === 'CC';
    const isCTHeterozygous = rs4149056 === 'C/T' || rs4149056 === 'T/C' || rs4149056 === 'CT' || rs4149056 === 'TC';
    const isTTHomozygous = rs4149056 === 'T/T' || rs4149056 === 'TT';

    if (isTTHomozygous) {
      // Normal function - likely *1A/*1A or *1A/*1B
      if (rs2306283) {
        const hasGAllele = rs2306283.includes('G');
        if (hasGAllele) {
          diplotype = {
            allele1: '*1A',
            allele2: '*1B',
            activityScore: 2.0,
            phenotype: 'Normal Function',
            confidence: 'high'
          };
        } else {
          diplotype = {
            allele1: '*1A',
            allele2: '*1A',
            activityScore: 2.0,
            phenotype: 'Normal Function',
            confidence: 'high'
          };
        }
      } else {
        diplotype = {
          allele1: '*1A',
          allele2: '*1A',
          activityScore: 2.0,
          phenotype: 'Normal Function',
          confidence: 'medium'
        };
      }
    } else if (isCTHeterozygous) {
      // Decreased function - heterozygous for c.521T>C
      // Likely *1A/*5, *1A/*15, or *1A/*17
      if (rs2306283) {
        const rs2306283Genotype = rs2306283.replace('/', '').toUpperCase();
        if (rs2306283Genotype.includes('G') && rs2306283Genotype.includes('A')) {
          diplotype = {
            allele1: '*1A',
            allele2: '*17',
            activityScore: 1.5,
            phenotype: 'Decreased Function',
            confidence: 'high'
          };
        } else if (rs2306283 === 'A/A' || rs2306283 === 'AA') {
          diplotype = {
            allele1: '*1A',
            allele2: '*15',
            activityScore: 1.5,
            phenotype: 'Decreased Function',
            confidence: 'high'
          };
        } else {
          diplotype = {
            allele1: '*1A',
            allele2: '*5',
            activityScore: 1.5,
            phenotype: 'Decreased Function',
            confidence: 'high'
          };
        }
      } else {
        diplotype = {
          allele1: '*1A',
          allele2: '*5/*15/*17',
          activityScore: 1.5,
          phenotype: 'Decreased Function',
          confidence: 'medium'
        };
      }
    } else if (isCCHomozygous) {
      // Poor function - homozygous for c.521T>C
      // Likely *5/*5, *15/*15, or *17/*17
      if (rs2306283) {
        const rs2306283Genotype = rs2306283.replace('/', '').toUpperCase();
        if (rs2306283 === 'A/A' || rs2306283 === 'AA') {
          diplotype = {
            allele1: '*15',
            allele2: '*15',
            activityScore: 1.0,
            phenotype: 'Poor Function',
            confidence: 'high'
          };
        } else if (rs2306283 === 'G/G' || rs2306283 === 'GG') {
          diplotype = {
            allele1: '*5',
            allele2: '*5',
            activityScore: 1.0,
            phenotype: 'Poor Function',
            confidence: 'high'
          };
        } else {
          diplotype = {
            allele1: '*5/*15/*17',
            allele2: '*5/*15/*17',
            activityScore: 1.0,
            phenotype: 'Poor Function',
            confidence: 'medium'
          };
        }
      } else {
        diplotype = {
          allele1: '*5/*15/*17',
          allele2: '*5/*15/*17',
          activityScore: 1.0,
          phenotype: 'Poor Function',
          confidence: 'high'
        };
      }
    }
  }

  return diplotype;
}

/**
 * Generate statin-specific recommendations based on SLCO1B1 phenotype
 */
function generateStatinRecommendations(phenotype: string): StatinRecommendation[] {
  const recommendations: StatinRecommendation[] = [];

  // Simvastatin
  if (phenotype === 'Normal Function') {
    recommendations.push({
      ...STATIN_RECOMMENDATIONS.simvastatin,
      myopathyRiskIncrease: 'Baseline risk (~0.1-0.2%)',
      recommendation: 'Normal dosing (max 40mg/day - FDA recommends avoiding 80mg in all patients)',
      maxDose: '40mg/day'
    });
  } else if (phenotype === 'Decreased Function') {
    recommendations.push({
      ...STATIN_RECOMMENDATIONS.simvastatin,
      myopathyRiskIncrease: '4-5x increased risk (~0.5-1%)',
      recommendation: '⚠️ PRESCRIBE LOWER DOSE (≤20mg/day) OR USE ALTERNATIVE STATIN (pravastatin, rosuvastatin)',
      maxDose: '20mg/day'
    });
  } else { // Poor Function
    recommendations.push({
      ...STATIN_RECOMMENDATIONS.simvastatin,
      myopathyRiskIncrease: '🚨 17x increased risk (~2-3%)',
      recommendation: '🚨 AVOID SIMVASTATIN - Use alternative statin (pravastatin, rosuvastatin, fluvastatin, pitavastatin)',
      maxDose: 'AVOID'
    });
  }

  // Atorvastatin
  if (phenotype === 'Normal Function') {
    recommendations.push({
      ...STATIN_RECOMMENDATIONS.atorvastatin,
      myopathyRiskIncrease: 'Baseline risk (~0.1-0.2%)',
      recommendation: 'Normal dosing (usual max 80mg/day)',
      maxDose: '80mg/day'
    });
  } else if (phenotype === 'Decreased Function') {
    recommendations.push({
      ...STATIN_RECOMMENDATIONS.atorvastatin,
      myopathyRiskIncrease: '2-3x increased risk (~0.3-0.6%)',
      recommendation: '⚠️ CONSIDER LOWER DOSE (≤40mg/day) or alternative statin',
      maxDose: '40mg/day recommended'
    });
  } else { // Poor Function
    recommendations.push({
      ...STATIN_RECOMMENDATIONS.atorvastatin,
      myopathyRiskIncrease: '4.5x increased risk (~0.5-1%)',
      recommendation: '⚠️ USE LOWER DOSE (≤40mg/day) or preferably use alternative statin',
      maxDose: '40mg/day'
    });
  }

  // Pravastatin (SAFE alternative)
  if (phenotype === 'Normal Function') {
    recommendations.push({
      ...STATIN_RECOMMENDATIONS.pravastatin,
      myopathyRiskIncrease: 'Baseline risk (~0.1-0.2%)',
      recommendation: 'Normal dosing - safe option for all SLCO1B1 phenotypes',
      maxDose: '80mg/day'
    });
  } else {
    recommendations.push({
      ...STATIN_RECOMMENDATIONS.pravastatin,
      myopathyRiskIncrease: 'Slightly increased but LOW RISK',
      recommendation: '✅ PREFERRED ALTERNATIVE - Lower risk of myopathy, normal dosing',
      maxDose: '80mg/day'
    });
  }

  // Rosuvastatin (SAFE alternative)
  if (phenotype === 'Normal Function') {
    recommendations.push({
      ...STATIN_RECOMMENDATIONS.rosuvastatin,
      myopathyRiskIncrease: 'Baseline risk (~0.1-0.2%)',
      recommendation: 'Normal dosing - safe option for all SLCO1B1 phenotypes',
      maxDose: '40mg/day'
    });
  } else {
    recommendations.push({
      ...STATIN_RECOMMENDATIONS.rosuvastatin,
      myopathyRiskIncrease: 'Slightly increased but LOW RISK',
      recommendation: '✅ PREFERRED ALTERNATIVE - Lower risk of myopathy, normal dosing',
      maxDose: '40mg/day'
    });
  }

  // Fluvastatin (SAFEST alternative)
  recommendations.push({
    ...STATIN_RECOMMENDATIONS.fluvastatin,
    myopathyRiskIncrease: 'Minimal - LOWEST RISK statin',
    recommendation: '✅ SAFEST ALTERNATIVE - Minimal SLCO1B1 interaction, normal dosing',
    maxDose: '80mg/day'
  });

  // Pitavastatin (SAFEST alternative)
  recommendations.push({
    ...STATIN_RECOMMENDATIONS.pitavastatin,
    myopathyRiskIncrease: 'Minimal - LOWEST RISK statin',
    recommendation: '✅ SAFEST ALTERNATIVE - Minimal SLCO1B1 interaction, minimal drug interactions',
    maxDose: '4mg/day'
  });

  return recommendations;
}

/**
 * Generate safety alerts based on phenotype
 */
function generateSafetyAlerts(phenotype: string): string[] {
  const alerts: string[] = [];

  if (phenotype === 'Poor Function') {
    alerts.push('🚨 CRITICAL: 17x increased risk of myopathy with simvastatin - AVOID');
    alerts.push('🚨 HIGH RISK: Homozygous for SLCO1B1 c.521C variant - use alternative statins');
    alerts.push('⚠️ MONITOR: If statin therapy required, use pravastatin, rosuvastatin, fluvastatin, or pitavastatin');
    alerts.push('⚠️ SYMPTOMS: Educate patient on myopathy symptoms (muscle pain, weakness, dark urine)');
    alerts.push('💡 TESTING: Monitor CK levels more frequently if using atorvastatin or other high-risk statins');
  } else if (phenotype === 'Decreased Function') {
    alerts.push('⚠️ INCREASED RISK: 4-5x higher myopathy risk with simvastatin - use ≤20mg/day or alternative');
    alerts.push('⚠️ CAUTION: Heterozygous for SLCO1B1 c.521C variant - dose reduction recommended');
    alerts.push('💡 PREFERRED: Consider pravastatin, rosuvastatin, fluvastatin, or pitavastatin as first-line');
    alerts.push('💡 MONITORING: Educate patient on myopathy symptoms and monitor CK if symptomatic');
  } else {
    alerts.push('✅ NORMAL FUNCTION: Standard statin dosing appropriate');
    alerts.push('💡 GENERAL: Still avoid simvastatin 80mg (FDA warning applies to all patients)');
    alerts.push('💡 MONITORING: Standard monitoring for myopathy symptoms');
  }

  return alerts;
}

/**
 * Main SLCO1B1 analysis function
 */
export function analyzeSLCO1B1(
  rs4149056: string | null,
  rs2306283: string | null
): SLCO1B1AnalysisResult {
  // Infer diplotype
  const diplotype = inferSLCO1B1Diplotype(rs4149056, rs2306283);

  // Generate statin recommendations
  const statinRecommendations = generateStatinRecommendations(diplotype.phenotype);

  // Generate safety alerts
  const safetyAlerts = generateSafetyAlerts(diplotype.phenotype);

  // Clinical summary
  const clinicalSummary = `
SLCO1B1 Diplotype: ${diplotype.allele1}/${diplotype.allele2}
Activity Score: ${diplotype.activityScore}/2.0
Phenotype: ${diplotype.phenotype}
Confidence: ${diplotype.confidence}

SLCO1B1 encodes the OATP1B1 transporter responsible for hepatic uptake of statins.
${diplotype.phenotype === 'Poor Function' 
  ? 'You carry TWO copies of the decreased function variant (c.521C), resulting in significantly reduced transporter activity. This leads to higher statin blood levels and DRAMATICALLY increased myopathy risk, especially with simvastatin (17x) and atorvastatin (4.5x).'
  : diplotype.phenotype === 'Decreased Function'
  ? 'You carry ONE copy of the decreased function variant (c.521C), resulting in moderately reduced transporter activity. This leads to higher statin blood levels and increased myopathy risk, especially with simvastatin (4-5x).'
  : 'You carry normal function alleles. Standard statin dosing is appropriate with typical myopathy risk.'}

CRITICAL VARIANTS:
• rs4149056 (c.521T>C): ${rs4149056 || 'NOT AVAILABLE'}
• rs2306283 (c.388A>G): ${rs2306283 || 'NOT AVAILABLE'}
  `.trim();

  // Population context
  const populationContext = diplotype.phenotype === 'Poor Function'
    ? 'Approximately 1-2% of Europeans are homozygous for the c.521C variant.'
    : diplotype.phenotype === 'Decreased Function'
    ? 'Approximately 15-20% of Europeans are heterozygous for the c.521C variant.'
    : 'Approximately 75-80% of Europeans have normal SLCO1B1 function.';

  return {
    diplotype,
    clinicalSummary,
    statinRecommendations,
    safetyAlerts,
    populationContext
  };
}

/**
 * Example usage and testing
 */
export function testSLCO1B1Analysis() {
  console.log('=== SLCO1B1 Test Cases ===\n');

  // Test Case 1: Normal function (T/T)
  console.log('Test 1: Normal Function (*1A/*1A)');
  const result1 = analyzeSLCO1B1('T/T', 'A/A');
  console.log(result1.clinicalSummary);
  console.log('\nSafety Alerts:', result1.safetyAlerts);
  console.log('\n' + '='.repeat(80) + '\n');

  // Test Case 2: Decreased function (C/T)
  console.log('Test 2: Decreased Function (*1A/*5)');
  const result2 = analyzeSLCO1B1('C/T', 'A/G');
  console.log(result2.clinicalSummary);
  console.log('\nSimvastatin:', result2.statinRecommendations.find(r => r.drug === 'Simvastatin')?.recommendation);
  console.log('\nSafety Alerts:', result2.safetyAlerts);
  console.log('\n' + '='.repeat(80) + '\n');

  // Test Case 3: Poor function (C/C)
  console.log('Test 3: Poor Function (*5/*5)');
  const result3 = analyzeSLCO1B1('C/C', 'G/G');
  console.log(result3.clinicalSummary);
  console.log('\nSimvastatin:', result3.statinRecommendations.find(r => r.drug === 'Simvastatin')?.recommendation);
  console.log('Atorvastatin:', result3.statinRecommendations.find(r => r.drug === 'Atorvastatin')?.recommendation);
  console.log('Pravastatin:', result3.statinRecommendations.find(r => r.drug === 'Pravastatin')?.recommendation);
  console.log('\nSafety Alerts:', result3.safetyAlerts);
  console.log('\n' + '='.repeat(80) + '\n');
}
