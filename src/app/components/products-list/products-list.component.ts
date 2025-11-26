import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { WarungService } from '../../services/warung.service';
import { BarcodeService } from '../../services/barcode.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-products-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './products-list.component.html',
  styleUrls: ['./products-list.component.scss'],
})
export class ProductsListComponent implements OnInit, OnDestroy {
  products: any[] = [];
  filteredProducts: any[] = [];
  categories: string[] = [];

  searchTerm: string = '';
  selectedCategory: string = '';
  stockFilter: string = 'all';

  // Stats
  totalProducts: number = 0;
  lowStockProducts: number = 0;
  outOfStockProducts: number = 0;
  totalInventoryValue: number = 0;

  // Modals
  showRestock: boolean = false;
  showEdit: boolean = false;
  showBarcodeScanner: boolean = false;
  selectedProduct: any = null;
  restockQuantity: number = 0;

  // Barcode scanning
  isScanning: boolean = false;
  scanError: string = '';
  private barcodeSubscription!: Subscription;

  // Edit form
  editProductForm: any = {
    id: 0,
    name: '',
    barcode: '',
    category: '',
    price: 0,
    stock: 0,
    minStock: 0,
    supplier: '',
  };

  constructor(
    private warungService: WarungService,
    private router: Router,
    private barcodeService: BarcodeService
  ) {}

  ngOnInit() {
    this.loadProducts();
    this.loadCategories();
    this.setupBarcodeListener();
  }

  ngOnDestroy() {
    if (this.barcodeSubscription) {
      this.barcodeSubscription.unsubscribe();
    }
    this.stopBarcodeScanner();
  }

  setupBarcodeListener() {
    this.barcodeSubscription = this.barcodeService.getBarcodeResult().subscribe((barcode) => {
      if (barcode) {
        this.handleScannedBarcode(barcode);
      }
    });
  }

  loadProducts() {
    this.products = this.warungService.getProducts();
    this.filteredProducts = [...this.products];
    this.calculateStats();
    this.filterProducts();
  }

  loadCategories() {
    const categories = this.warungService.getCategories();
    this.categories = categories.map((cat: any) => cat.name);
  }

  calculateStats() {
    this.totalProducts = this.products.length;
    this.lowStockProducts = this.products.filter((p) => p.stock > 0 && p.stock <= 5).length;
    this.outOfStockProducts = this.products.filter((p) => p.stock === 0).length;
    this.totalInventoryValue = this.products.reduce(
      (total, product) => total + product.price * product.stock,
      0
    );
  }

  filterProducts() {
    this.filteredProducts = this.products.filter((product) => {
      // Filter by search term
      const matchesSearch =
        !this.searchTerm ||
        product.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        product.barcode.toLowerCase().includes(this.searchTerm.toLowerCase());

      // Filter by category
      const matchesCategory = !this.selectedCategory || product.category === this.selectedCategory;

      // Filter by stock
      let matchesStock = true;
      switch (this.stockFilter) {
        case 'low':
          matchesStock = product.stock > 0 && product.stock <= (product.minStock || 5);
          break;
        case 'out':
          matchesStock = product.stock === 0;
          break;
        case 'available':
          matchesStock = product.stock > 0;
          break;
      }

      return matchesSearch && matchesCategory && matchesStock;
    });
  }

  // Barcode Scanning Methods
  async startBarcodeScanner() {
    try {
      this.scanError = '';
      this.showBarcodeScanner = true;

      // Delay to ensure modal is rendered
      setTimeout(async () => {
        try {
          await this.barcodeService.startScanner('barcode-scanner-container');
          this.isScanning = true;
        } catch (error) {
          console.error('Scanner error:', error);
          this.scanError = 'Gagal mengakses kamera. Pastikan Anda memberikan izin akses kamera.';
          this.isScanning = false;
        }
      }, 300);
    } catch (error) {
      console.error('Scanner initialization error:', error);
      this.scanError = 'Tidak dapat mengakses kamera. Periksa izin perangkat Anda.';
      this.isScanning = false;
    }
  }

  async stopBarcodeScanner() {
    try {
      await this.barcodeService.stopScanner();
      this.isScanning = false;
      this.showBarcodeScanner = false;
      this.scanError = '';
    } catch (error) {
      console.error('Error stopping scanner:', error);
    }
  }

