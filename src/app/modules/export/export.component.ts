import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {cancelOnDestroy} from '@kaltura-ng/kaltura-common';
import {AreaBlockerMessage} from '@kaltura-ng/kaltura-ui';
import {AuthService, BrowserService, ErrorsManagerService, NavigationDrillDownService} from 'shared/services';
import {TranslateService} from '@ngx-translate/core';
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {buildCDNUrl} from "configuration/analytics-config";

@Component({
  selector: 'app-export',
  templateUrl: './export.component.html',
  styleUrls: ['./export.component.scss'],
})
export class ExportComponent implements OnInit, OnDestroy {
  public _downloadingReport = false;
  public _blockerMessage: AreaBlockerMessage = null;
  public _reportId = '';

  constructor(private _route: ActivatedRoute,
              private _http: HttpClient,
              private _translate: TranslateService,
              private _errorsManager: ErrorsManagerService,
              private _browserService: BrowserService,
              private _authService: AuthService) {
  }

  ngOnInit() {
    this._route.params
      .pipe(cancelOnDestroy(this))
      .subscribe(params => {
        this._reportId = params['id'];
      });
  }

  ngOnDestroy() {
  }

  public _downloadReport(): void {
    this._downloadingReport = true;
    this._blockerMessage = null;

    const url = buildCDNUrl(`/api_v3/index.php/service/report/action/serve/id/${this._reportId}/ks/${this._authService.ks}`);
    const httpOptions = {
      headers: new HttpHeaders({
        'Accept': 'text/html, application/xhtml+xml, */*',
        'Content-Type': 'application/x-www-form-urlencoded'
      }),
      responseType: 'text'
    };

    this._http.post(url, {}, httpOptions as any).subscribe(
      result => {
        this._downloadingReport = false;
        if (result.toString() === "") {
          const actions = {
            'close': () => {
              this._blockerMessage = null;
            }
          };
          this._blockerMessage = new AreaBlockerMessage({
            message: this._translate.instant('app.exportReports.reportNotFound'),
            buttons: [{
              label: this._translate.instant('app.common.close'),
              action: () => this._blockerMessage = null
            }]
          });
        } else {
          this._browserService.download(result, `${this._reportId}.csv`, 'text/csv');
        }
      },
      error => {
        this._downloadingReport = false;
        const actions = {
          'close': () => {
            this._blockerMessage = null;
          },
          'retry': () => {
            this._downloadReport();
          }
        };
        this._blockerMessage = this._errorsManager.getErrorMessage(error, actions);
      });

  }
}
