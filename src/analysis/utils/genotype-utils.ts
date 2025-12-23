/**
 * Genotype Normalization Utilities
 *
 * Simplified for 23andMe-only data processing.
 * Handles genotype format normalization and validation.
 *
 * All data is from 23andMe raw data files (forward strand, GRCh37).
 */

export type GeneticProvider = '23andme' | 'unknown';

export interface GenotypeNormalizationResult {
  normalized: string | null; // Normalized genotype (e.g., "AG") or null if invalid
  isValid: boolean;
  rawInput: string;
}

/**
 * Detect genetic data provider from file format or metadata
 * Simplified for 23andMe-only support
 */
export function detectProvider(rawData: string): GeneticProvider {
  const lowerData = rawData.toLowerCase();

  if (lowerData.includes('23andme') || lowerData.includes('23-and-me')) {
    return '23andme';
  }

  return 'unknown';
}

/**
 * Simple genotype normalization for 23andMe data
 *
 * Handles:
 * - Case normalization (ct -> CT)
 * - Whitespace removal (C T -> CT)
 * - Alphabetical sorting (GA -> AG, TC -> CT)
 * - No-call handling (--, II, DD, null -> null)
 *
 * Examples:
 * - "ct" -> "CT"
 * - "C T" -> "CT"
 * - "GA" -> "AG" (sorted)
 * - "--" -> null
 * - null -> null
 *
 * @param genotype - Raw genotype from 23andMe file
 * @returns Normalized genotype string or null if invalid
 */
export function normalizeGenotype(genotype: string | null | undefined): string | null {
  // Handle null/undefined
  if (genotype === null || genotype === undefined) {
    return null;
  }

  // Convert to string and trim
  const trimmed = String(genotype).trim();

  // Handle empty string
  if (trimmed === '') {
    return null;
  }

  // Handle no-call genotypes
  if (trimmed === '--' || trimmed === 'II' || trimmed === 'DD') {
    return null;
  }

  // Remove whitespace and convert to uppercase
  const cleaned = trimmed.replace(/\s+/g, '').toUpperCase();

  // Validate length (should be 2 characters for SNPs)
  if (cleaned.length !== 2) {
    return null;
  }

  // Validate characters (A, T, C, G only)
  const validChars = /^[ATCG]{2}$/;
  if (!validChars.test(cleaned)) {
    return null;
  }

  // Sort alphabetically for consistency
  const sorted = cleaned.split('').sort().join('');

  return sorted;
}

/**
 * Normalize genotype with detailed result information
 *
 * @param genotype - Raw genotype string from 23andMe
 * @returns Normalization result with validation status
 */
export function normalizeGenotypeDetailed(
  genotype: string | null | undefined
): GenotypeNormalizationResult {
  const rawInput = genotype ? String(genotype) : '';
  const normalized = normalizeGenotype(genotype);

  return {
    normalized,
    isValid: normalized !== null,
    rawInput
  };
}

/**
 * Extract a specific genotype from an array by rsid
 *
 * @param genotypes - Array of genotype objects
 * @param rsid - RS identifier to find (e.g., 'rs1799853')
 * @returns Genotype string or null if not found
 */
export function extractGenotype(
  genotypes: Array<{ rsid: string; genotype: string }>,
  rsid: string
): string | null {
  const found = genotypes.find(g => g.rsid === rsid);
  return found ? found.genotype : null;
}

/**
 * Extract and normalize a genotype in one step
 *
 * @param genotypes - Array of genotype objects
 * @param rsid - RS identifier to find
 * @returns Normalized genotype string or null
 */
export function extractAndNormalize(
  genotypes: Array<{ rsid: string; genotype: string }>,
  rsid: string
): string | null {
  const raw = extractGenotype(genotypes, rsid);
  return normalizeGenotype(raw);
}

/**
 * Validate that a genotype array has the minimum required SNPs
 *
 * @param genotypes - Array of genotype objects
 * @param requiredRsids - Array of required rsids
 * @returns True if all required SNPs are present
 */
export function hasRequiredSNPs(
  genotypes: Array<{ rsid: string; genotype: string }>,
  requiredRsids: string[]
): boolean {
  const presentRsids = new Set(genotypes.map(g => g.rsid));
  return requiredRsids.every(rsid => presentRsids.has(rsid));
}

/**
 * Get missing SNPs from a genotype array
 *
 * @param genotypes - Array of genotype objects
 * @param requiredRsids - Array of required rsids
 * @returns Array of missing rsids
 */
export function getMissingSNPs(
  genotypes: Array<{ rsid: string; genotype: string }>,
  requiredRsids: string[]
): string[] {
  const presentRsids = new Set(genotypes.map(g => g.rsid));
  return requiredRsids.filter(rsid => !presentRsids.has(rsid));
}
