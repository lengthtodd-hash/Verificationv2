const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

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

code = code.replace(/let accessCodes = \["108026"\];[^\n]*\n\nlet documents: any\[\] = \[\];/, dataLogic);

fs.writeFileSync('server.ts', code);
