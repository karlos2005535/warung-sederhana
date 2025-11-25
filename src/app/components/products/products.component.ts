import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ProductService, Product } from '../../services/product.service';
import { BarcodeService } from '../../services/barcode.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss'],
})
export class ProductsComponent implements OnInit, OnDestroy {
  product: {
    barcode: string;
    name: string;
    category: string;
    price: number;
    stock: number;
    minStock: number;
    supplier: string;
  } = {
    barcode: '',
    name: '',
    category: '',
    price: 0,
    stock: 0,
    minStock: 0,
    supplier: '',
  };

  categories = [
    'Makanan Instan',
    'Minuman',
    'Snack',
    'Bahan Pokok',
    'Kebutuhan Rumah Tangga',
    'Personal Care',
    'Lainnya',
  ];

  isScanning = false;
  isFlashOn = false;
  flashAvailable = false;
  scanError = '';
  scannerInitialized = false;
  private subscriptions: Subscription[] = [];

  constructor(
    private router: Router,
    private productService: ProductService,
    private barcodeService: BarcodeService
  ) {}

  ngOnInit() {
    this.subscriptions.push(
      this.barcodeService.getBarcodeResult().subscribe((barcode) => {
        this.product.barcode = barcode;
        this.checkExistingProduct(barcode);
      }),
      this.barcodeService.getScanningStatus().subscribe((scanning) => {
        this.isScanning = scanning;
      }),
      this.barcodeService.getFlashStatus().subscribe((flashStatus) => {
        this.isFlashOn = flashStatus.isOn;
        this.flashAvailable = flashStatus.available;
      })
    );
  }

  async toggleScanner() {
    if (this.isScanning) {
      this.barcodeService.stopScanner();
      this.isFlashOn = false;
    } else {
      try {
        await this.barcodeService.startScanner('barcode-scanner');
        this.scanError = '';
        this.scannerInitialized = true;

        // Check flash availability after scanner starts
        setTimeout(() => {
          this.barcodeService.checkFlashAvailability();
        }, 1000);
      } catch (error) {
        console.error('Scanner error:', error);
        this.scanError = 'Gagal mengakses kamera. Pastikan kamera tersedia dan diizinkan.';

        // Fallback: Suggest manual input
        setTimeout(() => {
          if (this.scanError) {
            this.scanError += ' Silakan gunakan input manual.';
          }
        }, 2000);
      }
    }
  }

  async toggleFlash() {
    try {
      await this.barcodeService.toggleFlash();
    } catch (error) {
      console.error('Flash error:', error);
      this.scanError = 'Flash tidak tersedia pada perangkat ini';
      setTimeout(() => {
        this.scanError = '';
      }, 3000);
    }
  }

  checkExistingProduct(barcode: string) {
    const existingProduct = this.productService.getProductByBarcode(barcode);
    if (existingProduct) {
      this.scanError = `Barcode sudah terdaftar: ${existingProduct.name}`;
    } else {
      this.scanError = 'Barcode berhasil di-scan! Silakan lengkapi data produk.';
      setTimeout(() => {
        if (this.scanError.includes('berhasil')) {
          this.scanError = '';
        }
      }, 3000);
    }
  }

  onBarcodeInput() {
    if (this.product.barcode) {
      this.checkExistingProduct(this.product.barcode);
    } else {
      this.scanError = '';
    }
  }

  manualBarcodeEntry() {
    if (!this.product.barcode) {
      this.scanError = 'Barcode harus diisi';
      return;
    }
    this.checkExistingProduct(this.product.barcode);
  }

  onSubmit(event: Event) {
    event.preventDefault();

    if (!this.validateForm()) {
      return;
    }

    const success = this.productService.addProduct(this.product);
    if (success) {
      alert('Produk berhasil ditambahkan!');
      this.resetForm();
      this.router.navigate(['/products-list']);
    } else {
      alert('Gagal menambahkan produk. Barcode mungkin sudah terdaftar.');
    }
  }

  validateForm(): boolean {
    if (!this.product.barcode) {
      alert('Barcode harus diisi');
      return false;
    }

    if (!this.product.name) {
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

  resetForm() {
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
    this.barcodeService.stopScanner();
  }

  goToProductsList() {
    this.router.navigate(['/products-list']);
  }

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  ngOnDestroy() {
    this.barcodeService.destroyScanner();
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
