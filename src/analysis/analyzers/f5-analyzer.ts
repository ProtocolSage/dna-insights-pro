/**
 * F5 (Factor V Leiden) Pharmacogenomics Analyzer
 * 
 * F5 encodes coagulation Factor V. The Factor V Leiden mutation (rs6025)
 * is THE most common inherited thrombophilia in Europeans, affecting
 * 3-8% of the population.
 * 
 * CRITICAL VARIANT: rs6025 (c.1601G>A, R506Q - Factor V Leiden)
 * - Single nucleotide change creates resistance to activated Protein C
 * - Heterozygotes (G/A): 5-7x increased VTE risk
 * - Homozygotes (A/A): 50-80x increased VTE risk
 * - #1 CONTRAINDICATION for estrogen-containing contraceptives
 * 
 * CLINICAL SIGNIFICANCE:
 * 
 * 1. ORAL CONTRACEPTIVE SAFETY (Most Important)
 *    - Combined OCPs (estrogen + progestin): CONTRAINDICATED in heterozygotes
 *    - Risk of VTE with OCPs + FVL: 30-35x baseline
 *    - FDA Black Box Warning on all estrogen contraceptives
 *    - Progestin-only alternatives recommended
 * 
 * 2. HORMONE REPLACEMENT THERAPY (HRT)
 *    - Estrogen-containing HRT contraindicated
 *    - Increased VTE risk similar to OCPs
 *    - Non-hormonal alternatives preferred
 * 
 * 3. PREGNANCY PLANNING
 *    - Pregnancy alone = 5x VTE risk
 *    - Pregnancy + FVL heterozygote = 25x VTE risk
 *    - May require thromboprophylaxis during pregnancy/postpartum
 *    - Higher risk of pregnancy complications (preeclampsia, fetal loss)
 * 
 * 4. SURGERY & IMMOBILIZATION
 *    - Prophylactic anticoagulation required for surgeries
 *    - Extended prophylaxis for major orthopedic procedures
 *    - Higher risk during long flights, hospitalization
 * 
 * SECONDARY VARIANT: rs6027 (H1299R)
 * - Much rarer variant (~0.1% frequency)
 * - Also causes activated Protein C resistance
 * - Clinical significance similar to Factor V Leiden
 * 
 * POPULATION FREQUENCIES (rs6025):
 * - Northern Europeans: 5-8% heterozygotes, 0.06% homozygotes
 * - Southern Europeans: 2-4% heterozygotes
 * - Middle Eastern: 2-5% heterozygotes
 * - Asians: <0.5% (very rare)
 * - Africans: <0.5% (very rare)
 * 
 * ABSOLUTE VTE RISK:
 * - Normal (G/G): ~0.1% per year baseline
 * - Heterozygote (G/A): ~0.5-0.7% per year
 * - Homozygote (A/A): ~5-8% per year
 * - WITH estrogen OCPs + heterozygote: ~3% per year
 * - WITH pregnancy + heterozygote: ~2.5% during pregnancy
 */

export interface F5Variant {
  rsid: string;
  name: string;
  alleles: string;
  consequence: string;
  proteinChange: string;
}

export interface F5Genotype {
  rs6025: string; // THE critical variant (Factor V Leiden)
  rs6027?: string; // Secondary rare variant
  thrombophiliaRisk: 'Normal' | 'Elevated' | 'High' | 'Very High';
  vteRiskMultiplier: number;
  confidence: 'high' | 'medium' | 'low';
}

export interface ContraceptiveSafety {
  combinedOCPs: 'Safe' | 'Use Caution' | 'Contraindicated';
  progestinOnly: 'Safe' | 'Use Caution';
  estrogenHRT: 'Safe' | 'Use Caution' | 'Contraindicated';
  recommendedAlternatives: string[];
  fdaBlackBoxApplies: boolean;
}

