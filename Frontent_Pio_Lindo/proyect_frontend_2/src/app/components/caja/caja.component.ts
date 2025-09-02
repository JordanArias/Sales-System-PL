import { Component, ViewChild, Renderer2 } from '@angular/core';
import { CajaService } from "../../services/caja.service";
import * as bootstrap from 'bootstrap';
import { NgForm } from '@angular/forms';

declare var $: any
@Component({
  selector: 'app-caja',
  templateUrl: './caja.component.html',
  styleUrls: ['./caja.component.css']
})
export class CajaComponent {
  today: string;
  @ViewChild('formCaja') formCaja: any;
  @ViewChild('formAjuste') formAjuste: any;
  @ViewChild('formFecha') formFecha: any;
  constructor( 
    private cajaService:CajaService,
    private renderer: Renderer2,
    ){
      this.listar_Cajas();
      // Obtener la fecha actual en formato 'YYYY-MM-DD'
      this.today = this.getTodayDate();
      console.log("TODAY::",this.today);
      
   }

  page: number = 1; // Página inicial
  page_ajuste: number = 1; // Página modal ajutes
  filterPost='';
//*************************************************************************************************************************** 
//*********************************************************  MODALES  *******************************************************
//***************************************************************************************************************************

showModal_Caja(): void {
  if (this.ultima_caja && this.ultima_caja.estado==0) { 
    console.log("Cerrar ultima Caja");
    this.mostrarToast('Debe cerrar la última Caja', 'rojo');
    $("#modalCaja").modal('hide');
    return;
  }
  //SINO ES AGREGAR Y LIMPLIAMOS LA CAJA FORM
  this.caja_form = {cod_caja:0, fecha_i:'', hora_i:'', tipo_cambio:null as number|null, bs_saldoi:null as number|null, ps_saldoi:null as number|null, estado:0, ci_usuario_i:0 , bs_saldo_pre:0, ps_saldo_pre:0 }; // Valores iniciales
  $("#modalCaja").modal('show');
}

showModal_Ajustes(caja:any){
  this.caja_form = { ...caja};
  $("#modalAjuste").modal('show');
}
showModal_Cerrar(caja:any){
  this.caja_form = { ...caja};
  $("#modalCerrarCaja").modal('show');
}
showModalSelectFecha():void{
  this.selectFecha.fechaI= this.obtener_fecha();
  this.selectFecha.fechaF= this.selectFecha.fechaI;
  $("#modalSelectFecha").modal('show');
}

caja = {
  fecha: '27/08/2024',                   // Fecha de cierre (fecha_c)
  hora: '22:40',                         // Hora de cierre (hora_c)
  tipo_cambio:0,                         // Tipo de cambio en Pesos Argentino
  bs_saldo_pre: null as number | null,   // Saldo preliminar en Bs (null inicialmente)
  ps_saldo_pre: null as number | null,   // Saldo preliminar en PS (null inicialmente)
  bs_ajuste: null as number | null,      // Ajuste en Bs (puede ser null)
  ps_ajuste: null as number | null,      // Ajuste en PS (puede ser null)
  bs_saldo: 0,                           // Saldo en Bs
  ps_saldo: 0,                           // Saldo en PS
  tipo: 0,                               // Tipo de ajuste
  descripcion: '',                       // Descripción del ajuste
  ci_usuario: 8540205,                   // CI del usuario (ci_usuario_c)
  cod_caja: 17,                          // Código de caja (cod_caja)

  // Datos adicionales
  banca_ingreso: 0,                      // Ingreso por ventas en banco
  bs_bruto: 0,                           // Saldo bruto en Bs
  bs_descuento: 0,                       // Descuento en Bs
  bs_egreso: 0,                          // Egreso en Bs
  bs_ingreso: 0,                         // Ingreso de ventas en Bs
  bs_insumo: 0,                          // Costo de insumo en Bs
  bs_saldo_final: null as number | null, // Saldo final en Bs
  bs_saldoi: 100,                        // Saldo inicial en Bs
  ci_usuario_c: 8540205,                 // CI del usuario que cerró la caja
  ci_usuario_i: 8540205,                 // CI del usuario que aperturó la caja
  estado: 1,                             // Estado de la caja
  fecha_c: '27/08/2024',                 // Fecha de cierre
  fecha_i: '26/08/2024',                 // Fecha de apertura
  hora_c: '22:40',                       // Hora de cierre
  hora_i: '23:07',                       // Hora de apertura


  ps_egreso: 0,                          // Egreso en PS
  ps_ingreso: 0,                         // Ingreso de ventas en PS

  bs_iva:0,                              // Costo IVA
  ps_saldo_final: null as number | null, // Saldo final en PS
  ps_saldoi: 1000                        // Saldo inicial en PS
};
paginacionActiva: boolean = true; // Control de paginación principal
showModal_Reporte(caja:any){
  this.caja = { ...caja};
  console.log(this.caja);
  this.GET_AJUSTES_CAJA();
  this.paginacionActiva = false; // Desactivar paginación principal
  $("#modalReporteCaja").modal('show');
}
cerrarModal_Reporte() {
  this.paginacionActiva = true; // Reactivar paginación principal
  $("#modalReporteCaja").modal('hide');
}
//******************************************************************************************************************************************************* 
//************************************************************************  CAJAS  **********************************************************************
//******************************************************************************************************************************************************* 

//*********************************************************** LISTAR CAJAS ************************************************************
//*************************************************************************************************************************************
ultima_caja:any;
//----------------------------------- 
fecha_inicial = ''; fecha_final = '';
lista_cajas:any[]=[];
listar_Cajas(){
  this.cajaService.get_Caja_Api(this.fecha_inicial, this.fecha_final)
  .subscribe(
    res => {
      this.lista_cajas = res;
      //SI LA FECHA INICIAL ESTA VACIA OBTENEMOS ULTIMA CAJA POR QUE AL COMIENZO SIEMPRE SE OBTENDRA LAS ULTIMAS LISTAS DE CAJAS
      if (this.fecha_inicial=='') {
        this.ultima_caja = { ...this.lista_cajas[0]};
      }
      console.log('Lista Cajas',this.lista_cajas);
      console.log('Ultima Caja',this.ultima_caja);
    },
    err =>{
      console.log('Error al agregar Productos: ', err);
    }
  ) 
}

//*********************************************************** AGREGAR CAJA ************************************************************
//************************************************************************************************************************************* 
mostrarAdvertencias: boolean = false;
caja_form = {cod_caja:0, fecha_i:'', hora_i:'',tipo_cambio:null as number|null, bs_saldoi:null as number|null, ps_saldoi:null as number|null, estado:0, ci_usuario_i:0, bs_saldo_pre:0, ps_saldo_pre:0 };
AGREGAR_CAJA(){
  
  //PRIMERO VERIFICAMOS EL FORMULARIO
  this.mostrarAdvertencias = true; // Activa las advertencias cuando se presiona el botón
  if (!this.isFormValid()) {
    console.log('INVALIDO::');  
    return;
  }
  //SI LA ULTIMA CAJA ESTA ABIERTA ENTONCES...
  console.log(this.ultima_caja);
  
  if (this.ultima_caja && this.ultima_caja.estado==0) { 
    console.log("Cerrar ultima Caja");
    this.mostrarToast('Debe cerrar la última Caja', 'rojo');
    $("#modalCaja").modal('hide');
    return;
  }
  //AGREGAMOS FECHA Y HORA A CAJA_FORM
  this.caja_form.fecha_i = this.obtener_fecha();
  this.caja_form.hora_i = this.obtener_hora();
  this.caja_form.ci_usuario_i = this.obtener_Usuario();
  //SI UNO ES NULL PONEMOS 0
  if (this.caja_form.bs_saldo_pre == null) { this.caja_form.bs_saldo_pre == 0; };
  if (this.caja_form.ps_saldo_pre == null) { this.caja_form.ps_saldo_pre == 0; };
  console.log('CAJA FORM: ', this.caja_form);

  this.cajaService.post_Caja_Api(this.caja_form)
  .subscribe(
    res => {
      console.log('CAJA AGREGADA');
      this.fecha_inicial=''; this.fecha_final='';
      this.mostrarToast('Caja agregada', 'verde');
      this.listar_Cajas();
      $("#modalCaja").modal('hide');
    },
    err =>{
      console.log('Error al agregar Productos: ', err);
      this.mostrarToast('Error al agregar caja','rojo');
    }
  ) 

}
//****************************************************** AGREGAR AJUTE DE CAJA ********************************************************
//************************************************************************************************************************************* 
mostrarAdvertenciasAjuste: boolean = false;
ajuste_form = {fecha:'', hora:'', bs_saldo_pre:0, ps_saldo_pre:0, bs_ajuste:null as number|null, ps_ajuste:null as number|null, bs_saldo:0, ps_saldo:0, tipo:0, descripcion:'', ci_usuario:0, cod_caja:0};
CREAR_AJUSTE(){
  //PRIMERO VERIFICAMOS EL FORMULARIO
  this.mostrarAdvertenciasAjuste = true; // Activa las advertencias cuando se presiona el botón
  if (!this.isFormValid_Ajuste()) {
    console.log('INVALIDO::');
    return;
  }
  //AGREGAMOS LOS DATOS FALTANTES AL FORMULARIO
  this.ajuste_form.fecha = this.obtener_fecha();
  this.ajuste_form.hora = this.obtener_hora();
  this.ajuste_form.ci_usuario = this.obtener_Usuario();
  this.ajuste_form.cod_caja = this.caja_form.cod_caja
  this.ajuste_form.tipo = Number(this.ajuste_form.tipo);

  //SI UNO ES NULL PONEMOS 0
  if (this.ajuste_form.bs_ajuste == null) { this.ajuste_form.bs_ajuste = 0; };
  if (this.ajuste_form.ps_ajuste == null) { this.ajuste_form.ps_ajuste = 0; };

  console.log("AJUSTE ::: ",this.ajuste_form);
  this.cajaService.post_Ajuste_Api(this.ajuste_form)
  .subscribe(
    res => {
      console.log('CAJA AGREGADA: ',res);
      this.listar_Cajas();
      this.mostrarToast('Ajuste agregado', 'verde');
      $("#modalAjuste").modal('hide');
    },
    err =>{
      console.log('Error al agregar ajuste: ', err);
      this.mostrarToast('Error: '+err, 'rojo');
    }
  ) 

}


//************************************************************* CERRA CAJA ************************************************************
//************************************************************************************************************************************* 
CERRAR_CAJA(){
  const fecha_c = this.obtener_fecha();
  const hora_c = this.obtener_hora();
  const ci_usuario_c = this.obtener_Usuario();
  const datos = {cod_caja:this.caja_form.cod_caja,fecha_c: fecha_c, hora_c: hora_c, ci_usuario_c:ci_usuario_c}
  this.cajaService.put_CerrarCaja_Api(datos)
  .subscribe(
    res => {
      console.log('CAJA CERRADA');
      this.fecha_inicial=''; this.fecha_final='';
      this.listar_Cajas();
      this.mostrarToast('Caja cerrada', 'verde');
      $("#modalCerrarCaja").modal('hide');
    },
    err =>{
      console.log('Error al agregar Productos: ', err);
      this.mostrarToast('Error al cerrar la caja', 'rojo');
    }
  ) 
}

lista_ajustes:any;
GET_AJUSTES_CAJA(){
  this.cajaService.get_AjustesCaja_Api(this.caja.cod_caja)
  .subscribe(
    res => {
      this.lista_ajustes = res;
      console.log('Lista Ajuste-Cajas',this.lista_ajustes);
    },
    err =>{
      console.log('Error al obtener ajustes: ', err);
    }
  ) 
}

//******************************************************* FILTRAR CAJA POR FECHAS ****************************************************
//************************************************************************************************************************************
mostrarAdvertenciasFechaI: boolean = false; mostrarAdvertenciasFecha: boolean = false;
selectFecha={fechaI:'',fechaF:''};
listaMovimientos:any;
FILTRAR_CAJA(){
  this.mostrarAdvertenciasFechaI=true;
  if (!this.isFormValid_Fecha()) {
    console.log('Fecha Invalida'); 
    return
  }
  console.log("1.- FECHA I A BUSCAR:",this.selectFecha.fechaI);
  console.log("1.- FECHA F A BUSCAR:",this.selectFecha.fechaF);
  
  let fechaI = this.transformar_Fecha2(this.selectFecha.fechaI);
  let fechaFin='';
  if (fechaI && !isNaN(fechaI.getTime()) && this.selectFecha.fechaF =='') { console.log('SOLO FECHA I');
    const unDia = 24 * 60 * 60 * 1000; // milisegundos en un día
    const fechaF_Date = new Date(fechaI.getTime() + unDia);
    fechaFin = this.transformar_Fecha(fechaF_Date);
  }else{console.log('AMBAS FECHAS');
    fechaFin = this.transformar_Fecha(this.transformar_Fecha2(this.selectFecha.fechaF));
  }
  const fechaIni = this.transformar_Fecha(fechaI);

  console.log(fechaIni, fechaFin);

  //GUARDAMOS LAS FECHAS CORRESPONDIENTES
  this.fecha_inicial = fechaIni;   this.fecha_final = fechaFin; 
  console.log("FECHA I A BUSCAR:",this.fecha_inicial);
  console.log("FECHA F A BUSCAR:",this.fecha_final);
  
  //LISTAMOS CAJA CON LAS FECHAS CORRESPONDIENTES
  this.listar_Cajas();

  //CERRAMOS EL MODAL
  $("#modalSelectFecha").modal('hide');
}


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




//*************************************************************************************************************************************** 
//**********************************************************  FUNCIONES EXTRAS  *********************************************************
//***************************************************************************************************************************************
vista_reporte=1;
cambiarVista_Reporte(number:any){
  this.vista_reporte = number; 
}



//**************************************************  FORMULARIOS  **************************************************
//********************************************************************************************************************

//********************* VERIFICAR SI EL FORMULARIO FORM-OPCION ES VALIDO  *********************
isFormValid(): boolean {
  const bs_saldoi = this.caja_form.bs_saldoi || 0;    const ps_saldoi = this.caja_form.ps_saldoi || 0;  const cambio = this.caja_form.tipo_cambio || 0; 
  return ((bs_saldoi > 0 && ps_saldoi > 0) || (bs_saldoi > 0 && ps_saldoi <= 0) || (ps_saldoi > 0 && bs_saldoi <= 0)) && cambio > 0;
}

//********************* RESETEAR FORMULARIO AL CERRAR EL MODAL *********************
resetFormCaja() {
  this.formCaja.resetForm();
  this.mostrarAdvertencias = false;
  this.caja_form = {cod_caja:0, fecha_i:'', hora_i:'', tipo_cambio:null as number|null, bs_saldoi:null as number|null, ps_saldoi:null as number|null, estado:0, ci_usuario_i:0, bs_saldo_pre:0, ps_saldo_pre:0 }; // Valores iniciales
}


//********************* VERIFICAR SI EL FORMULARIO FORM-OPCION ES VALIDO  *********************
isFormValid_Ajuste(): boolean {
  const bs_ajuste = this.ajuste_form.bs_ajuste || 0;  console.log("BS_AJUSTE: ",bs_ajuste);
  const ps_ajuste = this.ajuste_form.ps_ajuste || 0;  console.log("PS_AJUSTE: ",ps_ajuste);
  const descripcion = this.ajuste_form.descripcion || '';
  const tipo = this.ajuste_form.tipo || 0;
  const bs_saldo_pre = this.caja_form.bs_saldo_pre || 0; console.log("BS_SALDO_PRE: ",bs_saldo_pre);
  const ps_saldo_pre = this.caja_form.ps_saldo_pre || 0;  console.log("PS_SALDO_PRE: ",ps_saldo_pre);

  // Verifica si bs_ajuste y ps_ajuste son mayores a 0 o si uno de ellos es >0
  const ajusteValido = (bs_ajuste > 0 && ps_ajuste > 0) || (bs_ajuste > 0 && ps_ajuste <= 0) || (ps_ajuste > 0 && bs_ajuste <= 0);

  // Verifica que en caso de salida (tipo = 2), bs_ajuste no sea mayor al saldo en caja
  const ajusteSalidaValido = tipo != 2 || (bs_ajuste <= bs_saldo_pre && ps_ajuste <= ps_saldo_pre);  console.log("Ajuste Salida",ajusteSalidaValido);
   
  // Valida que los otros campos también sean correctos
  return ajusteValido && descripcion != null && descripcion.length > 0 && tipo != 0 && ajusteSalidaValido;
}


//********************* RESETEAR FORMULARIO AL CERRAR EL MODAL *********************
resetForm_Ajuste() {
  console.log("RESET AJUSTE");
  
  this.formAjuste.resetForm();
  this.mostrarAdvertenciasAjuste = false;
  this.ajuste_form = {fecha:'', hora:'', bs_saldo_pre:0, ps_saldo_pre:0, bs_ajuste:null as number|null, ps_ajuste:null as number|null, bs_saldo:0, ps_saldo:0, tipo:0, descripcion:'', ci_usuario:0, cod_caja:0};
  this.caja_form = {cod_caja:0, fecha_i:'', hora_i:'', tipo_cambio:null as number|null, bs_saldoi:null as number|null, ps_saldoi:null as number|null, estado:0, ci_usuario_i:0, bs_saldo_pre:0, ps_saldo_pre:0 }; // Valores iniciales
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


//**************************************************  FECHA Y HORA  **************************************************
//********************************************************************************************************************
//************************ OBTENER FECHA 00-00-0000 ***************************
getTodayDate(): string {
  const todayDate = new Date();
  const year = todayDate.getFullYear();
  const month = String(todayDate.getMonth() + 1).padStart(2, '0'); // Los meses son indexados desde 0
  const day = String(todayDate.getDate()).padStart(2, '0'); // Obtener el día en formato 'DD'
  return `${year}-${month}-${day}`; // Formato 'YYYY-MM-DD'
}
//************************ OBTENER FECHA 00/00/0000***************************
obtener_fecha() {
  return String(new Date().getDate()).padStart(2, '0') + '/' + 
         String(new Date().getMonth() + 1).padStart(2, '0') + '/' + 
         new Date().getFullYear();
}

//************************ OBTENER HORA ***************************
obtener_hora(){
  const ahora = new Date();
  const hora = ahora.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  return hora;
}

obtener_Usuario(){
  var usuario;
  const ci_usuario=localStorage.getItem('ci_usuario') 
  if (ci_usuario!==null) {
    usuario=JSON.parse(ci_usuario);
  }
  return usuario;
}

//******************* TRANSFORMAR FECHA DE (0000-00-00) A (00/00/0000) **********************
transformar_Fecha(fecha: any): string {
  console.log('Split Fecha:', fecha);
  const dia = fecha.getUTCDate().toString().padStart(2, '0');
  const mes = (fecha.getUTCMonth() + 1).toString().padStart(2, '0');
  const anio = fecha.getUTCFullYear();
  return `${dia}/${mes}/${anio}`;
}


//******************* TRANSFORMAR FECHA DE (00/00/0000) A (0000-00-00)  **********************
transformar_Fecha2(fecha: string): Date | null {
  // Aquí se asume que la fecha está en formato 'YYYY-MM-DD' como en tu log
  return fecha ? new Date(fecha) : null;
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



