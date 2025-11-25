import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WarungService } from '../../services/warung.service';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.scss'],
})
export class CategoriesComponent implements OnInit {
  categories: any[] = [];
  newCategoryName: string = '';

  constructor(private router: Router, private warungService: WarungService) {}

  ngOnInit() {
    this.categories = this.warungService.getCategories();
  }

  addCategory() {
    if (this.newCategoryName.trim()) {
      this.warungService.addCategory(this.newCategoryName.trim());
      this.categories = this.warungService.getCategories();
      this.newCategoryName = '';
      alert('Kategori berhasil ditambahkan!');
    } else {
      alert('Harap isi nama kategori!');
    }
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }
}
