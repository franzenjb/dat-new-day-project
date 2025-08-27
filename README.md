# DAT New Day - Data Conversion Tool

## Project Overview

This web application converts raw volunteer data into the exact format required for uploading and overwriting an existing feature layer in ArcGIS. The tool ensures data consistency, proper formatting, and accurate regional assignments for Disaster Aid Team (DAT) operations in Florida.

## Purpose

The raw data files contain:
- Extra columns that need to be removed
- Incorrect column ordering
- Non-standardized heading names
- Duplicate address information
- Outdated chapter and region assignments

This tool transforms the data to match the exact ArcGIS feature layer format requirements, ensuring successful overwrites without errors.

## Key Features

### 1. Data Standardization
- Converts raw data to match the exact OutputFormat.csv template
- Ensures column names, order, and structure are identical to ArcGIS requirements
- Removes unnecessary columns from the raw data

### 2. Address Handling
- **First Address Set**: From volunteers (may contain typos or formatting issues)
- **Second Address Set**: From geocoding service (trusted for accuracy)
- The tool prioritizes the geocoded addresses for reliability

### 3. Regional Updates
- Florida has recently reconfigured its regions, chapters, and counties
- Automatically matches counties to their NEW chapter and region assignments
- Uses the NewChapterRegion.csv reference file for accurate mapping

## How to Use

### For Weekly Data Updates

1. **Visit the GitHub Pages site**: [DAT New Day Data Converter](https://franzenjb.github.io/dat-new-day-project/)

2. **Upload Your Data File**:
   - Click the upload area or drag and drop your raw data CSV file
   - The file should contain the volunteer data with all original columns

3. **Process the Data**:
   - Click "Convert Data" to begin processing
   - The tool will automatically:
     - Match columns to the OutputFormat template
     - Update chapter and region assignments based on county
     - Prioritize geocoded addresses over volunteer-entered addresses
     - Remove extra columns and reorder as required

4. **Download Results**:
   - Once processing is complete, download the OutputFormat.csv file
   - This file is ready for direct upload to ArcGIS to overwrite the feature layer

## File Descriptions

### Input Files
- **Raw Data File**: Weekly volunteer data export (you provide this)
  - Contains duplicate addresses (volunteer-entered and geocoded)
  - Has extra columns not needed for ArcGIS
  - May have outdated regional assignments

### Reference Files (Built into the app)
- **OutputFormat.csv**: Template showing the exact format required by ArcGIS
  - Defines column names, order, and structure
  - Must be matched exactly for successful feature layer overwrite

- **NewChapterRegion.csv**: Current Florida regional configuration
  - Maps counties to their new chapters and regions
  - Used to update assignments in the processed data

### Output File
- **OutputFormat.csv** (generated): Your converted data ready for ArcGIS upload
  - Matches the exact format requirements
  - Contains updated regional assignments
  - Uses cleaned, geocoded addresses

## Technical Requirements

### ArcGIS Feature Layer Overwrite Requirements
- Column names must match exactly
- Column order must be identical
- Data types must be compatible
- No extra columns allowed

This tool ensures all these requirements are met automatically.

## Frequency of Use

- Designed for once or twice weekly updates
- Process takes less than a minute for typical data files
- No installation required - runs entirely in your web browser

## Support

For issues or questions:
- Create an issue in this GitHub repository
- Contact the DAT data management team

## Data Privacy

- All processing happens in your browser
- No data is sent to external servers
- Files are processed locally on your computer

---

*Last Updated: August 2025*
*Version: 1.0.0*