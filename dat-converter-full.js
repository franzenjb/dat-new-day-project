// Chapter/Region mapping data
const chapterRegionMap = {
    'alachua': { chapter: 'Northeast Florida Chapter', region: 'North and Central' },
    'baker': { chapter: 'Northeast Florida Chapter', region: 'North and Central' },
    'bay': { chapter: 'Northwest Florida Chapter', region: 'North and Central' },
    'bradford': { chapter: 'Northeast Florida Chapter', region: 'North and Central' },
    'brevard': { chapter: 'Space Coast Chapter', region: 'North and Central' },
    'broward': { chapter: 'Broward Chapter', region: 'South' },
    'calhoun': { chapter: 'Northwest Florida Chpater', region: 'North and Central' },
    'charlotte': { chapter: 'Southwest Florida Chapter', region: 'South' },
    'citrus': { chapter: 'Mid Florida Chapter', region: 'North and Central' },
    'clay': { chapter: 'Northeast Florida Chapter', region: 'North and Central' },
    'collier': { chapter: 'Southwest Florida Chapter', region: 'South' },
    'columbia': { chapter: 'Northeast Florida Chapter', region: 'North and Central' },
    'desoto': { chapter: 'Florida Southern Gulf to Heartland Chapter', region: 'South' },
    'dixie': { chapter: 'Northeast Florida Chapter', region: 'North and Central' },
    'duval': { chapter: 'Northeast Florida Chapter', region: 'North and Central' },
    'escambia': { chapter: 'Northwest Florida Chapter', region: 'North and Central' },
    'flagler': { chapter: 'Northeast Florida Chapter', region: 'North and Central' },
    'franklin': { chapter: 'Capital Area Chapter', region: 'North and Central' },
    'gadsden': { chapter: 'Capital Area Chapter', region: 'North and Central' },
    'gilchrist': { chapter: 'Northeast Florida Chapter', region: 'North and Central' },
    'glades': { chapter: 'Florida Southern Gulf to Heartland Chapter', region: 'South' },
    'gulf': { chapter: 'Northwest Florida Chapter', region: 'North and Central' },
    'hamilton': { chapter: 'Capital Area Chapter', region: 'North and Central' },
    'hardee': { chapter: 'Mid Florida Chapter', region: 'North and Central' },
    'hendry': { chapter: 'Florida Southern Gulf to Heartland Chapter', region: 'South' },
    'hernando': { chapter: 'Mid Florida Chapter', region: 'North and Central' },
    'highlands': { chapter: 'Florida Southern Gulf to Heartland Chapter', region: 'South' },
    'hillsborough': { chapter: 'Tampa Bay Chapter', region: 'North and Central' },
    'holmes': { chapter: 'Northwest Florida Chapter', region: 'North and Central' },
    'indian river': { chapter: 'Space Coast Chapter', region: 'North and Central' },
    'jackson': { chapter: 'Northwest Florida Chapter', region: 'North and Central' },
    'jefferson': { chapter: 'Capital Area Chapter', region: 'North and Central' },
    'lafayette': { chapter: 'Capital Area Chapter', region: 'North and Central' },
    'lake': { chapter: 'Greater Orlando', region: 'North and Central' },
    'lee': { chapter: 'Florida Southern Gulf to Heartland Chapter', region: 'South' },
    'leon': { chapter: 'Capital Area Chapter', region: 'North and Central' },
    'levy': { chapter: 'Mid Florida Chapter', region: 'North and Central' },
    'liberty': { chapter: 'Capital Area Chapter', region: 'North and Central' },
    'madison': { chapter: 'Capital Area Chapter', region: 'North and Central' },
    'manatee': { chapter: 'Southwest Florida Chapter', region: 'South' },
    'marion': { chapter: 'Mid Florida Chapter', region: 'North and Central' },
    'martin': { chapter: 'Space Coast Chapter', region: 'North and Central' },
    'miami-dade': { chapter: 'Greater Miami and the Keys Chapter', region: 'South' },
    'monroe': { chapter: 'Greater Miami and the Keys Chapter', region: 'South' },
    'nassau': { chapter: 'Northeast Florida Chapter', region: 'North and Central' },
    'okaloosa': { chapter: 'Northwest Florida Chapter', region: 'North and Central' },
    'okeechobee': { chapter: 'Space Coast Chapter', region: 'North and Central' },
    'orange': { chapter: 'Greater Orlando', region: 'North and Central' },
    'osceola': { chapter: 'Greater Orlando', region: 'North and Central' },
    'palm beach': { chapter: 'Palm Beach Chapter', region: 'South' },
    'pasco': { chapter: 'Mid Florida Chapter', region: 'North and Central' },
    'pinellas': { chapter: 'Tampa Bay Chapter', region: 'North and Central' },
    'polk': { chapter: 'Mid Florida Chapter', region: 'North and Central' },
    'putnam': { chapter: 'Northeast Florida Chapter', region: 'North and Central' },
    'santa rosa': { chapter: 'Northwest Florida Chapter', region: 'North and Central' },
    'sarasota': { chapter: 'Southwest Florida Chapter', region: 'South' },
    'seminole': { chapter: 'Central Florida Coast', region: 'North and Central' },
    'st. johns': { chapter: 'Northeast Florida Chapter', region: 'North and Central' },
    'st. lucie': { chapter: 'Space Coast Chapter', region: 'North and Central' },
    'sumter': { chapter: 'Mid Florida Chapter', region: 'North and Central' },
    'suwannee': { chapter: 'Capital Area Chapter', region: 'North and Central' },
    'taylor': { chapter: 'Capital Area Chapter', region: 'North and Central' },
    'union': { chapter: 'Northeast Florida Chapter', region: 'North and Central' },
    'volusia': { chapter: 'Space Coast Chapter', region: 'North and Central' },
    'wakulla': { chapter: 'Capital Area Chapter', region: 'North and Central' },
    'walton': { chapter: 'Northwest Florida Chapter', region: 'North and Central' },
    'washington': { chapter: 'Northwest Florida Chapter', region: 'North and Central' }
};