export interface F5AnalysisResult {
  genotype: F5Genotype;
  clinicalSummary: string;
  contraceptiveSafety: ContraceptiveSafety;
  vteRiskAssessment: {
    baselineRisk: string;
    withOCPs: string;
    withPregnancy: string;
    withSurgery: string;
    absoluteRiskEstimate: string;
  };
  safetyAlerts: string[];
  clinicalRecommendations: string[];
  familyScreening: string[];
  populationContext: string;
}

// Known F5 variants
export const F5_VARIANTS: Record<string, F5Variant> = {
  'rs6025': {
    rsid: 'rs6025',
    name: 'Factor V Leiden',
    alleles: 'G>A',
    consequence: 'Missense - Resistance to activated Protein C',
    proteinChange: 'R506Q (Arg506Gln)'
  },
  'rs6027': {
    rsid: 'rs6027',
    name: 'Factor V Cambridge/Hong Kong',
    alleles: 'C>T',
    consequence: 'Missense - Resistance to activated Protein C',
    proteinChange: 'H1299R (His1299Arg)'
  }
};

/**
 * Determine F5 genotype and thrombophilia risk
 */
export function determineF5Genotype(
  rs6025: string | null,
  rs6027?: string | null
): F5Genotype {
  let thrombophiliaRisk: 'Normal' | 'Elevated' | 'High' | 'Very High' = 'Normal';
  let vteRiskMultiplier = 1.0;
  let confidence: 'high' | 'medium' | 'low' = 'high';

  // Primary variant: rs6025 (Factor V Leiden)
  if (!rs6025) {
    confidence = 'low';
    return {
      rs6025: 'Unknown',
      rs6027: rs6027 || undefined,
      thrombophiliaRisk: 'Normal',
      vteRiskMultiplier: 1.0,
      confidence
    };
  }

  const normalized6025 = rs6025.replace('/', '').toUpperCase();

  // Determine risk based on rs6025 genotype
  if (normalized6025 === 'AA') {
    // Homozygous Factor V Leiden - VERY HIGH RISK
    thrombophiliaRisk = 'Very High';
    vteRiskMultiplier = 50; // 50-80x baseline risk
    confidence = 'high';
  } else if (normalized6025 === 'AG' || normalized6025 === 'GA') {
    // Heterozygous Factor V Leiden - ELEVATED RISK
    thrombophiliaRisk = 'Elevated';
    vteRiskMultiplier = 5; // 5-7x baseline risk
    confidence = 'high';
  } else if (normalized6025 === 'GG') {
    // Normal/Wild-type - No Factor V Leiden
    thrombophiliaRisk = 'Normal';
    vteRiskMultiplier = 1.0;
    confidence = 'high';
  } else {
    // Unknown format
    confidence = 'low';
  }

  // Check rs6027 (rare variant)
  if (rs6027) {
    const normalized6027 = rs6027.replace('/', '').toUpperCase();
    if (normalized6027 === 'CT' || normalized6027 === 'TC') {
      // Heterozygous for rs6027
      if (thrombophiliaRisk === 'Normal') {
        thrombophiliaRisk = 'Elevated';
        vteRiskMultiplier = 3; // Approximate, less data available
      }
    } else if (normalized6027 === 'TT') {
      // Homozygous for rs6027 (extremely rare)
      if (thrombophiliaRisk === 'Normal') {
        thrombophiliaRisk = 'High';
        vteRiskMultiplier = 20; // Approximate
      }
    }
  }

  return {
    rs6025: rs6025,
    rs6027,
    thrombophiliaRisk,
    vteRiskMultiplier,
    confidence
  };
}

/**
 * Assess contraceptive safety based on F5 genotype
 */