  handleScannedBarcode(barcode: string) {
    console.log('Barcode scanned:', barcode);

    // Search for the product by barcode
    this.searchTerm = barcode;
    this.filterProducts();

    // Close scanner after successful scan
    this.stopBarcodeScanner();

    // If no products found, show message
    if (this.filteredProducts.length === 0) {
      setTimeout(() => {
        alert(
          `Produk dengan barcode "${barcode}" tidak ditemukan. Anda dapat menambahkannya sebagai produk baru.`
        );
      }, 500);
    }
  }

  manualBarcodeSearch() {
    const barcode = prompt('Masukkan kode barcode:');
    if (barcode && barcode.trim()) {
      this.searchTerm = barcode.trim();
      this.filterProducts();
    }
  }

  getStockStatusClass(product: any): string {
    if (product.stock === 0) return 'out-of-stock';
    if (product.stock <= (product.minStock || 5)) return 'low-stock';
    return 'normal';
  }

  getStockText(product: any): string {
    if (product.stock === 0) return 'Habis';
    if (product.stock <= (product.minStock || 5)) return 'Rendah';
    return 'Normal';
  }

  editProduct(product: any) {
    this.selectedProduct = product;
    this.editProductForm = {
      id: product.id,
      name: product.name,
      barcode: product.barcode,
      category: product.category,
      price: product.price,
      stock: product.stock,
      minStock: product.minStock || 0,
      supplier: product.supplier || '',
    };
    this.showEdit = true;
  }

  updateProduct() {
    if (this.validateEditForm()) {
      const success = this.warungService.updateProduct(
        this.editProductForm.id,
        this.editProductForm
      );
      if (success) {
        this.loadProducts();
        this.showEdit = false;
        this.selectedProduct = null;
        alert('Produk berhasil diperbarui!');
      } else {
        alert('Gagal memperbarui produk. Barcode mungkin sudah digunakan produk lain.');
      }
    }
  }

  validateEditForm(): boolean {
    if (!this.editProductForm.name.trim()) {
      alert('Nama produk harus diisi');
      return false;
    }
    if (!this.editProductForm.barcode.trim()) {
      alert('Barcode harus diisi');
      return false;
    }
    if (this.editProductForm.price <= 0) {
      alert('Harga harus lebih dari 0');
      return false;
    }
    if (this.editProductForm.stock < 0) {
      alert('Stok tidak boleh negatif');
      return false;
    }
    return true;
  }

  deleteProduct(productId: number) {
    if (confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
      this.warungService.deleteProduct(productId);
      this.loadProducts();
      alert('Produk berhasil dihapus!');
    }
  }

  showRestockModal(product: any) {
    this.selectedProduct = product;
    this.restockQuantity = 0;
    this.showRestock = true;
  }

  cancelRestock() {
    this.showRestock = false;
    this.selectedProduct = null;
    this.restockQuantity = 0;
  }

  cancelEdit() {
    this.showEdit = false;
    this.selectedProduct = null;
    this.editProductForm = {
      id: 0,
      name: '',
      barcode: '',
      category: '',
      price: 0,
      stock: 0,
      minStock: 0,
      supplier: '',
    };
  }

  confirmRestock() {
    if (this.restockQuantity > 0 && this.selectedProduct) {
      const newStock = this.selectedProduct.stock + this.restockQuantity;
      this.warungService.updateProductStock(this.selectedProduct.id, newStock);
      this.loadProducts();
      this.showRestock = false;
      this.selectedProduct = null;
      this.restockQuantity = 0;
      alert(`Stok berhasil ditambahkan! Stok sekarang: ${newStock} pcs`);
    } else {
      alert('Masukkan jumlah stok yang valid');
    }
  }

  quickRestock(product: any, quantity: number = 10) {
    if (confirm(`Tambahkan ${quantity} pcs ke stok ${product.name}?`)) {
      const newStock = product.stock + quantity;
      this.warungService.updateProductStock(product.id, newStock);
      this.loadProducts();
      alert(`Stok ${product.name} berhasil ditambahkan ${quantity} pcs!`);
    }
  }

  exportProducts() {
    const dataStr = JSON.stringify(this.products, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `products-export-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    alert('Data produk berhasil diexport!');
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }

  goToAddProduct() {
    this.router.navigate(['/products']);
  }

  // Utility methods for template
  getProductCategories(): string[] {
    return [...new Set(this.products.map((p) => p.category).filter(Boolean))];
  }
}
