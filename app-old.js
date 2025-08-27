// Global variables
let uploadedData = null;
let outputFormat = null;
let chapterRegionMap = null;
let processedData = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    await loadReferenceFiles();
    setupEventListeners();
});

// Load the reference CSV files
async function loadReferenceFiles() {
    try {
        // Load OutputFormat.csv
        const outputResponse = await fetch('OutputFormat.csv');
        const outputText = await outputResponse.text();
        outputFormat = parseCSV(outputText);
        
        // Load NewChapterRegion.csv
        const regionResponse = await fetch('NewChapterRegion.csv');
        const regionText = await regionResponse.text();
        const regionData = parseCSV(regionText);
        
        // Create a map for easy county lookup
        chapterRegionMap = {};
        regionData.forEach(row => {
            if (row['County']) {
                const county = row['County'].trim().toUpperCase();
                chapterRegionMap[county] = {
                    chapter: row['Chapter'] || row['NEW Chapter'] || '',
                    region: row['Region'] || row['NEW Region'] || ''
                };
            }
        });
        
        console.log('Reference files loaded successfully');
    } catch (error) {
        console.error('Error loading reference files:', error);
        showStatus('Error loading reference files. Please refresh the page.', 'error');
    }
}

// Setup event listeners
function setupEventListeners() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const convertBtn = document.getElementById('convertBtn');
    const clearBtn = document.getElementById('clearBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    
    // Click to upload
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });
    
    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });
    
    // File input change
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });
    
    // Convert button
    convertBtn.addEventListener('click', processData);
    
    // Clear button
    clearBtn.addEventListener('click', clearData);
    
    // Download button
    downloadBtn.addEventListener('click', downloadResult);
}

// Handle uploaded file
function handleFile(file) {
    if (!file.name.endsWith('.csv')) {
        showStatus('Please upload a CSV file', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            uploadedData = parseCSV(e.target.result);
            displayFileInfo(file.name, uploadedData);
            showStatus('File loaded successfully', 'success');
        } catch (error) {
            showStatus('Error reading file: ' + error.message, 'error');
        }
    };
    reader.readAsText(file);
}

// Parse CSV text into array of objects
function parseCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
        throw new Error('CSV file is empty or invalid');
    }
    
    // Parse headers
    const headers = parseCSVLine(lines[0]);
    
    // Parse data rows
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

// Parse a single CSV line handling quoted values
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

// Display file information
function displayFileInfo(fileName, data) {
    document.getElementById('fileName').textContent = `File: ${fileName}`;
    
    const stats = document.getElementById('stats');
    stats.innerHTML = `
        <div class="stat-card">
            <div class="stat-number">${data.length}</div>
            <div class="stat-label">Rows</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${Object.keys(data[0] || {}).length}</div>
            <div class="stat-label">Columns</div>
        </div>
    `;
    
    document.getElementById('fileInfo').classList.add('show');
    document.getElementById('downloadSection').classList.remove('show');
}

// Process the uploaded data
function processData() {
    if (!uploadedData || !outputFormat || !chapterRegionMap) {
        showStatus('Missing required data. Please upload a file and ensure reference files are loaded.', 'error');
        return;
    }
    
    showStatus('<span class="spinner"></span> Processing data...', 'processing');
    
    try {
        processedData = [];
        const outputHeaders = Object.keys(outputFormat[0] || {});
        
        uploadedData.forEach(inputRow => {
            const outputRow = {};
            
            // Map columns based on the OutputFormat template
            outputHeaders.forEach(header => {
                outputRow[header] = mapColumn(header, inputRow);
            });
            
            // Update chapter and region based on county
            updateChapterRegion(outputRow, inputRow);
            
            // Prioritize geocoded addresses
            prioritizeGeocodedAddress(outputRow, inputRow);
            
            processedData.push(outputRow);
        });
        
        showStatus(`Successfully processed ${processedData.length} records`, 'success');
        document.getElementById('downloadSection').classList.add('show');
        
    } catch (error) {
        showStatus('Error processing data: ' + error.message, 'error');
        console.error('Processing error:', error);
    }
}

