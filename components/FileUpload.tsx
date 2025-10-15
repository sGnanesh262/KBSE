import React, { useCallback, useState } from 'react';
import { UploadIcon } from './icons/UploadIcon';

interface FileUploadProps {
  onFileUpload: (files: FileList) => void;
  disabled: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (!disabled && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileUpload(e.dataTransfer.files);
    }
  }, [disabled, onFileUpload]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileUpload(e.target.files);
    }
  };

  const dragDropClasses = isDragging
    ? 'border-cyan-400 bg-cyan-900/30'
    : 'border-slate-600 hover:border-cyan-500 hover:bg-slate-700/50';

  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';

  return (
    <div className="mb-4">
      <label
        htmlFor="file-upload"
        className={`flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-lg transition-colors duration-200 ${dragDropClasses} ${disabledClasses}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <UploadIcon className="w-8 h-8 mb-2 text-slate-400" />
        <p className="mb-1 text-sm text-slate-400 text-center">
            <span className="font-semibold text-cyan-400">Click to upload</span> or drag and drop
        </p>
        <p className="text-xs text-slate-500">.txt or .pdf files</p>
        <input 
            id="file-upload" 
            type="file" 
            className="hidden" 
            multiple 
            accept=".txt,.pdf,application/pdf" 
            onChange={handleFileChange} 
            disabled={disabled}
        />
      </label>
    </div>
  );
};

export default FileUpload;