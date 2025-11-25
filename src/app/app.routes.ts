import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { ProductsListComponent } from './components/products-list/products-list.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ProductsComponent } from './components/products/products.component';
import { PosComponent } from './components/pos/pos.component';
import { DebtsComponent } from './components/debts/debts.component';
import { CategoriesComponent } from './components/categories/categories.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'products', component: ProductsComponent },
  { path: 'products-list', component: ProductsListComponent },
  { path: 'pos', component: PosComponent },
  { path: 'debts', component: DebtsComponent },
  { path: 'categories', component: CategoriesComponent },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/dashboard' },
];
