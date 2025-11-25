// app-state.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AppStateService {
  private currentPageSubject = new BehaviorSubject<string>('login');
  currentPage$ = this.currentPageSubject.asObservable();

  setCurrentPage(page: string) {
    this.currentPageSubject.next(page);
  }

  getCurrentPage(): string {
    return this.currentPageSubject.value;
  }
}
