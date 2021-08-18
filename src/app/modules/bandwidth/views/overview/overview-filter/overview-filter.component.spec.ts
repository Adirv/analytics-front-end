import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OverviewFilterComponent } from './overview-filter.component';

describe('OverviewFilterComponent', () => {
  let component: OverviewFilterComponent;
  let fixture: ComponentFixture<OverviewFilterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OverviewFilterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OverviewFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
