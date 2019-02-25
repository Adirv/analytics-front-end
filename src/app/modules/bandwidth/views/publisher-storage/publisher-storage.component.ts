import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {DateChangeEvent, DateRanges, DateRangeType} from 'shared/components/date-filter/date-filter.service';
import { AuthService, ErrorDetails, ErrorsManagerService, Report, ReportConfig, ReportService } from 'shared/services';
import { KalturaFilterPager, KalturaObjectBaseFactory, KalturaReportGraph, KalturaReportInputFilter, KalturaReportInterval, KalturaReportTable, KalturaReportTotal, KalturaReportType } from 'kaltura-ngx-client';
import { AreaBlockerMessage, AreaBlockerMessageButton } from '@kaltura-ng/kaltura-ui';
import { Tab } from 'shared/components/report-tabs/report-tabs.component';
import { PublisherStorageDataConfig } from './publisher-storage-data.config';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { of as ObservableOf } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { CompareService } from 'shared/services/compare.service';
import { FrameEventManagerService, FrameEvents } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { analyticsConfig } from 'configuration/analytics-config';

@Component({
  selector: 'app-publisher-storage',
  templateUrl: './publisher-storage.component.html',
  styleUrls: ['./publisher-storage.component.scss'],
  providers: [
    KalturaLogger.createLogger('PublisherStorageComponent'),
    PublisherStorageDataConfig,
  ]
})
export class PublisherStorageComponent implements OnInit {
  private _dataConfig: ReportDataConfig;

  public _dateRangeType: DateRangeType = DateRangeType.LongTerm;
  public _selectedMetrics: string;
  public _reportInterval: KalturaReportInterval = KalturaReportInterval.months;
  public _chartDataLoaded = false;
  public _tableData: any[] = [];
  public _tabsData: Tab[] = [];
  public _showTable = false;
  public _chartType = 'line';
  public _lineChartData: any = {'bandwidth_consumption': {}};
  public _barChartData: any = {'bandwidth_consumption': {}};
  public _dateRange = DateRanges.CurrentQuarter;

  public _isBusy: boolean;
  public _csvExportHeaders = '';
  public _blockerMessage: AreaBlockerMessage = null;
  public _columns: string[] = [];
  public _totalCount: number;

  public _accumulativeStorage: any[] = [];

  public pager: KalturaFilterPager = new KalturaFilterPager({pageSize: 25, pageIndex: 1});
  public reportType: KalturaReportType = KalturaReportType.partnerUsage;
  public compareFilter: KalturaReportInputFilter = null;
  public filter: KalturaReportInputFilter = new KalturaReportInputFilter(
    {
      searchInTags: true,
      searchInAdminTags: false
    }
  );

  private order = '-month_id';

  public get isCompareMode(): boolean {
    return this.compareFilter !== null;
  }

  constructor(private _frameEventManager: FrameEventManagerService,
              private _translate: TranslateService,
              private _errorsManager: ErrorsManagerService,
              private _reportService: ReportService,
              private _compareService: CompareService,
              private _authService: AuthService,
              private _dataConfigService: PublisherStorageDataConfig,
              private _logger: KalturaLogger) {
    this._dataConfig = _dataConfigService.getConfig();
    this._selectedMetrics = this._dataConfig.totals.preSelected;
  }

  ngOnInit() {
    this._isBusy = false;
  }

  public _onDateFilterChange(event: DateChangeEvent): void {
    this._logger.trace('Handle date filter change action by user', () => ({ event }));
    this._chartDataLoaded = false;
    this.filter.timeZoneOffset = event.timeZoneOffset;
    this.filter.fromDate = event.startDate;
    this.filter.toDate = event.endDate;
    this.filter.interval = event.timeUnits;
    this._reportInterval = event.timeUnits;
    this.pager.pageIndex = 1;
    if (event.compare.active) {
      const compare = event.compare;
      this.compareFilter = Object.assign(KalturaObjectBaseFactory.createObject(this.filter), this.filter);
      this.compareFilter.fromDate = compare.startDate;
      this.compareFilter.toDate = compare.endDate;
    } else {
      this.compareFilter = null;
    }
    this.loadReport();
  }

  public _onTabChange(tab: Tab): void {
    this._logger.trace('Handle tab change action by user', { tab });
    this._selectedMetrics = tab.key;
    this.updateChartType();
  }

  public _onPaginationChanged(event): void {
    if (event.page !== (this.pager.pageIndex - 1)) {
      this._logger.trace('Handle pagination changed action by user', { newPage: event.page + 1 });
      this.pager.pageIndex = event.page + 1;
      this.loadReport({table: null});
    }
  }

  public _onSortChanged(event) {
    if (event.data.length && event.field && event.order && !this.isCompareMode) {
      const order = event.order === 1 ? '+' + event.field : '-' + event.field;
      if (order !== this.order) {
        this._logger.trace('Handle sort changed action by user', { order });
        this.order = order;
        this.loadReport({table: null});
      }
    }
  }

