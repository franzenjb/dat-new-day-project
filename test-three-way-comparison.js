const fs = require('fs');
const XLSX = require('xlsx');

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

// Convert text to proper case
function toProperCase(str) {
    if (!str) return '';
    
    const keepUppercase = ['FL', 'USA', 'US', 'NE', 'NW', 'SE', 'SW', 'PO', 'II', 'III', 'IV', 'CT', 'DR', 'CT', 'BLVD'];
    const keepLowercase = ['a', 'an', 'and', 'as', 'at', 'by', 'for', 'from', 'in', 'of', 'on', 'or', 'the', 'to', 'with'];
    
    return str.toLowerCase().replace(/\w\S*/g, function(txt, offset) {
        const word = txt.toUpperCase();
        
        if (keepUppercase.includes(word)) {
            return word;
        }
        
        if (offset > 0 && keepLowercase.includes(txt.toLowerCase())) {
            return txt.toLowerCase();
        }
        
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

// Generate UUID
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Load reference files
console.log('Loading reference files...');
const outputFormat = parseCSV(fs.readFileSync('OutputFormat.csv', 'utf-8'));
const regionData = parseCSV(fs.readFileSync('NewChapterRegion.csv', 'utf-8'));
const geocodedCsvData = parseCSV(fs.readFileSync('data82625_geocodio_d97d61e890ec8185c17b8f44ce0d78e6e9dfc898.csv', 'utf-8'));

// Load Excel data
const workbook = XLSX.readFile('data.xlsx');
const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
const excelData = XLSX.utils.sheet_to_json(firstSheet);

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

console.log(`Loaded ${Object.keys(chapterRegionMap).length} counties in mapping\n`);

// Process data function
function processData(inputData, source) {
    const outputHeaders = Object.keys(outputFormat[0] || {});
    const processed = [];
    
    // Process first 3 records only
    for (let i = 0; i < Math.min(3, inputData.length); i++) {
        const inputRow = inputData[i];
        const outputRow = {};
        
        // Initialize all headers
        outputHeaders.forEach(header => {
            outputRow[header] = '';
        });
        
        // Map basic fields
        outputRow['Name'] = inputRow['Name'] || '';
        outputRow['Phone'] = inputRow['Phone'] || '';
        outputRow['Address'] = toProperCase(inputRow['Address'] || '');
        outputRow['City'] = toProperCase(inputRow['City'] || '');
        outputRow['State'] = (inputRow['State'] || inputRow['ST'] || '').toUpperCase();
        outputRow['Zip'] = inputRow['Zip Code'] || inputRow['Zip'] || '';
        outputRow['Position'] = inputRow['Position'] || '';
        outputRow['GAP'] = inputRow['GAP'] || '';
        outputRow['RC Care Roles'] = inputRow['RC Care Roles'] || '';
        outputRow['CAC Card'] = inputRow['CAC Card'] || '';
        outputRow['1st Resp Case Count'] = inputRow['1st Resp Case Count'] || '';
        outputRow['2nd Resp Case Count'] = inputRow['2nd Resp Case Count'] || '';
        outputRow['Chapter'] = inputRow['Chapter'] || '';
        
        // Get county - prioritize Geocodio County
        let county = inputRow['Geocodio County'] || inputRow['County'] || '';
        if (county) {
            outputRow['County'] = toProperCase(county);
            
            // Look up region and chapter
            const cleanCounty = county.trim().toUpperCase().replace(' COUNTY', '');
            if (chapterRegionMap[cleanCounty]) {
                outputRow['Chapter'] = chapterRegionMap[cleanCounty].chapter;
                outputRow['Region'] = chapterRegionMap[cleanCounty].region;
            }
        }
        
        // Get coordinates
        outputRow['Latitude'] = inputRow['Latitude'] || inputRow['Geocodio Latitude'] || '';
        outputRow['Longitude'] = inputRow['Longitude'] || inputRow['Geocodio Longitude'] || '';
        
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
        outputRow['GlobalID'] = generateUUID();
        const now = new Date();
        const dateStr = `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear() % 100} ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
        outputRow['CreationDate'] = dateStr;
        outputRow['EditDate'] = dateStr;
        outputRow['Creator'] = '';
        outputRow['Editor'] = '';
        outputRow['x'] = outputRow['Longitude'];
        outputRow['y'] = outputRow['Latitude'];
        
        processed.push(outputRow);
    }
    
    return processed;
}

// Process all three sources
console.log('=== Processing Three-Way Comparison ===\n');

// 1. Process original OutputFormat (first 3 rows)
const originalRows = outputFormat.slice(0, 3);

// 2. Process geocoded CSV
console.log('Processing geocoded CSV...');
const geocodedProcessed = processData(geocodedCsvData, 'geocoded');

// 3. Process Excel data (simulated - would need geocoding)
console.log('Processing Excel data...');
const excelProcessed = processData(excelData, 'excel');

// Combine all results
const allResults = [];

// Add headers
const headers = Object.keys(outputFormat[0] || {});
allResults.push(['Source', ...headers]);

// Add original OutputFormat rows
originalRows.forEach(row => {
    allResults.push(['Original OutputFormat', ...headers.map(h => row[h] || '')]);
});

// Add geocoded CSV processed rows
geocodedProcessed.forEach(row => {
    allResults.push(['Output from Geocoded CSV', ...headers.map(h => row[h] || '')]);
});

// Add Excel processed rows
excelProcessed.forEach(row => {
    allResults.push(['Output from Excel', ...headers.map(h => row[h] || '')]);
});

// Create CSV content
const csvContent = allResults.map(row => 
    row.map(value => {
        if (value.toString().includes(',') || value.toString().includes('"') || value.toString().includes('\n')) {
            return `"${value.toString().replace(/"/g, '""')}"`;
        }
        return value;
    }).join(',')
).join('\n');

// Save to file
fs.writeFileSync('three-way-comparison-fixed.csv', csvContent);

console.log('\n✅ Created three-way-comparison-fixed.csv\n');

// Display summary
console.log('Summary of fixes applied:');
console.log('1. ✅ County extraction from "Geocodio County" field');
console.log('2. ✅ Region mapping from NewChapterRegion.csv');
console.log('3. ✅ Chapter updates based on county');
console.log('4. ✅ Icon field logic (Position + "& RC")');
console.log('5. ✅ Proper case formatting for addresses/cities');
console.log('6. ✅ ArcGIS fields (ObjectId, GlobalID, dates, x/y)');
console.log('\nFirst record sample:');
console.log(`  County: ${geocodedProcessed[0]['County']}`);
console.log(`  Region: ${geocodedProcessed[0]['Region']}`);
console.log(`  Chapter: ${geocodedProcessed[0]['Chapter']}`);
console.log(`  Icon: ${geocodedProcessed[0]['Icon']}`);