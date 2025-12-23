/**
 * PGx API v2 Schemas - Zod Validation
 * 
 * Medical-grade schema validation for pharmacogenomics analysis results.
 * These schemas enforce the v2 API contract and generate TypeScript types.
 * 
 * Clinical References:
 * - CPIC Guidelines: https://cpicpgx.org/guidelines/
 * - PharmGKB: https://www.pharmgkb.org/
 * - FDA Drug Labeling: https://www.fda.gov/drugs/science-and-research-drugs/table-pharmacogenomic-biomarkers-drug-labeling
 */

import { z } from 'zod';

// =============================================================================
// COMMON SCHEMAS
// =============================================================================

/**
 * Confidence level for analysis results
 * high: All required SNPs present, validated genotype
 * medium: Some SNPs missing, inferred result
 * low: Insufficient data, unknown phenotype
 */
export const ConfidenceLevelSchema = z.enum(['high', 'medium', 'low']);

/**
 * Data provider for genotype source
 */
export const GeneticProviderSchema = z.enum(['23andme', 'unknown']);

/**
 * Clinical reference with PMID or URL
 */
export const ClinicalReferenceSchema = z.object({
    type: z.enum(['PMID', 'URL', 'DOI', 'PharmGKB', 'ClinVar']),
    id: z.string(),
    description: z.string().optional(),
});

/**
 * API metadata for all responses
 */
export const ApiMetadataSchema = z.object({
    version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Must be semver format'),
    timestamp: z.string().datetime(),
    disclaimer: z.string().min(50, 'Disclaimer must be at least 50 characters'),
    references: z.array(ClinicalReferenceSchema),
});

// =============================================================================
// GENOTYPE SCHEMAS
// =============================================================================

/**
 * Raw genotype input from 23andMe
 */
export const GenotypeInputSchema = z.object({
    rsid: z.string().regex(/^rs\d+$/, 'Must be valid rsID format'),
    genotype: z.string().min(1).max(4),
});

/**
 * Normalized genotype after processing
 */
export const NormalizedGenotypeSchema = z.object({
    rsid: z.string(),
    genotype: z.string().nullable(),
    isValid: z.boolean(),
    rawInput: z.string(),
});

// =============================================================================
// VKORC1 SCHEMAS
// =============================================================================

export const VKORC1PhenotypeSchema = z.enum([
    'High Sensitivity',
    'Intermediate Sensitivity',
    'Low Sensitivity',
    'Unknown'
]);

export const VKORC1GenotypeSchema = z.object({
    rs9923231: z.string(),
    phenotype: VKORC1PhenotypeSchema,
    sensitivityScore: z.number().min(1).max(3),
    confidence: ConfidenceLevelSchema,
});

export const WarfarinDosingGuidanceSchema = z.object({
    estimatedDose: z.string(),
    doseRange: z.string(),
    titrationProtocol: z.string(),
    inrTarget: z.string(),
    inrMonitoring: z.string(),
    timeToTherapeutic: z.string(),
});

export const CombinedWarfarinRiskSchema = z.object({
    vkorc1Genotype: z.string(),
    cyp2c9Diplotype: z.string().nullable(),
    combinedRisk: z.enum(['Normal', 'Moderate', 'High', 'Very High']),
    bleedingRiskMultiplier: z.string(),
    overAnticoagulationRisk: z.string(),
    clinicalConsiderations: z.array(z.string()),
});

export const VKORC1DrugRecommendationSchema = z.object({
    drug: z.string(),
    category: z.string(),
    recommendation: z.string(),
    doseGuidance: z.string(),
    monitoring: z.string(),
});

export const VKORC1GuidelinesSchema = z.object({
    cpic: z.string(),
    fda: z.array(z.string()),
});

