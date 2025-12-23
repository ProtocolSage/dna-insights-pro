/**
 * Pharmacogenomics Integration Test Suite
 * 
 * COMPREHENSIVE TESTING:
 * ✅ Genotype normalization across providers
 * ✅ CYP2C9 warfarin/NSAID metabolism
 * ✅ SLCO1B1 statin transporter
 * ✅ VKORC1 warfarin sensitivity
 * ✅ Combined CYP2C9 + VKORC1 risk calculation
 * ✅ Edge cases and error handling
 * ✅ Clinical accuracy validation
 * 
 * This validates ALL v1 bug fixes are working correctly.
 */

import { normalizeGenotype, type GeneticProvider } from './genotype-utils';
import { analyzeCYP2C9, determineCYP2C9Diplotype } from './cyp2c9-analyzer-v2';
import { analyzeSLCO1B1, determineSLCO1B1StarAlleles } from './slco1b1-analyzer-v2';
import { analyzeVKORC1, determineVKORC1Genotype } from './vkorc1-analyzer-v2';

/**
 * Test Result Interface
 */
interface TestResult {
  testName: string;
  passed: boolean;
  expected: any;
  actual: any;
  details?: string;
}

const testResults: TestResult[] = [];

function assertEqual(testName: string, expected: any, actual: any, details?: string): void {
  const passed = JSON.stringify(expected) === JSON.stringify(actual);
  testResults.push({
    testName,
    passed,
    expected,
    actual,
    details
  });
  
  if (!passed) {
    console.error(`❌ FAILED: ${testName}`);
    console.error(`   Expected: ${JSON.stringify(expected)}`);
    console.error(`   Actual: ${JSON.stringify(actual)}`);
    if (details) console.error(`   Details: ${details}`);
  } else {
    console.log(`✅ PASSED: ${testName}`);
  }
}

function assertContains(testName: string, haystack: string, needle: string): void {
  const passed = haystack.includes(needle);
  testResults.push({
    testName,
    passed,
    expected: `String containing: ${needle}`,
    actual: haystack.substring(0, 100) + '...',
    details: passed ? undefined : 'Substring not found'
  });
  
  if (!passed) {
    console.error(`❌ FAILED: ${testName}`);
    console.error(`   Expected substring: ${needle}`);
    console.error(`   In string: ${haystack.substring(0, 200)}...`);
  } else {
    console.log(`✅ PASSED: ${testName}`);
  }
}

/**
 * ====================================================================
 * GENOTYPE NORMALIZATION TESTS
 * ====================================================================
 */
console.log('\n========================================');
console.log('GENOTYPE NORMALIZATION TESTS');
console.log('========================================\n');

// Test 1: 23andMe format normalization
const test1 = normalizeGenotype('rs1799853', 'CT', '23andme');
assertEqual(
  'Normalize 23andMe CT → C/T',
  { normalized: 'C/T', confidence: 'high', warnings: [] },
  { normalized: test1.normalized, confidence: test1.confidence, warnings: test1.warnings }
);

// Test 2: AncestryDNA format normalization
const test2 = normalizeGenotype('rs4149056', 'TT', 'ancestrydna');
assertEqual(
  'Normalize AncestryDNA TT → T/T',
  'T/T',
  test2.normalized
);

// Test 3: Handle missing genotype
const test3 = normalizeGenotype('rs9923231', null, '23andme');
assertEqual(
  'Handle null genotype → Unknown',
  'Unknown',
  test3.normalized
);

// Test 4: Handle '--' (no-call)
const test4 = normalizeGenotype('rs1057910', '--', '23andme');
assertEqual(
  'Handle -- (no-call) → Unknown',
  'Unknown',
  test4.normalized
);

// Test 5: Already normalized format
const test5 = normalizeGenotype('rs1799853', 'C/T', 'unknown');
assertEqual(
  'Already normalized C/T → C/T',
  'C/T',
  test5.normalized
);

/**
 * ====================================================================
 * CYP2C9 ANALYZER TESTS
 * ====================================================================
 */
console.log('\n========================================');
console.log('CYP2C9 ANALYZER TESTS');
console.log('========================================\n');

