// components/pos/pos.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { WarungService } from '../../services/warung.service';

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pos.component.html',
  styleUrls: ['./pos.component.scss'],
})
export class PosComponent {
  products: any[] = [];
  cart: any[] = [];
  cash: number = 0;
  recentTransactions: any[] = [];
  showCancelModal: boolean = false;
  selectedTransaction: any = null;

  constructor(private warungService: WarungService, private router: Router) {}

  ngOnInit() {
    this.products = this.warungService.getProducts();
    this.loadRecentTransactions();
  }

  addToCart(product: any) {
    if (product.stock === 0) return;

    const existing = this.cart.find((item) => item.id === product.id);
    if (existing) {
      if (existing.quantity < product.stock) {
        existing.quantity++;
      }
    } else {
      this.cart.push({ ...product, quantity: 1 });
    }
  }

  increaseQuantity(item: any) {
    const product = this.warungService.getProducts().find((p) => p.id === item.id);
    if (product && item.quantity < product.stock) {
      item.quantity++;
    }
  }

  decreaseQuantity(item: any) {
    if (item.quantity > 1) {
      item.quantity--;
    } else {
      this.cart = this.cart.filter((i) => i !== item);
    }
  }

  removeFromCart(item: any) {
    this.cart = this.cart.filter((i) => i !== item);
  }

  getTotal(): number {
    return this.cart.reduce((total, item) => total + item.price * item.quantity, 0);
  }

  getChange(): number {
    return this.cash - this.getTotal();
  }

  processPayment() {
    if (this.cash >= this.getTotal()) {
      // Update stock untuk setiap item di cart
      this.cart.forEach((item) => {
        this.warungService.updateStock(item.id, item.quantity);
      });

      // Tambahkan transaksi baru
      const newTransaction = {
        id: Date.now(),
        date: new Date(),
        items: [...this.cart],
        total: this.getTotal(),
        cashReceived: this.cash,
        change: this.getChange(),
        status: 'completed',
      };

      this.warungService.addSale(newTransaction);
      this.loadRecentTransactions();

      alert(
        `Pembayaran berhasil!\nTotal: Rp ${this.getTotal().toLocaleString(
          'id-ID'
        )}\nKembalian: Rp ${this.getChange().toLocaleString('id-ID')}`
      );

      this.cart = [];
      this.cash = 0;
      this.products = this.warungService.getProducts(); // Refresh products
    }
  }

  loadRecentTransactions() {
    this.recentTransactions = this.warungService
      .getSales()
      .filter((sale) => sale.status === 'completed')
      .slice(-5)
      .reverse();
  }

  openCancelModal(transaction: any) {
    this.selectedTransaction = transaction;
    this.showCancelModal = true;
  }

  closeCancelModal() {
    this.showCancelModal = false;
    this.selectedTransaction = null;
  }

  cancelTransaction() {
    if (this.selectedTransaction) {
      // Kembalikan stok produk
      this.selectedTransaction.items.forEach((item: any) => {
        this.warungService.returnStock(item.id, item.quantity);
      });

      // Tandai transaksi sebagai dibatalkan
      this.warungService.cancelSale(this.selectedTransaction.id);

      alert(
        `Transaksi berhasil dibatalkan!\nUang dikembalikan: Rp ${this.selectedTransaction.cashReceived.toLocaleString(
          'id-ID'
        )}`
      );

      this.closeCancelModal();
      this.loadRecentTransactions();
      this.products = this.warungService.getProducts(); // Refresh products
    }
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }
}
