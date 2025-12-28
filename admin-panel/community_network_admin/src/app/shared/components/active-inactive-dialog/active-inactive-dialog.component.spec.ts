import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActiveInactiveDialogComponent } from './active-inactive-dialog.component';

describe('ActiveInactiveDialogComponent', () => {
  let component: ActiveInactiveDialogComponent;
  let fixture: ComponentFixture<ActiveInactiveDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ActiveInactiveDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ActiveInactiveDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
