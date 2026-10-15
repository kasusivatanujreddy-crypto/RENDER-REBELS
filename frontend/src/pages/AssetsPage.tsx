import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FolderOpen, Upload, ScanEye, FileImage, Hash, Calendar } from "lucide-react";
import { api } from "../lib/api-client";

export const AssetsPage: React.FC = () => {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const fetchAssets = () => {
    api
      .getAssets()
      .then((res) => {
        setAssets(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load assets:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsUploading(true);
      try {
        await api.uploadAsset(e.target.files[0]);
        fetchAssets();
      } catch (err: any) {
        alert(`Upload failed: ${err.message}`);
      } finally {
        setIsUploading(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <FolderOpen className="w-6 h-6 text-brand-400" />
            <span>Visual Asset Library</span>
          </h1>
          <p className="text-sm text-slate-400">
            Immutable image assets, SHA-256 integrity signatures, and reference inspection material.
          </p>
        </div>

        <label className="flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-lg shadow-brand-600/25 transition-all cursor-pointer self-start md:self-auto">
          {isUploading ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Uploading...</span>
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              <span>Upload Asset</span>
            </>
          )}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleUpload}
            className="hidden"
          />
        </label>
      </div>

      {/* Asset Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {loading ? (
          <div className="col-span-4 py-12 text-center text-slate-500">
            <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <span>Loading visual assets...</span>
          </div>
        ) : assets.length > 0 ? (
          assets.map((asset) => {
            const assetUrl = asset.access_url || `/api/v1/assets/raw/${asset.storage_path}`;
            return (
              <div
                key={asset.id}
                className="group rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-lg hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div className="relative aspect-video bg-slate-950 flex items-center justify-center overflow-hidden border-b border-slate-800">
                  <img
                    src={assetUrl}
                    alt={asset.original_filename}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-900/80 backdrop-blur-md text-slate-300 border border-slate-700">
                    {asset.mime_type.split("/")[1]}
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  <h3 className="text-xs font-semibold text-white truncate" title={asset.original_filename}>
                    {asset.original_filename}
                  </h3>

                  <div className="space-y-1 text-[11px] text-slate-400">
                    <div className="flex items-center space-x-1.5 truncate">
                      <Hash className="w-3 h-3 text-slate-500 shrink-0" />
                      <span className="font-mono truncate">{asset.sha256_hash?.slice(0, 16)}...</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <Calendar className="w-3 h-3 text-slate-500 shrink-0" />
                      <span>{new Date(asset.created_at).toLocaleDateString()}</span>
                      <span className="text-slate-600">•</span>
                      <span>{Math.round(asset.size_bytes / 1024)} KB</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800">
                    <Link
                      to={`/app/inspections/new`}
                      className="w-full py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-brand-400 text-xs font-medium flex items-center justify-center space-x-1.5 transition-colors"
                    >
                      <ScanEye className="w-3.5 h-3.5" />
                      <span>Inspect This Asset</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-4 py-16 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-500 text-xs space-y-2">
            <FileImage className="w-8 h-8 mx-auto text-slate-600" />
            <p className="font-semibold text-slate-300">No visual assets uploaded yet</p>
            <p className="text-slate-500">Upload sample part photos or captures to build your inspection repository.</p>
          </div>
        )}
      </div>
    </div>
  );
};
