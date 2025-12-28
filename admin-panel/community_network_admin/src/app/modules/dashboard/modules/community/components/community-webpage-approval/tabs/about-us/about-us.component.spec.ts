import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommunityApprovalAboutUsComponent } from './about-us.component';

describe('CommunityApprovalAboutUsComponent', () => {
  let component: CommunityApprovalAboutUsComponent;
  let fixture: ComponentFixture<CommunityApprovalAboutUsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CommunityApprovalAboutUsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CommunityApprovalAboutUsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
