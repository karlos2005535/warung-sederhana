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
  template: `
    <div class="pos-container">
      <div class="pos-header">
        <h2>💳 POS Kasir</h2>
        <button class="btn-back" (click)="goBack()">⬅ Kembali</button>
      </div>

      <div class="pos-content">
        <!-- Daftar Produk -->
        <div class="products-section">
          <h3>🛍️ Daftar Produk</h3>
          <div class="products-grid">
            <div
              *ngFor="let product of products"
              class="product-card"
              [class.out-of-stock]="product.stock === 0"
            >
              <div class="product-info">
                <strong>{{ product.name }}</strong>
                <p>Rp {{ product.price.toLocaleString('id-ID') }}</p>
                <small>Stok: {{ product.stock }} | {{ product.category }}</small>
              </div>
              <button (click)="addToCart(product)" [disabled]="product.stock === 0" class="btn-add">
                {{ product.stock === 0 ? '❌ Habis' : '+ Tambah' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Keranjang Belanja -->
        <div class="cart-section">
          <h3>🛒 Keranjang Belanja</h3>

          <div *ngIf="cart.length === 0" class="empty-cart">Keranjang belanja kosong</div>

          <div *ngFor="let item of cart" class="cart-item">
            <div class="item-info">
              <strong>{{ item.name }}</strong>
              <p>Rp {{ item.price.toLocaleString('id-ID') }} x {{ item.quantity }}</p>
              <strong>Total: Rp {{ (item.price * item.quantity).toLocaleString('id-ID') }}</strong>
            </div>
            <div class="item-actions">
              <button (click)="decreaseQuantity(item)" class="btn-quantity">-</button>
              <span class="quantity">{{ item.quantity }}</span>
              <button (click)="increaseQuantity(item)" class="btn-quantity">+</button>
            </div>
          </div>

          <!-- Pembayaran -->
          <div *ngIf="cart.length > 0" class="payment-section">
            <h4>💵 Pembayaran</h4>

            <div class="total-section">
              <label>Total Belanja:</label>
              <div class="total-amount">Rp {{ getTotal().toLocaleString('id-ID') }}</div>
            </div>

            <div class="cash-input">
              <label>Uang Bayar:</label>
              <input
                type="number"
                [(ngModel)]="cash"
                placeholder="Masukkan jumlah uang"
                class="form-input"
              />
            </div>

            <div *ngIf="cash > 0" class="change-section">
              <label>Kembalian:</label>
              <div [class]="getChange() < 0 ? 'change-negative' : 'change-positive'">
                Rp {{ getChange().toLocaleString('id-ID') }}
                <span *ngIf="getChange() < 0" class="warning">(Uang kurang!)</span>
              </div>
            </div>

            <button (click)="processPayment()" [disabled]="cash < getTotal()" class="btn-pay">
              💰 Proses Pembayaran
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .pos-container {
        padding: 20px;
        min-height: 100vh;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }

      .pos-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: white;
        padding: 20px;
        border-radius: 10px;
        margin-bottom: 20px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
      }

      .pos-content {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
      }

      .products-section,
      .cart-section {
        background: white;
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
      }

      .products-grid {
        display: grid;
        gap: 10px;
        max-height: 500px;
        overflow-y: auto;
      }

      .product-card {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 15px;
        border: 1px solid #e9ecef;
        border-radius: 8px;
        background: #f8f9fa;
        transition: all 0.3s;
      }

      .product-card.out-of-stock {
        background: #ffebee;
      }

      .product-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      }

      .btn-add {
        padding: 8px 15px;
        background: #28a745;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
      }

      .btn-add:disabled {
        background: #6c757d;
        cursor: not-allowed;
      }

      .cart-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 15px;
        border: 1px solid #e9ecef;
        border-radius: 8px;
        background: #fff3cd;
        margin-bottom: 10px;
      }

      .item-actions {
        display: flex;
        gap: 5px;
        align-items: center;
      }

      .btn-quantity {
        padding: 5px 10px;
        background: #dc3545;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        width: 30px;
        height: 30px;
      }

      .btn-quantity:last-child {
        background: #28a745;
      }

      .quantity {
        padding: 5px 10px;
        background: white;
        border: 1px solid #ddd;
        border-radius: 4px;
        min-width: 30px;
        text-align: center;
      }

      .empty-cart {
        text-align: center;
        padding: 40px;
        color: #666;
        font-style: italic;
        background: #f8f9fa;
        border-radius: 8px;
      }

      .payment-section {
        background: #e8f5e8;
        padding: 20px;
        border-radius: 8px;
        margin-top: 20px;
        border-left: 4px solid #28a745;
      }

      .total-section,
      .cash-input,
      .change-section {
        margin-bottom: 15px;
      }

      .total-amount {
        font-size: 1.5rem;
        font-weight: bold;
        color: #2e7d32;
      }

      .form-input {
        width: 100%;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 5px;
        font-size: 16px;
      }

      .change-positive {
        font-size: 1.2rem;
        font-weight: bold;
        color: #28a745;
      }

      .change-negative {
        font-size: 1.2rem;
        font-weight: bold;
        color: #dc3545;
      }

      .warning {
        font-size: 0.9rem;
      }

      .btn-pay {
        width: 100%;
        padding: 12px;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-size: 16px;
        margin-top: 10px;
      }

      .btn-pay:disabled {
        background: #6c757d;
        cursor: not-allowed;
      }

      .btn-back {
        padding: 10px 20px;
        background: #6c757d;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
      }

      @media (max-width: 768px) {
        .pos-content {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class PosComponent {
  products: any[] = [];
  cart: any[] = [];
  cash: number = 0;

  constructor(private warungService: WarungService, private router: Router) {}

  ngOnInit() {
    this.products = this.warungService.getProducts();
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

  getTotal(): number {
    return this.cart.reduce((total, item) => total + item.price * item.quantity, 0);
  }

  getChange(): number {
    return this.cash - this.getTotal();
  }

  processPayment() {
    if (this.cash >= this.getTotal()) {
      this.cart.forEach((item) => {
        this.warungService.updateStock(item.id, item.quantity);
      });

      this.warungService.addSale({
        items: [...this.cart],
        total: this.getTotal(),
        cashReceived: this.cash,
        change: this.getChange(),
      });

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

  goBack() {
    this.router.navigate(['/dashboard']);
  }
}
