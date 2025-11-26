import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

interface FlashStatus {
  isOn: boolean;
  available: boolean;
}

interface CameraInfo {
  hasMultipleCameras: boolean;
  currentCamera: string;
}

interface CameraDevice {
  id: string;
  label: string;
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
  private cameras: CameraDevice[] = [];
  private currentCameraIndex: number = 0;

  constructor() {}

  async startScanner(containerId: string): Promise<void> {
    try {
      if (this.scanner?.isScanning) {
        return;
      }

      const html5QrcodeModule = await import('html5-qrcode');
      const Html5Qrcode = html5QrcodeModule.Html5Qrcode;

      this.scanner = new Html5Qrcode(containerId);

      this.cameras = (await Html5Qrcode.getCameras()) as CameraDevice[];
      if (this.cameras.length === 0) {
        throw new Error('No cameras found');
      }

      const cameraId = this.selectCamera(this.cameras);

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 150 },
        formatsToSupport: [
          html5QrcodeModule.Html5QrcodeSupportedFormats.CODE_128,
          html5QrcodeModule.Html5QrcodeSupportedFormats.CODE_39,
          html5QrcodeModule.Html5QrcodeSupportedFormats.CODE_93,
          html5QrcodeModule.Html5QrcodeSupportedFormats.EAN_13,
          html5QrcodeModule.Html5QrcodeSupportedFormats.EAN_8,
          html5QrcodeModule.Html5QrcodeSupportedFormats.UPC_A,
          html5QrcodeModule.Html5QrcodeSupportedFormats.UPC_E,
        ],
      };

      await this.scanner.start(
        cameraId,
        config,
        this.handleScanSuccess.bind(this),
        this.handleScanError.bind(this)
      );

      this.isScanning.next(true);
      this.updateCameraInfo(cameraId);
      await this.initializeFlash(cameraId);
    } catch (error) {
      console.error('Scanner start failed:', error);
      this.isScanning.next(false);
      throw error;
    }
  }

  private selectCamera(cameras: CameraDevice[]): string {
    const backCamera = cameras.find(
      (cam) => cam.label.toLowerCase().includes('back') || cam.label.toLowerCase().includes('rear')
    );
    return backCamera?.id || cameras[0].id;
  }

  private handleScanSuccess(decodedText: string): void {
    this.barcodeResult.next(decodedText);
    this.stopScanner().catch((error) =>
      console.error('Error stopping scanner after success:', error)
    );
  }

  private handleScanError(error: string): void {
    if (!error.includes('NotFoundException')) {
      console.warn('Scan error:', error);
    }
  }

  private updateCameraInfo(cameraId: string): void {
    const currentCamera = this.cameras.find((cam) => cam.id === cameraId);
    this.cameraInfo.next({
      hasMultipleCameras: this.cameras.length > 1,
      currentCamera: currentCamera?.label || 'Default Camera',
    });
  }

  private async initializeFlash(cameraId: string): Promise<void> {
    try {
      this.currentStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: cameraId } },
      });
      this.checkFlashCapability();
    } catch (error) {
      console.warn('Flash initialization failed:', error);
    }
  }

  private checkFlashCapability(): void {
    if (!this.currentStream) return;

    const videoTracks = this.currentStream.getVideoTracks();
    if (videoTracks.length === 0) return;

    const videoTrack = videoTracks[0];
    if (videoTrack && 'getCapabilities' in videoTrack) {
      const capabilities = (videoTrack as any).getCapabilities();
      const available = !!capabilities.torch;
      this.flashStatus.next({ ...this.flashStatus.value, available });
    }
  }

  async toggleFlash(): Promise<void> {
    if (!this.currentStream) {
      throw new Error('No camera access');
    }

    const videoTracks = this.currentStream.getVideoTracks();
    if (videoTracks.length === 0) {
      throw new Error('No video track');
    }

    const videoTrack = videoTracks[0];

    try {
      const newState = !this.flashStatus.value.isOn;
      await videoTrack.applyConstraints({
        advanced: [{ torch: newState } as any],
      });
      this.flashStatus.next({ ...this.flashStatus.value, isOn: newState });
    } catch (error) {
      throw new Error('Flash not supported');
    }
  }

  async switchCamera(): Promise<void> {
    if (!this.cameraInfo.value.hasMultipleCameras) {
      throw new Error('Only one camera available');
    }

    this.currentCameraIndex = (this.currentCameraIndex + 1) % this.cameras.length;
    await this.stopScanner();

    // Wait before restarting
    await new Promise((resolve) => setTimeout(resolve, 500));
    await this.startScanner('barcode-scanner');
  }

  async stopScanner(): Promise<void> {
    if (this.scanner?.isScanning) {
      await this.scanner.stop();
    }
    this.cleanup();
  }

  private cleanup(): void {
    this.isScanning.next(false);
    this.flashStatus.next({ isOn: false, available: false });
    this.cameraInfo.next({ hasMultipleCameras: false, currentCamera: '' });

    if (this.currentStream) {
      this.currentStream.getTracks().forEach((track) => track.stop());
      this.currentStream = null;
    }
  }

  destroyScanner(): void {
    this.stopScanner().catch((error) => {
      console.error('Error destroying scanner:', error);
    });
  }

  // Public API
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
