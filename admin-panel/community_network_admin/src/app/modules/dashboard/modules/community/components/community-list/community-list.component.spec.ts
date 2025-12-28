import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommunityStatusComponent } from './community-list.component';

describe('CommunityStatusComponent', () => {
  let component: CommunityStatusComponent;
  let fixture: ComponentFixture<CommunityStatusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CommunityStatusComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CommunityStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