// Default Geocodio API key
const DEFAULT_GEOCODIO_KEY = 'da6a76cf6fa5ad2fac2a2acdae8e6e868688a86';

// Global state
let selectedOption = null;
let uploadedData = {};
let convertedData = {};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Set up file upload handlers for each option
    setupFileUpload('A');
    setupFileUpload('B');
    setupFileUpload('C');
    
    // Set up button handlers
    document.getElementById('convertBtnA').addEventListener('click', () => processOptionA());
    document.getElementById('processBtnB').addEventListener('click', () => processOptionB());
    document.getElementById('processBtnC').addEventListener('click', () => processOptionC());
    
    // Set up download handlers
    document.getElementById('downloadBtnA').addEventListener('click', () => downloadFile('A'));
    document.getElementById('downloadBtnB').addEventListener('click', () => downloadFile('B'));
    document.getElementById('downloadBtnC').addEventListener('click', () => downloadFile('C'));
});

// Option selection
function selectOption(option) {
    selectedOption = option;
    
    // Update UI
    document.querySelectorAll('.option-card').forEach(card => {
        card.classList.remove('selected');
    });
    event.target.closest('.option-card').classList.add('selected');
    
    // Show corresponding workflow
    document.querySelectorAll('.workflow-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(`workflow${option}`).classList.add('active');
}

// File upload setup
function setupFileUpload(option) {
    const uploadArea = document.getElementById(`uploadArea${option}`);
    const fileInput = document.getElementById(`fileInput${option}`);
    
    uploadArea.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => handleFileSelect(e, option));
    
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
            handleFile(files[0], option);
        }
    });
}

// File handling
function handleFileSelect(e, option) {
    const file = e.target.files[0];
    if (file) {
        handleFile(file, option);
    }
}

function handleFile(file, option) {
    if (!file.name.endsWith('.csv')) {
        showStatus(option, 'Please upload a CSV file', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            uploadedData[option] = parseCSV(e.target.result);
            showStatus(option, `File loaded: ${uploadedData[option].length - 1} records found`, 'success');
            
            // Enable appropriate button
            if (option === 'A') {
                document.getElementById('convertBtnA').disabled = false;
            } else if (option === 'B') {
                document.getElementById('processBtnB').disabled = false;
            } else if (option === 'C') {
                document.getElementById('processBtnC').disabled = false;
            }
        } catch (err) {
            showStatus(option, 'Error parsing CSV: ' + err.message, 'error');
        }
    };
    reader.readAsText(file);
}

// CSV parsing
function parseCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim());
    const headers = parseCSVLine(lines[0]);
    const data = [headers];
    
    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length === headers.length) {
            data.push(values);
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
        const nextChar = line[i + 1];
        
        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    
    result.push(current);
    return result;
}

