import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Router} from "@angular/router";
import {configuration} from "./configuration"


@Injectable({
  providedIn: 'root'
})
export class InsumosService {
  private URL = configuration.url; 
  constructor(
    private http: HttpClient,
    private router: Router
  ) { }


  
  //OBTENEMOS LA LISTA DE INSUMOS
  get_InsumosApi(){
    return this.http.get<any>(this.URL+'/insumos');
  }

  //AGREGAMOS NUEVO INSUMO
  post_InsumoApi(insumo:unknown){
    return this.http.post<any>(this.URL+'/insumos',insumo);
  }

  //MODIFICAMOS INSUMO  
  put_InsumoApi(insumo:unknown){
    console.log('Api producto',insumo);
    return this.http.put<any>(this.URL+'/insumos',insumo);
  }
  //MODIFICAMOS INSUMO  
  delete_InsumoApi(cod_insumo:unknown){
    return this.http.delete<any>(this.URL+'/insumos/'+cod_insumo);
  }

  
/*************************************************************************************** */
  //OBTENEMOS LOS ULTIMOS CODIGOS DE MOVIMIENTO_INSUMOS Y DETALLE_MOVIMIENTO_INSUMOS
  get_Ultimos_Codigos_DetalleMovimiento(){
    return this.http.get<any>(this.URL+'/movimiento_insumo');
  }  

  //AGREGAMOS UN MOVIMIENTO
  post_Insumo_Movimiento_y_Detalle_Api_Insumo(movimiento:unknown){
    return this.http.post<any>(this.URL+'/movimiento_insumo',movimiento);
  }

  //MODIDIFCAR ULTIMOS MOVIMIENTOS
  //OBTENER ULTIMO MOVIMIENTO Y DETALLES
  get_ultimo_Movimiento_y_Detalles(movimiento:unknown){
    const data={movimiento:movimiento}
    return this.http.put<any>(this.URL+'/movimiento_insumo/ultimo',data);
  }
  //MODIFICAR MOVIMIENTO
  modificar_Movimiento_y_Detalles(movimiento:unknown){
    return this.http.put<any>(this.URL+'/movimiento_insumo',movimiento);
  }

  //MODIFICAR MOVIMIENTO
  eliminar_Movimiento_y_Detalles(cod_mov:unknown){
    return this.http.delete<any>(this.URL+'/movimiento_insumo/'+cod_mov,);
  }

  //OBTENEMOS LOS MOVIMIENTOS EN GENERAL SEGUN FILTRO DE FECHAS
  get_Movimientos_Insumos_y_Detalle_Api_Todo(data:unknown){
    return this.http.put<any>(this.URL+'/movimiento_insumo/todo',data);
  }
  //OBTENEMOS LOS MOVIMIENTOS DE UN INSUMO SELECCIONADO
  get_Movimientos_Insumos_y_Detalle_Api(data:any){
    return this.http.put<any>(this.URL+'/movimiento_insumo/insumo',data);
  }

}
