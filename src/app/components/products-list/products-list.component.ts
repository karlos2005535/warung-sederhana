import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { WarungService } from '../../services/warung.service';

@Component({
  selector: 'app-products-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './products-list.component.html',
  styleUrls: ['./products-list.component.scss'],
})
export class ProductsListComponent implements OnInit {
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
  selectedProduct: any = null;
  restockQuantity: number = 0;

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

  constructor(private warungService: WarungService, private router: Router) {}

  ngOnInit() {
    this.loadProducts();
    this.loadCategories();
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
