/**
 * CYP3A5 PHARMACOGENOMICS ANALYZER (v2)
 *
 * CYP3A5 encodes cytochrome P450 3A5, part of the CYP3A subfamily which metabolizes
 * ~50% of all prescription drugs. Together with CYP3A4, the CYP3A family is responsible
 * for 37% of the 200 most frequently prescribed drugs in the US.
 *
 * CRITICAL CLINICAL CONTEXT:
 * - Most people (60-90%) carry CYP3A5*3 → NO enzyme expression
 * - CYP3A5 expressors: *1/*1 or *1/*3 (10-40% depending on ancestry)
 * - African ancestry: 40-50% expressors
 * - European ancestry: 10-20% expressors
 * - Asian ancestry: 15-30% expressors
 *
 * KEY SUBSTRATES (PERSONAL RELEVANCE):
 * 🔥 ALPRAZOLAM (Xanax):
 *    - CYP3A4/CYP3A5 primary metabolism (>80%)
 *    - CYP3A5 expressors: Potentially FASTER clearance → lower drug levels
 *    - CYP3A5 non-expressors: More dependent on CYP3A4 → standard levels
 *    - NOTE: No CPIC guideline - informational only
 *
 * 🔥 SILDENAFIL/TADALAFIL (Viagra/Cialis):
 *    - CYP3A4 primary (79%), CYP3A5 secondary
 *    - CYP3A5 expressors: May have lower drug levels
 *    - NOTE: Some evidence for dose adjustment in expressors
 *
 * 🔥 ZOLPIDEM (Ambien):
 *    - CYP3A4 primary (61%), CYP3A5 secondary
 *    - Limited pharmacogenomic data
 *
 * OTHER CRITICAL SUBSTRATES:
 * - Tacrolimus (immunosuppressant) - CPIC Level A guideline exists
 * - Midazolam (anesthesia/sedation)
 * - Statins (atorvastatin, simvastatin)
 * - Calcium channel blockers
 * - Protease inhibitors
 *
 * CRITICAL VARIANTS:
 * - CYP3A5*3 (rs776746, g.6986A>G): Most important variant
 *   • Creates splicing defect → NO enzyme expression
 *   • Frequency: 60-90% in most populations
 *   • *3/*3 homozygotes: NO CYP3A5 enzyme (rely 100% on CYP3A4)
 *
 * - CYP3A5*6 (rs10264272): African-specific, no function
 * - CYP3A5*7 (rs41303343): African-specific, no function
 *
 * COMPLEXITY NOTES:
 * ⚠️ Unlike CYP2D6, CYP3A5 uses EXPRESSION phenotypes, not metabolizer phenotypes:
 * - "Expressor" = *1/*1 (normal CYP3A5 expression)
 * - "Intermediate Expressor" = *1/*3 (reduced CYP3A5 expression)
 * - "Non-expressor" = *3/*3 (NO CYP3A5 expression)
 *
 * ⚠️ NO activity score system (unlike CYP2D6, CYP2C9)
 * ⚠️ CYP3A4 genetic variation also matters but is harder to assess from SNP arrays
 *
 * CLINICAL IMPACT:
 * - Tacrolimus: CPIC guideline recommends 1.5-2x higher doses for CYP3A5 expressors
 * - Alprazolam/Sildenafil/Zolpidem: NO formal guidelines (informational only)
 * - Most CYP3A5*3/*3 individuals rely entirely on CYP3A4 for CYP3A metabolism
 *
 * CPIC GUIDELINES:
 * - Level A: Tacrolimus (transplant immunosuppression)
 * - NO guidelines for: Alprazolam, sildenafil, tadalafil, zolpidem, benzodiazepines
 *
 * REFERENCES:
 * - CPIC Guideline Tacrolimus: PMID 25801146
 * - PharmVar Database: www.pharmvar.org/gene/CYP3A5
 * - AMP/CPIC CYP3A4/CYP3A5 Genotyping Recommendations 2023: PMID 37632460
 * - PharmGKB CYP3A5 Summary: PMID 23876845
 */

