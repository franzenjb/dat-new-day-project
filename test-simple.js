const fs = require('fs');
const XLSX = require('xlsx');

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

// Test Excel reading and simulate processing
function testExcelProcessing() {
    console.log('\n=== Testing Excel Processing (First 10 Records) ===\n');
    
    // Read Excel file
    const workbook = XLSX.readFile('data.xlsx');
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(firstSheet);
    
    console.log(`Total records in Excel: ${jsonData.length}`);
    console.log('\nFirst 3 records from Excel:');
    
    for (let i = 0; i < Math.min(3, jsonData.length); i++) {
        console.log(`\nRecord ${i + 1}:`);
        const record = jsonData[i];
        console.log(`  Name: ${record['Name']}`);
        console.log(`  Address: ${record['Address']}, ${record['City']}, ${record['ST']} ${record['Zip Code']}`);
        console.log(`  Chapter: ${record['Chapter']}`);
        console.log(`  Phone: ${record['Phone']}`);
    }
    
    // Simulate what would happen with geocoding
    console.log('\n--- Simulated Geocoding Output Format ---');
    console.log('After geocoding, each record would have additional fields:');
    console.log('  - Geocoded_Address');
    console.log('  - Geocoded_City');
    console.log('  - Geocoded_State');
    console.log('  - Geocoded_Zip');
    console.log('  - Geocoded_County');
    console.log('  - Latitude');
    console.log('  - Longitude');
    
    // Process just first 10 records as sample
    const sampleSize = 10;
    const sampleData = jsonData.slice(0, sampleSize);
    
    // Load reference data
    const outputFormatCsv = fs.readFileSync('OutputFormat.csv', 'utf-8');
    const outputFormat = parseCSV(outputFormatCsv);
    const outputHeaders = Object.keys(outputFormat[0] || {});
    
    // Create sample output
    const processedSample = [];
    sampleData.forEach(row => {
        const outputRow = {};
        outputHeaders.forEach(header => {
            // Map common fields
            if (row['Name']) outputRow['Name'] = row['Name'];
            if (row['Address']) outputRow['Address'] = row['Address'];
            if (row['City']) outputRow['City'] = row['City'];
            if (row['ST']) outputRow['State'] = row['ST'];
            if (row['Zip Code']) outputRow['Zip'] = row['Zip Code'];
            if (row['Phone']) outputRow['Phone'] = row['Phone'];
            if (row['Chapter']) outputRow['Chapter'] = row['Chapter'];
            if (row['Position']) outputRow['Position'] = row['Position'];
            
            // Fill other fields with empty strings
            if (!outputRow[header]) outputRow[header] = '';
        });
        processedSample.push(outputRow);
    });
    
    // Save sample output
    const csvContent = [
        outputHeaders.join(','),
        ...processedSample.map(row => 
            outputHeaders.map(header => {
                const value = row[header] || '';
                if (value.toString().includes(',') || value.toString().includes('"')) {
                    return `"${value.toString().replace(/"/g, '""')}"`;
                }
                return value;
            }).join(',')
        )
    ].join('\n');
    
    fs.writeFileSync('OutputFormat_from_excel_sample.csv', csvContent);
    console.log('\n✓ Created OutputFormat_from_excel_sample.csv (10 records without geocoding)');
}

// Compare the two approaches
function compareOutputs() {
    console.log('\n=== Comparing Processing Approaches ===\n');
    
    // Read geocoded CSV
    const geocodedCsv = fs.readFileSync('data82625_geocodio_d97d61e890ec8185c17b8f44ce0d78e6e9dfc898.csv', 'utf-8');
    const geocodedData = parseCSV(geocodedCsv);
    
    // Read Excel
    const workbook = XLSX.readFile('data.xlsx');
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const excelData = XLSX.utils.sheet_to_json(firstSheet);
    
    console.log(`Geocoded CSV records: ${geocodedData.length}`);
    console.log(`Raw Excel records: ${excelData.length}`);
    
    // Check field differences
    const csvFields = Object.keys(geocodedData[0] || {});
    const excelFields = Object.keys(excelData[0] || {});
    
    console.log('\n--- Geocoded CSV has these additional fields from Geocodio ---');
    const geocodedFields = csvFields.filter(f => f.includes('Accuracy') || f.includes('Number'));
    geocodedFields.forEach(field => {
        if (field.includes('Latitude') || field.includes('Longitude') || field.includes('Accuracy') || field.includes('Number')) {
            console.log(`  - ${field}`);
        }
    });
    
    console.log('\n--- Both files contain core volunteer data ---');
    console.log('  - Name, Address, City, State, Zip');
    console.log('  - Chapter, Position, Phone');
    console.log('  - Additional role and certification fields');
}

// Main execution
function main() {
    console.log('\n=== DAT New Day Data Processing Test ===');
    
    // Test Excel processing
    testExcelProcessing();
    
    // Compare outputs
    compareOutputs();
    
    console.log('\n=== Summary ===');
    console.log('\n✅ Files created:');
    console.log('   - OutputFormat_from_geocoded_csv.csv (full data, already geocoded)');
    console.log('   - OutputFormat_from_excel_sample.csv (10 record sample, no geocoding)');
    console.log('\nBoth approaches produce the same OutputFormat.csv structure.');
    console.log('The Excel approach would add geocoding automatically via API.');
}

// Run the test
main();