import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AuthService } from "shared/services";

@Component({
  selector: 'thumb-loader',
  templateUrl: './thumb-loader.component.html',
  styleUrls: ['./thumb-loader.component.scss']
})
export class ThumbLoaderComponent {
  
  @Input() thumbnailUrl: string = null;
  @Input() width = 86;
  @Input() height = 48;
  @Input() disabled = false;
  @Output() onErrror = new EventEmitter<string>();
  @Output() onClick = new EventEmitter();
  @Output() onMouseEnter = new EventEmitter<any>();
  @Output() onMouseLeave = new EventEmitter<any>();

  public _ks = '';

  constructor(_authService: AuthService) {
    this._ks = _authService.ks;
  }
  
  public _onError(): void {
    this.onErrror.emit('error');
  }
  
  public _onClick(): void {
    if (!this.disabled) {
      this.onClick.emit();
    }
  }
  
  public _onMouseEnter(event): void {
    if (!this.disabled) {
      this.onMouseEnter.emit(event);
    }
  }
  
  public _onMouseLeave(event): void {
    if (!this.disabled) {
      this.onMouseLeave.emit(event);
    }
  }
}
