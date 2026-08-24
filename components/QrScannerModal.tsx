'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  X,
  Camera,
  Upload,
  Zap,
  ZapOff,
  SwitchCamera,
  AlertCircle,
  FileImage,
  ShieldCheck,
  Check,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Token, GoogleMigrationAccount } from '@/lib/types';
import { parseOtpAuthUri, sanitizeBase32Secret } from '@/lib/otp';
import { parseGoogleMigrationUri } from '@/lib/google-migration';
import { decodeQrFromImageFile, scanCanvasForQr } from '@/lib/qr-decoder';
import { playSuccessSound, triggerHaptic } from '@/lib/sound';
import { useToast } from './NotificationToast';
import { RenderAccountIcon } from '@/lib/brand-icons';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveToken: (token: Token) => void;
  onBatchImport: (tokens: Token[]) => void;
  soundEnabled: boolean;
  hapticEnabled: boolean;
}

export function QrScannerModal({
  isOpen,
  onClose,
  onSaveToken,
  onBatchImport,
  soundEnabled,
  hapticEnabled,
}: QrScannerModalProps) {
  const { showToast } = useToast();
  const [tab, setTab] = useState<'camera' | 'file'>('camera');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isDragging, setIsDragging] = useState(false);

  // Parsed single token preview
  const [singleTokenPreview, setSingleTokenPreview] = useState<Token | null>(null);

  // Parsed Google Migration batch accounts preview
  const [batchAccounts, setBatchAccounts] = useState<GoogleMigrationAccount[]>([]);
  const [selectedBatchIndices, setSelectedBatchIndices] = useState<Set<number>>(new Set());

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Stop camera stream helper
  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Process decoded QR code string
  const handleDecodedString = useCallback(
    (rawString: string) => {
      const cleanString = rawString.trim();

      // Check if it's a Google Authenticator batch migration QR
      if (cleanString.startsWith('otpauth-migration://offline?data=')) {
        const accounts = parseGoogleMigrationUri(cleanString);
        if (accounts.length > 0) {
          stopCamera();
          playSuccessSound(soundEnabled);
          triggerHaptic([30, 50, 30], hapticEnabled);
          setBatchAccounts(accounts);
          setSelectedBatchIndices(new Set(accounts.map((_, i) => i)));
          showToast({
            title: 'Migration QR Detected',
            description: `Found ${accounts.length} 2FA security tokens.`,
            type: 'shield',
          });
          return;
        }
      }

      // Check if standard otpauth URI
      const parsed = parseOtpAuthUri(cleanString);
      if (parsed && parsed.secret) {
        stopCamera();
        playSuccessSound(soundEnabled);
        triggerHaptic(30, hapticEnabled);

        const token: Token = {
          id: `tokey-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          issuer: parsed.issuer || 'Custom Service',
          account: parsed.account || 'Account',
          secret: sanitizeBase32Secret(parsed.secret),
          type: parsed.type || 'totp',
          algorithm: parsed.algorithm || 'SHA1',
          digits: parsed.digits || 6,
          period: parsed.period || 30,
          counter: parsed.counter || 0,
          category: 'Personal',
          isPinned: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        setSingleTokenPreview(token);
        return;
      }

      // If raw string might be just a Base32 key
      const cleanSecret = sanitizeBase32Secret(cleanString);
      if (cleanSecret.length >= 8) {
        stopCamera();
        playSuccessSound(soundEnabled);
        const token: Token = {
          id: `tokey-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          issuer: 'Scanned Key',
          account: 'Account',
          secret: cleanSecret,
          type: 'totp',
          algorithm: 'SHA1',
          digits: 6,
          period: 30,
          category: 'Personal',
          isPinned: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        setSingleTokenPreview(token);
        return;
      }

      showToast({
        title: 'Unrecognized QR Code',
        description: 'QR does not contain a standard 2FA OTP security key.',
        type: 'error',
      });
    },
    [hapticEnabled, showToast, soundEnabled, stopCamera]
  );

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        showToast({
          title: 'Invalid File',
          description: 'Please upload a PNG, JPG, or screenshot image.',
          type: 'error',
        });
        return;
      }

      const qrResult = await decodeQrFromImageFile(file);
      if (qrResult) {
        handleDecodedString(qrResult);
      } else {
        showToast({
          title: 'No QR Code Found',
          description: 'Could not detect a valid QR code in this image. Ensure high clarity.',
          type: 'error',
        });
      }
    },
    [handleDecodedString, showToast]
  );

  useEffect(() => {
    let isActive = true;

    if (isOpen && tab === 'camera' && !singleTokenPreview && batchAccounts.length === 0) {
      navigator.mediaDevices
        ?.getUserMedia({
          video: {
            facingMode: facingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        })
        .then(async (stream) => {
          if (!isActive) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            await videoRef.current.play();
            setCameraError(null);

            const scanLoop = () => {
              if (videoRef.current && canvasRef.current) {
                const qrResult = scanCanvasForQr(videoRef.current, canvasRef.current);
                if (qrResult) {
                  handleDecodedString(qrResult);
                  return;
                }
              }
              animationFrameRef.current = requestAnimationFrame(scanLoop);
            };
            animationFrameRef.current = requestAnimationFrame(scanLoop);
          }
        })
        .catch((err) => {
          if (!isActive) return;
          setCameraError(
            err.name === 'NotAllowedError'
              ? 'Camera permission was denied. Please grant camera access or upload an image file.'
              : 'Unable to start camera stream on this device.'
          );
        });
    } else {
      stopCamera();
    }

    return () => {
      isActive = false;
      stopCamera();
    };
  }, [isOpen, tab, facingMode, singleTokenPreview, batchAccounts.length, handleDecodedString, stopCamera]);

  // Handle Torch toggle
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;

    try {
      const capabilities = (track.getCapabilities && track.getCapabilities()) as any;
      if (capabilities && capabilities.torch) {
        await (track as any).applyConstraints({
          advanced: [{ torch: !torchOn }],
        });
        setTorchOn(!torchOn);
      }
    } catch {
      // ignore
    }
  };

  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Clipboard paste listener
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) handleFile(file);
          break;
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen, handleFile]);

  // Confirm and save single token
  const handleConfirmSingleToken = () => {
    if (!singleTokenPreview) return;
    onSaveToken(singleTokenPreview);
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    showToast({
      title: 'Token Added',
      description: `${singleTokenPreview.issuer} 2FA account saved to vault.`,
      type: 'success',
    });
    handleResetModal();
  };

  // Confirm and batch import Google Authenticator tokens
  const handleConfirmBatch = () => {
    const tokensToImport: Token[] = batchAccounts
      .filter((_, idx) => selectedBatchIndices.has(idx))
      .map((acc) => ({
        id: `tokey-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        issuer: acc.issuer || 'Service',
        account: acc.name || 'Account',
        secret: acc.secret,
        type: acc.type,
        algorithm: acc.algorithm,
        digits: acc.digits,
        period: 30,
        counter: acc.counter || 0,
        category: 'Personal',
        isPinned: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }));

    if (tokensToImport.length === 0) return;

    onBatchImport(tokensToImport);
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    showToast({
      title: 'Accounts Imported',
      description: `Imported ${tokensToImport.length} accounts from Google Authenticator.`,
      type: 'success',
    });
    handleResetModal();
  };

  const handleResetModal = () => {
    setSingleTokenPreview(null);
    setBatchAccounts([]);
    setSelectedBatchIndices(new Set());
    stopCamera();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#090b0e]/85 backdrop-blur-sm">
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="qr-scanner-title"
        initial={{ opacity: 0, scale: 0.98, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 8 }}
        transition={{ duration: 0.15 }}
        className="relative w-full max-w-lg rounded-xl surface-elevated overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h2 id="qr-scanner-title" className="text-sm font-semibold text-white">Scan QR Code</h2>
              <p className="text-[11px] text-zinc-400">Direct camera scanner or image drop</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleResetModal}
            aria-label="Close"
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* If Single Token Preview */}
          {singleTokenPreview ? (
            <div className="space-y-4">
              <div className="surface-card rounded-lg p-3.5 flex items-center gap-3">
                <RenderAccountIcon
                  issuer={singleTokenPreview.issuer}
                  account={singleTokenPreview.account}
                  className="w-9 h-9"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-semibold text-emerald-400 tracking-wider uppercase">
                    QR Decoded
                  </span>
                  <h3 className="font-semibold text-white truncate text-sm">
                    {singleTokenPreview.issuer}
                  </h3>
                  <p className="text-[11px] text-zinc-400 truncate">{singleTokenPreview.account}</p>
                </div>
              </div>

              <div className="space-y-2 surface-card p-3.5 rounded-lg text-xs">
                <div className="flex justify-between py-1 border-b border-zinc-800">
                  <span className="text-zinc-400">Type:</span>
                  <span className="mono text-zinc-200 uppercase font-semibold">
                    {singleTokenPreview.type}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-800">
                  <span className="text-zinc-400">Algorithm:</span>
                  <span className="mono text-zinc-200 font-semibold">
                    {singleTokenPreview.algorithm}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-800">
                  <span className="text-zinc-400">Digits & Interval:</span>
                  <span className="mono text-zinc-200 font-semibold">
                    {singleTokenPreview.digits} digits • {singleTokenPreview.period}s
                  </span>
                </div>
                <div className="pt-1">
                  <label className="block text-zinc-400 mb-1 text-[11px]">Category:</label>
                  <select
                    value={singleTokenPreview.category}
                    onChange={(e) =>
                      setSingleTokenPreview({
                        ...singleTokenPreview,
                        category: e.target.value,
                      })
                    }
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-zinc-500"
                  >
                    <option value="Personal" className="bg-zinc-900">Personal</option>
                    <option value="Work" className="bg-zinc-900">Work</option>
                    <option value="Finance" className="bg-zinc-900">Finance</option>
                    <option value="Crypto" className="bg-zinc-900">Crypto</option>
                    <option value="Social" className="bg-zinc-900">Social</option>
                    <option value="Developer" className="bg-zinc-900">Developer</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2.5 pt-1">
                <button
                  onClick={() => setSingleTokenPreview(null)}
                  className="flex-1 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium border border-zinc-700 transition-colors cursor-pointer"
                >
                  Scan Another
                </button>
                <button
                  onClick={handleConfirmSingleToken}
                  className="flex-1 py-2 rounded-lg bg-white hover:bg-zinc-200 active:scale-[0.98] text-zinc-950 font-semibold text-xs transition-all shadow-sm cursor-pointer"
                >
                  Save Account
                </button>
              </div>
            </div>
          ) : batchAccounts.length > 0 ? (
            /* If Google Migration Batch detected */
            <div className="space-y-3.5">
              <div className="surface-card rounded-lg p-3.5 flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-zinc-200 shrink-0" />
                <div>
                  <h3 className="text-xs font-semibold text-white">
                    Google Authenticator Migration
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Select accounts to import ({selectedBatchIndices.size}/{batchAccounts.length} selected):
                  </p>
                </div>
              </div>

              <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                {batchAccounts.map((acc, idx) => {
                  const isChecked = selectedBatchIndices.has(idx);
                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        const next = new Set(selectedBatchIndices);
                        if (isChecked) next.delete(idx);
                        else next.add(idx);
                        setSelectedBatchIndices(next);
                      }}
                      className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-zinc-800/80 border-zinc-600 text-white'
                          : 'surface-card border-zinc-800/80 text-zinc-400'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center border ${
                          isChecked
                            ? 'bg-white border-white text-zinc-950'
                            : 'border-zinc-700'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <RenderAccountIcon
                        issuer={acc.issuer}
                        account={acc.name}
                        className="w-7 h-7 text-[10px]"
                        iconSize="w-3.5 h-3.5"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold truncate text-white">
                          {acc.issuer}
                        </p>
                        <p className="text-[11px] truncate text-zinc-400">{acc.name}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-2.5 pt-1">
                <button
                  onClick={() => setBatchAccounts([])}
                  className="flex-1 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium border border-zinc-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmBatch}
                  disabled={selectedBatchIndices.size === 0}
                  className="flex-1 py-2 rounded-lg bg-white hover:bg-zinc-200 active:scale-[0.98] disabled:opacity-40 text-zinc-950 font-semibold text-xs transition-all shadow-sm cursor-pointer"
                >
                  Import {selectedBatchIndices.size} Accounts
                </button>
              </div>
            </div>
          ) : (
            /* Normal Tab Scanning Area */
            <>
              {/* Tab Selector */}
              <div className="grid grid-cols-2 p-0.5 bg-zinc-900 rounded-lg border border-zinc-700">
                <button
                  onClick={() => setTab('camera')}
                  className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    tab === 'camera'
                      ? 'bg-zinc-800 text-white font-semibold shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  Live Camera
                </button>
                <button
                  onClick={() => setTab('file')}
                  className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    tab === 'file'
                      ? 'bg-zinc-800 text-white font-semibold shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  Upload Image
                </button>
              </div>

              {tab === 'camera' ? (
                <div className="space-y-3">
                  {cameraError ? (
                    <div className="p-5 rounded-lg bg-rose-950/20 border border-rose-800/40 text-center space-y-2">
                      <AlertCircle className="w-6 h-6 text-rose-400 mx-auto" />
                      <p className="text-xs text-rose-200 leading-relaxed">{cameraError}</p>
                    </div>
                  ) : (
                    <div className="relative rounded-lg overflow-hidden bg-black aspect-square max-h-64 border border-zinc-800 flex items-center justify-center">
                      <video
                        ref={videoRef}
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                      <canvas ref={canvasRef} className="hidden" />

                      {/* Scanner Frame Guide */}
                      <div className="absolute inset-10 border-2 border-zinc-400/60 rounded-xl pointer-events-none" />

                      {/* Floating Camera Controls */}
                      <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-2">
                        <button
                          onClick={toggleTorch}
                          title="Toggle Flashlight"
                          className={`p-2 rounded-lg backdrop-blur-md border transition-colors cursor-pointer ${
                            torchOn
                              ? 'bg-white text-zinc-950 border-white'
                              : 'bg-zinc-900/80 border-zinc-700 text-zinc-200 hover:bg-zinc-800'
                          }`}
                        >
                          {torchOn ? <Zap className="w-3.5 h-3.5" /> : <ZapOff className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={toggleCameraFacing}
                          title="Switch Camera"
                          className="p-2 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 backdrop-blur-md border border-zinc-700 text-zinc-200 transition-colors cursor-pointer"
                        >
                          <SwitchCamera className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                  <p className="text-center text-[11px] text-zinc-500">
                    Align the 2FA QR code within the frame to scan automatically.
                  </p>
                </div>
              ) : (
                /* File Drop Area */
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleFile(e.dataTransfer.files[0]);
                    }
                  }}
                  className={`border border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
                    isDragging
                      ? 'border-zinc-400 bg-zinc-800/40'
                      : 'border-zinc-700 hover:border-zinc-600 surface-card'
                  }`}
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e: any) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFile(e.target.files[0]);
                      }
                    };
                    input.click();
                  }}
                >
                  <FileImage className="w-10 h-10 text-zinc-500 mx-auto mb-2" />
                  <p className="text-xs font-medium text-zinc-200">
                    Drop QR screenshot or click to browse
                  </p>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Supports PNG, JPG, WebP, or paste with ⌘V
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

