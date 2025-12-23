/**
 * Genotype Normalization Utilities
 * 
 * Handles provider-specific allele encoding differences across:
 * - 23andMe (forward strand, specific format)
 * - AncestryDNA (may use different strand)
 * - VCF files (reference/alternate alleles)
 * 
 * CRITICAL: Different genetic testing providers report the SAME genetic variant
 * using different allele encodings due to:
 * 1. Strand orientation (forward vs reverse complement)
 * 2. Reference genome versions (GRCh37 vs GRCh38)
 * 3. Provider-specific conventions
 * 
 * This utility provides provider-specific normalization to canonical format.
 */

export type GeneticProvider = '23andme' | 'ancestrydna' | 'vcf' | 'unknown';
export type Strand = 'forward' | 'reverse';

export interface GenotypeNormalizationResult {
  normalized: string; // Canonical genotype format (e.g., "A/G")
  confidence: 'high' | 'medium' | 'low';
  provider: GeneticProvider;
  rawInput: string;
  warnings: string[];
}

/**
 * Provider-specific allele mappings for critical pharmacogenomic variants
 * 
 * Key: rsID
 * Value: Map of provider -> canonical allele mappings
 */
export const PROVIDER_ALLELE_MAPS: Record<string, Record<GeneticProvider, Record<string, string>>> = {
  // CYP2C9*2 (rs1799853) - Warfarin metabolism
  'rs1799853': {
    '23andme': { 'C': 'C', 'T': 'T' }, // 23andMe reports forward strand
    'ancestrydna': { 'C': 'C', 'T': 'T' }, // AncestryDNA also forward
    'vcf': { 'C': 'C', 'T': 'T' },
    'unknown': { 'C': 'C', 'T': 'T' }
  },
  
  // CYP2C9*3 (rs1057910) - Warfarin metabolism
  'rs1057910': {
    '23andme': { 'A': 'A', 'C': 'C' }, // Forward strand
    'ancestrydna': { 'A': 'A', 'C': 'C' },
    'vcf': { 'A': 'A', 'C': 'C' },
    'unknown': { 'A': 'A', 'C': 'C' }
  },
  
  // SLCO1B1*5 (rs4149056) - Statin transport (CRITICAL: strand differences)
  'rs4149056': {
    '23andme': { 'T': 'T', 'C': 'C' }, // 23andMe reports forward strand
    'ancestrydna': { 'A': 'T', 'G': 'C' }, // AncestryDNA may report reverse complement
    'vcf': { 'T': 'T', 'C': 'C' },
    'unknown': { 'T': 'T', 'C': 'C' }
  },
  
  // VKORC1 (rs9923231) - Warfarin sensitivity (CRITICAL: provider differences)
  'rs9923231': {
    '23andme': { 'C': 'C', 'T': 'T' }, // Forward strand
    'ancestrydna': { 'G': 'C', 'A': 'T' }, // May use reverse complement
    'vcf': { 'C': 'C', 'T': 'T' },
    'unknown': { 'C': 'C', 'T': 'T' }
  }
};

/**
 * Detect genetic data provider from file format or metadata
 */
export function detectProvider(rawData: string): GeneticProvider {
  const lowerData = rawData.toLowerCase();
  
  if (lowerData.includes('23andme') || lowerData.includes('23-and-me')) {
    return '23andme';
  }
  if (lowerData.includes('ancestry') || lowerData.includes('ancestrydna')) {
    return 'ancestrydna';
  }
  if (lowerData.includes('##fileformat=vcf')) {
    return 'vcf';
  }
  
  return 'unknown';
}

/**
 * Normalize genotype format to standard "A/B" notation
 * 
 * Handles various input formats:
 * - "A/G", "AG", "A|G" -> "A/G"
 * - "AA", "GG" -> "A/A", "G/G"
 * - "--", "D/D", "II" -> "Unknown"
 * - null, undefined, "" -> "Unknown"
 */
export function normalizeGenotypeFormat(genotype: string | null | undefined): string {
  if (!genotype) {
    return 'Unknown';
  }

  // Clean input
  let cleaned = genotype.trim().toUpperCase();

  // Handle deletion/insertion markers
  if (cleaned.includes('D') || cleaned.includes('I') ||
      cleaned === '--' || cleaned === '..') {
    return 'Unknown';
  }

  // Remove common separators and re-add standard "/"
  cleaned = cleaned.replace(/[\|\/\s]/g, '');

  // If empty after cleaning
  if (cleaned.length === 0) {
    return 'Unknown';
  }

  // Medical-grade validation: Only accept valid nucleotides (A, C, G, T)
  const validNucleotides = ['A', 'C', 'G', 'T'];
  const hasInvalidNucleotides = cleaned.split('').some(char => !validNucleotides.includes(char));
  if (hasInvalidNucleotides) {
    return 'Unknown';
  }

  // Single allele repeated (e.g., "AA" -> "A/A")
  if (cleaned.length === 2 && cleaned[0] === cleaned[1]) {
    return `${cleaned[0]}/${cleaned[1]}`;
  }

  // Two different alleles (e.g., "AG" -> "A/G")
  if (cleaned.length === 2 && cleaned[0] !== cleaned[1]) {
    // Alphabetically sort for consistency (A/G, not G/A)
    const alleles = [cleaned[0], cleaned[1]].sort();
    return `${alleles[0]}/${alleles[1]}`;
  }

  // Already in correct format with separator removed
  if (cleaned.length === 1) {
    return 'Unknown'; // Single character doesn't make sense
  }

  // If we get here, format is unclear
  return 'Unknown';
}

