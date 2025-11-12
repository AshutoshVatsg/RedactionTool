import React, { useState, useCallback, useMemo } from 'react';

// You will need to install 'react-dropzone' for this to work
// npm install react-dropzone
import { useDropzone } from 'react-dropzone';

// --- Configuration ---
// This list MUST match the categories your backend 'engine.py' expects
const REDACTION_CATEGORIES = [
  { id: 'PERSON', label: 'Names' },
  { id: 'ADDRESS', label: 'Addresses (Org, Location, GPE)' },
  { id: 'DATE', label: 'Dates of Birth (DOB)' },
  { id: 'PHONE', label: 'Phone Numbers' },
  { id: 'EMAIL', label: 'Email Addresses' },
  { id: 'NRIC/FIN', label: 'NRIC/FIN Numbers' },
  { id: 'MCR no.', label: 'MCR Numbers' },
  { id: 'ID_NUMBER', label: 'Other IDs (Med. Number, IHI)' },
];

// Your backend API endpoint
const API_ENDPOINT = 'http://127.0.0.1:5000/redact';

// --- Main App Component ---
export default function App() {
  const [file, setFile] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState(
    new Set(REDACTION_CATEGORIES.map((c) => c.id))
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- File Drop Handler ---
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setError(null);
    }
  }, []);

  // --- Checkbox Handler ---
  const handleCheckboxChange = (id) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // --- Form Submission Handler ---
  const handleSubmit = async () => {
    if (!file) {
      setError('Please select a file to redact.');
      return;
    }
    if (selectedCategories.size === 0) {
      setError('Please select at least one category to redact.');
      return;
    }

    setIsLoading(true);
    setError(null);

    // --- File Renaming Logic ---
    // As requested, we rename the file before sending.
    const fileExtension = file.name.split('.').pop().toLowerCase();
    let targetFilename = file.name; // Default

    if (fileExtension === 'pdf') {
      targetFilename = 'test.pdf';
    } else if (fileExtension === 'docx') {
      targetFilename = 'test.docx';
    }
    // All other types (txt, png, jpg) will keep their original name

    // Create a new File object with the renamed file
    const renamedFile = new File([file], targetFilename, { type: file.type });
    // ----------------------------

    // 1. Prepare the form data
    const formData = new FormData();
    formData.append('file', renamedFile);
    formData.append(
      'categories',
      JSON.stringify(Array.from(selectedCategories))
    );

    try {
      // 2. Call your backend API
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      // 3. Handle the file download
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', 'REDACTED_OUTPUT.pdf');
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      setFile(null); // Clear the file input

    } catch (err) {
      console.error('Redaction failed:', err);
      setError(
        'Redaction failed. Is the backend `api.py` server running?'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // --- Dropzone Setup ---
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
        '.docx',
      ],
      'text/plain': ['.txt'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
    },
    maxFiles: 1,
  });

  // --- Dynamic Dropzone Styling ---
  const dropzoneStyle = useMemo(() => {
    const base = 'border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors duration-200';
    if (isDragActive) {
      return `${base} border-blue-500 bg-blue-50 text-blue-700`;
    }
    if (file) {
      return `${base} border-green-500 bg-green-50 text-green-700`;
    }
    return `${base} border-gray-300 hover:border-gray-500 text-gray-500`;
  }, [isDragActive, file]);

  return (
    // Assumes Tailwind CSS is available in your project
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-xl p-8 space-y-6">
        <h1 className="text-3xl font-bold text-center text-gray-800">
          Document Redaction Tool
        </h1>

        {/* --- 1. File Upload --- */}
        <div {...getRootProps()} className={dropzoneStyle}>
          <input {...getInputProps()} />
          {file ? (
            <p className="font-medium">File selected: {file.name}</p>
          ) : isDragActive ? (
            <p>Drop the file here ...</p>
          ) : (
            <p>Drag 'n' drop a file, or click to select</p>
          )}
          <p className="text-xs mt-1">.pdf, .docx, .txt, .png, .jpg</p>
        </div>

        {/* --- 2. Category Selection --- */}
        <div>
          <h2 className="text-lg font-semibold text-gray-700 mb-3">
            Categories to Redact
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {REDACTION_CATEGORIES.map((cat) => (
              <label
                key={cat.id}
                className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500"
                  checked={selectedCategories.has(cat.id)}
                  onChange={() => handleCheckboxChange(cat.id)}
                />
                <span className="text-sm text-gray-600">{cat.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* --- 3. Submit Button & Status --- */}
        <div className="space-y-4">
          <button
            onClick={handleSubmit}
            disabled={isLoading || !file}
            className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg
                       hover:bg-blue-700 focus:outline-none focus:ring-2
                       focus:ring-blue-500 focus:ring-opacity-50
                       disabled:bg-gray-400 disabled:cursor-not-allowed
                       flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : null}
            <span>{isLoading ? 'Redacting...' : 'Redact and Download'}</span>
          </button>
          
          {error && (
            <div className="text-center text-red-600 font-medium p-3 bg-red-50 rounded-lg">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}