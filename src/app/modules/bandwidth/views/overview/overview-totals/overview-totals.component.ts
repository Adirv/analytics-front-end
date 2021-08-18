import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {AreaBlockerMessage} from "@kaltura-ng/kaltura-ui";
import {OverviewDateRange} from "../overview-date-filter/overview-date-range.type";

@Component({
  selector: 'app-overview-totals',
  templateUrl: './overview-totals.component.html',
  styleUrls: ['./overview-totals.component.scss']
})
export class OverviewTotalsComponent implements OnInit, OnChanges {

  @Input() selectedDateRange: OverviewDateRange;

  public isBusy: boolean;
  public blockerMessage: AreaBlockerMessage = null;

  constructor() {
  }

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.selectedDateRange.currentValue) {
      this.loadReport();
    }
  }

  loadReport() {
    this.isBusy = true;
    setTimeout(() => {
      this.isBusy = false;
    }, 2000);
  }

}
