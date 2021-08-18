import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OverviewTotalsComponent } from './overview-totals.component';

describe('OverviewTotalsComponent', () => {
  let component: OverviewTotalsComponent;
  let fixture: ComponentFixture<OverviewTotalsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OverviewTotalsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OverviewTotalsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
