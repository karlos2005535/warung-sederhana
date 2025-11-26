import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ProductService, Product } from '../../services/product.service';
import { BarcodeService } from '../../services/barcode.service';
import { Subscription } from 'rxjs';

interface ProductFormData {
  barcode: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  minStock: number;
  supplier: string;
}

interface FlashStatus {
  isOn: boolean;
  available: boolean;
}

interface CameraInfo {
  hasMultipleCameras: boolean;
  currentCamera: string;
}

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss'],
})
export class ProductsComponent implements OnInit, OnDestroy {
  product: ProductFormData = {
    barcode: '',
    name: '',
    category: '',
    price: 0,
    stock: 0,
    minStock: 0,
    supplier: '',
  };

  categories: string[] = [
    'Makanan Instan',
    'Minuman',
    'Snack',
    'Bahan Pokok',
    'Kebutuhan Rumah Tangga',
    'Personal Care',
    'Lainnya',
  ];

  isScanning: boolean = false;
  isFlashOn: boolean = false;
  flashAvailable: boolean = false;
  hasMultipleCameras: boolean = false;
  currentCamera: string = 'Kamera Belakang';
  scanError: string = '';

  private subscriptions: Subscription[] = [];

  constructor(
    private router: Router,
    private productService: ProductService,
    private barcodeService: BarcodeService
  ) {}

  ngOnInit(): void {
    this.setupSubscriptions();
  }

  private setupSubscriptions(): void {
    this.subscriptions.push(
      this.barcodeService.getBarcodeResult().subscribe((barcode: string) => {
        this.handleBarcodeResult(barcode);
      }),

      this.barcodeService.getScanningStatus().subscribe((scanning: boolean) => {
        this.isScanning = scanning;
      }),

      this.barcodeService.getFlashStatus().subscribe((flashStatus: FlashStatus) => {
        this.isFlashOn = flashStatus.isOn;
        this.flashAvailable = flashStatus.available;
      }),

      this.barcodeService.getCameraInfo().subscribe((cameraInfo: CameraInfo) => {
        this.hasMultipleCameras = cameraInfo.hasMultipleCameras;
        this.currentCamera = cameraInfo.currentCamera;
      })
    );
  }

  private handleBarcodeResult(barcode: string): void {
    this.product.barcode = barcode;
    this.checkExistingProduct(barcode);
  }

  async toggleScanner(): Promise<void> {
    if (this.isScanning) {
      await this.barcodeService.stopScanner();
      this.isFlashOn = false;
    } else {
      try {
        await this.barcodeService.startScanner('barcode-scanner');
        this.scanError = '';
      } catch (error) {
        console.error('Scanner error:', error);
        this.scanError = 'Gagal mengakses kamera. Pastikan kamera tersedia dan diizinkan.';
        this.clearErrorAfterTimeout();
      }
    }
  }

  async toggleFlash(): Promise<void> {
    try {
      await this.barcodeService.toggleFlash();
    } catch (error) {
      console.error('Flash error:', error);
      this.scanError = 'Flash tidak tersedia pada perangkat ini';
      this.clearErrorAfterTimeout();
    }
  }

  async switchCamera(): Promise<void> {
    try {
      await this.barcodeService.switchCamera();
    } catch (error) {
      console.error('Camera switch error:', error);
      this.scanError = 'Gagal mengganti kamera';
      this.clearErrorAfterTimeout();
    }
  }

  private clearErrorAfterTimeout(): void {
    setTimeout(() => {
      this.scanError = '';
    }, 3000);
  }

  checkExistingProduct(barcode: string): void {
    const existingProduct = this.productService.getProductByBarcode(barcode);
    if (existingProduct) {
      this.scanError = `Barcode sudah terdaftar: ${existingProduct.name}`;
    } else {
      this.scanError = 'Barcode berhasil di-scan! Silakan lengkapi data produk.';
      this.clearSuccessMessageAfterTimeout();
    }
  }

  private clearSuccessMessageAfterTimeout(): void {
    setTimeout(() => {
      if (this.scanError.includes('berhasil')) {
        this.scanError = '';
      }
    }, 3000);
  }

  onBarcodeInput(): void {
    if (this.product.barcode) {
      this.checkExistingProduct(this.product.barcode);
    } else {
      this.scanError = '';
    }
  }

  manualBarcodeEntry(): void {
    if (!this.product.barcode) {
      this.scanError = 'Barcode harus diisi';
      return;
    }
    this.checkExistingProduct(this.product.barcode);
  }

  onSubmit(event: Event): void {
    event.preventDefault();

    if (!this.validateForm()) {
      return;
    }

    // Convert ProductFormData to Product (without id and createdAt)
    const productData: Omit<Product, 'id' | 'createdAt'> = {
      barcode: this.product.barcode,
      name: this.product.name,
      category: this.product.category,
      price: this.product.price,
      stock: this.product.stock,
      minStock: this.product.minStock,
      supplier: this.product.supplier,
    };

    const success = this.productService.addProduct(productData);
    if (success) {
      alert('Produk berhasil ditambahkan!');
      this.resetForm();
      this.router.navigate(['/products-list']);
    } else {
      alert('Gagal menambahkan produk. Barcode mungkin sudah terdaftar.');
    }
  }

  validateForm(): boolean {
    if (!this.product.barcode.trim()) {
      alert('Barcode harus diisi');
      return false;
    }

    if (!this.product.name.trim()) {
      alert('Nama produk harus diisi');
      return false;
    }

    if (this.product.price <= 0) {
      alert('Harga harus lebih dari 0');
      return false;
    }

    if (this.product.stock < 0) {
      alert('Stok tidak boleh negatif');
      return false;
    }

    const existingProduct = this.productService.getProductByBarcode(this.product.barcode);
    if (existingProduct) {
      alert(`Barcode sudah terdaftar untuk produk: ${existingProduct.name}`);
      return false;
    }

    return true;
  }

  resetForm(): void {
    this.product = {
      barcode: '',
      name: '',
      category: '',
      price: 0,
      stock: 0,
      minStock: 0,
      supplier: '',
    };
    this.scanError = '';
    this.isFlashOn = false;
    this.barcodeService
      .stopScanner()
      .catch((error) => console.error('Error stopping scanner during reset:', error));
  }

  goToProductsList(): void {
    this.router.navigate(['/products-list']);
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  getMessageClass(): string {
    if (
      this.scanError.includes('Gagal') ||
      this.scanError.includes('sudah') ||
      this.scanError.includes('tidak tersedia')
    ) {
      return 'message error-message';
    } else if (this.scanError.includes('berhasil')) {
      return 'message success-message';
    }
    return 'message';
  }

  ngOnDestroy(): void {
    this.barcodeService.destroyScanner();
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
