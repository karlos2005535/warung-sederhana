// components/pos/pos.component.ts
import { Component, OnInit } from '@angular/core';
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
export class PosComponent implements OnInit {
  products: any[] = [];
  cart: any[] = [];
  cash: number = 0;
  cashFormatted: string = '';
  recentTransactions: any[] = [];
  showCancelModal: boolean = false;
  selectedTransaction: any = null;
  refundHistory: any[] = [];
  showRefundHistory: boolean = false;

  constructor(private warungService: WarungService, private router: Router) {}

  ngOnInit() {
    this.loadProducts();
    this.loadRecentTransactions();
    this.loadRefundHistory();
    this.cashFormatted = this.formatRupiah(0);
  }

  loadProducts() {
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
      this.cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
      });
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
      this.removeFromCart(item);
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

  // Method untuk format Rupiah
  formatRupiah(amount: number): string {
    if (amount === 0) return '0';
    return amount.toLocaleString('id-ID');
  }

  // Method untuk parse dari format Rupiah ke number
  parseRupiah(formatted: string): number {
    // Hapus semua karakter non-digit kecuali koma dan titik
    const cleanValue = formatted.replace(/[^\d,]/g, '');

    // Jika kosong, return 0
    if (!cleanValue) return 0;

    // Handle format Indonesia (titik sebagai pemisah ribuan, koma sebagai desimal)
    const parts = cleanValue.split(',');
    const integerPart = parts[0].replace(/\./g, '');
    const decimalPart = parts[1] ? parts[1] : '0';

    // Gabungkan dan konversi ke number
    const numberValue = parseFloat(integerPart + '.' + decimalPart);

    return isNaN(numberValue) ? 0 : numberValue;
  }

  // Event handler untuk input uang
  onCashInput(event: any) {
    let inputValue = event.target.value;

    // Hapus semua karakter non-digit
    let numericValue = inputValue.replace(/[^\d]/g, '');

    // Jika kosong, set ke 0
    if (!numericValue) {
      this.cash = 0;
      this.cashFormatted = '0';
      return;
    }

    // Konversi ke number
    const numberValue = parseInt(numericValue, 10);

    // Update nilai cash
    this.cash = numberValue;

    // Format ulang tampilan
    this.cashFormatted = this.formatRupiah(numberValue);
  }

  // Event handler ketika input kehilangan fokus
  onCashBlur() {
    if (this.cash === 0) {
      this.cashFormatted = '0';
    } else {
      this.cashFormatted = this.formatRupiah(this.cash);
    }
  }

  // Event handler ketika input mendapatkan fokus
  onCashFocus() {
    // Kosongkan field saat fokus jika nilai adalah 0
    if (this.cash === 0) {
      this.cashFormatted = '';
    }
  }

  processPayment() {
    if (this.cash >= this.getTotal()) {
      // Update stock untuk setiap item di cart
      this.cart.forEach((item) => {
        this.warungService.updateStock(item.id, item.quantity);
      });

      // Buat transaksi baru
      const newTransaction = {
        id: Date.now(),
        date: new Date(),
        items: this.cart.map((item) => ({ ...item })),
        total: this.getTotal(),
        cashReceived: this.cash,
        change: this.getChange(),
        status: 'completed',
      };

      // Simpan transaksi
      this.warungService.addSale(newTransaction);

      // Refresh data
      this.loadRecentTransactions();
      this.loadProducts();

      // Tampilkan alert sukses
      alert(
        `✅ PEMBAYARAN BERHASIL!\n\n` +
          `Total: Rp ${this.getTotal().toLocaleString('id-ID')}\n` +
          `Tunai: Rp ${this.cash.toLocaleString('id-ID')}\n` +
          `Kembalian: Rp ${this.getChange().toLocaleString('id-ID')}\n\n` +
          `ID Transaksi: ${newTransaction.id}`
      );

      // Reset cart dan cash
      this.cart = [];
      this.cash = 0;
      this.cashFormatted = this.formatRupiah(0);
    }
  }

  loadRecentTransactions() {
    const allSales = this.warungService.getSales();
    this.recentTransactions = allSales
      .filter((sale) => sale.status === 'completed')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }

  loadRefundHistory() {
    const allRefunds = this.warungService.getRefunds();
    this.refundHistory = allRefunds
      .sort((a, b) => new Date(b.refundDate).getTime() - new Date(a.refundDate).getTime())
      .slice(0, 3);
  }

  openCancelModal(transaction: any) {
    this.selectedTransaction = transaction;
    this.showCancelModal = true;
  }

  closeCancelModal() {
    this.showCancelModal = false;
    this.selectedTransaction = null;
  }

  toggleRefundHistory() {
    this.showRefundHistory = !this.showRefundHistory;
    if (this.showRefundHistory) {
      this.loadRefundHistory();
    }
  }

  cancelTransaction() {
    if (this.selectedTransaction) {
      const success = this.warungService.cancelSale(this.selectedTransaction.id);

      if (success) {
        const refunds = this.warungService.getRefunds();
        const latestRefund = refunds[refunds.length - 1];

        alert(
          `🔄 TRANSAKSI DIBATALKAN!\n\n` +
            `ID Transaksi: ${this.selectedTransaction.id}\n` +
            `Total Pembelian: Rp ${this.selectedTransaction.total.toLocaleString('id-ID')}\n` +
            `Uang Dikembalikan: Rp ${this.selectedTransaction.cashReceived.toLocaleString(
              'id-ID'
            )}\n` +
            `ID Refund: ${latestRefund.id}\n` +
            `Tanggal: ${new Date(latestRefund.refundDate).toLocaleString('id-ID')}`
        );

        this.closeCancelModal();
        this.loadRecentTransactions();
        this.loadRefundHistory();
        this.loadProducts();
      } else {
        alert('❌ Gagal membatalkan transaksi!');
      }
    }
  }

  // Method untuk menghapus transaksi tanpa refund
  removeTransaction(transaction: any) {
    if (
      confirm(
        'Apakah Anda yakin ingin menghapus transaksi ini dari daftar?\n\n' +
          `ID Transaksi: ${transaction.id}\n` +
          `Total: Rp ${transaction.total.toLocaleString('id-ID')}\n\n` +
          'Catatan: Tindakan ini hanya menghapus transaksi dari tampilan, tidak melakukan pengembalian uang atau stok.'
      )
    ) {
      // Hapus transaksi dari daftar recentTransactions
      this.recentTransactions = this.recentTransactions.filter((t) => t.id !== transaction.id);

      alert('✅ Transaksi berhasil dihapus dari daftar!');
    }
  }

  getRefundTotal(): number {
    return this.warungService.getTotalRefunds();
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }
}
