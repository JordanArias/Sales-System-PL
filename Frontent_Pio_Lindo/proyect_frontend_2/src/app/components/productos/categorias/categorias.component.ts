import { Component, ViewChild, Renderer2 } from '@angular/core';
import { ProductosService } from "../../../services/productos.service";
import * as bootstrap from 'bootstrap';
import { NgForm } from '@angular/forms';
// This lets me use jquery
declare var $: any
@Component({
  selector: 'app-categorias',
  templateUrl: './categorias.component.html',
  styleUrls: ['./categorias.component.css']
})
export class CategoriasComponent {
  @ViewChild('formCategoria') formCategoria: any;
  @ViewChild('formSubcategoria') formSubcategoria: any;
  @ViewChild('formSubcategoriaMod') formSubcategoriaMod: any;
  constructor(
    private productoService:ProductosService,
    private renderer: Renderer2
  ){
    this.listar_Categorias();
    this.listar_Subcategorias();
  }
  page: number = 1; // Página inicial
  filterPost='';

//*************************************************************************************************************************** 
//*********************************************************  MODALES  *******************************************************
//***************************************************************************************************************************
categoria_proceso=0;
showModal_Categoria(categoria: any, proceso: number): void {
  if (proceso === 2) {
    this.categoria_form = { ...categoria }; // Usar una copia del objeto
  } else {
    this.categoria_form = { cod_categoria: 0, nombre: '' }; // Valores iniciales
  }

  this.categoria_proceso = proceso;
  $("#modalCategoria").modal('show');
}

showModalEliminar_Categoria(categoria:any):void{
  this.categoria_form=categoria;
  $("#modalEliminarCategoria").modal('show');
}
//********************* SUBCATEGORIAS *********************
nombre_categoria='';
showModal_Subcategoria(categoria:any):void{
  this.limpiar_Datos();
  this.nombre_categoria = categoria.nombre;
  this.categoria_form = { ...categoria};
  this.subcategorias_de_categoria(this.categoria_form.cod_categoria);
  $("#modalSubcategoria").modal('show');
}
showModal_Eliminar_Subcategoria(subcategoria:any):void{
  this.subcategoria_del = { ...subcategoria};
  $("#modalEliminarSubcategoria").modal('show');
}
showModal_Modificar_Subcategoria(subcategoria:any):void{
  this.subcategoria_mod = { ...subcategoria};
  $("#modalSubcategoria").modal('hide');
  $("#modalModificarSubCategoria").modal('show');
}

//*************************************************************************************************************************** 
//*******************************************************  CATEGORIAS  ******************************************************
//***************************************************************************************************************************

//******************************************* LISTAR CATEGORIAS *******************************************
lista_categorias:any;
listar_Categorias(){
  this.productoService.getCategoriasApi()
  .subscribe(
    res => {
      this.lista_categorias = res; 
    },
    err => console.log('Error al obtener Categorias')
  ) 
}
//*********************************************** AGREGAR CATEGORIA ***********************************************
mostrarAdvertencias: boolean = false;
categoria_form={cod_categoria:0, nombre:''}
agregar_Categoria(){
  //PRIMERO VERIFICAMOS EL FORMULARIO
  this.mostrarAdvertencias = true; // Activa las advertencias cuando se presiona el botón
  if (!this.isFormValid()) {
    // Código para manejar el caso cuando el formulario no es válido
    return;
  }

  //PRIMERO BUSCAMOS LA ULTIMA COD_CATEGORIA CORRESPONDIENTE SEGUN LA LISTA CATEGORIAS
  var cod_categoria
  if (this.lista_categorias.length>0) {
    cod_categoria = this.lista_categorias[this.lista_categorias.length-1].cod_categoria+1;
    console.log("cod categoria",this.lista_categorias.length);
  }else{
    cod_categoria=1;
  }
  //AGREGAMOS EL COD_CATEGORIA AL FORMULARIO
  this.categoria_form.cod_categoria=cod_categoria;
  //LLAMAMOS A LA API
  this.productoService.postCategoriasApi(this.categoria_form)
  .subscribe(
    res => {
      console.log('Categoria Agregada');
      this.limpiar_Datos();
      this.listar_Categorias();
      this.mostrarToast('Categoria agregada','verde');
      $("#modalCategoria").modal('hide');  
    },
    err => {
      console.log('Error al obtener Categorias'); 
      this.mostrarToast('Error al agregar la categoria','rojo');
    }
  )  
}
//*********************************************** ElIMINAR CATEGORIA **********************************************
eliminar_Categoria(){
  this.productoService.deleteCategoriaApi(this.categoria_form.cod_categoria)
  .subscribe(
    res => {
      console.log('Categoria Eliminada');
      this.listar_Categorias();
      this.mostrarToast('Categoria eliminada','verde');
      $("#modalEliminarCategoria").modal('hide');  
    },
    err => {
      console.log('Error al eliminar la categoria');
      this.mostrarToast('Error al Eliminar Categoria','rojo');
    }
  )  
}
//********************************************** MODIFICAR CATEGORIA **********************************************
modificar_categoria(){
  //PRIMERO VERIFICAMOS EL FORMULARIO
  this.mostrarAdvertencias = true; // Activa las advertencias cuando se presiona el botón
  if (!this.isFormValid()) {
    // Código para manejar el caso cuando el formulario no es válido
    return;
  }
  this.productoService.putCategoriaApi(this.categoria_form)
  .subscribe(
    res => {
      console.log('Categoria Modificada');
      this.listar_Categorias();
      this.mostrarToast('Categoria modificada','verde');
      $("#modalCategoria").modal('hide');  
    },
    err => {
      console.log('Error al obtener Categorias')
      this.mostrarToast('Error al modificar la categoria','rojo');
    }
  )  
}


//*************************************************************************************************************************** 
//******************************************************  SUBCATEGORIAS  ****************************************************
//***************************************************************************************************************************

//******************************************* LISTAR SUBCATEGORIAS ***********************************************
//lista_subcategorias:any;
lista_subcategorias : any[] = [];
listar_Subcategorias(){
  this.productoService.getSubCategoriasApi()
  .subscribe(
    res => {
      this.lista_subcategorias = res;
      console.log(this.lista_subcategorias);
    },
    err => console.log('Error al obtener Categorias')
  ) 
}
subcategorias_categoria : any[] = [];
subcategorias_de_categoria(cod_categoria:any){
  //Filtramos al subcategorias de la categoria seleccionada
  this.subcategorias_categoria=this.lista_subcategorias.filter((item: { cod_categoria: any; }) => item.cod_categoria === cod_categoria);
  console.log('Lista Nueva Subcategorias::: ',this.subcategorias_categoria);
  //Registramos el cod_categoria al subcategoria_form
  this.cod_categoria = cod_categoria;
}
//************************************************ AGREGAR CATEGORIA ************************************************
mostrarAdvertenciasMod:boolean = false;
cod_categoria:any;
subcategoria_form={cod_subcategoria:0, nombre:'',cod_categoria:0};
agregar_Subategoria(){
  //PRIMERO VERIFICAMOS EL FORMULARIO
  this.mostrarAdvertencias = true; // Activa las advertencias cuando se presiona el botón
  if (!this.isFormValidSubcategoria()) {
    // Código para manejar el caso cuando el formulario no es válido
    return;
  }
  if(this.subcategoria_form.nombre=='' || this.subcategoria_form.nombre==null) {
    this.mostrarToast('Ingresar Nombre','rojo');
  }else{
    //Primero Agregamos el cod_categoria
    this.subcategoria_form.cod_categoria = this.cod_categoria;
    //Segundo Agregamos el cod_subcategoria
    this.subcategoria_form.cod_subcategoria = this.obtener_codSubcategoria();
    console.log("SUBCATEGORIA AGREGADA :: ",this.subcategoria_form);
    this.productoService.postSubCategoriasApi(this.subcategoria_form)
    .subscribe(
      res => {
        this.listar_Subcategorias();
        this.subcategorias_categoria.push(this.subcategoria_form); console.log("Nueva Lista Subcategorias:: ",this.subcategorias_categoria);
        this.mostrarToast('Subcategoria agregada','verde');
        this.limpiar_Datos();
        this.resetFormCategoria();
      },
      err => {
        console.log('Error al crear Subcategorias')
        this.mostrarToast('Error al agregar la subcategoria','rojo');
      }
    ) 
  }
}
subcategoria_del={cod_subcategoria:0, nombre:'',cod_categoria:0}
eliminar_Subcategoria(){
  this.productoService.deleteSubCategoriaApi(this.subcategoria_del.cod_subcategoria)
    .subscribe(
      res => {
        //Listamos Subcategorias
        this.listar_Subcategorias();
        //ELIMINAMOS LA SUBCATEGORIA DE LA LISTA
        //1.- Encontrar el índice del elemento a eliminar
        const index = this.subcategorias_categoria.findIndex(item => item.cod_subcategoria === this.subcategoria_del.cod_subcategoria);
        //2.- Si se encuentra, eliminarlo del array
        if (index !== -1) {
          this.subcategorias_categoria.splice(index, 1);
        }
        this.mostrarToast('Subcategoria eliminada','verde');
        this.limpiar_Datos();
        $("#modalEliminarSubcategoria").modal('hide');
      },
      err => {
        console.log('Error al crear Subcategorias');
        this.mostrarToast('Error al eliminar la subcategoria','rojo');
      }
    ) 

}
subcategoria_mod={cod_subcategoria:0, nombre:'',cod_categoria:0}
modificar_Subcategoria(){
  //PRIMERO VERIFICAMOS EL FORMULARIO
  this.mostrarAdvertenciasMod = true; // Activa las advertencias cuando se presiona el botón
  if (!this.isFormValidSubcategoriaMod()) {
    // Código para manejar el caso cuando el formulario no es válido
    return;
  }
  //MODIFICAR EN LA LISTA PARA QUE SE VEA EL CAMBIO
  //FILTRAMOS Y MODIFICAMOS
  this.subcategorias_categoria.find(subcategoria => subcategoria.cod_subcategoria === this.subcategoria_mod.cod_subcategoria)!.nombre = this.subcategoria_mod.nombre;

  this.productoService.putSubCategoriaApi(this.subcategoria_mod)
  .subscribe(
    res => {
      console.log('Subcategoria modificada');
      this.mostrarToast('Subcategoria Modificada','verde');
    },
    err => {
      console.log('Error al obtener Categorias');
      this.mostrarToast('Error al modificar la subcategoria','rojo');
    }
  )  
  $("#modalModificarSubCategoria").modal('hide');
  $("#modalSubcategoria").modal('show');
}


//*************************************************************************************************************************** 
//***************************************************  FUNCIONES EXTRAS  ****************************************************
//***************************************************************************************************************************
obtener_codSubcategoria(){
  var cod_subcategoria
  if (this.lista_subcategorias.length>0) {
    cod_subcategoria = this.lista_subcategorias[this.lista_subcategorias.length-1].cod_subcategoria+1;
  }else{
    cod_subcategoria=1;
  }
  return cod_subcategoria;
}
limpiar_Datos(){
  this.categoria_form={cod_categoria:0, nombre:''};
  this.subcategoria_form={cod_subcategoria:0, nombre:'',cod_categoria:0};
}

//********************* VERIFICAR SI EL FORMULARIO FORM-OPCION ES VALIDO  *********************
isFormValid(): boolean {
  return this.categoria_form.nombre.trim().length > 0 ;
}
isFormValidSubcategoria(): boolean {
  console.log('Nombre Sub Categoria: ',this.subcategoria_form.nombre.trim().length);
  return this.subcategoria_form.nombre.trim().length > 0;
}
isFormValidSubcategoriaMod(): boolean {
  console.log('Nombre Sub Categoria: ',this.subcategoria_mod.nombre.trim().length);
  return this.subcategoria_mod.nombre.trim().length > 0;
}
//********************* RESETEAR FORMULARIO AL CERRAR EL MODAL *********************
resetFormCategoria() {
  this.formCategoria.resetForm();
  if (this.formSubcategoria) { this.formSubcategoria.resetForm(); }
  this.mostrarAdvertencias = false;
  this.limpiar_Datos();
}

//********************* RESETEAR FORMULARIO AL CERRAR EL MODAL *********************
resetFormSubcategoria() {
  if (this.formSubcategoriaMod) { this.formSubcategoriaMod.resetForm(); }
  this.mostrarAdvertenciasMod = false;
  this.subcategoria_mod={cod_subcategoria:0, nombre:'',cod_categoria:0}
}



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
