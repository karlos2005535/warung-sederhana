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
  // Data user yang sedang login
  currentUser: any = null;
  // Status untuk toggle menu sidebar
  isMenuOpen = false;
  // Tanggal saat ini untuk berbagai keperluan
  currentDate: Date = new Date();
  // Filter untuk data stok (all, low, out)
  stockFilter: string = 'all';

  // Menu items untuk sidebar navigation
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

  // Data untuk laporan dashboard
  salesReport = {
    todaySales: 0, // Total penjualan hari ini
    monthlySales: 0, // Total penjualan bulan ini
    totalProducts: 0, // Jumlah total produk
    lowStockItems: 0, // Jumlah item stok rendah
    inventoryValue: 0, // Total nilai inventory
  };

  // Data stok produk
  stockData: any[] = [];

  constructor(
    private router: Router,
    private authService: AuthService,
    private productService: ProductService,
    private warungService: WarungService
  ) {}

  /**
   * Lifecycle hook yang dijalankan saat komponen diinisialisasi
   * Mengecek auth user dan memuat data dashboard
   */
  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    // Redirect ke login jika user tidak terautentikasi
    if (!this.currentUser) {
      this.router.navigate(['/login']);
    }
    this.loadDashboardData();
  }

  /**
   * Memuat semua data yang diperlukan untuk dashboard
   * Termasuk data produk, laporan penjualan, dan data stok
   */
  loadDashboardData() {
    // mengambil data dari untuk html
    const products = this.warungService.getProducts();

    // Update sales report dengan data terbaru
    this.salesReport.totalProducts = products.length;
    this.salesReport.lowStockItems = this.warungService.getLowStockProducts().length;
    this.salesReport.inventoryValue = this.warungService.getTotalInventoryValue();

    // Data penjualan dari service
    this.salesReport.todaySales = this.warungService.getTodaySales();
    this.salesReport.monthlySales = this.warungService.getMonthlySales();

    // Mapping data stok untuk ditampilkan di dashboard
    this.stockData = products.map((product) => ({
      id: product.id,
      name: product.name,
      stock: product.stock,
      minStock: product.minStock || 5, // Default minStock 5 jika tidak ada
      category: product.category,
      price: product.price,
    }));
  }

  /**
   * Mengatur filter untuk data stok
   * @param filter - Jenis filter: 'all', 'low', 'out'
   */
  setStockFilter(filter: string) {
    this.stockFilter = filter;
  }

  /**
   * Mendapatkan data stok yang sudah difilter
   * @returns Array produk yang sudah difilter berdasarkan stockFilter
   */
  getFilteredStock() {
    switch (this.stockFilter) {
      case 'low': // Stok rendah (di atas 0 tapi <= minStock)
        return this.stockData.filter(
          (item) => item.stock > 0 && item.stock <= (item.minStock || 5)
        );
      case 'out': // Stok habis (stok = 0)
        return this.stockData.filter((item) => item.stock === 0);
      default: // Semua stok
        return this.stockData;
    }
  }

  /**
   * Menghitung jumlah produk dengan stok rendah
   * @returns Number - Jumlah produk stok rendah
   */
  getLowStockCount(): number {
    return this.stockData.filter((item) => item.stock > 0 && item.stock <= (item.minStock || 5))
      .length;
  }

  /**
   * Menghitung jumlah produk yang stoknya habis
   * @returns Number - Jumlah produk stok habis
   */
  getOutOfStockCount(): number {
    return this.stockData.filter((item) => item.stock === 0).length;
  }

  /**
   * Mendapatkan status stok untuk styling CSS
   * @param stock - Jumlah stok saat ini
   * @param minStock - Stok minimum (default: 5)
   * @returns String - CSS class untuk status stok
   */
  getStockStatus(stock: number, minStock: number = 5): string {
    if (stock === 0) return 'out-of-stock';
    if (stock <= minStock) return 'low-stock';
    return 'normal';
  }

  /**
   * Mendapatkan teks status stok untuk ditampilkan
   * @param stock - Jumlah stok saat ini
   * @param minStock - Stok minimum (default: 5)
   * @returns String - Teks status stok
   */
  getStockText(stock: number, minStock: number = 5): string {
    if (stock === 0) return 'Habis';
    if (stock <= minStock) return 'Rendah';
    return 'Normal';
  }

  /**
   * Mendapatkan persentase growth penjualan (simulasi)
   * @returns Number - Persentase growth penjualan
   */
  getSalesGrowth(): number {
    // Simulasi growth - dalam implementasi real, hitung dari data historis
    return 12; // 12% growth
  }

  /**
   * Mendapatkan jumlah hari dalam bulan berjalan
   * @returns Number - Jumlah hari dalam bulan ini
   */
  getDaysInMonth(): number {
    return new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0).getDate();
  }

  /**
   * Mendapatkan total kategori produk
   * @returns Number - Jumlah kategori
   */
  getTotalCategories(): number {
    return this.warungService.getCategories().length;
  }

  /**
   * Mendapatkan jumlah piutang aktif
   * @returns Number - Jumlah piutang yang masih aktif
   */
  getActiveDebtsCount(): number {
    return this.warungService.getActiveDebts().length;
  }

  /**
   * Mendapatkan 5 penjualan terbaru hari ini
   * @returns Array - Data penjualan terbaru
   */
  getRecentSales() {
    const sales = this.warungService.getSales();
    // Filter penjualan hari ini dan ambil 5 terbaru
    const today = new Date().toDateString();
    return sales
      .filter((sale) => new Date(sale.date).toDateString() === today)
      .slice(0, 5)
      .reverse(); // Urutkan dari yang terbaru
  }

  /**
   * Fungsi quick action untuk restock produk
   * @param product - Produk yang akan di-restock
   */
  quickRestock(product: any) {
    const quantity = prompt(
      `Restock ${product.name}\nStok saat ini: ${product.stock} pcs\nMasukkan jumlah tambahan:`,
      '10'
    );
    if (quantity && !isNaN(Number(quantity)) && Number(quantity) > 0) {
      this.warungService.increaseProductStock(product.id, Number(quantity));
      this.loadDashboardData(); // Refresh data setelah restock
      alert(`Stok ${product.name} berhasil ditambahkan ${quantity} pcs!`);
    }
  }

  /**
   * Navigasi ke halaman daftar produk
   * @param productId - ID produk (tidak digunakan saat ini)
   */
  navigateToProduct(productId: number) {
    this.router.navigate(['/products-list']);
  }

  /**
   * Refresh data dashboard manual
   */
  refreshData() {
    this.loadDashboardData();
    alert('Data dashboard telah diperbarui!');
  }

  /**
   * Toggle menu sidebar (show/hide)
   */
  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  /**
   * Navigasi ke route tertentu dan tutup menu
   * @param route - Path tujuan navigasi
   */
  navigateTo(route: string) {
    this.router.navigate([route]);
    this.isMenuOpen = false; // Tutup menu setelah navigasi
  }

  /**
   * Logout user dan redirect ke halaman login
   */
  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