/**
 * Normalize genotype with provider-specific allele mapping
 * 
 * This is the MAIN function to use for all genotype normalization.
 * 
 * @param rsid - The rsID of the variant (e.g., "rs1799853")
 * @param rawGenotype - Raw genotype from genetic test (e.g., "C/T", "CT", "C|T")
 * @param provider - Genetic testing provider (detected or specified)
 * @returns Normalized genotype with metadata
 */
export function normalizeGenotype(
  rsid: string,
  rawGenotype: string | null | undefined,
  provider: GeneticProvider = 'unknown'
): GenotypeNormalizationResult {
  const result: GenotypeNormalizationResult = {
    normalized: 'Unknown',
    confidence: 'low',
    provider,
    rawInput: rawGenotype || 'null',
    warnings: []
  };

  // Handle null/undefined input
  if (!rawGenotype) {
    result.warnings.push('No genotype data provided');
    return result;
  }

  // First, normalize format (A/G, AA -> A/A, etc.)
  const formatted = normalizeGenotypeFormat(rawGenotype);
  
  if (formatted === 'Unknown') {
    result.warnings.push(`Could not parse genotype format: ${rawGenotype}`);
    return result;
  }

  // Check if we have provider-specific mapping for this variant
  const variantMaps = PROVIDER_ALLELE_MAPS[rsid];
  
  if (!variantMaps) {
    // No provider-specific mapping needed, use formatted as-is
    result.normalized = formatted;
    result.confidence = 'medium';
    result.warnings.push(`No provider-specific mapping for ${rsid}, using format normalization only`);
    return result;
  }

  // Get provider-specific mapping
  const providerMap = variantMaps[provider] || variantMaps['unknown'];

  // Split formatted genotype
  const alleles = formatted.split('/');
  if (alleles.length !== 2) {
    result.warnings.push(`Invalid genotype format after normalization: ${formatted}`);
    return result;
  }

  // Map each allele through provider-specific map
  const mappedAllele1 = providerMap[alleles[0]] || alleles[0];
  const mappedAllele2 = providerMap[alleles[1]] || alleles[1];

  // Check if mapping was successful
  if (mappedAllele1 === alleles[0] && mappedAllele2 === alleles[1] && provider !== 'unknown') {
    result.warnings.push(`No allele mapping found for ${rsid} with provider ${provider}`);
    result.confidence = 'medium';
  } else {
    result.confidence = 'high';
  }

  // Sort alphabetically for consistency
  const sortedAlleles = [mappedAllele1, mappedAllele2].sort();
  result.normalized = `${sortedAlleles[0]}/${sortedAlleles[1]}`;

  return result;
}

/**
 * Validate genotype against expected alleles for a variant
 * 
 * @param genotype - Normalized genotype (e.g., "A/G")
 * @param expectedAlleles - Array of valid alleles (e.g., ['A', 'G', 'C'])
 * @returns true if genotype contains only expected alleles
 */
export function validateGenotype(
  genotype: string,
  expectedAlleles: string[]
): boolean {
  if (genotype === 'Unknown') {
    return false;
  }

  const alleles = genotype.split('/');
  return alleles.every(allele => expectedAlleles.includes(allele));
}

/**
 * Reverse complement a single nucleotide
 */
export function reverseComplementNucleotide(nucleotide: string): string {
  const complement: Record<string, string> = {
    'A': 'T',
    'T': 'A',
    'G': 'C',
    'C': 'G'
  };
  return complement[nucleotide.toUpperCase()] || nucleotide;
}

/**
 * Reverse complement a genotype
 * 
 * @param genotype - Genotype in format "A/G"
 * @returns Reverse complement genotype "T/C"
 */
export function reverseComplementGenotype(genotype: string): string {
  if (genotype === 'Unknown') {
    return 'Unknown';
  }

  const alleles = genotype.split('/');
  const rcAlleles = alleles.map(reverseComplementNucleotide).sort();
  return `${rcAlleles[0]}/${rcAlleles[1]}`;
}

/**
 * Extract genotype from raw genetic data line
 * 
 * Handles multiple formats:
 * - 23andMe: rsid\tchr\tpos\tgenotype
 * - VCF: chr\tpos\tid\tref\talt\tqual\tfilter\tinfo\tformat\tgenotype
 * 
 * @param line - Single line from genetic data file
 * @param rsid - Target rsID to extract
 * @returns Raw genotype string or null
 */
export function extractGenotypeFromLine(line: string, rsid: string): string | null {
  const parts = line.split('\t');
  
  // 23andMe format: rsid chr pos genotype
  if (parts[0] === rsid && parts.length >= 4) {
    return parts[3];
  }
  
  // VCF format: chr pos id ref alt ... genotype_field
  if (parts.length >= 10 && parts[2] === rsid) {
    const genotypeField = parts[9];
    // Extract GT field (e.g., "0/1" -> ref/alt mapping needed)
    const gtMatch = genotypeField.match(/^(\d)[\|\/](\d)/);
    if (gtMatch) {
      const allele1 = gtMatch[1] === '0' ? parts[3] : parts[4]; // ref or alt
      const allele2 = gtMatch[2] === '0' ? parts[3] : parts[4];
      return `${allele1}/${allele2}`;
    }
  }
  
  return null;
}

/**
 * Batch normalize multiple genotypes
 * 
 * @param genotypes - Map of rsID -> raw genotype
 * @param provider - Genetic testing provider
 * @returns Map of rsID -> normalized result
 */
export function batchNormalizeGenotypes(
  genotypes: Record<string, string | null>,
  provider: GeneticProvider = 'unknown'
): Record<string, GenotypeNormalizationResult> {
  const results: Record<string, GenotypeNormalizationResult> = {};
  
  for (const [rsid, rawGenotype] of Object.entries(genotypes)) {
    results[rsid] = normalizeGenotype(rsid, rawGenotype, provider);
  }
  
  return results;
}
