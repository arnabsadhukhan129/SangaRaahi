import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommunityHomeSettingComponent } from './community-home-setting.component';

describe('CommunityHomeSettingComponent', () => {
  let component: CommunityHomeSettingComponent;
  let fixture: ComponentFixture<CommunityHomeSettingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CommunityHomeSettingComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CommunityHomeSettingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