export function assessContraceptiveSafety(
  thrombophiliaRisk: string
): ContraceptiveSafety {
  const result: ContraceptiveSafety = {
    combinedOCPs: 'Safe',
    progestinOnly: 'Safe',
    estrogenHRT: 'Safe',
    recommendedAlternatives: [],
    fdaBlackBoxApplies: false
  };

  if (thrombophiliaRisk === 'Very High') {
    // Homozygous Factor V Leiden
    result.combinedOCPs = 'Contraindicated';
    result.estrogenHRT = 'Contraindicated';
    result.progestinOnly = 'Use Caution';
    result.fdaBlackBoxApplies = true;
    result.recommendedAlternatives = [
      'Progestin-only pills (mini-pill)',
      'Progestin IUD (Mirena, Kyleena, Skyla)',
      'Copper IUD (non-hormonal)',
      'Barrier methods (condoms, diaphragm)',
      'Permanent sterilization if family complete'
    ];
  } else if (thrombophiliaRisk === 'Elevated' || thrombophiliaRisk === 'High') {
    // Heterozygous Factor V Leiden
    result.combinedOCPs = 'Contraindicated';
    result.estrogenHRT = 'Contraindicated';
    result.progestinOnly = 'Safe';
    result.fdaBlackBoxApplies = true;
    result.recommendedAlternatives = [
      'Progestin-only pills (mini-pill) - PREFERRED',
      'Progestin IUD (Mirena, Kyleena, Skyla) - PREFERRED',
      'Copper IUD (non-hormonal) - PREFERRED',
      'Barrier methods (condoms, diaphragm)',
      'Nexplanon (progestin implant)',
      'Depo-Provera (progestin injection) - Use Caution'
    ];
  } else {
    // Normal genotype
    result.combinedOCPs = 'Safe';
    result.estrogenHRT = 'Safe';
    result.progestinOnly = 'Safe';
    result.fdaBlackBoxApplies = false;
    result.recommendedAlternatives = [
      'All contraceptive methods appropriate',
      'Choice based on patient preference and other factors'
    ];
  }

  return result;
}

/**
 * Generate comprehensive VTE risk assessment
 */
function generateVTERiskAssessment(
  vteRiskMultiplier: number,
  thrombophiliaRisk: string
) {
  const baselineRisk = thrombophiliaRisk === 'Very High'
    ? '5-8% per year (50-80x baseline)'
    : thrombophiliaRisk === 'Elevated'
    ? '0.5-0.7% per year (5-7x baseline)'
    : '0.1% per year (general population)';

  const withOCPs = thrombophiliaRisk === 'Very High'
    ? '~10-15% per year (EXTREME RISK - CONTRAINDICATED)'
    : thrombophiliaRisk === 'Elevated'
    ? '~3% per year (30-35x baseline - CONTRAINDICATED)'
    : '0.3-0.4% per year (3-4x baseline - acceptable risk)';

  const withPregnancy = thrombophiliaRisk === 'Very High'
    ? '~10-15% during pregnancy/postpartum (HIGH RISK)'
    : thrombophiliaRisk === 'Elevated'
    ? '~2.5% during pregnancy/postpartum (25x baseline)'
    : '~0.5% during pregnancy/postpartum (5x baseline)';

  const withSurgery = thrombophiliaRisk === 'Very High'
    ? 'VERY HIGH - Extended prophylaxis essential'
    : thrombophiliaRisk === 'Elevated'
    ? 'HIGH - Prophylactic anticoagulation strongly recommended'
    : 'MODERATE - Standard prophylaxis appropriate';

  const absoluteRiskEstimate = thrombophiliaRisk === 'Very High'
    ? 'Approximately 5-8 in 100 people with FVL homozygous will develop VTE per year without additional risk factors. With estrogen exposure, risk approaches 10-15%.'
    : thrombophiliaRisk === 'Elevated'
    ? 'Approximately 5-7 in 1,000 people with FVL heterozygous will develop VTE per year. With estrogen exposure, risk increases to ~3 in 100.'
    : 'Approximately 1 in 1,000 people in the general population will develop VTE per year.';

  return {
    baselineRisk,
    withOCPs,
    withPregnancy,
    withSurgery,
    absoluteRiskEstimate
  };
}

