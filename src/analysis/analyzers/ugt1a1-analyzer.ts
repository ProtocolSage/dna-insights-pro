/**
 * UGT1A1 PHARMACOGENOMICS ANALYZER (v2)
 *
 * UGT1A1 (UDP-glucuronosyltransferase 1A1) is crucial for:
 * - Irinotecan chemotherapy metabolism (FDA-labeled, CPIC Level A)
 * - Cabotegravir (Apretude) PrEP metabolism
 * - Bilirubin conjugation (Gilbert syndrome)
 * - Nilotinib and belinostat metabolism
 *
 * KEY VARIANTS:
 * - *28 (rs8175347, TA repeat): Most common, ~10% European homozygotes
 * - *6 (rs4148323): Common in East Asians (~20%)
 * - *27 (rs887829): African-specific
 *
 * CLINICAL SIGNIFICANCE:
 * - Poor metabolizers: 30% dose reduction for irinotecan (FDA label)
 * - Gilbert syndrome (benign): Mild jaundice, no treatment needed
 * - Cabotegravir: Increased exposure in poor metabolizers
 *
 * REFERENCES:
 * - CPIC Guideline: PMID 15883587 (Irinotecan)
 * - FDA Label: Irinotecan
 * - Cabotegravir: UGT1A1/1A9 metabolism (FDA label)
 */

export type GeneticProvider = 'unknown' | '23andme' | 'ancestrydna';

/**
 * UGT1A1 star alleles
 */
export type UGT1A1Allele = '*1' | '*6' | '*27' | '*28' | 'Unknown';

/**
 * UGT1A1 phenotypes based on CPIC guidelines
 */
export type UGT1A1Phenotype =
  | 'Normal Metabolizer'
  | 'Intermediate Metabolizer'
  | 'Poor Metabolizer'
  | 'Unknown';

/**
 * Confidence level for the analysis
 */
export type ConfidenceLevel = 'high' | 'medium' | 'low';

/**
 * Risk level for drug recommendations
 */
export type RiskLevel = 'critical' | 'warning' | 'moderate' | 'standard';

/**
 * Individual drug recommendation
 */
export interface UGT1A1DrugRecommendation {
  drug: string;
  recommendation: string;
  doseAdjustment?: string;
  riskLevel: RiskLevel;
  fdaLabel?: boolean;
  cpicLevel?: 'A' | 'B';
  references?: string[];
}

/**
 * Diplotype with phenotype and activity score
 */
export interface UGT1A1Diplotype {
  allele1: UGT1A1Allele;
  allele2: UGT1A1Allele;
  phenotype: UGT1A1Phenotype;
  activityScore: number;
}

/**
 * Complete UGT1A1 analysis result
 */
export interface UGT1A1AnalysisResult {
  gene: 'UGT1A1';
  diplotype: UGT1A1Diplotype;
  drugs: UGT1A1DrugRecommendation[];
  gilbertSyndrome: {
    status: 'Positive' | 'Carrier' | 'Negative' | 'Unknown';
    clinicalSignificance: string;
  };
  clinicalSummary: string;
  safetyAlerts: string[];
  confidence: ConfidenceLevel;
  limitations: string[];
  guidelines: {
    cpic: string;
    fda: string[];
  };
}

/**
 * Normalize genotype to canonical form
 */
function normalizeGenotype(genotype: string | null): string | null {
  if (!genotype) return null;

  // Remove whitespace and convert to uppercase
  let normalized = genotype.trim().toUpperCase();

  // Handle different formats
  normalized = normalized.replace(/[\s\-\/]/g, '');

  // Sort alleles alphabetically for consistency (e.g., "TC" -> "CT")
  if (normalized.length === 2) {
    const sorted = normalized.split('').sort().join('');
    return sorted;
  }

  return normalized;
}

/**
 * Determine diplotype from genotypes
 */
