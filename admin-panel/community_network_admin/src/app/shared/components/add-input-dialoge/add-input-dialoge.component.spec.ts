import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddInputDialogeComponent } from './add-input-dialoge.component';

describe('AddInputDialogeComponent', () => {
  let component: AddInputDialogeComponent;
  let fixture: ComponentFixture<AddInputDialogeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddInputDialogeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddInputDialogeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