/**
 * Generate safety alerts
 */
function generateSafetyAlerts(
  thrombophiliaRisk: string,
  contraceptiveSafety: ContraceptiveSafety
): string[] {
  const alerts: string[] = [];

  if (thrombophiliaRisk === 'Very High') {
    alerts.push('🚨🚨 HOMOZYGOUS FACTOR V LEIDEN - VERY HIGH VTE RISK');
    alerts.push('🚨 ABSOLUTE CONTRAINDICATION: NO estrogen-containing contraceptives');
    alerts.push('🚨 ABSOLUTE CONTRAINDICATION: NO hormone replacement therapy with estrogen');
    alerts.push('🚨 PREGNANCY RISK: Requires thromboprophylaxis - discuss with maternal-fetal medicine');
    alerts.push('🚨 SURGERY RISK: Extended anticoagulation required - inform all surgeons/anesthesiologists');
    alerts.push('⚠️ FAMILY SCREENING: 50% chance children inherit mutation - genetic counseling recommended');
    alerts.push('⚠️ AVOID: Long-haul flights without prophylaxis, prolonged immobilization');
  } else if (thrombophiliaRisk === 'Elevated' || thrombophiliaRisk === 'High') {
    alerts.push('🚨 HETEROZYGOUS FACTOR V LEIDEN - ELEVATED VTE RISK');
    alerts.push('🚨 CONTRAINDICATED: Estrogen-containing oral contraceptives (30-35x VTE risk)');
    alerts.push('🚨 CONTRAINDICATED: Hormone replacement therapy with estrogen');
    alerts.push('✅ SAFE ALTERNATIVES: Progestin-only contraceptives, copper IUD');
    alerts.push('⚠️ PREGNANCY: May require thromboprophylaxis - discuss with OB-GYN');
    alerts.push('⚠️ SURGERY: Prophylactic anticoagulation recommended - inform surgeons');
    alerts.push('💡 FAMILY SCREENING: 50% chance children inherit - consider testing if relevant');
    alerts.push('💡 LIFESTYLE: Stay hydrated on flights, avoid prolonged immobilization');
  } else {
    alerts.push('✅ NORMAL FACTOR V - No inherited thrombophilia detected');
    alerts.push('✅ CONTRACEPTIVE SAFETY: All hormonal contraceptives appropriate');
    alerts.push('💡 STANDARD PRECAUTIONS: Normal VTE prevention measures apply');
  }

  // Universal warnings
  if (thrombophiliaRisk !== 'Normal') {
    alerts.push('⚠️ DRUG INTERACTIONS: Tamoxifen, raloxifene also increase VTE risk');
    alerts.push('⚠️ SMOKING: Strongly contraindicated - further increases VTE risk');
    alerts.push('💡 MEDICAL ALERT: Wear bracelet/carry card noting Factor V Leiden status');
  }

  return alerts;
}

/**
 * Generate clinical recommendations
 */
