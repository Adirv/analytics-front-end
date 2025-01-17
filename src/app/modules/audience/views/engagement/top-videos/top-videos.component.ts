import { Component, OnInit, OnDestroy } from '@angular/core';
import { EngagementBaseReportComponent } from '../engagement-base-report/engagement-base-report.component';
import { AreaBlockerMessage, AreaBlockerMessageButton } from '@kaltura-ng/kaltura-ui';
import { KalturaAPIException, KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaObjectBaseFactory, KalturaReportInterval, KalturaReportTable, KalturaReportType } from 'kaltura-ngx-client';
import * as moment from 'moment';
import { AuthService, ErrorDetails, ErrorsManagerService, Report, ReportConfig, ReportService } from 'shared/services';
import { map, switchMap } from 'rxjs/operators';
import { BehaviorSubject, of as ObservableOf} from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { CompareService } from 'shared/services/compare.service';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import { TopVideosDataConfig } from './top-videos-data.config';
import { analyticsConfig } from 'configuration/analytics-config';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { TableRow } from 'shared/utils/table-local-sort-handler';
import { reportTypeMap } from 'shared/utils/report-type-map';
import { SortEvent } from 'primeng/api';
import { EntryDetailsOverlayData } from 'shared/components/entry-details-overlay/entry-details-overlay.component';

@Component({
  selector: 'app-engagement-top-videos',
  templateUrl: './top-videos.component.html',
  styleUrls: ['./top-videos.component.scss'],
  providers: [
    KalturaLogger.createLogger('EngagementTopVideosComponent'),
    TopVideosDataConfig,
    ReportService
  ]
})
export class EngagementTopVideosComponent extends EngagementBaseReportComponent implements OnInit, OnDestroy {
  private _partnerId = this._authService.pid;
  private _apiUrl = analyticsConfig.kalturaServer.uri.startsWith('http')
    ? analyticsConfig.kalturaServer.uri
    : `${location.protocol}//${analyticsConfig.kalturaServer.uri}`;
  private _compareFilter: KalturaEndUserReportInputFilter = null;
  private _dataConfig: ReportDataConfig;
  private _reportInterval = KalturaReportInterval.months;
  private _filter = new KalturaEndUserReportInputFilter({
    searchInTags: true,
    searchInAdminTags: false
  });
  
  protected _componentId = 'top-videos';

  public topVideos$: BehaviorSubject<{table: KalturaReportTable, compare: KalturaReportTable, busy: boolean, error: KalturaAPIException}> = new BehaviorSubject({table: null, compare: null, busy: false, error: null});
  public totalCount$: BehaviorSubject<number> = new BehaviorSubject(0);
  
  public _order = '-engagement_ranking';
  public _blockerMessage: AreaBlockerMessage = null;
  public _isBusy: boolean;
  public _tableData: TableRow<string>[] = [];
  public _compareTableData: TableRow<string>[] = [];
  public _entryDetails: EntryDetailsOverlayData[] = [];
  public _isCompareMode: boolean;
  public _columns: string[] = [];
  public _pager = new KalturaFilterPager({ pageSize: 50, pageIndex: 1 });
  public _firstTimeLoading = true;
  public _compareFirstTimeLoading = true;
  public _currentDates: string;
  public _compareDates: string;
  public _reportType = reportTypeMap(KalturaReportType.topContentCreator);

  constructor(private _errorsManager: ErrorsManagerService,
              private _reportService: ReportService,
              private _translate: TranslateService,
              private _authService: AuthService,
              private _compareService: CompareService,
              private _dataConfigService: TopVideosDataConfig,
              private _logger: KalturaLogger) {
    super();
    
    this._dataConfig = _dataConfigService.getConfig();
  }
  
  
  ngOnInit() {
  }
  
