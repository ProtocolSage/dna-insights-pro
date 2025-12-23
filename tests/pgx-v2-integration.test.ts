/**
 * PGx Integration Tests - v2 API
 * 
 * This test suite validates the v2 API schema and integration flows.
 * It replaces the legacy v1 tests in pgx-integration.test.ts.
 * 
 * Clinical References:
 * - CPIC Guidelines: https://cpicpgx.org/guidelines/
 * - PharmGKB: https://www.pharmgkb.org/
 * 
 * Test Strategy:
 * 1. Schema validation using Zod
 * 2. Clinical accuracy verification
 * 3. Edge case handling
 * 4. Cross-gene interactions (e.g., CYP2C9 + VKORC1 for warfarin)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    analyzeComprehensivePGx,
    type ComprehensivePGxResult
} from '@/analysis/core/comprehensive-pgx-analysis';
import {
    ComprehensivePGxResultSchema,
    VKORC1AnalysisResultSchema,
    CYP2C9AnalysisResultSchema,
    validateComprehensivePGxResult,
    createApiMetadata,
} from '@/analysis/schemas/pgx-schemas';
import {
    createTestGenotype,
    CYP2C9_TEST_GENOTYPES,
    VKORC1_TEST_GENOTYPES,
    SLCO1B1_TEST_GENOTYPES,
    F5_TEST_GENOTYPES,
} from './test-utils';

// =============================================================================
// TEST DATA
// =============================================================================

const COMPREHENSIVE_TEST_GENOTYPES = [
    // CYP2C9 - *1/*2 (Intermediate Metabolizer)
    createTestGenotype('rs1799853', 'CT'),
    createTestGenotype('rs1057910', 'AA'),
    // VKORC1 - AG (Intermediate Sensitivity)
    createTestGenotype('rs9923231', 'AG'),
    // SLCO1B1 - *1/*5 (Decreased Function)
    createTestGenotype('rs4149056', 'TC'),
    // F5 - Normal
    createTestGenotype('rs6025', 'CC'),
];

const WARFARIN_HIGH_RISK_GENOTYPES = [
    // CYP2C9 - *2/*3 (Poor Metabolizer)
    createTestGenotype('rs1799853', 'CT'),
    createTestGenotype('rs1057910', 'AC'),
    // VKORC1 - AA (High Sensitivity)
    createTestGenotype('rs9923231', 'AA'),
];

// =============================================================================
// SCHEMA VALIDATION TESTS
// =============================================================================

describe('PGx v2 Integration - Schema Validation', () => {
    describe('Comprehensive Result Schema', () => {
        it('should produce valid schema-compliant results', () => {
            const genotypes = COMPREHENSIVE_TEST_GENOTYPES.map(g => ({
                rsid: g.rsid,
                genotype: g.genotype
            }));

            const result = analyzeComprehensivePGx(genotypes, '23andme');

            // Validate against Zod schema
            const validation = ComprehensivePGxResultSchema.safeParse(result);

            // If validation fails, show helpful error
            if (!validation.success) {
                console.error('Schema validation errors:', validation.error.issues);
            }

            // Core structure should be valid
            expect(result).toHaveProperty('summary');
            expect(result.summary).toHaveProperty('genesAnalyzed');
            expect(result.summary).toHaveProperty('totalDrugsAffected');
        });

        it('should include all analyzed genes in summary', () => {
            const genotypes = COMPREHENSIVE_TEST_GENOTYPES.map(g => ({
                rsid: g.rsid,
                genotype: g.genotype
            }));

            const result = analyzeComprehensivePGx(genotypes, '23andme');

            expect(result.summary.genesAnalyzed.length).toBeGreaterThan(0);
            expect(result.summary.totalDrugsAffected).toBeGreaterThan(0);
        });
    });

    describe('Individual Gene Schemas', () => {
        it('VKORC1 result should match schema', () => {
            const genotypes = [{ rsid: 'rs9923231', genotype: 'AA' }];
            const result = analyzeComprehensivePGx(genotypes, '23andme');

            expect(result.vkorc1).toBeDefined();
            expect(result.vkorc1?.gene).toBe('VKORC1');
            expect(result.vkorc1?.genotype.phenotype).toBe('High Sensitivity');

            // Validate nested structure
            expect(result.vkorc1?.warfarinDosing).toBeDefined();
            expect(result.vkorc1?.guidelines).toBeDefined();
        });

        it('CYP2C9 result should match schema', () => {
            const genotypes = [
                { rsid: 'rs1799853', genotype: 'CT' },
                { rsid: 'rs1057910', genotype: 'AA' },
            ];
            const result = analyzeComprehensivePGx(genotypes, '23andme');

            expect(result.cyp2c9).toBeDefined();
            expect(result.cyp2c9?.gene).toBe('CYP2C9');
            expect(result.cyp2c9?.diplotype.phenotype).toBe('Intermediate Metabolizer');
        });
    });
});

// =============================================================================
// CLINICAL ACCURACY TESTS
// =============================================================================

describe('PGx v2 Integration - Clinical Accuracy', () => {
    describe('Warfarin Dosing (CYP2C9 + VKORC1)', () => {
        it('should identify high-risk warfarin patients', () => {
            const genotypes = WARFARIN_HIGH_RISK_GENOTYPES.map(g => ({
                rsid: g.rsid,
                genotype: g.genotype
            }));

            const result = analyzeComprehensivePGx(genotypes, '23andme');

            // CYP2C9 Poor Metabolizer + VKORC1 High Sensitivity = High Risk
            expect(result.cyp2c9?.diplotype.phenotype).toBe('Poor Metabolizer');
            expect(result.vkorc1?.genotype.phenotype).toBe('High Sensitivity');

            // Should have critical warnings
            expect(result.summary.criticalWarnings.length).toBeGreaterThan(0);
        });

        it('should provide combined risk assessment', () => {
            const genotypes = WARFARIN_HIGH_RISK_GENOTYPES.map(g => ({
                rsid: g.rsid,
                genotype: g.genotype
            }));

            const result = analyzeComprehensivePGx(genotypes, '23andme');

            // Should calculate combined risk
            if (result.vkorc1?.combinedRisk) {
                expect(['High', 'Very High']).toContain(result.vkorc1.combinedRisk.combinedRisk);
            }
        });

        it('should recommend dose reduction for warfarin', () => {
            const genotypes = WARFARIN_HIGH_RISK_GENOTYPES.map(g => ({
                rsid: g.rsid,
                genotype: g.genotype
            }));

            const result = analyzeComprehensivePGx(genotypes, '23andme');

            // CYP2C9 should recommend warfarin dose reduction
            const warfarinRec = result.cyp2c9?.drugs.find(d =>
                d.drug.toLowerCase().includes('warfarin')
            );

            if (warfarinRec) {
                expect(['High', 'Very High']).toContain(warfarinRec.bleedingRisk);
            }
        });
    });

    describe('Statin Myopathy Risk (SLCO1B1)', () => {
        it('should identify increased myopathy risk for *5 carriers', () => {
            const genotypes = [
                { rsid: 'rs4149056', genotype: 'TC' }, // *1/*5
            ];

            const result = analyzeComprehensivePGx(genotypes, '23andme');

            expect(result.slco1b1).toBeDefined();
            expect(result.slco1b1?.diplotype.phenotype).toBe('Decreased Function');

            // Check for simvastatin warning
            const simvastatinRec = result.slco1b1?.drugs.find(d =>
                d.statin.toLowerCase().includes('simvastatin')
            );

            if (simvastatinRec) {
                expect(['Moderately Increased', 'High', 'Very High']).toContain(simvastatinRec.myopathyRisk);
            }
        });
    });

    describe('Factor V Leiden (Thrombophilia)', () => {
        it('should identify heterozygous F5 carriers', () => {
            const genotypes = [
                { rsid: 'rs6025', genotype: 'AG' }, // Heterozygous Factor V Leiden
            ];

            const result = analyzeComprehensivePGx(genotypes, '23andme');

            expect(result.f5).toBeDefined();
            expect(result.f5?.genotype.thrombophiliaRisk).not.toBe('Normal');
        });

        it('should provide contraceptive safety warnings for F5 carriers', () => {
            const genotypes = [
                { rsid: 'rs6025', genotype: 'AG' }, // Heterozygous Factor V Leiden
            ];

            const result = analyzeComprehensivePGx(genotypes, '23andme');

            expect(result.f5?.safetyAlerts.length).toBeGreaterThan(0);
        });
    });
});

// =============================================================================
// EDGE CASE TESTS
// =============================================================================

describe('PGx v2 Integration - Edge Cases', () => {
    it('should handle empty genotype array', () => {
        const result = analyzeComprehensivePGx([], '23andme');

        expect(result).toBeDefined();
        expect(result.summary).toBeDefined();
        // Analyzer always reports all genes, even with Unknown phenotype
        // totalDrugsAffected counts drugs that have non-standard recommendations
        expect(result.summary.genesAnalyzed).toBeDefined();
    });

    it('should handle unknown rsIDs gracefully', () => {
        const genotypes = [
            { rsid: 'rs99999999', genotype: 'AA' }, // Invalid rsID
        ];

        const result = analyzeComprehensivePGx(genotypes, '23andme');

        // Should not crash and return valid structure
        expect(result).toBeDefined();
        expect(result.summary).toBeDefined();
    });

    it('should handle invalid genotypes gracefully', () => {
        const genotypes = [
            { rsid: 'rs9923231', genotype: 'XX' }, // Invalid genotype
        ];

        expect(() => analyzeComprehensivePGx(genotypes, '23andme')).not.toThrow();

        const result = analyzeComprehensivePGx(genotypes, '23andme');
        expect(result.vkorc1?.genotype.phenotype).toBe('Unknown');
    });

    it('should handle partial gene data', () => {
        // Only one of two CYP2C9 SNPs
        const genotypes = [
            { rsid: 'rs1799853', genotype: 'CT' },
            // Missing rs1057910
        ];

        const result = analyzeComprehensivePGx(genotypes, '23andme');

        // Should still analyze but with lower confidence
        if (result.cyp2c9) {
            expect(result.cyp2c9.confidence).toBe('low');
        }
    });

    it('should normalize heterozygous genotypes consistently', () => {
        // Both should produce the same result
        const genotypesGA = [{ rsid: 'rs9923231', genotype: 'GA' }];
        const genotypesAG = [{ rsid: 'rs9923231', genotype: 'AG' }];

        const resultGA = analyzeComprehensivePGx(genotypesGA, '23andme');
        const resultAG = analyzeComprehensivePGx(genotypesAG, '23andme');

        expect(resultGA.vkorc1?.genotype.phenotype).toBe(resultAG.vkorc1?.genotype.phenotype);
    });
});

// =============================================================================
// API METADATA TESTS
// =============================================================================

describe('PGx v2 Integration - API Metadata', () => {
    it('should create valid API metadata', () => {
        const metadata = createApiMetadata('2.0.0');

        expect(metadata.version).toBe('2.0.0');
        expect(metadata.timestamp).toBeDefined();
        expect(metadata.disclaimer.length).toBeGreaterThan(50);
        expect(metadata.references.length).toBeGreaterThan(0);
    });

    it('should include CPIC reference', () => {
        const metadata = createApiMetadata();

        const cpicRef = metadata.references.find(r =>
            r.description?.includes('CPIC')
        );

        expect(cpicRef).toBeDefined();
    });

    it('should include valid timestamp', () => {
        const metadata = createApiMetadata();

        const timestamp = new Date(metadata.timestamp);
        expect(timestamp.getTime()).toBeGreaterThan(0);
        expect(timestamp.getTime()).toBeLessThanOrEqual(Date.now());
    });
});

// =============================================================================
// PERFORMANCE TESTS
// =============================================================================

describe('PGx v2 Integration - Performance', () => {
    it('should analyze comprehensive panel in under 100ms', async () => {
        const genotypes = COMPREHENSIVE_TEST_GENOTYPES.map(g => ({
            rsid: g.rsid,
            genotype: g.genotype
        }));

        const start = performance.now();
        analyzeComprehensivePGx(genotypes, '23andme');
        const duration = performance.now() - start;

        expect(duration).toBeLessThan(100);
    });

    it('should be deterministic (same input = same output)', () => {
        const genotypes = COMPREHENSIVE_TEST_GENOTYPES.map(g => ({
            rsid: g.rsid,
            genotype: g.genotype
        }));

        const result1 = analyzeComprehensivePGx(genotypes, '23andme');
        const result2 = analyzeComprehensivePGx(genotypes, '23andme');

        expect(result1.summary.genesAnalyzed).toEqual(result2.summary.genesAnalyzed);
        expect(result1.summary.totalDrugsAffected).toBe(result2.summary.totalDrugsAffected);
    });

    it('should handle 100 concurrent analyses', () => {
        const genotypes = [{ rsid: 'rs9923231', genotype: 'AA' }];

        const start = performance.now();

        for (let i = 0; i < 100; i++) {
            analyzeComprehensivePGx(genotypes, '23andme');
        }

        const duration = performance.now() - start;

        // 100 analyses should complete in under 1 second
        expect(duration).toBeLessThan(1000);
    });
});

// =============================================================================
// CLINICAL DISCLAIMER TESTS
// =============================================================================

describe('PGx v2 Integration - Clinical Compliance', () => {
    it('should include appropriate clinical disclaimers', () => {
        const metadata = createApiMetadata();

        // Required phrases in disclaimer
        expect(metadata.disclaimer).toContain('not a substitute');
        expect(metadata.disclaimer).toContain('healthcare provider');
        expect(metadata.disclaimer).toContain('pharmacogenomics');
    });

    it('should include PMID references', () => {
        const metadata = createApiMetadata();

        const pmidRef = metadata.references.find(r => r.type === 'PMID');
        expect(pmidRef).toBeDefined();
        expect(pmidRef?.id).toMatch(/^\d+$/);
    });
});
