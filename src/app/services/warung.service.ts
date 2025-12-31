import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Product {
  id: number;
  barcode: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  minStock: number;
  supplier: string;
  createdAt: Date;
}

export interface Category {
  id: number;
  name: string;
}

export interface Sale {
  id: number;
  items: any[];
  total: number;
  date: Date;
  status: string;
}

export interface Debt {
  id: number;
  customerName: string;
  amount: number;
  date: Date;
  dueDate: Date;
  status: string;
  description?: string;
}

export interface Refund {
  id: number;
  saleId: number;
  items: any[];
  total: number;
  refundDate: Date;
  reason: string;
}

@Injectable({
  providedIn: 'root',
})
export class WarungService {
  private products: Product[] = [
    {
      id: 1,
      barcode: '8996001600647',
      name: 'Indomie Goreng',
      category: 'Makanan Instan',
      price: 2500,
      stock: 50,
      minStock: 10,
      supplier: 'PT Indofood',
      createdAt: new Date(),
    },
    {
      id: 2,
      barcode: '8998866603196',
      name: 'Aqua 600ml',
      category: 'Minuman',
      price: 3000,
      stock: 100,
      minStock: 20,
      supplier: 'PT Aqua',
      createdAt: new Date(),
    },
  ];

  private categories: Category[] = [
    { id: 1, name: 'Makanan Instan' },
    { id: 2, name: 'Minuman' },
    { id: 3, name: 'Snack' },
    { id: 4, name: 'Bahan Pokok' },
  ];

  private sales: Sale[] = [
    {
      id: 1,
      items: [{ id: 1, name: 'Indomie Goreng', price: 2500, quantity: 2 }],
      total: 5000,
      date: new Date(),
      status: 'completed',
    },
  ];