// Utility functions
function toProperCase(str) {
    if (!str) return '';
    
    const keepUppercase = ['PO', 'BOX', 'NE', 'NW', 'SE', 'SW', 'DR', 'ST', 'AVE', 'BLVD', 'CT', 'LN', 'RD', 'WAY', 'PL', 'CIR', 'TER', 'APT', 'UNIT'];
    
    return str.split(' ').map(word => {
        if (/^\d+[A-Z]+$/i.test(word)) {
            const match = word.match(/^(\d+)([A-Z]+)$/i);
            return match[1] + match[2].toLowerCase();
        }
        
        if (keepUppercase.includes(word.toUpperCase())) {
            return word.toUpperCase();
        }
        
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }).join(' ');
}

function formatPhone(phone) {
    if (!phone) return '';
    
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length === 10) {
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
        const withoutOne = cleaned.slice(1);
        return `(${withoutOne.slice(0, 3)}) ${withoutOne.slice(3, 6)}-${withoutOne.slice(6)}`;
    }
    
    return phone;
}

function determineIcon(gap, position, rcCareRoles) {
    const hasRCCare = rcCareRoles && rcCareRoles.trim() !== '';
    const posLower = (position || '').toLowerCase();
    
    if (posLower === 'trainee') {
        return 'Trainee';
    } else if (posLower === 'member') {
        return hasRCCare ? 'Member & RC' : 'Member';
    } else if (posLower === 'specialist') {
        return hasRCCare ? 'Specialist & RC' : 'Specialist';
    } else if (posLower === 'lead') {
        return hasRCCare ? 'Lead & RC' : 'Lead';
    } else if (posLower === 'supervisor') {
        return hasRCCare ? 'Supervisor & RC' : 'Supervisor';
    }
    return '';
}

function showStatus(option, message, type) {
    const status = document.getElementById(`status${option}`);
    status.textContent = message;
    status.className = 'status ' + type;
    status.style.display = 'block';
}

function updateProgress(option, percent) {
    const progressBar = document.getElementById(`progressBar${option}`);
    const progressFill = document.getElementById(`progressFill${option}`);
    
    if (progressBar && progressFill) {
        progressBar.style.display = 'block';
        progressFill.style.width = percent + '%';
    }
}

// Option A: Convert pre-geocoded CSV
async function processOptionA() {
    const data = uploadedData['A'];
    if (!data) return;
    
    showStatus('A', 'Converting data...', 'processing');
    
    try {
        const converted = convertGeocodedData(data);
        convertedData['A'] = converted;
        
        // Show statistics
        showStats('A', converted);
        
        showStatus('A', 'Conversion completed successfully!', 'success');
        document.getElementById('downloadBtnA').style.display = 'inline-block';
        
    } catch (err) {
        showStatus('A', 'Error: ' + err.message, 'error');
    }
}

// Option B: Geocode and convert
async function processOptionB() {
    const data = uploadedData['B'];
    if (!data) return;
    
    const apiKey = document.getElementById('apiKeyB').value || DEFAULT_GEOCODIO_KEY;
    
    showStatus('B', 'Starting geocoding process...', 'processing');
    updateProgress('B', 0);
    
    try {
        // First geocode the data
        const geocoded = await geocodeData(data, apiKey, (progress) => {
            updateProgress('B', progress * 0.8); // 80% for geocoding
            showStatus('B', `Geocoding: ${Math.round(progress)}% complete`, 'processing');
        });
        
        // Then convert it
        updateProgress('B', 85);
        showStatus('B', 'Converting geocoded data...', 'processing');
        
        const converted = convertGeocodedData(geocoded);
        convertedData['B'] = converted;
        
        updateProgress('B', 100);
        showStats('B', converted);
        
        showStatus('B', 'Geocoding and conversion completed!', 'success');
        document.getElementById('downloadBtnB').style.display = 'inline-block';
        
    } catch (err) {
        showStatus('B', 'Error: ' + err.message, 'error');
        updateProgress('B', 0);
    }
}

