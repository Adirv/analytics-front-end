import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { KalturaReportExportItemType, KalturaReportType } from 'kaltura-ngx-client';
import { ExportConfigService, ExportItem } from 'shared/components/export-csv/export-config-base.service';

@Injectable()
export class GeoExportConfig extends ExportConfigService {
  constructor(private _translate: TranslateService) {
    super();
  }
  
  public getConfig(): ExportItem[] {
    return [
      {
        id: 'geo',
        label: this._translate.instant('app.audience.geo.exportLabels.geo'),
        reportType: KalturaReportType.mapOverlayCountry,
        sections: [KalturaReportExportItemType.table],
        order: '-count_plays',
      },
    ];
  }
}
