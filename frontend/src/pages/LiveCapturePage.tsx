import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, CameraOff, RefreshCw, ScanEye, ArrowLeft, AlertCircle } from "lucide-react";
import { api } from "../lib/api-client";

export const LiveCapturePage: React.FC = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    api.getProfiles().then((p) => {
      setProfiles(p);
      if (p.length > 0) setSelectedProfileId(p[0].id);
    });

    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      setCameraError(
        "Could not access browser camera. Please ensure camera permissions are granted in your browser settings."
      );
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
      setCapturedDataUrl(dataUrl);

      canvas.toBlob((blob) => {
        if (blob) setCapturedBlob(blob);
      }, "image/jpeg", 0.95);
    }
  };

  const submitCapturedFrame = async () => {
    if (!capturedBlob || !selectedProfileId) return;
    setIsUploading(true);

    try {
      const file = new File([capturedBlob], `camera-frame-${Date.now()}.jpg`, { type: "image/jpeg" });
      const uploaded = await api.uploadAsset(file);

      const job = await api.createInspection({
        name: `Live Snapshot Inspection #${Math.floor(1000 + Math.random() * 9000)}`,
        profileId: selectedProfileId,
        assetId: uploaded.id,
        priority: "high",
      });

      stopCamera();
      navigate(`/app/inspections/${job.id}`);
    } catch (err: any) {
      alert(`Submission failed: ${err.message}`);
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <Camera className="w-6 h-6 text-brand-400" />
            <span>Live Camera Capture & Inspection</span>
          </h1>
          <p className="text-sm text-slate-400">
            Capture high-resolution still frames directly from industrial webcams or mobile cameras.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {!stream ? (
            <button
              onClick={startCamera}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md transition-colors"
            >
              <Camera className="w-4 h-4" />
              <span>Enable Camera</span>
            </button>
          ) : (
            <button
              onClick={stopCamera}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              <CameraOff className="w-4 h-4" />
              <span>Disable Camera</span>
            </button>
          )}
        </div>
      </div>

      {cameraError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{cameraError}</span>
        </div>
      )}

      {/* Viewfinder Canvas Card */}
      <div className="relative bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col items-center justify-center min-h-[440px]">
        {stream ? (
          <div className="relative w-full h-full flex items-center justify-center bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full max-h-[520px] object-contain"
            />

            {/* Target Reticle Overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-72 h-72 border-2 border-brand-400/40 rounded-xl flex items-center justify-center">
                <div className="w-4 h-4 border border-brand-400/80 rounded-full"></div>
              </div>
            </div>

            {/* Bottom Capture Button */}
            <div className="absolute bottom-6 inset-x-0 flex justify-center">
              <button
                onClick={captureFrame}
                className="px-6 py-3 rounded-full bg-brand-500 hover:bg-brand-400 text-white font-bold text-sm shadow-2xl flex items-center space-x-2 active:scale-95 transition-all"
              >
                <Camera className="w-5 h-5" />
                <span>Snap Inspection Frame</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <Camera className="w-12 h-12 mx-auto text-slate-600" />
            <p className="text-sm font-semibold text-slate-300">Camera is currently inactive</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Click "Enable Camera" above to permit browser video capture for real-time part inspection.
            </p>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {/* Captured Still Frame Preview Modal / Drawer */}
      {capturedDataUrl && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">Review Captured Frame</h2>
            <button
              onClick={() => {
                setCapturedDataUrl(null);
                setCapturedBlob(null);
              }}
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              Discard & Retake
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-6 items-center">
            <img
              src={capturedDataUrl}
              alt="Captured frame preview"
              className="w-full md:w-1/2 max-h-64 object-contain rounded-xl border border-slate-700 shadow-md"
            />

            <div className="w-full md:w-1/2 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Inspection Profile
                </label>
                <select
                  value={selectedProfileId}
                  onChange={(e) => setSelectedProfileId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
                >
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={submitCapturedFrame}
                disabled={isUploading}
                className="w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-lg shadow-emerald-600/25 flex items-center justify-center space-x-2 transition-all"
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Analyzing Image...</span>
                  </>
                ) : (
                  <>
                    <ScanEye className="w-4 h-4" />
                    <span>Confirm & Launch Inspection</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
