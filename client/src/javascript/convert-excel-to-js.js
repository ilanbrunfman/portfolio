/* 
  1. npm install xlsx
  2. create .xlsx file: 'src/database/filename.excel'
  3. run node src/javascript/convert-excel-to-js.js 
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

// Read workbook
const workbook = XLSX.readFile(inputPath);

// Get first sheet name
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Convert to JSON
const jsonData = XLSX.utils.sheet_to_json(worksheet);

// Save as JS file (named export)
const jsContent = `export const dataset = ${JSON.stringify(jsonData, null, 2)};`;
fs.writeFileSync(outputPath, jsContent, 'utf8');

console.log(`✅ dataset.js created with ${jsonData.length} records from ${sheetName}`);