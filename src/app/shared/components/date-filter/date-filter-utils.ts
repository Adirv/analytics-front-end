import * as moment from 'moment';

export class DateFilterUtils {
  static getTimeZoneOffset(): number {
    const today: Date = new Date();
    return today.getTimezoneOffset();
  }

  static toServerDate(value: Date): number {
    const timeZoneOffset = this.getTimeZoneOffset() * 60000 * (-1);
    return value ? Math.round((value.getTime() + timeZoneOffset) / 1000) : null;
  }

  static fromServerDate(value: number): Date {
    return (value ? new Date(value * 1000) : null);
  }


  static getDay(value: Date): string {
    return value.getFullYear().toString() + DateFilterUtils.getFull(value.getMonth() + 1) + DateFilterUtils.getFull(value.getDate());
  }

  static getFull(num: number): string {
    return num > 9 ? num.toString() : ( '0' + num.toString());
  }

  static formatMonthString(value: string | number | Date, locale: string): string {
    let result = '';
    if (typeof value === 'string') {
      const year: string = value.substring(0, 4);
      const month: string = value.substring(4, 6);
      const date: Date = new Date( parseFloat(year) , parseFloat(month) , 0);
      result = date.toLocaleString(locale, { month: 'long' }) + ' ' + date.getFullYear();
    } else if (typeof value === 'number') {
      const date = this.fromServerDate(value);
      result = date.toLocaleString(locale, { month: 'long' }) + ' ' + date.getFullYear();
    } else if (value instanceof Date) {
      result = value.toLocaleString(locale, { month: 'long' }) + ' ' + value.getFullYear();
    } else {
      throw new Error(`Unsupported value: ${value}`);
    }
  
    return result;
  }
  
  static formatFullDateString(value: string | number | Date, locale: string): string {
    let result = '';
    if (typeof value === 'string') {
      const year: string = value.substring(0, 4);
      const month: string = value.substring(4, 6);
      const day: string = value.substring(6, 8);
      result = month + '/' + day + '/' + year;
    } else if (typeof value === 'number') {
      const date = this.fromServerDate(value);
      result = this._getMonth(date) + '/' + this._getDate(date) + '/' + date.getFullYear();
    } else if (value instanceof Date) {
      result = this._getMonth(value) + '/' + this._getDate(value) + '/' + value.getFullYear();
    } else {
      throw new Error(`Unsupported value: ${value}`);
    }
  
    return result;
  }
  
  static formatDayString(value: string | number | Date, locale: string): string {
    let result = '';
    if (typeof value === 'string') {
      const year: string = value.substring(0, 4);
      const month: string = value.substring(4, 6);
      const day: string = value.substring(6, 8);
      const date: Date = new Date( parseFloat(year) , parseFloat(month) , 0);
      result = `${date.toLocaleString(locale, { month: 'short' })} ${day}`;
    } else if (typeof value === 'number') {
      const date = this.fromServerDate(value);
      result = `${date.toLocaleString(locale, { month: 'short' })} ${this._getDate(date)}`;
    } else if (value instanceof Date) {
      result = `${value.toLocaleString(locale, { month: 'short' })} ${this._getDate(value)}`;
    } else {
      throw new Error(`Unsupported value: ${value}`);
    }
  
    return result;
  }

  static formatMonthOnlyString(value: string | number | Date, locale: string): string {
    let result = '';
    if (typeof value === 'string') {
      const year: string = value.substring(0, 4);
      const month: string = value.substring(4, 6);
      const date: Date = new Date( parseFloat(year) , parseFloat(month) , 0);
      result = date.toLocaleString(locale, { month: 'long' });
    } else if (typeof value === 'number') {
      const date = this.fromServerDate(value);
      result = date.toLocaleString(locale, { month: 'long' });
    } else if (value instanceof Date) {
      result = value.toLocaleString(locale, { month: 'long' });
    } else {
      throw new Error(`Unsupported value: ${value}`);
    }
  
    return result;
  }

  static formatShortDateString(value: string | number | Date, locale: string): string {
    let result = '';
    if (typeof value === 'string') {
      const year: string = value.substring(0, 4);
      const month: string = value.substring(4, 6);
      const day: string = value.substring(6, 8);
      result = month + '/' + day;
    } else if (typeof value === 'number') {
      const date = this.fromServerDate(value);
      result = this._getMonth(date) + '/' + this._getDate(date);
    } else if (value instanceof Date) {
      result = this._getMonth(value) + '/' + this._getDate(value);
    } else {
      throw new Error(`Unsupported value: ${value}`);
    }
  
    return result;
  }

  static formatMonthDayString(value: string | number | Date, locale: string): string {
    let result = '';
    if (typeof value === 'string') {
      const year: string = value.substring(0, 4);
      const month: string = value.substring(4, 6);
      const day: string = value.substring(6, 8);
      const date: Date = new Date( parseFloat(year) , parseFloat(month) , 0);
      result = `${date.toLocaleString(locale, { month: 'short' })} ${day}, ${date.getFullYear()}`;
    } else if (typeof value === 'number') {
      const date = this.fromServerDate(value);
      result = `${date.toLocaleString(locale, { month: 'short' })} ${this._getDate(date)}, ${date.getFullYear()}`;
    } else if (value instanceof Date) {
      result = `${value.toLocaleString(locale, { month: 'short' })} ${this._getDate(value)}, ${value.getFullYear()}`;
    } else {
      throw new Error(`Unsupported value: ${value}`);
    }
  
    return result;
  }
  
  static getMomentDate(value: string | number | Date | moment.Moment): moment.Moment {
    let result = value;
    if (typeof value === 'number') {
      result = this._isUnixDate(value) ? this.fromServerDate(value) : new Date(value);
    }
    
    if (typeof value === 'string') {
      result = new Date(value);
    }
    return moment(result);
  }
  
  static parseDateString(value: string): moment.Moment {
    const day = Number(value.substring(6, 8));
    
    if (!day) {
      value += '01'; // add the first day of a month to correct parsing
    }
  
    return moment(value);
  }
  
  private static _isUnixDate(number: number): boolean {
    return number.toString().length === 10;
  }
  
  private static _getMonth(date: Date): string {
    return ('0' + (date.getMonth() + 1)).slice(-2);
  }
  
  private static _getDate(date: Date): string {
    return ('0' + date.getDate()).slice(-2);
  }
}
