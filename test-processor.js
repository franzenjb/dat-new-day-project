const fs = require('fs');
const XLSX = require('xlsx');
const https = require('https');

// Read reference files
const outputFormatCsv = fs.readFileSync('OutputFormat.csv', 'utf-8');
const newChapterRegionCsv = fs.readFileSync('NewChapterRegion.csv', 'utf-8');

// Parse CSV function
function parseCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
        throw new Error('CSV file is empty or invalid');
    }
    
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

// Load reference data
const outputFormat = parseCSV(outputFormatCsv);
const chapterRegionData = parseCSV(newChapterRegionCsv);

// Create chapter/region map
const chapterRegionMap = {};
chapterRegionData.forEach(row => {
    if (row['County']) {
        const county = row['County'].trim().toUpperCase();
        chapterRegionMap[county] = {
            chapter: row['Chapter'] || row['NEW Chapter'] || '',
            region: row['Region'] || row['NEW Region'] || ''
        };
    }
});

// Process geocoded CSV
function processGeocodedCSV() {
    console.log('Processing geocoded CSV file...');
    const csvData = fs.readFileSync('data82625_geocodio_d97d61e890ec8185c17b8f44ce0d78e6e9dfc898.csv', 'utf-8');
    const inputData = parseCSV(csvData);
    
    const processedData = processData(inputData);
    saveAsCSV(processedData, 'OutputFormat_from_geocoded_csv.csv');
    console.log('✓ Saved OutputFormat_from_geocoded_csv.csv');
    
    return processedData;
}

// Process raw Excel
async function processRawExcel() {
    console.log('Processing raw Excel file...');
    
    // Read Excel file
    const workbook = XLSX.readFile('data.xlsx');
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(firstSheet);
    
    console.log(`Found ${jsonData.length} records in Excel file`);
    
    // Geocode the data
    const geocodedData = await geocodeData(jsonData);
    
    const processedData = processData(geocodedData);
    saveAsCSV(processedData, 'OutputFormat_from_excel.csv');
    console.log('✓ Saved OutputFormat_from_excel.csv');
    
    return processedData;
}

// Geocoding function
async function geocodeData(data) {
    const GEOCODIO_API_KEY = 'da6a76cf6fa5ad2fac2a2acdae8e6e868688a86';
    const geocodedData = [];
    const batchSize = 100;
    
    for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, Math.min(i + batchSize, data.length));
        console.log(`Geocoding batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(data.length/batchSize)}...`);
        
        try {
            // Prepare addresses
            const addresses = batch.map(row => {
                return `${row['Address'] || ''}, ${row['City'] || ''}, ${row['ST'] || ''} ${row['Zip Code'] || ''}`.trim();
            });
            
            // Make geocoding request
            const response = await makeGeocodingRequest(addresses, GEOCODIO_API_KEY);
            const results = JSON.parse(response);
            
            // Combine with original data
            batch.forEach((row, index) => {
                const geocodeResult = results.results[index];
                const geocodedRow = { ...row };
                
                if (geocodeResult && geocodeResult.results && geocodeResult.results.length > 0) {
                    const bestMatch = geocodeResult.results[0];
                    
                    geocodedRow['Geocoded_Address'] = bestMatch.formatted_address || '';
                    geocodedRow['Geocoded_Street'] = bestMatch.address_components.formatted_street || '';
                    geocodedRow['Geocoded_City'] = bestMatch.address_components.city || '';
                    geocodedRow['Geocoded_State'] = bestMatch.address_components.state || '';
                    geocodedRow['Geocoded_Zip'] = bestMatch.address_components.zip || '';
                    geocodedRow['Geocoded_County'] = bestMatch.address_components.county || '';
                    geocodedRow['Latitude'] = bestMatch.location.lat || '';
                    geocodedRow['Longitude'] = bestMatch.location.lng || '';
                }
                
                if (geocodedRow['Geocoded_County']) {
                    geocodedRow['County'] = geocodedRow['Geocoded_County'].replace(' County', '');
                }
                
                geocodedData.push(geocodedRow);
            });
            
        } catch (error) {
            console.error('Geocoding error:', error.message);
            batch.forEach(row => geocodedData.push(row));
        }
        
        // Small delay between batches
        if (i + batchSize < data.length) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
    
    return geocodedData;
}

