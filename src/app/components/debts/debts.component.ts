// components/debts/debts.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { WarungService } from '../../services/warung.service';

@Component({
  selector: 'app-debts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="debts-container">
      <div class="debts-header">
        <h2>📋 Kelola Piutang</h2>
        <button class="btn-back" (click)="goBack()">⬅ Kembali</button>
      </div>

      <!-- Form Tambah Piutang -->
      <div class="add-debt-section">
        <h3>➕ Tambah Piutang Baru</h3>
        <div class="debt-form">
          <input
            [(ngModel)]="newDebt.customerName"
            placeholder="Nama Pelanggan"
            class="form-input"
          />
          <input
            type="number"
            [(ngModel)]="newDebt.amount"
            placeholder="Jumlah Piutang"
            class="form-input"
          />
          <input [(ngModel)]="newDebt.description" placeholder="Keterangan" class="form-input" />
          <button (click)="addDebt()" class="btn-add-debt">➕ Tambah Piutang</button>
        </div>
      </div>

      <!-- Daftar Piutang -->
      <div class="debts-list-section">
        <h3>📜 Daftar Piutang</h3>

        <div class="debts-stats">
          <div class="stat-card">
            <div class="stat-number">{{ getActiveDebts().length }}</div>
            <div class="stat-label">Piutang Aktif</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">Rp {{ getTotalActiveDebts().toLocaleString('id-ID') }}</div>
            <div class="stat-label">Total Piutang</div>
          </div>
        </div>

        <div class="debts-list">
          <div
            *ngFor="let debt of debts"
            class="debt-card"
            [class.paid]="debt.paid"
            [class.unpaid]="!debt.paid"
          >
            <div class="debt-info">
              <div class="debt-header">
                <strong>{{ debt.customerName }}</strong>
                <span
                  class="status-badge"
                  [class.paid-badge]="debt.paid"
                  [class.unpaid-badge]="!debt.paid"
                >
                  {{ debt.paid ? '✅ LUNAS' : '❌ BELUM LUNAS' }}
                </span>
              </div>
              <p class="debt-amount">Jumlah: Rp {{ debt.amount.toLocaleString('id-ID') }}</p>
              <p class="debt-description">{{ debt.description }}</p>
              <small class="debt-date"
                >Ditambahkan: {{ debt.date | date : 'dd/MM/yyyy HH:mm' }}</small
              >
            </div>
            <div class="debt-actions">
              <button *ngIf="!debt.paid" (click)="markDebtPaid(debt.id)" class="btn-mark-paid">
                ✅ Tandai Lunas
              </button>
              <button (click)="deleteDebt(debt.id)" class="btn-delete">🗑️ Hapus</button>
            </div>
          </div>

          <div *ngIf="debts.length === 0" class="empty-debts">Tidak ada piutang yang tercatat.</div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .debts-container {
        padding: 20px;
        min-height: 100vh;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }

      .debts-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: white;
        padding: 20px;
        border-radius: 10px;
        margin-bottom: 20px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
      }

      .add-debt-section {
        background: white;
        padding: 20px;
        border-radius: 10px;
        margin-bottom: 20px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
      }

      .debt-form {
        display: grid;
        grid-template-columns: 1fr 1fr 2fr auto;
        gap: 10px;
        align-items: end;
      }

      .form-input {
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 5px;
        font-size: 14px;
      }

      .btn-add-debt {
        padding: 10px 15px;
        background: #dc3545;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        white-space: nowrap;
      }

      .debts-list-section {
        background: white;
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
      }

      .debts-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 15px;
        margin-bottom: 20px;
      }

      .stat-card {
        background: #e3f2fd;
        padding: 15px;
        border-radius: 8px;
        text-align: center;
        border-left: 4px solid #2196f3;
      }

      .stat-number {
        font-size: 1.5rem;
        font-weight: bold;
        color: #1976d2;
      }

      .stat-label {
        color: #666;
        font-size: 0.9rem;
      }

      .debts-list {
        display: grid;
        gap: 15px;
      }

      .debt-card {
        padding: 20px;
        border-radius: 8px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        transition: all 0.3s ease;
      }

      .debt-card.paid {
        background: #d4edda;
        border-left: 4px solid #28a745;
      }

      .debt-card.unpaid {
        background: #fff3cd;
        border-left: 4px solid #ffc107;
      }

      .debt-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      }

      .debt-info {
        flex: 1;
      }

      .debt-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
      }

      .status-badge {
        padding: 5px 10px;
        border-radius: 15px;
        font-size: 12px;
        font-weight: bold;
      }

      .paid-badge {
        background: #28a745;
        color: white;
      }

      .unpaid-badge {
        background: #dc3545;
        color: white;
      }

      .debt-amount {
        font-weight: bold;
        color: #333;
        margin: 5px 0;
      }

      .debt-description {
        color: #666;
        margin: 5px 0;
      }

      .debt-date {
        color: #888;
      }

      .debt-actions {
        display: flex;
        gap: 10px;
      }

      .btn-mark-paid {
        padding: 8px 12px;
        background: #28a745;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
      }

      .btn-delete {
        padding: 8px 12px;
        background: #dc3545;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
      }

      .empty-debts {
        text-align: center;
        padding: 40px;
        color: #666;
        font-style: italic;
        background: #f8f9fa;
        border-radius: 8px;
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
        .debt-form {
          grid-template-columns: 1fr;
        }

        .debt-card {
          flex-direction: column;
          align-items: stretch;
          gap: 15px;
        }

        .debt-actions {
          justify-content: center;
        }
      }
    `,
  ],
})
export class DebtsComponent implements OnInit {
  debts: any[] = [];
  newDebt: any = {
    customerName: '',
    amount: 0,
    description: '',
  };

  constructor(private warungService: WarungService, private router: Router) {}

  ngOnInit() {
    this.debts = this.warungService.getDebts();
  }

  addDebt() {
    if (this.newDebt.customerName && this.newDebt.amount > 0) {
      this.warungService.addDebt({
        customerName: this.newDebt.customerName,
        amount: this.newDebt.amount,
        description: this.newDebt.description,
      });

      this.newDebt = { customerName: '', amount: 0, description: '' };
      this.debts = this.warungService.getDebts(); // Refresh list
      alert('Piutang berhasil ditambahkan!');
    } else {
      alert('Harap isi nama pelanggan dan jumlah piutang!');
    }
  }

  markDebtPaid(id: number) {
    this.warungService.markDebtPaid(id);
    this.debts = this.warungService.getDebts(); // Refresh list
    alert('Piutang telah ditandai sebagai lunas!');
  }

  deleteDebt(id: number) {
    if (confirm('Apakah Anda yakin ingin menghapus piutang ini?')) {
      this.warungService.deleteDebt(id);
      this.debts = this.warungService.getDebts(); // Refresh list
      alert('Piutang berhasil dihapus!');
    }
  }

  getActiveDebts() {
    return this.debts.filter((debt) => !debt.paid);
  }

  getTotalActiveDebts() {
    return this.getActiveDebts().reduce((total, debt) => total + debt.amount, 0);
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }
}