function generateClinicalRecommendations(
  thrombophiliaRisk: string,
  contraceptiveSafety: ContraceptiveSafety
): string[] {
  const recommendations: string[] = [];

  if (thrombophiliaRisk === 'Very High') {
    recommendations.push('IMMEDIATE: Discontinue any estrogen-containing medications');
    recommendations.push('CONTRACEPTION: Switch to progestin-only or copper IUD');
    recommendations.push('HEMATOLOGY: Refer to hematology for comprehensive thrombophilia workup');
    recommendations.push('PREGNANCY PLANNING: Maternal-fetal medicine consultation required');
    recommendations.push('SURGICAL: Inform all providers - extended LMWH prophylaxis needed');
    recommendations.push('ANTICOAGULATION: May require lifelong after first VTE event');
    recommendations.push('GENETIC COUNSELING: Discuss inheritance pattern and family testing');
  } else if (thrombophiliaRisk === 'Elevated' || thrombophiliaRisk === 'High') {
    recommendations.push('CONTRACEPTION: Avoid all estrogen - use progestin-only options');
    recommendations.push('MENOPAUSE: Non-hormonal treatments for symptoms (SSRIs, lifestyle)');
    recommendations.push('PREGNANCY: Discuss thromboprophylaxis with OB-GYN');
    recommendations.push('SURGERY: Prophylactic LMWH (e.g., enoxaparin) for major procedures');
    recommendations.push('TRAVEL: Aspirin 81mg + compression stockings for long flights');
    recommendations.push('LIFESTYLE: Maintain healthy weight, regular exercise, stay hydrated');
    recommendations.push('MONITORING: Know signs of DVT/PE - seek immediate care if suspected');
    recommendations.push('FAMILY: Consider testing first-degree relatives if clinically relevant');
  } else {
    recommendations.push('STANDARD CARE: No special precautions needed');
    recommendations.push('CONTRACEPTION: All options appropriate based on preference');
    recommendations.push('PREVENTIVE: Standard VTE prevention for surgery/hospitalization');
  }

  return recommendations;
}

/**
 * Generate family screening recommendations
 */
function generateFamilyScreening(thrombophiliaRisk: string): string[] {
  if (thrombophiliaRisk === 'Normal') {
    return ['No family screening indicated - normal Factor V genotype'];
  }

  return [
    'INHERITANCE: Autosomal dominant - 50% chance children inherit mutation',
    'FIRST-DEGREE RELATIVES: Consider testing parents, siblings, children',
    'WOMEN OF REPRODUCTIVE AGE: Testing recommended BEFORE starting contraceptives',
    'PREGNANCY PLANNING: Testing valuable for pregnant relatives',
    'ASYMPTOMATIC TESTING: Controversial - discuss pros/cons with genetic counselor',
    'POST-VTE ONLY: Some guidelines recommend testing only after VTE event',
    'GENETIC COUNSELING: Recommended before family cascade screening'
  ];
}

/**
 * Main F5 analysis function
 */