// Test 6: CYP2C9 *1/*1 (Normal Metabolizer)
const cyp2c9_normal = analyzeCYP2C9('C/C', 'A/A', '23andme');
assertEqual(
  'CYP2C9 *1/*1 → Normal Metabolizer',
  'Normal Metabolizer',
  cyp2c9_normal.diplotype.phenotype
);
assertEqual(
  'CYP2C9 *1/*1 activity score',
  2.0,
  cyp2c9_normal.diplotype.activityScore
);
assertContains(
  'CYP2C9 *1/*1 dosing includes standard warfarin',
  cyp2c9_normal.clinicalSummary,
  '5mg/day'
);

// Test 7: CYP2C9 *1/*2 (Intermediate Metabolizer)
const cyp2c9_inter = analyzeCYP2C9('C/T', 'A/A', '23andme');
assertEqual(
  'CYP2C9 *1/*2 → Intermediate Metabolizer',
  'Intermediate Metabolizer',
  cyp2c9_inter.diplotype.phenotype
);
assertEqual(
  'CYP2C9 *1/*2 activity score',
  1.5,
  cyp2c9_inter.diplotype.activityScore
);
assertContains(
  'CYP2C9 *1/*2 dosing reduced',
  cyp2c9_inter.clinicalSummary,
  '3-4mg/day'
);

// Test 8: CYP2C9 *1/*3 (Intermediate Metabolizer)
const cyp2c9_1_3 = analyzeCYP2C9('C/C', 'A/C', '23andme');
assertEqual(
  'CYP2C9 *1/*3 → Intermediate Metabolizer',
  'Intermediate Metabolizer',
  cyp2c9_1_3.diplotype.phenotype
);

// Test 9: CYP2C9 *2/*2 (Intermediate Metabolizer)
const cyp2c9_2_2 = analyzeCYP2C9('T/T', 'A/A', '23andme');
assertEqual(
  'CYP2C9 *2/*2 → Intermediate Metabolizer',
  'Intermediate Metabolizer',
  cyp2c9_2_2.diplotype.phenotype
);
assertEqual(
  'CYP2C9 *2/*2 activity score',
  1.0,
  cyp2c9_2_2.diplotype.activityScore
);

// Test 10: CYP2C9 *2/*3 (Poor Metabolizer)
const cyp2c9_2_3 = analyzeCYP2C9('T/T', 'A/C', '23andme');
assertEqual(
  'CYP2C9 *2/*3 → Poor Metabolizer',
  'Poor Metabolizer',
  cyp2c9_2_3.diplotype.phenotype
);
assertEqual(
  'CYP2C9 *2/*3 activity score',
  0.5,
  cyp2c9_2_3.diplotype.activityScore
);
assertContains(
  'CYP2C9 *2/*3 very low dose',
  cyp2c9_2_3.clinicalSummary,
  '0.5-2mg/day'
);

// Test 11: CYP2C9 *3/*3 (Poor Metabolizer)
const cyp2c9_3_3 = analyzeCYP2C9('C/C', 'C/C', '23andme');
assertEqual(
  'CYP2C9 *3/*3 → Poor Metabolizer',
  'Poor Metabolizer',
  cyp2c9_3_3.diplotype.phenotype
);
assertEqual(
  'CYP2C9 *3/*3 activity score',
  0.0,
  cyp2c9_3_3.diplotype.activityScore
);

// Test 12: CYP2C9 bleeding risk quantification
const cyp2c9_poor = analyzeCYP2C9('T/T', 'C/C', '23andme'); // *2/*3
assertContains(
  'CYP2C9 Poor Metabolizer bleeding risk',
  cyp2c9_poor.clinicalSummary,
  '3-5x'
);

// Test 13: CYP2C9 drug coverage (warfarin, NSAIDs, etc.)
assertContains(
  'CYP2C9 covers warfarin',
  cyp2c9_normal.clinicalSummary,
  'warfarin'
);
assertContains(
  'CYP2C9 covers NSAIDs',
  cyp2c9_normal.clinicalSummary,
  'ibuprofen'
);

/**
 * ====================================================================
 * SLCO1B1 ANALYZER TESTS
 * ====================================================================
 */
