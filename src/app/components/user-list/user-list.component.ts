import { Component, EventEmitter, Output, Input } from '@angular/core';

@Component({
  selector: 'app-user-list',
  template: `
    <div class="user-list">
      <div *ngFor="let user of users" class="user-item" (click)="selectUser(user)">
        {{ user }}
      </div>
    </div>
  `,
  styles: [
    `
      .user-list {
        border: 1px solid #ccc;
        padding: 10px;
      }
      .user-item {
        padding: 5px;
        cursor: pointer;
      }
      .user-item:hover {
        background-color: #f0f0f0;
      }
    `,
  ],
})
export class UserListComponent {
  @Input() users: string[] = [];
  @Output() userSelected = new EventEmitter<string>();

  selectUser(user: string): void {
    this.userSelected.emit(user);
  }
}
