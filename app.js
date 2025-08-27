// Global variables
let uploadedData = null;
let outputFormat = null;
let chapterRegionMap = null;
let processedData = null;
let currentTab = 'geocoded';

// Geocodio API configuration
const GEOCODIO_API_KEY = 'da6a76cf6fa5ad2fac2a2acdae8e6e868688a86';
const GEOCODIO_API_URL = 'https://api.geocod.io/v1.7/geocode';

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    await loadReferenceFiles();
    setupEventListeners();
    
    // Pre-fill API key if provided
    const apiKeyInput = document.getElementById('apiKey');
    if (apiKeyInput && GEOCODIO_API_KEY) {
        apiKeyInput.value = GEOCODIO_API_KEY;
    }
});

// Switch between tabs
function switchTab(tab) {
    currentTab = tab;
    
    // Update tab styles
    document.querySelectorAll('.tab').forEach(t => {
        t.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Update content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tab}-tab`).classList.add('active');
    
    // Clear any previous uploads
    clearData();
}

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
                    chapter: row['News Chapters'] || row['Old Chapter'] || '',
                    region: row['New Regions'] || row['Old Region'] || ''
                };
            }
        });
        
        console.log('Chapter/Region map created:', Object.keys(chapterRegionMap).length, 'counties');
        
        console.log('Reference files loaded successfully');
    } catch (error) {
        console.error('Error loading reference files:', error);
        showStatus('Error loading reference files. Please refresh the page.', 'error');
    }
}

// Setup event listeners
function setupEventListeners() {
    // CSV upload
    const uploadAreaCsv = document.getElementById('uploadAreaCsv');
    const fileInputCsv = document.getElementById('fileInputCsv');
    
    uploadAreaCsv.addEventListener('click', () => {
        fileInputCsv.click();
    });
    
    setupDragAndDrop(uploadAreaCsv, (file) => {
        handleFile(file, 'csv');
    });
    
    fileInputCsv.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0], 'csv');
        }
    });
    
    // XLSX upload
    const uploadAreaXlsx = document.getElementById('uploadAreaXlsx');
    const fileInputXlsx = document.getElementById('fileInputXlsx');
    
    uploadAreaXlsx.addEventListener('click', () => {
        fileInputXlsx.click();
    });
    
    setupDragAndDrop(uploadAreaXlsx, (file) => {
        handleFile(file, 'xlsx');
    });
    
    fileInputXlsx.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0], 'xlsx');
        }
    });
    
    // Buttons
    document.getElementById('convertBtn').addEventListener('click', processData);
    document.getElementById('clearBtn').addEventListener('click', clearData);
    document.getElementById('downloadBtn').addEventListener('click', downloadResult);
}

// Setup drag and drop for an upload area
function setupDragAndDrop(element, callback) {
    element.addEventListener('dragover', (e) => {
        e.preventDefault();
        element.classList.add('dragover');
    });
    
    element.addEventListener('dragleave', () => {
        element.classList.remove('dragover');
    });
    
    element.addEventListener('drop', (e) => {
        e.preventDefault();
        element.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            callback(files[0]);
        }
    });
}

// Handle uploaded file
async function handleFile(file, expectedType) {
    if (expectedType === 'csv' && !file.name.endsWith('.csv')) {
        showStatus('Please upload a CSV file', 'error');
        return;
    }
    
    if (expectedType === 'xlsx' && !file.name.endsWith('.xlsx')) {
        showStatus('Please upload an Excel (XLSX) file', 'error');
        return;
    }
    
    if (expectedType === 'xlsx') {
        // Handle Excel file
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                showStatus('Reading Excel file...', 'processing');
                
                // Parse Excel file using SheetJS
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet);
                
                // Check for API key
                const apiKey = document.getElementById('apiKey').value.trim();
                if (!apiKey) {
                    showStatus('Please enter your Geocodio API key', 'error');
                    return;
                }
                
                // Geocode the data
                showStatus('Starting geocoding process...', 'processing');
                document.querySelector('.geocoding-progress').classList.add('show');
                
                uploadedData = await geocodeData(jsonData, apiKey);
                
                displayFileInfo(file.name, uploadedData);
                showStatus('File loaded and geocoded successfully', 'success');
                document.querySelector('.geocoding-progress').classList.remove('show');
                
            } catch (error) {
                console.error('Error processing Excel file:', error);
                showStatus('Error processing file: ' + error.message, 'error');
                document.querySelector('.geocoding-progress').classList.remove('show');
            }
        };
        reader.readAsArrayBuffer(file);
        
    } else {
        // Handle CSV file
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
}

// Geocode data using Geocodio API
async function geocodeData(data, apiKey) {
    const geocodedData = [];
    const batchSize = 100; // Geocodio allows up to 10,000 per request, but we'll do smaller batches
    
    for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, Math.min(i + batchSize, data.length));
        
        // Update progress
        const progress = Math.round((i / data.length) * 100);
        document.getElementById('progressFill').style.width = progress + '%';
        document.getElementById('progressFill').textContent = progress + '%';
        document.getElementById('progressText').textContent = `Geocoding records ${i + 1} to ${Math.min(i + batchSize, data.length)} of ${data.length}...`;
        
        try {
            // Prepare addresses for batch geocoding
            const addresses = batch.map(row => {
                const address = `${row['Address'] || ''}, ${row['City'] || ''}, ${row['ST'] || ''} ${row['Zip Code'] || ''}`.trim();
                return address;
            });
            
            // Make batch geocoding request
            const response = await fetch(`${GEOCODIO_API_URL}?api_key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(addresses)
            });
            
            if (!response.ok) {
                throw new Error(`Geocoding failed: ${response.statusText}`);
            }
            
            const results = await response.json();
            
            // Combine original data with geocoding results
            batch.forEach((row, index) => {
                const geocodeResult = results.results[index];
                const geocodedRow = { ...row };
                
                if (geocodeResult && geocodeResult.results && geocodeResult.results.length > 0) {
                    const bestMatch = geocodeResult.results[0];
                    
                    // Add geocoded fields
                    geocodedRow['Geocoded_Address'] = bestMatch.formatted_address || '';
                    geocodedRow['Geocoded_Street'] = bestMatch.address_components.formatted_street || '';
                    geocodedRow['Geocoded_City'] = bestMatch.address_components.city || '';
                    geocodedRow['Geocoded_State'] = bestMatch.address_components.state || '';
                    geocodedRow['Geocoded_Zip'] = bestMatch.address_components.zip || '';
                    geocodedRow['Geocoded_County'] = bestMatch.address_components.county || '';
                    geocodedRow['Latitude'] = bestMatch.location.lat || '';
                    geocodedRow['Longitude'] = bestMatch.location.lng || '';
                    geocodedRow['Accuracy'] = bestMatch.accuracy || '';
                    geocodedRow['Accuracy_Type'] = bestMatch.accuracy_type || '';
                }
                
                // Extract county from geocoded data if available
                if (geocodedRow['Geocoded_County']) {
                    geocodedRow['County'] = geocodedRow['Geocoded_County'].replace(' County', '');
                }
                
                geocodedData.push(geocodedRow);
            });
            
        } catch (error) {
            console.error('Batch geocoding error:', error);
            // Add ungeocoded data for this batch
            batch.forEach(row => {
                geocodedData.push(row);
            });
        }
        
        // Small delay to avoid rate limiting
        if (i + batchSize < data.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
    
    // Final progress update
    document.getElementById('progressFill').style.width = '100%';
    document.getElementById('progressFill').textContent = '100%';
    document.getElementById('progressText').textContent = 'Geocoding complete!';
    
    return geocodedData;
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
            
            // Apply proper case formatting to address fields
            if (outputRow['Address']) outputRow['Address'] = toProperCase(outputRow['Address']);
            if (outputRow['City']) outputRow['City'] = toProperCase(outputRow['City']);
            if (outputRow['State']) outputRow['State'] = outputRow['State'].toUpperCase();
            if (outputRow['County']) outputRow['County'] = toProperCase(outputRow['County']);
            
            // Update chapter and region based on county
            updateChapterRegion(outputRow, inputRow);
            
            // Prioritize geocoded addresses
            prioritizeGeocodedAddress(outputRow, inputRow);
            
            // Generate Icon field based on Position and RC Care Roles
            generateIconField(outputRow, inputRow);
            
            // Add ArcGIS-specific fields
            addArcGISFields(outputRow, processedData.length);
            
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
    // Common column mappings (adjusted for both CSV and XLSX formats)
    const columnMappings = {
        'Name': ['Name', 'Full Name', 'Volunteer Name', 'name'],
        'Address': ['Address', 'Street Address', 'address', 'Address 1', 'Geocoded_Street'],
        'City': ['City', 'city', 'Town', 'Geocoded_City'],
        'State': ['State', 'state', 'ST', 'Geocoded_State'],
        'Zip': ['Zip', 'ZIP', 'Postal Code', 'zip', 'Zip Code', 'Geocoded_Zip'],
        'County': ['County', 'county', 'County Name', 'Geocoded_County', 'Geocodio County'],
        'Chapter': ['Chapter', 'chapter', 'NEW Chapter'],
        'Region': ['Region', 'region', 'NEW Region'],
        'Email': ['Email', 'email', 'Email Address'],
        'Phone': ['Phone', 'phone', 'Phone Number', 'Cell Phone'],
        'Latitude': ['Latitude', 'lat', 'LAT', 'latitude'],
        'Longitude': ['Longitude', 'lng', 'LON', 'longitude', 'long'],
        'Position': ['Position', 'position', 'Role'],
        'GAP': ['GAP', 'gap'],
        'CAC Card': ['CAC Card', 'CAC_Card', 'CAC'],
        'RC Care Roles': ['RC Care Roles', 'RC_Care_Roles'],
        '1st Resp Case Count': ['1st Resp Case Count', '1st_Resp_Case_Count'],
        '2nd Resp Case Count': ['2nd Resp Case Count', '2nd_Resp_Case_Count']
    };
    
    // Try to find matching column
    const possibleColumns = columnMappings[outputHeader] || [outputHeader];
    
    for (const col of possibleColumns) {
        // Try exact match
        if (inputRow[col] !== undefined && inputRow[col] !== null && inputRow[col] !== 'nan') {
            return inputRow[col];
        }
        
        // Try case-insensitive match
        const inputKeys = Object.keys(inputRow);
        const matchedKey = inputKeys.find(key => 
            key.toLowerCase() === col.toLowerCase()
        );
        
        if (matchedKey && inputRow[matchedKey] !== 'nan') {
            return inputRow[matchedKey];
        }
    }
    
    // Check for geocoded versions (usually have prefix like "geocoded_" or suffix like "_geocoded")
    const geocodedPrefixes = ['geocoded_', 'geo_', 'corrected_', 'Geocoded_'];
    const geocodedSuffixes = ['_geocoded', '_geo', '_corrected'];
    
    for (const prefix of geocodedPrefixes) {
        for (const col of possibleColumns) {
            const prefixedCol = prefix + col;
            const matchedKey = Object.keys(inputRow).find(key => 
                key.toLowerCase() === prefixedCol.toLowerCase()
            );
            if (matchedKey && inputRow[matchedKey] !== 'nan') {
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
            if (matchedKey && inputRow[matchedKey] !== 'nan') {
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
        const countyColumns = ['Geocodio County', 'County', 'county', 'County Name', 'COUNTY', 'Geocoded_County'];
        for (const col of countyColumns) {
            if (inputRow[col] && inputRow[col] !== 'nan' && inputRow[col] !== '') {
                county = inputRow[col];
                outputRow['County'] = county; // Make sure to set it in output
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
            console.log(`Mapped ${cleanCounty} to Chapter: ${outputRow['Chapter']}, Region: ${outputRow['Region']}`);
        } else {
            console.log(`No mapping found for county: ${cleanCounty}`);
        }
    }
}

// Prioritize geocoded addresses over volunteer-entered ones
function prioritizeGeocodedAddress(outputRow, inputRow) {
    // Look for geocoded address fields
    const geocodedIndicators = ['geocoded', 'corrected', 'validated', 'standardized', 'Geocoded'];
    
    Object.keys(inputRow).forEach(key => {
        const lowerKey = key.toLowerCase();
        
        // Check if this is a geocoded field
        const isGeocoded = geocodedIndicators.some(indicator => 
            lowerKey.includes(indicator.toLowerCase())
        );
        
        if (isGeocoded) {
            // Map geocoded fields to output fields
            if (lowerKey.includes('address') || lowerKey.includes('street')) {
                if (inputRow[key] && inputRow[key].trim() && inputRow[key] !== 'nan') {
                    outputRow['Address'] = toProperCase(inputRow[key]);
                }
            } else if (lowerKey.includes('city') && !lowerKey.includes('accuracy')) {
                if (inputRow[key] && inputRow[key].trim() && inputRow[key] !== 'nan') {
                    outputRow['City'] = toProperCase(inputRow[key]);
                }
            } else if (lowerKey.includes('state')) {
                if (inputRow[key] && inputRow[key].trim() && inputRow[key] !== 'nan') {
                    outputRow['State'] = inputRow[key].toUpperCase(); // States should be uppercase
                }
            } else if (lowerKey.includes('zip') || lowerKey.includes('postal')) {
                if (inputRow[key] && inputRow[key].trim() && inputRow[key] !== 'nan') {
                    outputRow['Zip'] = inputRow[key];
                }
            }
        }
        
        // Always use Latitude/Longitude if available (these are typically geocoded)
        if (key === 'Latitude' || lowerKey === 'latitude' || lowerKey === 'lat') {
            if (inputRow[key] && inputRow[key] !== 'nan') {
                outputRow['Latitude'] = inputRow[key];
            }
        }
        if (key === 'Longitude' || lowerKey === 'longitude' || lowerKey === 'lng' || lowerKey === 'long') {
            if (inputRow[key] && inputRow[key] !== 'nan') {
                outputRow['Longitude'] = inputRow[key];
            }
        }
    });
}

// Generate Icon field based on Position and RC Care Roles
function generateIconField(outputRow, inputRow) {
    const position = outputRow['Position'] || '';
    const rcCareRoles = outputRow['RC Care Roles'] || inputRow['RC Care Roles'] || '';
    
    if (position) {
        // Check if they have RC Care Roles
        if (rcCareRoles && rcCareRoles.trim() !== '') {
            outputRow['Icon'] = position + ' & RC';
        } else {
            outputRow['Icon'] = position;
        }
    } else {
        outputRow['Icon'] = '';
    }
}

// Add ArcGIS-specific fields
function addArcGISFields(outputRow, index) {
    // Generate ObjectId (starting from a base number)
    outputRow['ObjectId'] = outputRow['ObjectId'] || (5817 + index).toString();
    
    // Generate GlobalID (UUID format)
    if (!outputRow['GlobalID']) {
        outputRow['GlobalID'] = generateUUID();
    }
    
    // Add timestamps if not present
    const now = new Date();
    const dateStr = `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear() % 100} ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    outputRow['CreationDate'] = outputRow['CreationDate'] || dateStr;
    outputRow['EditDate'] = outputRow['EditDate'] || dateStr;
    outputRow['Creator'] = outputRow['Creator'] || '';
    outputRow['Editor'] = outputRow['Editor'] || '';
    
    // Copy Longitude/Latitude to x/y if available
    if (outputRow['Longitude']) {
        outputRow['x'] = outputRow['Longitude'];
    }
    if (outputRow['Latitude']) {
        outputRow['y'] = outputRow['Latitude'];
    }
}

// Generate UUID for GlobalID
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Convert text to proper case (Title Case)
function toProperCase(str) {
    if (!str) return '';
    
    // Special cases that should remain uppercase
    const keepUppercase = ['FL', 'USA', 'US', 'NE', 'NW', 'SE', 'SW', 'PO', 'II', 'III', 'IV'];
    
    // Words that should remain lowercase (unless first word)
    const keepLowercase = ['a', 'an', 'and', 'as', 'at', 'by', 'for', 'from', 'in', 'of', 'on', 'or', 'the', 'to', 'with'];
    
    return str.toLowerCase().replace(/\w\S*/g, function(txt, offset) {
        const word = txt.toUpperCase();
        
        // Check if it's a special case that should remain uppercase
        if (keepUppercase.includes(word)) {
            return word;
        }
        
        // Check if it's a word that should remain lowercase (unless at start)
        if (offset > 0 && keepLowercase.includes(txt.toLowerCase())) {
            return txt.toLowerCase();
        }
        
        // Otherwise, proper case it
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

// Clear uploaded data
function clearData() {
    uploadedData = null;
    processedData = null;
    document.getElementById('fileInfo').classList.remove('show');
    document.getElementById('downloadSection').classList.remove('show');
    document.getElementById('status').classList.remove('show');
    document.getElementById('fileInputCsv').value = '';
    document.getElementById('fileInputXlsx').value = '';
    document.querySelector('.geocoding-progress').classList.remove('show');
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

// Make switchTab global
window.switchTab = switchTab;