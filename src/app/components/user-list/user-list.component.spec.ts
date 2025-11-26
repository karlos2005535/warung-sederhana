import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserListComponent } from './user-list.component';

describe('UserListComponent', () => {
  let component: UserListComponent;
  let fixture: ComponentFixture<UserListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UserListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UserListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display users', () => {
    // Arrange
    component.users = ['John', 'Jane', 'Doe'];

    // Act
    fixture.detectChanges();

    // Assert
    const userElements = fixture.nativeElement.querySelectorAll('.user-item');
    expect(userElements.length).toBe(3);
    expect(userElements[0].textContent).toContain('John');
  });

  it('should emit user when clicked', () => {
    // Arrange
    component.users = ['John'];
    spyOn(component.userSelected, 'emit');

    // Act
    fixture.detectChanges();
    const userElement = fixture.nativeElement.querySelector('.user-item');
    userElement.click();

    // Assert
    expect(component.userSelected.emit).toHaveBeenCalledWith('John');
  });
});
