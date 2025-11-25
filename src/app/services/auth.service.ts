import { Injectable } from '@angular/core';

export interface User {
  username: string;
  password: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private users: User[] = [
    { username: 'admin', password: 'admin' },
    { username: 'user', password: 'user123' },
  ];

  private currentUser: User | null = null;

  constructor() {
    // Load users from localStorage jika ada
    const savedUsers = localStorage.getItem('baco_users');
    if (savedUsers) {
      this.users = JSON.parse(savedUsers);
    }

    // Load current user dari localStorage
    const savedCurrentUser = localStorage.getItem('baco_currentUser');
    if (savedCurrentUser) {
      this.currentUser = JSON.parse(savedCurrentUser);
    }
  }

  login(username: string, password: string): boolean {
    console.log('Attempting login for:', username);
    console.log('Available users:', this.users);

    const user = this.users.find((u) => u.username === username && u.password === password);

    if (user) {
      this.currentUser = user;
      localStorage.setItem('baco_currentUser', JSON.stringify(user));
      console.log('Login successful for:', username);
      return true;
    }

    console.log('Login failed for:', username);
    return false;
  }

  register(username: string, password: string): boolean {
    // Cek apakah username sudah ada
    const existingUser = this.users.find((u) => u.username === username);
    if (existingUser) {
      return false;
    }

    // Tambah user baru
    const newUser: User = { username, password };
    this.users.push(newUser);

    // Simpan ke localStorage
    localStorage.setItem('baco_users', JSON.stringify(this.users));
    console.log('User registered:', username);
    console.log('All users:', this.users);

    return true;
  }

  logout(): void {
    this.currentUser = null;
    localStorage.removeItem('baco_currentUser');
  }

  isLoggedIn(): boolean {
    return this.currentUser !== null;
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  // Method untuk debug
  getUsers(): User[] {
    return this.users;
  }
}
