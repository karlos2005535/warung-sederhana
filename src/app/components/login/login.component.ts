import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  username: string = '';
  password: string = '';

  constructor(private router: Router, private authService: AuthService) {}

  login() {
    console.log('Login method called');
    console.log('Username:', this.username);
    console.log('Password:', this.password);

    if (!this.username || !this.password) {
      alert('Username dan password harus diisi!');
      return;
    }

    const success = this.authService.login(this.username, this.password);
    console.log('Login success:', success);

    if (success) {
      this.router.navigate(['/dashboard']);
    } else {
      alert('Login gagal! Username atau password salah.');
    }
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }

  // Method untuk debug
  debugUsers() {
    console.log('Current users:', this.authService.getUsers());
  }
}
