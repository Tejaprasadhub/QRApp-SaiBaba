import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LoaderService {
  private counter = 0;
  private _loading$ = new BehaviorSubject<boolean>(false);

  loading$ = this._loading$.asObservable();

  show() {
    this.counter++;
    if (this.counter === 1) {
      this._loading$.next(true);
    }
  }

  hide() {
    this.counter--;
    if (this.counter <= 0) {
      this.counter = 0;
      this._loading$.next(false);
    }
  }
}
