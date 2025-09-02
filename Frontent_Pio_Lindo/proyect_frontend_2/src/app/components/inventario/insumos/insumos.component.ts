import { Component, ViewChild, Renderer2 } from '@angular/core';
import { InsumosService } from "../../../services/insumos.service";
import { NgSelectModule } from '@ng-select/ng-select';
import * as bootstrap from 'bootstrap';

// This lets me use jquery
declare var $: any
@Component({
  selector: 'app-insumos',
  templateUrl: './insumos.component.html',
  styleUrls: ['./insumos.component.css']
})
export class InsumosComponent {
  @ViewChild('formInsumo') formInsumo: any;
  @ViewChild('formMovimiento') formMovimiento: any;
  @ViewChild('formInsumoSelected') formInsumoSelected: any;
  constructor(
    private insumoService:InsumosService,
    private renderer: Renderer2
  )
  { 
    this.listar_Insumos();
    this.obener_UltimosCodigos_DetalleMovimientos();
  }
  filterPost='';
  insumoForm2 = {
    proveedor: null
  };

  proveedores = [
    { cod_proveedor: 1, nombre: 'Coca cola' },
    { cod_proveedor: 2, nombre: 'Pollo Arg' },
    { cod_proveedor: 3, nombre: 'Papa' }
  ];
  page: number = 1; // Página inicial
  page_m: number = 1; // Página inicial
  page_d: number = 1; // Página inicial
  today = this.getTodayDate();
//************************* BOTON DESPLIEGUE DE OPCIONES *****************************
//************************************************************************************
corregirMovimiento: boolean = false;
openMenu(): void {
    this.corregirMovimiento=!this.corregirMovimiento
}
closeMenu(){
  this.corregirMovimiento=false;
}
//******************************** SHOW MODALES ************************************
//************************************************************************************
showModalAgregar(modal:any):void{
  this.limpiar_Datos();
  this.limpiar_datos_movimiento();
  $("#modalAgregarInsumo").modal('show');
}
showModalModificar(modal:any,insumo:any):void{
  this.limpiar_Datos();
  this.insumoForm = { ...insumo};
  $("#modalModificarInsumo").modal('show');
}
estado=0;
showModalEstado(insumo:any):void{
  this.limpiar_Datos();
  if (insumo.estado == 0) {
    this.estado = 1;
  }else{this.estado = 0;}

  this.insumoForm = { ...insumo};
  $("#modalEstadoInsumo").modal('show');
}
showModalEliminar(insumo:any):void{
  this.limpiar_Datos();
  this.insumoForm = { ...insumo};
  $("#modalEliminarInsumo").modal('show');
}

fecha_movimiento:any;
showModalMovimiento(modal:any):void{
  this.limpiar_Datos();
  this.limpiar_datos_movimiento();
  //Obtenemos la fecha
  this.fecha_movimiento=this.getTodayDate();
  this.today = this.getTodayDate();
  console.log(this.fecha_movimiento);
  
  $("#modalMovimiento").modal('show');
}
nombre_insumo:any;
showModalSelectFecha(insumo:any):void{
  this.nombre_insumo = insumo.nombre;
  this.selectFecha.cod_insumo=insumo.cod_insumo;
  this.selectFecha.fechaI= this.getTodayDate();
  this.selectFecha.fechaF= this.selectFecha.fechaI;
  $("#modalSelectFecha").modal('show');
}
paginacionActiva: boolean = true; // Control de paginación principal
showModalDetalleMovimiento():void{
  console.log(this.selectFecha);
    this.mostrarAdvertenciasFechaI=true;
  if (!this.isFormValid_Fecha()) {
    console.log('Fecha Invalida'); 
    return
  }
  this.paginacionActiva = false; // Desactivar paginación principal
  $("#modalSelectFecha").modal('hide');
  $("#modalDetalleMovimiento").modal('show');
  this.listar_MovimientosInsumos_y_Detalles_byInsumo();
}
showModalSelectFecha_Todo():void{
  this.selectFecha.fechaI= this.getTodayDate();
  this.selectFecha.fechaF= this.selectFecha.fechaI;
  $("#modalSelectFechaTodo").modal('show');
}
showModalDetalleMovimientoTodo():void{
  console.log(this.selectFecha);
  this.paginacionActiva = false; // Desactivar paginación principal
  $("#modalSelectFechaTodo").modal('hide');
  $("#modalDetalleMovimientoTodo").modal('show');
  this.listar_MovimientosInsumos_y_Detalles_Todo();
}

cerrarModal_Reporte() {
  this.paginacionActiva = true; // Reactivar paginación principal
}

//******************************** LISTAR INSUMOS ************************************
//************************************************************************************
listaInsumos:any;
listar_Insumos(){
  this.insumoService.get_InsumosApi()
  .subscribe(
    res => {
      this.listaInsumos = res;
      this.seleccionarOpcion(this.opcionSeleccionada);
    },
    err => console.log('Error al obtener Productos')
  ) 
}

//******************************** AGREGAR INSUMO ************************************
//************************************************************************************
insumoForm={cod_insumo:0,nombre:'',medida:0,existencia:0,descripcion:'',vender_negativo:0,habilitar_stock:0,estado:0,};
mostrarAdvertenciasInsumo: boolean = false;
Agregar_Insumo(){

  this.mostrarAdvertenciasInsumo = true; // Activa las advertencias cuando se presiona el botón
  if (!this.isFormInsumoValid()) {
    console.log('No Valido');
    return;
  }

  this.insumoForm.cod_insumo=this.getlast_CodInsumo();
  console.log("Insumo Agregar: ",this.insumoForm);

  this.insumoService.post_InsumoApi(this.insumoForm)
  .subscribe(
    res => {
      console.log("insumo Agregado");
      this.listar_Insumos();
      this.mostrarToast('Insumo Agregado', 'verde');
      $("#modalAgregarInsumo").modal('hide'); 
    },
    err => {console.log('Error al agregar Insumo: ',err)
      this.mostrarToast('Error al agregar Insumo', 'rojo');
    }
  ) 
}

//********** OBTENEMOS EL ULTIMO COD_INSUMO **********
getlast_CodInsumo(){
  if (this.listaInsumos.length>0) {//Obtener el ultimo cod_insumo de la listaInsumos[]
    const lastIndex = this.listaInsumos.length - 1;
    const lastInsumo = this.listaInsumos[lastIndex].cod_insumo;
    return lastInsumo+1;
  }else{
    return 1;
  }
}
  
//******************************** MODIFCAR INSUMO ************************************
//*************************************************************************************

Modificar_Insumo(){
  this.mostrarAdvertenciasInsumo = true; // Activa las advertencias cuando se presiona el botón
  if (!this.isFormInsumoValid()) {
    console.log('No Valido');
    return;
  }
  console.log("Insumo Modificar: ",this.insumoForm);
  this.insumoService.put_InsumoApi(this.insumoForm)
  .subscribe(
    res => {
      console.log("insumo Modificado");
      this.listar_Insumos();
      this.mostrarToast('Insumo Modificado', 'verde');
      $("#modalModificarInsumo").modal('hide'); 
    },
    err => {
      console.log('Error al agregar Insumo: ', err);
      this.mostrarToast('Error Modificar Insumo', 'rojo');
    }
  ) 
}
//******************************** MODIFCAR INSUMO ************************************
//*************************************************************************************

Eliminar_Insumo(){
  console.log("Insumo Modificar: ",this.insumoForm);
  //Si el Insumo tiene existencia>0, no se puede eliminar
  if (this.insumoForm.existencia>0) {
    console.log("No se puede Eliminar, el Insumo tiene existencia > 0");
    this.mostrarToast('Error al eliminar, existencia > 0', 'rojo');
    $("#modalEliminarInsumo").modal('hide'); 
  }else{
    this.insumoService.delete_InsumoApi(this.insumoForm.cod_insumo)
    .subscribe(
      res => {
        console.log("Insumo Eliminado");
        this.listar_Insumos();
        this.mostrarToast('Insumo Eliminado', 'verde');
        $("#modalEliminarInsumo").modal('hide'); 
      },
      err => {
        console.log('Error al eliminar Insumo: ', err);
        this.mostrarToast('Error al eliminar Insumo', 'rojo');
      }
    ) 
  }
}


//******************************** CAMBIAR ESTADO INSUMO ************************************
//************************************************************************************
cambiarEstado_Insumo(){
  if (this.insumoForm.estado==0) {this.insumoForm.estado=1;} else {this.insumoForm.estado=0;}

  console.log("Insumo Modificar: ",this.insumoForm);
  this.insumoService.put_InsumoApi(this.insumoForm)
  .subscribe(
    res => {
      console.log("Insumo Modificado");
      this.mostrarToast('Estado Modificado', 'verde');
      this.listar_Insumos();
      
      $("#modalEstadoInsumo").modal('hide'); 
    },
    err => {
      console.log('Error al cambiar estado Insumo');
      this.mostrarToast('Error al modificar estado', 'rojo');
    }
  ) 
}


limpiar_Datos(){
  this.insumoForm={cod_insumo:0,nombre:'',medida:0,existencia:0,descripcion:'',vender_negativo:0,habilitar_stock:0,estado:0,};
}

//*********************************************************************************** REGISTRAR MOVIMIENTO INSUMO **********************************************************************************************
//**************************************************************************************************************************************************************************************************************
movimientoForm={cod_mov:null,cod_diario:null,movimiento:0,precio:0,ps_precio:0,tipo_cambio:null as number | null,cod_proveedor:null,ci_usuario:0,descripcion:'',cod_doc:null,fecha:'',hora:'',estado:0,origen:0};
detalleMovimientoForm:any[]=[];
insumoSeleccionado:any=null;
// cantidad:null as number | null =Permite null y number
insumo_adicionar={lote:0,cod_mov:'',cod_insumo:'',nombre:'',nom_medida:'', precio:null as number | null, precio_unidad:0,cantidad:null as number | null,existencia:0,existencia_actual:0};
//******************** ADICIONAMOS LOS INSUMOS MOVIMIENTO FORM ********************
mostrarAdvertenciaSeleccionado = false;
adicionar_Insumo_Movimiento(){
  //VERIFICAMOS VALIDES
  this.mostrarAdvertenciaSeleccionado=true;
  if (this.movimientoForm.movimiento ==1) {
    if (!this.isFormInsumoSelectedValid()) {
      console.log('Insumo Entrada Seleccionado No Valido');
      return;
    }
  }else if (this.movimientoForm.movimiento != 1) {
    if (!this.isFormInsumoSelectedValidSalida()) {
      console.log('Insumo Salida Seleccionado No Valido');
      return;
    }
  }


  //Agregamos los datos de insumo_seleccionado y los que falta a insumo_adicionar
  this.insumo_adicionar.cod_mov=this.ultimo_cod_mov+1;
  this.insumo_adicionar.lote=this.ultimo_lote+1;
  this.insumo_adicionar.cod_insumo=this.insumoSeleccionado.cod_insumo;  
  this.insumo_adicionar.nombre=this.insumoSeleccionado.nombre;
  this.insumo_adicionar.nom_medida=this.insumoSeleccionado.nom_medida;

  this.insumo_adicionar.cantidad=Number(this.insumo_adicionar.cantidad);
  //SI HAY TIPO DE CAMBIO SE AJUSTA AL BOLIVIANO
  if ((this.movimientoForm.tipo_cambio ?? 0) > 0) {
    this.insumo_adicionar.precio=Number((this.insumo_adicionar.precio ?? 0) * (this.movimientoForm.tipo_cambio ?? 0) );
  }else{
    this.insumo_adicionar.precio=Number(this.insumo_adicionar.precio);
  }

  this.insumo_adicionar.existencia=Number(this.insumo_adicionar.cantidad || 0);
  this.insumo_adicionar.precio_unidad=Number((Number(this.insumo_adicionar.precio)/Number(this.insumo_adicionar.cantidad)).toFixed(3));
  this.insumo_adicionar.existencia_actual=this.insumoSeleccionado.existencia; //Agregamos la existencia actual para que no sea -0

  console.log("Cantidad::::",this.insumo_adicionar.cantidad);
  // Verificamos si el insumo ya existe en la lista
  if (this.existeInsumoSeleccionado()) {
    console.log('El insumo ya existe en la lista.');
    return;
  }

  //configuramos ultimo_lote
  this.ultimo_lote++;
  //Agregamos el insumo_adicionar a detalleMovimientoForm
  this.detalleMovimientoForm.push(this.insumo_adicionar);
  console.log("1111::: ",this.insumo_adicionar);
  

  //Limpiamos los datos
  // this.formInsumoSelected.resetForm();
  this.mostrarAdvertenciaSeleccionado = false;     
  this.insumoSeleccionado=null;
  this.insumo_adicionar={lote:0,cod_mov:'',cod_insumo:'',nombre:'',nom_medida:'', precio:null as number | null,precio_unidad:0,cantidad:null as number | null,existencia:0,existencia_actual:0};

}
//******************** ELIMINAMOS LOS INSUMOS DEL MOVIMINETO FORM ********************
eliminar_Insumo(index: number) {
  this.detalleMovimientoForm.splice(index, 1);
}

//******************** REGISTRAMOS TODO EL MOVIMIENTO INSUMO Y DETALLES ********************
mostrarAdvertenciaMovimiento=false;
Registrar_Movimiento(){
  //VERIFICAMOS VALIDES
  this.mostrarAdvertenciaMovimiento=true;
  if (!this.isFormMovimientoValid()) {
    console.log('Movimiento Form No Valido');
    return;
  }

  //Agregamos los datos faltantes de movimiento_insumo principal
  this.movimientoForm.cod_mov=this.ultimo_cod_mov+1;
  this.movimientoForm.movimiento=Number(this.movimientoForm.movimiento);
  this.movimientoForm.precio=0;
  this.movimientoForm.hora=this.obtener_hora();
  //Para entrada verificamos los precios de los insumos y lo sumamos 
  if (this.movimientoForm.movimiento==1) {
    for(const detalle of this.detalleMovimientoForm){
      console.log(detalle.precio);
      this.movimientoForm.precio = this.movimientoForm.precio + detalle.precio;
    }
  }
  //agregamos la fecha al movimiento
  const fecha= this.transformar_Fecha(this.fecha_movimiento);
  this.movimientoForm.fecha=fecha;
  //Agregamos el ci_usuario
  const ci_usuario=localStorage.getItem('ci_usuario') 
  if (ci_usuario!==null) {
    this.movimientoForm.ci_usuario=JSON.parse(ci_usuario);
  }
  //configuramos ultimo_cod_mov
  this.ultimo_cod_mov++;
  //------- SI EL MOVIMIENTO ES SALIDA
  if (this.movimientoForm.movimiento==2) {
    this.movimientoForm.cod_proveedor=null;
    //verificamos que los precios y precios unitarios sean 0
  }

  //UNIMOS TODO
  const movimiento=[this.movimientoForm,this.detalleMovimientoForm]
  console.log("Todo::::::: ",movimiento);
  
  //REGISTRAR MOVIMIENTO
  this.insumoService.post_Insumo_Movimiento_y_Detalle_Api_Insumo(movimiento)
  .subscribe(
    res => {
      console.log("Movimiento Agregado");
      this.listar_Insumos();
      this.limpiar_datos_movimiento();
      this.mostrarToast('Movimiento Agregado', 'verde');
      $("#modalMovimiento").modal('hide'); 
    },
    err => {
      console.log('Error al agregar movimiento: ', err);
      this.mostrarToast('Error al agregar movimiento', 'rojo');
    }
  ) 
  console.log("Movimiento Agregar: ", this.movimientoForm);
  console.log("Movimiento Agregar Insumos: ", this.movimientoForm);

}


//********************************************************************** MODIFICAR MOVIMIENTO *******************************************************************************
//***************************************************************************************************************************************************************************
//PRIMERO:: OBTENEMOS EL ULTIMO MOVIMIENTO Y SUS DETALLES
movimiento_Anterior: any;
lotes_Anteriores: any;
obtener_ultimos_Movimientos_y_Detalles(movimiento:any){
  this.insumoService.get_ultimo_Movimiento_y_Detalles(movimiento)
  .subscribe(
    res => {
      //Agregamos los datos a los formularios
      this.movimientoForm = res[0];
      this.detalleMovimientoForm = res[1];
      //Agregamos la fecha al formulario
      this.fecha_movimiento = this.transformar_Fecha_AlReves(this.movimientoForm.fecha);
      //Guardamos los datos anteriores(Lo guardamos asi para que los valores no cambien)
      this.movimiento_Anterior = JSON.parse(JSON.stringify(this.movimientoForm));
      this.lotes_Anteriores = JSON.parse(JSON.stringify(this.detalleMovimientoForm));
      // VERIFICAMOS SI HAY INSUMOS IGUALES Y RESTAURAMOS LA EXISTENCIA ACTUAL
      // Agrupamos y sumamos los detalles únicos
      if (this.movimientoForm.movimiento>1) {
        this.detalleMovimientoForm = this.agruparDetallesUnicos(this.detalleMovimientoForm);
      }
      this.detalleMovimientoForm = this.restaurarExistenciaActual(this.detalleMovimientoForm);

      //Comentarios
      console.log('1.- Ultimos Movimientos:: Movimiento :: ',this.movimientoForm);
      console.log('2.- Ultimos Movimientos:: Detalles :: ',this.detalleMovimientoForm);
      console.log('3.- Ultimos Movimientos:: Movimiento :: ',this.movimiento_Anterior);
      //Cerramos el menu de opciones de Corregir...
      this.closeMenu();
      //Mostramos el modal Modificar Movimiento
      $("#modalModificarMovimiento").modal('show'); 
    },
    err =>{
      console.log('Error al agregar Insumo');
    } 
  ) 
}
// Función para agrupar detalles únicos y sumar cantidades
agruparDetallesUnicos(detalles: any[]): any[] {
  const detallesUnicosMap = new Map();
  
  detalles.forEach(detalle => {
    if (!detallesUnicosMap.has(detalle.cod_insumo)) {
      detallesUnicosMap.set(detalle.cod_insumo, { ...detalle });
    } else {
      const detalleExistente = detallesUnicosMap.get(detalle.cod_insumo);
      detalleExistente.cantidad += detalle.cantidad;
    }
  });
  
  return Array.from(detallesUnicosMap.values());
}
restaurarExistenciaActual(detalles:any): any[]{
  for(const detalle of detalles){
    detalle.existencia_actual += detalle.cantidad;
  }
  return detalles;
}
modificar_Movimiento(){
  //VERIFICAMOS VALIDES
  this.mostrarAdvertenciaMovimiento=true;
  if (!this.isFormMovimientoValid()) {
    console.log('Movimiento Form No Valido');
    return;
  }
  //Agregamos los datos faltantes de movimiento_insumo principal
  this.movimientoForm.movimiento=Number(this.movimientoForm.movimiento);
  this.movimientoForm.precio=0;
  //Para entrada verificamos los precios de los insumos y lo sumamos
  let index = 0;
  if (this.movimientoForm.movimiento==1) {
    for(const detalle of this.detalleMovimientoForm){
      //Sumamos y agregamos el precio al movimiento
      this.movimientoForm.precio = this.movimientoForm.precio + detalle.precio;
      //Igualamos todos los cod_mov de los lotes al orginal
      this.detalleMovimientoForm[index].cod_mov =this.ultimo_cod_mov;
      index++;
    }
  }
  //agregamos la fecha al movimiento
  const fecha= this.transformar_Fecha(this.fecha_movimiento);
  this.movimientoForm.fecha=fecha;
  //Agregamos el ci_usuario
  const ci_usuario=localStorage.getItem('ci_usuario') 
  if (ci_usuario!==null) {
    this.movimientoForm.ci_usuario=JSON.parse(ci_usuario);
  }

  //------- SI EL MOVIMIENTO ES SALIDA
  if (this.movimientoForm.movimiento==2) {
    this.movimientoForm.cod_proveedor=null;
  }
  //UNIMOS TODO
  const movimiento=[this.movimientoForm,this.detalleMovimientoForm,this.movimiento_Anterior,this.lotes_Anteriores,this.ultimo_lote];
  console.log("Movimientos a Modificar ::::: ",movimiento);

  //REGISTRAR MOVIMIENTO
  this.insumoService.modificar_Movimiento_y_Detalles(movimiento)
  .subscribe(
    res => {
      console.log("Movimiento Agregado");
      this.listar_Insumos();
      this.limpiar_datos_movimiento();
      this.mostrarToast('Ultimo Movimiento Modificado', 'verde');
      $("#modalModificarMovimiento").modal('hide'); 
    },
    err => {
      console.log('Error al modificar Movimiento: ', err);
      this.mostrarToast('Error al modificar Movimiento', 'rojo');
    }
  ) 
  // console.log("Movimiento Agregar: ", this.movimientoForm);
  // console.log("Movimiento Agregar Insumos: ", this.detalleMovimientoForm);
}
eliminar_Movimiento(){
  this.movimientoForm
    //REGISTRAR MOVIMIENTO
    this.insumoService.eliminar_Movimiento_y_Detalles(this.movimientoForm.cod_mov)
    .subscribe(
      res => {
        console.log("Movimiento Eliminado");
        this.listar_Insumos();
        this.mostrarToast('Ultimo Movimiento Eliminado', 'verde');
        this.limpiar_datos_movimiento();
        $("#modalModificarMovimiento").modal('hide'); 
      },
      err => {
        console.log('Error al agregar Insumo');
        this.mostrarToast('Error al Eliminar Movimiento', 'rojo');
      }
    ) 
}

//******************************** OBTENER DETALLES Y MOVIMIENTO_INSUMO DE UN INSUMO************************************
//**********************************************************************************************************
selectFecha={fechaI:'',fechaF:'',cod_insumo:0,movimiento:0}
listaMovimientos:any;
tipo_Fecha="single";  //para elegir fecha unica o rango de fechas
mostrarAdvertenciasFechaI: boolean = false; mostrarAdvertenciasFecha: boolean = false;
listar_MovimientosInsumos_y_Detalles_byInsumo(){
  //Verificamos las fechas
  if (!this.selectFecha.fechaF) {
    this.selectFecha.fechaF = this.selectFecha.fechaI;
  }
  console.log("Fecha Final:: ",this.selectFecha.fechaF);

  //transformamos las fechas
  this.selectFecha.fechaI=this.transformar_Fecha(this.selectFecha.fechaI);
  this.selectFecha.fechaF=this.transformar_Fecha(this.selectFecha.fechaF);
  console.log(this.selectFecha);
  
  this.insumoService.get_Movimientos_Insumos_y_Detalle_Api(this.selectFecha)
  .subscribe(
    res => {
      this.listaMovimientos = res[2];
      console.log('LISTA MOVIMIENTOS: ',this.listaMovimientos);
      //limpiamos datos
      this.selectFecha={fechaI:'',fechaF:'',cod_insumo:0,movimiento:0}
    },
    err => console.log('Error al obtener Productos')
  ) 
}

//******************************** OBTENER DETALLES Y MOVIMIENTO_INSUMO TODO EN GENERAL************************************
//*************************************************************************************************************************
listar_MovimientosInsumos_y_Detalles_Todo(){
  //Verificamos las fechas
  if (!this.selectFecha.fechaF) {
    this.selectFecha.fechaF = this.selectFecha.fechaI;
  }
  console.log("Fecha Final:: ",this.selectFecha.fechaF);

  //Transformamos las fechas
  this.selectFecha.fechaI=this.transformar_Fecha(this.selectFecha.fechaI);
  this.selectFecha.fechaF=this.transformar_Fecha(this.selectFecha.fechaF);
  console.log(this.selectFecha);
  //CONSULTAMOS LA API
  this.insumoService.get_Movimientos_Insumos_y_Detalle_Api_Todo(this.selectFecha)
  .subscribe(
    res => {
      this.listaMovimientos = res[2];
      console.log(this.listaMovimientos);
      //limpiamos datos
      this.selectFecha={fechaI:'',fechaF:'',cod_insumo:0,movimiento:0}
    },
    err => console.log('Error al obtener Movimientos')
  ) 
}

//*************************************************** SELECCIONAR ATAJO****************************************************
//*************************************************************************************************************************
seleccionar_Atajo(dias: number) {
  const fechaActual = new Date();

  // Restar los días al atajo seleccionado para fechaInicial
  const fechaInicial = new Date(fechaActual.getTime()); // Crear una copia exacta de fechaActual
  fechaInicial.setDate(fechaInicial.getDate() - dias); // Restar los días según la entrada

  // Asegurar que la fecha esté ajustada al inicio del día
  fechaInicial.setHours(0, 0, 0, 0);

  // Asignar fechas al objeto de selección
  this.selectFecha.fechaI = fechaInicial.toISOString().substring(0, 10); // Formato 'YYYY-MM-DD'
  this.selectFecha.fechaF = this.getTodayDate(); // Usar la función que tienes para obtener la fecha de hoy
}











//***************************************** FUNCIONES EXTRAS ********************************************
//*******************************************************************************************************
//************************************************* SELECCIONAR LISTA *************************************************
opcionSeleccionada: number = 2; // Por defecto mostrar todo
lista_insumos_filtrados: any[] = [];
filtrarLista(){
  if (this.opcionSeleccionada === 2) {
    // Mostrar todos
    this.lista_insumos_filtrados = this.listaInsumos;
  } else {
    // Filtrar por estado (0 o 1)
    this.lista_insumos_filtrados = this.listaInsumos.filter((producto: { estado: any; }) => producto.estado === this.opcionSeleccionada);
  }
}

seleccionarOpcion(opcion: number) {
  this.opcionSeleccionada = opcion;
  this.filtrarLista();
}



//******************** OBTENER ULTIMOS DETALLE Y MOVIMIENTO_INSUMO ***********************
ultimo_lote:any; //Lista de Movimientos_Insumos
ultimo_cod_mov:any; //Lista de Detalle_Movimientos_Insumos
obener_UltimosCodigos_DetalleMovimientos(){
  this.insumoService.get_Ultimos_Codigos_DetalleMovimiento()
  .subscribe(
    res => {
      this.ultimo_lote=res[0].lote;
      this.ultimo_cod_mov=res[1].cod_mov;
      // console.log('1.-',this.ultimo_lote);
      // console.log('2.-',this.ultimo_cod_mov);
      // console.log('3.-',this.ultimo_cod_movstock);
    },
    err => console.log('Error al obtener Ultimos Codigos')
  ) 
}

//************************ OBTENER FECHA ***************************
// obtener_fecha() {
//   return new Date().getFullYear() + '-' + 
//   String(new Date().getMonth() + 1).padStart(2, '0') + '-' + 
//   String(new Date().getDate()).padStart(2, '0');;
// }
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
//******************* VERIFICAR DATOS DE INSUMOS ADICIONADOS **********************
//Verificar si de la lista de Insumos sus datos son >0 o !=null
insumosValidos_Entrada(): boolean {//Si todos los elementos del array cumplen la condición de la función de prueba, every devuelve true.
  return this.detalleMovimientoForm.every(ins => ins.cantidad > 0 && ins.precio > 0 && ins.cantidad !== null && ins.precio !== null);
}
insumosValidos_Salida_Merma(): boolean {//Si todos los elementos del array cumplen la condición de la función de prueba, every devuelve true.
  //Hay que cambiar el >=0 por >0 ya que no queremos cantidad de 0
  return this.detalleMovimientoForm.every(ins => ins.cantidad > 0 && ins.cantidad !== null && ins.existencia_actual>=Number(ins.cantidad));
}


//******************* VERIFICAR SI FECHA ES CORRECTA **********************
verificar_fecha() : boolean{
  //Verificamos si la fecha es menor a la otra
  const dateI = new Date(this.selectFecha.fechaI);
  const dateF = new Date(this.selectFecha.fechaF);
  if (this.tipo_Fecha == "single" && this.selectFecha.fechaI) {
    return true;
  }else{
    return dateI < dateF;
  }
}
//******************* VERIFICAR SI FECHA ES CORRECTA **********************
isFormValid_Fecha() : boolean{
  
  const dateI = this.selectFecha.fechaI ? new Date(this.selectFecha.fechaI) : null;
  const dateF = this.selectFecha.fechaF ? new Date(this.selectFecha.fechaF) : null;
  this.mostrarAdvertenciasFechaI=true;

  // Condiciones para que el formulario sea válido:
  // 1. Ambos campos de fecha no están vacíos y la fecha inicial es menor a la fecha final
  // 2. La fecha inicial está llena y la fecha final está vacía
  if (dateI && dateF && (dateI > dateF)) { 
    //console.log(">");
    this.mostrarAdvertenciasFechaI=false;
    this.mostrarAdvertenciasFecha=true;
    return false;
  }else if (dateI && dateF && (dateI < dateF)) {
    this.mostrarAdvertenciasFechaI=false;
    this.mostrarAdvertenciasFecha=false;
    return true;
  }
  if (dateI && (!isNaN(dateI.getTime()))) {
    //console.log("!");
    this.mostrarAdvertenciasFechaI=false;
    this.mostrarAdvertenciasFecha=false;
    this.selectFecha.fechaF='';
    return true; // Fecha inicial llena, fecha final vacía
  }  

  // console.log("nadie");
  return false; // Si ambos campos están vacíos, es inválido
}
//******************* TRANSFORMAR FECHA DE (0000-00-00) A (00/00/0000) **********************
transformar_Fecha(fecha: string): string {
  // Convert the date string to a Date object
  const [year, month, day] = fecha.split('-').map(Number);
  // Create a new Date object using the date parts
  const date = new Date(year, month - 1, day); // month - 1 because months are 0-indexed

  // Get the day, month, and year from the Date object
  const dayStr = String(date.getDate()).padStart(2, '0');
  const monthStr = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
  const yearStr = date.getFullYear();

  // Return the formatted date string
  return `${dayStr}/${monthStr}/${yearStr}`;
}

//******************* TRANSFORMAR FECHA DE (00/00/0000) A (0000-00-00) **********************
transformar_Fecha_AlReves(fecha: string): string {
  // Split the date string into day, month, and year parts
  const [day, month, year] = fecha.split('/').map(Number);

  // Return the formatted date string
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

//******************* LIMPIAR DATOS MOVIMIENTO **********************
limpiar_datos_movimiento(){
  this.movimientoForm={cod_mov:null,cod_diario:null,movimiento:0,precio:0,ps_precio:0, tipo_cambio:null as number | null, cod_proveedor:null,ci_usuario:0,descripcion:'',cod_doc:null,fecha:'',hora:'',estado:0,origen:0};
  this.detalleMovimientoForm=[];
  this.insumoSeleccionado=null;
  // cantidad:null as number | null =Permite null y number
  this.insumo_adicionar={lote:0,cod_mov:'',cod_insumo:'',nombre:'',nom_medida:'', precio:null as number | null,precio_unidad:0,cantidad:null as number | null,existencia:0,existencia_actual:0};
}


//******************* DIGERENTES FONDOS PARA LA LISTA MOVIMIENTOS DETALLES TODO **********************
// codMovAnterior: number | null = null;
// claseFondoAnterior: string = 'background-default';
// obtenerClaseFondo(movimiento: any, index: number, j: number): string {
//   // Obtenemos el `cod_mov` actual
//   const codMovActual = movimiento.cod_mov;

//   // Verificamos si el `cod_mov` actual es diferente al anterior
//   if (this.codMovAnterior !== codMovActual) {
//     // Si son diferentes, alternamos la clase de fondo entre 'fondo-default' y 'fondo-alternate'
//     if (this.claseFondoAnterior === 'background-default') {
//       this.claseFondoAnterior = 'background-alternate';
//     } else {
//       this.claseFondoAnterior = 'background-default';
//     }
//   }

//   // Guardamos el `cod_mov` actual como el anterior para la siguiente iteración
//   this.codMovAnterior = codMovActual;

//   // Devolvemos la clase asignada
//   return this.claseFondoAnterior;
// }

//********************************************************* FORMULARIOS *********************************************************
//*******************************************************************************************************************************
//********************* VERIFICAR SI EL FORM-INSUMO SELECCIONADO ES VALIDO *********************
isFormInsumoValid():boolean{
  const nombre = this.insumoForm.nombre ||''; console.log(nombre);
  const descripcion = this.insumoForm.descripcion || '';
  // return false;
  return nombre.trim().length>0 && descripcion.trim().length>0 && this.insumoForm.medida !=0;
}
resetearFormularioInsumo(){
  this.formInsumo.resetForm();
  this.mostrarAdvertenciasInsumo = false;
  this.insumoForm={cod_insumo:0,nombre:'',medida:0,existencia:0,descripcion:'',vender_negativo:0,habilitar_stock:0,estado:0,};
}
resetearFormularioMovimiento(){
  if (this.formMovimiento != undefined) {
    this.formMovimiento.resetForm();
  }
  if (this.formInsumoSelected != undefined) {
    this.formInsumoSelected.resetForm();
  }

  this.mostrarAdvertenciaMovimiento = false;
  this.mostrarAdvertenciaSeleccionado = false;

  this.limpiar_datos_movimiento();
}


//********************* VERIFICAR SI EL MOVIMIENTO-FORM ES VALIDO *********************
isFormMovimientoValid():boolean{
    //VERIFICAR CANTIDAN CORRECTA DEL INSUMO
    var insumo_opcion=true;
    if (this.detalleMovimientoForm.length >0) {
      this.detalleMovimientoForm.forEach(insumo => {
        if ((insumo.cantidad <=0 || insumo.precio <=0) && this.movimientoForm.movimiento == 1) { console.log('Verifica Entrada');
        
          insumo_opcion=false;
        }else if (insumo.cantidad <=0 && this.movimientoForm.movimiento > 1) { console.log('Verifica Salida');
          insumo_opcion=false;
        }
        if (insumo.cantidad > insumo.existencia && this.movimientoForm.movimiento >1) {console.log('Verifica Cantidad > Insumo-Existencia');
          insumo_opcion = false;
        }
      });
    }
    console.log('Resultado insumo_opcion: ',insumo_opcion);
    
  const fecha= this.transformar_Fecha(this.fecha_movimiento) || ''; 
  const movimiento = this.movimientoForm.movimiento; const descripcion = this.movimientoForm.descripcion || ''; const cod_proveedor = this.movimientoForm.cod_proveedor || null;
  // return fecha.trim().length>0 && movimiento != 0 && descripcion.trim().length>0 && cod_proveedor!=null;  // Tiene el proveedor tambien
  return fecha.trim().length>0 && movimiento != 0 && descripcion.trim().length>0 && insumo_opcion;
}
//********************* VERIFICAR SI EL INSUMO SELECCIONADO YA ESTA AGREGADO *********************
existeInsumoSeleccionado(): boolean {
  if (this.insumoSeleccionado) {
    this.insumo_adicionar.cod_insumo=this.insumoSeleccionado.cod_insumo; 
  }
  return this.detalleMovimientoForm.some((ins: { cod_insumo: any; }) => ins.cod_insumo === this.insumo_adicionar.cod_insumo);
}

//********************* VERIFICAR SI EL INSUMO-SELECCIONADO ES VALIDO *********************
isFormInsumoSelectedValid():boolean{
  const cantidad = this.insumo_adicionar.cantidad || 0; const precio = this.insumo_adicionar.precio || 0;
  let tipo_cambio = this.movimientoForm.tipo_cambio; 
  // `tipo_cambio` es válido si es `null` o mayor a 0.
  const tipo_cambioValido = tipo_cambio === null || tipo_cambio > 0;
  console.log(tipo_cambioValido);
  
  return this.insumoSeleccionado && cantidad>0  && precio>0 && tipo_cambioValido;
}

isFormInsumoSelectedValidSalida(){
  const cantidad = this.insumo_adicionar.cantidad || 0; 
  console.log('Insumo Seleccionado:: ',this.insumoSeleccionado);
  
  return this.insumoSeleccionado && cantidad>0 && cantidad<= this.insumoSeleccionado.existencia;
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
