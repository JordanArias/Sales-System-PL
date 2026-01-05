import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {io} from 'socket.io-client';
import {configuration} from "./configuration"

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: any;
  constructor() {
    // Extraer la URL base de la configuración (remover /api)
    const baseUrl = configuration.url.replace('/api', '');
    this.socket = io(baseUrl, { 
      withCredentials: true,
      extraHeaders: {
        "my-custom-header": "abcd" // Se puede agregar encabezados personalizados aquí
      }
    });
   }

  // Métodos para enviar y recibir eventos personalizados
  sendEvent(data: any) {
    this.socket.emit( 'evento_personalizado', data);
  }

  // listenToServer(connection:Connection):Observable<any>{}

  receiveEvent(callback: (data: any) => void) {
    this.socket.on('evento_personalizado', callback);
  }
}
