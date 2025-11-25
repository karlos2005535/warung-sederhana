import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

@Injectable({
  providedIn: 'root',
})
export class BarcodeService {
  private html5QrcodeScanner!: Html5Qrcode;
  private isScanning = new BehaviorSubject<boolean>(false);
  private barcodeResult = new BehaviorSubject<string>('');
  private flashStatus = new BehaviorSubject<{ isOn: boolean; available: boolean }>({
    isOn: false,
    available: false,
  });
  private currentStream: MediaStream | null = null;

  constructor() {}

  async startScanner(containerId: string): Promise<void> {
    try {
      const containerElement = document.getElementById(containerId);
      if (!containerElement) {
        throw new Error(`Container with id '${containerId}' not found`);
      }

      this.html5QrcodeScanner = new Html5Qrcode(containerId);

      const cameras = await Html5Qrcode.getCameras();
      if (cameras.length === 0) {
        throw new Error('No cameras found. Please check camera permissions.');
      }

      console.log('Available cameras:', cameras);

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 150 },
        formatsToSupport: [
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.CODE_93,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.QR_CODE,
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

      // Prioritize back camera
      const cameraId =
        cameras.find(
          (cam) =>
            cam.label.toLowerCase().includes('back') || cam.label.toLowerCase().includes('rear')
        )?.id || cameras[0].id;

      await this.html5QrcodeScanner.start(cameraId, config, successCallback, errorCallback);

      this.isScanning.next(true);

      // Get the video stream for flash control
      this.getVideoStream(cameraId);
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

  stopScanner(): void {
    if (this.html5QrcodeScanner && this.html5QrcodeScanner.isScanning) {
      this.html5QrcodeScanner
        .stop()
        .then(() => {
          this.isScanning.next(false);
          this.flashStatus.next({ isOn: false, available: false });

          // Stop the media stream
          if (this.currentStream) {
            this.currentStream.getTracks().forEach((track) => track.stop());
            this.currentStream = null;
          }

          console.log('Scanner stopped successfully');
        })
        .catch((error) => {
          console.error('Error stopping scanner:', error);
          this.isScanning.next(false);
          this.flashStatus.next({ isOn: false, available: false });
        });
    }
  }

  getBarcodeResult(): Observable<string> {
    return this.barcodeResult.asObservable();
  }

  getScanningStatus(): Observable<boolean> {
    return this.isScanning.asObservable();
  }

  getFlashStatus(): Observable<{ isOn: boolean; available: boolean }> {
    return this.flashStatus.asObservable();
  }

  destroyScanner(): void {
    this.stopScanner();
  }

  async restartScanner(containerId: string): Promise<void> {
    this.stopScanner();
    setTimeout(() => {
      this.startScanner(containerId);
    }, 500);
  }
}
