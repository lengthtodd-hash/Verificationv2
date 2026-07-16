import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { FileText, Loader2, CheckCircle } from 'lucide-react';
import { api } from '../lib/apiClient';
import { compressImage } from '../lib/imageCompressor';

export function EmployeeDashboard() {
  const { user, logout } = useAuth();
  
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [zipCode, setZipCode] = useState('');
  
  const [files, setFiles] = useState<{ [key: string]: File | null }>({});
  
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleFileChange = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFiles(prev => ({ ...prev, [id]: e.target.files![0] }));
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const fileEntries = Object.entries(files).filter(([_, file]) => file !== null);
    if (fileEntries.length === 0) {
      setUploadError('Please select at least one document.');
      return;
    }

    setUploading(true);
    setUploadError('');
    setUploadSuccess(false);

    try {
      const uploadPromises = fileEntries.map(async ([id, file]) => {
        let title = id;
        if (id === 'driversLicense') title = "Driver's License";
        else if (id === 'passport') title = "Passport";
        else if (id === 'ssn') title = "Social Security Card";
        else if (id === 'selfie') title = "Selfie";
        else if (id === 'i9') title = "Form I-9";
        else if (id === 'w4') title = "Form W-4";
        else if (id === 'stateTax') title = "State Tax Form";

        try {
          const base64String = await compressImage(file as File);
          const res = await api.submitDocument({
            title,
            fullName,
            phoneNumber,
            streetAddress,
            zipCode,
            fileUrl: base64String
          }, user);
          if (!res.success) {
            throw new Error(`Upload failed for ${title}`);
          }
        } catch (err: any) {
          throw new Error(err.message || `Upload failed for ${title}`);
        }
      });

      await Promise.all(uploadPromises);

      setFullName('');
      setPhoneNumber('');
      setStreetAddress('');
      setZipCode('');
      setFiles({});
      setUploadSuccess(true);
      
      setTimeout(() => { setUploadSuccess(false); logout(); }, 5000);
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const FileUploader = ({ id, label }: { id: string, label: string }) => {
    const file = files[id];
    

  return (
      <div className="pt-2">
        <label className={`block border border-dashed border-gray-200 rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors ${file ? 'bg-gray-50 border-gray-400' : ''}`}>
          <input 
            type="file" 
            className="hidden" 
            accept="image/*,.pdf"
            onChange={(e) => handleFileChange(id, e)}
          />
          <FileText className="h-5 w-5 text-gray-400 mb-3" strokeWidth={1.5} />
          <span className="text-[10px] font-bold tracking-wider text-gray-800 mb-1 uppercase text-center">{file ? file.name : label}</span>
          <span className="text-[10px] text-gray-400 font-light">{file ? "Tap to change file" : "Tap to select or take photo"}</span>
        </label>
      </div>
    );
  };

  if (uploadSuccess) {
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

  return (
    <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col">
      {/* Dark Header */}
      <div className="bg-[#0B1511] px-8 pt-12 pb-12 rounded-t-3xl text-white">
        <div className="flex items-center mb-4">
          <div className="w-6 h-[1px] bg-emerald-500 mr-3"></div>
          <span className="text-[10px] font-bold tracking-[0.2em] text-gray-300">DOCUMENT UPLOAD</span>
        </div>
        <h2 className="text-4xl font-light mb-4">Secure Portal</h2>
        <p className="text-gray-400 font-light leading-relaxed max-w-lg text-sm">
          Please provide your details and attach the requested documents below for verification.
        </p>
      </div>

      {/* Form Section */}
      <div className="p-8 md:p-12">
        <form onSubmit={handleUpload} className="space-y-10">
          
          <div>
            <label className="block text-[10px] font-bold tracking-wider text-gray-500 mb-2">FULL NAME</label>
            <input 
              type="text" 
              required
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="w-full border-0 border-b border-gray-200 focus:border-black focus:ring-0 bg-transparent px-0 py-2 text-sm font-medium outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold tracking-wider text-gray-500 mb-2">PHONE NUMBER</label>
            <input 
              type="tel" 
              inputMode="numeric" 
              pattern="[0-9]*"
              required
              value={phoneNumber}
              onChange={e => setPhoneNumber(e.target.value)}
              className="w-full border-0 border-b border-gray-200 focus:border-black focus:ring-0 bg-transparent px-0 py-2 text-sm font-medium outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold tracking-wider text-gray-500 mb-2">STREET ADDRESS</label>
            <input 
              type="text" 
              required
              value={streetAddress}
              onChange={e => setStreetAddress(e.target.value)}
              className="w-full border-0 border-b border-gray-200 focus:border-black focus:ring-0 bg-transparent px-0 py-2 text-sm font-medium outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold tracking-wider text-gray-500 mb-2">ZIP / POSTAL CODE</label>
            <input 
              type="text" 
              inputMode="numeric" 
              pattern="[0-9]*"
              required
              value={zipCode}
              onChange={e => setZipCode(e.target.value)}
              className="w-full border-0 border-b border-gray-200 focus:border-black focus:ring-0 bg-transparent px-0 py-2 text-sm font-medium outline-none transition-colors"
            />
          </div>

          <div className="space-y-4 pt-4">
            <FileUploader id="driversLicense" label="DRIVER'S LICENSE" />
            <FileUploader id="passport" label="PASSPORT" />
            <FileUploader id="ssn" label="SOCIAL SECURITY CARD" />
            <FileUploader id="selfie" label="SELFIE (FOR VERIFICATION)" />
          </div>

          <div className="pt-8">
            <div className="flex items-center mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-black mr-3"></div>
              <span className="text-[10px] font-bold tracking-[0.2em] text-gray-700 uppercase">MANDATORY LEGAL FORMS</span>
            </div>
            
            <div className="space-y-4">
              <FileUploader id="i9" label="FORM I-9 (WORK AUTH)" />
              <FileUploader id="w4" label="FORM W-4 (FEDERAL TAX)" />
              <FileUploader id="stateTax" label="STATE TAX FORMS" />
            </div>
          </div>

          {uploadError && <p className="text-sm text-red-500 text-center">{uploadError}</p>}
          
          

          <div className="pt-6">
            <button
              type="submit"
              disabled={uploading}
              className="w-full flex justify-center items-center py-4 px-4 border border-black rounded-full text-[11px] tracking-wider font-bold text-black bg-white hover:bg-gray-50 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase"
            >
              {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'SECURE UPLOAD'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