export type GeneticProvider = 'unknown' | '23andme' | 'ancestrydna';

/**
 * CYP3A5 star alleles
 */
export type CYP3A5Allele = '*1' | '*3' | '*6' | '*7' | 'Unknown';

/**
 * CYP3A5 phenotypes based on expression level
 * NOTE: Uses "expressor" terminology, not "metabolizer"
 */
export type CYP3A5Phenotype =
  | 'Expressor'           // *1/*1 - normal CYP3A5 expression
  | 'Intermediate Expressor'  // *1/*3 - reduced CYP3A5 expression
  | 'Non-expressor'       // *3/*3 - NO CYP3A5 expression
  | 'Unknown';

/**
 * Confidence level for the analysis
 */
export type ConfidenceLevel = 'high' | 'medium' | 'low';

/**
 * Risk level for drug recommendations
 */
export type RiskLevel = 'informational' | 'moderate' | 'standard';

/**
 * Individual drug recommendation
 */
export interface CYP3A5DrugRecommendation {
  drug: string;
  category?: string;
  recommendation: string;
  doseAdjustment?: string;
  riskLevel: RiskLevel;
  cpicGuideline: boolean;  // True only for tacrolimus
  cpicLevel?: 'A' | 'B' | 'C';
  evidenceLevel?: string;  // PharmGKB level
  references?: string[];
}

/**
 * Diplotype with phenotype
 */
export interface CYP3A5Diplotype {
  allele1: CYP3A5Allele;
  allele2: CYP3A5Allele;
  phenotype: CYP3A5Phenotype;
  confidence?: ConfidenceLevel;
}

/**
 * Complete CYP3A5 analysis result
 */
export interface CYP3A5AnalysisResult {
  gene: 'CYP3A5';
  diplotype: CYP3A5Diplotype;
  drugs: CYP3A5DrugRecommendation[];
  clinicalSummary: string;
  confidence: ConfidenceLevel;
  limitations: string[];
  guidelines: {
    cpic: string;
    notes: string[];
  };
}

/**
 * Normalize genotype to canonical form
 */
function normalizeGenotype(genotype: string | null): string | null {
  if (!genotype) return null;

  // Remove whitespace and convert to uppercase
  let normalized = genotype.trim().toUpperCase();

  // Remove separators
  normalized = normalized.replace(/[\s\-\/]/g, '');

  // Sort alleles alphabetically for consistency
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
): CYP3A5Diplotype {

  // Extract CYP3A5*3 SNP (most important variant)
  const rs776746 = genotypes.find(g => g.rsid === 'rs776746')?.genotype || null;

  // Extract African-specific variants (if present)
  // NOTE: rs10264272 (CYP3A5*6) and rs41303343 (CYP3A5*7) are rare African-specific variants
  // Currently not analyzed - would require more complex haplotyping
  // const rs10264272 = genotypes.find(g => g.rsid === 'rs10264272')?.genotype || null;
  // const rs41303343 = genotypes.find(g => g.rsid === 'rs41303343')?.genotype || null;

  // Initialize default state
  let allele1: CYP3A5Allele = '*1';
  let allele2: CYP3A5Allele = '*1';

  // Check CYP3A5*3 (rs776746, g.6986A>G)
  // A = reference (*1), G = variant (*3)
  if (rs776746) {
    const norm = normalizeGenotype(rs776746);
    if (norm === 'AA') {
      // *1/*1 - homozygous reference (expressor)
      allele1 = '*1';
      allele2 = '*1';
    } else if (norm === 'AG') {
      // *1/*3 - heterozygous (intermediate expressor)
      allele1 = '*1';
      allele2 = '*3';
    } else if (norm === 'GG') {
      // *3/*3 - homozygous variant (non-expressor)
      allele1 = '*3';
      allele2 = '*3';
    }
  }

  // Check African-specific variants (if present)
  // These are rare but important for complete analysis
  // For simplicity, we'll note their presence but not change diplotype
  // (proper haplotyping would require more complex analysis)

  // Determine phenotype
  const phenotype = diplotypeToPhenotype(allele1, allele2);

  return {
    allele1,
    allele2,
    phenotype,
    confidence: determineConfidenceLevel(allele1, allele2, genotypes)
  };
}