console.log('\n========================================');
console.log('SLCO1B1 ANALYZER TESTS');
console.log('========================================\n');

// Test 14: SLCO1B1 *1/*1 (Normal Function)
const slco1b1_normal = analyzeSLCO1B1('T/T', '23andme');
assertEqual(
  'SLCO1B1 *1/*1 → Normal Function',
  'Normal Function',
  slco1b1_normal.genotype.phenotype
);
assertEqual(
  'SLCO1B1 *1/*1 activity score',
  2.0,
  slco1b1_normal.genotype.activityScore
);

// Test 15: SLCO1B1 *1/*5 (Decreased Function)
const slco1b1_decreased = analyzeSLCO1B1('T/C', '23andme');
assertEqual(
  'SLCO1B1 *1/*5 → Decreased Function',
  'Decreased Function',
  slco1b1_decreased.genotype.phenotype
);
assertEqual(
  'SLCO1B1 *1/*5 activity score',
  1.5,
  slco1b1_decreased.genotype.activityScore
);

// Test 16: SLCO1B1 *5/*5 (Poor Function)
const slco1b1_poor = analyzeSLCO1B1('C/C', '23andme');
assertEqual(
  'SLCO1B1 *5/*5 → Poor Function',
  'Poor Function',
  slco1b1_poor.genotype.phenotype
);
assertEqual(
  'SLCO1B1 *5/*5 activity score',
  1.0,
  slco1b1_poor.genotype.activityScore
);

// Test 17: SLCO1B1 myopathy risk quantification
assertContains(
  'SLCO1B1 *5/*5 simvastatin risk',
  slco1b1_poor.clinicalSummary,
  '16-17x'
);

// Test 18: SLCO1B1 statin recommendations
assertContains(
  'SLCO1B1 *5/*5 avoid simvastatin',
  slco1b1_poor.clinicalSummary,
  'AVOID simvastatin'
);
assertContains(
  'SLCO1B1 *5/*5 prefer alternatives',
  slco1b1_poor.clinicalSummary,
  'pravastatin'
);

// Test 19: SLCO1B1 dosing guidance
assertContains(
  'SLCO1B1 *1/*5 simvastatin max dose',
  slco1b1_decreased.clinicalSummary,
  '40mg/day'
);

/**
 * ====================================================================
 * VKORC1 ANALYZER TESTS
 * ====================================================================
 */
console.log('\n========================================');
console.log('VKORC1 ANALYZER TESTS');
console.log('========================================\n');

// Test 20: VKORC1 G/G (Low Sensitivity)
const vkorc1_low = analyzeVKORC1('G/G', '23andme');
assertEqual(
  'VKORC1 G/G → Low Sensitivity',
  'Low Sensitivity',
  vkorc1_low.genotype.phenotype
);
assertEqual(
  'VKORC1 G/G sensitivity score',
  1.0,
  vkorc1_low.genotype.sensitivityScore
);
assertContains(
  'VKORC1 G/G high dose',
  vkorc1_low.clinicalSummary,
  '6-7mg/day'
);

// Test 21: VKORC1 A/G (Intermediate Sensitivity)
const vkorc1_inter = analyzeVKORC1('A/G', '23andme');
assertEqual(
  'VKORC1 A/G → Intermediate Sensitivity',
  'Intermediate Sensitivity',
  vkorc1_inter.genotype.phenotype
);
assertEqual(
  'VKORC1 A/G sensitivity score',
  2.0,
  vkorc1_inter.genotype.sensitivityScore
);

// Test 22: VKORC1 A/A (High Sensitivity)
const vkorc1_high = analyzeVKORC1('A/A', '23andme');
assertEqual(
  'VKORC1 A/A → High Sensitivity',
  'High Sensitivity',
  vkorc1_high.genotype.phenotype
);
assertEqual(
  'VKORC1 A/A sensitivity score',
  3.0,
  vkorc1_high.genotype.sensitivityScore
);
assertContains(
  'VKORC1 A/A low dose',
  vkorc1_high.clinicalSummary,
  '2-3mg/day'
);

/**
 * ====================================================================
 * COMBINED WARFARIN RISK TESTS (VKORC1 + CYP2C9)
 * ====================================================================
 */
