import { Component, ViewChild, Renderer2 } from '@angular/core';
import { ProductosService } from "../../../services/productos.service";
import { InsumosService } from "../../../services/insumos.service";
import * as bootstrap from 'bootstrap';
import { NgForm } from '@angular/forms';

// This lets me use jquery
declare var $: any
@Component({
  selector: 'app-complementos',
  templateUrl: './complementos.component.html',
  styleUrls: ['./complementos.component.css']
})
export class ComplementosComponent {
  @ViewChild('formComplemento') formComplemento: any;
  @ViewChild('formOpcion') formOpcion: any;
  constructor(
    private insumoService:InsumosService,
    private productoService:ProductosService,
    private renderer: Renderer2
  ){
    this.listar_Complementos();
    this.listar_Opciones()

  }
  page: number = 1; // Página inicial
  filterPost='';
  //*************************************************************************************************************************** 
  //********************************************************  MODALES  ********************************************************
  //***************************************************************************************************************************

proceso=0;
//********************** AGREGAR OPCION *************************
showModalAgregar_Complemento():void{
  this.proceso=1;
  $("#modalAgregarComplemento").modal('show');
}

//********************** AGREGAR OPCION *************************
showModalModificar_Complemento(complemento:any):void{
  this.proceso=2;
  this.agregar_Datos_al_Formulario(complemento);
  $("#modalAgregarComplemento").modal('show');
}
//********************** ELIMINAR OPCION *************************
showModalEliminar_Complemento(complemento:any):void{
  this.complementoForm = { ...complemento};
  $("#modalEliminarComplemento").modal('show');
}
//********************** ESTADO OPCION *************************
estado=0;
showModalEstado_Complemento(complemento:any):void{
  if (complemento.estado == 0) {
    this.estado = 1;
  }else{this.estado = 0;}
  this.complementoForm = { ...complemento};
  $("#modalEstadoComplemento").modal('show');
}








//******************************************************************************************************************************* 
//********************************************************  COMPLEMENTOS  *******************************************************
//******************************************************************************************************************************* 

//************************************************  LISTAR COMPLEMENTOS  ****************************************************
//*************************************************************************************************************************** 
lista_complementos:any
lista_complemento_opcion:any
listar_Complementos(){
  this.productoService.getComplementosApi()
  .subscribe(
    res => {
      this.lista_complementos = res[0];
      this.lista_complemento_opcion = res[1];
      console.log('Lista Complementos: ', this.lista_complementos);
      console.log('Lista Complemento Opcion: ', this.lista_complemento_opcion);
      this.seleccionarOpcion(this.complementoSeleccionado);   
    },
    err => console.log('Error al obtener opciones')
  ) 
}


//************************************************  AGREGAR COMPLEMENTO  ****************************************************
//***************************************************************************************************************************
mostrarAdvertencias: boolean = false; 
complementoForm={cod_complemento:0, nombre:'', descripcion:'',estado:0};
//AGREGAMOS LOS INSUMOS-SUBRECETAS SELECCIONADOS
mostrarAdvertenciasInsumo: boolean = false;

//Insumo Seleccionado 
opcion_Seleccionada:any=null;
complemento_opcion:any[]=[]; 
complemento_opcion_Seleccionado={cod_opcion:0, nom_opcion:'',descripcion:'', cod_complemento:0};

adicionar_Complemento_Opcion(form:NgForm){
  //PRIMERO VERIFICAMOS EL FORMULARIO
  this.mostrarAdvertenciasInsumo = true; // Activa las advertencias cuando se presiona el botón
  if (!this.isFormIsumoValid()) {
    return;
  }
 
  //Agregamos insumo_Seleccionado a insumo_subreceta_Seleccionado
  this.complemento_opcion_Seleccionado.cod_opcion=this.opcion_Seleccionada.cod_opcion;
  this.complemento_opcion_Seleccionado.nom_opcion=this.opcion_Seleccionada.nombre;
  this.complemento_opcion_Seleccionado.descripcion=this.opcion_Seleccionada.descripcion;


  // Verificamos si el insumo ya existe en la lista
  if (this.existeOpcionSeleccionado()) {
    console.log('La opcion ya existe en la lista.');
    return;
  }

  //Agregamos a la lista de subrecetas
  console.log('Push:::::');
  this.complemento_opcion.push(this.complemento_opcion_Seleccionado);
  
  //Limpiamos los datos
  this.complemento_opcion_Seleccionado = {cod_opcion:0, nom_opcion:'',descripcion:'', cod_complemento:0};
  // this.insumo_Seleccionado=null;
  form.resetForm();
  this.mostrarAdvertenciasInsumo = false; // Desactivamos las advertencias
}
eliminar_Complemento_Opcion(index: number) {
  this.complemento_opcion.splice(index, 1);
}
agregar_Complemento(){
  //PRIMERO VERIFICAMOS EL FORMULARIO
  this.mostrarAdvertencias = true; // Activa las advertencias cuando se presiona el botón
  if (!this.isFormValid()) {
    // Código para manejar el caso cuando el formulario no es válido
    return;
  }
  //AGREGAMOS EL COD_COMPLEMENTO
  this.complementoForm.cod_complemento = this.obtener_CodComplemento();
  //GUARDAMOS LOS DATOS
  const data = [this.complementoForm, this.complemento_opcion]

  console.log('Complemento Agregar: ',data);

  this.productoService.postComplementosApi(data)
    .subscribe(
      res => {
        console.log(res);
        this.complementoForm={cod_complemento:0, nombre:'', descripcion:'',estado:0};
        this.listar_Complementos();
        this.mostrarToast('Complemento agregado','verde');
        $("#modalAgregarComplemento").modal('hide');
      },
      err =>{ 
        console.log('Error al obtener complemetos:', err);
        this.mostrarToast('Error al agregar el complemento','rojo');
      }
    ) 
}

//************************************************  MODIFICAR COMPLEMENTO  ****************************************************
//***************************************************************************************************************************
agregar_Datos_al_Formulario(complemento:any){
  //1RO: AGREGAMOS LOS DATOS DE LA OPCION SELECCIONADA AL FORMULARIO
  this.complementoForm = { ...complemento};
  //2DO: FILTRAMOS DE LA LISTA INSUMOS-OPCIONES DEL INSUMO RELACIONADO A LA OPCION SELECCIONADA A MODIFICAR
  const complemento_opcion = this.lista_complemento_opcion.filter((op: { cod_complemento: any; }) =>op.cod_complemento === complemento.cod_complemento);
  //4TO: AGREGAMOS LOS DATOS AL FORMULARIO INSUMO_OPCION
  this.complemento_opcion = complemento_opcion.map((co: any) => ({ ...co }));
}

modificar_Complemento(){
  //PRIMERO VERIFICAMOS EL FORMULARIO
  this.mostrarAdvertencias = true; // Activa las advertencias cuando se presiona el botón
  if (!this.isFormValid()) {
    // Código para manejar el caso cuando el formulario no es válido
    return;
  }
  const data = [this.complementoForm, this.complemento_opcion]

  console.log('Complemento Modificar: ',data);
  this.productoService.putComplemento(data)
    .subscribe(
      res => {
        console.log(res);
        this.complementoForm={cod_complemento:0, nombre:'', descripcion:'',estado:0};
        this.listar_Complementos();
        this.mostrarToast('Complemento modificado','verde');
        $("#modalAgregarComplemento").modal('hide');
      },
      err =>{ 
        console.log('Error al obtener complemetos:', err);
        this.mostrarToast('Error al modificar el complemento','rojo');
      }
    ) 
}

//************************************************  ELIMINAR COMPLEMENTO  ****************************************************
//****************************************************************************************************************************
eliminar_Complemento(){
  this.productoService.deleteComplementoApi(this.complementoForm.cod_complemento)
  .subscribe(
    res => {
      this.complementoForm={cod_complemento:0, nombre:'', descripcion:'',estado:0};
      this.listar_Complementos();
      this.mostrarToast('Complemento eliminado','verde');
    },
    err =>{
      console.log('Error al eliminar complementos: ', err);
      this.mostrarToast('Error al eliminar el complemento','rojo');
    } 
  ) 
  $("#modalEliminarComplemento").modal('hide');
}

//************************************************  ESTADO COMPLEMENTO  ****************************************************
//****************************************************************************************************************************
estado_Complemento(){
  //VERIFICAMOS EL ESTADO PARA CAMBIARLO
  if (this.complementoForm.estado == 1) {
    this.complementoForm.estado = 0;
  }else{this.complementoForm.estado = 1;}
  //MODIFICAMOS EL ESTADO
  this.productoService.putEstadoComplemento(this.complementoForm)
  .subscribe(
    res => {
      //LIMPIAMOS LA COMPLEMENTO FORM
      this.complementoForm={cod_complemento:0, nombre:'', descripcion:'',estado:0};
      this.listar_Complementos();
      this.mostrarToast('Estado del complemento modificado','verde');
    },
    err =>{
      console.log('Error al modificar estado opciones: ', err);
      this.mostrarToast('Error al modificar el estado del complemento','rojo');
    } 
  ) 
  $("#modalEstadoComplemento").modal('hide');

}




//******************************************************* LISTAR INSUMOS ***************************************************
//************************************************************************************************************************** 


//******************************************************* LISTAR OPCIONES ***************************************************
//************************************************************************************************************************** 
lista_Opciones:any;
listar_Opciones() {
  this.productoService.getOpcionesApi()
    .subscribe(
      res => {
        this.lista_Opciones = res[0].filter((item: { estado: number; }) => item.estado === 0);
        console.log('Lista Opciones ::', this.lista_Opciones);
      },
      err => console.log('Error al Obtener Opciones')
    );
}


//******************************************************************************************************************************* 
//******************************************************  FUNCIONES EXTRAS  *****************************************************
//******************************************************************************************************************************* 
limpiar_Datos(){
  this.opcion_Seleccionada = null;
  this.complemento_opcion = []; 
  this.complemento_opcion_Seleccionado={cod_opcion:0, nom_opcion:'',descripcion:'', cod_complemento:0};
  this.complementoForm={cod_complemento:0, nombre:'', descripcion:'',estado:0};
}


//********************* SELECCIONAR LISTA *********************
complementoSeleccionado: number = 2; // Por defecto mostrar todo
lista_complementos_filtrados: any[] = [];
filtrarLista(){
  if (this.complementoSeleccionado === 2) {
    // Mostrar todos
    this.lista_complementos_filtrados = this.lista_complementos;
  } else {
    // Filtrar por estado (0 o 1)
    this.lista_complementos_filtrados = this.lista_complementos.filter((complemento: { estado: any; }) => complemento.estado === this.complementoSeleccionado);
  }
}
seleccionarOpcion(opcion: number) {
  this.complementoSeleccionado = opcion;
  this.filtrarLista();
}

//********************* OBTENER COD_OPCION DE LA LISTA *********************
obtener_CodComplemento(){
  var cod_complemento
  if (this.lista_complementos.length > 0) {
    cod_complemento = this.lista_complementos[this.lista_complementos.length-1].cod_complemento+1;
  }else{
    cod_complemento = 1;
  }
  return cod_complemento;
}




//********************* VERIFICAR SI EL FORMULARIO FORM-OPCION ES VALIDO  *********************
isFormValid(): boolean {
  return this.complementoForm.nombre.trim().length > 0 && this.complementoForm.descripcion.trim().length >0;
}
//********************* RESETEAR FORMULARIO AL CERRAR EL MODAL *********************
resetForm() {
  this.formComplemento.resetForm();
  this.formOpcion.resetForm();
  this.mostrarAdvertenciasInsumo = false;
  this.mostrarAdvertencias = false;
  this.limpiar_Datos();
}
//********************* RESETEAR FORMULARIO AL MODIFICAR O AGREGAR UNA OPCION *********************
restearFormularios(){
  this.formComplemento.resetForm();
  this.mostrarAdvertencias = false;
}

//***************************************** FORMULARIOS *************************************************
//********************* VERIFICAR SI EL FORM-INSUMO SELECCIONADO ES VALIDO *********************
isFormIsumoValid():boolean{
  // Retorna true solo si insumo_Seleccionado es válido y cantidad es mayor que 0
  const esValido = this.opcion_Seleccionada != null;
    
  console.log('Sale:: ', esValido);
  return esValido;
}

//********************* VERIFICAR SI EL INSUMO SELECCIONADO YA ESTA AGREGADO *********************
existeOpcionSeleccionado(): boolean {
return this.complemento_opcion.some((ins: { cod_opcion: any; }) => ins.cod_opcion === this.complemento_opcion_Seleccionado.cod_opcion);
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
