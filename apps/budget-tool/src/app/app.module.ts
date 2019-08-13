import { BrowserModule } from '@angular/platform-browser';
import { NgModule, ModuleWithProviders } from '@angular/core';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { HttpClientModule } from '@angular/common/http';
import { NgReduxRouterModule } from '@angular-redux/router';
import { NgReduxModule } from '@angular-redux/store';
import { MobxAngularModule } from 'mobx-angular';
// import { StoreModule } from '@picsa/extension/src/app/state';
// import { CanvasWhiteboardModule } from 'ng2-canvas-whiteboard';
import { PicsaDbModule, PicsaNativeModule } from '@picsa/modules';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BudgetMaterialModule } from './material.module';

// configure translation from file
// export function createTranslateLoader(http: HttpClient) {
//   return new TranslateHttpLoader(http, 'assets/i18n/', '.json');
// }

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    HttpClientModule,
    BudgetMaterialModule,
    // TranslateModule.forRoot({
    //   loader: {
    //     provide: TranslateLoader,
    //     useFactory: createTranslateLoader,
    //     deps: [HttpClient]
    //   },
    //   isolate: false
    // }),
    NgReduxModule,
    NgReduxRouterModule.forRoot(),
    MobxAngularModule,
    // StoreModule,
    // CanvasWhiteboardModule,
    PicsaDbModule.forRoot(),
    PicsaNativeModule.forRoot()
  ],
  exports: [],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}

// additional export to allow it to be consumed by other apps
// see: https://medium.com/disney-streaming/combining-multiple-angular-applications-into-a-single-one-e87d530d6527
@NgModule({})
export class BudgetToolModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: AppModule,
      providers: []
    };
  }
}
