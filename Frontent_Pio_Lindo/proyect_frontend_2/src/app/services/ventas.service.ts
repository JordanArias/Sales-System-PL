import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Router} from "@angular/router";
import { CajaService } from './caja.service';
import { SharedservicesService } from './sharedservices.service';
import {configuration} from "./configuration"

@Injectable({
    providedIn: 'root'
  })

export class VentaService {
 private URL = configuration.url; 

  ventas=[{cod_venta:'',cod_caja:1, factura:'', mesa:null, vent_llevar:false, total_bs:0, pagado_bs:null, cambio_bs:0, total_arg:0, pag_arg:null, cambio_arg:0, hora:'', estado:1, descrip_venta:''}];
  detalle=[{cod_item:'',cod_venta:'', cod_producto:'', unidad_item:'', descript_item:'', item_llevar:false,nom_pro:'',cod_categoria:''}];
  item_presa=[{cod_item:'', cod_presa:'', unidad_presa:'',nom_presa:''}];
  ventasConDetalles: any[] = [];
  last_caja:any={cod_venta:null, cod_item:null ,cod_caja:null,estado:null,hr_apertura:null};

  constructor(
      private http: HttpClient,
  ) { }
  //AGREGAR VENTA
  post_Venta_Api(data:unknown){
    return this.http.post<any>(this.URL+'/ventas',data);
  }
  //AGREGAR VENTA
  put_Venta_Api(data:unknown){
    return this.http.put<any>(this.URL+'/ventas',data);
  }
  //ELIMINAR VENTA
  delete_Venta_Api(cod_venta:unknown){
    return this.http.delete<any>(this.URL+'/ventas/' + cod_venta);
  }

  //OBTENEMOS LA LISTA DE CAJAS
  get_Ventas_Nuevas_Api(cod_caja:any, fecha: string){
    return this.http.get<any>(`${this.URL}/ventas/nuevas?cod_caja=${cod_caja}&fecha=${fecha}`);
  }
    //OBTENEMOS LA LISTA DE CAJAS
  get_Ventas_en_Proceso_Api(cod_caja:any, fecha: string){
    return this.http.get<any>(`${this.URL}/ventas/proceso?cod_caja=${cod_caja}&fecha=${fecha}`);
  }
  //OBTENEMOS LA LISTA DE CAJAS
  get_Ventas_Finzalidas_Api(cod_caja:any, fecha: string, limite:any){
    return this.http.get<any>(`${this.URL}/ventas/finalizadas?cod_caja=${cod_caja}&fecha=${fecha}&limite=${limite}`);
  }

  //AGREGAR VENTA
  put_Datos_Venta_Api(venta:unknown){
    return this.http.put<any>(this.URL+'/ventas/datos',venta);
  }
}
  