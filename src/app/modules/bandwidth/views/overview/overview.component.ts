import {Component, OnInit} from '@angular/core';
import {analyticsConfig} from "configuration/analytics-config";
import {ExportItem} from "shared/components/export-csv/export-config-base.service";
import {DateChangeEvent, DateRangeType} from "shared/components/date-filter/date-filter.service";
import {DateFilterUtils, DateRanges} from "shared/components/date-filter/date-filter-utils";
import {AreaBlockerMessage} from "@kaltura-ng/kaltura-ui";
import {KalturaReportInputFilter, KalturaReportInterval} from "kaltura-ngx-client";
import {KalturaLogger} from "@kaltura-ng/kaltura-logger";
import {RefineFilter} from "shared/components/filter/filter.component";
import {refineFilterToServerValue} from "shared/components/filter/filter-to-server-value.util";
import {OverviewExportConfig} from "./overview-export.config";
import {OverviewDataConfig} from "./overview-data.config";
import {ReportDataConfig} from "shared/services/storage-data-base.config";
import {AvailabilityDateRange} from "./overview-date-filter/overview-date-filter.component";
import {OverviewDateRange} from "./overview-date-filter/overview-date-range.type";

@Component({
  selector: 'app-overview',
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.scss'],
  providers: [
    OverviewExportConfig,
    KalturaLogger.createLogger('OverviewComponent'),
    OverviewDataConfig,
  ]
})
export class OverviewComponent implements OnInit {
  public overviewViewConfig = analyticsConfig.viewsConfig.bandwidth.overview;
  public exportConfig: ExportItem[] = [];
  public dateFilter: DateChangeEvent;
  public refineFilterOpened = false;
  public refineFilter: RefineFilter = null;
  public dateRange: OverviewDateRange = null;
  public dateRangeType: DateRangeType = DateRangeType.LongTerm;
  public blockerMessage: AreaBlockerMessage = null;
  public isBusy: boolean;
  public filter: KalturaReportInputFilter = new KalturaReportInputFilter(
    {
      searchInTags: true,
      searchInAdminTags: false
    }
  );
  public reportInterval: KalturaReportInterval = KalturaReportInterval.months;
  public chartDataLoaded = false;
  public selectedRefineFilters: RefineFilter = null;
  public selectedMetrics: string;
  public availableDateRange: AvailabilityDateRange = {
    startDate: new Date(2020, 6),
    endDate: new Date()
  };
  private _dataConfig: ReportDataConfig;
  private _order = '-date_id';

  constructor(private _exportConfigService: OverviewExportConfig,
              private _logger: KalturaLogger,
              private _dataConfigService: OverviewDataConfig) {
    this._dataConfig = _dataConfigService.getConfig();
    this.selectedMetrics = this._dataConfig.totals.preSelected;
    this.exportConfig = _exportConfigService.getConfig();
  }

  ngOnInit(): void {
  }

  public onDateFilterChange(range: OverviewDateRange): void {
    const event = {} as DateChangeEvent;
    this.dateFilter = event;
    this._logger.trace('Handle date filter change action by user', () => ({event}));
    this.chartDataLoaded = false;
    this.filter.timeZoneOffset = DateFilterUtils.getTimeZoneOffset();
    const endDate = new Date(range.value);
    endDate.setMonth(endDate.getMonth() + 1, 0);
    endDate.setHours(23, 59, 59);
    this.filter.toDate = DateFilterUtils.toServerDate(endDate, true);
    const startDate = new Date(range.value);
    if (range.interval === KalturaReportInterval.months) {
      startDate.setFullYear(startDate.getFullYear() - 1);
    } else {
      startDate.setFullYear(startDate.getFullYear() - 5);
    }
    this.filter.fromDate = DateFilterUtils.toServerDate(startDate, true);
    this.filter.interval = range.interval;
    this.reportInterval = range.interval;
    this._order = this.reportInterval === KalturaReportInterval.months ? '-year_id' : '-month_id';
    this.dateRange = range;
  }

  public onRefineFilterChange(event: RefineFilter): void {
    this.refineFilter = event;
    refineFilterToServerValue(this.refineFilter, this.filter);
  }

}