function determineDiplotype(
  genotypes: Array<{ rsid: string; genotype: string }>
): UGT1A1Diplotype {

  // Extract relevant SNPs
  const rs4148323 = genotypes.find(g => g.rsid === 'rs4148323')?.genotype || null;
  const rs887829 = genotypes.find(g => g.rsid === 'rs887829')?.genotype || null;
  // Note: rs8175347 is the TA repeat - not reliably detected on SNP arrays

  // Determine alleles
  let allele1: UGT1A1Allele = '*1';
  let allele2: UGT1A1Allele = '*1';
  let activity1 = 1.0;
  let activity2 = 1.0;

  // Check *6 (rs4148323)
  if (rs4148323) {
    const norm = normalizeGenotype(rs4148323);
    if (norm === 'AG') {
      allele1 = '*1';
      allele2 = '*6';
      activity1 = 1.0;
      activity2 = 0.3;
    } else if (norm === 'AA') {
      allele1 = '*6';
      allele2 = '*6';
      activity1 = 0.3;
      activity2 = 0.3;
    }
  }

  // Check *27 (rs887829) - only if not already assigned
  if (rs887829 && allele1 === '*1' && allele2 === '*1') {
    const norm = normalizeGenotype(rs887829);
    if (norm === 'CT') {
      allele1 = '*1';
      allele2 = '*27';
      activity1 = 1.0;
      activity2 = 0.5;
    } else if (norm === 'TT') {
      allele1 = '*27';
      allele2 = '*27';
      activity1 = 0.5;
      activity2 = 0.5;
    }
  }

  // Calculate activity score
  const activityScore = activity1 + activity2;

  // Determine phenotype
  const phenotype = activityScoreToPhenotype(activityScore);

  return {
    allele1,
    allele2,
    phenotype,
    activityScore
  };
}

/**
 * Map activity score to phenotype
 * Based on CPIC guidelines for UGT1A1
 */
function activityScoreToPhenotype(activityScore: number): UGT1A1Phenotype {
  if (activityScore < 1.0) {
    return 'Poor Metabolizer';
  } else if (activityScore >= 1.0 && activityScore <= 1.5) {
    return 'Intermediate Metabolizer';
  } else if (activityScore > 1.5) {
    return 'Normal Metabolizer';
  }
  return 'Unknown';
}

/**
 * Generate drug recommendations
 */
function generateDrugRecommendations(
  diplotype: UGT1A1Diplotype
): UGT1A1DrugRecommendation[] {
  const recommendations: UGT1A1DrugRecommendation[] = [];
  const { phenotype, activityScore } = diplotype;

  // IRINOTECAN (FDA-labeled, CPIC Level A)
  recommendations.push(...generateIrinotecanRecommendations(phenotype, activityScore));

  // CABOTEGRAVIR (Apretude PrEP)
  recommendations.push(...generateCabotegravirRecommendations(phenotype, activityScore));

  // NILOTINIB
  if (phenotype === 'Poor Metabolizer' || phenotype === 'Intermediate Metabolizer') {
    recommendations.push({
      drug: 'Nilotinib (Tasigna)',
      recommendation: 'Monitor for QT prolongation and hepatotoxicity',
      doseAdjustment: 'Standard dosing, enhanced monitoring',
      riskLevel: 'moderate',
      fdaLabel: true
    });
  }

  // BELINOSTAT
  if (phenotype === 'Poor Metabolizer' || phenotype === 'Intermediate Metabolizer') {
    recommendations.push({
      drug: 'Belinostat (Beleodaq)',
      recommendation: 'Monitor for increased toxicity',
      doseAdjustment: 'Consider dose reduction if toxicity occurs',
      riskLevel: 'moderate',
      fdaLabel: true
    });
  }

  return recommendations;
}

/**
 * Generate irinotecan-specific recommendations
 */
function generateIrinotecanRecommendations(
  phenotype: UGT1A1Phenotype,
  _activityScore: number
): UGT1A1DrugRecommendation[] {

  if (phenotype === 'Poor Metabolizer') {
    return [{
      drug: 'Irinotecan (Camptosar)',
      recommendation: '🚨 POOR METABOLIZER: HIGH RISK of severe diarrhea and neutropenia',
      doseAdjustment: 'REDUCE starting dose by 30% - FDA recommendation',
      riskLevel: 'critical',
      fdaLabel: true,
      cpicLevel: 'A',
      references: ['PMID: 15883587', 'PMID: 16116063', 'FDA Label']
    }];
  }

  if (phenotype === 'Intermediate Metabolizer') {
    return [{
      drug: 'Irinotecan (Camptosar)',
      recommendation: '⚠️ INTERMEDIATE METABOLIZER: Increased risk of toxicity',
      doseAdjustment: 'Consider 20% dose reduction. Monitor closely for diarrhea/neutropenia',
      riskLevel: 'warning',
      fdaLabel: true,
      cpicLevel: 'A',
      references: ['PMID: 15883587', 'FDA Label']
    }];
  }

  return [{
    drug: 'Irinotecan (Camptosar)',
    recommendation: '✓ NORMAL METABOLIZER: Standard dosing',
    doseAdjustment: 'No dose adjustment needed based on UGT1A1 genotype',
    riskLevel: 'standard',
    fdaLabel: true,
    cpicLevel: 'A'
  }];
}

