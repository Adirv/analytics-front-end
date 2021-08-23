import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {AreaBlockerMessage} from "@kaltura-ng/kaltura-ui";
import { EChartOption } from 'echarts';
import {getChartConfig} from "./overview-chart.config";
import {ReportDataConfig, ReportDataFields, ReportDataSection} from "shared/services/storage-data-base.config";
import {ErrorsManagerService, ReportConfig, ReportService} from "shared/services";
import {map, switchMap} from "rxjs/operators";
import {of as ObservableOf} from "rxjs";
import {PublisherStorageDataConfig} from "../../publisher-storage/publisher-storage-data.config";
import {tableLocalSortHandler, TableRow} from "shared/utils/table-local-sort-handler";
import {KalturaReportGraph, KalturaReportInputFilter, KalturaReportInterval, KalturaReportTotal, KalturaReportType} from "kaltura-ngx-client";
import {reportTypeMap} from "shared/utils/report-type-map";
import {PublisherExportConfig} from "../../publisher-storage/publisher-export.config";
import {KalturaLogger} from "@kaltura-ng/kaltura-logger";
import {DateFilterUtils} from "shared/components/date-filter/date-filter-utils";
import {SelectItem, SortEvent} from "primeng/api";
import {analyticsConfig, EntryLiveUsersMode} from "configuration/analytics-config";
import {TranslateService} from "@ngx-translate/core";
import {FrameEventManagerService, FrameEvents} from "shared/modules/frame-event-manager/frame-event-manager.service";
import {OverviewDataConfig} from "../overview-data.config";
import {OverviewDateRange} from "../overview-date-filter/overview-date-range.type";
import {DateChangeEvent} from "shared/components/date-filter/date-filter.service";

@Component({
  selector: 'app-overview-graph',
  templateUrl: './overview-graph.component.html',
  styleUrls: ['./overview-graph.component.scss'],
  providers: [
    KalturaLogger.createLogger('OverviewGraphComponent'),
    OverviewDataConfig,
  ]
})
export class OverviewGraphComponent implements OnChanges {
  @Input() dateRange: OverviewDateRange;
  @Input() filter: KalturaReportInputFilter;

  private _dataConfig: ReportDataConfig;

  public isBusy: boolean;
  public blockerMessage: AreaBlockerMessage = null;
  public selectedMetrics: string;
  public barChartData: any = {'bandwidth_consumption': {}};
  public tableData: TableRow<string>[] = [];
  public reportType: KalturaReportType = reportTypeMap(KalturaReportType.partnerUsage);
  public chartDataLoaded = false;

  public _mainMetricsOptions: SelectItem[] = [];
  public _selectedMain: string;

  public _fields: ReportDataFields;
  public _selectedMetrics: string[];
  public _metrics: string[];
  public _colorsMap: { [metric: string]: string } = {};

  public _showTable = false;
  public _columns: string[] = [];
  public _pageSize = analyticsConfig.defaultPageSize;
  public _tableData: TableRow<string>[] = [];
  public _totalCount: number;
  private _order = '-month_id';

  constructor(private _dataConfigService: OverviewDataConfig,
              private _errorsManager: ErrorsManagerService,
              private _reportService: ReportService,
              private _translate: TranslateService,
              private _logger: KalturaLogger,
              private _frameEventManager: FrameEventManagerService) {
    this._dataConfig = _dataConfigService.getConfig();
    this.selectedMetrics = this._dataConfig.totals.preSelected;

    this._fields = _dataConfigService.getConfig()[ReportDataSection.graph].fields;
    this._colorsMap = Object.keys(this._fields).reduce((acc, val) => (acc[val] = (this._fields[val].colors && this._fields[val].colors[0]) || '#0f0', acc), {});

    this._metrics = Object.keys(this._fields);
    this._mainMetricsOptions = this._getOptions(this._metrics);
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes['dateRange'].currentValue && this.filter.fromDate) {
      this._logger.debug('Update filter', () => this.filter);
      this._order = this.filter.interval === KalturaReportInterval.days ? '-date_id' : '-month_id';

      this.loadReport();
    }
  }

  private _getOptions(metrics: string[]): SelectItem[] {
    return metrics.map(metric => ({
      label: this._translate.instant(`app.bandwidth.publisher_table.${metric}`),
      value: metric,
    }));
  }

  private loadReport(sections = this._dataConfig): void {
    this.isBusy = true;
    this.tableData = [];
    this.blockerMessage = null;

    sections = { ...sections }; // make local copy
    delete sections[ReportDataSection.table]; // remove table config to prevent table request

    const reportConfig: ReportConfig = { reportType: this.reportType, filter: this.filter, order: this._order };
    this._reportService.getReport(reportConfig, sections)
      .subscribe(report => {
            if (report.graphs.length) {
              this.chartDataLoaded = false;
              this.handleGraphs(report.graphs); // handle graphs
              this._handleTable(report.graphs);
            }
          this.isBusy = false;
        },
        error => {
          this.isBusy = false;
          const actions = {
            'close': () => {
              this.blockerMessage = null;
            },
            'retry': () => {
              this.loadReport();
            },
          };
          this.blockerMessage = this._errorsManager.getErrorMessage(error, actions);
        });
  }

  private _handleTable(graphs: KalturaReportGraph[]): void {
    const { columns, tableData, totalCount } = this._reportService.tableFromGraph(
      graphs,
      this._dataConfig.table,
      this.filter.interval,
    );
    this._totalCount = totalCount;
    this._columns = columns;
    this._tableData = tableData;
  }

  private handleGraphs(graphs: KalturaReportGraph[]): void {
    const { barChartData } = this._reportService.parseGraphs(
      graphs,
      this._dataConfig.graph,
      { from: this.filter.fromDate, to: this.filter.toDate },
      this.filter.interval,
      () => this.chartDataLoaded = true
    );
    this.barChartData = barChartData;
  }

  public _onChange(initial = false): void {
    // this._updateOptions(initial);
    //
    // this.selectorChange.emit({
    //   selected: [this._selectedMain, this._selectedSecondary],
    //   initialRun: initial,
    // });
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

  public _onSortChanged(event: SortEvent): void {
    this._logger.trace('Handle local sort changed action by user', { field: event.field, order: event.order });
    this._order = tableLocalSortHandler(event, this._order);
  }

}
