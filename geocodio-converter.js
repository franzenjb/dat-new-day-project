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

// Global variables
let uploadedData = null;
let convertedData = null;

// DOM elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const convertBtn = document.getElementById('convertBtn');
const downloadBtn = document.getElementById('downloadBtn');
const status = document.getElementById('status');
const fileInfo = document.getElementById('fileInfo');
const fileName = document.getElementById('fileName');
const stats = document.getElementById('stats');

// File upload handling
uploadArea.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', handleFileSelect);

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

// Convert button
convertBtn.addEventListener('click', convertData);

// Download button
downloadBtn.addEventListener('click', downloadConvertedFile);

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        handleFile(file);
    }
}

function handleFile(file) {
    if (!file.name.endsWith('.csv')) {
        showStatus('Please upload a CSV file', 'error');
        return;
    }

    fileName.textContent = file.name;
    fileInfo.style.display = 'block';
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            uploadedData = parseCSV(e.target.result);
            showStatus(`File loaded successfully. ${uploadedData.length - 1} records found.`, 'success');
            convertBtn.disabled = false;
            stats.style.display = 'none';
            downloadBtn.style.display = 'none';
        } catch (err) {
            showStatus('Error parsing CSV file: ' + err.message, 'error');
            convertBtn.disabled = true;
        }
    };
    reader.readAsText(file);
}

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

function convertData() {
    if (!uploadedData) return;
    
    showStatus('Converting data...', 'processing');
    
    try {
        const headers = uploadedData[0];
        const headerIndex = {};
        headers.forEach((header, index) => {
            headerIndex[header] = index;
        });
        
        // Output headers
        const outputHeaders = [
            'Phone', 'Name', 'Address', 'City', 'Postal Code', 'GAP', 'Position',
            'Availability', 'CAC', 'RC Care Roles', 'Geocodio Address Line 1',
            'Geocodio Address Line 2', 'Geocodio Address Line 3', '1st Resp Case Count',
            '2nd Resp Case Count', 'Chapter', 'Supervisor', 'Latitude', 'Longitude',
            'County', 'Region', 'Icon'
        ];
        
        convertedData = [outputHeaders];
        
        const uniqueChapters = new Set();
        const uniqueRegions = new Set();
        
        for (let i = 1; i < uploadedData.length; i++) {
            const row = uploadedData[i];
            
            // Extract data
            const county = row[headerIndex['Geocodio County']] || '';
            const countyName = county.replace(' County', '').toLowerCase();
            const mapping = chapterRegionMap[countyName] || {};
            
            // Parse Geocodio Address Line 3
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
                row[headerIndex['CAC Card']] || '',
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
            
            // Track unique chapters and regions
            if (outputRow[15]) uniqueChapters.add(outputRow[15]);
            if (outputRow[20]) uniqueRegions.add(outputRow[20]);
            
            convertedData.push(outputRow);
        }
        
        // Update statistics
        document.getElementById('recordCount').textContent = convertedData.length - 1;
        document.getElementById('chapterCount').textContent = uniqueChapters.size;
        document.getElementById('regionCount').textContent = uniqueRegions.size;
        stats.style.display = 'grid';
        
        showStatus('Conversion completed successfully!', 'success');
        downloadBtn.style.display = 'inline-block';
        
    } catch (err) {
        showStatus('Error converting data: ' + err.message, 'error');
    }
}

function downloadConvertedFile() {
    if (!convertedData) return;
    
    const csv = convertedData.map(row => {
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
    a.download = `FloridaDAT2025_${timestamp}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function showStatus(message, type) {
    status.textContent = message;
    status.className = 'status ' + type;
    status.style.display = 'block';
}