/**
 * Generate cabotegravir-specific recommendations (for Apretude PrEP)
 */
function generateCabotegravirRecommendations(
  phenotype: UGT1A1Phenotype,
  _activityScore: number
): UGT1A1DrugRecommendation[] {

  if (phenotype === 'Poor Metabolizer') {
    return [{
      drug: 'Cabotegravir (Apretude PrEP, Vocabria)',
      recommendation: '⚠️ POOR METABOLIZER: May have INCREASED cabotegravir levels',
      doseAdjustment: 'Standard dosing per FDA label. Enhanced monitoring recommended for injection site reactions and adverse events',
      riskLevel: 'moderate',
      fdaLabel: false, // Not in FDA label yet, but clinically relevant
      references: ['Cabotegravir metabolized by UGT1A1/UGT1A9']
    }];
  }

  if (phenotype === 'Intermediate Metabolizer') {
    return [{
      drug: 'Cabotegravir (Apretude PrEP, Vocabria)',
      recommendation: 'INTERMEDIATE METABOLIZER: Slightly increased cabotegravir exposure possible',
      doseAdjustment: 'Standard dosing. Monitor for injection site reactions',
      riskLevel: 'moderate',
      fdaLabel: false
    }];
  }

  return [{
    drug: 'Cabotegravir (Apretude PrEP, Vocabria)',
    recommendation: '✓ NORMAL METABOLIZER: Standard metabolism expected',
    doseAdjustment: 'Standard dosing (600mg IM every 2 months after loading)',
    riskLevel: 'standard',
    fdaLabel: false
  }];
}

/**
 * Determine Gilbert syndrome status
 */
function determineGilbertSyndrome(diplotype: UGT1A1Diplotype): {
  status: 'Positive' | 'Carrier' | 'Negative' | 'Unknown';
  clinicalSignificance: string;
} {

  const { allele1, allele2, activityScore } = diplotype;

  // Poor metabolizer = Gilbert syndrome
  if (activityScore < 0.7) {
    return {
      status: 'Positive',
      clinicalSignificance: '🟡 GILBERT SYNDROME: Mild unconjugated hyperbilirubinemia (usually <3 mg/dL). Benign condition - no treatment needed. May cause mild jaundice during fasting or illness. Not associated with liver disease.'
    };
  }

  // Heterozygous = carrier
  if (allele1 !== allele2 && (allele1 === '*6' || allele1 === '*27' || allele1 === '*28' ||
    allele2 === '*6' || allele2 === '*27' || allele2 === '*28')) {
    return {
      status: 'Carrier',
      clinicalSignificance: 'Carrier for Gilbert syndrome variant. May have slightly elevated bilirubin during fasting, but typically no clinical symptoms.'
    };
  }

  return {
    status: 'Negative',
    clinicalSignificance: 'No Gilbert syndrome variants detected. Normal bilirubin metabolism expected.'
  };
}

/**
 * Generate safety alerts
 */
function generateSafetyAlerts(diplotype: UGT1A1Diplotype): string[] {
  const alerts: string[] = [];
  const { phenotype } = diplotype;

  if (phenotype === 'Poor Metabolizer') {
    alerts.push('⛔ IRINOTECAN: 30% dose reduction required (FDA label)');
    alerts.push('⚠️ CABOTEGRAVIR: Monitor for increased exposure');
    alerts.push('🟡 Gilbert syndrome likely - benign, no treatment needed');
  }

  if (phenotype === 'Intermediate Metabolizer') {
    alerts.push('⚠️ IRINOTECAN: Consider dose reduction and close monitoring');
    alerts.push('Monitor for elevated bilirubin (mild Gilbert phenotype possible)');
  }

  return alerts;
}

/**
 * Determine confidence level
 */
