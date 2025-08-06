/* 
  1. npm install xlsx
  2. create .xlsx file: 'src/database/filename.excel'
  3. run: node src/javascript/convert-excel-to-js.js 
*/

import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx/xlsx.mjs';
import { fileURLToPath } from 'url';

// ESM fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Required by XLSX in ESM for file system
XLSX.set_fs(fs);

// Paths
const inputPath = path.resolve(process.cwd(), 'src/database/datasetExcel.xlsx');
const outputPath = path.resolve(process.cwd(), 'src/database/datasetExcel.js');

// Generate unique random ID
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

// Read workbook
const workbook = XLSX.readFile(inputPath);

// Get first sheet
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Convert to JSON
const rawData = XLSX.utils.sheet_to_json(worksheet);

// ✅ Filter invalid rows (require name, gender, category)
const filtered = rawData.filter(row =>
  row.name && row.gender && row.category
);

// ✅ Sort alphabetically by name
const sorted = filtered.sort((a, b) =>
  a.name.localeCompare(b.name)
);

// ✅ Add unique ID to each row
const dataset = sorted.map(item => ({
  id: generateUniqueId(),
  ...item
}));

// Write JS file with named export
const jsContent = `export const dataset = ${JSON.stringify(dataset, null, 2)};`;
fs.writeFileSync(outputPath, jsContent, 'utf8');

console.log(`✅ datasetExcel.js created with ${dataset.length} valid records from sheet: ${sheetName}`);
