import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Upload,
  ScanEye,
  SlidersHorizontal,
  ArrowLeft,
  CheckCircle2,
  FileImage,
  AlertCircle,
  Camera,
} from "lucide-react";
import { api } from "../lib/api-client";

export const NewInspectionPage: React.FC = () => {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [existingAssets, setExistingAssets] = useState<any[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [name, setName] = useState<string>(`Inspection-${new Date().toISOString().slice(0, 10)}`);
  const [objective, setObjective] = useState<string>("");
  const [priority, setPriority] = useState<string>("normal");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [selectedAssetId, setSelectedAssetId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.getProfiles(), api.getAssets()])
      .then(([p, a]) => {
        setProfiles(p);
        if (p.length > 0) {
          setSelectedProfileId(p[0].id);
          setObjective(p[0].inspection_objective || "");
        }
        setExistingAssets(a);
      })
      .catch(console.error);
  }, []);

  const handleProfileChange = (profileId: string) => {
    setSelectedProfileId(profileId);
    const found = profiles.find((p) => p.id === profileId);
    if (found) {
      setObjective(found.inspection_objective || "");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setSelectedAssetId("");
      const reader = new FileReader();
      reader.onload = () => setFilePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      let assetIdToUse = selectedAssetId;

      // Upload file first if new file selected
      if (selectedFile) {
        const uploaded = await api.uploadAsset(selectedFile);
        assetIdToUse = uploaded.id;
      }

      if (!assetIdToUse) {
        throw new Error("Please select or upload a visual inspection image.");
      }

      const job = await api.createInspection({
        name,
        profileId: selectedProfileId,
        assetId: assetIdToUse,
        objective,
        priority,
      });

      // Redirect to inspection detail
      navigate(`/app/inspections/${job.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to submit inspection job");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link to="/app/inspections" className="text-xs text-slate-400 hover:text-slate-200 flex items-center mb-2">
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          <span>Back to Inspections</span>
        </Link>
        <h1 className="text-2xl font-bold text-white tracking-tight">Configure New Inspection</h1>
        <p className="text-sm text-slate-400">
          Upload product images or snapshots to trigger automated visual anomaly detection.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        {/* Inspection Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Inspection Name / Lot Identifier
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g. PCBA Lot #4092 Inspection"
            className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
          />
        </div>

        {/* Profile Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Inspection Profile & Defect Rules
          </label>
          <select
            value={selectedProfileId}
            onChange={(e) => handleProfileChange(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
          >
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.domain})
              </option>
            ))}
          </select>
        </div>

        {/* Visual Asset Ingestion */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Target Inspection Asset (Image)
          </label>

          <div className="border-2 border-dashed border-slate-700 hover:border-brand-500/60 rounded-xl p-6 text-center transition-colors bg-slate-950/40">
            {filePreview ? (
              <div className="space-y-3">
                <img
                  src={filePreview}
                  alt="Inspection preview"
                  className="max-h-48 mx-auto rounded-lg shadow-md border border-slate-800"
                />
                <div className="flex items-center justify-center space-x-2 text-xs text-slate-300">
                  <FileImage className="w-4 h-4 text-brand-400" />
                  <span>{selectedFile?.name}</span>
                  <span className="text-slate-500">
                    ({Math.round((selectedFile?.size || 0) / 1024)} KB)
                  </span>
                </div>
                <label className="inline-block px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-brand-400 font-medium rounded-lg cursor-pointer">
                  Change Image
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} className="hidden" />
                </label>
              </div>
            ) : (
              <label className="cursor-pointer block space-y-2">
                <div className="w-12 h-12 rounded-full bg-slate-800 text-brand-400 flex items-center justify-center mx-auto mb-2">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="text-sm font-semibold text-slate-200">
                  Click to upload or drag and drop
                </div>
                <p className="text-xs text-slate-500">
                  Supported formats: JPEG, PNG, WebP (Max 15MB)
                </p>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <div className="mt-2 text-right">
            <Link to="/app/live-capture" className="text-xs text-brand-400 hover:underline inline-flex items-center space-x-1">
              <Camera className="w-3.5 h-3.5" />
              <span>Or capture live from webcam</span>
            </Link>
          </div>
        </div>

        {/* Priority and Objective */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
            >
              <option value="low">Low Priority</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Specific Objective (Optional Override)
            </label>
            <input
              type="text"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="e.g. Inspect solder joints and pin alignment"
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-3">
          <Link
            to="/app/inspections"
            className="px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || (!selectedFile && !selectedAssetId)}
            className="flex items-center space-x-2 px-6 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-brand-600/25 transition-all"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Submitting & Enqueuing...</span>
              </>
            ) : (
              <>
                <ScanEye className="w-4 h-4" />
                <span>Submit & Inspect</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
