import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {OverviewDateRange} from "./overview-date-range.type";
import {DateFilterUtils} from "shared/components/date-filter/date-filter-utils";
import {analyticsConfig} from "configuration/analytics-config";
import {TranslateService} from "@ngx-translate/core";
import {KalturaReportInterval} from "kaltura-ngx-client";

@Component({
  selector: 'app-overview-date-filter',
  templateUrl: './overview-date-filter.component.html',
  styleUrls: ['./overview-date-filter.component.scss']
})
export class OverviewDateFilterComponent implements OnInit {

  @Input() availableDateRange: AvailabilityDateRange;
  @Output() filterChange = new EventEmitter<OverviewDateRange>();

  public selectedDateRange: OverviewDateRange;
  public appliedDateRange: OverviewDateRange;
  public monthlyDateRangeItems: OverviewDateRange[];
  public yearlyDateRangeItems: OverviewDateRange[];

  public applyDisabled = false;
  private localeData = DateFilterUtils.getLocalData(analyticsConfig.locale);

  constructor(private _translate: TranslateService) {
  }

  ngOnInit(): void {
    const currentMonth = this._translate.instant('app.dateFilter.prefix.month');
    const currentYear = this._translate.instant('app.dateFilter.prefix.year');
    const specific = this._translate.instant('app.dateFilter.specificLabel');
    this.monthlyDateRangeItems = getMonths(this.availableDateRange, this.localeData.monthNames, currentMonth, specific).reverse();
    this.yearlyDateRangeItems = getYears(this.availableDateRange, currentYear, specific).reverse();
    if (!this.selectedDateRange) {
      this.selectedDateRange = this.monthlyDateRangeItems[0];
      setTimeout(() => {
        this.updateDataRanges();
      });
    }
  }

  updateDataRanges() {
    this.appliedDateRange = this.selectedDateRange;
    this.filterChange.emit(this.selectedDateRange);
  }
}

export interface AvailabilityDateRange {
  startDate: Date;
  endDate: Date;
}

function getMonths(dateRange: AvailabilityDateRange, monthNames: string[], currentMonthLabel: string, specificLabel: string) {
  let startMonth = dateRange.startDate.getMonth();
  let startYear = dateRange.startDate.getFullYear();
  let endMonth = dateRange.endDate.getMonth();
  let endYear = dateRange.endDate.getFullYear();
  let dates: OverviewDateRange[] = [];
  const currentDate = new Date();

  for (let i = startYear; i <= endYear; i++) {
    let endMon = i !== endYear ? 11 : endMonth;
    let startMon = i === startYear ? startMonth : 0;
    for (let month = startMon; month <= endMon; month = month > 12 ? month % 12 || 11 : month + 1) {
      const label = monthNames[month] + ' ' + i;
      const isCurrent = currentDate.getFullYear() && currentDate.getMonth() === month;
      const prefix = isCurrent ? currentMonthLabel : specificLabel;
      dates.push({label, prefix, isCurrent, value: new Date(i, month), interval: KalturaReportInterval.months});
    }
  }
  return dates;
}

function getYears(dateRange: AvailabilityDateRange, currentYearLabel: string, specificLabel: string) {
  let startYear = dateRange.startDate.getFullYear();
  let endYear = dateRange.endDate.getFullYear();
  let dates: OverviewDateRange[] = [];
  const currentDate = new Date();

  for (let i = startYear; i <= endYear; i++) {
    const label = i.toString();
    const isCurrent = i === currentDate.getFullYear();
    const prefix = isCurrent ? currentYearLabel : specificLabel;
    dates.push({label, prefix, isCurrent, value: new Date(i, 0), interval: KalturaReportInterval.months}); // TODO: needs to have years interval
  }
  return dates;
}
