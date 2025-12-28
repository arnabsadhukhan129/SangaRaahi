import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AboutUsSettingViewComponent } from './about-us.component';

describe('AboutUsSettingViewComponent', () => {
  let component: AboutUsSettingViewComponent;
  let fixture: ComponentFixture<AboutUsSettingViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AboutUsSettingViewComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AboutUsSettingViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
