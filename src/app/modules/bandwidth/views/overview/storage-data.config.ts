import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import { analyticsConfig } from 'configuration/analytics-config';
import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataConfig, ReportDataSection, ReportDataBaseConfig } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';
import { fileSize } from 'shared/utils/file-size';
import { getPrimaryColor, getSecondaryColor } from 'shared/utils/colors';

@Injectable()
export class StorageDataConfig extends ReportDataBaseConfig {
  constructor(_translate: TranslateService) {
    super(_translate);
  }

  public getConfig(): ReportDataConfig {
    return {
      [ReportDataSection.graph]: {
        fields: {
          'peak_storage': {
            format: value => value,
            graphTooltip: (value) => `<span class="kValue">${ReportHelper.numberOrZero(String(value), false)}</span>&nbsp;MB`,
          },
          'bandwidth_consumption': {
            format: value => value,
            graphTooltip: (value) => `<span class="kValue">${ReportHelper.numberOrZero(String(value), false)}</span>&nbsp;MB`,
          },
          'transcoding_consumption': {
            format: value => value,
            graphTooltip: (value) => `<span class="kValue">${ReportHelper.numberOrZero(String(value), false)}</span>&nbsp;MB`,
          },
          'total_entries': {
            format: value => value,
            colors: [getPrimaryColor('entries'), getSecondaryColor('entries')],
          },
         'unique_known_users': {
            format: value => value,
            colors: [getPrimaryColor('entries'), getSecondaryColor('entries')],
          },
         'live_view_time': {
            format: value => value,
            colors: [getPrimaryColor('entries'), getSecondaryColor('entries')],
          },
        }
      },
      [ReportDataSection.table]: {
        fields: {
          'peak_storage': {
            format: value => ReportHelper.numberOrZero(fileSize(value).value, false),
            sortOrder: 1
          },
          'bandwidth_consumption': {
            format: value => ReportHelper.numberOrZero(fileSize(value).value, false),
            sortOrder: 2
          },
          'transcoding_consumption': {
            format: value => ReportHelper.numberOrZero(fileSize(value).value, false),
            sortOrder: 3
          },
          'total_entries': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 4
          },
          'unique_known_users': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 5
          },
          'live_view_time': {
            format: value => ReportHelper.numberOrZero(Math.round(ReportHelper.hours(value))),
            sortOrder: 6
          }
        }
      },
      [ReportDataSection.totals]: {
        preSelected: 'total_storage_mb',
        fields: {
          'peak_storage': {
            format: value => ReportHelper.numberOrZero(fileSize(value).value, false),
            title: this._translate.instant(`app.bandwidth.stored_media`),
            units: value => fileSize(value).units,
            sortOrder: 1
          },
          'bandwidth_consumption': {
            format: value => ReportHelper.numberOrZero(fileSize(value).value, false),
            title: this._translate.instant(`app.bandwidth.outbound_bandwidth`),
            units: value => fileSize(value).units,
            sortOrder: 2
          },
          'transcoding_consumption': {
            format: value => ReportHelper.numberOrZero(fileSize(value).value, false),
            title: this._translate.instant(`app.bandwidth.transcoded_media`),
            units: value => fileSize(value).units,
            sortOrder: 3
          },
          'total_entries': {
            format: value => ReportHelper.numberOrZero(value),
            title: this._translate.instant(`app.bandwidth.managed_entries`),
            sortOrder: 4
          },
          'total_interactive_video_entries': {
            format: value => ReportHelper.numberOrZero(value),
            title: this._translate.instant(`app.bandwidth.interactive_videos`),
            sortOrder: 5
          },
          'unique_known_users': {
            format: value => ReportHelper.numberOrZero(value),
            title: this._translate.instant(`app.bandwidth.active_unique_users`),
            sortOrder: 6
          },
          'live_view_time': {
            format: value => ReportHelper.numberOrZero(Math.round(ReportHelper.hours(value))),
            title: this._translate.instant(`app.bandwidth.live_viewing_hours`),
            units: value => 'Hours',
            sortOrder: 7
          },
          'video_streams': {
            format: value => ReportHelper.numberOrZero(value),
            title: this._translate.instant(`app.bandwidth.delivered_video_streams`),
            sortOrder: 8
          },
          'total_credits': {
            format: value => ReportHelper.numberOrZero(value),
            title: this._translate.instant(`app.bandwidth.credits_spent`),
            sortOrder: 9
          },
        }
      }
    };
  }
}
