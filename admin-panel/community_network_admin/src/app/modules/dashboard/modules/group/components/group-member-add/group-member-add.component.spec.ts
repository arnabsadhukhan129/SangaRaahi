import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupMemberAddComponent } from './group-member-add.component';

describe('GroupMemberAddComponent', () => {
  let component: GroupMemberAddComponent;
  let fixture: ComponentFixture<GroupMemberAddComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GroupMemberAddComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupMemberAddComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
