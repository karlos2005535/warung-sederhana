import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface FlashStatus {
  isOn: boolean;
  available: boolean;
}

export interface CameraInfo {
  hasMultipleCameras: boolean;
  currentCamera: string;
}

@Injectable({
  providedIn: 'root',
})
export class BarcodeService {
  private isScanning = new BehaviorSubject<boolean>(false);
  private barcodeResult = new BehaviorSubject<string>('');
  private flashStatus = new BehaviorSubject<FlashStatus>({ isOn: false, available: false });
  private cameraInfo = new BehaviorSubject<CameraInfo>({
    hasMultipleCameras: false,
    currentCamera: '',
  });

  private scanner: any = null;
  private currentStream: MediaStream | null = null;
  private currentContainerId: string = '';

  constructor() {}

  async startScanner(containerId: string): Promise<void> {
    this.currentContainerId = containerId;

    try {
      if (this.scanner?.isScanning) {
        await this.stopScanner();
      }

      // Dynamic import
      const html5QrcodeModule = await import('html5-qrcode');
      const Html5Qrcode = html5QrcodeModule.Html5Qrcode;

      this.scanner = new Html5Qrcode(containerId);

      const config = {
        fps: 15,
        qrbox: { width: 250, height: 150 },
        aspectRatio: 1.0,
      };

      // Logika pilih kamera belakang
      const devices = await Html5Qrcode.getCameras();
      let cameraIdOrConfig: any = { facingMode: 'environment' };

      if (devices && devices.length > 0) {
        this.cameraInfo.next({
          hasMultipleCameras: devices.length > 1,
          currentCamera: 'Kamera Belakang',
        });

        const backCamera = devices.find(
          (d) =>
            d.label.toLowerCase().includes('back') ||
            d.label.toLowerCase().includes('rear') ||
            d.label.toLowerCase().includes('environment')
        );

        if (backCamera) {
          cameraIdOrConfig = backCamera.id;
        }
      }

      await this.scanner.start(
        cameraIdOrConfig,
        config,
        (decodedText: string) => this.handleScanSuccess(decodedText),
        (errorMessage: string) => {
          /* ignore frame errors */
        }
      );

      this.isScanning.next(true);

      // Delay sedikit untuk inisialisasi flash
      setTimeout(() => this.initializeFlashFeatures(), 500);
    } catch (error) {
      console.error('Gagal memulai scanner:', error);
      this.isScanning.next(false);
      throw error;
    }
  }

  private handleScanSuccess(decodedText: string): void {
    this.barcodeResult.next(decodedText);
    this.stopScanner().catch((err) => console.warn(err));
  }

  private async initializeFlashFeatures(): Promise<void> {
    const videoElement = document.querySelector(
      `#${this.currentContainerId} video`
    ) as HTMLVideoElement;

    if (videoElement && videoElement.srcObject) {
      this.currentStream = videoElement.srcObject as MediaStream;
      const track = this.currentStream.getVideoTracks()[0];

      if (track) {
        // PERBAIKAN: Menggunakan optional chaining ?.() untuk mencegah error
        const capabilities = (track as any).getCapabilities?.() || {};
        const available = !!capabilities.torch;

        this.flashStatus.next({
          isOn: false,
          available: available,
        });
      }
    }
  }

  async toggleFlash(): Promise<void> {
    if (!this.currentStream) return;
    const track = this.currentStream.getVideoTracks()[0];
    if (!track) return;

    try {
      const newStatus = !this.flashStatus.value.isOn;
      await track.applyConstraints({
        advanced: [{ torch: newStatus } as any],
      });
      this.flashStatus.next({ ...this.flashStatus.value, isOn: newStatus });
    } catch (err) {
      console.warn('Flash toggle failed', err);
    }
  }

  async stopScanner(): Promise<void> {
    if (this.scanner) {
      try {
        if (this.scanner.isScanning) await this.scanner.stop();
        this.scanner.clear();
      } catch (e) {
        console.warn(e);
      }
    }
    this.isScanning.next(false);
    this.flashStatus.next({ isOn: false, available: false });
    this.currentStream = null;
  }

  destroyScanner(): void {
    this.stopScanner();
  }

  getBarcodeResult(): Observable<string> {
    return this.barcodeResult.asObservable();
  }
  getScanningStatus(): Observable<boolean> {
    return this.isScanning.asObservable();
  }
  getFlashStatus(): Observable<FlashStatus> {
    return this.flashStatus.asObservable();
  }
  getCameraInfo(): Observable<CameraInfo> {
    return this.cameraInfo.asObservable();
  }
}