function determineConfidence(
  diplotype: UGT1A1Diplotype,
  _provider: GeneticProvider,
  genotypes: Array<{ rsid: string; genotype: string }>
): ConfidenceLevel {

  // Check if we have the key SNPs
  const hasRs4148323 = genotypes.some(g => g.rsid === 'rs4148323');
  const hasRs887829 = genotypes.some(g => g.rsid === 'rs887829');

  // Unknown diplotype = low confidence
  if (diplotype.allele1 === 'Unknown' || diplotype.allele2 === 'Unknown') {
    return 'low';
  }

  // If we have at least one key SNP, medium confidence
  if (hasRs4148323 || hasRs887829) {
    return 'medium';
  }

  // Default *1/*1 with no SNP data = low confidence
  if (diplotype.allele1 === '*1' && diplotype.allele2 === '*1' && !hasRs4148323 && !hasRs887829) {
    return 'low';
  }

  return 'medium';
}

/**
 * Get limitations
 */
function getLimitations(provider: GeneticProvider): string[] {
  const limitations: string[] = [
    '⚠️ UGT1A1*28 (TA repeat) is NOT reliably detected on SNP arrays - requires separate testing',
    'Most consumer tests only detect *6 and *27, not *28',
    'True Gilbert syndrome diagnosis requires *28/*28 genotyping'
  ];

  if (provider === '23andme' || provider === 'ancestrydna') {
    limitations.push('Consumer genetic tests may miss rare/novel UGT1A1 variants');
  }

  return limitations;
}

/**
 * MAIN ANALYSIS FUNCTION
 */
export function analyzeUGT1A1(
  genotypes: Array<{ rsid: string; genotype: string }>,

  _provider: GeneticProvider = '23andme'
): UGT1A1AnalysisResult {

  // Determine diplotype
  const diplotype = determineDiplotype(genotypes);

  // Generate drug recommendations
  const drugs = generateDrugRecommendations(diplotype);

  // Determine Gilbert syndrome status
  const gilbertSyndrome = determineGilbertSyndrome(diplotype);

  // Generate safety alerts
  const safetyAlerts = generateSafetyAlerts(diplotype);

  // Determine confidence
  const confidence = determineConfidence(diplotype, _provider, genotypes);

  // Get limitations
  const limitations = getLimitations(_provider);

  // Generate clinical summary
  const clinicalSummary = generateClinicalSummary(diplotype, gilbertSyndrome);

  return {
    gene: 'UGT1A1',
    diplotype,
    drugs,
    gilbertSyndrome,
    clinicalSummary,
    safetyAlerts,
    confidence,
    limitations,
    guidelines: {
      cpic: 'CPIC Guideline for UGT1A1 and Irinotecan (PMID: 15883587)',
      fda: [
        'Irinotecan FDA label includes UGT1A1*28 testing recommendation',
        'Nilotinib and Belinostat labels mention UGT1A1'
      ]
    }
  };
}

/**
 * Generate clinical summary
 */
function generateClinicalSummary(
  diplotype: UGT1A1Diplotype,
  gilbertSyndrome: { status: string; clinicalSignificance: string }
): string {
  const { phenotype, activityScore, allele1, allele2 } = diplotype;

  let summary = `UGT1A1 ${allele1}/${allele2} - ${phenotype} (Activity Score: ${activityScore.toFixed(1)})\n\n`;

  if (phenotype === 'Poor Metabolizer') {
    summary += '🚨 CRITICAL: Poor UGT1A1 function detected\n\n';
    summary += '**Irinotecan Chemotherapy**: 30% dose reduction required per FDA label\n';
    summary += '**Cabotegravir (Apretude)**: Monitor for increased drug levels\n';
    summary += `**Gilbert Syndrome**: ${gilbertSyndrome.clinicalSignificance}\n`;
  } else if (phenotype === 'Intermediate Metabolizer') {
    summary += '⚠️ WARNING: Reduced UGT1A1 function\n\n';
    summary += '**Irinotecan**: Consider dose reduction, monitor closely\n';
    summary += '**Cabotegravir**: Slightly increased exposure possible\n';
    summary += `**Gilbert Syndrome**: ${gilbertSyndrome.clinicalSignificance}\n`;
  } else {
    summary += '✓ Normal UGT1A1 function\n\n';
    summary += 'Standard dosing for UGT1A1-metabolized drugs.\n';
  }

  return summary;
}
