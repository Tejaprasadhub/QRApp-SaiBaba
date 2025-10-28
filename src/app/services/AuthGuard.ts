import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { user } from '@angular/fire/auth';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private auth: Auth, private router: Router) {}

  canActivate() {
    return user(this.auth).pipe(
      map(u => {
        if (!u) {
          this.router.navigate(['/login']);
          return false;
        }
        return true;
      })
    );
  }
}
