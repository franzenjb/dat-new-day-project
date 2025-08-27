# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Purpose

American Red Cross DAT (Disaster Aid Team) data conversion tool for Florida operations. Converts raw volunteer data to ArcGIS feature layer format with automated geocoding and regional assignments.

## Development Commands

### Local Development Server
```bash
# Start local server (Python)
python3 -m http.server 8000

# Access at http://localhost:8000
```

### Testing Data Processing
```bash
# Test with sample data (requires Node.js)
npm install  # Only needed once
node test-simple.js  # Quick test without geocoding
node test-processor.js  # Full test with geocoding (slow)
```

### Deployment
```bash
# Deploy to GitHub Pages
git add -A
git commit -m "Your message"
git push origin main
# Site updates at https://franzenjb.github.io/dat-new-day-project/ in 2-3 minutes
```

## Architecture Overview

### Core Data Flow
1. **Input**: Either raw Excel (data.xlsx) OR geocoded CSV from Geocodio
2. **Processing**: Maps columns to OutputFormat.csv template, updates regions/chapters via NewChapterRegion.csv lookup
3. **Output**: ArcGIS-compatible OutputFormat.csv

### Critical Files

**Reference Data (DO NOT MODIFY)**
- `OutputFormat.csv` - Exact ArcGIS feature layer schema (27 columns, specific order)
- `NewChapterRegion.csv` - County to Chapter/Region mapping for Florida reorganization

**Application Files**
- `index.html` - Tabbed interface for dual upload paths (geocoded CSV or raw Excel)
- `app.js` - Main processing logic with Geocodio API integration

### Key Processing Logic

**Column Mapping Priority** (in app.js `mapColumn()`)
1. Geocoded fields (Geocoded_Address, Geocoded_City) override volunteer-entered data
2. County lookup triggers Chapter/Region update from NewChapterRegion.csv
3. Empty strings for missing fields to maintain schema

**Geocodio Integration**
- API Key: `da6a76cf6fa5ad2fac2a2acdae8e6e868688a86` (embedded in app.js)
- Batch size: 100 records per request
- Free tier limit: 2,500 lookups/day

### ArcGIS Requirements
The output MUST maintain exact column structure:
- Names must match exactly (case-sensitive)
- Order must be identical
- All 27 columns present even if empty
- CSV format with proper quoting for commas/quotes

## Testing Notes

When testing uploads:
- Geocoded CSV path: Already processed, fast
- Excel path: Triggers Geocodio API, ~1 minute per 100 records
- Both must produce identical OutputFormat.csv structure

## User Workflow

1. User uploads weekly data (either format)
2. Tool processes and standardizes
3. Downloads OutputFormat.csv
4. Uploads to ArcGIS to overwrite feature layer