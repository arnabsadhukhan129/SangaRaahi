import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommunityMemberComponent } from './community-member.component';

describe('CommunityMemberComponent', () => {
  let component: CommunityMemberComponent;
  let fixture: ComponentFixture<CommunityMemberComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CommunityMemberComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CommunityMemberComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
