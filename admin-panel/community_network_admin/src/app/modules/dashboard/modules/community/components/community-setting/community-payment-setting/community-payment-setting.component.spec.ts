import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommunityPaymentSettingComponent } from './community-payment-setting.component';

describe('CommunityPaymentSettingComponent', () => {
  let component: CommunityPaymentSettingComponent;
  let fixture: ComponentFixture<CommunityPaymentSettingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CommunityPaymentSettingComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CommunityPaymentSettingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
