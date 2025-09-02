import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {configuration} from "./configuration"

@Injectable({
  providedIn: 'root'
})
export class ClientesService {
  private URL = configuration.url;

  constructor(
    private http: HttpClient
  ) { }

    //OBTENEMOS LA LISTA DE CLIENTES
    get_Clientes_Api(){
      return this.http.get<any>(this.URL+'/clientes');
    }

    //MODIFICAR CLIENTE
    post_Agregar_Cliente_Api(cliente:any){
      return this.http.post<any>(this.URL+'/clientes',cliente);
    }

    
    //ELIMINAR CLIENTE
    put_Modificar_Cliente_Api(cliente:any){
      return this.http.put<any>(this.URL+'/clientes',cliente);
    }

    delete_Eliminar_Cliente_Api(cliente:any){
      return this.http.delete<any>(this.URL+'/clientes/' + cliente.cod_cliente);
    }

    //AGREGAR CLIENTE
    put_Modificar_EstadoCliente_Api(cliente:any){
      return this.http.put<any>(this.URL+'/clientes/estado',cliente);
    }
}
