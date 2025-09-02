import { Component, ViewChild, Renderer2, Inject } from '@angular/core';
import { ProductosService } from "../../../services/productos.service";
import { InsumosService } from "../../../services/insumos.service";
import * as bootstrap from 'bootstrap';
import { NgForm } from '@angular/forms';

// This lets me use jquery
declare var $: any
@Component({
  selector: 'app-productos-compuestos',
  templateUrl: './productos-compuestos.component.html',
  styleUrls: ['./productos-compuestos.component.css']
})
export class ProductosCompuestosComponent {
  @ViewChild('formProducto') formProducto: any;
  @ViewChild('formInsumo') formInsumo: any;
  @ViewChild('formComplemento') formComplemento: any;
  constructor(
    private insumoService:InsumosService,
    private productoService:ProductosService,
    private renderer: Renderer2,
  ){
    this.listar_Productos();
    this.listar_Insumos();
    this.listar_Categorias();
    this.listar_Subcategorias();
    this.listar_Complementos();
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
  this.productoForm = { ...producto};
  $("#modalEliminarProductoUnico").modal('show');
}
estado=0;
showModalEstado_Producto(producto:any):void{
  if (producto.estado == 0) {
    this.estado = 1;
  }else{this.estado = 0;}
  this.productoForm = { ...producto};
  $("#modalEstadoProductoUnico").modal('show');
}

//*************************************************************************************************************************************** 
//***************************************************************  PRODUCTOS  ***********************************************************
//*************************************************************************************************************************************** 

//******************************************************* LISTAR PRODUCTOS ************************************************************
//************************************************************************************************************************************* 
lista_todo_productos:any
lista_Productos:any;
lista_Insumos_Productos:any;
lista_Complementos_Productos:any;
listar_Productos(){
  this.productoService.getProductosApi()
  .subscribe(
    res => {
      this.lista_todo_productos = res[0];
      this.lista_Productos = res[0].filter((item: { producto_unico: number; }) => item.producto_unico === 1);;
      this.lista_Insumos_Productos = res[1];
      this.lista_Complementos_Productos = res[2];
      console.log('Productos - Complementos:: ',this.lista_Complementos_Productos);
      console.log('Productos Todo:: ',this.lista_todo_productos);
      
      // console.log('Productos-Insumos:: ',this.lista_Insumos_Productos);
      this.seleccionarOpcion(this.opcionSeleccionada);
    },
    err => console.log('Error al obtener Productos')
  ) 
}

//********************************************************* AGREGAR PRODUCTO UNICO ****************************************************
//*************************************************************************************************************************************
//Seleccion de Categoria y SubCategoria;
categoria_Seleccionada={cod_categoria: null , nombre:''};
subcategoria_Seleccionada={cod_subcategoria: null, nombre: ''};
//Formulario de Producto
productoForm = {cod_producto:0 , nombre:'' , precio:null as number|null , ps_precio:null as number|null , producto_unico:1 , estado:0 , cocina:false, cod_categoria:null as number|null , cod_subcategoria:null as number|null};
//Formulario de Producto-Insumo

mostrarAdvertencias: boolean = false; 
// -------------------------------------------------------------------------------------------------------
//Insumo Seleccionado 
insumo_Seleccionado:any=null;
insumos_productos_Form:any[]=[]; 
insumo_producto_Seleccionado={cod_insumo:0, nombre:'',nom_medida:'', cod_producto:0, cantidad:null as number | null, repetido:0};
// -------------------------------------------------------------------------------------------------------
complemento_Seleccionado:any = null;
complemento_productos_form: any[]=[];
complemento_producto_seleccionado = {cod_complemento:0, nombre:'', descripcion:'', listaopciones:'', cod_producto:0};

//AGREGAMOS LOS INSUMOS-SUBRECETAS SELECCIONADOS
mostrarAdvertenciasInsumo: boolean = false;
//********************* 1.- ADICIONAR INSUMO ***********************************
adicionar_Insumo_Producto(form:NgForm){
  //PRIMERO VERIFICAMOS EL FORMULARIO
  this.mostrarAdvertenciasInsumo = true; // Activa las advertencias cuando se presiona el botón
  if (!this.isFormIsumoValid()) {
    console.log('No Valido');
    return;
  }
 
  //Agregamos insumo_Seleccionado a insumo_subreceta_Seleccionado
  this.insumo_producto_Seleccionado.cod_insumo=this.insumo_Seleccionado.cod_insumo;
  this.insumo_producto_Seleccionado.nombre=this.insumo_Seleccionado.nombre;
  this.insumo_producto_Seleccionado.nom_medida=this.insumo_Seleccionado.nom_medida;
  // Verificamos si el insumo ya existe en la lista
  if (this.existeInsumoSeleccionado()) {
    console.log('El insumo ya existe en la lista.');
    return;
  }
  //Agregamos a la lista de subrecetas
  console.log('Push:::::');
  this.insumos_productos_Form.push(this.insumo_producto_Seleccionado);
  
  //Limpiamos los datos
  this.insumo_producto_Seleccionado={cod_insumo:0, nombre:'',nom_medida:'', cod_producto:0, cantidad:null as number | null, repetido:0}
  // this.insumo_Seleccionado=null;
  form.resetForm();
  // Desactivamos las advertencias
  this.mostrarAdvertenciasInsumo = false;
}
//********************* 1.- ELIMINAR INSUMO ************************************
eliminar_Insumo_Producto(index: number) {
  this.insumos_productos_Form.splice(index, 1);
}
//********************* 2.- ADICIONAR COMPLEMENTO ******************************
mostrarAdvertenciasComplemento: boolean = false;
adicionar_Complemento_Producto(form:NgForm){
  //PRIMERO VERIFICAMOS EL FORMULARIO
  this.mostrarAdvertenciasComplemento = true; // Activa las advertencias cuando se presiona el botón
  if (!this.isFormComplementoValid()) {
    console.log('No Valido');
    return;
  }
 
  //AGREGAMOS complemento_Seleccionado a complemento_producto_seleccionado
  this.complemento_producto_seleccionado.cod_complemento=this.complemento_Seleccionado.cod_complemento;
  this.complemento_producto_seleccionado.nombre=this.complemento_Seleccionado.nombre;
  this.complemento_producto_seleccionado.descripcion=this.complemento_Seleccionado.descripcion;
  this.complemento_producto_seleccionado.listaopciones=this.complemento_Seleccionado.listaopciones;

  // Verificamos si el insumo ya existe en la lista
  if (this.existeComplementoSeleccionado()) {
    console.log('El complemento ya existe en la lista.');
    return;
  }
  //AGREGAMOS A LA LISTA COMPLEMENTO PRODUCTOS_FORM
  console.log('Push:::::');
  this.complemento_productos_form.push(this.complemento_producto_seleccionado);
  
  //LIMPIAMOS DEL COMPLEMENTO_PRODUCTO_SELECCIONADO
  this.complemento_producto_seleccionado = {cod_complemento:0, nombre:'', descripcion:'', listaopciones:'', cod_producto:0};

  //RESETEAMOS EL FORMULARIO
  form.resetForm();

  // DESACTIVAMOS LAS ADVERTENCIAS
  this.mostrarAdvertenciasComplemento = false;
}
//********************* 2.- ELIMINAR COMPLEMENTO *******************************
eliminar_Complemento_Producto(index: number) {
  this.complemento_productos_form.splice(index, 1);
}

////////////////////////////// AGREGAR PRODUTO API ////////////////////////////////
AGREGAR_PRODUCTO(){
  //PRIMERO VERIFICAMOS EL FORMULARIO
  this.mostrarAdvertencias = true; // Activa las advertencias cuando se presiona el botón
  if (!this.isFormValid()) {
    console.log('No Valido');
    return;
  }

  //Agregar al formulario Producto : (Cod_producto, cod_categoria, cod_subcategoria)
  if (this.categoria_Seleccionada) {this.productoForm.cod_categoria = this.categoria_Seleccionada.cod_categoria;} 
  else{this.productoForm.cod_categoria = null;};
  if (this.subcategoria_Seleccionada && this.categoria_Seleccionada) {this.productoForm.cod_subcategoria = this.subcategoria_Seleccionada.cod_subcategoria; } 
  else {this.productoForm.cod_subcategoria = null;}
  //AGREGAMOS EL ULTIMO COD_PRODUCTO
  this.productoForm.cod_producto = this.obtener_CodProducto();
  
  //Guardamos al formulario Producto_Insumo el: (cod_producto, cod_insumo)
  console.log('------------------------AGREGAR PRODUCTO------------------------------------------');
  
  console.log('Producto Form: ',this.productoForm);
  console.log('Productos-Insumos: ',this.insumos_productos_Form);
  console.log('Productos-Complementows: ',this.complemento_productos_form);

  const datos=[this.productoForm, this.insumos_productos_Form, this.complemento_productos_form]

  // Agregamos el Producto
  this.productoService.postProductosApi(datos)
  .subscribe(
    res => {
      this.limpiar_Datos();
      this.listar_Productos();
      this.mostrarToast('Producto compuesto agregado','verde');
    },
    err =>{
      console.log('Error al agregar Producto');
      this.mostrarToast('Error al agregar el producto','rojo');
    }
  ) 
  $("#modalProductoUnico").modal('hide');
}



//********************************************************* MODIFICAR PRODUCTO UNICO ****************************************************
//***************************************************************************************************************************************
//**************** AGREGAR DATOS AL FORMULARIO PRODUCTO *********************
agregar_Datos_al_Fomulario(producto:any){
  //1RO: AGREGAMOS LOS DATOS DE LA OPCION SELECCIONADA AL FORMULARIO
  this.productoForm = { ...producto};

  //2DO: FILTRAMOS LA CATEGORIA Y SUBCATEGOTRIA DEL PRODUCTO A MODIFICAR
  const categoria = this.lista_categorias.find((cat: { cod_categoria: any; }) => cat.cod_categoria === producto.cod_categoria);
  const subcategoria = this.lista_subcategorias.find((cat: { cod_subcategoria: any; }) => cat.cod_subcategoria === producto.cod_subcategoria);

  //3RO: AGREGAMOS CATEGORIA Y SUBCATEGORIA AL FORMULARIO
  if (categoria) {
    this.categoria_Seleccionada = {cod_categoria:categoria.cod_categoria, nombre:categoria.nombre};
  }
  if (subcategoria) {
    this.subcategoria_Seleccionada = {cod_subcategoria:subcategoria.cod_subcategoria, nombre:subcategoria.nombre};
  }

  //4TO: FILTRAMOS DE LA LISTA INSUMOS-PRODUCTOS DEL INSUMO RELACIONADO AL PRODUCTO SELECCIONADO A MODIFICAR
  const producto_insumo = this.lista_Insumos_Productos.filter((co: { cod_producto: any; }) =>co.cod_producto === producto.cod_producto);
  //5TO: AGREGAMOS LOS DATOS AL FORMULARIO insumos_productos_Form
  this.insumos_productos_Form = producto_insumo.map((op: any) => ({ ...op }));

  //6TO: FILTRAMOS DE LA LISTA COMPLEMENTO-PRODUCTOS DEL COMPLEMENTO AL PRODUCTO SELECCIONADO A MODIFICAR Y AUMENTANTO LA LISTAOPCIONES
  const producto_complemento = this.lista_Complementos_Productos.filter((cp: { cod_producto: any; }) => cp.cod_producto === producto.cod_producto);

  producto_complemento.forEach((producto: any) => {
    // Encuentra el complemento correspondiente en this.lista_Complementos
    const complemento = this.lista_Complementos.find((comp: any) => comp.cod_complemento === producto.cod_complemento);
  
    // Si se encuentra el complemento, agrega la lista de opciones
    if (complemento) {
      producto.listaopciones = complemento.listaopciones;
    }
  });
  
  console.log('Producto Complemento con Opciones:', producto_complemento);
  
  //7MO: AGREGAMOS LOS DATOS AL FORMULARIO complemento_productos_form
  this.complemento_productos_form = producto_complemento.map((pc: any) => ({ ...pc }));



}
//////////////////////// MODIFIRCAR PRODUTO API ///////////////////////////////
MODIFICAR_PRODUCTO(){
  //PRIMERO VERIFICAMOS EL FORMULARIO
  this.mostrarAdvertencias = true; // Activa las advertencias cuando se presiona el botón
  if (!this.isFormValid()) {
    // Código para manejar el caso cuando el formulario no es válido
    console.log('No valido');
    
    return;
  }
  //Agregar al formulario Producto : (Cod_producto, cod_categoria, cod_subcategoria)
  if (this.categoria_Seleccionada) {this.productoForm.cod_categoria = this.categoria_Seleccionada.cod_categoria;} 
  else{this.productoForm.cod_categoria = null;};
  if (this.subcategoria_Seleccionada && this.categoria_Seleccionada) {this.productoForm.cod_subcategoria = this.subcategoria_Seleccionada.cod_subcategoria; } 
  else {this.productoForm.cod_subcategoria = null;}

  console.log('Producto a Modificar',this.productoForm);
  console.log('Producto Insumo a Modificar:: ',this.insumos_productos_Form);
  console.log('Productos-Complementows a Modificar: ',this.complemento_productos_form);
  //Guardamos ambos datos
  const datos=[this.productoForm, this.insumos_productos_Form, this.complemento_productos_form]
  //Agregamos el Producto
  this.productoService.putProductosApi(datos)
  .subscribe(
    res => {
      this.listar_Productos();
      this.mostrarToast('Producto compuesto modificado','verde');
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
  this.productoService.deleteProductoApi(this.productoForm.cod_producto)
  .subscribe(
    res => {
      console.log('Productos Eliminado:: ',this.productoForm.nombre);
      this.listar_Productos();
      this.limpiar_Datos();
      this.mostrarToast('Producto compuesto eliminado','verde');
      $("#modalEliminarProductoUnico").modal('hide');
    },
    err =>{ 
      console.log('Error al obtener Productos');
      this.mostrarToast('Error al eliminar el producto','rojo');
    }
  ) 
}

//********************************************************* ELIMINAR PRODUCTO UNICO ****************************************************
//*************************************************************************************************************************************
estado_Producto_Unico(){
  if (this.productoForm.estado==0) {
    this.productoForm.estado=1;
  }else{this.productoForm.estado=0}

  this.productoService.estadoProductoApi(this.productoForm)
  .subscribe(
    res => {
      console.log('Producto estado:: ',this.productoForm);
      
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

//******************************************************************************************************************************************* 
//***************************************************************** LISTAR EXTRAS ***********************************************************
//******************************************************************************************************************************************* 

//************************************************** LISTAR INSUMOS **********************************************
//**************************************************************************************************************** 
lista_Insumos:any;
listar_Insumos(){
  this.insumoService.get_InsumosApi()
  .subscribe(
    res => {
      this.lista_Insumos = res;
    //   this.lista_Insumos = this.lista_Insumos.map((insumo: { nombre: any; nom_medida: any; }) => ({
    //    ...insumo,
    //    display: `${insumo.nombre} - (${insumo.nom_medida})`
    //  }));
    },
    err => console.log('Error al obtener Productos')
  ) 
}


//*********************************************** LISTAR COMPLEMENTOS *********************************************
//***************************************************************************************************************** 
lista_Complementos:any;
lista_complementos_opciones:any;
listar_Complementos(){
  this.productoService.getComplementosApi()
  .subscribe(
    res => {
      this.lista_Complementos = res[0];
      this.lista_complementos_opciones = res[1]
      // console.log('Lista Complementos ::',res);
      // Combina los complementos con los nombres de sus opciones en una sola cadena de texto
      this.lista_Complementos = this.lista_Complementos.map((complemento: any) => {
          const opciones = this.lista_complementos_opciones
            .filter((opcion: any) => opcion.cod_complemento === complemento.cod_complemento)
            .map((opcion: any) => opcion.nom_opcion)
            .join(', ');

          return {
            ...complemento,
            listaopciones: opciones
          };
      });

          console.log('Lista Complementos con Opciones en Texto ::', this.lista_Complementos);
    },
    err => console.log('Error al obtener Complementos')
  ) 
}


//*********************************************** LISTAR CATEGORIAS ***********************************************
//***************************************************************************************************************** 
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
//***************************************************************************************************************** 
lista_subcategorias : any[] = [];
listar_Subcategorias(){
  this.productoService.getSubCategoriasApi()
  .subscribe(
    res => {
      this.lista_subcategorias = res;
      // console.log(this.lista_subcategorias);
    },
    err => console.log('Error al obtener Categorias')
  ) 
}

//*****************************************************************************************************************************
//**************************************************** FUNCIONES EXTRAS *******************************************************
//*****************************************************************************************************************************

//************************ FILTRAR CATEGORIAS Y SUB CATEGORIAS ***********************
limpiar_Datos(){
  this.productoForm = {cod_producto:0 , nombre:'' , precio:null as number|null , ps_precio:null as number|null, producto_unico:1 , estado:0 , cocina:false, cod_categoria:null as number|null , cod_subcategoria:null as number|null};
  this.categoria_Seleccionada={cod_categoria: null , nombre:''};
  this.subcategoria_Seleccionada={cod_subcategoria:null, nombre: ''};

  this.insumo_Seleccionado=null;
  this.insumos_productos_Form=[]; 
  this.insumo_producto_Seleccionado={cod_insumo:0, nombre:'',nom_medida:'', cod_producto:0, cantidad:null as number | null, repetido:0};

  this.complemento_Seleccionado = null;
  this.complemento_productos_form = [];
  this.complemento_producto_seleccionado = {cod_complemento:0, nombre:'', descripcion:'', listaopciones:'', cod_producto:0};
}


//*************** OBTENER ULTIMO COD-PRODUCTO ***********************
obtener_CodProducto(): number{
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
  this.subcategoria_Seleccionada = { cod_subcategoria: null, nombre: '' };
}

sub_categorias_filtradas: any[] = [];
filtrarSubcategorias() {
  if (this.categoria_Seleccionada) {
    this.sub_categorias_filtradas = this.lista_subcategorias.filter(subcat => subcat.cod_categoria === this.categoria_Seleccionada.cod_categoria); 
  }
}




//********************* VERIFICAR SI EL FORMULARIO FORM-OPCION ES VALIDO  *********************
isFormValid(): boolean {
  //VERIFICAR CANTIDAN CORRECTA DEL INSUMO
  var insumo_opcion=true;
  if (this.lista_Insumos_Productos.length >0) {
    this.insumos_productos_Form.forEach(insumo => {
      if (insumo.cantidad <=0) {
        insumo_opcion=false;
      }
    });
  }
  console.log('existe insumo: ', insumo_opcion);
  //VERIDICAR CATEGORIA SELECCIONADA O SUBCATEGORIA
  var categoria = true;
  if (!this.categoria_Seleccionada && this.subcategoria_Seleccionada && this.subcategoria_Seleccionada.cod_subcategoria != 0) {
    categoria = false;
  }
  console.log('categoria : : ', categoria);
  console.log('Subcategoria :: ', this.subcategoria_Seleccionada);
  
  return this.productoForm.nombre.trim().length > 0 &&  insumo_opcion && categoria;
}
//********************* RESETEAR FORMULARIO AL CERRAR EL MODAL *********************
resetForm() {
  console.log("FORMULARIO INSUMO::",this.formInsumo);
  console.log("FORMULARIO COMPLEMENTO::",this.formComplemento);
  this.formProducto.resetForm();
  if (this.formInsumo != undefined) {
    this.formInsumo.resetForm(); 
  }
  if (this.formComplemento != undefined) {
    this.formComplemento.resetForm(); 
  }
  this.mostrarAdvertencias = false;
  this.mostrarAdvertenciasInsumo = false;
  this.mostrarAdvertenciasComplemento = false;
  this.limpiar_Datos();
}
//********************* RESETEAR FORMULARIO AL MODIFICAR O AGREGAR UNA OPCION *********************
restearFormularios(){
  this.formProducto.resetForm();
  this.mostrarAdvertencias = false;
}

//********************* VERIFICAR SI EL FORM-INSUMO SELECCIONADO ES VALIDO *********************
isFormIsumoValid():boolean{
  return this.insumo_Seleccionado != null && this.insumo_producto_Seleccionado.cantidad != null && this.insumo_producto_Seleccionado.cantidad > 0;
}

//********************* VERIFICAR SI EL INSUMO SELECCIONADO YA ESTA AGREGADO *********************
existeInsumoSeleccionado(): boolean {
  if (this.insumo_Seleccionado) {
    this.insumo_producto_Seleccionado.cod_insumo=this.insumo_Seleccionado.cod_insumo; 
  }
  return this.insumos_productos_Form.some((ins: { cod_insumo: any; }) => ins.cod_insumo === this.insumo_producto_Seleccionado.cod_insumo);
}

//********************* VERIFICAR SI EL FORM-INSUMO SELECCIONADO ES VALIDO *********************
isFormComplementoValid():boolean{
  return this.complemento_Seleccionado != null && this.complemento_producto_seleccionado.cod_complemento != null;
}

//********************* VERIFICAR SI EL INSUMO SELECCIONADO YA ESTA AGREGADO *********************
existeComplementoSeleccionado(): boolean {
  if (this.complemento_Seleccionado) {
    this.complemento_producto_seleccionado.cod_complemento=this.complemento_Seleccionado.cod_complemento; 
  }
  return this.complemento_productos_form.some((cp: { cod_complemento: any; }) => cp.cod_complemento === this.complemento_producto_seleccionado.cod_complemento);
}





//************************************************* SELECCIONAR LISTA *************************************************
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

seleccionarOpcion(opcion: number) {
  this.opcionSeleccionada = opcion;
  this.filtrarLista();
}

//************************************************* SELECCIONAR INSUMO - COMPLEMENTO *************************************************
opcion_insumo_complemento : number = 1
cambiarVista_InsumoComplemento(opcion:number){
  this.opcion_insumo_complemento = opcion;
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
