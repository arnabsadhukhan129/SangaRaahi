import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommunityVideoSettingComponent } from './community-video-setting.component';

describe('CommunityVideoSettingComponent', () => {
  let component: CommunityVideoSettingComponent;
  let fixture: ComponentFixture<CommunityVideoSettingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CommunityVideoSettingComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CommunityVideoSettingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