// Map columns from input to output format
function mapColumn(outputHeader, inputRow) {
    // Common column mappings (adjust based on actual data)
    const columnMappings = {
        'Name': ['Name', 'Full Name', 'Volunteer Name', 'name'],
        'Address': ['Address', 'Street Address', 'address', 'Address 1'],
        'City': ['City', 'city', 'Town'],
        'State': ['State', 'state', 'ST'],
        'Zip': ['Zip', 'ZIP', 'Postal Code', 'zip', 'Zip Code'],
        'County': ['County', 'county', 'County Name'],
        'Chapter': ['Chapter', 'chapter', 'NEW Chapter'],
        'Region': ['Region', 'region', 'NEW Region'],
        'Email': ['Email', 'email', 'Email Address'],
        'Phone': ['Phone', 'phone', 'Phone Number', 'Cell Phone'],
        'Latitude': ['Latitude', 'lat', 'LAT', 'latitude'],
        'Longitude': ['Longitude', 'lng', 'LON', 'longitude', 'long']
    };
    
    // Try to find matching column
    const possibleColumns = columnMappings[outputHeader] || [outputHeader];
    
    for (const col of possibleColumns) {
        // Try exact match
        if (inputRow[col] !== undefined) {
            return inputRow[col];
        }
        
        // Try case-insensitive match
        const inputKeys = Object.keys(inputRow);
        const matchedKey = inputKeys.find(key => 
            key.toLowerCase() === col.toLowerCase()
        );
        
        if (matchedKey) {
            return inputRow[matchedKey];
        }
    }
    
    // Check for geocoded versions (usually have prefix like "geocoded_" or suffix like "_geocoded")
    const geocodedPrefixes = ['geocoded_', 'geo_', 'corrected_'];
    const geocodedSuffixes = ['_geocoded', '_geo', '_corrected'];
    
    for (const prefix of geocodedPrefixes) {
        for (const col of possibleColumns) {
            const prefixedCol = prefix + col;
            const matchedKey = Object.keys(inputRow).find(key => 
                key.toLowerCase() === prefixedCol.toLowerCase()
            );
            if (matchedKey) {
                return inputRow[matchedKey];
            }
        }
    }
    
    for (const suffix of geocodedSuffixes) {
        for (const col of possibleColumns) {
            const suffixedCol = col + suffix;
            const matchedKey = Object.keys(inputRow).find(key => 
                key.toLowerCase() === suffixedCol.toLowerCase()
            );
            if (matchedKey) {
                return inputRow[matchedKey];
            }
        }
    }
    
    return ''; // Return empty string if no match found
}

// Update chapter and region based on county
function updateChapterRegion(outputRow, inputRow) {
    // Find the county value
    let county = outputRow['County'] || '';
    
    // If no county in output, try to find it in input
    if (!county) {
        const countyColumns = ['County', 'county', 'County Name', 'COUNTY'];
        for (const col of countyColumns) {
            if (inputRow[col]) {
                county = inputRow[col];
                break;
            }
        }
    }
    
    // Clean up county name and look it up
    if (county) {
        const cleanCounty = county.trim().toUpperCase().replace(' COUNTY', '');
        
        if (chapterRegionMap[cleanCounty]) {
            outputRow['Chapter'] = chapterRegionMap[cleanCounty].chapter;
            outputRow['Region'] = chapterRegionMap[cleanCounty].region;
        }
    }
}

// Prioritize geocoded addresses over volunteer-entered ones
function prioritizeGeocodedAddress(outputRow, inputRow) {
    // Look for geocoded address fields
    const geocodedIndicators = ['geocoded', 'corrected', 'validated', 'standardized'];
    
    Object.keys(inputRow).forEach(key => {
        const lowerKey = key.toLowerCase();
        
        // Check if this is a geocoded address field
        const isGeocoded = geocodedIndicators.some(indicator => 
            lowerKey.includes(indicator)
        );
        
        if (isGeocoded) {
            // Map geocoded fields to output fields
            if (lowerKey.includes('address') || lowerKey.includes('street')) {
                if (inputRow[key] && inputRow[key].trim()) {
                    outputRow['Address'] = inputRow[key];
                }
            } else if (lowerKey.includes('city')) {
                if (inputRow[key] && inputRow[key].trim()) {
                    outputRow['City'] = inputRow[key];
                }
            } else if (lowerKey.includes('state')) {
                if (inputRow[key] && inputRow[key].trim()) {
                    outputRow['State'] = inputRow[key];
                }
            } else if (lowerKey.includes('zip') || lowerKey.includes('postal')) {
                if (inputRow[key] && inputRow[key].trim()) {
                    outputRow['Zip'] = inputRow[key];
                }
            } else if (lowerKey.includes('lat')) {
                if (inputRow[key] && inputRow[key].trim()) {
                    outputRow['Latitude'] = inputRow[key];
                }
            } else if (lowerKey.includes('lon') || lowerKey.includes('lng')) {
                if (inputRow[key] && inputRow[key].trim()) {
                    outputRow['Longitude'] = inputRow[key];
                }
            }
        }
    });
}

// Clear uploaded data
function clearData() {
    uploadedData = null;
    processedData = null;
    document.getElementById('fileInfo').classList.remove('show');
    document.getElementById('downloadSection').classList.remove('show');
    document.getElementById('status').classList.remove('show');
    document.getElementById('fileInput').value = '';
}

// Download the processed result
function downloadResult() {
    if (!processedData || processedData.length === 0) {
        showStatus('No data to download', 'error');
        return;
    }
    
    // Convert to CSV
    const headers = Object.keys(outputFormat[0] || processedData[0]);
    const csvContent = [
        headers.join(','),
        ...processedData.map(row => 
            headers.map(header => {
                const value = row[header] || '';
                // Quote values that contain commas, quotes, or newlines
                if (value.toString().includes(',') || value.toString().includes('"') || value.toString().includes('\n')) {
                    return `"${value.toString().replace(/"/g, '""')}"`;
                }
                return value;
            }).join(',')
        )
    ].join('\n');
    
    // Create download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'OutputFormat.csv');
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showStatus('File downloaded successfully!', 'success');
}

// Show status message
function showStatus(message, type) {
    const statusElement = document.getElementById('status');
    statusElement.innerHTML = message;
    statusElement.className = `status show ${type}`;
    
    if (type !== 'processing') {
        setTimeout(() => {
            statusElement.classList.remove('show');
        }, 5000);
    }
}