// Option C: Full automation with ArcGIS
async function processOptionC() {
    const data = uploadedData['C'];
    if (!data) return;
    
    const apiKey = document.getElementById('apiKeyC').value || DEFAULT_GEOCODIO_KEY;
    
    showStatus('C', 'Starting full automation process...', 'processing');
    updateProgress('C', 0);
    
    try {
        // Step 1: Get ArcGIS token
        showStatus('C', 'Step 1/4: Authenticating with ArcGIS...', 'processing');
        const arcgisToken = await getArcGISToken();
        updateProgress('C', 10);
        
        // Step 2: Geocode
        showStatus('C', 'Step 2/4: Geocoding addresses...', 'processing');
        const geocoded = await geocodeData(data, apiKey, (progress) => {
            updateProgress('C', 10 + progress * 0.35); // 35% for geocoding
        });
        
        // Step 3: Convert
        updateProgress('C', 50);
        showStatus('C', 'Step 3/4: Converting data format...', 'processing');
        const converted = convertGeocodedData(geocoded);
        convertedData['C'] = converted;
        
        // Step 4: Upload to ArcGIS
        updateProgress('C', 55);
        showStatus('C', 'Step 4/4: Uploading to ArcGIS...', 'processing');
        const featureLayerUrl = 'https://services.arcgis.com/pGfbNJoYypmNq86F/arcgis/rest/services/FloridaDAT2025_Confidential_PI/FeatureServer/0';
        await uploadToArcGIS(converted, featureLayerUrl, arcgisToken, (progress) => {
            updateProgress('C', 55 + progress * 0.45); // 45% for upload
        });
        
        updateProgress('C', 100);
        showStats('C', converted);
        
        showStatus('C', 'Successfully uploaded to ArcGIS feature layer!', 'success');
        document.getElementById('downloadBtnC').style.display = 'inline-block';
        
    } catch (err) {
        showStatus('C', 'Error: ' + err.message, 'error');
        updateProgress('C', 0);
    }
}

