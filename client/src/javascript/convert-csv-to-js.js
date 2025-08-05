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

// Read and parse CSV
const results = [];

fs.createReadStream(inputPath)
  .pipe(csv())
  .on('data', (data) => results.push(data))
  .on('end', () => {
    const jsContent = `export const dataset = ${JSON.stringify(results, null, 2)};`;
    fs.writeFileSync(outputPath, jsContent, 'utf8');
    console.log('✅ dataset.js created with', results.length, 'records');
  });