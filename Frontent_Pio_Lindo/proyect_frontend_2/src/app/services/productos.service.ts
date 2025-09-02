import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Router} from "@angular/router";
import {configuration} from "./configuration"

@Injectable({
  providedIn: 'root'
})
export class ProductosService {
   private URL = configuration.url; 

  constructor(
    private http: HttpClient,
    private router: Router
  ) { }
//*************************************************************************************************************************** 
//********************************************************  PRODUCTOS  ******************************************************
//***************************************************************************************************************************
  //OBTENEMOS LA LISTA DE PRODUCTOS
  getProductosApi(){
    return this.http.get<any>(this.URL+'/productos');
  }

  //AGREGAMOS NUEVO PRODUCTO
  postProductosApi(producto:unknown){
    return this.http.post<any>(this.URL+'/productos',producto);
  }

  //MODIFICAMOS PRODUCTO
  putProductosApi(producto:unknown){
    return this.http.put<any>(this.URL+'/productos',producto);
  }

  //ELIMINAMOS PRODUCTO
  deleteProductoApi(cod_producto:unknown){
    return this.http.delete<any>(this.URL+'/productos/'+cod_producto);
  }
  //CAMBIAMOS ESTADO DE PRODUCTO
  estadoProductoApi(producto:unknown){
    return this.http.put<any>(this.URL+'/productos/estado',producto);
  }

  //OBTENEMOS LA LISTA DE PRODUCTOS
  getProductosVentaApi(){
    return this.http.get<any>(this.URL+'/productos/venta/');
  }
//*************************************************************************************************************************** 
//*******************************************************  CATEGORIAS  ******************************************************
//***************************************************************************************************************************
  //OBTENEMOS LA LISTA DE CATEGORIAS
  getCategoriasApi(){
    return this.http.get<any>(this.URL+'/categorias');
  }
  //AGREGAMOS NUEVA CATEGORIA
  postCategoriasApi(categoria:unknown){
    console.log(categoria);
    return this.http.post<any>(this.URL+'/categorias',categoria);
  }
  //MODIFICAMOS CATEGORIA
  putCategoriaApi(categoria:unknown){
    return this.http.put<any>(this.URL+'/categorias',categoria);
  }
  //ELIMINAMOS CATEGORIA
  deleteCategoriaApi(cod_categoria:unknown){
    return this.http.delete<any>(this.URL+'/categorias/'+cod_categoria);
  }
  //OBTENEMOS LA LISTA DE SUBCATEGORIAS
  getSubCategoriasApi(){
    return this.http.get<any>(this.URL+'/categorias/subcategorias');
  }
  //AGREGAMOS SUBCATEGORIA
  postSubCategoriasApi(subcategoria:any){
    return this.http.post<any>(this.URL+'/categorias/subcategorias',subcategoria);
  }
  //ELIMINAMOS SUBCATEGORIA
  deleteSubCategoriaApi(cod_subcategoria:unknown){ 
    return this.http.delete<any>(this.URL+'/categorias/subcategorias/'+cod_subcategoria);
  }
  //MODIFICAMOS SUBCATEGORIA
  putSubCategoriaApi(subcategoria:unknown){
    return this.http.put<any>(this.URL+'/categorias/subcategorias',subcategoria);
  }

//*************************************************************************************************************************** 
//********************************************************  OPCIONES  *******************************************************
//***************************************************************************************************************************
  //OBTENEMOS LA LISTA DE OPCIONES
  getOpcionesApi(){
    return this.http.get<any>(this.URL+'/opciones');
  }

  //AGREGAMOS NUEVA OPCION
  postOpcionesApi(opcion:unknown){
    return this.http.post<any>(this.URL+'/opciones',opcion);
  }
  //ELIMINAMOS OPCION
  deleteOpcionApi(cod_opcion:unknown){ 
    return this.http.delete<any>(this.URL+'/opciones/'+cod_opcion);
  }
  //MODIFICAMOS OPCION
  putOpcion(opcion:unknown){
    return this.http.put<any>(this.URL+'/opciones',opcion);
  }
  //MODIFICAMOS ESTADO OPCION
  putEstadoOpcion(opcion:unknown){
    return this.http.put<any>(this.URL+'/opciones/estado',opcion);
  }

//*************************************************************************************************************************** 
//********************************************************  COMPLEMENTOS  *******************************************************
//***************************************************************************************************************************
  //OBTENEMOS LA LISTA DE COMPLEMENTOS
  getComplementosApi(){
    return this.http.get<any>(this.URL+'/complementos');
  }

  //AGREGAMOS NUEVO COMPLEMENTO
  postComplementosApi(complemento:unknown){
    return this.http.post<any>(this.URL+'/complementos',complemento);
  }
  //MODIFICAMOS COMPLEMENTO
  putComplemento(complemento:unknown){
    return this.http.put<any>(this.URL+'/complementos',complemento);
  }
  //ELIMINAMOS COMPLEMENTO
  deleteComplementoApi(cod_complemento:unknown){ 
    return this.http.delete<any>(this.URL+'/complementos/'+cod_complemento);
  }
  //MODIFICAMOS ESTADO COMPLEMENTO
  putEstadoComplemento(complemento:unknown){
    return this.http.put<any>(this.URL+'/complementos/estado',complemento);
  }

}