// Geocoding function
async function geocodeData(data, apiKey, progressCallback) {
    const headers = data[0];
    const records = data.slice(1);
    const batchSize = 100;
    const geocoded = [createGeocodedHeaders()];
    
    for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        const progress = (i / records.length) * 100;
        progressCallback(progress);
        
        const addresses = batch.map(row => {
            const address = row[headers.indexOf('Address')] || '';
            const city = row[headers.indexOf('City')] || '';
            const zip = row[headers.indexOf('Zip Code')] || row[headers.indexOf('Postal Code')] || '';
            return `${address}, ${city}, FL ${zip}`.trim();
        });
        
        try {
            const response = await fetch(`https://api.geocod.io/v1.7/geocode?api_key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(addresses)
            });
            
            if (!response.ok) throw new Error('Geocoding API error');
            
            const results = await response.json();
            
            // Process each result
            batch.forEach((row, idx) => {
                const geocodeResult = results.results[idx];
                const geocodedRow = createGeocodedRow(row, headers, geocodeResult);
                geocoded.push(geocodedRow);
            });
            
        } catch (err) {
            console.error('Geocoding error:', err);
            // Add rows without geocoding on error
            batch.forEach(row => {
                const geocodedRow = createGeocodedRow(row, headers, null);
                geocoded.push(geocodedRow);
            });
        }
        
        // Small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    progressCallback(100);
    return geocoded;
}

function createGeocodedHeaders() {
    return [
        'Name', 'Address', 'Phone', 'City', 'ST', 'Zip Code', 'GAP', 'Position',
        'Chapter', 'CAC Card', 'RC Care Roles', '1st Resp Case Count', '2nd Resp Case Count',
        'Geocodio Latitude', 'Geocodio Longitude', 'Geocodio Accuracy Score', 'Geocodio Accuracy Type',
        'Geocodio Address Line 1', 'Geocodio Address Line 2', 'Geocodio Address Line 3',
        'Geocodio House Number', 'Geocodio Street', 'Geocodio Unit Type', 'Geocodio Unit Number',
        'Geocodio City', 'Geocodio State', 'Geocodio County', 'Geocodio Postal Code',
        'Geocodio Country', 'Geocodio Source'
    ];
}

function createGeocodedRow(row, headers, geocodeResult) {
    const getValue = (field) => row[headers.indexOf(field)] || '';
    
    let geocodedData = {
        lat: '',
        lng: '',
        accuracy: '',
        accuracyType: '',
        line1: '',
        line2: '',
        line3: '',
        houseNumber: '',
        street: '',
        unitType: '',
        unitNumber: '',
        city: '',
        state: '',
        county: '',
        zip: '',
        country: '',
        source: ''
    };
    
    if (geocodeResult && geocodeResult.results && geocodeResult.results.length > 0) {
        const result = geocodeResult.results[0];
        const addr = result.address_components;
        
        geocodedData = {
            lat: result.location.lat,
            lng: result.location.lng,
            accuracy: result.accuracy,
            accuracyType: result.accuracy_type,
            line1: result.formatted_address.split(',')[0] || '',
            line2: addr.formatted_street || '',
            line3: `${addr.city}, ${addr.state} ${addr.zip}`,
            houseNumber: addr.number || '',
            street: addr.street || '',
            unitType: addr.suffix || '',
            unitNumber: addr.secondaryunit || '',
            city: addr.city || '',
            state: addr.state || '',
            county: addr.county || '',
            zip: addr.zip || '',
            country: addr.country || 'US',
            source: result.source || ''
        };
    }
    
    return [
        getValue('Name'),
        getValue('Address'),
        getValue('Phone'),
        getValue('City'),
        'FL',
        getValue('Zip Code') || getValue('Postal Code'),
        getValue('GAP'),
        getValue('Position'),
        getValue('Chapter'),
        getValue('CAC Card') || getValue('CAC'),
        getValue('RC Care Roles'),
        getValue('1st Resp Case Count'),
        getValue('2nd Resp Case Count'),
        geocodedData.lat,
        geocodedData.lng,
        geocodedData.accuracy,
        geocodedData.accuracyType,
        geocodedData.line1,
        geocodedData.line2,
        geocodedData.line3,
        geocodedData.houseNumber,
        geocodedData.street,
        geocodedData.unitType,
        geocodedData.unitNumber,
        geocodedData.city,
        geocodedData.state,
        geocodedData.county,
        geocodedData.zip,
        geocodedData.country,
        geocodedData.source
    ];
}

// Convert geocoded data to FloridaDAT2025 format
function convertGeocodedData(data) {
    const headers = data[0];
    const headerIndex = {};
    headers.forEach((header, index) => {
        headerIndex[header] = index;
    });
    
    // Output headers for FloridaDAT2025
    const outputHeaders = [
        'Phone', 'Name', 'Address', 'City', 'Postal Code', 'GAP', 'Position',
        'Availability', 'CAC', 'RC Care Roles', 'Geocodio Address Line 1',
        'Geocodio Address Line 2', 'Geocodio Address Line 3', '1st Resp Case Count',
        '2nd Resp Case Count', 'Chapter', 'Supervisor', 'Latitude', 'Longitude',
        'County', 'Region', 'Icon'
    ];
    
    const converted = [outputHeaders];
    
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        
        // Extract county and lookup mapping
        const county = row[headerIndex['Geocodio County']] || '';
        const countyName = county.replace(' County', '').toLowerCase();
        const mapping = chapterRegionMap[countyName] || {};
        
        // Parse Geocodio Address Line 3 for city and zip
        let geocodedCity = '';
        let geocodedPostalCode = '';
        const addressLine3 = row[headerIndex['Geocodio Address Line 3']] || '';
        if (addressLine3) {
            const match = addressLine3.match(/^(.+),\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/);
            if (match) {
                geocodedCity = match[1];
                geocodedPostalCode = match[3];
            }
        }
        
        // Combine address lines
        const line1 = row[headerIndex['Geocodio Address Line 1']] || '';
        const line2 = row[headerIndex['Geocodio Address Line 2']] || '';
        let fullAddress = line1;
        if (line2) {
            fullAddress += ' ' + line2;
        }
        
        // Build output row
        const outputRow = [
            formatPhone(row[headerIndex['Phone']] || ''),
            row[headerIndex['Name']] || '',
            toProperCase(fullAddress || row[headerIndex['Address']] || ''),
            toProperCase(geocodedCity || row[headerIndex['Geocodio City']] || row[headerIndex['City']] || ''),
            geocodedPostalCode || row[headerIndex['Geocodio Postal Code']] || row[headerIndex['Zip Code']] || '',
            row[headerIndex['GAP']] || '',
            row[headerIndex['Position']] || '',
            '', // Availability
            row[headerIndex['CAC Card']] || row[headerIndex['CAC']] || '',
            row[headerIndex['RC Care Roles']] || '',
            row[headerIndex['Geocodio Address Line 1']] || '',
            row[headerIndex['Geocodio Address Line 2']] || '',
            row[headerIndex['Geocodio Address Line 3']] || '',
            row[headerIndex['1st Resp Case Count']] || '',
            row[headerIndex['2nd Resp Case Count']] || '',
            mapping.chapter || row[headerIndex['Chapter']] || '',
            '', // Supervisor
            row[headerIndex['Geocodio Latitude']] || '',
            row[headerIndex['Geocodio Longitude']] || '',
            county,
            mapping.region || '',
            ''
        ];
        
        // Determine icon
        outputRow[21] = determineIcon(outputRow[5], outputRow[6], outputRow[9]);
        
        converted.push(outputRow);
    }
    
    return converted;
}

// Get ArcGIS token using OAuth2
async function getArcGISToken() {
    // Note: In production, these should be stored securely server-side
    const clientId = 'CqQHkyQ2dXBcOvuV';
    const clientSecret = '9e3cd3b3bb374a81aa20c2c83c35e43f';
    
    const tokenUrl = 'https://www.arcgis.com/sharing/rest/oauth2/token';
    const params = new URLSearchParams({
        'client_id': clientId,
        'client_secret': clientSecret,
        'grant_type': 'client_credentials'
    });
    
    try {
        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params
        });
        
        if (!response.ok) {
            throw new Error('Failed to get ArcGIS token');
        }
        
        const data = await response.json();
        if (data.error) {
            throw new Error(data.error.message || 'Authentication failed');
        }
        
        return data.access_token;
    } catch (err) {
        console.error('ArcGIS authentication error:', err);
        throw err;
    }
}

// ArcGIS upload function
async function uploadToArcGIS(data, featureLayerUrl, token, progressCallback) {
    // First, delete existing features
    progressCallback(10);
    
    const deleteUrl = `${featureLayerUrl}/deleteFeatures`;
    const deleteResponse = await fetch(deleteUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `where=1%3D1&token=${token}&f=json`
    });
    
    if (!deleteResponse.ok) {
        throw new Error('Failed to delete existing features');
    }
    
    progressCallback(30);
    
    // Convert data to ArcGIS features
    const features = [];
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        
        // Only add features with valid coordinates
        if (row[17] && row[18]) {
            features.push({
                geometry: {
                    x: parseFloat(row[18]), // Longitude
                    y: parseFloat(row[17])  // Latitude
                },
                attributes: {
                    Phone: row[0],
                    Name: row[1],
                    Address: row[2],
                    City: row[3],
                    PostalCode: row[4],
                    GAP: row[5],
                    Position: row[6],
                    Availability: row[7],
                    CAC: row[8],
                    RCCareRoles: row[9],
                    GeocodioAddressLine1: row[10],
                    GeocodioAddressLine2: row[11],
                    GeocodioAddressLine3: row[12],
                    FirstRespCaseCount: row[13],
                    SecondRespCaseCount: row[14],
                    Chapter: row[15],
                    Supervisor: row[16],
                    Latitude: row[17],
                    Longitude: row[18],
                    County: row[19],
                    Region: row[20],
                    Icon: row[21]
                }
            });
        }
    }
    
    progressCallback(50);
    
    // Add features in batches
    const batchSize = 250;
    for (let i = 0; i < features.length; i += batchSize) {
        const batch = features.slice(i, i + batchSize);
        const progress = 50 + ((i / features.length) * 50);
        progressCallback(progress);
        
        const addUrl = `${featureLayerUrl}/addFeatures`;
        const addResponse = await fetch(addUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `features=${encodeURIComponent(JSON.stringify(batch))}&token=${token}&f=json`
        });
        
        if (!addResponse.ok) {
            throw new Error('Failed to add features to ArcGIS');
        }
        
        const result = await addResponse.json();
        if (result.error) {
            throw new Error(result.error.message || 'ArcGIS error');
        }
    }
    
    progressCallback(100);
}

// Show statistics
function showStats(option, data) {
    const stats = document.getElementById(`stats${option}`);
    
    // Calculate statistics
    const records = data.length - 1;
    const chapters = new Set();
    const regions = new Set();
    
    for (let i = 1; i < data.length; i++) {
        if (data[i][15]) chapters.add(data[i][15]); // Chapter column
        if (data[i][20]) regions.add(data[i][20]); // Region column
    }
    
    stats.innerHTML = `
        <div class="stat-box">
            <div class="stat-number">${records}</div>
            <div class="stat-label">Records Processed</div>
        </div>
        <div class="stat-box">
            <div class="stat-number">${chapters.size}</div>
            <div class="stat-label">Chapters</div>
        </div>
        <div class="stat-box">
            <div class="stat-number">${regions.size}</div>
            <div class="stat-label">Regions</div>
        </div>
    `;
    
    stats.style.display = 'grid';
}

// Download converted file
function downloadFile(option) {
    const data = convertedData[option];
    if (!data) return;
    
    const csv = data.map(row => {
        return row.map(cell => {
            if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
                return '"' + cell.replace(/"/g, '""') + '"';
            }
            return cell;
        }).join(',');
    }).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    a.href = url;
    a.download = `FloridaDAT2025_${option}_${timestamp}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}