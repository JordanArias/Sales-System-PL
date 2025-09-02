import { Component, Renderer2, ViewChild } from '@angular/core';
import {ClientesService} from "../../services/clientes.service";
import * as bootstrap from 'bootstrap';

// This lets me use jquery
declare var $: any
@Component({
  selector: 'app-clientes',
  templateUrl: './clientes.component.html',
  styleUrls: ['./clientes.component.css']
})

export class ClientesComponent {
  @ViewChild('formCliente') formCliente: any;
  constructor(
    private clienteService: ClientesService,
    private renderer: Renderer2
  ){
    this.listar_Clientes();
  }

  page: number = 1; // Página inicial
  filterPost='';

  proceso=0;


//*********************************************************************************************************************************************** 
//*******************************************************************  MODALES  *****************************************************************
//***********************************************************************************************************************************************
  showModalFormulario_Cliente(cliente:any,proceso_recibido:any){
    if (proceso_recibido == 1) {
        this.proceso = 1;
    }else{
      this.proceso = 2;
      this.clienteForm ={...cliente};
      console.log('this.clienteForm: ',this.clienteForm);
    }

    $("#modalFormularioCliente").modal('show');
  }

  showModal_EstadoCliente(cliente:any){
      this.clienteForm ={...cliente};
    $("#modalEstadoCliente").modal('show');
  }
  showModal_EliminarCliente(cliente:any){
    this.clienteForm ={...cliente};
  $("#modalEliminarCliente").modal('show');
}
//*********************************************************************************************************************************************** 
//******************************************************************  CLIENTES  *****************************************************************
//***********************************************************************************************************************************************

//*************************************************** LISTAR CLIENTES ****************************************************
//************************************************************************************************************************
lista_Clientes:any
listar_Clientes(){
  this.clienteService.get_Clientes_Api()
  .subscribe(
    res => {
      this.lista_Clientes = res;
      console.log('lista_Clientes: ', this.lista_Clientes); 
      this.seleccionarOpcion(this.opcionSeleccionada);   
    },
    err => console.log('Error al obtener opciones')
  ) 
}


//*************************************************** AGREGAR CLIENTE ****************************************************
//************************************************************************************************************************
clienteForm = {cod_cliente:null, identificacion:null, nombre:'', documento:0, correo:'', celular:null, estado:0};
mostrarAdvertencias: boolean = false;
AGREGAR_CLIENTE(){
  if (!this.isValidCliente()) {
    this.mostrarAdvertencias= true;
    return; 
  }

  this.clienteService.post_Agregar_Cliente_Api(this.clienteForm)
  .subscribe(
    res => {
      this.listar_Clientes();
      this.opcionSeleccionada = 2
      this.mostrarToast('Cliente agregado','verde');
      $("#modalFormularioCliente").modal('hide');
    },
    err => {
      console.log('Error al agregar cliente');
      this.mostrarToast('Error al agregar el cliente','rojo');
    }
  ) 

}



//*************************************************** MODIFICAR CLIENTE ****************************************************
//************************************************************************************************************************
MODIFICAR_CLIENTE(){
  if (!this.isValidCliente()) {
    this.mostrarAdvertencias= true;
    return; 
  }

  this.clienteService.put_Modificar_Cliente_Api(this.clienteForm)
  .subscribe(
    res => {
      this.listar_Clientes();
      this.opcionSeleccionada = 2
      this.mostrarToast('Cliente modificado','verde');
      $("#modalFormularioCliente").modal('hide');
    },
    err => {
      console.log('Error al modificar cliente');
      this.mostrarToast('Error al modificar el cliente','rojo');
    }
  ) 
}

//*************************************************** MODIFICAR ESTADO CLIENTE ****************************************************
//************************************************************************************************************************
MODIFICAR_ESTADO_CLIENTE(){
  if (  this.clienteForm.estado == 0) {
    this.clienteForm.estado = 1;
  }else{this.clienteForm.estado = 0;}

  this.clienteService.put_Modificar_Cliente_Api(this.clienteForm)
  .subscribe(
    res => {
      this.listar_Clientes();
      this.opcionSeleccionada = 2
      this.mostrarToast('Estado del cliente modificado','verde');
      $("#modalEstadoCliente").modal('hide');
    },
    err => {
      console.log('Error al modificar estado del cliente');
      this.mostrarToast('Error al modificar el estado del cliente','rojo');
    }
  ) 
}


ELIMINAR_CLIENTE(){
  console.log(this.clienteForm);
  
  this.clienteService.delete_Eliminar_Cliente_Api(this.clienteForm)
  .subscribe(
    res => {
      this.listar_Clientes();
      this.opcionSeleccionada = 2
      this.mostrarToast('Cliente eliminado','verde');
      $("#modalEliminarCliente").modal('hide');
    },
    err => {
      console.log('Error al modificar el cliente');
      this.mostrarToast('Error al modificar el cliente','rojo');
    }
  ) 
}

//*************************************************************************************************************************** 
//***************************************************  FUNCIONES EXTRAS  ****************************************************
//***************************************************************************************************************************
isValidCliente():boolean{
    return this.clienteForm.identificacion !== null && this.clienteForm.nombre.trim() !== '' &&
           this.clienteForm.documento !== 0;
}

//********************* SELECCIONAR LISTA *********************
opcionSeleccionada: number = 2; // Por defecto mostrar todo
lista_clientes_filtradas: any[] = [];
filtrarLista(){
  if (this.opcionSeleccionada === 2) {
    // Mostrar todos
    this.lista_clientes_filtradas = this.lista_Clientes;1
  } else {
    // Filtrar por estado (0 o 1)
    this.lista_clientes_filtradas = this.lista_Clientes.filter((opcion: { estado: any; }) => opcion.estado === this.opcionSeleccionada);
  }
}

seleccionarOpcion(opcion: number) {
  this.opcionSeleccionada = opcion;
  this.filtrarLista();
}


//********************* RESETEAR FORMULARIO AL CERRAR EL MODAL *********************
resetForm() {
    this.formCliente.resetForm();
    this.mostrarAdvertencias=false;
    this.clienteForm = {cod_cliente:null, identificacion:null, nombre:'', documento:0, correo:'', celular:null, estado:0}
}


//********************* MENSAJE TOAST *********************
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
    toast = new bootstrap.Toast(miToast);
    this.renderer.setStyle(toast_cabezera, 'background', color);
    this.mensaje_toast = mensaje;
    toast.show();
  }
}




}