/**
 * Map diplotype to phenotype
 */
function diplotypeToPhenotype(allele1: CYP3A5Allele, allele2: CYP3A5Allele): CYP3A5Phenotype {
  // *1/*1 = Expressor (normal CYP3A5 expression)
  if (allele1 === '*1' && allele2 === '*1') {
    return 'Expressor';
  }

  // *1/*3 = Intermediate Expressor (reduced CYP3A5 expression)
  if ((allele1 === '*1' && allele2 === '*3') || (allele1 === '*3' && allele2 === '*1')) {
    return 'Intermediate Expressor';
  }

  // *3/*3 = Non-expressor (NO CYP3A5 expression)
  if (allele1 === '*3' && allele2 === '*3') {
    return 'Non-expressor';
  }

  // *1/*6, *1/*7, *6/*6, *7/*7, etc. = Non-expressors (rare, African-specific)
  if ((allele1 === '*6' || allele1 === '*7') || (allele2 === '*6' || allele2 === '*7')) {
    return 'Non-expressor';
  }

  return 'Unknown';
}

/**
 * Determine confidence level
 */
function determineConfidenceLevel(
  allele1: CYP3A5Allele,
  allele2: CYP3A5Allele,
  genotypes: Array<{ rsid: string; genotype: string }>
): ConfidenceLevel {

  // Unknown diplotype = low confidence
  if (allele1 === 'Unknown' || allele2 === 'Unknown') {
    return 'low';
  }

  // Check if we have the key SNP
  const hasRs776746 = genotypes.some(g => g.rsid === 'rs776746');

  if (!hasRs776746) {
    return 'low';
  }

  // If we have rs776746 and known diplotype, high confidence
  return 'high';
}

/**
 * Generate drug recommendations
 */
function generateDrugRecommendations(
  diplotype: CYP3A5Diplotype
): CYP3A5DrugRecommendation[] {
  const recommendations: CYP3A5DrugRecommendation[] = [];
  const { phenotype } = diplotype;

  // Alprazolam (NO CPIC guideline - informational only)
  recommendations.push(...generateAlprazolamRecommendations(phenotype));

  // Sildenafil/Tadalafil (NO CPIC guideline - informational only)
  recommendations.push(...generateSildenafilRecommendations(phenotype));

  // Zolpidem (NO CPIC guideline - informational only)
  recommendations.push(...generateZolpidemRecommendations(phenotype));

  // Tacrolimus (CPIC Level A guideline)
  recommendations.push(...generateTacrolimusRecommendations(phenotype));

  return recommendations;
}

/**
 * Generate alprazolam-specific recommendations
 */
function generateAlprazolamRecommendations(phenotype: CYP3A5Phenotype): CYP3A5DrugRecommendation[] {
  if (phenotype === 'Expressor') {
    return [{
      drug: 'Alprazolam (Xanax)',
      category: 'Benzodiazepines',
      recommendation: 'ℹ️ EXPRESSOR: May have faster alprazolam clearance → potentially lower drug levels',
      doseAdjustment: 'No formal guideline. Standard dosing recommended. Monitor response.',
      riskLevel: 'informational',
      cpicGuideline: false,
      evidenceLevel: 'PharmGKB Level 3-4 (limited evidence)',
      references: ['CYP3A5 metabolizes alprazolam', 'No CPIC guideline available']
    }];
  }

  if (phenotype === 'Intermediate Expressor') {
    return [{
      drug: 'Alprazolam (Xanax)',
      category: 'Benzodiazepines',
      recommendation: 'ℹ️ INTERMEDIATE EXPRESSOR: Moderate CYP3A5 expression',
      doseAdjustment: 'Standard dosing recommended',
      riskLevel: 'standard',
      cpicGuideline: false
    }];
  }

  return [{
    drug: 'Alprazolam (Xanax)',
    category: 'Benzodiazepines',
    recommendation: '✓ NON-EXPRESSOR: Standard alprazolam metabolism via CYP3A4',
    doseAdjustment: 'Standard dosing',
    riskLevel: 'standard',
    cpicGuideline: false
  }];
}