  private debts: Debt[] = [
    {
      id: 1,
      customerName: 'Budi Santoso',
      amount: 50000,
      date: new Date(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'active',
      description: 'Belanja bulanan',
    },
  ];

  private refunds: Refund[] = [];

  private productsSubject = new BehaviorSubject<Product[]>(this.products);
  private categoriesSubject = new BehaviorSubject<Category[]>(this.categories);
  private salesSubject = new BehaviorSubject<Sale[]>(this.sales);
  private debtsSubject = new BehaviorSubject<Debt[]>(this.debts);

  // Product Methods
  getProducts(): Product[] {
    return this.products;
  }

  getCategories() {
    return this.categories;
  }

  addProduct(product: Omit<Product, 'id' | 'createdAt'>): boolean {
    const existingProduct = this.products.find((p) => p.barcode === product.barcode);
    if (existingProduct) {
      return false;
    }

    const newProduct: Product = {
      ...product,
      id: this.generateId(),
      createdAt: new Date(),
    };

    this.products.push(newProduct);
    this.productsSubject.next([...this.products]);
    return true;
  }

  updateProduct(id: number, updatedProduct: Partial<Product>): boolean {
    const index = this.products.findIndex((p) => p.id === id);
    if (index !== -1) {
      this.products[index] = { ...this.products[index], ...updatedProduct };
      this.productsSubject.next([...this.products]);
      return true;
    }
    return false;
  }

  deleteProduct(id: number): boolean {
    const index = this.products.findIndex((p) => p.id === id);
    if (index !== -1) {
      this.products.splice(index, 1);
      this.productsSubject.next([...this.products]);
      return true;
    }
    return false;
  }

  getProductByBarcode(barcode: string): Product | undefined {
    return this.products.find((p) => p.barcode === barcode);
  }

  getProductById(id: number): Product | undefined {
    return this.products.find((p) => p.id === id);
  }

  updateProductStock(productId: number, newStock: number): boolean {
    const product = this.getProductById(productId);
    if (product) {
      product.stock = newStock;
      this.productsSubject.next([...this.products]);
      return true;
    }
    return false;
  }

  increaseProductStock(productId: number, quantity: number): boolean {
    const product = this.getProductById(productId);
    if (product) {
      product.stock += quantity;
      this.productsSubject.next([...this.products]);
      return true;
    }
    return false;
  }

  // Category Methods
  addCategory(name: string): boolean {
    const existingCategory = this.categories.find(
      (c) => c.name.toLowerCase() === name.toLowerCase()
    );
    if (existingCategory) {
      return false;
    }

    const newCategory: Category = {
      id: this.categories.length > 0 ? Math.max(...this.categories.map((c) => c.id)) + 1 : 1,
      name: name.trim(),
    };

    this.categories.push(newCategory);
    this.categoriesSubject.next([...this.categories]);
    return true;
  }

  // Sales Methods
  getSales(): Sale[] {
    return this.sales;
  }

  addSale(sale: Omit<Sale, 'id'>): boolean {
    const newSale: Sale = {
      ...sale,
      id: this.sales.length > 0 ? Math.max(...this.sales.map((s) => s.id)) + 1 : 1,
    };

    this.sales.push(newSale);
    this.salesSubject.next([...this.sales]);
    return true;
  }

  cancelSale(saleId: number): boolean {
    const sale = this.sales.find((s) => s.id === saleId);
    if (sale) {
      sale.status = 'cancelled';
      this.salesSubject.next([...this.sales]);
      return true;
    }
    return false;
  }

  getTodaySales(): number {
    const today = new Date().toDateString();
    return this.sales
      .filter((sale) => new Date(sale.date).toDateString() === today && sale.status === 'completed')
      .reduce((total, sale) => total + sale.total, 0);
  }

  getMonthlySales(): number {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

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

  // Debt Methods
  getDebts(): Debt[] {
    return this.debts;
  }

  getActiveDebts(): Debt[] {
    return this.debts.filter((debt) => debt.status === 'active');
  }

  addDebt(debt: Omit<Debt, 'id'>): boolean {
    const newDebt: Debt = {
      ...debt,
      id: this.debts.length > 0 ? Math.max(...this.debts.map((d) => d.id)) + 1 : 1,
    };

    this.debts.push(newDebt);
    this.debtsSubject.next([...this.debts]);
    return true;
  }

  markDebtPaid(id: number): boolean {
    const debt = this.debts.find((d) => d.id === id);
    if (debt) {
      debt.status = 'paid';
      this.debtsSubject.next([...this.debts]);
      return true;
    }
    return false;
  }

  deleteDebt(id: number): boolean {
    const index = this.debts.findIndex((d) => d.id === id);
    if (index !== -1) {
      this.debts.splice(index, 1);
      this.debtsSubject.next([...this.debts]);
      return true;
    }
    return false;
  }

  // Refund Methods
  getRefunds(): Refund[] {
    return this.refunds;
  }

  getTotalRefunds(): number {
    return this.refunds.reduce((total, refund) => total + refund.total, 0);
  }

  addRefund(refund: Omit<Refund, 'id'>): boolean {
    const newRefund: Refund = {
      ...refund,
      id: this.refunds.length > 0 ? Math.max(...this.refunds.map((r) => r.id)) + 1 : 1,
    };

    this.refunds.push(newRefund);
    return true;
  }

  // Inventory Methods
  getLowStockProducts(): Product[] {
    return this.products.filter((product) => product.stock <= product.minStock);
  }

  getTotalInventoryValue(): number {
    return this.products.reduce((total, product) => total + product.price * product.stock, 0);
  }

  // Stock Methods
  updateStock(productId: number, quantity: number): boolean {
    const product = this.getProductById(productId);
    if (product && product.stock >= quantity) {
      product.stock -= quantity;
      this.productsSubject.next([...this.products]);
      return true;
    }
    return false;
  }

  private generateId(): number {
    return this.products.length > 0 ? Math.max(...this.products.map((p) => p.id)) + 1 : 1;
  }
}