export const VKORC1AnalysisResultSchema = z.object({
    gene: z.literal('VKORC1'),
    genotype: VKORC1GenotypeSchema,
    drugs: z.array(VKORC1DrugRecommendationSchema),
    clinicalSummary: z.string(),
    warfarinDosing: WarfarinDosingGuidanceSchema,
    combinedRisk: CombinedWarfarinRiskSchema.nullable(),
    safetyAlerts: z.array(z.string()),
    confidence: ConfidenceLevelSchema,
    limitations: z.array(z.string()),
    guidelines: VKORC1GuidelinesSchema,
});

// =============================================================================
// CYP2C9 SCHEMAS
// =============================================================================

export const CYP2C9PhenotypeSchema = z.enum([
    'Normal Metabolizer',
    'Intermediate Metabolizer',
    'Poor Metabolizer',
    'Unknown'
]);

export const CYP2C9DiplotypeSchema = z.object({
    allele1: z.string().regex(/^\*\d+[A-Z]?$/, 'Must be valid star allele'),
    allele2: z.string().regex(/^\*\d+[A-Z]?$/, 'Must be valid star allele'),
    phenotype: CYP2C9PhenotypeSchema,
    activityScore: z.number().min(0).max(2),
    confidence: ConfidenceLevelSchema,
});

export const BleedingRiskSchema = z.enum([
    'Normal',
    'Increased',
    'High',
    'Very High'
]);

export const CYP2C9DrugRecommendationSchema = z.object({
    drug: z.string(),
    category: z.string(),
    recommendation: z.string(),
    doseAdjustment: z.string().optional(),
    bleedingRisk: BleedingRiskSchema,
    alternativeDrugs: z.array(z.string()).optional(),
    monitoring: z.string().optional(),
    fdaGuidance: z.boolean(),
});

export const CYP2C9WarfarinDosingSchema = z.object({
    recommendedDose: z.string(),
    titrationGuidance: z.string(),
    inrMonitoring: z.string(),
    bleedingRiskCategory: z.string(),
});

export const CYP2C9GuidelinesSchema = z.object({
    cpic: z.string(),
    fda: z.array(z.string()),
});

export const CYP2C9AnalysisResultSchema = z.object({
    gene: z.literal('CYP2C9'),
    diplotype: CYP2C9DiplotypeSchema,
    drugs: z.array(CYP2C9DrugRecommendationSchema),
    clinicalSummary: z.string(),
    warfarinDosing: CYP2C9WarfarinDosingSchema,
    safetyAlerts: z.array(z.string()),
    confidence: ConfidenceLevelSchema,
    limitations: z.array(z.string()),
    guidelines: CYP2C9GuidelinesSchema,
});

// =============================================================================
// CYP2D6 SCHEMAS
// =============================================================================

export const CYP2D6PhenotypeSchema = z.enum([
    'Ultrarapid Metabolizer',
    'Normal Metabolizer',
    'Intermediate Metabolizer',
    'Poor Metabolizer',
    'Unknown'
]);

export const CYP2D6RiskLevelSchema = z.enum([
    'critical',
    'warning',
    'caution',
    'normal',
    'informational'
]);

export const CYP2D6DiplotypeSchema = z.object({
    allele1: z.string(),
    allele2: z.string(),
    phenotype: CYP2D6PhenotypeSchema,
    activityScore: z.number().min(0).max(4), // Can be >2 for gene duplications
    confidence: ConfidenceLevelSchema,
});

export const CYP2D6DrugRecommendationSchema = z.object({
    drug: z.string(),
    category: z.string(),
    recommendation: z.string(),
    doseAdjustment: z.string().optional(),
    riskLevel: CYP2D6RiskLevelSchema,
    alternativeDrugs: z.array(z.string()).optional(),
    monitoring: z.string().optional(),
    fdaGuidance: z.boolean(),
    cpicLevel: z.enum(['A', 'B', 'C']).optional(),
});

