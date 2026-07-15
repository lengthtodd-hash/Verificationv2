const fs = require('fs');
let code = fs.readFileSync('src/components/EmployeeDashboard.tsx', 'utf8');

// Replace uploadFile with files map
code = code.replace(
  "const [uploadFile, setUploadFile] = useState<File | null>(null);",
  "const [files, setFiles] = useState<{ [key: string]: File | null }>({});"
);

// Remove handleFileChange
code = code.replace(
  /const handleFileChange = \(e: React.ChangeEvent<HTMLInputElement>\) => {[\s\S]*?};/,
  "const handleFileChange = (id: string, file: File | null) => { setFiles(prev => ({ ...prev, [id]: file })); };"
);

// replace ref
code = code.replace(
  "const fileInputRef = useRef<HTMLInputElement>(null);",
  ""
);

fs.writeFileSync('src/components/EmployeeDashboard.tsx', code);
