import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CameraOff, Loader2, RefreshCw, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslations } from "@/app/hooks";
import scanStrings from "@/locales/en/scan.json";

export function CameraCaptureDialog({
  open,
  onOpenChange,
  onCapture,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCapture: (file: File) => void;
}) {
  const t = useTranslations("scan", scanStrings);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [capture, setCapture] = useState<{ file: File; url: string } | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const startCamera = useCallback(async () => {
    stopCamera();
    setStarting(true);
    setError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia || !window.isSecureContext) {
        throw new Error(t.cameraSecureContext);
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (reason) {
      setError(
        reason instanceof Error && reason.message === t.cameraSecureContext
          ? reason.message
          : t.cameraPermissionError,
      );
    } finally {
      setStarting(false);
    }
  }, [facingMode, stopCamera, t.cameraPermissionError, t.cameraSecureContext]);

  useEffect(() => {
    if (open && !capture) void startCamera();
    if (!open) stopCamera();
    return stopCamera;
  }, [open, capture, startCamera, stopCamera]);

  useEffect(
    () => () => {
      if (capture) URL.revokeObjectURL(capture.url);
    },
    [capture],
  );

  function takePhoto() {
    const video = videoRef.current;
    if (!video?.videoWidth || !video.videoHeight) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `receipt-${Date.now()}.jpg`, { type: "image/jpeg" });
        setCapture({ file, url: URL.createObjectURL(blob) });
        stopCamera();
      },
      "image/jpeg",
      0.92,
    );
  }

  function retake() {
    if (capture) URL.revokeObjectURL(capture.url);
    setCapture(null);
  }

  function usePhoto() {
    if (!capture) return;
    onCapture(capture.file);
    URL.revokeObjectURL(capture.url);
    setCapture(null);
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          stopCamera();
          setCapture(null);
        }
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[95vh] overflow-y-auto p-4 sm:max-w-2xl sm:p-6">
        <DialogHeader>
          <DialogTitle>{t.cameraTitle}</DialogTitle>
          <DialogDescription>{t.cameraHint}</DialogDescription>
        </DialogHeader>
        <div className="relative aspect-[3/4] max-h-[68vh] overflow-hidden rounded-2xl bg-black sm:aspect-[4/3]">
          {capture ? (
            <img
              src={capture.url}
              alt={t.capturedReceipt}
              className="h-full w-full object-contain"
            />
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover"
            />
          )}
          {!capture && !error && (
            <div className="pointer-events-none absolute inset-[7%] rounded-xl border-2 border-dashed border-white/80 shadow-[0_0_0_999px_rgba(0,0,0,0.2)]">
              <span className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/60 px-3 py-1 text-xs text-white">
                {t.alignReceipt}
              </span>
            </div>
          )}
          {starting && (
            <div className="absolute inset-0 grid place-items-center bg-black/50 text-white">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}
          {error && (
            <div className="absolute inset-0 grid place-items-center p-6 text-center text-white">
              <div>
                <CameraOff className="mx-auto h-10 w-10" />
                <p className="mt-3 font-semibold">{error}</p>
                <Button className="mt-4" variant="secondary" onClick={() => void startCamera()}>
                  <RefreshCw className="h-4 w-4" />
                  {t.retryCamera}
                </Button>
              </div>
            </div>
          )}
        </div>
        <DialogFooter className="gap-2 sm:justify-center">
          {capture ? (
            <>
              <Button variant="outline" onClick={retake}>
                <RotateCcw className="h-4 w-4" />
                {t.retake}
              </Button>
              <Button onClick={usePhoto}>
                <Camera className="h-4 w-4" />
                {t.usePhoto}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() =>
                  setFacingMode((current) => (current === "environment" ? "user" : "environment"))
                }
                disabled={starting}
              >
                <RotateCcw className="h-4 w-4" />
                {t.flipCamera}
              </Button>
              <Button onClick={takePhoto} disabled={starting || !!error}>
                <Camera className="h-4 w-4" />
                {t.capturePhoto}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
