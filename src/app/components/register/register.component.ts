import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent {
  username: string = '';
  password: string = '';
  confirmPassword: string = '';

  constructor(private router: Router, private authService: AuthService) {}

  // Method yang diperlukan oleh template
  onPasswordInput() {
    // Method ini dipanggil ketika password diinput
    console.log('Password input changed');
  }

  isFormValid(): boolean {
    return (
      this.username.trim() !== '' &&
      this.password.trim() !== '' &&
      this.confirmPassword.trim() !== '' &&
      this.password === this.confirmPassword &&
      this.password.length >= 3
    );
  }

  register(event?: Event) {
    if (event) {
      event.preventDefault();
    }

    console.log('Register attempt:', this.username);

    if (!this.username || !this.password) {
      alert('Username dan password harus diisi!');
      return;
    }

    if (this.password !== this.confirmPassword) {
      alert('Password dan konfirmasi password tidak sama!');
      return;
    }

    if (this.password.length < 3) {
      alert('Password harus minimal 3 karakter!');
      return;
    }

    const success = this.authService.register(this.username, this.password);
    console.log('Register success:', success);

    if (success) {
      alert('Registrasi berhasil! Silakan login.');
      this.router.navigate(['/login']);
    } else {
      alert('Username sudah digunakan!');
    }
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  getPasswordStrength(): string {
    if (!this.password) return 'weak';
    if (this.password.length < 4) return 'weak';
    if (this.password.length < 8) return 'medium';
    return 'strong';
  }

  getPasswordMatchClass(): string {
    if (!this.confirmPassword) return 'empty';
    return this.password === this.confirmPassword ? 'match' : 'mismatch';
  }

  getPasswordMatchText(): string {
    if (!this.confirmPassword) return 'Harap konfirmasi password Anda';
    return this.password === this.confirmPassword ? 'Password cocok' : 'Password tidak cocok';
  }
}
