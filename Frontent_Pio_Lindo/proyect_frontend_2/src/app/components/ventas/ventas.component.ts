import { Component, ElementRef, Renderer2, ViewChild } from '@angular/core';
import { NumToWordsPipe } from '../../pipes/num-to-words.pipe';

import { VentaService } from "../../services/ventas.service";
import { CajaService } from "../../services/caja.service";
import { ProductosService } from "../../services/productos.service";
import { ClientesService } from "../../services/clientes.service";

import { SocketService } from '../../services/socket.service';
import { SharedservicesService } from 'src/app/services/sharedservices.service';

import { jsPDF } from 'jspdf';
import html2pdf from 'html2pdf.js';
import * as bootstrap from 'bootstrap';
// import { Memoize } from 'ngx-memoize';

// This lets me use jquery
declare var $: any
@Component({
  selector: 'app-ventas',
  templateUrl: './ventas.component.html',
  styleUrls: ['./ventas.component.css']
})
export class VentasComponent {
  @ViewChild('formVenta') formVenta: any;
  @ViewChild('formListaProductos') formListaProductos: any;
  @ViewChild('formCliente') formCliente: any;
  private numToWordsPipe = new NumToWordsPipe();
  // @ViewChild('formSubcategoriaMod') formSubcategoriaMod: any;
  constructor(
    private ventaService:VentaService,
    private productoService:ProductosService,
    private cajaService:CajaService,
    private clienteService: ClientesService,
    private renderer: Renderer2,

  ){
    this.listar_Last_Caja();
  }