/**
 * Generate sildenafil/tadalafil recommendations
 */
function generateSildenafilRecommendations(phenotype: CYP3A5Phenotype): CYP3A5DrugRecommendation[] {
  if (phenotype === 'Expressor') {
    return [{
      drug: 'Sildenafil/Tadalafil (Viagra/Cialis)',
      category: 'PDE5 Inhibitors',
      recommendation: 'ℹ️ EXPRESSOR: May have lower sildenafil levels',
      doseAdjustment: 'Consider standard to higher dosing if inadequate response',
      riskLevel: 'informational',
      cpicGuideline: false,
      evidenceLevel: 'Some clinical evidence',
      references: ['PMID: 28440343 - CYP3A4 genotype associated with sildenafil concentrations']
    }];
  }

  return [{
    drug: 'Sildenafil/Tadalafil (Viagra/Cialis)',
    category: 'PDE5 Inhibitors',
    recommendation: '✓ Standard sildenafil/tadalafil metabolism',
    doseAdjustment: 'Standard dosing',
    riskLevel: 'standard',
    cpicGuideline: false
  }];
}

/**
 * Generate zolpidem recommendations
 */
function generateZolpidemRecommendations(phenotype: CYP3A5Phenotype): CYP3A5DrugRecommendation[] {
  if (phenotype === 'Expressor') {
    return [{
      drug: 'Zolpidem (Ambien)',
      category: 'Sedative-Hypnotics',
      recommendation: 'ℹ️ EXPRESSOR: CYP3A4 is primary pathway (61%), CYP3A5 secondary',
      doseAdjustment: 'Standard dosing',
      riskLevel: 'informational',
      cpicGuideline: false,
      evidenceLevel: 'Limited pharmacogenomic data'
    }];
  }

  return [{
    drug: 'Zolpidem (Ambien)',
    category: 'Sedative-Hypnotics',
    recommendation: '✓ Standard zolpidem metabolism',
    doseAdjustment: 'Standard dosing',
    riskLevel: 'standard',
    cpicGuideline: false
  }];
}

/**
 * Generate tacrolimus recommendations (CPIC guideline)
 */
function generateTacrolimusRecommendations(phenotype: CYP3A5Phenotype): CYP3A5DrugRecommendation[] {
  if (phenotype === 'Expressor') {
    return [{
      drug: 'Tacrolimus (Prograf)',
      category: 'Immunosuppressants',
      recommendation: '⚠️ EXPRESSOR: Increased tacrolimus metabolism → LOWER drug levels',
      doseAdjustment: 'CPIC: Recommend 1.5-2x higher starting dose. Monitor levels closely.',
      riskLevel: 'moderate',
      cpicGuideline: true,
      cpicLevel: 'A',
      references: ['CPIC Guideline PMID: 25801146']
    }];
  }

  if (phenotype === 'Intermediate Expressor') {
    return [{
      drug: 'Tacrolimus (Prograf)',
      category: 'Immunosuppressants',
      recommendation: '⚠️ INTERMEDIATE: Moderately increased tacrolimus metabolism',
      doseAdjustment: 'CPIC: Consider 1.2-1.5x higher starting dose. Monitor levels.',
      riskLevel: 'moderate',
      cpicGuideline: true,
      cpicLevel: 'A'
    }];
  }

  return [{
    drug: 'Tacrolimus (Prograf)',
    category: 'Immunosuppressants',
    recommendation: '✓ NON-EXPRESSOR: Standard tacrolimus metabolism',
    doseAdjustment: 'Standard dosing per CPIC guideline',
    riskLevel: 'standard',
    cpicGuideline: true,
    cpicLevel: 'A'
  }];
}

/**
 * Get limitations
 */
