const fs = require('fs');

// Parse CSV function
function parseCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];
    
    const headers = parseCSVLine(lines[0]);
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length === headers.length) {
            const row = {};
            headers.forEach((header, index) => {
                row[header] = values[index];
            });
            data.push(row);
        }
    }
    return data;
}

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
}

// Load reference files
const outputFormat = parseCSV(fs.readFileSync('OutputFormat.csv', 'utf-8'));
const regionData = parseCSV(fs.readFileSync('NewChapterRegion.csv', 'utf-8'));
const geocodedData = parseCSV(fs.readFileSync('data82625_geocodio_d97d61e890ec8185c17b8f44ce0d78e6e9dfc898.csv', 'utf-8'));

// Create chapter/region map
const chapterRegionMap = {};
regionData.forEach(row => {
    if (row['County']) {
        const county = row['County'].trim().toUpperCase();
        chapterRegionMap[county] = {
            chapter: row['News Chapters'] || row['Old Chapter'] || '',
            region: row['New Regions'] || row['Old Region'] || ''
        };
    }
});

console.log('=== Testing Fixed Processing Logic ===\n');
console.log(`Loaded ${Object.keys(chapterRegionMap).length} counties in mapping`);
console.log('\nSample mappings:');
console.log('  HERNANDO:', chapterRegionMap['HERNANDO']);
console.log('  HILLSBOROUGH:', chapterRegionMap['HILLSBOROUGH']);
console.log('  MIAMI-DADE:', chapterRegionMap['MIAMI-DADE']);

// Process first 3 records
console.log('\n--- Processing First 3 Records ---\n');
const outputHeaders = Object.keys(outputFormat[0] || {});
const processedData = [];

for (let i = 0; i < Math.min(3, geocodedData.length); i++) {
    const inputRow = geocodedData[i];
    const outputRow = {};
    
    // Initialize all fields
    outputHeaders.forEach(header => {
        outputRow[header] = '';
    });
    
    // Map basic fields
    outputRow['Name'] = inputRow['Name'] || '';
    outputRow['Phone'] = inputRow['Phone'] || '';
    outputRow['Address'] = inputRow['Address'] || '';
    outputRow['City'] = inputRow['City'] || '';
    outputRow['Zip'] = inputRow['Zip Code'] || inputRow['Zip'] || '';
    outputRow['Position'] = inputRow['Position'] || '';
    outputRow['RC Care Roles'] = inputRow['RC Care Roles'] || '';
    outputRow['Chapter'] = inputRow['Chapter'] || '';
    
    // Get county from Geocodio County field
    let county = inputRow['Geocodio County'] || inputRow['County'] || '';
    if (county) {
        outputRow['County'] = county;
        
        // Look up region
        const cleanCounty = county.trim().toUpperCase().replace(' COUNTY', '');
        if (chapterRegionMap[cleanCounty]) {
            outputRow['Chapter'] = chapterRegionMap[cleanCounty].chapter;
            outputRow['Region'] = chapterRegionMap[cleanCounty].region;
        }
    }
    
    // Generate Icon field
    if (outputRow['Position']) {
        if (outputRow['RC Care Roles'] && outputRow['RC Care Roles'].trim() !== '') {
            outputRow['Icon'] = outputRow['Position'] + ' & RC';
        } else {
            outputRow['Icon'] = outputRow['Position'];
        }
    }
    
    // Add ArcGIS fields
    outputRow['ObjectId'] = (5817 + i).toString();
    outputRow['GlobalID'] = 'test-' + i;
    outputRow['CreationDate'] = '11/26/24 22:45';
    outputRow['EditDate'] = '11/26/24 22:45';
    
    processedData.push(outputRow);
    
    console.log(`Record ${i + 1}:`);
    console.log(`  Name: ${outputRow['Name']}`);
    console.log(`  County: ${outputRow['County']}`);
    console.log(`  Chapter: ${outputRow['Chapter']}`);
    console.log(`  Region: ${outputRow['Region']}`);
    console.log(`  Position: ${outputRow['Position']}`);
    console.log(`  RC Care Roles: ${outputRow['RC Care Roles']}`);
    console.log(`  Icon: ${outputRow['Icon']}`);
    console.log(`  ObjectId: ${outputRow['ObjectId']}`);
    console.log('');
}

// Save test output
const csvContent = [
    outputHeaders.join(','),
    ...processedData.map(row => 
        outputHeaders.map(header => {
            const value = row[header] || '';
            if (value.toString().includes(',') || value.toString().includes('"')) {
                return `"${value.toString().replace(/"/g, '""')}"`;
            }
            return value;
        }).join(',')
    )
].join('\n');

fs.writeFileSync('OutputFormat_fixed_test.csv', csvContent);
console.log('✅ Created OutputFormat_fixed_test.csv with corrected processing');