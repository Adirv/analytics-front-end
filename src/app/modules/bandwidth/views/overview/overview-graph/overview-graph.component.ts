import {Component, Input, OnInit} from '@angular/core';
import {AreaBlockerMessage} from "@kaltura-ng/kaltura-ui";
import { EChartOption } from 'echarts';
import {getChartConfig} from "./overview-chart.config";
import {ReportDataConfig, ReportDataFields, ReportDataSection} from "shared/services/storage-data-base.config";
import {ErrorsManagerService, ReportConfig, ReportService} from "shared/services";
import {map, switchMap} from "rxjs/operators";
import {of as ObservableOf} from "rxjs";
import {PublisherStorageDataConfig} from "../../publisher-storage/publisher-storage-data.config";
import {TableRow} from "shared/utils/table-local-sort-handler";
import {KalturaReportGraph, KalturaReportInputFilter, KalturaReportInterval, KalturaReportTotal, KalturaReportType} from "kaltura-ngx-client";
import {reportTypeMap} from "shared/utils/report-type-map";
import {PublisherExportConfig} from "../../publisher-storage/publisher-export.config";
import {KalturaLogger} from "@kaltura-ng/kaltura-logger";
import {DateFilterUtils} from "shared/components/date-filter/date-filter-utils";
import {SelectItem} from "primeng/api";
import {EntryLiveUsersMode} from "configuration/analytics-config";
import {TranslateService} from "@ngx-translate/core";

@Component({
  selector: 'app-overview-graph',
  templateUrl: './overview-graph.component.html',
  styleUrls: ['./overview-graph.component.scss'],
  providers: [
    PublisherStorageDataConfig,
  ]
})
export class OverviewGraphComponent implements OnInit {
  private _dataConfig: ReportDataConfig;

  public isBusy: boolean;
  public blockerMessage: AreaBlockerMessage = null;
  public selectedMetrics: string;
  public barChartData: any = {'bandwidth_consumption': {}};
  public tableData: TableRow<string>[] = [];
  public reportType: KalturaReportType = reportTypeMap(KalturaReportType.partnerUsage);
  public chartDataLoaded = false;
  public reportInterval: KalturaReportInterval = KalturaReportInterval.months;
  public filter: KalturaReportInputFilter = new KalturaReportInputFilter(
    {
      searchInTags: true,
      searchInAdminTags: false
    }
  );
  private _order = '-month_id';

  public _mainMetricsOptions: SelectItem[] = [];
  @Input() colorsMap: { [metric: string]: string } = {};
  public _selectedMain: string;

  public _fields: ReportDataFields;
  public _selectedMetrics: string[];
  public _metrics: string[];
  public _colorsMap: { [metric: string]: string } = {};

  constructor(private _dataConfigService: PublisherStorageDataConfig,
              private _errorsManager: ErrorsManagerService,
              private _reportService: ReportService,
              private _translate: TranslateService) {
    this._dataConfig = _dataConfigService.getConfig();
    this.selectedMetrics = this._dataConfig.totals.preSelected;

    this._fields = _dataConfigService.getConfig()[ReportDataSection.graph].fields;
    this._colorsMap = Object.keys(this._fields).reduce((acc, val) => (acc[val] = (this._fields[val].colors && this._fields[val].colors[0]) || '#0f0', acc), {});

    this._metrics = Object.keys(this._fields);
    this._mainMetricsOptions = this._getOptions(this._metrics);
    this._mainMetricsOptions.unshift(...this._getOptions(['none']));
  }

  private _getOptions(metrics: string[]): SelectItem[] {
    return metrics.map(metric => ({
      label: this._translate.instant(`app.entryLive.discovery.${metric}`),
      value: metric,
    }));
  }

  ngOnInit(): void {
    this.filter.fromDate = DateFilterUtils.toServerDate(new Date(2020, 7, 18), true);
    this.filter.toDate = DateFilterUtils.toServerDate(new Date(), false);
    this.filter.interval = this.reportInterval;
    this.loadReport();
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
              // this._handleTable(report.graphs);
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

  // private _handleTable(graphs: KalturaReportGraph[]): void {
  //   const { columns, tableData, totalCount } = this._reportService.tableFromGraph(
  //     graphs,
  //     this._dataConfig.table,
  //     this.reportInterval,
  //   );
  //   this._totalCount = totalCount;
  //   this._columns = columns;
  //   this._tableData = tableData;
  // }

  private handleGraphs(graphs: KalturaReportGraph[]): void {
    const { barChartData } = this._reportService.parseGraphs(
      graphs,
      this._dataConfig.graph,
      { from: this.filter.fromDate, to: this.filter.toDate },
      this.reportInterval,
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

}
