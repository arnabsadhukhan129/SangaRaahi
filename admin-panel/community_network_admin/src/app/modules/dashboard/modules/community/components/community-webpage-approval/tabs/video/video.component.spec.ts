import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommunityApprovalHomeComponent } from './home.component';

describe('CommunityApprovalHomeComponent', () => {
  let component: CommunityApprovalHomeComponent;
  let fixture: ComponentFixture<CommunityApprovalHomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CommunityApprovalHomeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CommunityApprovalHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
