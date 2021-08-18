import { Component, OnInit } from '@angular/core';
import {FilterComponent} from "shared/components/filter/filter.component";

@Component({
  selector: 'app-overview-filter',
  templateUrl: './overview-filter.component.html',
  styleUrls: ['./overview-filter.component.scss']
})
export class OverviewFilterComponent extends FilterComponent implements OnInit {
  ngOnInit(): void {
  }

}
