/* 
  1. npm install csv-parser
  2. create .csv file: 'src/database/filename.csv'
  3. run: node src/javascript/convert-csv-to-js.js 
*/

import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';

// Paths
const inputPath = path.join(process.cwd(), 'src/database/dataset.csv');
const outputPath = path.join(process.cwd(), 'src/database/dataset.js');


// ID tracking set
const generatedIds = new Set();

function generateUniqueId() {
  let id;
  let attempts = 0;

  do {
    id = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    attempts++;
    if (attempts > 10000) throw new Error('⚠️ Could not generate a unique ID');
  } while (generatedIds.has(id));

  generatedIds.add(id);
  return id;
}

// Read and parse CSV
const results = [];

fs.createReadStream(inputPath)
  .pipe(csv())
  .on('data', (data) => results.push(data))
  .on('end', () => {
    // ✅ Filter out invalid rows
    const filtered = results.filter(row =>
      row.name && row.gender && row.category
    );

    // ✅ Sort alphabetically by name
    const sorted = filtered.sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    // ✅ Add unique random ID to each item
    const dataset = sorted.map(item => ({
      id: generateUniqueId(),
      ...item
    }));
    
    const jsContent = `export const dataset = ${JSON.stringify(dataset, null, 2)};`;
    fs.writeFileSync(outputPath, jsContent, 'utf8');
    console.log('✅ dataset.js created with', results.length, 'records');
  });