function getLimitations(provider: GeneticProvider): string[] {
  const limitations: string[] = [
    '⚠️ NO CPIC guidelines exist for alprazolam, sildenafil, tadalafil, or zolpidem',
    'CYP3A5 recommendations for these drugs are INFORMATIONAL only, not actionable',
    'CYP3A4 genetic variation also matters but is harder to assess from SNP arrays',
    'Most people (60-90%) are CYP3A5 non-expressors (*3/*3) and rely on CYP3A4',
    'Drug-drug interactions with CYP3A4 inhibitors/inducers are more clinically significant'
  ];

  if (provider === '23andme' || provider === 'ancestrydna') {
    limitations.push('Consumer genetic tests may not include rare CYP3A5 variants (*6, *7)');
  }

  return limitations;
}

/**
 * MAIN ANALYSIS FUNCTION
 */
export function analyzeCYP3A5(
  genotypes: Array<{ rsid: string; genotype: string }>,
  
  _provider: GeneticProvider = '23andme'
): CYP3A5AnalysisResult {

  // Determine diplotype
  const diplotype = determineDiplotype(genotypes);

  // Generate drug recommendations
  const drugs = generateDrugRecommendations(diplotype);

  // Determine confidence
  const confidence = diplotype.confidence || 'low';

  // Get limitations
  const limitations = getLimitations(_provider);

  // Generate clinical summary
  const clinicalSummary = generateClinicalSummary(diplotype);

  return {
    gene: 'CYP3A5',
    diplotype,
    drugs,
    clinicalSummary,
    confidence,
    limitations,
    guidelines: {
      cpic: 'CPIC Guideline for CYP3A5 and Tacrolimus (PMID: 25801146)',
      notes: [
        'NO CPIC guidelines for alprazolam, sildenafil, tadalafil, zolpidem',
        'CYP3A5*3 is the most common variant (60-90% of populations)',
        'Most people are CYP3A5 non-expressors and rely on CYP3A4 for CYP3A metabolism'
      ]
    }
  };
}

/**
 * Generate clinical summary
 */
function generateClinicalSummary(diplotype: CYP3A5Diplotype): string {
  const { phenotype, allele1, allele2 } = diplotype;

  let summary = `CYP3A5 ${allele1}/${allele2} - ${phenotype}\n\n`;

  if (phenotype === 'Expressor') {
    summary += '🔍 EXPRESSOR: You have functional CYP3A5 enzyme expression\n\n';
    summary += '**Clinical Significance:**\n';
    summary += '- Faster metabolism of CYP3A5 substrates → potentially lower drug levels\n';
    summary += '- **Tacrolimus**: CPIC recommends 1.5-2x higher dose (if prescribed)\n';
    summary += '- **Alprazolam**: May have slightly lower levels (no formal guideline)\n';
    summary += '- **Sildenafil**: May need higher doses if inadequate response\n\n';
    summary += '**Population Context**: 10-40% of people (varies by ancestry)\n';
  } else if (phenotype === 'Intermediate Expressor') {
    summary += '🔍 INTERMEDIATE EXPRESSOR: Reduced CYP3A5 enzyme expression\n\n';
    summary += '**Clinical Significance:**\n';
    summary += '- Moderately faster metabolism of some CYP3A5 substrates\n';
    summary += '- **Tacrolimus**: CPIC suggests 1.2-1.5x higher dose (if prescribed)\n';
    summary += '- Most other drugs: Standard dosing\n\n';
    summary += '**Population Context**: Variable by ancestry (heterozygotes)\n';
  } else {
    summary += '✓ NON-EXPRESSOR: NO functional CYP3A5 enzyme expression\n\n';
    summary += '**Clinical Significance:**\n';
    summary += '- You rely ENTIRELY on CYP3A4 for CYP3A metabolism\n';
    summary += '- Standard dosing for most medications\n';
    summary += '- More susceptible to CYP3A4 drug-drug interactions\n\n';
    summary += '**Population Context**: 60-90% of most populations (most common)\n';
  }

  return summary;
}
