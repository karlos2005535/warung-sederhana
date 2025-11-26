import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class WarungService {
  private products: any[] = [];
  private categories: any[] = [];
  private debts: any[] = [];
  private sales: any[] = [];
  private refunds: any[] = []; // ✅ ARRAY BARU UNTUK PENCATATAN PENGEMBALIAN UANG

  constructor() {
    this.loadFromLocalStorage();
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    if (this.products.length === 0) {
      this.products = [
        {
          id: 1,
          name: 'Indomie Goreng',
          price: 2500,
          stock: 50,
          category: 'Makanan Instan',
          barcode: '8996001600647',
          minStock: 5,
          supplier: 'PT Indofood',
          createdAt: new Date(),
        },
        {
          id: 2,
          name: 'Aqua 600ml',
          price: 3000,
          stock: 100,
          category: 'Minuman',
          barcode: '8998866603196',
          minStock: 10,
          supplier: 'PT Aqua Golden Mississippi',
          createdAt: new Date(),
        },
        {
          id: 3,
          name: 'Chitato',
          price: 12000,
          stock: 25,
          category: 'Snack',
          barcode: '8999999533448',
          minStock: 5,
          supplier: 'PT Indofood',
          createdAt: new Date(),
        },
        {
          id: 4,
          name: 'Beras Ramos 5kg',
          price: 65000,
          stock: 15,
          category: 'Bahan Pokok',
          barcode: '8996001300159',
          minStock: 3,
          supplier: 'PT Beras Ramos',
          createdAt: new Date(),
        },
        {
          id: 5,
          name: 'Minyak Goreng Bimoli 2L',
          price: 32000,
          stock: 8,
          category: 'Bahan Pokok',
          barcode: '8991002101740',
          minStock: 5,
          supplier: 'PT Salim Ivomas',
          createdAt: new Date(),
        },
      ];
      this.saveToLocalStorage();
    }

    if (this.categories.length === 0) {
      this.categories = [
        { id: 1, name: 'Makanan Instan' },
        { id: 2, name: 'Minuman' },
        { id: 3, name: 'Snack' },
        { id: 4, name: 'Bahan Pokok' },
        { id: 5, name: 'Kebutuhan Rumah Tangga' },
        { id: 6, name: 'Personal Care' },
        { id: 7, name: 'Lainnya' },
      ];
      this.saveToLocalStorage();
    }
  }

  // ==================== LOCAL STORAGE METHODS ====================
  private saveToLocalStorage(): void {
    localStorage.setItem('warung_products', JSON.stringify(this.products));
    localStorage.setItem('warung_categories', JSON.stringify(this.categories));
    localStorage.setItem('warung_debts', JSON.stringify(this.debts));
    localStorage.setItem('warung_sales', JSON.stringify(this.sales));
    localStorage.setItem('warung_refunds', JSON.stringify(this.refunds)); // ✅ SIMPAN DATA REFUND
  }

  private loadFromLocalStorage(): void {
    try {
      const productsData = localStorage.getItem('warung_products');
      const categoriesData = localStorage.getItem('warung_categories');
      const debtsData = localStorage.getItem('warung_debts');
      const salesData = localStorage.getItem('warung_sales');
      const refundsData = localStorage.getItem('warung_refunds'); // ✅ LOAD DATA REFUND

      if (productsData) this.products = JSON.parse(productsData);
      if (categoriesData) this.categories = JSON.parse(categoriesData);
      if (debtsData) this.debts = JSON.parse(debtsData);
      if (salesData) this.sales = JSON.parse(salesData);
      if (refundsData) this.refunds = JSON.parse(refundsData);
    } catch (error) {
      console.error('Error loading data from localStorage:', error);
      this.products = [];
      this.categories = [];
      this.debts = [];
      this.sales = [];
      this.refunds = [];
    }
  }

  // ==================== PRODUCT METHODS ====================
  getProducts(): any[] {
    return this.products;
  }

  getProductByBarcode(barcode: string): any {
    return this.products.find((p) => p.barcode === barcode);
  }

  getProductById(id: number): any {
    return this.products.find((p) => p.id === id);
  }

  addProduct(product: any): boolean {
    if (this.getProductByBarcode(product.barcode)) {
      return false;
    }

    const newProduct = {
      id: Date.now(),
      ...product,
      createdAt: new Date(),
    };

    this.products.push(newProduct);
    this.saveToLocalStorage();
    return true;
  }

  updateProduct(productId: number, updatedProduct: any): boolean {
    const index = this.products.findIndex((p) => p.id === productId);
    if (index !== -1) {
      if (updatedProduct.barcode && updatedProduct.barcode !== this.products[index].barcode) {
        const existingProduct = this.getProductByBarcode(updatedProduct.barcode);
        if (existingProduct && existingProduct.id !== productId) {
          return false;
        }
      }

      this.products[index] = {
        ...this.products[index],
        ...updatedProduct,
        updatedAt: new Date(),
      };
      this.saveToLocalStorage();
      return true;
    }
    return false;
  }

  deleteProduct(productId: number): void {
    this.products = this.products.filter((p) => p.id !== productId);
    this.saveToLocalStorage();
  }

  updateProductStock(productId: number, newStock: number): void {
    const product = this.products.find((p) => p.id === productId);
    if (product) {
      product.stock = newStock;
      product.updatedAt = new Date();
      this.saveToLocalStorage();
    }
  }

  increaseProductStock(productId: number, quantity: number): void {
    const product = this.products.find((p) => p.id === productId);
    if (product) {
      product.stock += quantity;
      product.updatedAt = new Date();
      this.saveToLocalStorage();
    }
  }

  // ==================== CATEGORY METHODS ====================
  getCategories() {
    return this.categories;
  }

  addCategory(name: string) {
    const newCategory = {
      id: Date.now(),
      name: name.trim(),
      createdAt: new Date(),
    };
    this.categories.push(newCategory);
    this.saveToLocalStorage();
  }

  deleteCategory(categoryId: number): void {
    this.categories = this.categories.filter((c) => c.id !== categoryId);
    this.saveToLocalStorage();
  }

  updateCategory(categoryId: number, newName: string): boolean {
    const category = this.categories.find((c) => c.id === categoryId);
    if (category) {
      category.name = newName.trim();
      category.updatedAt = new Date();
      this.saveToLocalStorage();
      return true;
    }
    return false;
  }

  // ==================== DEBT METHODS ====================
  getDebts() {
    return this.debts;
  }

  addDebt(debt: any) {
    const newDebt = {
      ...debt,
      id: Date.now(),
      date: new Date(),
      paid: false,
    };
    this.debts.push(newDebt);
    this.saveToLocalStorage();
  }

  markDebtPaid(id: number) {
    const debt = this.debts.find((d) => d.id === id);
    if (debt) {
      debt.paid = true;
      debt.paidDate = new Date();
      this.saveToLocalStorage();
    }
  }

  deleteDebt(id: number) {
    this.debts = this.debts.filter((d) => d.id !== id);
    this.saveToLocalStorage();
  }

  getActiveDebts() {
    return this.debts.filter((debt) => !debt.paid);
  }

  getTotalActiveDebts(): number {
    return this.getActiveDebts().reduce((total, debt) => total + debt.amount, 0);
  }

  // ==================== SALES & REFUND METHODS ====================
  updateStock(productId: number, quantity: number) {
    const product = this.products.find((p) => p.id === productId);
    if (product) {
      product.stock -= quantity;
      product.updatedAt = new Date();
      this.saveToLocalStorage();
    }
  }

  addSale(sale: any) {
    const newSale = {
      ...sale,
      id: Date.now(),
      date: new Date(),
      status: 'completed',
    };
    this.sales.push(newSale);
    this.saveToLocalStorage();
  }

  getSales(): any[] {
    return this.sales;
  }

  // ✅ METHOD PENGEMBALIAN STOK
  returnStock(productId: number, quantity: number) {
    const product = this.products.find((p) => p.id === productId);
    if (product) {
      product.stock += quantity;
      product.updatedAt = new Date();
      this.saveToLocalStorage();
    }
  }

  // ✅ METHOD PENCATATAN PENGEMBALIAN UANG
  addRefund(saleId: number, refundAmount: number, reason: string = 'Pembatalan transaksi') {
    const sale = this.sales.find((s) => s.id === saleId);
    if (sale) {
      const refundRecord = {
        id: Date.now(),
        saleId: saleId,
        originalSale: { ...sale },
        refundAmount: refundAmount,
        reason: reason,
        refundDate: new Date(),
        processedBy: 'Kasir',
      };

      this.refunds.push(refundRecord);
      this.saveToLocalStorage();
      return refundRecord;
    }
    return null;
  }

  // ✅ METHOD BATALKAN TRANSAKSI + PENGEMBALIAN UANG LENGKAP
  cancelSale(saleId: number): boolean {
    const sale = this.sales.find((s) => s.id === saleId);
    if (sale && sale.status === 'completed') {
      // 1. Kembalikan stok semua produk
      sale.items.forEach((item: any) => {
        this.returnStock(item.id, item.quantity);
      });

      // 2. Catat pengembalian uang
      this.addRefund(saleId, sale.cashReceived, 'Pembatalan transaksi lengkap');

      // 3. Tandai transaksi sebagai dibatalkan
      sale.status = 'cancelled';
      sale.cancelledAt = new Date();
      sale.refundAmount = sale.cashReceived;

      this.saveToLocalStorage();
      return true;
    }
    return false;
  }

  // ✅ METHOD AMBIL DATA PENGEMBALIAN UANG
  getRefunds(): any[] {
    return this.refunds;
  }

  // ✅ METHOD HITUNG TOTAL PENGEMBALIAN UANG
  getTotalRefunds(): number {
    return this.refunds.reduce((total, refund) => total + refund.refundAmount, 0);
  }

  getCompletedSales(): any[] {
    return this.sales.filter((sale) => sale.status === 'completed');
  }

  getCancelledSales(): any[] {
    return this.sales.filter((sale) => sale.status === 'cancelled');
  }

  getTodaySales(): number {
    const today = new Date().toDateString();
    return this.sales
      .filter((sale) => new Date(sale.date).toDateString() === today && sale.status === 'completed')
      .reduce((total, sale) => total + sale.total, 0);
  }

  getMonthlySales(): number {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    return this.sales
      .filter((sale) => {
        const saleDate = new Date(sale.date);
        return (
          saleDate.getMonth() === currentMonth &&
          saleDate.getFullYear() === currentYear &&
          sale.status === 'completed'
        );
      })
      .reduce((total, sale) => total + sale.total, 0);
  }

  // ==================== UTILITY METHODS ====================
  getLowStockProducts(): any[] {
    return this.products.filter(
      (product) => product.stock > 0 && product.stock <= (product.minStock || 5)
    );
  }

  getOutOfStockProducts(): any[] {
    return this.products.filter((product) => product.stock === 0);
  }

  getTotalInventoryValue(): number {
    return this.products.reduce((total, product) => total + product.price * product.stock, 0);
  }

  clearAllData(): void {
    this.products = [];
    this.categories = [];
    this.debts = [];
    this.sales = [];
    this.refunds = [];
    this.saveToLocalStorage();
    this.initializeDefaultData();
  }

  exportData(): any {
    return {
      products: this.products,
      categories: this.categories,
      debts: this.debts,
      sales: this.sales,
      refunds: this.refunds,
      exportDate: new Date(),
    };
  }

  importData(data: any): boolean {
    try {
      if (data.products) this.products = data.products;
      if (data.categories) this.categories = data.categories;
      if (data.debts) this.debts = data.debts;
      if (data.sales) this.sales = data.sales;
      if (data.refunds) this.refunds = data.refunds;

      this.saveToLocalStorage();
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }
}