  protected _loadReport(): void {
    this.topVideos$.next({table: null, compare: null, busy: true, error: null});
    this.totalCount$.next(0);
    this._isBusy = true;
    this._blockerMessage = null;
    const reportConfig: ReportConfig = { reportType: this._reportType, filter: this._filter, pager: this._pager, order: this._order };
    this._reportService.getReport(reportConfig, this._dataConfig)
      .pipe(switchMap(report => {
        if (!this._isCompareMode) {
          return ObservableOf({ report, compare: null });
        }
        
        const compareReportConfig = { reportType: this._reportType, filter: this._compareFilter, pager: this._pager, order: this._order };
        return this._reportService.getReport(compareReportConfig, this._dataConfig)
          .pipe(map(compare => ({ report, compare })));
      }))
      .subscribe(({ report, compare }) => {
          this._tableData = [];
          this._entryDetails = [];
          this._compareTableData = [];
          
          if (report.table && report.table.header && report.table.data) {
            this._handleTable(report.table, compare); // handle table
            this.topVideos$.next({table: report.table, compare: compare && compare.table ? compare.table : null, busy: false, error: null});
            this.totalCount$.next(report.table.totalCount);
          } else {
            this.topVideos$.next({table: null, compare: null, busy: false, error: null});
            this.totalCount$.next(0);
          }
          this._isBusy = false;
          this._firstTimeLoading = false;
          this._compareFirstTimeLoading = false;
        },
        error => {
          this._isBusy = false;
          const actions = {
            'close': () => {
              this._blockerMessage = null;
            },
            'retry': () => {
              this._loadReport();
            },
          };
          this.topVideos$.next({table: null, compare: null, busy: false, error: error});
          this.totalCount$.next(0);
          this._blockerMessage = this._errorsManager.getErrorMessage(error, actions);
        });
  }
  
  protected _updateFilter(): void {
    this._filter.timeZoneOffset = this._dateFilter.timeZoneOffset;
    this._filter.fromDate = this._dateFilter.startDate;
    this._filter.toDate = this._dateFilter.endDate;
    this._filter.interval = this._dateFilter.timeUnits;
    this._reportInterval = this._dateFilter.timeUnits;
    this._pager.pageIndex = 1;
    this._isCompareMode = false;
    if (this._dateFilter.compare.active) {
      this._compareFirstTimeLoading = true;
      this._isCompareMode = true;
      const compare = this._dateFilter.compare;
      this._compareFilter = Object.assign(KalturaObjectBaseFactory.createObject(this._filter), this._filter);
      this._compareFilter.fromDate = compare.startDate;
      this._compareFilter.toDate = compare.endDate;
    } else {
      this._compareFilter = null;
      this._compareFirstTimeLoading = true;
    }
  }
  
  protected _updateRefineFilter(): void {
    this._pager.pageIndex = 1;
    this._refineFilterToServerValue(this._filter);
    if (this._compareFilter) {
      this._refineFilterToServerValue(this._compareFilter);
    }
  }
  
  private _handleTable(table: KalturaReportTable, compare?: Report): void {
    const { columns, tableData } = this._reportService.parseTableData(table, this._dataConfig.table);
    const extendTableRow = (item, index) => {
      (<any>item)['index'] = index + 1;
      item['thumbnailUrl'] = `${this._apiUrl}/p/${this._partnerId}/sp/${this._partnerId}00/thumbnail/entry_id/${item['object_id']}/width/256/height/144}`;
      return item;
    };
    this._columns = columns;
    this._tableData = tableData.map(extendTableRow);
    this._currentDates = null;
    this._compareDates = null;
  
    const { tableData: entryDetails } = this._reportService.parseTableData(table, this._dataConfig.entryDetails);
    this._entryDetails = entryDetails.map(extendTableRow);
    
    if (compare && compare.table && compare.table.header && compare.table.data) {
      const { tableData: compareTableData } = this._reportService.parseTableData(compare.table, this._dataConfig.table);
      this._compareTableData = compareTableData.map(extendTableRow);
      this._columns = ['entry_name', 'count_plays'];
      this._currentDates = DateFilterUtils.getMomentDate(this._dateFilter.startDate).format('MMM D, YYYY') + ' - ' + moment(DateFilterUtils.fromServerDate(this._dateFilter.endDate)).format('MMM D, YYYY');
      this._compareDates = DateFilterUtils.getMomentDate(this._dateFilter.compare.startDate).format('MMM D, YYYY') + ' - ' + moment(DateFilterUtils.fromServerDate(this._dateFilter.compare.endDate)).format('MMM D, YYYY');
  
      const { tableData: compareEntryDetails } = this._reportService.parseTableData(compare.table, this._dataConfig.entryDetails);
      this._entryDetails = [...this._entryDetails, ...compareEntryDetails.map(extendTableRow)];
    }
  }

  ngOnDestroy() {
    this.topVideos$.complete();
    this.totalCount$.complete();
  }

  public _onSortChanged(event: SortEvent): void {
    if (event.data.length && event.field && event.order) {
      const order = event.order === 1 ? '+' + event.field : '-' + event.field;
      if (order !== this._order) {
        this._order = order;
        this._loadReport();
      }
    }
  }
}
