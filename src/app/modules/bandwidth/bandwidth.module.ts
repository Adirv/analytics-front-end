import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';

import { routing } from './bandwidth.routes';
import { BandwidthComponent } from './bandwidth.component';
import { PublisherStorageComponent } from './views/publisher-storage/publisher-storage.component';
import { EndUserStorageComponent } from './views/end-user/end-user-storage.component';
import { SharedModule } from 'shared/shared.module';
import { AreaBlockerModule } from '@kaltura-ng/kaltura-ui';

@NgModule({
  imports: [
    AreaBlockerModule,
    CommonModule,
    FormsModule,
    TranslateModule,
    DropdownModule,
    ButtonModule,
    SharedModule,
    RouterModule.forChild(routing),
  ],
  declarations: [
    BandwidthComponent,
    PublisherStorageComponent,
    EndUserStorageComponent
  ],
  exports: [],
  providers: []
})
export class BandwidthModule {
}
