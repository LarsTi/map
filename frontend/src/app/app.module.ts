import { NgModule } from '@angular/core';
import { RouterModule } from "@angular/router";
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { MapComponent } from './map/map.component';
import { PrecompileComponent } from './precompile/precompile.component';

import { PanelModule } from 'primeng/panel';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FileUploadModule } from 'primeng/fileupload';
import { ErrorListComponent } from './error-list/error-list.component';
import { DialogModule } from 'primeng/dialog';
import { CheckboxModule } from 'primeng/checkbox';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    AppComponent,
    MapComponent,
    PrecompileComponent,
    ErrorListComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    PanelModule,
    BrowserAnimationsModule,
    FileUploadModule,
    DialogModule,
    CheckboxModule,
    FormsModule,
    RouterModule.forRoot([
      {
        path: "",
        component: MapComponent
      },
      {
        path: "precompile",
        component: PrecompileComponent
      }])
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
