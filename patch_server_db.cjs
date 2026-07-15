const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// 1. Add fs import
if (!code.includes('import fs from "fs";')) {
  code = code.replace('import express from "express";', 'import fs from "fs";\nimport express from "express";');
}

// 2. Add data persistence logic
const dataLogic = `
const DATA_FILE = path.join(process.cwd(), "data.json");

let accessCodes = ["108026"]; // Initially one 6-digit code for demo
let documents: any[] = [];

function loadData() {
  if (fs.existsSync(DATA_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
      if (data.accessCodes) accessCodes = data.accessCodes;
      if (data.documents) documents = data.documents;
    } catch (e) {
      console.error("Error loading data", e);
    }
  } else {
    saveData();
  }
}

function saveData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ accessCodes, documents }));
  } catch (e) {
    console.error("Error saving data", e);
  }
}

loadData(); // Load on startup
`;

// Replace the memory variables with the new logic
const oldVars = `let accessCodes = ["108026"]; // Initially one 6-digit code for demo
let documents: any[] = [];`;

if (code.includes(oldVars)) {
  code = code.replace(oldVars, dataLogic);
}

// 3. Add saveData() to modifications
// Document submission
code = code.replace(
  `documents.push(newDoc);`,
  `documents.push(newDoc);\n  saveData();`
);

// Document status update
code = code.replace(
  `doc.status = status;
  res.json({ success: true, doc });`,
  `doc.status = status;\n  saveData();\n  res.json({ success: true, doc });`
);

// Access code generation
code = code.replace(
  `accessCodes.push(newCode);
  res.status(201).json({ code: newCode });`,
  `accessCodes.push(newCode);\n  saveData();\n  res.status(201).json({ code: newCode });`
);

fs.writeFileSync('server.ts', code);
