import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class BarcodeService {
  private html5QrcodeScanner: any;
  private isScanning = new BehaviorSubject<boolean>(false);
  private barcodeResult = new BehaviorSubject<string>('');
  private flashStatus = new BehaviorSubject<{ isOn: boolean; available: boolean }>({
    isOn: false,
    available: false,
  });
  private cameraInfo = new BehaviorSubject<{ hasMultipleCameras: boolean; currentCamera: string }>({
    hasMultipleCameras: false,
    currentCamera: '',
  });

  private currentStream: MediaStream | null = null;
  private cameras: any[] = [];
  private currentCameraIndex = 0;

  constructor() {}

  async startScanner(containerId: string): Promise<void> {
    try {
      const containerElement = document.getElementById(containerId);
      if (!containerElement) {
        throw new Error(`Container with id '${containerId}' not found`);
      }

      // Dynamically import html5-qrcode to avoid type issues
      const { Html5Qrcode } = await import('html5-qrcode');
      this.html5QrcodeScanner = new Html5Qrcode(containerId);

      this.cameras = await Html5Qrcode.getCameras();
      if (this.cameras.length === 0) {
        throw new Error('No cameras found. Please check camera permissions.');
      }

      console.log('Available cameras:', this.cameras);

      // Prioritize back camera
      this.currentCameraIndex = this.cameras.findIndex(
        (cam: any) =>
          cam.label.toLowerCase().includes('back') || cam.label.toLowerCase().includes('rear')
      );
      if (this.currentCameraIndex === -1) {
        this.currentCameraIndex = 0;
      }

      const config = {
        fps: 15,
        qrbox: { width: 300, height: 100 },
        formatsToSupport: [
          'CODE_128',
          'CODE_39',
          'CODE_93',
          'EAN_13',
          'EAN_8',
          'UPC_A',
          'UPC_E',
          'QR_CODE',
        ],
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true,
        },
      };

      const successCallback = (decodedText: string, decodedResult: any) => {
        console.log('Scan result:', decodedText, decodedResult);
        this.barcodeResult.next(decodedText);
        this.stopScanner();
      };

      const errorCallback = (error: string) => {
        if (!error.includes('NotFoundException')) {
          console.log(`Scan error: ${error}`);
        }
      };

      const cameraId = this.cameras[this.currentCameraIndex].id;
      await this.html5QrcodeScanner.start(cameraId, config, successCallback, errorCallback);

      this.isScanning.next(true);
      this.updateCameraInfo();

      // Get the video stream for flash control
      await this.getVideoStream(cameraId);
    } catch (error) {
      console.error('Error starting scanner:', error);
      this.isScanning.next(false);
      throw error;
    }
  }

  private async getVideoStream(cameraId: string): Promise<void> {
    try {
      const constraints = {
        video: {
          deviceId: cameraId ? { exact: cameraId } : undefined,
          facingMode: { ideal: 'environment' },
        },
      };

      this.currentStream = await navigator.mediaDevices.getUserMedia(constraints);
      this.checkFlashAvailability();
    } catch (error) {
      console.error('Error getting video stream:', error);
    }
  }

  async switchCamera(): Promise<void> {
    if (this.cameras.length <= 1) {
      throw new Error('Only one camera available');
    }

    this.currentCameraIndex = (this.currentCameraIndex + 1) % this.cameras.length;

    if (this.html5QrcodeScanner && this.html5QrcodeScanner.isScanning) {
      await this.stopScanner();
      // Tunggu sebentar sebelum restart
      setTimeout(async () => {
        await this.startScanner('barcode-scanner');
      }, 500);
    }
  }

  checkFlashAvailability(): void {
    if (!this.currentStream) {
      this.flashStatus.next({ isOn: false, available: false });
      return;
    }

    const videoTrack = this.currentStream.getVideoTracks()[0];
    if (videoTrack && 'getCapabilities' in videoTrack) {
      const capabilities = (videoTrack as any).getCapabilities();
      const available = capabilities.torch || capabilities.focusDistance;
      this.flashStatus.next({ isOn: false, available: !!available });
    } else {
      this.flashStatus.next({ isOn: false, available: false });
    }
  }

  async toggleFlash(): Promise<void> {
    if (!this.currentStream) {
      throw new Error('No camera stream available');
    }

    const videoTrack = this.currentStream.getVideoTracks()[0];
    if (!videoTrack) {
      throw new Error('No video track available');
    }

    try {
      if ('getCapabilities' in videoTrack) {
        const capabilities = (videoTrack as any).getCapabilities();

        if (capabilities.torch) {
          const currentStatus = this.flashStatus.value.isOn;
          await (videoTrack as any).applyConstraints({
            advanced: [{ torch: !currentStatus } as any],
          });
          this.flashStatus.next({ ...this.flashStatus.value, isOn: !currentStatus });
        } else {
          throw new Error('Flash not supported on this device');
        }
      } else {
        throw new Error('Flash API not supported on this browser');
      }
    } catch (error) {
      console.error('Error toggling flash:', error);
      throw error;
    }
  }

  private updateCameraInfo(): void {
    const currentCamera = this.cameras[this.currentCameraIndex];
    this.cameraInfo.next({
      hasMultipleCameras: this.cameras.length > 1,
      currentCamera: currentCamera?.label || `Kamera ${this.currentCameraIndex + 1}`,
    });
  }

  stopScanner(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.html5QrcodeScanner && this.html5QrcodeScanner.isScanning) {
        this.html5QrcodeScanner
          .stop()
          .then(() => {
            this.isScanning.next(false);
            this.flashStatus.next({ isOn: false, available: false });
            this.cameraInfo.next({ hasMultipleCameras: false, currentCamera: '' });

            if (this.currentStream) {
              this.currentStream.getTracks().forEach((track) => track.stop());
              this.currentStream = null;
            }

            console.log('Scanner stopped successfully');
            resolve();
          })
          .catch((error: any) => {
            console.error('Error stopping scanner:', error);
            this.isScanning.next(false);
            this.flashStatus.next({ isOn: false, available: false });
            reject(error);
          });
      } else {
        resolve();
      }
    });
  }

  destroyScanner(): void {
    this.stopScanner().catch((error) => {
      console.error('Error destroying scanner:', error);
    });
  }

  // Public observable getters
  getBarcodeResult(): Observable<string> {
    return this.barcodeResult.asObservable();
  }

  getScanningStatus(): Observable<boolean> {
    return this.isScanning.asObservable();
  }

  getFlashStatus(): Observable<{ isOn: boolean; available: boolean }> {
    return this.flashStatus.asObservable();
  }

  getCameraInfo(): Observable<{ hasMultipleCameras: boolean; currentCamera: string }> {
    return this.cameraInfo.asObservable();
  }

  async restartScanner(containerId: string): Promise<void> {
    await this.stopScanner();
    // Tunggu sebentar sebelum restart
    setTimeout(async () => {
      await this.startScanner(containerId);
    }, 500);
  }
}
