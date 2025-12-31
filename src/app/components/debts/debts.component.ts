import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { WarungService, Debt } from '../../services/warung.service';

@Component({
  selector: 'app-debts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './debts.component.html',
  styleUrls: ['./debts.component.scss'],
})
export class DebtsComponent implements OnInit {
  debts: Debt[] = [];

  // Model data baru
  newDebt = {
    customerName: '',
    amount: null as number | null,
    description: '',
    dueDate: '',
  };

  constructor(private warungService: WarungService, private router: Router) {}

  ngOnInit() {
    this.loadDebts();
  }

  loadDebts() {
    this.debts = this.warungService.getDebts();
  }

  addDebt() {
    if (this.newDebt.customerName && this.newDebt.amount && this.newDebt.amount > 0) {
      const debtData = {
        customerName: this.newDebt.customerName,
        amount: this.newDebt.amount,
        description: this.newDebt.description,
        date: new Date(),
        dueDate: this.newDebt.dueDate
          ? new Date(this.newDebt.dueDate)
          : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 7 hari
        status: 'active' as const,
      };

      const success = this.warungService.addDebt(debtData);
      if (success) {
        this.resetNewDebtForm();
        this.loadDebts();
        alert('✅ Piutang berhasil ditambahkan!');
      } else {
        alert('❌ Gagal menambahkan piutang!');
      }
    } else {
      alert('⚠️ Nama pelanggan dan jumlah piutang harus diisi!');
    }
  }

  markDebtPaid(id: number) {
    if (confirm('Apakah Anda yakin ingin menandai piutang ini sebagai LUNAS?')) {
      const success = this.warungService.markDebtPaid(id);
      if (success) {
        this.loadDebts();
      }
    }
  }

  deleteDebt(id: number) {
    if (confirm('Hapus data piutang ini secara permanen?')) {
      const success = this.warungService.deleteDebt(id);
      if (success) {
        this.loadDebts();
      }
    }
  }

  getActiveDebts(): Debt[] {
    return this.debts.filter((debt) => debt.status === 'active');
  }

  getPaidDebts(): Debt[] {
    return this.debts.filter((debt) => debt.status === 'paid');
  }

  getTotalActiveDebts(): number {
    return this.getActiveDebts().reduce((total, debt) => total + debt.amount, 0);
  }

  // Helper untuk format rupiah di HTML
  formatRupiah(value: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }

  // PERBAIKAN: Menambahkan method ini agar HTML tidak error
  getDateNow(): Date {
    return new Date();
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }

  private resetNewDebtForm() {
    this.newDebt = {
      customerName: '',
      amount: null,
      description: '',
      dueDate: '',
    };
  }
}
