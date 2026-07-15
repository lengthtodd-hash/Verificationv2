import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { KeyRound, Plus, Users, Globe, Clock, Loader2, MapPin, Hash, Phone, Map } from 'lucide-react';
import { api } from '../lib/apiClient';

export function AdminDashboard() {
  const { token } = useAuth();
  
  const [documents, setDocuments] = useState<any[]>([]);
  const [accessCodes, setAccessCodes] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generatingCode, setGeneratingCode] = useState(false);

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [docsData, codesData] = await Promise.all([
        api.getAdminDocuments(),
        api.getAccessCodes()
      ]);

      setDocuments(docsData.sort((a: any, b: any) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()));
      setAccessCodes(codesData.codes.reverse());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateAccessCode = async () => {
    try {
      setGeneratingCode(true);
      const data = await api.generateAccessCode();
      setAccessCodes(prev => [data.code, ...prev]);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setGeneratingCode(false);
    }
  };

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 text-indigo-500 animate-spin" /></div>;
  }

  if (error) {
    return <div className="text-red-500 p-4 bg-red-50 rounded-md border border-red-200 m-6">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Admin Console
          </h2>
          <p className="mt-1 text-sm text-gray-500">Monitor access codes and view basic submission information.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Statistics and Access Codes */}
        <div className="lg:col-span-1 space-y-6">
          {/* Stats Card */}
          <div className="bg-white shadow sm:rounded-lg border border-gray-200 overflow-hidden p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-indigo-100 text-indigo-600">
                <Users className="h-8 w-8" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500 truncate">Total Submissions</p>
                <div className="mt-1 text-3xl font-semibold text-gray-900">{documents.length}</div>
              </div>
            </div>
          </div>

          {/* Access Codes Card */}
          <div className="bg-white shadow sm:rounded-lg border border-gray-200 overflow-hidden flex flex-col h-96">
            <div className="px-4 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900 flex items-center">
                <KeyRound className="h-4 w-4 mr-2 text-indigo-600" />
                Employee Access Codes
              </h3>
              <button
                onClick={generateAccessCode}
                disabled={generatingCode}
                className="inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              {accessCodes.length === 0 ? (
                <p className="text-sm text-gray-500 text-center mt-4">No codes generated.</p>
              ) : (
                <ul className="space-y-2">
                  {accessCodes.map(code => (
                    <li key={code} className="text-sm font-mono bg-white px-3 py-2 border border-gray-200 rounded-md shadow-sm text-center flex justify-between items-center">
                      <span>{code}</span>
                      <button 
                        onClick={() => navigator.clipboard.writeText(code)}
                        className="text-indigo-600 hover:text-indigo-800 text-xs font-sans font-medium"
                      >
                        Copy
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Submissions List */}
        <div className="lg:col-span-2 bg-white shadow sm:rounded-lg border border-gray-200 overflow-hidden flex flex-col h-[calc(100vh-10rem)]">
          <div className="px-4 py-5 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Submissions</h3>
            <p className="mt-1 text-sm text-gray-500">Basic contact and location details associated with submissions.</p>
          </div>
          <div className="flex-1 overflow-y-auto p-0">
            {documents.length === 0 ? (
              <p className="text-sm text-gray-500 p-6 text-center">No submissions received yet.</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {documents.map((doc) => (
                  <li key={doc.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-gray-100 border border-gray-300">
                          <span className="text-sm font-medium leading-none text-gray-500">
                            {doc.fullName ? doc.fullName.charAt(0).toUpperCase() : '?'}
                          </span>
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-gray-900">{doc.fullName || 'Unknown Name'}</h4>
                          <p className="text-xs text-gray-500 flex items-center mt-1">
                            <Hash className="h-3 w-3 mr-1" />
                            {doc.title}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-medium text-gray-900 flex items-center justify-end">
                          <Clock className="h-3 w-3 mr-1 text-gray-400" />
                          {new Date(doc.submittedAt).toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center justify-end mt-1">
                          <Globe className="h-3 w-3 mr-1 text-gray-400" />
                          IP: {doc.ipAddress || 'Unknown'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                      <div className="flex items-start">
                        <Phone className="h-4 w-4 text-gray-400 mt-0.5 mr-2" />
                        <div>
                          <span className="block text-[10px] font-bold tracking-wider text-gray-500 uppercase">Phone Number</span>
                          <span className="text-sm text-gray-900">{doc.phoneNumber || 'N/A'}</span>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <MapPin className="h-4 w-4 text-gray-400 mt-0.5 mr-2" />
                        <div>
                          <span className="block text-[10px] font-bold tracking-wider text-gray-500 uppercase">Street Address</span>
                          <span className="text-sm text-gray-900">{doc.streetAddress || 'N/A'}</span>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <Map className="h-4 w-4 text-gray-400 mt-0.5 mr-2" />
                        <div>
                          <span className="block text-[10px] font-bold tracking-wider text-gray-500 uppercase">ZIP Code</span>
                          <span className="text-sm text-gray-900">{doc.zipCode || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
