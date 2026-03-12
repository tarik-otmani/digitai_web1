import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, File, X } from 'lucide-react';
import clsx from 'clsx';
import { postCoursesUpload } from '../api';
import QuotaModal from '../components/QuotaModal';

const ACCEPT = '.pdf,.docx,.doc,.txt,.md';
const MAX_SIZE = 25 * 1024 * 1024; // 25MB

interface QuotaInfo { used: number; limit: number; planName: string }

export default function UploadCourse() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [quotaInfo, setQuotaInfo] = useState<QuotaInfo | null>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const addFiles = (newFiles: File[]) => {
    const valid = newFiles.filter((f) => {
      const ext = f.name.split('.').pop()?.toLowerCase();
      if (!['pdf', 'docx', 'doc', 'txt', 'md'].includes(ext || '')) return false;
      if (f.size > MAX_SIZE) return false;
      return true;
    });
    setFiles((prev) => {
      const combined = [...prev, ...valid];
      return combined.slice(0, 5);
    });
    setError('');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(Array.from(e.target.files));
    e.target.value = '';
  };

  const handleUpload = async () => {
    const file = files[0];
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      const res = await postCoursesUpload(file, title.trim() || undefined);
      navigate(`/course/${res.recordid}`);
    } catch (err: unknown) {
      const e = err as Error & { apiData?: { used?: number; limit?: number; planName?: string } };
      if (e.message === 'QUOTA_EXCEEDED') {
        setQuotaInfo({
          used: e.apiData?.used ?? 0,
          limit: e.apiData?.limit ?? 0,
          planName: e.apiData?.planName ?? '',
        });
        return;
      }
      setError(e.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
    {quotaInfo && (
      <QuotaModal
        used={quotaInfo.used}
        limit={quotaInfo.limit}
        planName={quotaInfo.planName}
        onClose={() => setQuotaInfo(null)}
      />
    )}
    <div className="max-w-3xl mx-auto">
      <Link to="/dashboard" className="flex items-center text-gray-500 hover:text-gray-900 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
      </Link>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Upload Course Material</h1>
            <p className="text-sm text-slate-500 mt-0.5">AI will structure your document into sections with learning objectives. You can edit or regenerate any section.</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm">{error}</div>
        )}

        <div
          className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center hover:border-indigo-400 hover:bg-gray-50 transition-all cursor-pointer"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Upload className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Drag & Drop files here</h3>
          <p className="text-gray-500 mt-1">or click to browse (PDF, DOCX, TXT, MD — max 25MB)</p>
        </div>

        {files.length > 0 && (
          <div className="mt-6 space-y-3">
            <label className="block text-sm font-medium text-gray-700">Title (optional)</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Course title (default: filename)"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none mb-4"
            />
            <h4 className="text-sm font-medium text-gray-700">Selected file(s) — first file will be uploaded</h4>
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100"
              >
                <div className="flex items-center gap-3">
                  <File className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setFiles(files.filter((_, i) => i !== index));
                  }}
                  className="text-gray-400 hover:text-red-500 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <p className="text-sm text-slate-500 mt-6">
          Requires API key (Settings). Estimated: ~30–90 seconds depending on document length.
        </p>
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleUpload}
            disabled={files.length === 0 || uploading}
            className={clsx(
              'px-8 py-3 rounded-xl font-semibold text-white shadow-lg transition-all flex items-center gap-2',
              files.length === 0 || uploading ? 'bg-gray-300 cursor-not-allowed shadow-none' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
            )}
          >
            {uploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Uploading & structuring...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload & open course
              </>
            )}
          </button>
        </div>
      </div>
    </div>
    </>
  );
}
