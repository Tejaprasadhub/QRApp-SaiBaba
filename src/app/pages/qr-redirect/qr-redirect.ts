import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-qr-redirect',
  standalone: false,
  template: `
    <div class="redirect-page">
      <p>Redirecting you to the Customer Form...</p>
    </div>
  `,
  styles: [`
    .redirect-page {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background: linear-gradient(135deg, #ff9a44, #ff6a00);
      color: white;
      font-size: 1.3rem;
      font-weight: 500;
    }
  `]
})
export class QrRedirectComponent implements OnInit {
  constructor(private router: Router) {}

  ngOnInit() {
    setTimeout(() => {
      // this.router.navigate(['/customer-form']);
      window.location.href = 'https://tejaprasadhub.github.io/#/customer-form';
    }, 500); // 1-second delay for smoother UX
  }
}
