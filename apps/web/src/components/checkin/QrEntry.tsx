"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export interface QrEntryProps {
  code: string;
  onCodeChange: (code: string) => void;
  /** Manual submit (the form button). The caller validates non-empty. */
  onSubmit: () => void;
  /** Camera-decoded value — the caller sets it and submits it directly. */
  onScan: (code: string) => void;
  isPending?: boolean;
  error?: string | null;
}

interface DetectedBarcode {
  rawValue?: string;
}

interface BarcodeDetectorInstance {
  detect: (source: HTMLVideoElement) => Promise<DetectedBarcode[]>;
}

type BarcodeDetectorCtor = new (options?: { formats?: string[] }) => BarcodeDetectorInstance;

function getDetectorCtor(): BarcodeDetectorCtor | null {
  if (typeof window === "undefined") return null;
  const ctor = (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector;
  return typeof ctor === "function" ? ctor : null;
}

function cameraAvailable(): boolean {
  return (
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === "function"
  );
}

/**
 * Member-code entry with progressive-enhancement camera scanning.
 *
 * The manual field is the baseline — it always works. Camera scanning appears
 * only when the browser offers both `getUserMedia` and the native
 * `BarcodeDetector`; otherwise a hint explains that manual entry is the way.
 * No new npm dependencies: detection is the platform API.
 */
export function QrEntry({ code, onCodeChange, onSubmit, onScan, isPending = false, error }: QrEntryProps) {
  const [scanning, setScanning] = useState(false);
  const [starting, setStarting] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const onScanRef = useRef(onScan);
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  const supported = getDetectorCtor() !== null && cameraAvailable();

  const stopScan = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setScanning(false);
  }, []);

  useEffect(() => stopScan, [stopScan]);

  async function startScan() {
    const Detector = getDetectorCtor();
    if (!Detector || !cameraAvailable()) {
      setScanError("مرورگر شما از اسکن دوربین پشتیبانی نمی‌کند؛ کد را دستی وارد کنید.");
      return;
    }
    setStarting(true);
    setScanError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) {
        stopScan();
        return;
      }
      video.srcObject = stream;
      await video.play();
      setScanning(true);
      const detector = new Detector({ formats: ["qr_code"] });
      timerRef.current = window.setInterval(async () => {
        const current = videoRef.current;
        if (!current || current.readyState < 2) return;
        try {
          const found = await detector.detect(current);
          const value = found.find((b) => b.rawValue?.trim())?.rawValue?.trim();
          if (value) {
            stopScan();
            onScanRef.current(value);
          }
        } catch {
          /* A single failed frame is not worth interrupting the scan. */
        }
      }, 400);
    } catch {
      setScanError("دسترسی به دوربین ممکن نشد؛ کد را دستی وارد کنید.");
      stopScan();
    } finally {
      setStarting(false);
    }
  }

  return (
    <div className="space-y-4">
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <Input
          label="کد عضویت"
          placeholder="مثلاً 8fa1…"
          value={code}
          onChange={(event) => onCodeChange(event.target.value)}
          error={error ?? undefined}
          hint="کد روی کارت عضویت ورزشکار — همان شناسه کاربری"
          autoComplete="off"
          inputMode="text"
          dir="ltr"
          startAdornment={<ScanLine aria-hidden className="h-4 w-4" />}
        />
        <Button type="submit" loading={isPending} className="w-full">
          ثبت ورود
        </Button>
      </form>

      {supported ? (
        <div className="space-y-3">
          {!scanning ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => void startScan()}
              disabled={starting || isPending}
              loading={starting}
              className="w-full"
            >
              <Camera aria-hidden className="h-4 w-4" />
              اسکن با دوربین
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="overflow-hidden rounded-2xl border border-border bg-muted">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  aria-label="پیش‌نمایش دوربین برای اسکن کد عضویت"
                  className="aspect-video w-full object-cover"
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs leading-5 text-muted-foreground" aria-live="polite">
                  کد را روبه‌روی دوربین بگیرید…
                </p>
                <Button type="button" variant="outline" size="sm" onClick={stopScan}>
                  توقف اسکن
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="text-xs leading-5 text-muted-foreground">
          اسکن دوربین در این مرورگر پشتیبانی نمی‌شود؛ کد را دستی وارد کنید.
        </p>
      )}

      <p className="sr-only" aria-live="polite">
        {scanError ?? ""}
      </p>
      {scanError && (
        <p role="alert" className="text-xs leading-5 text-destructive">
          {scanError}
        </p>
      )}
    </div>
  );
}