export const CYP2D6AnalysisResultSchema = z.object({
    gene: z.literal('CYP2D6'),
    diplotype: CYP2D6DiplotypeSchema,
    drugs: z.array(CYP2D6DrugRecommendationSchema),
    clinicalSummary: z.string(),
    safetyAlerts: z.array(z.string()),
    confidence: ConfidenceLevelSchema,
    limitations: z.array(z.string()),
});

// =============================================================================
// SLCO1B1 SCHEMAS
// =============================================================================

export const SLCO1B1PhenotypeSchema = z.enum([
    'Normal Function',
    'Decreased Function',
    'Poor Function',
    'Indeterminate',
    'Unknown'
]);

export const MyopathyRiskSchema = z.enum([
    'Normal',
    'Moderately Increased',
    'High',
    'Very High'
]);

export const StatinRecommendationSchema = z.object({
    statin: z.string(),
    myopathyRisk: MyopathyRiskSchema,
    recommendation: z.string(),
    doseAdjustment: z.string(),
    maxDose: z.string().optional(),
    alternatives: z.array(z.string()).optional(),
    monitoring: z.string().optional(),
    fdaLabel: z.boolean(),
    cpicLevel: z.enum(['A', 'B', 'C']).optional(),
});

export const SLCO1B1DiplotypeSchema = z.object({
    allele1: z.string(),
    allele2: z.string(),
    phenotype: SLCO1B1PhenotypeSchema,
    functionScore: z.number().min(0).max(2),
    confidence: ConfidenceLevelSchema,
});

export const SLCO1B1AnalysisResultSchema = z.object({
    gene: z.literal('SLCO1B1'),
    diplotype: SLCO1B1DiplotypeSchema,
    drugs: z.array(StatinRecommendationSchema),
    clinicalSummary: z.string(),
    safetyAlerts: z.array(z.string()),
    confidence: ConfidenceLevelSchema,
    limitations: z.array(z.string()),
});

// =============================================================================
// COMPREHENSIVE PGx RESULT SCHEMA
// =============================================================================

export const ComprehensivePGxSummarySchema = z.object({
    genesAnalyzed: z.array(z.string()),
    totalDrugsAffected: z.number().int().min(0),
    highConfidenceResults: z.number().int().min(0),
    criticalWarnings: z.array(z.string()),
});

export const ComprehensivePGxResultSchema = z.object({
    // Individual gene results (all optional)
    cyp2d6: CYP2D6AnalysisResultSchema.optional(),
    cyp2c9: CYP2C9AnalysisResultSchema.optional(),
    cyp3a5: z.any().optional(), // TODO: Add CYP3A5 schema
    vkorc1: VKORC1AnalysisResultSchema.optional(),
    slco1b1: SLCO1B1AnalysisResultSchema.optional(),
    ugt1a1: z.any().optional(), // TODO: Add UGT1A1 schema
    f5: z.any().optional(), // TODO: Add F5 schema

    // Summary
    summary: ComprehensivePGxSummarySchema,

    // API metadata
    metadata: ApiMetadataSchema.optional(),
});

// =============================================================================
// TYPE EXPORTS (inferred from schemas)
// =============================================================================

export type ConfidenceLevel = z.infer<typeof ConfidenceLevelSchema>;
export type GeneticProvider = z.infer<typeof GeneticProviderSchema>;
export type ClinicalReference = z.infer<typeof ClinicalReferenceSchema>;
export type ApiMetadata = z.infer<typeof ApiMetadataSchema>;
export type GenotypeInput = z.infer<typeof GenotypeInputSchema>;
export type NormalizedGenotype = z.infer<typeof NormalizedGenotypeSchema>;

export type VKORC1Phenotype = z.infer<typeof VKORC1PhenotypeSchema>;
export type VKORC1Genotype = z.infer<typeof VKORC1GenotypeSchema>;
export type WarfarinDosingGuidance = z.infer<typeof WarfarinDosingGuidanceSchema>;
export type CombinedWarfarinRisk = z.infer<typeof CombinedWarfarinRiskSchema>;
export type VKORC1AnalysisResult = z.infer<typeof VKORC1AnalysisResultSchema>;

