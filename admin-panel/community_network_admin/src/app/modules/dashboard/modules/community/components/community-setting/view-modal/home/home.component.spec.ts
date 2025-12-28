import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeSettingViewComponent } from './home.component';

describe('HomeSettingViewComponent', () => {
  let component: HomeSettingViewComponent;
  let fixture: ComponentFixture<HomeSettingViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HomeSettingViewComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomeSettingViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
