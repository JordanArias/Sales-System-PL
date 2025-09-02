import { Component, Renderer2 } from '@angular/core';
import { ReporteVentasService } from "../../services/reporte-ventas.service";


declare var $: any
@Component({
  selector: 'app-reporte-ventas',
  templateUrl: './reporte-ventas.component.html',
  styleUrls: ['./reporte-ventas.component.css']
})
export class ReporteVentasComponent {

  constructor( 
    private reporteService:ReporteVentasService,
    private renderer: Renderer2,
    ){
      //this.REPORTE_PRODUCTOS();
      //this.REPORTE_OPCIONES();
      this.REPORTE_VENTAS();
      // Obtener la fecha actual en formato 'YYYY-MM-DD'
      this.today = this.getTodayDate();
      console.log("TODAY::",this.today);  
   }


   page: number = 1; // Página inicial
   today: string;
   filterPost='';


   showModalSelectFecha():void{
    this.selectFecha.fechaI= this.getTodayDate();
    this.selectFecha.fechaF= this.selectFecha.fechaI;
    $("#modalSelectFecha").modal('show');
  }

  reporte_vista = 1;
//*********************************************************** LISTAR CAJAS ************************************************************
//*************************************************************************************************************************************
ultima_caja:any;
//----------------------------------- 
fecha_inicial = ''; fecha_final = '';

vista_select=1;
lista_ventas:any[]=[];
REPORTE_VENTAS(){
  this.page=1;
  if (this.fecha_inicial == '') {
    this.fecha_inicial = this.obtener_fecha();
    this.fecha_final = this.obtener_fecha();
  }
  this.reporteService.get_ReporteVentasApi(this.fecha_inicial, this.fecha_final)
  .subscribe(
    res => {
      this.lista_ventas = res;
      console.log(this.lista_ventas);
      
    },
    err =>{
      console.log('Error al obtener Ventas: ', err);
    }
  ) 
}

lista_productos:any[]=[];
REPORTE_PRODUCTOS(){
  this.page=1;
  if (this.fecha_inicial == '') {
    this.fecha_inicial = this.obtener_fecha();
    this.fecha_final = this.obtener_fecha();
  }
  this.reporteService.get_ReporteProductosApi(this.fecha_inicial, this.fecha_final)
  .subscribe(
    res => {
      this.lista_productos = res;
      console.log(this.lista_productos);
      
    },
    err =>{
      console.log('Error al obtener Productos: ', err);
    }
  ) 
}

lista_opciones:any[]=[];
REPORTE_OPCIONES(){
  this.page=1;
  if (this.fecha_inicial == '') {
    this.fecha_inicial = this.obtener_fecha();
    this.fecha_final = this.obtener_fecha();
  }
  this.reporteService.get_ReporteOpcinoesApi(this.fecha_inicial, this.fecha_final)
  .subscribe(
    res => {
      this.lista_opciones = res;
      console.log(this.lista_opciones);  
    },
    err =>{
      console.log('Error al obtener Opciones: ', err);
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

  if (fechaI && !isNaN(fechaI.getTime()) && this.selectFecha.fechaF =='') { 
    console.log('SOLO FECHA I');
    const unDia = 24 * 60 * 60 * 1000; // milisegundos en un día
    const fechaF_Date = new Date(fechaI.getTime() + unDia);
    fechaFin = this.transformar_Fecha(fechaF_Date);
  }
  else{
    console.log('AMBAS FECHAS');
    fechaFin = this.transformar_Fecha(this.transformar_Fecha2(this.selectFecha.fechaF));
  }

  const fechaIni = this.transformar_Fecha(fechaI);

  console.log(fechaIni, fechaFin);

  //GUARDAMOS LAS FECHAS CORRESPONDIENTES
  this.fecha_inicial = fechaIni;   this.fecha_final = fechaFin; 
  console.log("FECHA I A BUSCAR:",this.fecha_inicial);
  console.log("FECHA F A BUSCAR:",this.fecha_final);
  console.log(this.vista_select);
  
  //LISTAMOS REPORTES CON LAS FECHAS CORRESPONDIENTES
  if (this.vista_select == 1) {
    this.REPORTE_VENTAS();
    this.reporte_vista =1;
  }
  if (this.vista_select == 2) {
    this.REPORTE_PRODUCTOS();
    this.reporte_vista =2;
  }
  if (this.vista_select == 3) {
    this.REPORTE_OPCIONES();
    this.reporte_vista =3;
  }

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

}