// Make HTTPS request to Geocodio
function makeGeocodingRequest(addresses, apiKey) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(addresses);
        
        const options = {
            hostname: 'api.geocod.io',
            path: `/v1.7/geocode?api_key=${apiKey}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        
        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                if (res.statusCode === 200) {
                    resolve(data);
                } else {
                    reject(new Error(`Geocoding failed: ${res.statusCode}`));
                }
            });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        req.write(postData);
        req.end();
    });
}

// Process data to match OutputFormat
function processData(inputData) {
    const processedData = [];
    const outputHeaders = Object.keys(outputFormat[0] || {});
    
    inputData.forEach(inputRow => {
        const outputRow = {};
        
        // Map columns
        outputHeaders.forEach(header => {
            outputRow[header] = mapColumn(header, inputRow);
        });
        
        // Update chapter and region
        updateChapterRegion(outputRow, inputRow);
        
        // Prioritize geocoded addresses
        prioritizeGeocodedAddress(outputRow, inputRow);
        
        processedData.push(outputRow);
    });
    
    return processedData;
}

// Column mapping function
function mapColumn(outputHeader, inputRow) {
    const columnMappings = {
        'Name': ['Name', 'Full Name', 'Volunteer Name'],
        'Address': ['Address', 'Street Address', 'Geocoded_Street'],
        'City': ['City', 'Geocoded_City'],
        'State': ['State', 'ST', 'Geocoded_State'],
        'Zip': ['Zip', 'ZIP', 'Zip Code', 'Geocoded_Zip'],
        'County': ['County', 'Geocoded_County'],
        'Chapter': ['Chapter', 'NEW Chapter'],
        'Region': ['Region', 'NEW Region'],
        'Phone': ['Phone', 'Phone Number'],
        'Position': ['Position'],
        'GAP': ['GAP'],
        'CAC Card': ['CAC Card'],
        'RC Care Roles': ['RC Care Roles'],
        '1st Resp Case Count': ['1st Resp Case Count'],
        '2nd Resp Case Count': ['2nd Resp Case Count'],
        'Latitude': ['Latitude', 'lat'],
        'Longitude': ['Longitude', 'lng', 'long']
    };
    
    const possibleColumns = columnMappings[outputHeader] || [outputHeader];
    
    for (const col of possibleColumns) {
        if (inputRow[col] !== undefined && inputRow[col] !== null && inputRow[col] !== 'nan') {
            return inputRow[col];
        }
        
        // Case-insensitive match
        const inputKeys = Object.keys(inputRow);
        const matchedKey = inputKeys.find(key => 
            key.toLowerCase() === col.toLowerCase()
        );
        
        if (matchedKey && inputRow[matchedKey] !== 'nan') {
            return inputRow[matchedKey];
        }
    }
    
    return '';
}

// Update chapter and region based on county
function updateChapterRegion(outputRow, inputRow) {
    let county = outputRow['County'] || '';
    
    if (!county) {
        const countyColumns = ['County', 'Geocoded_County'];
        for (const col of countyColumns) {
            if (inputRow[col] && inputRow[col] !== 'nan') {
                county = inputRow[col];
                break;
            }
        }
    }
    
    if (county) {
        const cleanCounty = county.trim().toUpperCase().replace(' COUNTY', '');
        
        if (chapterRegionMap[cleanCounty]) {
            outputRow['Chapter'] = chapterRegionMap[cleanCounty].chapter;
            outputRow['Region'] = chapterRegionMap[cleanCounty].region;
        }
    }
}

// Prioritize geocoded addresses
function prioritizeGeocodedAddress(outputRow, inputRow) {
    const geocodedIndicators = ['geocoded', 'Geocoded'];
    
    Object.keys(inputRow).forEach(key => {
        const lowerKey = key.toLowerCase();
        const isGeocoded = geocodedIndicators.some(indicator => 
            lowerKey.includes(indicator.toLowerCase())
        );
        
        if (isGeocoded) {
            if (lowerKey.includes('address') || lowerKey.includes('street')) {
                if (inputRow[key] && inputRow[key].trim() && inputRow[key] !== 'nan') {
                    outputRow['Address'] = inputRow[key];
                }
            } else if (lowerKey.includes('city') && !lowerKey.includes('accuracy')) {
                if (inputRow[key] && inputRow[key].trim() && inputRow[key] !== 'nan') {
                    outputRow['City'] = inputRow[key];
                }
            } else if (lowerKey.includes('state')) {
                if (inputRow[key] && inputRow[key].trim() && inputRow[key] !== 'nan') {
                    outputRow['State'] = inputRow[key];
                }
            } else if (lowerKey.includes('zip')) {
                if (inputRow[key] && inputRow[key].trim() && inputRow[key] !== 'nan') {
                    outputRow['Zip'] = inputRow[key];
                }
            }
        }
    });
}

// Save as CSV
function saveAsCSV(data, filename) {
    const headers = Object.keys(outputFormat[0] || data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row => 
            headers.map(header => {
                const value = row[header] || '';
                if (value.toString().includes(',') || value.toString().includes('"') || value.toString().includes('\n')) {
                    return `"${value.toString().replace(/"/g, '""')}"`;
                }
                return value;
            }).join(',')
        )
    ].join('\n');
    
    fs.writeFileSync(filename, csvContent);
}

// Main execution
async function main() {
    console.log('\n=== DAT New Day Data Processor Test ===\n');
    
    // Process geocoded CSV
    console.log('--- Option 1: Processing Geocoded CSV ---');
    const csvResults = processGeocodedCSV();
    
    // Process raw Excel
    console.log('\n--- Option 2: Processing Raw Excel with Geocoding ---');
    const excelResults = await processRawExcel();
    
    // Compare results
    console.log('\n--- Results Summary ---');
    console.log(`CSV processing: ${csvResults.length} records`);
    console.log(`Excel processing: ${excelResults.length} records`);
    
    console.log('\n✅ Both output files have been created:');
    console.log('   - OutputFormat_from_geocoded_csv.csv');
    console.log('   - OutputFormat_from_excel.csv');
}

// Run the test
main().catch(console.error);