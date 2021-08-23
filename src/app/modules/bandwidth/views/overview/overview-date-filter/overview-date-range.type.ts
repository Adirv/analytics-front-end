import {KalturaReportInterval} from "kaltura-ngx-client";

export interface OverviewDateRange {
  label: string;
  prefix: string;
  isCurrent?: boolean;
  value: Date;
  interval: KalturaReportInterval;
}
