import { Injectable, NgZone } from '@angular/core';
import { finalize, Observable } from 'rxjs';
import { LoaderService } from './loader.service';

@Injectable({ providedIn: 'root' })
export class FirestoreLoaderService {

  constructor(
    private loader: LoaderService,
    private zone: NgZone
  ) {}

  wrapPromise<T>(promise: Promise<T>): Promise<T> {
    this.zone.run(() => this.loader.show());

    return promise.finally(() => {
      this.zone.run(() => this.loader.hide());
    });
  }

  wrapObservable<T>(obs$: Observable<T>): Observable<T> {
    this.zone.run(() => this.loader.show());

    return obs$.pipe(
      finalize(() => {
        this.zone.run(() => this.loader.hide());
      })
    );
  }
}
