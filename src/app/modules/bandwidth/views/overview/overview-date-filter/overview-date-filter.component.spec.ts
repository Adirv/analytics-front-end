import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OverviewDateFilterComponent } from './overview-date-filter.component';

describe('OverviewDateFilterComponent', () => {
  let component: OverviewDateFilterComponent;
  let fixture: ComponentFixture<OverviewDateFilterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OverviewDateFilterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OverviewDateFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
