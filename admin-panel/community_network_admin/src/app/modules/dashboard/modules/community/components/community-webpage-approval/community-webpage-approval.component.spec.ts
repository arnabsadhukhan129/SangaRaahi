import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommunityWebpageApprovalComponent } from './community-webpage-approval.component';

describe('CommunityWebpageApprovalComponent', () => {
  let component: CommunityWebpageApprovalComponent;
  let fixture: ComponentFixture<CommunityWebpageApprovalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CommunityWebpageApprovalComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CommunityWebpageApprovalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