  public toggleTable(): void {
    this._logger.trace('Handle toggle table visibility action by user', { tableVisible: !this._showTable });
    this._showTable = !this._showTable;
    if (analyticsConfig.isHosted) {
      setTimeout(() => {
        const height = document.getElementById('analyticsApp').getBoundingClientRect().height;
        this._logger.trace('Send update layout event to the host app', { height });
        this._frameEventManager.publish(FrameEvents.UpdateLayout, { height });
      }, 0);
    }
  }

  private loadReport(sections = this._dataConfig): void {
    this._isBusy = true;
    this._tableData = [];
    this._blockerMessage = null;

    const reportConfig: ReportConfig = { reportType: this.reportType, filter: this.filter, pager: this.pager, order: this.order };
    this._reportService.getReport(reportConfig, sections)
      .pipe(switchMap(report => {
        if (!this.isCompareMode) {
          return ObservableOf({ report, compare: null });
        }

        const compareReportConfig = { reportType: this.reportType, filter: this.compareFilter, pager: this.pager, order: this.order };
        return this._reportService.getReport(compareReportConfig, sections)
          .pipe(map(compare => ({ report, compare })));
      }))
      .subscribe(({ report, compare }) => {
          if (compare) {
            this.handleCompare(report, compare);
          } else {
            if (report.table && report.table.header && report.table.data) {
              this.handleTable(report.table); // handle table
            }
            if (report.graphs.length) {
              this._chartDataLoaded = false;
              this.handleGraphs(report.graphs); // handle graphs
            }
            if (report.totals) {
              this.handleTotals(report.totals); // handle totals
            }
          }
          this.updateChartType();
          this.prepareCsvExportHeaders();
          this._isBusy = false;
        },
        error => {
          this._isBusy = false;
          const actions = {
            'close': () => {
              this._blockerMessage = null;
            },
            'retry': () => {
              this.loadReport();
            },
          };
          this._blockerMessage = this._errorsManager.getErrorMessage(error, actions);
        });
   }

   private handleCompare(current: Report, compare: Report): void {
     const currentPeriod = { from: this.filter.fromDate, to: this.filter.toDate };
     const comparePeriod = { from: this.compareFilter.fromDate, to: this.compareFilter.toDate };

      if (current.table && compare.table) {
        const { columns, tableData } = this._compareService.compareTableData(
          currentPeriod,
          comparePeriod,
          current.table,
          compare.table,
          this._dataConfig.table,
          this._reportInterval,
        );
        this._totalCount = current.table.totalCount;
        this._columns = columns;
        this._tableData = tableData;
      }

     if (current.totals && compare.totals) {
       this._tabsData = this._compareService.compareTotalsData(
         currentPeriod,
         comparePeriod,
         current.totals,
         compare.totals,
         this._dataConfig.totals,
         this._selectedMetrics
       );
       this._accumulativeStorage = this._compareService.compareTotalsData(
         currentPeriod,
         comparePeriod,
         current.totals,
         compare.totals,
         this._dataConfig.accumulative,
         this._selectedMetrics
       );
     }

     if (current.graphs.length && compare.graphs.length) {
       const { lineChartData, barChartData } = this._compareService.compareGraphData(
         currentPeriod,
         comparePeriod,
         current.graphs,
         compare.graphs,
         this._dataConfig.graph,
         this._reportInterval,
         () => this._chartDataLoaded = true
       );
       this._lineChartData = lineChartData;
       this._barChartData = barChartData;
     }
   }

  private handleTable(table: KalturaReportTable): void {
    const { columns, tableData } = this._reportService.parseTableData(table, this._dataConfig.table);
    this._totalCount = table.totalCount;
    this._columns = columns;
    this._tableData = tableData;
  }

  private handleTotals(totals: KalturaReportTotal): void {
    this._tabsData = this._reportService.parseTotals(totals, this._dataConfig.totals, this._selectedMetrics);
    this._accumulativeStorage = this._reportService.parseTotals(totals, this._dataConfig.accumulative);
  }

  private handleGraphs(graphs: KalturaReportGraph[]): void {
    const { lineChartData, barChartData } = this._reportService.parseGraphs(
      graphs,
      this._dataConfig.graph,
      { from: this.filter.fromDate, to: this.filter.toDate },
      this._reportInterval,
      () => this._chartDataLoaded = true
    );
    this._lineChartData = lineChartData;
    this._barChartData = barChartData;
  }

  private updateChartType(): void {
    this._chartType = ((this._selectedMetrics === 'added_storage' || this._selectedMetrics === 'deleted_storage') && this._reportInterval === KalturaReportInterval.months) ? 'bar' : 'line';
  }

  private prepareCsvExportHeaders(): void {
    let tabsData = JSON.parse(JSON.stringify(this._tabsData));
    this._accumulativeStorage.forEach((item: Tab) => {
      tabsData.push({title: item.title});
    });
    this._csvExportHeaders = this._dataConfigService.prepareCsvExportHeaders(tabsData, this._columns, 'app.bandwidth');
  }

}
