const fs = require('fs');
let code = fs.readFileSync('src/components/EmployeeDashboard.tsx', 'utf8');

const returnStr = `  if (uploadSuccess) {
    return (
      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col items-center justify-center p-12 py-32 text-center h-[calc(100vh-12rem)] min-h-[400px]">
        <div className="bg-[#0B1511] text-white rounded-full p-4 mb-6">
          <CheckCircle className="h-10 w-10" />
        </div>
        <h2 className="text-3xl font-light mb-4 text-gray-900">Upload Complete</h2>
        <p className="text-gray-500 font-light leading-relaxed max-w-sm text-sm">
          Your documents have been securely transmitted to Airva Green Logistics. You will be securely logged out momentarily...
        </p>
      </div>
    );
  }

  return (`

code = code.replace("  return (", returnStr);

// Also remove the old uploadSuccess message if it exists
code = code.replace(
  /{uploadSuccess && \([\s\S]*?\)}/g,
  ""
);

fs.writeFileSync('src/components/EmployeeDashboard.tsx', code);
