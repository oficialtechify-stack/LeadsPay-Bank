import React, { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, Upload, Check, AlertCircle, Sparkles, X, Eye } from 'lucide-react';

interface DocumentCaptureProps {
  type: 'front' | 'back' | 'selfie';
  title: string;
  description: string;
  currentPhoto?: string;
  onPhotoCaptured: (base64Photo: string) => void;
  required?: boolean;
}

export const DocumentCapture: React.FC<DocumentCaptureProps> = ({
  type,
  title,
  description,
  currentPhoto,
  onPhotoCaptured,
  required = true
}) => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isFacingUser, setIsFacingUser] = useState(type === 'selfie');
  const [previewZoom, setPreviewZoom] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera stream cleanly
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: isFacingUser ? 'user' : 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      streamRef.current = stream;
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: unknown) {
      console.warn('Camera access denied or unavailable:', err);
      setCameraError('Câmera não disponível no momento. Você pode anexar uma foto dos seus arquivos.');
      setIsCameraActive(false);
    }
  };

  // Flip camera between front and back
  const handleFlipCamera = () => {
    setIsFacingUser(prev => !prev);
    if (isCameraActive) {
      setTimeout(() => startCamera(), 100);
    }
  };

  const handleCapturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 800;
    canvas.height = video.videoHeight || 600;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // If selfie, mirror image naturally
    if (isFacingUser) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

    stopCamera();
    onPhotoCaptured(dataUrl);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        onPhotoCaptured(base64);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 sm:p-4 text-left relative overflow-hidden transition-all hover:border-emerald-500/30">
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-white tracking-wide">{title}</span>
            {required && <span className="text-[10px] text-emerald-400 font-mono">*Obrigatório</span>}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{description}</p>
        </div>

        {currentPhoto && (
          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full shrink-0 font-medium">
            <Check className="w-3 h-3" /> Capturada
          </span>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture={type === 'selfie' ? 'user' : 'environment'}
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* LIVE CAMERA MODE */}
      {isCameraActive ? (
        <div className="relative rounded-xl overflow-hidden bg-black border border-emerald-500/40 shadow-inner">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-56 object-cover ${isFacingUser ? '-scale-x-100' : ''}`}
          />

          {/* Guide Overlay */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-4">
            {type === 'selfie' ? (
              <div className="w-36 h-48 rounded-[50%] border-2 border-dashed border-[#00e676] bg-emerald-500/5 shadow-[0_0_20px_rgba(0,230,118,0.3)] flex items-center justify-center">
                <span className="text-[10px] text-white/80 bg-black/60 px-2 py-0.5 rounded-full">
                  Enquadre o rosto
                </span>
              </div>
            ) : (
              <div className="w-56 h-36 rounded-lg border-2 border-dashed border-[#00e676] bg-emerald-500/5 shadow-[0_0_20px_rgba(0,230,118,0.3)] flex items-center justify-center">
                <span className="text-[10px] text-white/80 bg-black/60 px-2 py-0.5 rounded-full">
                  Enquadre o documento
                </span>
              </div>
            )}
          </div>

          {/* Controls Bar */}
          <div className="absolute bottom-2.5 inset-x-0 flex items-center justify-center gap-3 px-3">
            <button
              type="button"
              onClick={handleFlipCamera}
              className="p-2 rounded-full bg-black/60 hover:bg-black text-white text-xs backdrop-blur-md border border-white/20 transition-all cursor-pointer"
              title="Inverter Câmera"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleCapturePhoto}
              className="px-5 py-2 rounded-full bg-[#00e676] hover:bg-[#00c853] text-black font-bold text-xs flex items-center gap-1.5 shadow-[0_0_20px_rgba(0,230,118,0.5)] active:scale-95 transition-all cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>Tirar Foto</span>
            </button>

            <button
              type="button"
              onClick={stopCamera}
              className="p-2 rounded-full bg-black/60 hover:bg-black text-white text-xs backdrop-blur-md border border-white/20 transition-all cursor-pointer"
              title="Cancelar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : currentPhoto ? (
        /* PHOTO PREVIEW MODE */
        <div className="relative rounded-xl overflow-hidden border border-emerald-500/30 bg-black/50 group">
          <div className="relative h-44 w-full bg-black/60 flex items-center justify-center overflow-hidden">
            <img
              src={currentPhoto}
              alt={title}
              className="w-full h-full object-contain cursor-pointer transition-transform group-hover:scale-[1.02]"
              onClick={() => setPreviewZoom(true)}
            />
            <div className="absolute top-2 right-2 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPreviewZoom(true)}
                className="p-1.5 rounded-lg bg-black/70 hover:bg-black text-white border border-white/20 transition-colors text-xs flex items-center gap-1"
                title="Ampliar Foto"
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="text-[10px]">Ampliar</span>
              </button>
            </div>
          </div>

          <div className="p-2.5 bg-black/70 border-t border-white/10 flex items-center justify-between gap-2">
            <span className="text-[11px] text-slate-300 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#00e676]" /> Foto nítida registrada
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={startCamera}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-white text-[11px] font-medium transition-colors flex items-center gap-1"
              >
                <Camera className="w-3 h-3 text-[#00e676]" />
                <span>Refazer</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-[11px] transition-colors flex items-center gap-1"
              >
                <Upload className="w-3 h-3" />
                <span>Trocar</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* EMPTY STATE / CHOOSE METHOD */
        <div className="space-y-2">
          {cameraError && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{cameraError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={startCamera}
              className="py-3 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-[#00e676] text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer"
            >
              <Camera className="w-5 h-5 text-[#00e676]" />
              <span>Abrir Câmera</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="py-3 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-medium flex flex-col items-center justify-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer"
            >
              <Upload className="w-5 h-5 text-slate-400" />
              <span>Enviar Arquivo</span>
            </button>
          </div>
        </div>
      )}

      {/* FULLSCREEN PHOTO ZOOM MODAL */}
      {previewZoom && currentPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
          onClick={() => setPreviewZoom(false)}
        >
          <div className="relative max-w-2xl max-h-[85vh] bg-[#0c120e] rounded-2xl border border-white/20 p-2 overflow-hidden flex flex-col items-center">
            <button
              onClick={() => setPreviewZoom(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/80 text-white hover:bg-black transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h4 className="text-xs font-semibold text-white my-2">{title}</h4>
            <img
              src={currentPhoto}
              alt={title}
              className="max-h-[75vh] w-auto object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
};