export function analyzeF5(
  rs6025: string | null,
  rs6027?: string | null
): F5AnalysisResult {
  // Determine genotype
  const genotype = determineF5Genotype(rs6025, rs6027);

  // Assess contraceptive safety
  const contraceptiveSafety = assessContraceptiveSafety(genotype.thrombophiliaRisk);

  // VTE risk assessment
  const vteRiskAssessment = generateVTERiskAssessment(
    genotype.vteRiskMultiplier,
    genotype.thrombophiliaRisk
  );

  // Safety alerts
  const safetyAlerts = generateSafetyAlerts(genotype.thrombophiliaRisk, contraceptiveSafety);

  // Clinical recommendations
  const clinicalRecommendations = generateClinicalRecommendations(
    genotype.thrombophiliaRisk,
    contraceptiveSafety
  );

  // Family screening
  const familyScreening = generateFamilyScreening(genotype.thrombophiliaRisk);

  // Clinical summary
  const clinicalSummary = `
FACTOR V LEIDEN STATUS
Genotype (rs6025): ${genotype.rs6025}
${genotype.rs6027 ? `Secondary variant (rs6027): ${genotype.rs6027}` : ''}
Thrombophilia Risk: ${genotype.thrombophiliaRisk}
VTE Risk Multiplier: ${genotype.vteRiskMultiplier}x baseline
Confidence: ${genotype.confidence}

Factor V Leiden (FVL) is the MOST COMMON inherited thrombophilia in people
of European descent, affecting 3-8% of the population. The mutation causes
resistance to activated Protein C, a natural anticoagulant, leading to
increased blood clotting tendency.

${genotype.thrombophiliaRisk === 'Very High'
  ? 'You are HOMOZYGOUS for Factor V Leiden (two copies). This confers a 50-80x increased risk of venous thromboembolism (VTE) compared to the general population. Estrogen-containing medications are ABSOLUTELY CONTRAINDICATED.'
  : genotype.thrombophiliaRisk === 'Elevated'
  ? 'You are HETEROZYGOUS for Factor V Leiden (one copy). This confers a 5-7x increased risk of VTE. While absolute risk remains low (~0.5-0.7% per year), estrogen contraceptives increase this to ~3% per year and are CONTRAINDICATED.'
  : 'You do NOT carry Factor V Leiden. Your baseline VTE risk is normal (~0.1% per year). All contraceptive options are appropriate from a thrombophilia perspective.'}

CONTRACEPTIVE SAFETY:
• Combined OCPs (estrogen + progestin): ${contraceptiveSafety.combinedOCPs}
• Progestin-only methods: ${contraceptiveSafety.progestinOnly}
• Estrogen HRT: ${contraceptiveSafety.estrogenHRT}
• FDA Black Box Warning: ${contraceptiveSafety.fdaBlackBoxApplies ? 'YES - Applies' : 'No'}

VTE RISK ESTIMATES:
• Baseline (no risk factors): ${vteRiskAssessment.baselineRisk}
• With estrogen contraceptives: ${vteRiskAssessment.withOCPs}
• During pregnancy/postpartum: ${vteRiskAssessment.withPregnancy}
• With major surgery: ${vteRiskAssessment.withSurgery}
  `.trim();

  // Population context
  let populationContext = '';
  if (genotype.thrombophiliaRisk === 'Very High') {
    populationContext = 'Homozygous Factor V Leiden occurs in ~0.06% of Northern Europeans (1 in 1,600). Extremely rare in Asian and African populations.';
  } else if (genotype.thrombophiliaRisk === 'Elevated') {
    populationContext = 'Heterozygous Factor V Leiden occurs in 5-8% of Northern Europeans, 2-4% of Southern Europeans, and <0.5% of Asian/African populations.';
  } else {
    populationContext = '92-95% of Northern Europeans do not carry Factor V Leiden.';
  }

  return {
    genotype,
    clinicalSummary,
    contraceptiveSafety,
    vteRiskAssessment,
    safetyAlerts,
    clinicalRecommendations,
    familyScreening,
    populationContext
  };
}

/**
 * Example usage and testing
 */
export function testF5Analysis() {
  console.log('=== F5 (Factor V Leiden) Test Cases ===\n');

  // Test Case 1: Normal (G/G)
  console.log('Test 1: Normal - No Factor V Leiden (G/G)');
  const result1 = analyzeF5('G/G');
  console.log(result1.clinicalSummary);
  console.log('\nContraceptive Safety:', result1.contraceptiveSafety);
  console.log('\n' + '='.repeat(80) + '\n');

  // Test Case 2: Heterozygous (G/A) - MOST COMMON CLINICAL SCENARIO
  console.log('Test 2: Heterozygous Factor V Leiden (G/A) - HIGH RISK');
  const result2 = analyzeF5('G/A');
  console.log(result2.clinicalSummary);
  console.log('\nContraceptive Safety:', result2.contraceptiveSafety);
  console.log('\nSafety Alerts:', result2.safetyAlerts.slice(0, 4));
  console.log('\nRecommended Contraceptives:', result2.contraceptiveSafety.recommendedAlternatives);
  console.log('\n' + '='.repeat(80) + '\n');

  // Test Case 3: Homozygous (A/A) - VERY HIGH RISK
  console.log('Test 3: Homozygous Factor V Leiden (A/A) - EXTREME RISK');
  const result3 = analyzeF5('A/A');
  console.log(result3.clinicalSummary);
  console.log('\nVTE Risk Assessment:', result3.vteRiskAssessment);
  console.log('\nSafety Alerts:', result3.safetyAlerts);
  console.log('\nClinical Recommendations:', result3.clinicalRecommendations);
  console.log('\n' + '='.repeat(80) + '\n');
}
