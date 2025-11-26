// dashboard.component.ts (tidak ada perubahan signifikan pada logic)
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { ProductService } from '../../services/product.service';
import { WarungService } from '../../services/warung.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  currentUser: any = null;
  isMenuOpen = false;
  currentDate: Date = new Date();
  stockFilter: string = 'all';

  menuItems = [
    {
      title: 'Tambah Barang',
      description: 'Tambah produk baru dengan scan barcode',
      icon: '📦',
      route: '/products',
    },
    {
      title: 'Daftar Barang',
      description: 'Lihat dan kelola semua produk',
      icon: '📋',
      route: '/products-list',
    },
    {
      title: 'POS Kasir',
      description: 'Lakukan transaksi penjualan',
      icon: '💰',
      route: '/pos',
    },
    {
      title: 'Kelola Piutang',
      description: 'Kelola piutang pelanggan',
      icon: '📝',
      route: '/debts',
    },
    {
      title: 'Kelola Kategori',
      description: 'Kelola kategori produk',
      icon: '🏷️',
      route: '/categories',
    },
    {
      title: 'Laporan',
      description: 'Lihat laporan penjualan dan stok',
      icon: '📊',
      route: '/reports',
    },
  ];

  salesReport = {
    todaySales: 0,
    monthlySales: 0,
    totalProducts: 0,
    lowStockItems: 0,
    inventoryValue: 0,
  };

  stockData: any[] = [];

  constructor(
    private router: Router,
    private authService: AuthService,
    private productService: ProductService,
    private warungService: WarungService
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    if (!this.currentUser) {
      this.router.navigate(['/login']);
    }
    this.loadDashboardData();
  }

  loadDashboardData() {
    const products = this.warungService.getProducts();

    this.salesReport.totalProducts = products.length;
    this.salesReport.lowStockItems = this.warungService.getLowStockProducts().length;
    this.salesReport.inventoryValue = this.warungService.getTotalInventoryValue();
    this.salesReport.todaySales = this.warungService.getTodaySales();
    this.salesReport.monthlySales = this.warungService.getMonthlySales();

    this.stockData = products.map((product) => ({
      id: product.id,
      name: product.name,
      stock: product.stock,
      minStock: product.minStock || 5,
      category: product.category,
      price: product.price,
    }));
  }

  setStockFilter(filter: string) {
    this.stockFilter = filter;
  }

  getFilteredStock() {
    switch (this.stockFilter) {
      case 'low':
        return this.stockData.filter(
          (item) => item.stock > 0 && item.stock <= (item.minStock || 5)
        );
      case 'out':
        return this.stockData.filter((item) => item.stock === 0);
      default:
        return this.stockData;
    }
  }

  getLowStockCount(): number {
    return this.stockData.filter((item) => item.stock > 0 && item.stock <= (item.minStock || 5))
      .length;
  }

  getOutOfStockCount(): number {
    return this.stockData.filter((item) => item.stock === 0).length;
  }

  getStockStatus(stock: number, minStock: number = 5): string {
    if (stock === 0) return 'out-of-stock';
    if (stock <= minStock) return 'low-stock';
    return 'normal';
  }

  getStockText(stock: number, minStock: number = 5): string {
    if (stock === 0) return 'Habis';
    if (stock <= minStock) return 'Rendah';
    return 'Normal';
  }

  getSalesGrowth(): number {
    return 12;
  }

  getDaysInMonth(): number {
    return new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0).getDate();
  }

  getTotalCategories(): number {
    return this.warungService.getCategories().length;
  }

  getActiveDebtsCount(): number {
    return this.warungService.getActiveDebts().length;
  }

  getRecentSales() {
    const sales = this.warungService.getSales();
    const today = new Date().toDateString();
    return sales
      .filter((sale) => new Date(sale.date).toDateString() === today)
      .slice(0, 5)
      .reverse();
  }

  quickRestock(product: any) {
    const quantity = prompt(
      `Restock ${product.name}\nStok saat ini: ${product.stock} pcs\nMasukkan jumlah tambahan:`,
      '10'
    );
    if (quantity && !isNaN(Number(quantity)) && Number(quantity) > 0) {
      this.warungService.increaseProductStock(product.id, Number(quantity));
      this.loadDashboardData();
      alert(`Stok ${product.name} berhasil ditambahkan ${quantity} pcs!`);
    }
  }

  navigateToProduct(productId: number) {
    this.router.navigate(['/products-list']);
  }

  refreshData() {
    this.loadDashboardData();
    alert('Data dashboard telah diperbarui!');
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
    this.isMenuOpen = false;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
