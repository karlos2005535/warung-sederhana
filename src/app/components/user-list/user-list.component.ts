import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss'],
})
export class UserListComponent {
  users: any[] = [
    {
      id: 1,
      name: 'Admin Utama',
      email: 'admin@warung.com',
      role: 'Administrator',
      status: 'active',
    },
    {
      id: 2,
      name: 'Kasir 1',
      email: 'kasir1@warung.com',
      role: 'Kasir',
      status: 'active',
    },
  ];

  selectUser(user: any) {
    console.log('User selected:', user);
    alert(`User ${user.name} dipilih`);
  }

  // Method addUser yang diperlukan oleh template
  addUser() {
    console.log('Add new user');
    const newUser = {
      id: this.users.length + 1,
      name: `User Baru ${this.users.length + 1}`,
      email: `user${this.users.length + 1}@warung.com`,
      role: 'Kasir',
      status: 'active',
    };

    this.users.push(newUser);
    alert('User berhasil ditambahkan!');
  }
}
