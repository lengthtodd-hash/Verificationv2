const fs = require('fs');
let code = fs.readFileSync('src/components/EmployeeDashboard.tsx', 'utf8');

// Add logout to useAuth extraction
code = code.replace(
  "const { token } = useAuth();",
  "const { token, logout } = useAuth();"
);

// Replace setTimeout logic
code = code.replace(
  "setTimeout(() => setUploadSuccess(false), 5000);",
  "setTimeout(() => { setUploadSuccess(false); logout(); }, 4000);"
);

fs.writeFileSync('src/components/EmployeeDashboard.tsx', code);
