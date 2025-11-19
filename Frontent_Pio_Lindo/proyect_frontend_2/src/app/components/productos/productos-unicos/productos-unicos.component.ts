import { Component, ViewChild, Renderer2, Inject } from '@angular/core';
import { ProductosService } from "../../../services/productos.service";
import { InsumosService } from "../../../services/insumos.service";
import * as bootstrap from 'bootstrap';
import { NgForm } from '@angular/forms';

// This lets me use jquery
declare var $: any
@Component({
  selector: 'app-productos-unicos',
  templateUrl: './productos-unicos.component.html',
  styleUrls: ['./productos-unicos.component.css']
})
export class ProductosUnicosComponent {
  @ViewChild('formProducto') formProducto: any;
  constructor(
    private insumoService:InsumosService,
    private productoService:ProductosService,
    private renderer: Renderer2,
  ){
    this.listar_Productos();
    this.listar_Insumos();
    this.listar_Categorias();
    this.listar_Subcategorias();
  }
  page: number = 1; // Página inicial
  filterPost='';
//*****************************************************************************************************************
//**************************************************** SHOW MODALES ***********************************************
//*****************************************************************************************************************

//********************* AGREGAR PRODUCTO ************************
proceso=0;
showModalAgregar_Producto():void{
  this.proceso=1;
  $("#modalProductoUnico").modal('show');
}
showModalModificar_Producto(producto:any):void{
  this.proceso=2;
  this.agregar_Datos_al_Fomulario(producto);
  $("#modalProductoUnico").modal('show');
}
showModalEliminar_Producto(producto:any):void{
  this.producto = { ...producto};
  $("#modalEliminarProductoUnico").modal('show');
}
estado=0;
showModalEstado_Producto(producto:any):void{
  if (producto.estado == 0) {
    this.estado = 1;
  }else{this.estado = 0;}
  this.producto = { ...producto};
  $("#modalEstadoProductoUnico").modal('show');
}

//****************************************************************************************************************** 
//***************************************************  PRODUCTOS  **************************************************
//****************************************************************************************************************** 

//********************************* LISTAR PRODUCTOS **********************************
//************************************************************************************** 
lista_todo_productos:any;
lista_Productos:any;
lista_Insumos_Productos:any;
listar_Productos(){
  this.productoService.getProductosApi()
  .subscribe(
    res => {
      this.lista_todo_productos = res[0];
      this.lista_Productos = res[0].filter((item: { producto_unico: number; }) => item.producto_unico === 0);
      this.lista_Insumos_Productos = res[1];
      console.log('Productos Unicos:: ',this.lista_Productos);
      this.seleccionarOpcion(this.opcionSeleccionada);
    },
    err => console.log('Error al obtener Productos')
  ) 
}

//********************************************************* AGREGAR PRODUCTO UNICO ****************************************************
//*************************************************************************************************************************************
//Insumo Seleccionado 
insumo_Seleccionado:any=null;
//Seleccion de Categoria y SubCategoria;
categoria_Seleccionada={cod_categoria:null as number | null , nombre:''};
subcategoria_Seleccionada={cod_subcategoria:null as number | null, nombre: ''};
//Formulario de Producto
producto = {cod_producto:0 , nombre:'' , precio:null as number|null , ps_precio:null as number|null, producto_unico:0 , estado:0 , cocina:false, cod_categoria:null as number|null , cod_subcategoria:null as number|null};
//Formulario de Producto-Insumo
producto_insumo = [{cod_producto:0, cod_insumo:0, cantidad:null as number | null}];
mostrarAdvertencias: boolean = false; 
agregar_Producto_Unico(){
  //PRIMERO VERIFICAMOS EL FORMULARIO
  this.mostrarAdvertencias = true; // Activa las advertencias cuando se presiona el botón
  if (!this.isFormValid()) {
    // Código para manejar el caso cuando el formulario no es válido
    return;
  }

  //Agregar al formulario Producto : (Cod_producto, cod_categoria, cod_subcategoria)
  this.producto.cod_categoria = this.categoria_Seleccionada.cod_categoria;
  this.producto.cod_subcategoria = this.subcategoria_Seleccionada.cod_subcategoria;
  this.producto.cod_producto = this.obtener_CodProducto();
  //Guardamos al formulario Producto_Insumo el: (cod_producto, cod_insumo)
  console.log("INSUMO SELECCIONADO:: ",this.insumo_Seleccionado);
  
  if (this.insumo_Seleccionado) {
    this.producto_insumo[0].cod_producto = this.producto.cod_producto;
    this.producto_insumo[0].cod_insumo = this.insumo_Seleccionado.cod_insumo;
  }

  //LOG
  console.log('Producto a Agregar',this.producto);
  console.log('Producto Insumo:: ',this.producto_insumo);
  //Guardamos ambos datos
  var Producto_api = [this.producto, this.producto_insumo] 
  //Agregamos el Producto
  this.productoService.postProductosApi(Producto_api)
  .subscribe(
    res => {
      console.log('Productos Agregado:: ',Producto_api);
      this.listar_Productos();
      this.mostrarToast('Producto único agregado','verde');
      $("#modalProductoUnico").modal('hide');
    },
    err =>{
      console.log('Error al agregar producto único');
      this.mostrarToast('Error al agregar el producto','rojo');
    }
  ) 

}

//********************************************************* MODIFICAR PRODUCTO UNICO ****************************************************
//***************************************************************************************************************************************
agregar_Datos_al_Fomulario(producto:any){
  //AGREGAMOS LOS DATOS DEL PRODUCTO SELECCIONADO AL FORMULARIO
  this.producto={ ...producto};
  console.log('Producto a Modificar: ',this.producto);
  //FILTRAMOS CATEGORIA Y SUBCATEGORIA
  //1RO: FILTRAMOS LA CATEGORIA Y SUBCATEGOTRIA DEL PRODUCTO A MODIFICAR
  const categoria = this.lista_categorias.find((cat: { cod_categoria: any; }) => cat.cod_categoria === producto.cod_categoria);
  const subcategoria = this.lista_subcategorias.find((cat: { cod_subcategoria: any; }) => cat.cod_subcategoria === producto.cod_subcategoria);
  //2DO: AGREGAMOS CATEGORIA Y SUBCATEGORIA AL FORMULARIO
  if (categoria) {
    this.categoria_Seleccionada = {cod_categoria:categoria.cod_categoria, nombre:categoria.nombre};
  }
  if (subcategoria) {
    this.subcategoria_Seleccionada = {cod_subcategoria:subcategoria.cod_subcategoria, nombre:subcategoria.nombre};
  }
  //3RO: FILTRAOS LAS SUBCATEGORIAS DE LA CATEGORIA PARA QUE SE MUESTREN EN LA OPCION DE SELECCIONAR SUBCATEGORIAS
  this.filtrarSubcategorias();

  //FILTRAMOS EL INSUMO
  //1RO: FILTRAMOS DE LA LISTA INSUMOS-PRODUCTOS DEL INSUMO RELACIONADO AL PRODUCTO SELECCIONADO A MODIFICAR 
  const insumo_producto = this.lista_Insumos_Productos.find((pro: { cod_producto: any; }) => pro.cod_producto === producto.cod_producto);
  console.log('Insumo Relacionado: ', insumo_producto);
  //2DO: FILTRAMOS LOS DATOS DEL INSUMO RELACIONADO DE LA LISTA INSUMOS
  var insumo_seleccionado;
  if (insumo_producto) {
    insumo_seleccionado = this.lista_Insumos.find((ins: { cod_insumo: any; }) => ins.cod_insumo === insumo_producto.cod_insumo);
    console.log('Datos del Insumo Relacionado : ', insumo_seleccionado);
  //3RO: AGREGAMOS LOS DATOS AL FORMULARIO
    this.insumo_Seleccionado = { ...insumo_seleccionado};
    this.producto_insumo[0].cantidad = insumo_producto.cantidad;
    this.producto_insumo[0].cod_producto = insumo_producto.cod_producto;
    this.producto_insumo[0].cod_insumo = insumo_producto.cod_insumo;
  }
}

modificar_Producto_Unico(){
  //PRIMERO VERIFICAMOS EL FORMULARIO
  this.mostrarAdvertencias = true; // Activa las advertencias cuando se presiona el botón
  if (!this.isFormValid()) {
    // Código para manejar el caso cuando el formulario no es válido
    console.log('No valido');
    
    return;
  }
  //Agregar al formulario Producto : (Cod_producto, cod_categoria, cod_subcategoria)
  this.producto.cod_categoria = this.categoria_Seleccionada.cod_categoria;
  this.producto.cod_subcategoria = this.subcategoria_Seleccionada.cod_subcategoria;

  //Guardamos al formulario Producto_Insumo el: (cod_producto, cod_insumo)
  if (this.insumo_Seleccionado) {
    this.producto_insumo[0].cod_producto = this.producto.cod_producto;
    this.producto_insumo[0].cod_insumo = this.insumo_Seleccionado.cod_insumo;
  }

  console.log('Producto a Modificar',this.producto);
  console.log('Producto Insumo a Modificar:: ',this.producto_insumo);
  //Guardamos ambos datos
  var Producto_api = [this.producto, this.producto_insumo] 
  //Agregamos el Producto
  this.productoService.putProductosApi(Producto_api)
  .subscribe(
    res => {
      console.log('Productos Agregado:: ',Producto_api);
      this.listar_Productos();
      this.mostrarToast('Producto único modificado','verde');
      $("#modalProductoUnico").modal('hide');
    },
    err =>{
      console.log('Error al modificar Productos');
      this.mostrarToast('Error al modificar el producto','rojo');
    }
  ) 
}


//********************************************************* ELIMINAR PRODUCTO UNICO ****************************************************
//*************************************************************************************************************************************
eliminar_Producto_Unico(){
  this.productoService.deleteProductoApi(this.producto.cod_producto)
  .subscribe(
    res => {
      console.log('Productos Eliminado:: ',this.producto.nombre);
      this.listar_Productos();
      this.limpiar_Datos();
      this.mostrarToast('Producto único eliminado','verde');
      $("#modalEliminarProductoUnico").modal('hide');
    },
    err =>{ 
      console.log('Error al obtener Productos');
      this.mostrarToast('Error al eliminar el Producto','rojo');
    }
  ) 
}

//********************************************************* ELIMINAR PRODUCTO UNICO ****************************************************
//*************************************************************************************************************************************
estado_Producto_Unico(){
  if (this.producto.estado==0) {
    this.producto.estado=1;
  }else{this.producto.estado=0}

  this.productoService.estadoProductoApi(this.producto)
  .subscribe(
    res => {
      console.log('Producto estado:: ',this.producto);
      
      this.listar_Productos();
      this.limpiar_Datos();
      this.mostrarToast('Estado del producto modificado','verde');
      $("#modalEstadoProductoUnico").modal('hide');
    },
    err =>{ 
      console.log('Error al obtener Productos');
      this.mostrarToast('Error al modificar el estado del producto','rojo');
    }
  ) 
}

//************************************************************************************************************************** 
//******************************************************* LISTAR INSUMOS ***************************************************
//************************************************************************************************************************** 
lista_Insumos:any;
listar_Insumos(){
  this.insumoService.get_InsumosApi()
  .subscribe(
    res => {
      this.lista_Insumos = res;
      this.lista_Insumos = this.lista_Insumos.map((insumo: { nombre: any; nom_medida: any; }) => ({
       ...insumo,
       display: `${insumo.nombre} - (${insumo.nom_medida})`
     }));
     
      console.log('Lista Insumos ::',this.lista_Insumos);
    },
    err => console.log('Error al obtener Productos')
  ) 
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
//******************************************* LISTAR SUBCATEGORIAS ***********************************************
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

//**************************************************************************************************************
//************************************************ FUNCIONES EXTRAS ********************************************
//**************************************************************************************************************

//************************ FILTRAR CATEGORIAS Y SUB CATEGORIAS ***********************
limpiar_Datos(){
  this.producto = {cod_producto:0 , nombre:'' , precio:null as number|null, ps_precio:null as number|null , producto_unico:0 , estado:0 , cocina:false, cod_categoria:null as number|null , cod_subcategoria:null as number|null};
  this.producto_insumo = [{cod_producto:0, cod_insumo:0, cantidad:null as number | null}];
  this.categoria_Seleccionada={cod_categoria:null as number | null , nombre:''};
  this.subcategoria_Seleccionada={cod_subcategoria:null as number | null, nombre: ''};
  this.insumo_Seleccionado=null;
}


//*************** OBTENER ULTIMO COD-PRODUCTO ***********************
obtener_CodProducto(){
 // Verifica que la lista no esté vacía y es un array
 if (Array.isArray(this.lista_todo_productos) && this.lista_todo_productos.length > 0) {
  // Obtiene el último producto de la lista
  const ultimoProducto = this.lista_todo_productos[this.lista_todo_productos.length - 1];
  
  // Devuelve el siguiente código producto incrementando el último código
  return ultimoProducto.cod_producto + 1;
  }

  // Si la lista está vacía, comienza con cod_producto = 1
  return 1;
}


//******************* FILTRAR SUBCATEGORIAS DE CATEGORIA SELECIONADA *************************
onCategoriaSeleccionada() {
  this.filtrarSubcategorias();
  // Resetear la subcategoría seleccionada cuando se cambia la categoría
  this.subcategoria_Seleccionada = { cod_subcategoria: 0, nombre: '' };
}

sub_categorias_filtradas: any[] = [];
filtrarSubcategorias() {
  if (this.categoria_Seleccionada) {
    this.sub_categorias_filtradas = this.lista_subcategorias.filter(subcat => subcat.cod_categoria === this.categoria_Seleccionada.cod_categoria); 
  }
}




//********************* VERIFICAR SI EL FORMULARIO FORM-OPCION ES VALIDO  *********************
isFormValid(): boolean {
  var existe_insumo = true;
  if (this.insumo_Seleccionado && (this.producto_insumo[0].cantidad == null || this.producto_insumo[0].cantidad <= 0)) {
    existe_insumo = false;
  }else if ((this.producto_insumo[0].cantidad!=null && this.producto_insumo[0].cantidad > 0) && !this.insumo_Seleccionado) {
    existe_insumo = false;
  }
  return this.producto.nombre.trim().length > 0  && this.producto.precio != null && this.producto.precio > 0 && this.producto.ps_precio != null && this.producto.ps_precio > 0 && existe_insumo;
}
//********************* RESETEAR FORMULARIO AL CERRAR EL MODAL *********************
resetForm() {
  this.formProducto.resetForm();
  this.mostrarAdvertencias = false;
  this.limpiar_Datos();
}
//********************* RESETEAR FORMULARIO AL MODIFICAR O AGREGAR UNA OPCION *********************
restearFormularios(){
  this.formProducto.resetForm();
  this.mostrarAdvertencias = false;
}

//********************* SELECCIONAR LISTA *********************
opcionSeleccionada: number = 2; // Por defecto mostrar todo
lista_productos_filtradas: any[] = [];
filtrarLista(){
  if (this.opcionSeleccionada === 2) {
    // Mostrar todos
    this.lista_productos_filtradas = this.lista_Productos;
  } else {
    // Filtrar por estado (0 o 1)
    this.lista_productos_filtradas = this.lista_Productos.filter((producto: { estado: any; }) => producto.estado === this.opcionSeleccionada);
  }
}

seleccionarOpcion(opcion: any) {
  this.opcionSeleccionada = opcion;
  this.filtrarLista();
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
