const fs = require('fs');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// Read chapter/region mapping
const chapterRegionMap = {};
const chapterRegionData = fs.readFileSync('NewChapterRegion.csv', 'utf8')
  .split('\n')
  .slice(1) // Skip header
  .filter(row => row.trim())
  .map(row => {
    const cols = row.split(',');
    return {
      county: cols[0]?.trim(),
      newChapter: cols[2]?.trim(),
      newRegion: cols[4]?.trim()
    };
  });

chapterRegionData.forEach(item => {
  if (item.county) {
    chapterRegionMap[item.county.toLowerCase()] = {
      chapter: item.newChapter,
      region: item.newRegion
    };
  }
});

// Define output columns for FloridaDAT2025 format
const outputColumns = [
  { id: 'Phone', title: 'Phone' },
  { id: 'Name', title: 'Name' },
  { id: 'Address', title: 'Address' },
  { id: 'City', title: 'City' },
  { id: 'Postal Code', title: 'Postal Code' },
  { id: 'GAP', title: 'GAP' },
  { id: 'Position', title: 'Position' },
  { id: 'Availability', title: 'Availability' },
  { id: 'CAC', title: 'CAC' },
  { id: 'RC Care Roles', title: 'RC Care Roles' },
  { id: 'Geocodio Address Line 1', title: 'Geocodio Address Line 1' },
  { id: 'Geocodio Address Line 2', title: 'Geocodio Address Line 2' },
  { id: 'Geocodio Address Line 3', title: 'Geocodio Address Line 3' },
  { id: '1st Resp Case Count', title: '1st Resp Case Count' },
  { id: '2nd Resp Case Count', title: '2nd Resp Case Count' },
  { id: 'Chapter', title: 'Chapter' },
  { id: 'Supervisor', title: 'Supervisor' },
  { id: 'Latitude', title: 'Latitude' },
  { id: 'Longitude', title: 'Longitude' },
  { id: 'County', title: 'County' },
  { id: 'Region', title: 'Region' },
  { id: 'Icon', title: 'Icon' }
];

// Function to properly capitalize addresses
function toProperCase(str) {
  if (!str) return '';
  
  // Special cases that should remain uppercase
  const keepUppercase = ['PO', 'BOX', 'NE', 'NW', 'SE', 'SW', 'DR', 'ST', 'AVE', 'BLVD', 'CT', 'LN', 'RD', 'WAY', 'PL', 'CIR', 'TER', 'APT', 'UNIT'];
  
  return str.split(' ').map(word => {
    // Check if it's a number followed by letters (like 9TH, 11TH)
    if (/^\d+[A-Z]+$/i.test(word)) {
      const match = word.match(/^(\d+)([A-Z]+)$/i);
      return match[1] + match[2].toLowerCase();
    }
    
    // Check if word should remain uppercase
    if (keepUppercase.includes(word.toUpperCase())) {
      return word.toUpperCase();
    }
    
    // Otherwise, proper case it
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join(' ');
}

// Function to format phone numbers consistently
function formatPhone(phone) {
  if (!phone) return '';
  
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Check if it's a valid US phone number length
  if (cleaned.length === 10) {
    // Format as (XXX) XXX-XXXX
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
    // Remove leading 1 and format
    const withoutOne = cleaned.slice(1);
    return `(${withoutOne.slice(0, 3)}) ${withoutOne.slice(3, 6)}-${withoutOne.slice(6)}`;
  }
  
  // Return original if not a standard format
  return phone;
}

// Function to determine icon based on GAP and Position
function determineIcon(gap, position, rcCareRoles) {
  const hasGAP = gap && gap.trim() !== '';
  const hasRCCare = rcCareRoles && rcCareRoles.trim() !== '';
  const posLower = position?.toLowerCase() || '';
  
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

// Read and process the geocoded data
const inputFile = 'data82625_geocodio_d97d61e890ec8185c17b8f44ce0d78e6e9dfc898.csv';
const outputFile = 'FloridaDAT2025_converted.csv';
const records = [];

fs.createReadStream(inputFile)
  .pipe(csv())
  .on('data', (row) => {
    // Extract county and lookup chapter/region
    const county = row['Geocodio County'] || '';
    const countyName = county.replace(' County', '').toLowerCase();
    const mapping = chapterRegionMap[countyName] || {};
    
    // Parse Geocodio Address Line 3 for city and postal code
    let geocodedCity = '';
    let geocodedPostalCode = '';
    const addressLine3 = row['Geocodio Address Line 3'] || '';
    if (addressLine3) {
      const match = addressLine3.match(/^(.+),\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/);
      if (match) {
        geocodedCity = match[1];
        geocodedPostalCode = match[3];
      }
    }
    
    // Combine Geocodio Address Lines 1 & 2 for full address
    let fullAddress = '';
    const line1 = row['Geocodio Address Line 1'] || '';
    const line2 = row['Geocodio Address Line 2'] || '';
    if (line1) {
      fullAddress = line1;
      if (line2) {
        fullAddress += ' ' + line2;
      }
    }
    
    // Create output record - prioritize Geocodio data
    const outputRecord = {
      'Phone': formatPhone(row['Phone'] || ''),
      'Name': row['Name'] || '',
      'Address': toProperCase(fullAddress || row['Address'] || ''),
      'City': toProperCase(geocodedCity || row['Geocodio City'] || row['City'] || ''),
      'Postal Code': geocodedPostalCode || row['Geocodio Postal Code'] || row['Zip Code'] || '',
      'GAP': row['GAP'] || '',
      'Position': row['Position'] || '',
      'Availability': '', // Not in source data
      'CAC': row['CAC Card'] || '',
      'RC Care Roles': row['RC Care Roles'] || '',
      'Geocodio Address Line 1': row['Geocodio Address Line 1'] || '',
      'Geocodio Address Line 2': row['Geocodio Address Line 2'] || '',
      'Geocodio Address Line 3': row['Geocodio Address Line 3'] || '',
      '1st Resp Case Count': row['1st Resp Case Count'] || '',
      '2nd Resp Case Count': row['2nd Resp Case Count'] || '',
      'Chapter': mapping.chapter || row['Chapter'] || '',
      'Supervisor': '', // Not in source data
      'Latitude': row['Geocodio Latitude'] || '',
      'Longitude': row['Geocodio Longitude'] || '',
      'County': county,
      'Region': mapping.region || '',
      'Icon': ''
    };
    
    // Determine icon
    outputRecord['Icon'] = determineIcon(
      outputRecord['GAP'],
      outputRecord['Position'],
      outputRecord['RC Care Roles']
    );
    
    records.push(outputRecord);
  })
  .on('end', () => {
    // Write output file
    const csvWriter = createCsvWriter({
      path: outputFile,
      header: outputColumns
    });
    
    csvWriter.writeRecords(records)
      .then(() => {
        console.log(`Conversion complete! Created ${outputFile}`);
        console.log(`Total records processed: ${records.length}`);
      })
      .catch(err => {
        console.error('Error writing output file:', err);
      });
  })
  .on('error', (err) => {
    console.error('Error reading input file:', err);
  });