import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommunityAboutUsSettingComponent } from './community-aboutus-setting.component';

describe('CommunityAboutUsSettingComponent', () => {
  let component: CommunityAboutUsSettingComponent;
  let fixture: ComponentFixture<CommunityAboutUsSettingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CommunityAboutUsSettingComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CommunityAboutUsSettingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
