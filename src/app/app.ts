import { Component, signal } from '@angular/core';
import { AuthService } from './services/AuthService';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router } from '@angular/router';
import { LoaderService } from './services/loader.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: false,
  styleUrl: './app.scss'
})
export class App {
    loading = false;

 drawerVisible = false;
  currentYear = new Date().getFullYear();
  user: any = null;

  menuItems = [
    { label: 'Dashboard', icon: 'pi pi-home', route: '/dashboard' },
    { label: 'Products', icon: 'pi pi-mobile', route: '/products' },
    { label: 'Purchase Orders', icon: 'pi pi-shopping-cart', route: '/purchaseOrders' },
    { label: 'Customers', icon: 'pi pi-users', route: '/customer-list' },
{ label: 'Sales', icon: 'pi pi-chart-bar', route: '/sales' },
{ label: 'Categories', icon: 'pi pi-tags', route: '/categories' },
{ label: 'Sub Categories', icon: 'pi pi-th-large', route: '/subcategories' },
{ label: 'Low Stock', icon: 'pi pi-exclamation-triangle', route: '/reorder' }
  ];

  constructor(private auth: AuthService, private router: Router,private loaderService: LoaderService) {
    this.auth.user$.subscribe(u => (this.user = u));
// HTTP loader
    this.loaderService.loading$.subscribe(state => {
      this.loading = state;
    });    
  }

  toggleDrawer() {
    this.drawerVisible = !this.drawerVisible;
  }

   /** 🟣 Highlight currently active route */
  isActive(route: string): boolean {
    return this.router.url === route;
  }
  navigate(route: string) {
    this.drawerVisible = false;
    this.router.navigate([route]);
  }

  logout() {
    this.drawerVisible = false;
    this.auth.logout().then(() => this.router.navigate(['/login']));
  }
}
