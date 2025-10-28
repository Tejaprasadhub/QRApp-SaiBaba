import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { environment } from './environments/environment';
import { AppModule } from './app/app-module';
if (environment.production) {
  // optional: enable production mode
  // import { enableProdMode } from '@angular/core';
  // enableProdMode();
}
// Use platformBrowserDynamic() to include the JIT compiler
platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch(err => console.error(err));
