import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardDataViewsComponent } from './dashboard-data-views.component';

describe('DashboardDataViewsComponent', () => {
  let component: DashboardDataViewsComponent;
  let fixture: ComponentFixture<DashboardDataViewsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DashboardDataViewsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardDataViewsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
