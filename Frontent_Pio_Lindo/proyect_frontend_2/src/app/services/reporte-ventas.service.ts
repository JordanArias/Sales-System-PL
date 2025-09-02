import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Router} from "@angular/router";
import {configuration} from "./configuration"

@Injectable({
  providedIn: 'root'
})
export class ReporteVentasService {
  private URL = configuration.url; 

  constructor(
    private http: HttpClient,
    private router: Router
  ) { }


//*************************************************************************************************************************** 
//********************************************************  PRODUCTOS  ******************************************************
//***************************************************************************************************************************

  //OBTENEMOS LA LISTA DE PRODUCTOS
  get_ReporteVentasApi(fecha_inicio: string, fecha_final: string){
    return this.http.get<any>(`${this.URL}/reportes/ventas?fecha_inicio=${fecha_inicio}&fecha_final=${fecha_final}`);
  }
  //OBTENEMOS LA LISTA DE PRODUCTOS
  get_ReporteProductosApi(fecha_inicio: string, fecha_final: string){
    return this.http.get<any>(`${this.URL}/reportes/productos?fecha_inicio=${fecha_inicio}&fecha_final=${fecha_final}`);
  }
  //OBTENEMOS LA LISTA DE PRODUCTOS
  get_ReporteOpcinoesApi(fecha_inicio: string, fecha_final: string){
    return this.http.get<any>(`${this.URL}/reportes/opciones?fecha_inicio=${fecha_inicio}&fecha_final=${fecha_final}`);
  }

  // get_Caja_Api(fecha_inicio: string, fecha_final: string){
  //   return this.http.get<any>(`${this.URL}/caja?fecha_inicio=${fecha_inicio}&fecha_final=${fecha_final}`);
  // }
}
