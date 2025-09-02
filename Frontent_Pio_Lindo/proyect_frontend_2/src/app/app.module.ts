import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {HttpClientModule,HTTP_INTERCEPTORS} from "@angular/common/http";
import {NgbModule} from "@ng-bootstrap/ng-bootstrap";
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { UsuariosComponent } from './components/usuarios/usuarios.component';
import { VentasComponent } from './components/ventas/ventas.component';
import { CajaComponent } from './components/caja/caja.component';
import { ProductosComponent } from './components/productos/productos.component';
import { SigninComponent } from './components/signin/signin.component';
import { FilterPipe } from './pipes/filter.pipe';
import { NumToWordsPipe } from './pipes/num-to-words.pipe'; 

import { SlickCarouselModule } from 'ngx-slick-carousel';
import {NgxExtendedPdfViewerModule, } from 'ngx-extended-pdf-viewer';
import { CocinaComponent } from './components/cocina/cocina.component';
import { SharedservicesService } from './services/sharedservices.service';
import { ClientesComponent } from './components/clientes/clientes.component';

import { NgSelectModule } from '@ng-select/ng-select';
import { InventarioComponent } from './components/inventario/inventario.component';
import { InsumosComponent } from './components/inventario/insumos/insumos.component';
import { CategoriasComponent } from './components/productos/categorias/categorias.component';
import { ProductosUnicosComponent } from './components/productos/productos-unicos/productos-unicos.component';
import { ProductosCompuestosComponent } from './components/productos/productos-compuestos/productos-compuestos.component';
import { OpcionesComponent } from './components/productos/opciones/opciones.component';
import { ComplementosComponent } from './components/productos/complementos/complementos.component';
import { NgxPaginationModule } from 'ngx-pagination';
import { ReporteVentasComponent } from './components/reporte-ventas/reporte-ventas.component';

@NgModule({
  declarations: [
    AppComponent,
    UsuariosComponent,
    VentasComponent,
    CajaComponent,
    ProductosComponent,
    SigninComponent,
    FilterPipe,
    NumToWordsPipe,

    CocinaComponent,
    InsumosComponent,
    ClientesComponent,

    InventarioComponent,
    CategoriasComponent,
    ProductosUnicosComponent,
    ProductosCompuestosComponent,
    OpcionesComponent,
    ComplementosComponent,
    ReporteVentasComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    NgbModule,
    ReactiveFormsModule,
    SlickCarouselModule,
    NgxExtendedPdfViewerModule,
    NgSelectModule,
    NgxPaginationModule
  ],
  providers: [SharedservicesService],
  bootstrap: [AppComponent]
})
export class AppModule { }
