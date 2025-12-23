# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## 🔥 CONTINUING FROM PREVIOUS SESSION?

**READ THESE FIRST:**

1. **`START-HERE.md`** - Quick 2-minute resume
2. **`CHECKLIST.md`** - Testing infrastructure progress (57/110 tasks complete)

**Last Session (2025-12-23):**

- ✅ Build fixed - `npm run build` succeeds
- ✅ All 158 tests pass (33 legacy tests deprecated/skipped)
- ✅ v2 integration tests: 23/23 passing
- ✅ SLCO1B1 updated to CPIC 2025 guidelines
- ✅ CI/CD workflow created (GitHub Actions + pre-commit hooks)

**Current Status:** **BUILD WORKING** ✅

- v2 API migration complete for core analyzers
- Zod schemas implemented for type-safe validation
- Coverage: Analyzers 92%, Overall 64% (core modules need tests)

**Immediate Priority:** Nutrigenomics test coverage (currently 0%)

---

## Project Overview

DNA Insights Pro is a comprehensive DNA analysis platform combining pharmacogenomics (PGx) and nutrigenomics analysis for consumer genomic data (23andMe, AncestryDNA). Built with React, TypeScript, and Vite.

## Common Commands

### Development

```bash
npm install           # Install dependencies
npm run dev          # Start dev server (port 3000, auto-opens browser)
npm run build        # TypeScript compile + Vite build
npm run preview      # Preview production build
npm run lint         # ESLint check
```

### Testing

```bash
npm test                # Run tests in watch mode
npm run test:coverage   # Generate coverage report (95% threshold)
npm run test:ui         # Run tests with interactive UI
```

**Test Location**: All tests are in `tests/` directory.

**Key Test Files:**

- `tests/pgx-v2-integration.test.ts` - v2 API integration tests (23/23 passing)
- `tests/analyzers/*.test.ts` - Individual gene analyzer tests
- `tests/pgx-integration.test.ts` - DEPRECATED (legacy v1, skipped)

**Path Aliases**: `@/` → `./src`, `@analysis/` → `./src/analysis`

## Architecture

### Core Analysis Engines (`src/analysis/core/`)

**comprehensive-pgx-analysis.ts** - ✅ V2 API Orchestrator

- Main entry point for PGx analysis
- Calls all v2 analyzers (CYP2C9, VKORC1, SLCO1B1, F5, CYP2D6)
- Returns `ComprehensivePGxResult` with structured gene results

**nutrigenomics-analysis.ts** - Nutrigenomics analysis engine

- Analyzes vitamin/mineral metabolism, food intolerances
- Main entry: `analyzeNutrigenomics(genotypes)`
- ⚠️ 0% test coverage - needs tests

**integrated-dna-analysis.ts** - Unified orchestrator

- Combines PGx and nutrigenomics results
- ⚠️ 0% test coverage - needs tests

### Gene-Specific Analyzers (`src/analysis/analyzers/`)

All analyzers use v2 API pattern and accept genotype arrays:

| Analyzer | Function | Coverage |
|----------|----------|----------|
| `cyp2c9-analyzer.ts` | `analyzeCYP2C9(genotypes)` | 98.7% |
| `vkorc1-analyzer.ts` | `analyzeVKORC1(genotypes)` | 97.9% |
| `slco1b1-analyzer.ts` | `analyzeSLCO1B1(genotypes)` | 94.5% |
| `f5-analyzer.ts` | `analyzeF5(rs6025, rs6027)` | 83.5% |
| `cyp2d6-analyzer.ts` | `analyzeCYP2D6(genotypes)` | 86.8% |
| `ugt1a1-analyzer.ts` | `analyzeUGT1A1(genotypes)` | 88.4% |

### Schemas (`src/analysis/schemas/`)

**pgx-schemas.ts** - Zod validation schemas for v2 API

- Type-safe validation for all analyzer results
- Auto-generated TypeScript types
- Medical disclaimers and PMID references

### CI/CD

**.github/workflows/ci.yml** - GitHub Actions workflow

- Build & type check
- Full test suite with coverage
- Clinical validation tests
- Security scanning

**.pre-commit-config.yaml** - Pre-commit hooks

- TypeScript checking
- Test execution

## Key Implementation Details

### Genotype Format (v2 API)

```typescript
{ rsid: 'rs1799853', genotype: 'CT' }
```

Genotype normalization handles:

- Slashed format: `G/A` → `AG`
- Alphabetical sorting: `TC` → `CT`

### CPIC 2025 Updates Applied

**SLCO1B1** (PMID: 24918167):

- `*1`: Score 1.0 (Normal Function)
- `*5`: Score 0.0 (No Function) ← Updated from 0.5
- Thresholds: ≥1.5 Normal, ≥0.5 Decreased, <0.5 Poor

### Test Data (tests/test-utils.ts)

Standard test genotypes available:

- `CYP2C9_TEST_GENOTYPES` - wildtype, *2,*3 variants
- `VKORC1_TEST_GENOTYPES` - GG, AG, AA
- `SLCO1B1_TEST_GENOTYPES` - *1/*1, *1/*5, *5/*5
- `F5_TEST_GENOTYPES` - Normal (GG), Het (AG), Hom (AA)

## Clinical References

| Gene | PMID | Guideline |
|------|------|-----------|
| CYP2C9/VKORC1 | 21716271 | Warfarin dosing |
| CYP2D6 | 27997040, 31006110 | Opioid metabolism |
| SLCO1B1 | 24918167 | Statin myopathy |
| F5 | ClinVar VCV000015164 | Factor V Leiden |

## Documentation

- `CHECKLIST.md` - Testing infrastructure progress tracker
- `docs/NUTRIGENOMICS-README.md` - Nutrigenomics module guide
- `docs/QUICKSTART.md` - Testing integration guide
