import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import {SigninComponent} from "./components/signin/signin.component";
import {UsuariosComponent} from "./components/usuarios/usuarios.component";
import {VentasComponent} from "./components/ventas/ventas.component";
//PRODUCTO
import {ProductosComponent} from "./components/productos/productos.component";
import {CategoriasComponent} from "./components/productos/categorias/categorias.component";
import {ProductosUnicosComponent} from "./components/productos/productos-unicos/productos-unicos.component";

import {ProductosCompuestosComponent} from "./components/productos/productos-compuestos/productos-compuestos.component";
import {OpcionesComponent} from "./components/productos/opciones/opciones.component";
import {ComplementosComponent} from "./components/productos/complementos/complementos.component";

import { CajaComponent } from './components/caja/caja.component';
import { CocinaComponent } from './components/cocina/cocina.component';
//INVENTARIO
import { InventarioComponent } from "./components/inventario/inventario.component";
import { InsumosComponent } from "./components/inventario/insumos/insumos.component";

import { ReporteVentasComponent } from './components/reporte-ventas/reporte-ventas.component';

import { ClientesComponent } from "./components/clientes/clientes.component";

import { AuthGuard } from "./auth.guard";

const routes: Routes = [
    //ruta inicial
    {path: '',redirectTo:'/signin', pathMatch:'full'}, //al cargar el angular redirecciona automaticamente a /tasks
    //canActivate:[AuthGuard] : lo ponenmos a la ruta que queremos proteger si no tienen token
    {path: 'signin', component: SigninComponent},
    {path: 'usuario', component: UsuariosComponent, canActivate:[AuthGuard], data:{rol:'usuario'}},
    {path: 'venta', component: VentasComponent,canActivate:[AuthGuard],data:{rol:'venta'}},
    {path: 'caja', component: CajaComponent,canActivate:[AuthGuard],data:{rol:'caja'}},
    {path: 'cocina', component: CocinaComponent,canActivate:[AuthGuard],data:{rol:'cocina'}},
    {path: 'reporte-ventas', component: ReporteVentasComponent,canActivate:[AuthGuard],data:{rol:'reporte-ventas'}},
    //PRODUCTOS
    {path: 'producto', component: ProductosComponent,canActivate:[AuthGuard],data:{rol:'producto'}},
    {path: 'productos-unicos', component: ProductosUnicosComponent},
    {path: 'productos-compuestos', component: ProductosCompuestosComponent},
    {path: 'opciones', component: OpcionesComponent},
    {path: 'complementos', component: ComplementosComponent},
    {path: 'categoria', component: CategoriasComponent},
    //INVENTARIO
    {path: 'inventario', component: InventarioComponent,canActivate:[AuthGuard],data:{rol:'inventario'}},
    {path: 'insumos', component: InsumosComponent},

    {path: 'cliente', component: ClientesComponent,canActivate:[AuthGuard],data:{rol:'cliente'}},


];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
