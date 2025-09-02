import { Component, HostListener , Renderer2  } from '@angular/core';

import { VentaService } from "../../services/ventas.service";
import { CajaService } from "../../services/caja.service";

import { SocketService } from '../../services/socket.service';
import { SharedservicesService } from 'src/app/services/sharedservices.service';
import { jsPDF } from 'jspdf';
import * as bootstrap from 'bootstrap';

// This lets me use jquery
declare var $: any
@Component({
  selector: 'app-cocina',
  templateUrl: './cocina.component.html',
  styleUrls: ['./cocina.component.css']
})
export class CocinaComponent {


  constructor(
    private ventaService:VentaService,
    private cajaService:CajaService,
    private renderer: Renderer2
  ){
    this.listar_Last_Caja();
  }
  page_v: number = 1;




selectedCardIndex: number = -1; // Índice de la tarjeta seleccionada
@HostListener('document:keydown', ['$event'])
handleKeyboardEvent(event: KeyboardEvent) {
  // Manejo de navegación de páginas
  if (event.key === 'ArrowRight') {
    var total_pag = Math.ceil(this.lista_Ventas.length / 6);
    if (this.page_v == total_pag) {
      this.page_v = 1;
    } else {
      this.page_v++;
    }
  } else if (event.key === 'ArrowLeft' && this.page_v > 1) {
    this.page_v--;
  }

  // Manejo de selección de tarjetas
  switch (event.key) {
    case 'ArrowUp':
      if (this.selectedCardIndex > 0) {
        this.selectedCardIndex--;
      }
      break;
    case 'ArrowDown':
      if (this.selectedCardIndex < this.lista_Ventas.length - 1) {
        this.selectedCardIndex++;
      }
      break;
    case 'z':
      if (this.selectedCardIndex >= 0) {
        this.showModal_Finalizar(this.lista_Ventas[this.selectedCardIndex], this.selectedCardIndex);
      }
      break;
    case 'x':
      if (this.selectedCardIndex >= 0) {
        this.MODIFICAR_SOLO_DATOS_VENTA(this.lista_Ventas[this.selectedCardIndex], 2, this.selectedCardIndex); // En Proceso
      }
      break;
    case 'c':
      if (this.selectedCardIndex >= 0) {
        this.MODIFICAR_SOLO_DATOS_VENTA(this.lista_Ventas[this.selectedCardIndex], 1, this.selectedCardIndex); // Nuevo
      }
      break;
    case 'a':
      this.LISTAR_VENTAS_FINALIZADAS();
      break;
    case 's':
      this.LISTAR_VENTAS_EN_PROCESO();
      break;
    case 'd':
      this.LISTAR_VENTAS_NUEVAS();
      break;
  }
}


