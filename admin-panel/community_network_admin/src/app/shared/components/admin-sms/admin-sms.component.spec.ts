import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminSmsComponent } from './admin-sms.component';

describe('AdminSmsComponent', () => {
  let component: AdminSmsComponent;
  let fixture: ComponentFixture<AdminSmsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AdminSmsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminSmsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