  ngOnInit() {
    this.setItemsPerPage();
  
    window.addEventListener('resize', () => this.setItemsPerPage());
  }

//*************************************************** PANTALLA PARA MOVIL ******************************************
//******************************************************************************************************************

//SELECT PARA LISTAR NUEVAS, ENPROCESO Y FINALIZADAS
onChangeVista(event: any) {
  const valor = Number(event.target.value);

  switch (valor) {
    case 1:
      this.LISTAR_VENTAS_NUEVAS();
      break;
    case 2:
      this.LISTAR_VENTAS_EN_PROCESO();
      break;
    case 3:
      this.LISTAR_VENTAS_FINALIZADAS();
      break;
  }
}

// filterPost:any;
page_v:any
// page_p:any
itemsPerPage = 6; // valor por defecto (desktop)
mostrar_movil=false;
setItemsPerPage() {
    const width = window.innerWidth;
    // PARA LISTAR VENTA CARDS
    if (width < 600) {
      // móvil
      this.itemsPerPage = 2;
    } else if (width < 800) {
      // tablet
      this.itemsPerPage = 4;
    } else {
      // desktop
      this.itemsPerPage = 6;
    }
    // PARA MOSTRAR INTERFAZ VENTA EN MOVIL
    if (width<600) {
      this.mostrar_movil=true;
    }else{
      this.mostrar_movil=false;
    }
}

pantalla_movil=false;
cambiarPantallaMovil(){
  this.pantalla_movil= !this.pantalla_movil;
}


pantalla_principal=1;
cambiar_Pantalla(){
  if (this.pantalla_principal == 1) { 
    if (this.last_caja.estado == 1) {
      this.mostrarToast('Debe aperturar una caja','rojo')
      return;
    }
    this.lista_Ventas=[];
    this.pantalla_principal = 2; //PANTALLA AGREGAR VENTA
    // this.cargarDatos_Para_AgregarVenta();
  }else{
    this.pantalla_principal= 1; //PANTALLA LISTA VENTAS
    this.LISTAR_VENTAS_NUEVAS();
    this.limpiarDatosCargados_AgregarVenta();
  }
}

Limpiar_Datos_Venta(){
  this.limpiarDatosCargados_AgregarVenta();
}


//******************************************************************************************************************************************************* 
//**********************************************************************  MODALES  **********************************************************************
//*******************************************************************************************************************************************************
index_producto: number = 0;
tipo_detalleproducto: number = 0;
showModalDetalle_Producto(index:any, tipo:any):void{
  this.tipo_detalleproducto = tipo;
  this.index_producto=index;
  $("#modalDetalleProducto").modal('show');
}
bs_total:any; ps_total:any
showModal_Pagar():void{
  if (this.lista_Productos_Agregados.length == 0) {
    this.mostrarToast('No existen productos agregados','rojo');
    return;
  }
  console.log('********************************* SHOW MODAL PAGAR *********************************');
  
  const bsPagado = this.ventaForm.bs_pagado ?? 0;   const psPagado = this.ventaForm.ps_pagado ?? 0;   const bsBancaPagado = this.ventaForm.bs_banca_pagado ?? 0;
  const bsCambio = this.ventaForm.bs_cambio ?? 0;   const psCambio = this.ventaForm.ps_cambio ?? 0;
  const bsDescuento = this.ventaForm.bs_descuento ?? 0;  const psDescuento = this.ventaForm.ps_descuento ?? 0;
  
  const totalPagadoEnBs = (bsPagado + bsBancaPagado - bsCambio) + this.convertirDivisa(psPagado,'a-bs')  -  this.convertirDivisa(psCambio,'a-bs');
  console.log('1.- totalPagadoEnBs:',totalPagadoEnBs,' = (bsPagado + bsBancaPagado - bsCambio):',(bsPagado + bsBancaPagado - bsCambio), ' + psPagado:',this.convertirDivisa(psPagado,'a-bs'), ' - psCambio;',this.convertirDivisa(psCambio,'a-bs'));
  
  console.log('-------------------------------------------------------------------------');
  this.bs_total = this.ventaForm.bs_total - bsDescuento - this.convertirDivisa(psDescuento,'a-bs'); 
  console.log('2.- this.bs_total:',this.bs_total, ' = this.ventaForm.bs_total:',this.ventaForm.bs_total , ' - bsDescuento:',bsDescuento, ' - psDescuento:',this.convertirDivisa(psDescuento,'a-bs'));
  this.ps_total = this.ventaForm.ps_total - psDescuento - this.convertirDivisa(bsDescuento,'a-ps'); 
  console.log('2.- this.ps_total:',this.ps_total, ' = this.ventaForm.ps_total:',this.ventaForm.ps_total , ' - psDescuento:',psDescuento, ' - bsDescuento:',this.convertirDivisa(bsDescuento,'a-ps'));
  console.log('-------------------------------------------------------------------------');

  this.ventaForm.bs_falta = this.bs_total - totalPagadoEnBs; 
  console.log('this.ventaForm.bs_falta:',this.ventaForm.bs_falta , 'this.bs_total - this.ventaForm.bs_falta:', this.bs_total - totalPagadoEnBs);

  // this.ventaForm.ps_falta = Math.ceil((this.bs_total - totalPagadoEnBs) / this.tipo_de_cambio / 50) * 50; 
  this.ventaForm.ps_falta = this.convertirDivisa((this.bs_total - totalPagadoEnBs), 'bs-arg'); 
  console.log('this.ventaForm.ps_falta:',this.ventaForm.ps_falta , 'this.ps_total - this.ventaForm.ps_falta:', this.convertirDivisa((this.bs_total - totalPagadoEnBs), 'bs-arg')); 

  $("#modalPagar").modal('show');
}

convertirDivisa(cantidad:any,divisa:any ):number{
  // Normalizar cantidad a número
  const cant = Number(cantidad ?? 0);
  if (isNaN(cant)) return 0;

  // Normalizar valores del formulario
  const bsTotal = Number(this.ventaForm.bs_total ?? 0);
  const psTotal = Number(this.ventaForm.ps_total ?? 0);

  // Convertir de bolivianos a pesos argentinos
  if (divisa == 'bs-arg' || divisa == 'a-ps') {
    if (bsTotal === 0) return 0;
    return psTotal * (cant / bsTotal);
  }
  // Convertir de pesos argentinos a bolivianos
  else if (divisa == 'arg-bs' || divisa == 'a-bs') {
    if (psTotal === 0) return 0;
    return bsTotal * (cant / psTotal);
  }
  
  return 0;
}

showModal_SelectFecha(){
  this.select_Fecha = this.getTodayDate();
  this.today = this.getTodayDate();
  this.min_totay = this.transformar_Fecha_AlReves(this.last_caja.fecha_i);
  console.log('last fecha 2: ',this.last_caja.fecha_i);
  console.log('last fecha: ',this.min_totay);
  
  $("#modalSelectFecha").modal('show');
}
showModal_Eliminar(venta:any){
  this.ventaForm = venta;
  console.log('this.ventaForm: ',this.ventaForm); 
  $("#modalEliminarVenta").modal('show');
}
descuento=0; total=0;total_letra=''; credido_fiscal=0; centavos='';
showModal_EmitirFactura(venta:any){
  // 1.- VERIFICAMOS INVALIDOS
  if (!this.verificar_Invalidos('Finalizar venta')){
    return;
  }
  if (this.ventaForm.estado_transaccion==1) {
    this.mostrarToast('Debe Finalizar Venta','rojo');
    return;
  }
  if (this.ventaForm.estado_transaccion!=2) {
    this.mostrarToast('Debe Finalizar Venta','rojo');
    return;
  }
  if (this.ventaForm.estado_documento == 1) {
    this.mostrarToast('La Factura ya fue Emitida','rojo');
    return; 
  }
  if (this.ventaForm.estado_documento == 2) {
    this.mostrarToast('La Factura ya fue Anulada','rojo');
    return; 
  }
  this.ventaForm = venta;
  this.descuento = (this.ventaForm.bs_descuento??0) + this.convertirDivisa((this.ventaForm.bs_descuento??0),'a-bs');
  this.total = this.ventaForm.bs_total - this.descuento;
  this.total_letra = this.numToWordsPipe.transform(this.total); console.log('this.total_letra: ',  this.total_letra);


  // this.credido_fiscal = this.total - (this.total * 0.13);
  this.credido_fiscal = this.total - this.descuento || 0;
  // Obtener la parte entera
  const totalEntero = Math.floor(this.total);

  // Obtener los centavos
  const centavos = Math.round((this.total - totalEntero) * 100);

  // Formatear centavos para que siempre tenga dos dígitos
  this.centavos = centavos.toString().padStart(2, '0');

  console.log('this.ventaForm: ',this.ventaForm); 
  this.listar_Clientes();
  $("#modalFacturaVenta").modal('show');
}
//******************************************************************************************************************************************************* 
//********************************************************  CATEGORIAS, SUBCAEGORIAS Y PRODUCTOS  *******************************************************
//*******************************************************************************************************************************************************

//***************************************** CARGAR DATOS PARA REGISTRAR VENTA *****************************************
// ********************************************************************************************************************
lista_categorias:any;
lista_subcategorias : any[] = [];
lista_Productos:any;
lista_Complementos:any;
lista_Opciones:any
lista_Productos_Complementos:any;
lista_Complementos_Opciones:any;
cargarDatos_Para_AgregarVenta() {
  // Cargar Productos (Filtrando por estado = 0)
  this.productoService.getProductosVentaApi().subscribe(
    res => {
      this.lista_categorias = res.categorias;
      this.lista_subcategorias = res.subcategorias;
      this.lista_Productos = res.productos;
      this.lista_Complementos = res.complementos;
      this.lista_Opciones = res.opciones;
      this.lista_Productos_Complementos = res.productos_complementos;
      this.lista_Complementos_Opciones = res.complementos_opciones;
      console.log(res);
      
    },
    err => console.log('Error al obtener Productos')
  );
}

//***********************************************  FILTRAR PRODUCTOS   **************************************************
//***********************************************************************************************************************
cod_categoria: any = 0;
cod_subcategoria: any = 0;
filterPost: string = '';
subcategoriasFiltradas: any[] = [];
productosFiltrados: any[] = [];

seleccionar_Categoria(cod_categoria: any) {
    this.cod_categoria = cod_categoria;
    this.cod_subcategoria = 0;
    this.filtrarSubcategorias();
    this.filtrarProductos();
}

seleccionar_SubCategoria(cod_subcategoria: any) {
    this.cod_subcategoria = cod_subcategoria;
    this.filtrarProductos();
}

filtrarSubcategorias() {
    this.subcategoriasFiltradas = this.lista_subcategorias.filter(subcategoria => 
        subcategoria.cod_categoria === this.cod_categoria
    );
}

filtrarProductos() {
    this.productosFiltrados = this.lista_Productos.filter((producto: { cod_categoria: any; cod_subcategoria: any; }) => 
        (producto.cod_categoria === this.cod_categoria && this.cod_subcategoria === 0) ||
        (producto.cod_subcategoria === this.cod_subcategoria && this.cod_subcategoria !== 0)
    ).filter((producto: { nombre: string; }) => 
        producto.nombre.toLowerCase().includes(this.filterPost.toLowerCase())
    );
}

//************************************* LIMPIAR DATOS CARGADOS DE AGREGAR VENTA ***************************************
// ********************************************************************************************************************
limpiarDatosCargados_AgregarVenta(){
  // this.lista_categorias=null;
  // this.lista_subcategorias=[];
  // this.lista_Complementos = 0;
  // this.lista_Opciones = 0;
  // this.lista_Productos_Complementos = 0;
  // this.lista_Complementos_Opciones = 0;

  // this.cod_categoria=0;
  // this.cod_subcategoria= 0;
  // this.filterPost = '';
  // this.subcategoriasFiltradas = [];
  // this.productosFiltrados= [];

  this.lista_Productos_Agregados=[];
  this.ventaForm={ cod_venta:null, cod_caja:null, ticket:null, mesa:null as number | null, venta_llevar:false, hora:'', descripcion:'', estado:0, ci_usuario:null, cod_cliente:null , 
    bs_total:0, bs_pagado:null as number | null ,bs_cambio:0,
    ps_total:0, ps_pagado:null as number | null ,ps_cambio:0,
    bs_banca_pagado:null as number | null, 
    bs_descuento:null as number | null, ps_descuento:null as number | null, 
    estado_documento:0, bs_falta:0, ps_falta:0, tipo_venta:0, fecha:'', estado_transaccion:0};
}




//********************************************************************************************************************************************************************************** 
//*********************************************************************************  VENTA FORMULARIO  *****************************************************************************
//**********************************************************************************************************************************************************************************

//************************************************  AGREGAR PRODUCTO   **************************************************
//***********************************************************************************************************************
lista_Productos_Agregados:any[]=[];
producto_seleccionado:any
//variable momentanea
tipo_de_cambio=0.0067;
agregar_Producto(producto: any) {
  //ANTES:: SI LA VENTA YA FUE PAGADA NOS SALIMOS
  // if (this.ventaForm.estado_transaccion==2) {
  //   return;
  // }

  //PRIMERO:: GUARDAMOS EL PRECIO DEL PRODUCTO
  this.ventaForm.bs_total = this.ventaForm.bs_total + producto.precio;
  this.ventaForm.ps_total = this.ventaForm.ps_total + producto.ps_precio;;
  //TERCERO COPIAMOS A VENTA-FALTA
  this.ventaForm.bs_falta = this.ventaForm.bs_total;
  this.ventaForm.ps_falta = this.ventaForm.ps_total;  

  //SEGUNDO:: OBTENER LOS COMPLEMENTOS DEL PRODUCTO USANDO COD_PRODUCTO DE lista_Productos_Complementos
  const complementosProducto = this.lista_Productos_Complementos
      .filter((pc: { cod_producto: any; }) => pc.cod_producto === producto.cod_producto)
      .map((pc: { cod_complemento: any; }) => {
            // Obtener complemento completo desde lista_Complementos
            const complemento = this.lista_Complementos.find((c: { cod_complemento: any; }) => c.cod_complemento === pc.cod_complemento);

            // Obtener las opciones para cada complemento usando lista_Complementos_Opciones
            const opcionesComplemento = this.lista_Complementos_Opciones
                .filter((co: { cod_complemento: any; }) => co.cod_complemento === complemento.cod_complemento)
                .map((co: { cod_opcion: any; }) => {
                    return this.lista_Opciones.find((o: { cod_opcion: any; }) => o.cod_opcion === co.cod_opcion);
                });

            // Retornar complemento con sus opciones
            return {
                cod_complemento: complemento.cod_complemento,
                nombre: complemento.nombre,
                cantidad_op_total:0,
                opciones: opcionesComplemento.map((op: { cod_opcion: any; nombre: any; }) => ({
                    cod_opcion: op.cod_opcion,
                    nombre: op.nombre,
                    cantidad_op:0
                }))
            };
      });

    //TERCERO: AGREGAR EL PRODUCTO CON SUS COMPLEMENTOS Y OPCIONES A LA LISTA
    this.lista_Productos_Agregados.push({
        cod_producto: producto.cod_producto,
        nombre: producto.nombre,
        precio: producto.precio,
        ps_precio:producto.ps_precio,
        cantidad_item: 1,
        item_llevar:false,
        complementos: complementosProducto
    });
    // console.log('producto.precio / this.tipo_de_cambio / 100: ', producto.precio / this.tipo_de_cambio / 100);
    // console.log('Math.ceil(producto.precio / this.tipo_de_cambio / 100): ', Math.ceil(producto.precio / this.tipo_de_cambio / 100));
    // console.log('Math.ceil(producto.precio / this.tipo_de_cambio / 100) * 100: ',Math.ceil(producto.precio / this.tipo_de_cambio / 100) * 100,);
    
    // Actualizar producto seleccionado (si es necesario)
    this.producto_seleccionado = producto;
    console.log('PRODUCTO SELECCIONADO AGREGADO:',this.lista_Productos_Agregados);
    console.log('Index: ',this.lista_Productos_Agregados.length-1);
    this.showModalDetalle_Producto(this.lista_Productos_Agregados.length-1, 0);
}

//************************************************  ELIMINAR PRODUCTO   **************************************************
//************************************************************************************************************************
eliminar_Producto(index:any){
  const precio = this.lista_Productos_Agregados[index].precio ?? 0;
  const ps_precio = this.lista_Productos_Agregados[index].ps_precio ?? 0;
  const cantidad = this.lista_Productos_Agregados[index].cantidad_item ?? 0;

  this.ventaForm.bs_total = this.ventaForm.bs_total - (precio * cantidad); 
  this.ventaForm.ps_total = this.ventaForm.ps_total - (ps_precio * cantidad);
  //TERCERO COPIAMOS A VENTA-FALTA
  this.ventaForm.bs_falta = this.ventaForm.bs_total; 
  this.ventaForm.ps_falta = this.ventaForm.ps_total
  
  this.lista_Productos_Agregados.splice(index, 1);
}
//*****************************************  AUMENTAR CANTIDAD PRODUCTO   ***********************************************
//***********************************************************************************************************************
aumentar_cantidad(){
  let producto = this.lista_Productos_Agregados[this.index_producto];
  //PRIMERO:: AUMENTAMOS LA CANTIDAD
  producto.cantidad_item++;
  //SEGUNDO:: AUMENTAMOS EL PRECIO TOTAL
  this.ventaForm.bs_total = this.ventaForm.bs_total + producto.precio;
  this.ventaForm.ps_total = this.ventaForm.ps_total + producto.ps_precio;
  //TERCERO COPIAMOS A VENTA-FALTA
  this.ventaForm.bs_falta = this.ventaForm.bs_total; 
  this.ventaForm.ps_falta = this.ventaForm.ps_total;
}
disminuir_cantidad(){
  let producto = this.lista_Productos_Agregados[this.index_producto];
  if (producto.cantidad_item==1) {
    return;
  }
  producto.cantidad_item--;
  this.ventaForm.bs_total = this.ventaForm.bs_total - producto.precio;
  this.ventaForm.ps_total = this.ventaForm.ps_total - producto.ps_precio;
  //TERCERO COPIAMOS A VENTA-FALTA
  this.ventaForm.bs_falta = this.ventaForm.bs_total; 
  this.ventaForm.ps_falta = this.ventaForm.ps_total;
}
//*******************************************  AUMENTAR CANTIDAD OPCION   ***********************************************
//***********************************************************************************************************************
aumentar_cantidad_opcion(i: any, j: any) {
  const producto = this.lista_Productos_Agregados[this.index_producto];
  const complemento = producto.complementos[i];
  const opcion = complemento.opciones[j];

  // Calcula la suma actual de las cantidades de las opciones en el complemento
  const totalCantidadOpciones = complemento.opciones.reduce((sum: any, opt: { cantidad_op: any; }) => sum + opt.cantidad_op, 0);

  // Verifica si al incrementar se excedería la cantidad del producto principal
  if (totalCantidadOpciones < producto.cantidad_item) {
    opcion.cantidad_op++;
    complemento.cantidad_op_total = totalCantidadOpciones+1;
  } else {
    // Si se alcanza el límite, no se incrementa la cantidad
    console.log(`La suma de las cantidades de las opciones en ${complemento.nombre} no puede superar ${producto.cantidad_item}`);
  }
  console.log('Cantidad Total: ', complemento.cantidad_op_total,' De Complemento: ', complemento.nombre);
  
}

disminuir_cantidad_opcion(i:any, j:any){
  const producto = this.lista_Productos_Agregados[this.index_producto];
  const complemento = producto.complementos[i];
  const opcion = complemento.opciones[j];

  if (opcion.cantidad_op==0) {
    return;
  }
  opcion.cantidad_op--;
  complemento.cantidad_op_total--;
  console.log('Cantidad Total: ', complemento.cantidad_op_total,' De Complemento: ', complemento.nombre);
}
//****************************************  VERIFICAR CANTIDADES CORRECTAS   ********************************************
//***********************************************************************************************************************
verificar_cantidades() {
  const producto = this.lista_Productos_Agregados[this.index_producto];

  // Verificar los complementos y sus opciones
  if (producto) {
    const complementoInvalido = producto.complementos.some((complemento: { opciones: any[]; }) => {
      const sumaOpciones = complemento.opciones.reduce((total, opcion) => total + opcion.cantidad_op, 0);
      return sumaOpciones > producto.cantidad_item;
    });
  
    // Si hay al menos un complemento inválido, eliminar el producto
    if (complementoInvalido) {
      this.eliminar_Producto(this.index_producto);
    }
    $("#modalDetalleProducto").modal('hide');
    // Opcional: puedes mostrar un mensaje si todas las cantidades son correctas
    console.log('Todas las cantidades de opciones están correctas.');
  }
 
}


//*******************************************************  MODAL PAGAR   *********************************************************
//********************************************************************************************************************************

//*************************************  CALCULAR DESCUENTO   ****************************************
calcular_descuento() {
  console.log('CALCULAR DESCUENTO::::::');
  
  let bs_descuento = this.ventaForm.bs_descuento || 0; console.log('bs_descuento: ',this.ventaForm.bs_descuento);
  
  let ps_descuento = this.ventaForm.ps_descuento || 0;  console.log('ps_descuento: ',this.ventaForm.ps_descuento);
  

  // Restaurar el valor inicial del total
  this.bs_total = this.ventaForm.bs_total;
  this.ps_total = this.ventaForm.ps_total;

  // Si se ingresa un descuento en bolivianos, ignorar el de pesos y restaurarlo
  if (bs_descuento > 0 && bs_descuento <= this.bs_total) {
    // Restablecer el descuento en pesos a 0, "por que solo se hara descuento en una divisa"
    this.ventaForm.ps_descuento = null;
    
    // Convertir el descuento en bolivianos a pesos argentinos
    ps_descuento = this.convertirDivisa(bs_descuento, 'bs-arg');
    
    // Aplicar descuentos
    this.ps_total -= ps_descuento; // Ajustar el valor equivalente en pesos
    this.bs_total -= bs_descuento; // Ajustar el valor en bolivianos
  } 

  // Si se ingresa un descuento en pesos argentinos, ignorar el de bolivianos y restaurarlo
  else if (ps_descuento > 0 && ps_descuento <= this.ps_total) {
    // Restablecer el descuento en bolivianos a 0
    this.ventaForm.bs_descuento = null;
    
    // Convertir el descuento en pesos argentinos a bolivianos
    bs_descuento = this.convertirDivisa(ps_descuento, 'arg-bs');
    console.log('bs_descuento: ',bs_descuento);
    
    // Aplicar descuentos
    this.bs_total -= bs_descuento; // Ajustar el valor equivalente en bolivianos
    this.ps_total -= ps_descuento; // Ajustar el valor en pesos
  }
  this.ventaForm.bs_falta=this.bs_total;
  this.ventaForm.ps_falta= this.ps_total;
  
  this.limpiar_Datos_Pagar()
}
//**************************************  LIMPIAR DATOS   ********************************************
limpiar_Datos_Pagar(){
  this.ventaForm.bs_pagado = null as number | null; this.ventaForm.ps_pagado = null as number | null; this.ventaForm.bs_banca_pagado = null as number | null;
  this.ventaForm.bs_cambio = 0; this.ventaForm.ps_cambio = 0;
  // this.ventaForm.bs_descuento = null; this.ventaForm.ps_descuento = null
}
//*************************************  SELECCIONAR DIVISA   ****************************************
divisa_seleccionada=1;
seleccionar_divisa(opcion:any){
  this.divisa_seleccionada = opcion;
}
//***************************************  ATAJOS BUTTON  ********************************************
actualizarValor(tipo: string, valor: number) {
  if (this.divisa_seleccionada == 3 && valor > this.ventaForm.bs_falta) {
    return;
  }
  if (this.divisa_seleccionada === 1) { // Bolivianos
      const montoActual = this.ventaForm.bs_pagado ?? 0;
      this.ventaForm.bs_pagado = Math.max(montoActual + valor, 0);
      this.actualizarFaltantesBolivianos();
  } else if (this.divisa_seleccionada === 2) { // Pesos Argentinos
      const montoActual = this.ventaForm.ps_pagado ?? 0;
      this.ventaForm.ps_pagado = Math.max(montoActual + valor, 0);
      this.actualizarFaltantesArgentinos();
  } else if (this.divisa_seleccionada === 3) { // Banca (QR)
    if (tipo === 'monto') {
      const montoActual = this.ventaForm.bs_banca_pagado ?? 0;
      this.ventaForm.bs_banca_pagado = Math.max(montoActual + valor, 0);
      this.actualizarFaltantesBolivianos();
    }
  }
}


//**************************************** 1.- ACTUALIZAR MONTOS  ********************************************
// Actualiza los montos según la divisa seleccionada
actualizarMontos(divisa: 'bs' | 'ps' | 'banca') {
  if (divisa === 'bs' || divisa === 'banca') {
    this.actualizarFaltantesBolivianos();
  } else if (divisa === 'ps') {
    this.actualizarFaltantesArgentinos();
  }
}
//**************************** 1.1.- ACTUALIZAR FALTANTES BOLIVIANOS ****************************
actualizarFaltantesBolivianos(){
  console.log('*************************************************************************');
  console.log('ENTRAMOS A LA FUNCION actualizarFaltantesBolivianos()');
  console.log("*********************************************************************************");
  // OBTENER LOS VALORES DEL FORMULARIO CON VALORES PREDETERMINADOS SI SON NULL O UNDEFINED
  const bsPagado = this.ventaForm.bs_pagado ?? 0;
  const bsBancaPagado = this.ventaForm.bs_banca_pagado ?? 0;
  const psPagado = this.convertirDivisa((this.ventaForm.ps_pagado ?? 0),'arg-bs');
  const bsTotal = this.bs_total ?? 0;
  const psTotal = this.convertirDivisa((this.ps_total ?? 0), 'arg-bs');
  const bsCambio = this.ventaForm.bs_cambio ?? 0;   
  const psCambio = this.convertirDivisa((this.ventaForm.ps_cambio ?? 0),'arg-bs');

  console.log('bs_pagado:', bsPagado);
  console.log('bs_banca_pagado:', bsBancaPagado);
  console.log('ps_pagado:', psPagado);
  console.log('bs_total:', bsTotal);
  console.log('ps_total:', psTotal);

  console.log("*********************************************************************************");


  let aux_bs_falta = psTotal - psPagado;
  //SI NO SE HA PAGADO NADA EN PS ENTONCES FALTA SERA NORMAL Y NO HABRA REDONDEOS NI COVERCIONES
  if (psPagado == 0) {
    aux_bs_falta = bsTotal;
  }

  console.log('**************** IF ( psPagado:', bsPagado, ' >= aux_bs_falta:', aux_bs_falta ,'***********************');
  if (bsPagado  >= aux_bs_falta && aux_bs_falta>0) {
    this.ventaForm.bs_cambio = (bsPagado + bsBancaPagado) - aux_bs_falta;
    console.log('  this.ventaForm.bs_cambio:',  this.ventaForm.bs_cambio , ' = (bsPagado + bsBancaPagado):',(bsPagado + bsBancaPagado), ' - aux_bs_falta:',aux_bs_falta);
  }else{
    this.ventaForm.bs_cambio = 0;
    aux_bs_falta = 0;
  }
  console.log('****************** FIN IF ELSE ***********************');

  // VALIDAR SI EL VALOR DE BANCA ES MAYOR AL TOTAL
  if (bsBancaPagado > bsTotal) {
    return;
  }

  console.log('::::::::::::::::::::::::::::: CONVERTIR PAGOS EN PESOS A BOLIVIANOS :::::::::::::::::::::::::::::');
  
  const psPagadoEnBs = psPagado - psCambio;
  console.log('0.- ps_pagado_en_bs:', psPagadoEnBs, ' = ps_pagado:', psPagado, ' - psCambio:', psCambio);

  // CALCULAR EL TOTAL PAGADO EN BOLIVIANOS + PESOS-PAGADOS(EN BOLIVIANO) 
  const totalPagadoEnBs = bsPagado + bsBancaPagado + psPagadoEnBs;
  console.log('1.- totalPagadoEnBs:', totalPagadoEnBs, ' = bs_pagado:', bsPagado, ' + bs_banca_pagado:', bsBancaPagado, ' + ps_pagado_en_bs:', psPagadoEnBs);

  // CALCULAR LA FALTA EN BOLIVIANOS
  const totalFaltaEnBs = bsTotal - totalPagadoEnBs;
  console.log('2.- totalFaltaEnBs:', totalFaltaEnBs, ' = bs_total:', bsTotal, ' - totalPagadoEnBs:', totalPagadoEnBs);

  console.log('*********************** IF ( totalPagadoEnBs:', totalPagadoEnBs, ' >= bs_total:', bsTotal , '***********************');
  if (totalPagadoEnBs >= bsTotal) {
    // SI EL TOTAL PAGADO ES MAYOR O IGUAL AL TOTAL A PAGAR
    this.ventaForm.bs_falta = 0; // NO FALTA NADA EN BOLIVIANOS 
    //this.ventaForm.bs_cambio = totalPagadoEnBs - bsTotal; // CALCULAR EL CAMBIO EN BOLIVIANOS
    console.log('3.- this.ventaForm.bs_cambio:', this.ventaForm.bs_cambio, ' = totalPagadoEnBs:', totalPagadoEnBs, ' - bs_total:', bsTotal);
  } else {
    // SI EL TOTAL PAGADO ES MENOR QUE EL TOTAL A PAGAR
    this.ventaForm.bs_falta = totalFaltaEnBs; // LA FALTA ES LA DIFERENCIA
    console.log('4.- totalFaltaEnBs:', totalFaltaEnBs);
    this.ventaForm.bs_cambio = 0; // NO HAY CAMBIO SI HAY FALTA
  }
  console.log('********** FIN DEL IF ELSE ***********************');

  //CONVERTIR DE BOLVIANOS-FALTA A PESOS-FALTA
  this.ventaForm.ps_falta = this.convertirDivisa(this.ventaForm.bs_falta, 'bs-arg');
  console.log('5.- this.ventaForm.ps_falta:', this.ventaForm.ps_falta, ' = this.ventaForm.bs_falta:', this.ventaForm.bs_falta);

  // SI EL REDONDEO SALE MAYOR A BS_TOTAL ENTONCES MODIFICAMOS
  if (this.ventaForm.bs_falta > this.bs_total) {
    this.ventaForm.bs_falta = this.bs_total;
    console.log('14.- this.ventaForm.bs_falta:', this.ventaForm.bs_falta, ' = this.bs_total:', this.bs_total);
  }
  console.log('*************************************************************************');
  console.log('FIN DE LA FUNCION actualizarFaltantesBolivianos()');
  console.log('*************************************************************************');
}

//**************************** 1.2.- ACTUALIZAR FALTANTES ARGENTINOS ****************************
actualizarFaltantesArgentinos(){
  console.log('*************************************************************************');
  console.log('ENTRAMOS A LA FUNCION actualizarFaltantesArgentinos()');
  console.log("*********************************************************************************");
  // OBTENER LOS VALORES DEL FORMULARIO CON VALORES PREDETERMINADOS SI SON NULL O UNDEFINED
  const bsPagado = this.convertirDivisa((this.ventaForm.bs_pagado ?? 0), 'bs-arg');
  const bsBancaPagado = this.convertirDivisa((this.ventaForm.bs_banca_pagado ?? 0),'bs-arg');
  const psPagado = this.ventaForm.ps_pagado ?? 0;
  const bsTotal = this.convertirDivisa((this.bs_total ?? 0), 'bs-arg');
  const psTotal = this.ps_total ?? 0;
  const bsCambio = this.convertirDivisa((this.ventaForm.bs_cambio ?? 0), 'bs-arg');   const psCambio = this.ventaForm.ps_cambio ?? 0;
  const tipoDeCambio = this.tipo_de_cambio ?? 0.0067;

  console.log('bs_pagado:', bsPagado);
  console.log('bs_banca_pagado:', bsBancaPagado);
  console.log('ps_pagado:', psPagado);
  console.log('bs_total:', bsTotal);
  console.log('ps_total:', psTotal);
  console.log('tipo_de_cambio:', tipoDeCambio);
  console.log("*********************************************************************************");

  // let aux_ps_falta = Math.ceil((bsTotal - (bsPagado+bsBancaPagado)) / tipoDeCambio / 50) * 50;
  let aux_ps_falta = bsTotal - (bsPagado + bsBancaPagado);

  if ((bsPagado + bsBancaPagado) == 0) {
    aux_ps_falta = psTotal;
  }

  const aux_ps_cambio = psPagado - aux_ps_falta; 
  console.log('aux_ps_cambio: ', aux_ps_cambio);


    //CALCULAR CAMBIOS
    console.log('********** IF ( psPagado:', psPagado, ' >= aux_ps_falta:', aux_ps_falta);
    if (psPagado >= aux_ps_falta && aux_ps_falta>0) {
      this.ventaForm.ps_cambio = psPagado - aux_ps_falta;
      console.log('  this.ventaForm.ps_cambio:',  this.ventaForm.ps_cambio , ' = psPagado:',psPagado, ' - aux_ps_falta:',aux_ps_falta);
    }else{
      this.ventaForm.ps_cambio = 0;
    }
  
  console.log(':::::::::::::::::::::: CONVERTIR LA FALTA EN BOLIVIANOS A PESOS ARGENTINOS ::::::::::::::::::::::::');
  //:::::::::::::::::::::: CONVERTIR LA FALTA EN BOLIVIANOS A PESOS ARGENTINOS ::::::::::::::::::::::::
  // this.ventaForm.ps_falta = Math.ceil(this.ventaForm.bs_falta / tipoDeCambio / 50) * 50;
  this.ventaForm.ps_falta = this.convertirDivisa(this.ventaForm.bs_falta, 'bs-arg');

  console.log('5.- this.ventaForm.ps_falta:', this.ventaForm.ps_falta, ' = this.ventaForm.bs_falta:', this.ventaForm.bs_falta);

  // CALCULAR EL TOTAL PAGADO EN PESOS ARGENTINOS
  const totalPagadoEnPs = psPagado + bsPagado + bsBancaPagado - bsCambio;
  console.log('6.- totalPagadoEnPs:', totalPagadoEnPs, ' = ps_pagado:', psPagado, ' + bs_pagado:', bsPagado, ' + bs_banca_pagado', bsBancaPagado , ' - bsCambio: ',bsCambio);

  // CALCULAR LA FALTA EN PESOS ARGENTINOS
  const totalFaltaEnPs = psTotal - totalPagadoEnPs;
  console.log('7.- totalFaltaEnPs:', totalFaltaEnPs, ' = ps_total:', psTotal, ' - totalPagadoEnPs:', totalPagadoEnPs);

  console.log('********** IF ( totalPagadoEnPs:', totalPagadoEnPs, ' >= bs_total:', psTotal);
  if (totalPagadoEnPs >= psTotal) {
    // SI EL TOTAL PAGADO ES MAYOR O IGUAL AL TOTAL A PAGAR
    this.ventaForm.ps_falta = 0; // NO FALTA NADA EN PESOS ARGENTINOS
    console.log('8.- this.ventaForm.ps_falta:', this.ventaForm.ps_falta);
    //this.ventaForm.ps_cambio = totalPagadoEnPs - psTotal; // CALCULAR EL CAMBIO EN PESOS ARGENTINOS
    console.log('9.- this.ventaForm.ps_cambio:', this.ventaForm.ps_cambio, ' = totalPagadoEnPs:', totalPagadoEnPs, ' - ps_total:', psTotal);
  } else {
    // SI EL TOTAL PAGADO ES MENOR QUE EL TOTAL A PAGAR
    console.log('10.- totalFaltaEnPs:', totalFaltaEnPs);
    this.ventaForm.ps_falta = totalFaltaEnPs; // LA FALTA ES LA DIFERENCIA
    console.log('11.- this.ventaForm.ps_falta:', this.ventaForm.ps_falta);
    this.ventaForm.ps_cambio = 0; // NO HAY CAMBIO SI HAY FALTA
  }
  console.log('********** FIN DEL IF ELSE');

  // CONVERTIR LA FALTA EN PESOS ARGENTINOS A BOLIVIANOS
  // this.ventaForm.bs_falta = Math.round((this.ventaForm.ps_falta * tipoDeCambio) * 2) / 2;
  this.ventaForm.bs_falta = this.convertirDivisa(this.ventaForm.ps_falta, 'arg-bs');
  console.log("13.- this.convertirDivisa(this.ventaForm.ps_falta, 'arg-bs'):", this.convertirDivisa(this.ventaForm.ps_falta, 'arg-bs'), ' : ', this.ventaForm.bs_falta);

  
  // SI EL REDONDEO SALE MAYOR A BS_TOTAL ENTONCES MODIFICAMOS
  if (this.ventaForm.bs_falta > this.bs_total) {
    this.ventaForm.bs_falta = this.bs_total;
    console.log('14.- this.ventaForm.bs_falta:', this.ventaForm.bs_falta, ' = this.bs_total:', this.bs_total);
  }
  console.log('*************************************************************************');
  console.log('FIN DE LA FUNCION actualizarFaltantesArgentinos()');
  console.log('*************************************************************************');
}





//***************************************************************************************************************************************************************************************
//*******************************************************************************  AGREGAR VENTA   ************************************************************************************
//*************************************************************************************************************************************************************************************
ventaForm={ cod_venta:null, cod_caja:null, ticket:null, mesa:null as number | null, venta_llevar:false, hora:'', descripcion:'', estado:0, ci_usuario:null, cod_cliente:null , 
             bs_total:0, bs_pagado:null as number | null, bs_cambio:0,
             ps_total:0, ps_pagado:null as number | null, ps_cambio:0,
             bs_banca_pagado:null as number | null, 
             bs_descuento:null as number | null, ps_descuento:null as number | null, 
             estado_documento:0, bs_falta:0, ps_falta:0, tipo_venta:0, fecha:'', estado_transaccion:0};

AGREGAR_VENTA(tipo_venta:string){
  console.log('*************** AGREGAR VENTA ****************');
  
  // 1.- VERIFICAMOS INVALIDOS
  if (!this.verificar_Invalidos(tipo_venta)){
    return;
  }

  // 2.- AGREGAMOS LA COD_CAJA A LA VENTA
  this.ventaForm.cod_caja = this.last_caja.cod_caja ?? 0;
  this.ventaForm.fecha = this.obtener_fecha();
  this.ventaForm.hora = this.obtener_hora();
  this.ventaForm.ci_usuario = this.obtener_Usuario();

  // 3.- AGREGAMOS EL TIPO DE VENTA 
  if (tipo_venta == 'Finalizar venta') {
    this.ventaForm.tipo_venta=2; //VENTA PAGADA
    this.ventaForm.estado_transaccion=2 //ESTADO SI ESTA PAGADO
  }else{
    this.ventaForm.tipo_venta=0; //VENTA SIN PAGAR
    this.ventaForm.estado_transaccion=1 //ESTADO SI NO ESTA PAGADO
  }
  console.log('******************************************************** VENTA AGREGADA ********************************************************');
  console.log('-----------------------------------------------------');
  console.log('VENTA: ',this.ventaForm);
  console.log('-----------------------------------------------------');
  console.log('Lista Productos: ',this.lista_Productos_Agregados);
  console.log('-----------------------------------------------------');

  const data = {venta:this.ventaForm, detalles:this.lista_Productos_Agregados};

  this.ventaService.post_Venta_Api(data)
  .subscribe(
    res => {
      console.log('VENTA AGREGADA');
      if ( this.ventaForm.tipo_venta == 2) {
        this.mostrarToast('Venta finalizada','verde');
      }else{
        this.mostrarToast('Venta agregada sin pagar','verde');
      }
      console.log('RES:: ',res);
      
      this.ventaForm.cod_venta = res.cod_venta;
      this.ventaForm.ticket = res.ticket
      // console.log('COD_VENTA', res);
      $("#modalPagar").modal('hide');
    },
    err =>{
      console.log('Error al agregar venta ', err);
      if ( this.ventaForm.tipo_venta == 2) {
        this.mostrarToast('Error al finalizar venta','rojo');
      }else{
        this.mostrarToast('Error al agregar venta sin pagar','rojo');
      }

    }
  ) 

}




//***************************************************************************************************************************************************************************************
//*******************************************************************************  MODIFICAR VENTA   ************************************************************************************
//***************************************************************************************************************************************************************************************
MODIFICAR_VENTA(tipo_venta:string){
  console.log('*************** MODIFICAR VENTA ****************');
  // 1.- VERIFICAMOS INVALIDOS
  if (!this.verificar_Invalidos(tipo_venta)){
    return;
  }
  // 3.- AGREGAMOS EL TIPO DE VENTA 
  if (tipo_venta == 'Finalizar venta') {
    this.ventaForm.tipo_venta=2; //VENTA PAGADA
    this.ventaForm.estado_transaccion=2 //ESTADO SI ESTA PAGADO
  }else{
    this.ventaForm.tipo_venta=0; //VENTA SIN PAGAR
    this.ventaForm.estado_transaccion=1 //ESTADO SI NO ESTA PAGADO
  }
  console.log('******************************************************** VENTA MODIFICADA ********************************************************');
  console.log('-----------------------------------------------------');
  console.log('VENTA MOD: ',this.ventaForm);
  console.log('-----------------------------------------------------');
  console.log('Lista Productos MOD: ',this.lista_Productos_Agregados);
  console.log('-----------------------------------------------------');
  const data = {venta:this.ventaForm, detalles:this.lista_Productos_Agregados};

  this.ventaService.put_Venta_Api(data)
  .subscribe(
    res => {
      console.log('VENTA MODIFICADA');
      if ( this.ventaForm.tipo_venta == 2) {
        this.mostrarToast('Venta finalizada','verde');
      }else{
        this.mostrarToast('Venta agregada sin pagar','verde');
      }
      $("#modalPagar").modal('hide');
    },
    err =>{
      console.log('Error al agregar venta ', err);
      if ( this.ventaForm.tipo_venta == 2) {
        this.mostrarToast('Error al finalizar venta','rojo');
      }else{
        this.mostrarToast('Error al agregar venta sin pagar','rojo');
      }

    }
  ) 
}

//***************************************  VERIFICAR INVALIDOS  ********************************************
verificar_Invalidos(tipo_venta:string):boolean{
  console.log('VERIFICAMOS DATOS');
  console.log('Tipo Venta: ',tipo_venta);
  console.log(this.ventaForm);
  const total_pagado = (this.ventaForm.bs_pagado??0) + (this.ventaForm.bs_banca_pagado??0) + this.convertirDivisa(this.ventaForm.ps_pagado,'a-bs');
  console.log('total_pagado: ',total_pagado);
  
  //SI LA VENTA NO TIENE PRODUCTOS SELECCIONADOS RETURN
  if (this.lista_Productos_Agregados.length==0) {
    this.mostrarToast('No existen productos agregados','rojo');
    return false;
  }
 
  //SI LA VENTA ES PAGADA Y NO SE INGRESO MONTOS RETURN;
  if (tipo_venta == 'Finalizar venta' && this.ventaForm.bs_falta == 0 && total_pagado == 0) {
    this.mostrarToast('No se realizó ningún pago','rojo');
    return false;
  }
  //SI LA VENTA ES PAGADA Y NO SE INGRESO TODO EL MONTO RETURN;
  if (tipo_venta == 'Finalizar venta' && this.ventaForm.bs_falta > 0 && total_pagado >= 0) {
  this.mostrarToast('Pago incompleto', 'rojo');
  return false;
}

  console.log('RETORNAMOS TRUE NOMAS');
  
  return true;
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
  this.page_v=1;
  this.lista_Ventas = [];
  this.vista_ventas =1;
  const fecha = this.transformar_Fecha(this.select_Fecha);
  this.ventaService.get_Ventas_Nuevas_Api(this.last_caja.cod_caja, fecha)
  .subscribe(
    res => {
      this.lista_Ventas = res;
      console.log('VENTAS NUEVAS: ', this.lista_Ventas);
    },
    err =>{
      console.log('Error al agregar Productos: ', err);
    }
  ) 
}
LISTAR_VENTAS_EN_PROCESO(){
  this.page_v=1;
  this.lista_Ventas = [];
  this.vista_ventas =2;
  const fecha = this.transformar_Fecha(this.select_Fecha);
  this.ventaService.get_Ventas_en_Proceso_Api(this.last_caja.cod_caja, fecha)
  .subscribe(
    res => {
      this.lista_Ventas = res;
      console.log('VENTAS EN PROCESO: ', this.lista_Ventas);
      console.log('Ultima Caja',res);
    },
    err =>{
      console.log('Error al agregar Productos: ', err);
    }
  ) 
}
LISTAR_VENTAS_FINALIZADAS(){
  this.page_v=1;
  this.lista_Ventas = [];
  this.vista_ventas =3;
  const fecha = this.transformar_Fecha(this.select_Fecha);
  this.ventaService.get_Ventas_Finzalidas_Api(this.last_caja.cod_caja, fecha, 10)
  .subscribe(
    res => {
      this.lista_Ventas = res;
      console.log('VENTAS FINALIZADAS: ', this.lista_Ventas);
      console.log('Ultima Caja',res);
    },
    err =>{
      console.log('Error al agregar Productos: ', err);
    }
  ) 
}



//********************************************************************************************************************************************************************************** 
//*********************************************************************************  VER VENTA  *****************************************************************************
//**********************************************************************************************************************************************************************************
VISUALIZAR_VENTA(venta:any){
  console.log('this.lista_Productos: ',this.lista_Productos);
  
  console.log('Visualizar Venta:', venta);

  // Reinicia la lista de productos agregados antes de agregar la nueva venta
  this.lista_Productos_Agregados = [];


for (const detalle of venta.detalle_venta) {
  // Buscar el producto correspondiente para obtener su precio
  const producto = this.lista_Productos.find((p: any) => p.cod_producto === detalle.cod_producto);

  // Crear objeto del producto
  const productoAgregado = {
    cod_producto: producto ? producto.cod_producto : detalle.cod_producto,
    cantidad_item: detalle.cantidad_item,
    nombre: producto ? producto.nombre : 'Desconocido',
    precio: producto ? producto.precio : 0,
    ps_precio: producto ? producto.ps_precio : 0,
    item_llevar: detalle.item_llevar,
    complementos: []
  };

  // Procesar complementos existentes desde detalle_opcion
  const complementosExistentes = detalle.detalle_opcion.map((grupo: any[]) => {
    const cod_complemento = grupo[0]?.cod_complemento; // Todos en el grupo tienen el mismo complemento
    const complemento = this.lista_Complementos.find((c: any) => c.cod_complemento === cod_complemento);

    // Obtener todas las opciones relacionadas con este complemento
    const opcionesRelacionadas = this.lista_Complementos_Opciones
      .filter((co: any) => co.cod_complemento === cod_complemento)
      .map((co: any) => {
        const opcionCorrespondiente = this.lista_Opciones.find((o: any) => o.cod_opcion === co.cod_opcion);

        // Verificar si esta opción ya está en los detalles de venta
        const opcionSeleccionada = grupo.find((op: any) => op.cod_opcion === co.cod_opcion);

        return {
          cod_opcion: opcionCorrespondiente ? opcionCorrespondiente.cod_opcion : co.cod_opcion,
          cantidad_op: opcionSeleccionada ? opcionSeleccionada.cantidad_op : 0, // Respetar cantidad si existe, de lo contrario 0
          nombre: opcionCorrespondiente ? opcionCorrespondiente.nombre : 'Desconocido'
        };
      });

    return {
      nombre: complemento ? complemento.nombre : 'Desconocido',
      opciones: opcionesRelacionadas
    };
  });

  // Procesar complementos faltantes basados en las relaciones
  const complementosRelacionados = this.lista_Complementos.filter((complemento: any) =>
    this.lista_Productos_Complementos.some(
      (pc: any) => pc.cod_producto === detalle.cod_producto && pc.cod_complemento === complemento.cod_complemento
    )
  );

  for (const complemento of complementosRelacionados) {
    // Verificar si este complemento ya está en complementosExistentes
    const complementoExistente = complementosExistentes.find((c: any) => c.nombre === complemento.nombre);

    if (!complementoExistente) {
      // Opciones relacionadas con este complemento
      const opcionesRelacionadas = this.lista_Complementos_Opciones
        .filter((co: any) => co.cod_complemento === complemento.cod_complemento)
        .map((co: any) => {
          const opcionCorrespondiente = this.lista_Opciones.find((o: any) => o.cod_opcion === co.cod_opcion);

          return {
            cod_opcion: opcionCorrespondiente ? opcionCorrespondiente.cod_opcion : co.cod_opcion,
            cantidad_op: 0, // Si no existe en `detalle_opcion`, la cantidad es 0
            nombre: opcionCorrespondiente ? opcionCorrespondiente.nombre : 'Desconocido'
          };
        });

      complementosExistentes.push({
        nombre: complemento.nombre,
        opciones: opcionesRelacionadas
      });
    }
  }

  // Asignar todos los complementos procesados al producto
  productoAgregado.complementos = complementosExistentes;

  // Agregar el producto a la lista
  this.lista_Productos_Agregados.push(productoAgregado);
  console.log('Producto Agregado:', productoAgregado);
}





  // Supongamos que `venta` es el objeto que tienes con los datos de la venta
  this.ventaForm = {
    mesa: venta.venta.mesa,
    descripcion: venta.venta.descripcion,
    venta_llevar: venta.venta.venta_llevar,
    cod_venta: venta.venta.cod_venta,
    cod_caja: venta.venta.cod_caja,
    ticket: venta.venta.ticket,
    estado: venta.venta.estado,
    ci_usuario: venta.venta.ci_usuario,
    cod_cliente: venta.venta.cod_cliente,
    bs_total: venta.venta.bs_total,
    bs_pagado: venta.venta.bs_pagado,
    bs_cambio: venta.venta.bs_cambio,
    ps_total: venta.venta.ps_total,
    ps_pagado: venta.venta.ps_pagado,
    ps_cambio: venta.venta.ps_cambio,
    bs_banca_pagado: venta.venta.bs_banca_pagado,
    bs_descuento: venta.venta.bs_descuento,
    ps_descuento: venta.venta.ps_descuento,
    estado_documento: venta.venta.estado_documento,
    fecha: venta.venta.fecha,
    hora:venta.venta.hora,
    estado_transaccion:venta.venta.estado_transaccion,
    // Valores predeterminados si son necesarios
    bs_falta: 0,  
    ps_falta: 0,  
    tipo_venta: 0  
  };

  console.log('VENTA SELECCIONADA: ',  this.ventaForm);
  console.log('SUS DETALLES:', this.lista_Productos_Agregados);
  
  
  this.cambiar_Pantalla();
}



//***************************************************************************************************************************************************************************************
//********************************************************************************  ELIMINAR VENTA   ************************************************************************************
//***************************************************************************************************************************************************************************************
ELIMINAR_VENTA(venta:any){
  console.log('VENTA ELIMINAR::',venta);
  
  this.ventaService.delete_Venta_Api(venta.cod_venta)
  .subscribe(
    res => {
      console.log('VENTA ELIMINADA');
      if (venta.estado_documento == 1) {
        this.mostrarToast('Venta anulada','verde');
      }else{
        this.mostrarToast('Venta eliminada','verde');
      }
      $("#modalEliminarVenta").modal('hide');
      this.cambiar_Pantalla();
    },
    err =>{
      if (venta.estado_documento == 1) {
        this.mostrarToast('Error al anular la venta','verde');
      }else{
        this.mostrarToast('Error al eliminar la venta','verde');
      }
      console.log('Error al agregar venta ', err);
      this.mostrarToast('Error al eliminar la venta','rojo');
    }
  ) 
}

//***************************************************************************************************************************************************************************************
//**********************************************************************  MODIFICAR SOLO DATOS VENTA   **********************************************************************************
//***************************************************************************************************************************************************************************************
MODIFICAR_SOLO_DATOS_VENTA(){
  this.ventaService.put_Datos_Venta_Api(this.ventaForm)
  .subscribe(
    res => {
      console.log('VENTA MODIFICADA');
      this.mostrarToast('Datos de venta modificados','verde');
      this.cambiar_Pantalla();
    },
    err =>{
      console.log('Error al modificar los datos de la venta ', err);
      this.mostrarToast('Error al modificar los datos de la venta','rojo');
    }
  ) 
}





//***************************************************************************************************************************************************************************************
//********************************************************************************  EMITIR COMANDA   ************************************************************************************
//***************************************************************************************************************************************************************************************
 //PDF
pdfurl: string = ''; // Establece la ruta correcta a tu archivo PDF aquí
// EMITIR_COMANDA2() {
//   //SI LA VENTA NO TIENE PRODUCTOS SELECCIONADOS RETURN
//   if (this.lista_Productos_Agregados.length==0) {
//     this.mostrarToast('No existen productos agregados','rojo');
//     return;
//   }
 
//   //VERIFICAR SI LA VENTA SE AGREGO
//   if (this.ventaForm.estado_transaccion == 0) {
//     this.mostrarToast('Aun no se guardó la venta','rojo');
//     return;
//   }

//   // Crear un nuevo documento PDF
//   const doc = new jsPDF({
//     orientation: 'portrait', // Orientación del documento (vertical)
//     unit: 'mm',              // Unidad de medida en milímetros
//     format: [80, 120]       // Tamaño del papel (ancho, alto)
//   });

//   // Configuración de la fuente
//   doc.setFontSize(8); // Tamaño de fuente
//   // Calcular la posición x para centrar el texto "PIO LINDO"
//   const pageWidth = 72; // Ancho del documento

//   //**************************************************************************************************************
//   // Espacios en 'x' y 'y' para el encabezado
//   const nombre = 'PIO LINDO'; let textWidth = doc.getTextWidth(nombre); let x = (pageWidth - textWidth) / 2;
//   doc.setFont('Helvetica', 'bold'); // Establece la fuente en negrita
//   doc.text(nombre, x, 5); // Texto centrado horizontalmente en x
//   doc.setFont('Helvetica', 'normal'); // Restablece la fuente a normal

//   const fecha = `${this.ventaForm.fecha}  -  ${this.ventaForm.hora}`;  textWidth = doc.getTextWidth(fecha); x = (pageWidth - textWidth) / 2;
//   doc.text(fecha, x, 8); // x=2, y=8

//   const ticket = `N° TICKET :  ${this.ventaForm.ticket}`;  textWidth = doc.getTextWidth(ticket); x = (pageWidth - textWidth) / 2;
//   doc.setFont('Helvetica', 'bold'); // Establece la fuente en negrita
//   doc.text(ticket, x, 11); // x=2, y=14

//   let posicionY = 13; // Inicializa la posición vertical para el contenido de productos

//   if (this.ventaForm.venta_llevar == true) {
//     const llevar = '(PARA LLEVAR)';  textWidth = doc.getTextWidth(llevar); x = (pageWidth - textWidth) / 2;
//     doc.text(llevar, x, 14); // x=2, y=14
//     posicionY = 16
//   }
//   doc.setFont('Helvetica', 'normal'); // Restablece la fuente a normal
//   //***************************************************************************************************************

// // Define el patrón de línea discontinua
// doc.setLineDashPattern([1, 1], 0); // 1mm línea, 1mm espacio, fase de inicio 0
// doc.line(2, posicionY, 70, posicionY); // Dibuja la línea discontinua en y=posicionY
// posicionY +=3 
// //---------------------------------------------------------------------------------------------------------------------
// const mesaText = `Mesa: ${this.ventaForm.mesa ?? ''}`;
// const codigoText = `Codigo: ${this.ventaForm.cod_venta}`;
// // Ancho del texto "Codigo"
// const codigoTextWidth = doc.getTextWidth(codigoText);
// // Posición x para "Codigo" al final de la línea
// const codigoX = pageWidth - codigoTextWidth - 2; // Restar 2mm de margen
// // Imprimir "Mesa" al principio y "Codigo" al final
// doc.text(mesaText, 2, posicionY); // "Mesa" en x=2
// doc.text(codigoText, codigoX, posicionY); // "Codigo" al final de la línea
// doc.line(2, posicionY+1, 70, posicionY+1); // Dibuja la línea discontinua en y=posicionY
// //---------------------------------------------------------------------------------------------------------------------

//   //doc.line(2, posicionY, 70, posicionY); // Dibuja una línea horizontal en y=16
//   posicionY += 5; // Incrementa la posición vertical para el siguiente elemento
//   // const detalle = 'DETALLE';  textWidth = doc.getTextWidth(detalle); x = (pageWidth - textWidth) / 2;
//   // doc.text(detalle, x, posicionY); // "Mesa" en x=2
//   // posicionY += 3;

//   // Itera sobre la lista de productos agregados
//   this.lista_Productos_Agregados.forEach((producto) => {
//     // *********** NOMBRE PRODUCTO *********** 
//     let llevar = '';
//     if (producto.item_llevar) {
//       llevar = '(Para Llevar)';
//     }
  
//     // Texto del producto con cantidad y "Para Llevar"
//     const productoTexto = `${producto.cantidad_item} x ${producto.nombre} ${llevar}`;
//     const maxWidthProducto = 65; // Ancho máximo permitido para el texto en mm
    
//     // Divide el texto en varias líneas si es necesario
//     const lineasProducto = doc.splitTextToSize(productoTexto, maxWidthProducto);
  
//     // Imprimir cantidad y nombre del producto en negrita
//     doc.setFont('Helvetica', 'bold'); // Establece la fuente en negrita
//     lineasProducto.forEach((linea: string | string[]) => {
//       doc.text(linea, 2, posicionY); // Imprimir cada línea de texto
//       posicionY += 3; // Incrementa la posición vertical para la siguiente línea
//     });
//     doc.setFont('Helvetica', 'normal'); // Restablece la fuente a normal

//     // *********************************************** LISTA COMPLEMENTOS **********************************************
//     doc.setFontSize(7); // Tamaño de fuente 
//     // Si el producto tiene complementos, se iteran los complementos
//     if (producto.complementos && Array.isArray(producto.complementos)) {
//       producto.complementos.forEach((complemento: { opciones: any[]; }) => {
//         const maxWidth = 70; // Ancho máximo permitido para el texto en mm
        
//         // Solo se generan las opciones de los complementos, sin el nombre del complemento
//         let textoOpciones = complemento.opciones
//           .filter(opcion => opcion.cantidad_op > 0) // Filtra las opciones con cantidad mayor a 0
//           .map(opcion => `${opcion.cantidad_op} ${opcion.nombre}`) // Mapea a formato de texto
//           .join(', '); // Une las opciones con una coma

//         // Verifica si hay opciones para imprimir
//         if (textoOpciones) {
//           // Imprimir opciones solo si existen
//           const lineasTextoOpciones = doc.splitTextToSize(textoOpciones, maxWidth);

//           // Imprimir cada línea de las opciones
//           lineasTextoOpciones.forEach((linea: string | string[]) => {
//             doc.text(linea, 2, posicionY); // Imprimir cada línea en x=2, y=posicionY
//             posicionY += 3; // Mover hacia abajo para la siguiente línea
//           });
//         }
//       });
//     }
//     doc.setFontSize(8); // Tamaño de fuente
//     //doc.line(2, posicionY, 70, posicionY); // Dibuja una línea horizontal para separar productos
//     posicionY += 1; // Incrementa la posición vertical para el siguiente producto
//   });

//   //----------------------------------------------------------------------------------------------------------------------
//   posicionY -= 2;
//   doc.line(2, posicionY, 70, posicionY); // Dibuja una línea horizontal para separar productos
//   posicionY += 3;
//   //----------------------------------------------------------------------------------------------------------------------

//   //*************************** DETALLE *****************************************
//   // Ajustar la descripción para que no se salga del ancho de 70 mm
//   if(this.ventaForm.descripcion.length>0){
//     const maxWidth = 70; // Ancho máximo permitido en milímetros
//     const descripcion = `Obs : ${this.ventaForm.descripcion}`;
    
//     // Divide el texto en varias líneas si excede el ancho máximo
//     const lineasDescripcion = doc.splitTextToSize(descripcion, maxWidth);
    
//     // Imprime cada línea de la descripción
//     lineasDescripcion.forEach((linea: string | string[]) => {
//       doc.text(linea, 2, posicionY); // Imprimir cada línea en x=2, y=posicionY
//       posicionY += 4; // Incrementar la posición vertical para la siguiente línea
//     });
//   }

  
//   //*************************** SIN CANCELAR *****************************************
//   if (this.ventaForm.estado_transaccion == 1) {
//     const sin_pagar = `(PENDIENTE DE PAGO)`;  textWidth = doc.getTextWidth(sin_pagar); x = (pageWidth - textWidth) / 2;
//     //doc.setFont('Helvetica', 'bold'); // Establece la fuente en negrita
//     doc.text(sin_pagar, x, posicionY); // x=2, y=14
//   }

//   const pdfDataUri = doc.output('datauristring'); // genera el PDF como string base64 embebido en HTML
//   (window as any).electronAPI.imprimirTicket(pdfDataUri);
  
  
//   //doc.autoPrint(); // Configura el documento para impresión automática
//   //window.open(doc.output('bloburl'), '_blank'); // Abre el ticket en una nueva pestaña
// }


EMITIR_COMANDA() {
  // 🔹 Validaciones básicas
  if (this.lista_Productos_Agregados.length === 0) {
    this.mostrarToast('No existen productos agregados', 'rojo');
    return;
  }

  if (this.ventaForm.estado_transaccion === 0) {
    this.mostrarToast('Aún no se guardó la venta', 'rojo');
    return;
  }

  // 🔹 Construcción del HTML
  const ticketHTML = `
  <html>
  <head>
    <meta charset="UTF-8" />
    <title>Comanda</title>
    <style>
      @page {
        size: 80mm auto;
        margin: 0;
      }
      body {
        font-family: monospace;
        width: 80mm;
        margin: 0;
        padding: 0px;
        font-size: 12px;
        -webkit-print-color-adjust: exact;
        image-rendering: crisp-edges;
      }
      .center { text-align: center; }
      .bold { font-weight: bold; }
      .row {
        padding: 0px;
        margin: 0px;
        display: flex;
        justify-content: space-between;
      }
      .line {
        border-top: 1px dashed black;
        margin: 2px 0;
      }
      .indent {
        margin-left: 2px;
        font-size: 11px;
      }
    </style>
  </head>

  <body>
    <div class="center bold">COMANDA</div>
    <div class="center">${this.ventaForm.fecha} - ${this.ventaForm.hora}</div>
    <div class="center bold">N° TICKET: ${this.ventaForm.ticket}</div>

    ${this.ventaForm.venta_llevar ? `<div class="center bold">(PARA LLEVAR)</div>` : ''}

    <div class="line"></div>

    <div class="row">
      <span>Mesa: ${this.ventaForm.mesa ?? ''}</span>
      <span>Código: ${this.ventaForm.cod_venta}</span>
    </div>

    <div class="line"></div>

    ${this.lista_Productos_Agregados.map(p => `
      <div>
        <div class="bold">${p.cantidad_item} x ${p.nombre}${p.item_llevar ? ' (LLEVAR)' : ''}</div>
        ${p.complementos && Array.isArray(p.complementos) && p.complementos.length > 0
          ? p.complementos.map((c: any) => `
              <div class="indent">
                ${(c.opciones || [])
                  .filter((o: any) => o.cantidad_op > 0)
                  .map((o: any) => `${o.cantidad_op} ${o.nombre}`)
                  .join(' | ')}
              </div>
            `).join('')
          : ''}
      </div>
    `).join('')}

    ${this.ventaForm.descripcion
      ? `<div class="line"></div><div><b>Obs:</b> ${this.ventaForm.descripcion}</div>`
      : ''
    }

    <div class="line"></div>
    <div class="center bold">¡Gracias!</div>
  </body>
  </html>
  `;

  // 🔹 OPCIÓN 1 — Enviar directo a Electron para imprimir
  // window.electron.ipcRenderer.send('imprimir-ticket', ticketHTML);

  // 🔹 OPCIÓN 2 — Abrir vista previa de impresión en ventana del sistema
  // const w = window.open('', '', 'width=2000,height=1000');
  // w?.document.write(ticketHTML);
  // w?.document.close();
  // w?.focus();
  // w?.print();
  // w?.close();

  // 🔹 OPCIÓN 3 — Abrir en navegador externo (útil para pruebas)
  const blob = new Blob([ticketHTML], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}






//***************************************************************************************************************************************************************************************
//*********************************************************************************  EMITIR PRECUENTA   ************************************************************************************
//***************************************************************************************************************************************************************************************
// EMITIR_RECIBO() {
//   //SI LA VENTA NO TIENE PRODUCTOS SELECCIONADOS RETURN
//   if (this.lista_Productos_Agregados.length==0) {
//     this.mostrarToast('No existen productos agregados','rojo');
//     return;
//   }
 
//   //VERIFICAR SI LA VENTA SE AGREGO
//   if (this.ventaForm.estado_transaccion == 0) {
//     this.mostrarToast('Aun no se guardó la venta','rojo');
//     return;
//   }

//   // Crear un nuevo documento PDF
//   const doc = new jsPDF({
//     orientation: 'portrait', // Orientación del documento (vertical)
//     unit: 'mm',              // Unidad de medida en milímetros
//     format: [80, 120]       // Tamaño del papel (ancho, alto)
//   });

//   // Configuración de la fuente
//   doc.setFontSize(8); // Tamaño de fuente
//   const pageWidth = 72; // Ancho del documento

//   //**************************************************************************************************************
//   // Encabezado original
//   const nombre = 'PIO LINDO'; let textWidth = doc.getTextWidth(nombre); let x = (pageWidth - textWidth) / 2;
//   doc.setFont('Helvetica', 'bold'); // Establece la fuente en negrita
//   doc.text(nombre, x, 5); // Texto centrado horizontalmente en x
//   doc.setFont('Helvetica', 'normal'); // Restablece la fuente a normal

//   const fecha = `${this.ventaForm.fecha}  -  ${this.ventaForm.hora}`; textWidth = doc.getTextWidth(fecha); x = (pageWidth - textWidth) / 2;
//   doc.text(fecha, x, 8); // x=2, y=8

//   const ticket = `N° TICKET :  ${this.ventaForm.ticket}`; textWidth = doc.getTextWidth(ticket); x = (pageWidth - textWidth) / 2;
//   doc.setFont('Helvetica', 'bold'); // Establece la fuente en negrita
//   doc.text(ticket, x, 11); // x=2, y=14

//   let posicionY = 13; // Inicializa la posición vertical para el contenido de productos

//   if (this.ventaForm.venta_llevar == true) {
//     const llevar = '(PARA LLEVAR)'; textWidth = doc.getTextWidth(llevar); x = (pageWidth - textWidth) / 2;
//     doc.text(llevar, x, 14); // x=2, y=14
//     posicionY = 16;
//   }
//   doc.setFont('Helvetica', 'normal'); // Restablece la fuente a normal
//   //***************************************************************************************************************

// // Define el patrón de línea discontinua
// doc.setLineDashPattern([1, 1], 0); // 1mm línea, 1mm espacio, fase de inicio 0
// //doc.line(2, posicionY, 70, posicionY); // Dibuja la línea discontinua en y=posicionY
// posicionY += 2; // Aumentar el espaciado después de la línea

// //---------------------------------------------------------------------------------------------------------------------
// doc.setFontSize(7); // Tamaño de fuente
// // Aumentar el tamaño de la fuente para "Mesa" y "Codigo"
// const mesaFontSize = 8; // Aumentar el tamaño de la fuente
// doc.setFontSize(mesaFontSize);

// const mesaText = `Mesa: ${this.ventaForm.mesa ?? ''}`;
// const codigoText = `Codigo: ${this.ventaForm.cod_venta}`;

// // Ancho del texto "Codigo"
// const codigoTextWidth = doc.getTextWidth(codigoText);

// // Posición x para "Codigo" al final de la línea
// const codigoX = pageWidth - codigoTextWidth - 2; // Restar 2mm de margen

// // Imprimir "Mesa" al principio y "Codigo" al final
// doc.text(mesaText, 2, posicionY); // "Mesa" en x=2
// doc.text(codigoText, codigoX, posicionY); // "Codigo" al final de la línea
// doc.line(2, posicionY+1, 70, posicionY+1); // Dibuja la línea discontinua en y=posicionY
// // Dibuja la línea discontinua debajo de "Mesa" y "Codigo"
// posicionY += 5; // Aumentar el espaciado vertical para la línea

// //---------------------------------------------------------------------------------------------------------------------


//   //**************************************************************************************************************
//   doc.setFont('Helvetica', 'bold'); // Establece la fuente en negrita
//   // Agregar los títulos de las columnas
//   doc.text('Cant', 2, posicionY); // Título Cantidad
//   doc.text('Producto', 10, posicionY); // Título Producto
//   doc.text('Precio', 45, posicionY); // Título Precio
//   doc.text('Total', 58, posicionY); // Título Total
//   doc.setFont('Helvetica', 'normal'); // Restablece la fuente a normal
//   posicionY += 2; // Ajustar la posición Y después de los títulos

//   // Dibuja una línea horizontal discontinua debajo de los títulos
//   doc.line(2, posicionY, 70, posicionY);
//   posicionY += 3;

//   //**************************************************************************************************************
//   // DETALLE DE PRODUCTOS

//   this.lista_Productos_Agregados.forEach((producto) => {
//     const cantidad = producto.cantidad_item;
//     let nombreProducto = producto.nombre;
//     if (producto.item_llevar) {
//       nombreProducto = nombreProducto + ' (Para LLevar)'
//     }
//     const precioUnidad = producto.precio;
//     const total = cantidad * precioUnidad;

//     // Nombre del producto con ajuste de ancho
//     const maxNombreWidth = 34; // Limitar el nombre del producto a 42 mm
//     const nombreProductoLineas = doc.splitTextToSize(nombreProducto, maxNombreWidth);

//     // Imprimir cantidad, nombre del producto y total
//     nombreProductoLineas.forEach((linea: string | string[], index: number) => {
//       if (index === 0) {
//         doc.text(`${cantidad}`, 3, posicionY); // Cantidad
//         doc.text(linea, 10, posicionY); // Primera línea del nombre del producto
//         doc.text(`${precioUnidad.toFixed(2)}`, 45, posicionY); // Precio por unidad
//         doc.text(`${total.toFixed(2)}`, 58, posicionY); // Total
//       } else {
//         doc.text(linea, 10, posicionY); // Continuación del nombre en nuevas líneas
//       }
//       posicionY += 4; // Incrementar la posición vertical
//     });
//   });

//   //**************************************************************************************************************
//   // LÍNEA FINAL
//   posicionY -= 2;
//   doc.line(2, posicionY, 70, posicionY);
//   posicionY += 4;

//   // DETALLES FINALES DE PAGO
//   const total = `TOTAL : ${(this.ventaForm.bs_total??0).toFixed(2)}`;  textWidth = doc.getTextWidth(total); x = (pageWidth - textWidth) / 2;
//   doc.text(total, x, posicionY);
//   posicionY += 4;
//   //*************************** SIN CANCELAR *****************************************
//   if (this.ventaForm.estado_transaccion == 1) {
//     const sin_pagar = `(PENDIENTE DE PAGO)`;  textWidth = doc.getTextWidth(sin_pagar); x = (pageWidth - textWidth) / 2;
//     //doc.setFont('Helvetica', 'bold'); // Establece la fuente en negrita
//     doc.text(sin_pagar, x, posicionY); // x=2, y=14
//   }
//   // Preparar para imprimir
//   doc.autoPrint();
//   window.open(doc.output('bloburl'), '_blank');
// }

EMITIR_RECIBO(){
  const ticketHTML = `
  <html>
  <head>
    <meta charset="UTF-8" />
    <title>Ticket</title>
  <style>
    @page {
      size: 80mm auto;
      margin: 0;
    }
    body {
      font-family: monospace;
      width: 80mm;
      margin: 0;
      padding: 0px;
      font-size: 12px;
      /* 🔹 Añadido para corregir tamaño y nitidez */
      transform: none;
      -webkit-print-color-adjust: exact;
      image-rendering: crisp-edges;
    }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .row {
      padding: 0px;
      margin: 0px;
      display: flex;
      justify-content: space-between;
    }
    .line {
      border-top: 1px dashed black;
      margin: 2px 0;
    }
  </style>

  </head>
  <body>

  <div>
    <div class="center bold">RestCode</div>
    <div class="center">${this.ventaForm.fecha} - ${this.ventaForm.hora}</div>
    <div class="center bold">TICKET: ${this.ventaForm.ticket}</div>

    ${this.ventaForm.venta_llevar ? `<div class="center bold">(PARA LLEVAR)</div>` : ''}

    <div class="line"></div>

    <div class="row">
      <span>Mesa: ${this.ventaForm.mesa ?? ''}</span>
      <span>Codigo: ${this.ventaForm.cod_venta}</span>
    </div>

    <div class="line"></div>

    <div class="row bold">
      <span style="width: 15%">Cant</span>
      <span style="width: 45%">Producto</span>
      <span style="width: 20%">Precio</span>
      <span style="width: 20%">Total</span>
    </div>

    <div class="line"></div>

    ${this.lista_Productos_Agregados.map(p => `
      <div class="row">
        <span style="width: 15%">${p.cantidad_item}</span>
        <span style="width: 45%">${p.nombre}${p.item_llevar ? ' (LLEVAR)' : ''}</span>
        <span style="width: 20%">${p.precio.toFixed(2)}</span>
        <span style="width: 20%">${(p.cantidad_item * p.precio).toFixed(2)}</span>
      </div>
    `).join('')}

    <div class="line"></div>

    <div class="center bold">TOTAL : ${this.ventaForm.bs_total.toFixed(2)}</div>
    <div class="center" style="font-size: 9px;">Software RestCode www.restcode.com</div>

    ${this.ventaForm.estado_transaccion == 1 ? `<div class="center bold">(PENDIENTE DE PAGO)</div>` : ''}
  </div>
    </body>
</html>
  `;

  //IMPRESION DIRECTA A ELECTRON
  // window.electron.ipcRenderer.send('imprimir-ticket', ticketHTML);

  //VENTANA DE IMPRESIÓN
  // const w = window.open('', '', 'width=2000,height=1000');
  // w?.document.write(ticketHTML);
  // w?.document.close();
  // w?.focus();
  // w?.print();
  // w?.close();
  
  //VENTANA DE NAVEGADOR
  const blob = new Blob([ticketHTML], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank'); // abre en navegador por defecto
}

//***************************************************************************************************************************************************************************************
//*********************************************************************************  EMITIR FACTURA   ***********************************************************************************
//***************************************************************************************************************************************************************************************
EMITIR_FACURA() {
  if (!this.isValidCliente()) {
    this.mostrarAdvertencias= true;
    return; 
  }
  $("#modalFacturaVenta").modal('hide');
  this.ventaForm.cod_cliente = this.clienteForm.cod_cliente;
  this.ventaForm.estado_documento = 1;
  this.MODIFICAR_VENTA('Finalizar venta');

  //CREAMOS EL NUEVO DOCUMENTO PDF
  const doc = new jsPDF({
    orientation: 'portrait', // Orientación del documento (vertical)
    unit: 'mm',              // Unidad de medida en milímetros
    format: [80, 120]       // Tamaño del papel (ancho, alto)
  });

  // Configuración de la fuente
  doc.setFontSize(7); // Tamaño de fuente
  const pageWidth = 72; // Ancho del documento

  let posicionY = 5; // Inicializa la posición vertical para el contenido de productos // Inicializa la posición vertical para el contenido de productos
  //**************************************************************************************************************
  // Encabezado original
  const nombre = 'PIO LINDO'; let textWidth = doc.getTextWidth(nombre); let x = (pageWidth - textWidth) / 2;
  doc.text(nombre, x, posicionY); // Texto centrado horizontalmente en x
  posicionY += 3;

  const propietario = 'De: Elver Mamani'; textWidth = doc.getTextWidth(propietario); x = (pageWidth - textWidth) / 2;
  doc.text(propietario, x, posicionY); 
    posicionY += 3;

  const sucursal = 'Sucursal: 0'; textWidth = doc.getTextWidth(sucursal); x = (pageWidth - textWidth) / 2;
  doc.text(sucursal, x, posicionY); 
  posicionY += 3;

  const direccion = 'Calle Juni N° 556'; textWidth = doc.getTextWidth(direccion); x = (pageWidth - textWidth) / 2;
  doc.text(direccion, x, posicionY); 
  posicionY += 3;

  const ciudad = 'VILLAZON - POTOSI'; textWidth = doc.getTextWidth(ciudad); x = (pageWidth - textWidth) / 2;
  doc.text(ciudad, x, posicionY); 
  posicionY += 3;

  const factura = 'FACTURA'; textWidth = doc.getTextWidth(factura); x = (pageWidth - textWidth) / 2;
  doc.text(factura, x, posicionY);
  posicionY += 3;

  const derecho_fiscal = '(Con Derecho a Credito Fiscal)'; textWidth = doc.getTextWidth(derecho_fiscal); x = (pageWidth - textWidth) / 2;
  doc.text(derecho_fiscal, x, posicionY);
  posicionY += 1;

  //---------------------------------------------------------------------------------------------------------------------
  doc.setLineDashPattern([1, 1], 0); // DEFINIMOS: 1mm línea, 1mm espacio, fase de inicio 0
  doc.line(2, posicionY, 70, posicionY); // Dibuja la línea discontinua en y=posicionY
  posicionY += 3;

  const nit = 'NIT: '; textWidth = doc.getTextWidth(nit); x = (pageWidth - textWidth) / 2;
  doc.text(nit, x, posicionY); 
  posicionY += 3;

  const n_factura = 'N° FACTURA: '; textWidth = doc.getTextWidth(n_factura); x = (pageWidth - textWidth) / 2;
  doc.text(n_factura, x, posicionY);
  posicionY += 3;

  const atorizacion = 'Cod. Autorizacion: '; textWidth = doc.getTextWidth(atorizacion); x = (pageWidth - textWidth) / 2;
  doc.text(atorizacion, x, posicionY); 
  posicionY += 1;

  //---------------------------------------------------------------------------------------------------------------------
  doc.line(2, posicionY, 70, posicionY); // Dibuja la línea discontinua en y=posicionY
  posicionY += 3;

  const fecha = `${this.ventaForm.fecha}  -  ${this.ventaForm.hora}`; textWidth = doc.getTextWidth(fecha); x = (pageWidth - textWidth) / 2;
  doc.text(fecha, x, posicionY); 
  posicionY += 3;

  const ni_ci = `NIT/CI/CEX: ${this.clienteForm.identificacion}`; textWidth = doc.getTextWidth(ni_ci); x = (pageWidth - textWidth) / 2;
  doc.text(ni_ci, x, posicionY); 
  posicionY += 3;

  const nombre_cli = `Nombre/Razón Social: ${this.clienteForm.nombre}`; textWidth = doc.getTextWidth(nombre_cli); x = (pageWidth - textWidth) / 2;
  doc.text(nombre_cli, x, posicionY); 
  posicionY += 1;

  doc.line(2, posicionY, 70, posicionY); // Dibuja la línea discontinua en y=posicionY
  posicionY += 3;
  //---------------------------------------------------------------------------------------------------------------------



  // DETALLE DE PRODUCTOS
  //******************************************************************************
  doc.setFont('Helvetica', 'bold'); // Establece la fuente en negrita
  // Agregar los títulos de las columnas
  doc.text('Cant', 2, posicionY); // Título Cantidad
  doc.text('Detalle', 10, posicionY); // Título Producto
  doc.text('Precio', 45, posicionY); // Título Precio
  doc.text('SubTotal', 58, posicionY); // Título Total
  doc.setFont('Helvetica', 'normal'); // Restablece la fuente a normal
  posicionY += 2; // Ajustar la posición Y después de los títulos

  // Dibuja una línea horizontal discontinua debajo de los títulos
  doc.line(2, posicionY, 70, posicionY);
  posicionY += 3;

  //*******************************************************************************
  // DETALLE DE PRODUCTOS

  this.lista_Productos_Agregados.forEach((producto) => {
    const cantidad = producto.cantidad_item;
    let nombreProducto = producto.nombre;

    const precioUnidad = producto.precio;
    const total = cantidad * precioUnidad;

    // Nombre del producto con ajuste de ancho
    const maxNombreWidth = 34; // Limitar el nombre del producto a 42 mm
    const nombreProductoLineas = doc.splitTextToSize(nombreProducto, maxNombreWidth);

    // Imprimir cantidad, nombre del producto y total
    nombreProductoLineas.forEach((linea: string | string[], index: number) => {
      if (index === 0) {
        doc.text(`${cantidad}`, 3, posicionY); // Cantidad
        doc.text(linea, 10, posicionY); // Primera línea del nombre del producto
        doc.text(`${precioUnidad.toFixed(2)}`, 45, posicionY); // Precio por unidad
        doc.text(`${total.toFixed(2)}`, 58, posicionY); // Total
      } else {
        doc.text(linea, 10, posicionY); // Continuación del nombre en nuevas líneas
      }
      posicionY += 3; // Incrementar la posición vertical
    });
  });

  //***************************************************************
  // LÍNEA FINAL
  posicionY -= 2;
  doc.line(2, posicionY, 70, posicionY);
  posicionY += 4;
  //---------------------------------------------------------------------------------------------------------------------

  // DETALLES FINALES DE PAGO
  const titleX = 20; // Posición X fija para los títulos (a la izquierda)
  const valueMaxX = pageWidth - 2; // Margen derecho para los valores numéricos
  
  
  // DESCUENTO
  const descuentoTitle = `DESCUENTO :`;  
  doc.text(descuentoTitle, titleX, posicionY);  // Título alineado a la izquierda
  const descuentoValue = `${(this.descuento).toFixed(2)}`;  
  const descuentoValueWidth = doc.getTextWidth(descuentoValue);  // Calcula el ancho del valor
  doc.text(descuentoValue, valueMaxX - descuentoValueWidth, posicionY); // Alinea el valor a la derecha
  posicionY += 3;
  
  // TOTAL
  const totalTitle = `TOTAL :`;  
  doc.text(totalTitle, titleX, posicionY);  // Título alineado a la izquierda
  const totalValue = `${(this.total).toFixed(2)}`;  
  const totalValueWidth = doc.getTextWidth(totalValue);  // Calcula el ancho del valor
  doc.text(totalValue, valueMaxX - totalValueWidth, posicionY); // Alinea el valor a la derecha
  posicionY += 3;
  
  // IMPORTE BASE CRÉDITO FISCAL
  const importeBaseTitle = `IMP. BASE CREDITO FISCAL :`;  
  doc.text(importeBaseTitle, titleX, posicionY);  // Título alineado a la izquierda
  const importeBaseValue = `${(this.credido_fiscal).toFixed(2)}`;  
  const importeBaseValueWidth = doc.getTextWidth(importeBaseValue);  // Calcula el ancho del valor
  doc.text(importeBaseValue, valueMaxX - importeBaseValueWidth, posicionY); // Alinea el valor a la derecha
  posicionY += 4;
  
  doc.text(`Son: ${this.total_letra} ${this.centavos}/100 Bs.`, 2, posicionY); 
  posicionY += 5;

  //*************** FRASE DE ESTA FACTURA.....
  const frase1 = `Esta factura contribuye al desarrollo del país.`; textWidth = doc.getTextWidth(frase1); x = (pageWidth - textWidth) / 2;
  doc.text(frase1, x, posicionY); 
  posicionY += 3;
  const frase2 = `El uso ilícito de esta será sancionado conforme a la ley.`; textWidth = doc.getTextWidth(frase2); x = (pageWidth - textWidth) / 2;
  doc.text(frase2, x, posicionY); 
  posicionY += 4;

  //*************** FRASE LEY 453°.....
  const ley1 = `Ley N° 453: El proveedor debe garantizar la idoneidad,`; textWidth = doc.getTextWidth(ley1); x = (pageWidth - textWidth) / 2;
  doc.text(ley1, x, posicionY); 
  posicionY += 3;
  const ley2 = `calidad y seguridad del servicio o producto ofrecido.`; textWidth = doc.getTextWidth(ley2); x = (pageWidth - textWidth) / 2;
  doc.text(ley2, x, posicionY); 
  posicionY += 4;

  //*************** FRASE FACTURA DIGITAL.....
  const digital1 = `"Este documento es la representación gráfica`; textWidth = doc.getTextWidth(digital1); x = (pageWidth - textWidth) / 2;
  doc.text(digital1, x, posicionY); 
  posicionY += 3;
  const digital2 = `de un Documento Fiscal Digital emitido`; textWidth = doc.getTextWidth(digital2); x = (pageWidth - textWidth) / 2;
  doc.text(digital2, x, posicionY); 
  posicionY += 3;
  const digita3 = `en una modalidad de facturación en línea"`; textWidth = doc.getTextWidth(digita3); x = (pageWidth - textWidth) / 2;
  doc.text(digita3, x, posicionY); 
  posicionY += 3;

  const usuario = `Cod. Operador: ${this.ventaForm.ci_usuario}`; textWidth = doc.getTextWidth(usuario); x = (pageWidth - textWidth) / 2;
  doc.text(usuario, x, posicionY); 
  posicionY += 3;
  // Preparar para imprimir
  doc.autoPrint();
  window.open(doc.output('bloburl'), '_blank');
}


//*************************************************** LISTAR CLIENTES ****************************************************
//************************************************************************************************************************
lista_Clientes:any
listar_Clientes() {
  this.clienteService.get_Clientes_Api()
    .subscribe(
      res => {
        // Filtra la lista para incluir solo los clientes con estado == 0
        this.lista_Clientes = res.filter((cliente: { estado: number; }) => cliente.estado === 0);
        console.log('lista_Clientes: ', this.lista_Clientes);
      },
      err => console.log('Error al obtener opciones')
    );
}

//*************************************************** AGREGAR CLIENTE ****************************************************
//************************************************************************************************************************
clienteSeleccionado:any;
clienteForm = {cod_cliente:null, identificacion:null, nombre:'', ap_materno:'', ap_paterno:'', documento:0, correo:'', celular:null, estado:0};
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
      $("#modalFormularioCliente").modal('hide');
      this.mostrarToast('Cliente Agregado','verde');
    },
    err => console.log('Error al obtener opciones')
  ) 

}




