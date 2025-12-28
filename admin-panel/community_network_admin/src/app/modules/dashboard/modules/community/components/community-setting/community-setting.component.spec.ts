import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommunitySettingComponent } from './community-setting.component';

describe('CommunitySettingComponent', () => {
  let component: CommunitySettingComponent;
  let fixture: ComponentFixture<CommunitySettingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CommunitySettingComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CommunitySettingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
