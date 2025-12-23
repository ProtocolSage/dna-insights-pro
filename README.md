# DNA Insights Pro

Personal DNA analysis platform combining pharmacogenomics and nutrigenomics.

## Quick Start

`ash
npm install
npm run dev
`

## Project Structure

`
src/
├── components/          # React UI components
├── analysis/
│   ├── core/           # Main analysis engines
│   ├── analyzers/      # Gene-specific analyzers (CYP2C9, VKORC1, etc.)
│   └── utils/          # Shared utilities
└── data/               # Knowledge base JSON files

docs/                   # Documentation
scripts/                # Build/utility scripts
tests/                  # Test files
sample-data/            # Sample 23andMe data
`

## Documentation

- [Quick Start Guide](docs/QUICKSTART.md)
- [Nutrigenomics Module](docs/NUTRIGENOMICS-README.md)
- [Development Roadmap](docs/ROADMAP_PRIORITY_BREAKDOWN.md)
