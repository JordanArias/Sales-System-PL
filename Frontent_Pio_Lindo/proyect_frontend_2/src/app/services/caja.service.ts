import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {configuration} from "./configuration"

@Injectable({
  providedIn: 'root'
})
export class CajaService {
  private URL = configuration.url;

  constructor(
    private http: HttpClient
  ) { }

  //OBTENEMOS LA LISTA DE CAJAS
  get_Caja_Api(fecha_inicio: string, fecha_final: string){
    return this.http.get<any>(`${this.URL}/caja?fecha_inicio=${fecha_inicio}&fecha_final=${fecha_final}`);
  }
  post_Caja_Api(caja:unknown){
    return this.http.post<any>(this.URL+'/caja',caja);
  }
  post_Ajuste_Api(ajuste:unknown){
    return this.http.post<any>(this.URL+'/caja/ajuste',ajuste);
  }
  put_CerrarCaja_Api(caja:unknown){
    return this.http.put<any>(this.URL+'/caja',caja);
  }
  get_AjustesCaja_Api(cod_caja:any){
    console.log("API_:::.",cod_caja);
    return this.http.get<any>(`${this.URL}/caja/ajuste?cod_caja=${cod_caja}`);
  }

  //OBTENEMOS LA ULTIMA CAJA DE LA LISTA
  get_LastCaja_Api(){
    return this.http.get<any>(this.URL+'/caja/last');
  }

}
