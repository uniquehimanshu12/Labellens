import React, { useRef, useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Camera, RefreshCw, Check, AlertCircle, Upload } from 'lucide-react';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  sideName: string;
  onCapture: (imageDataUrl: string) => void;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  title,
  sideName,
  onCapture,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCapturedImage(null);
      setErrorMsg(null);
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    stopCamera();
    setErrorMsg(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setErrorMsg(
        'Camera permission was denied or no camera device is available. You can upload an image file instead.'
      );
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const handleTakeSnapshot = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    setCapturedImage(dataUrl);
    stopCamera();
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera();
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      onClose();
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCapturedImage(event.target.result as string);
          stopCamera();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Modal
      id="modal-camera-capture"
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={`Position the package ${sideName} squarely within the guide frame.`}
      maxWidth="2xl"
    >
      <div className="space-y-4">
        {errorMsg ? (
          <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold">Camera Access Unavailable</div>
                <div className="mt-1 text-xs text-amber-800 leading-relaxed">{errorMsg}</div>
                <div className="mt-4">
                  <label
                    htmlFor="fallback-camera-file"
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-white border border-amber-300 hover:bg-amber-100 text-xs font-semibold text-amber-900 cursor-pointer shadow-xs"
                  >
                    <Upload className="w-4 h-4 text-amber-700" />
                    <span>Upload Image from Device Instead</span>
                  </label>
                  <input
                    id="fallback-camera-file"
                    type="file"
                    accept="image/*"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : capturedImage ? (
          <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-950 flex items-center justify-center min-h-[320px]">
            <img
              src={capturedImage}
              alt="Captured package frame"
              className="max-h-[380px] w-auto object-contain"
            />
            <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white text-xs px-2.5 py-1 rounded font-mono">
              Snapshot Frozen — Verify Clarity
            </div>
          </div>
        ) : (
          <div className="relative rounded-lg overflow-hidden border border-slate-300 bg-black flex items-center justify-center min-h-[320px]">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-auto max-h-[380px] object-cover"
            />

            {/* Alignment Guide Lines */}
            <div className="absolute inset-6 border-2 border-dashed border-white/60 pointer-events-none rounded-md flex flex-col justify-between p-3">
              <div className="text-[11px] text-white/80 bg-black/60 px-2 py-0.5 rounded self-start font-mono">
                {sideName.toUpperCase()} SURFACE FRAME
              </div>
              <div className="text-[11px] text-center text-white/90 bg-black/50 px-2 py-0.5 rounded self-center">
                Keep statutory markings visible and illuminated
              </div>
            </div>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />

        {/* Guidance Notice */}
        <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded p-2.5">
          <strong>Inspector Guidance:</strong> Ensure text is readable, avoid glare on glossy surfaces, and capture the entire panel including price, net quantity, and address.
        </div>

        {/* Actions Bar */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div>
            {!capturedImage && !errorMsg && (
              <button
                id="btn-switch-camera"
                type="button"
                onClick={() => setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                <span>Switch Camera</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-cancel-capture"
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>

            {capturedImage ? (
              <>
                <button
                  id="btn-retake-snapshot"
                  type="button"
                  onClick={handleRetake}
                  className="px-3.5 py-1.5 rounded border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Retake
                </button>
                <button
                  id="btn-confirm-snapshot"
                  type="button"
                  onClick={handleConfirm}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Use This Image</span>
                </button>
              </>
            ) : (
              !errorMsg && (
                <button
                  id="btn-take-snapshot"
                  type="button"
                  onClick={handleTakeSnapshot}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  <Camera className="w-4 h-4" />
                  <span>Capture Snapshot</span>
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
