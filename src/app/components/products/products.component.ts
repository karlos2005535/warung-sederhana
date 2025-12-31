import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ProductService, Product } from '../../services/product.service';
import { BarcodeService, FlashStatus } from '../../services/barcode.service';
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

  // Variabel untuk tampilan harga (misal: "15.000")
  formattedPrice: string = '';

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
        if (barcode) this.handleBarcodeResult(barcode);
      }),
      this.barcodeService.getScanningStatus().subscribe((scanning: boolean) => {
        this.isScanning = scanning;
        if (!scanning) this.isFlashOn = false;
      }),
      this.barcodeService.getFlashStatus().subscribe((status: FlashStatus) => {
        this.isFlashOn = status.isOn;
        this.flashAvailable = status.available;
      })
    );
  }

  // --- Logic Rupiah ---
  onPriceInput(event: any): void {
    // Hapus karakter non-angka
    const rawValue = event.target.value.replace(/[^0-9]/g, '');
    // Simpan angka murni ke model
    this.product.price = rawValue ? parseInt(rawValue, 10) : 0;
    // Format tampilan dengan titik
    this.formattedPrice = rawValue ? new Intl.NumberFormat('id-ID').format(this.product.price) : '';
  }

  // --- Logic Scanner ---
  async toggleScanner(): Promise<void> {
    if (this.isScanning) {
      await this.barcodeService.stopScanner();
    } else {
      try {
        this.scanError = '';
        // ID ini harus sesuai dengan di HTML
        await this.barcodeService.startScanner('barcode-scanner');
      } catch (error) {
        console.error('Scanner error:', error);
        this.scanError = 'Gagal mengakses kamera. Izinkan akses.';
      }
    }
  }

  async toggleFlash(): Promise<void> {
    try {
      await this.barcodeService.toggleFlash();
    } catch (e) {
      console.warn(e);
    }
  }

  private handleBarcodeResult(barcode: string): void {
    this.product.barcode = barcode;
    this.checkExistingProduct(barcode);
    if (navigator.vibrate) navigator.vibrate(200);
  }

  checkExistingProduct(barcode: string): void {
    const existingProduct = this.productService.getProductByBarcode(barcode);
    if (existingProduct) {
      this.scanError = `Barcode sudah terdaftar: ${existingProduct.name}`;
    } else {
      this.scanError = 'Barcode berhasil dipindai!';
      this.clearMessageAfterTimeout();
    }
  }

  // --- Logic Form ---
  onBarcodeInput(): void {
    this.scanError = '';
  }

  manualBarcodeEntry(): void {
    if (!this.product.barcode) {
      this.scanError = 'Silakan isi barcode';
      return;
    }
    this.checkExistingProduct(this.product.barcode);
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    if (!this.validateForm()) return;

    const productData: Omit<Product, 'id' | 'createdAt'> = {
      barcode: this.product.barcode,
      name: this.product.name,
      category: this.product.category,
      price: this.product.price, // Kirim angka murni
      stock: this.product.stock,
      minStock: this.product.minStock || 0,
      supplier: this.product.supplier || '',
    };

    if (this.productService.addProduct(productData)) {
      alert(`Produk berhasil disimpan! Harga: Rp ${this.formattedPrice}`);
      this.resetForm();
      this.router.navigate(['/products-list']);
    } else {
      this.scanError = 'Gagal menyimpan. Barcode mungkin duplikat.';
    }
  }

  validateForm(): boolean {
    if (!this.product.barcode.trim()) {
      this.scanError = 'Barcode wajib diisi';
      return false;
    }
    if (!this.product.name.trim()) {
      alert('Nama produk wajib diisi');
      return false;
    }
    if (this.product.price <= 0) {
      alert('Harga harus diisi');
      return false;
    }

    const existing = this.productService.getProductByBarcode(this.product.barcode);
    if (existing) {
      this.scanError = `Barcode sudah digunakan: ${existing.name}`;
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
    this.formattedPrice = '';
    this.scanError = '';
    this.isFlashOn = false;
    this.barcodeService.stopScanner().catch((e) => console.warn(e));
  }

  private clearMessageAfterTimeout(): void {
    setTimeout(() => {
      if (this.scanError.includes('berhasil')) this.scanError = '';
    }, 3000);
  }

  getMessageClass(): string {
    if (
      this.scanError.includes('Gagal') ||
      this.scanError.includes('sudah') ||
      this.scanError.includes('wajib')
    ) {
      return 'message error-message';
    } else if (this.scanError.includes('berhasil')) {
      return 'message success-message';
    }
    return 'message';
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  ngOnDestroy(): void {
    this.barcodeService.destroyScanner();
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