// FUNCION QUE SE EJECUTA CUANDO SE SELECCIONA UN CLIENTE
onClienteChange(cliente: any) {
    // Asigna el cliente seleccionado a clienteForm
    this.clienteForm = cliente;
    console.log('Cliente seleccionado:', this.clienteForm);
}
// FUNCION QUE SE EJECUTA CUANDO SE LIMPIA LA SELECCIÓN
onClienteClear() {
    this.clienteForm = {cod_cliente:null, identificacion:null, nombre:'', ap_materno:'', ap_paterno:'', documento:0, correo:'', celular:null, estado:0};  // Limpia el clienteForm
    console.log('Cliente limpiado:', this.clienteForm);
}
//VALIDAR DATOS DEL CLIENTE
isValidCliente():boolean{
  return this.clienteForm.identificacion !== null && this.clienteForm.nombre.trim() !== '' &&
         this.clienteForm.documento !== 0;
}
//********************* RESETEAR FORMULARIO AL CERRAR EL MODAL *********************
resetForm() {
  this.formCliente.resetForm();
  this.mostrarAdvertencias=false;
  this.clienteForm = {cod_cliente:null, identificacion:null, nombre:'', ap_materno:'', ap_paterno:'', documento:0, correo:'', celular:null, estado:0};
}