console.log('\n========================================');
console.log('COMBINED WARFARIN RISK TESTS');
console.log('========================================\n');

// Test 23: Highest risk combination (VKORC1 A/A + CYP2C9 *3/*3)
const combined_highest = analyzeVKORC1(
  'A/A',
  '23andme',
  { allele1: '*3', allele2: '*3', phenotype: 'Poor Metabolizer' }
);
assertEqual(
  'VKORC1 A/A + CYP2C9 *3/*3 → Very High Risk',
  'Very High',
  combined_highest.combinedRisk?.combinedRisk
);
assertContains(
  'Very high risk bleeding multiplier',
  combined_highest.combinedRisk?.bleedingRiskMultiplier || '',
  '5-8x'
);
assertContains(
  'Very high risk dosing',
  combined_highest.warfarinDosing.estimatedDose,
  '0.5-2mg/day'
);

// Test 24: High risk combination (VKORC1 A/A + CYP2C9 *1/*2)
const combined_high = analyzeVKORC1(
  'A/A',
  '23andme',
  { allele1: '*1', allele2: '*2', phenotype: 'Intermediate Metabolizer' }
);
assertEqual(
  'VKORC1 A/A + CYP2C9 *1/*2 → High Risk',
  'High',
  combined_high.combinedRisk?.combinedRisk
);

// Test 25: Normal risk combination (VKORC1 G/G + CYP2C9 *1/*1)
const combined_normal = analyzeVKORC1(
  'G/G',
  '23andme',
  { allele1: '*1', allele2: '*1', phenotype: 'Normal Metabolizer' }
);
assertEqual(
  'VKORC1 G/G + CYP2C9 *1/*1 → Normal Risk',
  'Normal',
  combined_normal.combinedRisk?.combinedRisk
);

// Test 26: Moderate risk combination (VKORC1 A/G + CYP2C9 *1/*1)
const combined_moderate = analyzeVKORC1(
  'A/G',
  '23andme',
  { allele1: '*1', allele2: '*1', phenotype: 'Normal Metabolizer' }
);
assertEqual(
  'VKORC1 A/G + CYP2C9 *1/*1 → Moderate Risk',
  'Moderate',
  combined_moderate.combinedRisk?.combinedRisk
);

/**
 * ====================================================================
 * EDGE CASE TESTS
 * ====================================================================
 */
console.log('\n========================================');
console.log('EDGE CASE TESTS');
console.log('========================================\n');

// Test 27: Missing genotype data
const missing_cyp2c9 = analyzeCYP2C9(null, null, '23andme');
assertEqual(
  'Missing CYP2C9 data → Unknown phenotype',
  'Unknown',
  missing_cyp2c9.diplotype.phenotype
);

// Test 28: Mixed missing data
const mixed_missing = analyzeCYP2C9('C/T', null, '23andme');
assertEqual(
  'Partial CYP2C9 data (rs1057910 missing) → Unknown',
  'Unknown',
  mixed_missing.diplotype.phenotype,
  'Should be Unknown because we need both variants'
);

// Test 29: No-call genotypes
const nocall = normalizeGenotype('rs1799853', '--', '23andme');
assertEqual(
  'No-call genotype → Unknown',
  'Unknown',
  nocall.normalized
);

// Test 30: Different provider formats
const ancestry_format = normalizeGenotype('rs4149056', 'CT', 'ancestrydna');
const twentythree_format = normalizeGenotype('rs4149056', 'CT', '23andme');
assertEqual(
  'Provider format consistency',
  ancestry_format.normalized,
  twentythree_format.normalized
);

// Test 31: Already normalized input
const prenormalized = analyzeCYP2C9('C/T', 'A/A', 'unknown');
assertEqual(
  'Pre-normalized genotypes work correctly',
  'Intermediate Metabolizer',
  prenormalized.diplotype.phenotype
);

// Test 32: Confidence levels
assertEqual(
  'High confidence for known genotype',
  'high',
  cyp2c9_normal.confidence
);
assertEqual(
  'Low confidence for unknown genotype',
  'low',
  missing_cyp2c9.confidence
);

