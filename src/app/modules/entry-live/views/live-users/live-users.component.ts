import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { LiveUsersData, LiveUsersWidget } from './live-users.widget';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { ErrorsManagerService } from 'shared/services';
import { filter } from 'rxjs/operators';
import { KalturaExtendedLiveEntry } from '../../entry-live.service';
import { KalturaStreamStatus } from '../../utils/get-stream-status';

@Component({
  selector: 'app-live-users',
  templateUrl: './live-users.component.html',
  styleUrls: ['./live-users.component.scss']
})
export class LiveUsersComponent implements OnInit, OnDestroy {
  @Input() set entry(value: KalturaExtendedLiveEntry) {
    if (value) {
      this._isLive = [KalturaStreamStatus.offline, KalturaStreamStatus.initializing].indexOf(value.streamStatus) === -1;
      this._fakeData();
      
      if (!this._isLive) {
        this._resetGraph();
      }
    } else {
      this._resetGraph();
    }
  }
  
  private _graphPoints: number[][];
  private _echartsIntance: any;
  private _isLive = false;
  private _interval: number;
  
  public _isBusy = true;
  public _blockerMessage: AreaBlockerMessage;
  public _data: LiveUsersData;
  public _graphData: { [key: string]: any } = {};
  public _activeUsersCount = 0;
  public _engagedUsersCount = 0;
  
  constructor(private _liveUsersWidget: LiveUsersWidget,
              private _errorsManager: ErrorsManagerService) {
    this._resetGraph();
  }
  
  ngOnInit() {
    this._liveUsersWidget.state$
      .pipe(cancelOnDestroy(this))
      .subscribe(state => {
        if (state.error) {
          const actions = {
            'close': () => {
              this._blockerMessage = null;
            },
            'retry': () => {
              this._isBusy = true;
              this._liveUsersWidget.retry();
            },
          };
          this._blockerMessage = this._errorsManager.getErrorMessage(state.error, actions);
        }
      });
    
    this._liveUsersWidget.data$
      .pipe(cancelOnDestroy(this), filter(Boolean))
      .subscribe(data => {
        this._isBusy = false;
        this._data = data;
      });
    
    this._graphData = this._liveUsersWidget.getGraphConfig(this._graphPoints[0], this._graphPoints[1]);
    
    
    // TODO remove mocked data once API is ready
    this._fakeData();
  }
  
  ngOnDestroy(): void {
  }
  
  private _resetGraph(): void {
    this._activeUsersCount = 0;
    this._engagedUsersCount = 0;
    this._graphPoints = [
      Array.from({ length: 18 }, () => 0),
      Array.from({ length: 18 }, () => 0),
    ];
  
    if (this._echartsIntance) {
      this._echartsIntance.setOption({ series: [{ data: this._graphPoints[0] }, { data: this._graphPoints[1] }] });
    }
  }
  
  private _getRand(): number {
    return Math.abs(Math.round(Math.random() * 21 - 10));
  }
  
  private _fakeData(): void {
    clearInterval(this._interval);

    if (this._isLive) {
      this._interval = setInterval(() => {
        this._updateGraphPoints(this._getRand(), this._getRand());
        this._activeUsersCount = this._graphPoints[0][17];
        this._engagedUsersCount = this._graphPoints[1][17];
      }, 10000);
    }
  }
  
  private _updateGraphPoints(activeUsers: number, engagedUsers: number): void {
    const active = [...this._graphPoints[0]];
    const engaged = [...this._graphPoints[1]];
    active.shift();
    active.push(activeUsers);
    engaged.shift();
    engaged.push(engagedUsers);
    
    this._graphPoints = [active, engaged];
    
    if (this._echartsIntance) {
      this._echartsIntance.setOption({ series: [{ data: active }, { data: engaged }] });
    }
  }
  
  public _onChartInit(ec: any): void {
    this._echartsIntance = ec;
  }
}