export type CYP2C9Phenotype = z.infer<typeof CYP2C9PhenotypeSchema>;
export type CYP2C9Diplotype = z.infer<typeof CYP2C9DiplotypeSchema>;
export type BleedingRisk = z.infer<typeof BleedingRiskSchema>;
export type CYP2C9DrugRecommendation = z.infer<typeof CYP2C9DrugRecommendationSchema>;
export type CYP2C9AnalysisResult = z.infer<typeof CYP2C9AnalysisResultSchema>;

export type CYP2D6Phenotype = z.infer<typeof CYP2D6PhenotypeSchema>;
export type CYP2D6Diplotype = z.infer<typeof CYP2D6DiplotypeSchema>;
export type CYP2D6RiskLevel = z.infer<typeof CYP2D6RiskLevelSchema>;
export type CYP2D6DrugRecommendation = z.infer<typeof CYP2D6DrugRecommendationSchema>;
export type CYP2D6AnalysisResult = z.infer<typeof CYP2D6AnalysisResultSchema>;

export type SLCO1B1Phenotype = z.infer<typeof SLCO1B1PhenotypeSchema>;
export type SLCO1B1Diplotype = z.infer<typeof SLCO1B1DiplotypeSchema>;
export type MyopathyRisk = z.infer<typeof MyopathyRiskSchema>;
export type StatinRecommendation = z.infer<typeof StatinRecommendationSchema>;
export type SLCO1B1AnalysisResult = z.infer<typeof SLCO1B1AnalysisResultSchema>;

export type ComprehensivePGxSummary = z.infer<typeof ComprehensivePGxSummarySchema>;
export type ComprehensivePGxResult = z.infer<typeof ComprehensivePGxResultSchema>;

// =============================================================================
// VALIDATION UTILITIES
// =============================================================================

/**
 * Validate a VKORC1 analysis result
 * @throws ZodError if validation fails
 */
export function validateVKORC1Result(data: unknown): VKORC1AnalysisResult {
    return VKORC1AnalysisResultSchema.parse(data);
}

/**
 * Validate a CYP2C9 analysis result
 * @throws ZodError if validation fails
 */
export function validateCYP2C9Result(data: unknown): CYP2C9AnalysisResult {
    return CYP2C9AnalysisResultSchema.parse(data);
}

/**
 * Validate comprehensive PGx result
 * @throws ZodError if validation fails
 */
export function validateComprehensivePGxResult(data: unknown): ComprehensivePGxResult {
    return ComprehensivePGxResultSchema.parse(data);
}

/**
 * Safely validate with error handling
 * Returns { success: true, data } or { success: false, error }
 */
export function safeParse<T>(
    schema: z.ZodSchema<T>,
    data: unknown
) {
    return schema.safeParse(data);
}

/**
 * Create API metadata with current timestamp
 */
export function createApiMetadata(
    version: string = '2.0.0',
    customReferences: ClinicalReference[] = []
): ApiMetadata {
    const defaultDisclaimer = `This pharmacogenomic analysis is for educational and research purposes only. 
It is not a substitute for professional medical advice, diagnosis, or treatment. 
Always consult a qualified healthcare provider before making any medication changes. 
Genetic testing results should be interpreted by a clinical pharmacist or physician 
with expertise in pharmacogenomics in the context of your complete medical history.`;

    const defaultReferences: ClinicalReference[] = [
        { type: 'URL', id: 'https://cpicpgx.org/', description: 'CPIC Guidelines' },
        { type: 'URL', id: 'https://www.pharmgkb.org/', description: 'PharmGKB Database' },
        { type: 'PMID', id: '21716271', description: 'CYP2C9/VKORC1 Warfarin Dosing' },
    ];

    return {
        version,
        timestamp: new Date().toISOString(),
        disclaimer: defaultDisclaimer,
        references: [...defaultReferences, ...customReferences],
    };
}