//********************************************************************************************************************************************************************************** 
//*********************************************************************************  FUNCIONES EXTRAS  *****************************************************************************
//**********************************************************************************************************************************************************************************

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
      this.tipo_de_cambio = this.last_caja.tipo_cambio;
      //LISTAMOS VENTAS NUEVAS
      this.LISTAR_VENTAS_NUEVAS();
      this.cargarDatos_Para_AgregarVenta();
      //this.LISTAR_VENTAS_EN_PROCESO();
      // this.LISTAR_VENTAS_FINALIZADAS();
    },
    err =>{
      console.log('Error al agregar Productos: ', err);
    }
  ) 
}



//***************************** CONVERTIR DIVISA PARA HTML ****************************** 
math_Ceil(precio:number, cantidad:number):number{
  // console.log('(precio * cantidad) /this.tipo_de_cambio: ',(precio * cantidad) /this.tipo_de_cambio);
  // console.log(' Math.ceil((precio * cantidad) /this.tipo_de_cambio /100 ): ', Math.ceil((precio * cantidad) /this.tipo_de_cambio /100 ));

  return Math.ceil((precio * cantidad) /this.tipo_de_cambio /50 ) * 50;
}
//***************************** OBTENER USUARIO ****************************** 
obtener_Usuario(){
  var usuario;
  const ci_usuario=localStorage.getItem('ci_usuario') 
  if (ci_usuario!==null) {
    usuario=JSON.parse(ci_usuario);
  }
  return usuario;
}
//****************************** OBTENER FECHA ******************************** 
obtener_fecha() {
  return String(new Date().getDate()).padStart(2, '0') + '/' + 
         String(new Date().getMonth() + 1).padStart(2, '0') + '/' + 
         new Date().getFullYear();
}
//************************ OBTENER FECHA 00-00-0000 ***************************
getTodayDate(): string {
  const todayDate = new Date();
  const year = todayDate.getFullYear();
  const month = String(todayDate.getMonth() + 1).padStart(2, '0'); // Los meses son indexados desde 0
  const day = String(todayDate.getDate()).padStart(2, '0'); // Obtener el día en formato 'DD'
  return `${year}-${month}-${day}`; // Formato 'YYYY-MM-DD'
}
//************************ OBTENER HORA ***************************
obtener_hora(){
  const ahora = new Date();
  const hora = ahora.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  return hora;
}
//******************* TRANSFORMAR FECHA DE (00/00/0000) A (0000-00-00) **********************
transformar_Fecha_AlReves(fecha: string): string {
  // Split the date string into day, month, and year parts
  const [day, month, year] = fecha.split('/').map(Number);

  // Return the formatted date string
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
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