/**
 * ====================================================================
 * CLINICAL ACCURACY VALIDATION
 * ====================================================================
 */
console.log('\n========================================');
console.log('CLINICAL ACCURACY VALIDATION');
console.log('========================================\n');

// Test 33: CPIC guidelines mentioned
assertContains(
  'CYP2C9 mentions CPIC',
  cyp2c9_poor.clinicalSummary,
  'CPIC'
);
assertContains(
  'SLCO1B1 mentions CPIC',
  slco1b1_poor.clinicalSummary,
  'CPIC'
);

// Test 34: INR monitoring protocols
assertContains(
  'Warfarin INR monitoring mentioned',
  cyp2c9_poor.clinicalSummary,
  'INR'
);
assertContains(
  'VKORC1 INR monitoring',
  vkorc1_high.warfarinDosing.inrMonitoring,
  'INR'
);

// Test 35: Safety alerts present
assertEqual(
  'CYP2C9 Poor Metabolizer has safety alerts',
  true,
  cyp2c9_poor.safetyAlerts.length > 0
);
assertEqual(
  'SLCO1B1 Poor Function has safety alerts',
  true,
  slco1b1_poor.safetyAlerts.length > 0
);
assertEqual(
  'VKORC1 High Sensitivity has safety alerts',
  true,
  vkorc1_high.safetyAlerts.length > 0
);

// Test 36: Mechanism of action explained
assertContains(
  'CYP2C9 mechanism explained',
  cyp2c9_normal.clinicalSummary,
  'metabolizes'
);
assertContains(
  'SLCO1B1 mechanism explained',
  slco1b1_normal.clinicalSummary,
  'transporter'
);
assertContains(
  'VKORC1 mechanism explained',
  vkorc1_high.clinicalSummary,
  'recycles vitamin K'
);

/**
 * ====================================================================
 * PROVIDER FORMAT HANDLING
 * ====================================================================
 */
console.log('\n========================================');
console.log('PROVIDER FORMAT HANDLING');
console.log('========================================\n');

// Test 37: 23andMe format
const test_23andme = analyzeCYP2C9('CT', 'AA', '23andme');
assertEqual(
  '23andMe format recognized',
  'Intermediate Metabolizer',
  test_23andme.diplotype.phenotype
);

// Test 38: AncestryDNA format
const test_ancestry = analyzeCYP2C9('CT', 'AA', 'ancestrydna');
assertEqual(
  'AncestryDNA format recognized',
  'Intermediate Metabolizer',
  test_ancestry.diplotype.phenotype
);

// Test 39: Unknown provider format
const test_unknown = analyzeCYP2C9('C/T', 'A/A', 'unknown');
assertEqual(
  'Unknown provider with normalized format works',
  'Intermediate Metabolizer',
  test_unknown.diplotype.phenotype
);

/**
 * ====================================================================
 * TEST SUMMARY
 * ====================================================================
 */
console.log('\n========================================');
console.log('TEST SUMMARY');
console.log('========================================\n');

const totalTests = testResults.length;
const passedTests = testResults.filter(t => t.passed).length;
const failedTests = testResults.filter(t => !t.passed).length;

console.log(`Total Tests: ${totalTests}`);
console.log(`✅ Passed: ${passedTests}`);
console.log(`❌ Failed: ${failedTests}`);
console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%\n`);

if (failedTests > 0) {
  console.log('FAILED TESTS:');
  testResults.filter(t => !t.passed).forEach(t => {
    console.log(`\n❌ ${t.testName}`);
    console.log(`   Expected: ${JSON.stringify(t.expected)}`);
    console.log(`   Actual: ${JSON.stringify(t.actual)}`);
    if (t.details) console.log(`   Details: ${t.details}`);
  });
}

/**
 * ====================================================================
 * EXPORT TEST RESULTS
 * ====================================================================
 */
export const testSummary = {
  totalTests,
  passedTests,
  failedTests,
  successRate: (passedTests / totalTests) * 100,
  results: testResults
};

export function runAllTests(): typeof testSummary {
  return testSummary;
}

// Auto-run tests when module is imported
console.log('\n🧪 Pharmacogenomics Integration Tests Complete!\n');