  ventaF:any; indexF:any
  showModal_Finalizar(venta:any,index:any){
    this.ventaF = venta;
    this.indexF = index;
    $("#modalFinalizarVenta").modal('show');
  }

/* 
estado = 0 : Nuevo
estado = 1 : Proceso
estado = 2 : Finalizado
---------------------------------------
mover = 1 : Mover de Nuevo - Proceso
mover = 2 : Mover de Nuevo - Finalizado 
mover = 3 : Mover de Proceso - Nuevo
mover = 4 : Mover de Proceso - Finalizado  
*/ 

//***************************************************************************************************************************************************************************************
//**********************************************************************  MODIFICAR SOLO DATOS VENTA   **********************************************************************************
//***************************************************************************************************************************************************************************************
MODIFICAR_SOLO_DATOS_VENTA(venta:any, mover:any, index:any){
  console.log('::::::::::::::: MODIFICAR SOLO DATOS VENTA.venta :::::::::::::::');
  console.log('MOVER',mover);
  console.log('VENTA ESTADO A MODIFICAR: ',venta.venta);
  //SI ES 1 : NUEVO - PROCESO(estado=1)
  if (mover == 1) {   console.log('SI ES 1 : NUEVO - PROCESO(estado=1)');
    venta.venta.estado = 1;
  }
  //SI ES 2 : NUEVO - FINALIZADO(estado=2)
  if (mover == 2) {   console.log('SI ES 2 : NUEVO - FINALIZADO(estado=2)');
    venta.venta.estado = 2;
  }
  //SI ES 3 : PROCESO - NUEVO(estado=0)
  if (mover == 3) {   console.log('SI ES 3 : PROCESO - NUEVO(estado=0)');
    venta.venta.estado = 0;
  }
  //SI ES 4 : PROCESO - FINALIZADO(estado=2)
  if (mover == 4) {   console.log('SI ES 4 : PROCESO - FINALIZADO(estado=2)');
    venta.venta.estado = 2;
  }
  // console.log('VENTA ESTADO A MODIFICAR: ',venta.venta);
  //QUIRAMOS LA VENTA DE LA LISTA
  this.lista_Ventas.splice(index, 1);
  
  this.ventaService.put_Datos_Venta_Api(venta.venta)
  .subscribe(
    res => {
      console.log('VENTA MODIFICADA');

      if (venta.venta.estado == 1) {
        this.mostrarToast('Venta en proceso','verde');
      }
      if (venta.venta.estado == 2) {
        this.mostrarToast('Venta finalizada','verde');
      }
      if (venta.venta.estado == 0) {
        this.mostrarToast('Venta regresada a nuevas','verde');
      }
      $("#modalFinalizarVenta").modal('hide');
    },
    err =>{
      console.log('Error al modificar venta ', err);
      this.mostrarToast('Error al cambiar el estado de la venta','rojo');
    }
  ) 
}


//*************************************************************************************************************************************************************************************
//*******************************************************************************  LISTAR VENTAS   ************************************************************************************
//*************************************************************************************************************************************************************************************
select_Fecha:any;
min_totay:any 
today:any;
lista_Ventas:any[] = [];
vista_ventas:any
LISTAR_VENTAS_NUEVAS(){
  this.lista_Ventas = [];
  this.vista_ventas =1;
  const fecha = this.transformar_Fecha(this.select_Fecha);
  this.ventaService.get_Ventas_Nuevas_Api(this.last_caja.cod_caja, fecha)
  .subscribe(
    res => {
      // Filtrar detalle_venta donde cocina sea true
      this.lista_Ventas = res.map((ventaObj: any) => {
          return {
            ...ventaObj,
            detalle_venta: ventaObj.detalle_venta.filter((detalle: any) => detalle.cocina === true)
          };
      });
      console.log('VENTAS NUEVAS: ', this.lista_Ventas);
    },
    err =>{
      console.log('Error al agregar Productos: ', err);
    }
  ) 
}
LISTAR_VENTAS_EN_PROCESO(){
  this.lista_Ventas = [];
  this.vista_ventas =2;
  const fecha = this.transformar_Fecha(this.select_Fecha);
  this.ventaService.get_Ventas_en_Proceso_Api(this.last_caja.cod_caja, fecha)
  .subscribe(
    res => {
      // Filtrar detalle_venta donde cocina sea true
      this.lista_Ventas = res.map((ventaObj: any) => {
          return {
            ...ventaObj,
            detalle_venta: ventaObj.detalle_venta.filter((detalle: any) => detalle.cocina === true)
          };
      });
      console.log('VENTAS EN PROCESO: ', this.lista_Ventas);
    },
    err =>{
      console.log('Error al agregar Productos: ', err);
    }
  ) 
}
LISTAR_VENTAS_FINALIZADAS(){
  this.lista_Ventas = [];
  this.vista_ventas =3;
  const fecha = this.transformar_Fecha(this.select_Fecha);
  this.ventaService.get_Ventas_Finzalidas_Api(this.last_caja.cod_caja, fecha, 10)
  .subscribe(
    res => {
      this.lista_Ventas =  res.map((ventaObj: any) => {
        return {
          ...ventaObj,
          detalle_venta: ventaObj.detalle_venta.filter((detalle: any) => detalle.cocina === true)
        };
    });
      console.log('VENTAS FINALIZADAS: ', this.lista_Ventas);
    },
    err =>{
      console.log('Error al agregar Productos: ', err);
    }
  ) 
}




//*********************************************************** LISTAR CAJAS ************************************************************
//*************************************************************************************************************************************
last_caja:any;
listar_Last_Caja(){
  this.cajaService.get_LastCaja_Api()
  .subscribe(
    res => {
      this.last_caja = res;
      console.log('Ultima Caja',this.last_caja);
      //AGREGAMOS LAS FECHAS DE HOY
      this.select_Fecha = this.getTodayDate();
      this.today = this.getTodayDate();
      this.min_totay = this.transformar_Fecha_AlReves(this.last_caja.fecha_i);
      //LISTAMOS VENTAS NUEVAS
      this.LISTAR_VENTAS_NUEVAS();
    },
    err =>{
      console.log('Error al agregar Productos: ', err);
    }
  ) 
}






//************************ OBTENER FECHA 00-00-0000 ***************************
getTodayDate(): string {
  const todayDate = new Date();
  const year = todayDate.getFullYear();
  const month = String(todayDate.getMonth() + 1).padStart(2, '0'); // Los meses son indexados desde 0
  const day = String(todayDate.getDate()).padStart(2, '0'); // Obtener el día en formato 'DD'
  return `${year}-${month}-${day}`; // Formato 'YYYY-MM-DD'
}
//******************* TRANSFORMAR FECHA DE (0000-00-00) A (00/00/0000) **********************
transformar_Fecha(fecha: any): string {
  const fechaObj = new Date(fecha);  // Convierte la cadena a un objeto Date
  console.log('Fecha convertida:', fechaObj);

  const dia = fechaObj.getUTCDate().toString().padStart(2, '0');
  const mes = (fechaObj.getUTCMonth() + 1).toString().padStart(2, '0');
  const anio = fechaObj.getUTCFullYear();

  return `${dia}/${mes}/${anio}`;
}
//******************* TRANSFORMAR FECHA DE (00/00/0000) A (0000-00-00) **********************
transformar_Fecha_AlReves(fecha: string): string {
  // Split the date string into day, month, and year parts
  const [day, month, year] = fecha.split('/').map(Number);

  // Return the formatted date string
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}





//***************************** MENSAJE TOAST ********************************
toast_tipo=1;
mensaje_toast='';
mostrarToast(mensaje: string, color: string) {
  const miToast = document.getElementById('toast'); 
  const toast_cabezera = document.getElementById('toast-body'); 
  let toast: any;

  if (color=='verde') {
    color='#37695d';
    this.toast_tipo =1;
  }else {
    color='#614344'; 
    this.toast_tipo =2;}

  if (miToast && toast_cabezera) {
    toast = new bootstrap.Toast(miToast,{ delay: 1500 });
    this.renderer.setStyle(toast_cabezera, 'background', color);
    this.mensaje_toast = mensaje;
    toast.show();
  }
}







}
