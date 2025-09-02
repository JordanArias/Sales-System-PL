import { Component, ViewChild, Renderer2 } from '@angular/core';
import { ProductosService } from "../../../services/productos.service";
import { InsumosService } from "../../../services/insumos.service";
import * as bootstrap from 'bootstrap';
import { NgForm } from '@angular/forms';

// This lets me use jquery
declare var $: any
@Component({
  selector: 'app-opciones',
  templateUrl: './opciones.component.html',
  styleUrls: ['./opciones.component.css']
})
export class OpcionesComponent {
  @ViewChild('formOpcion') formOpcion: any;
  @ViewChild('formInsumo') formInsumo: any;
  constructor(
    private insumoService:InsumosService,
    private productoService:ProductosService,
    private renderer: Renderer2
  ){
    this.listar_opciones();
    this.listar_Insumos();
  }
page: number = 1; // Página inicial
filterPost='';
//*************************************************************************************************************************** 
//********************************************************  MODALES  ********************************************************
//***************************************************************************************************************************
proceso=0;
//********************** AGREGAR OPCION *************************
showModalAgregar_Opcion():void{
  this.proceso=1;
  $("#modalAgregarOpcion").modal('show');
}

//********************** AGREGAR OPCION *************************
showModalModificar_Opcion(opcion:any):void{
  this.proceso=2;
  this.agregar_Datos_al_Formulario(opcion);
  $("#modalAgregarOpcion").modal('show');
}
//********************** ELIMINAR OPCION *************************
showModalEliminar_Opcion(opcion:any):void{
  this.opcionForm = { ...opcion}
  $("#modalEliminarOpcion").modal('show');
}
//********************** ESTADO OPCION *************************
estado=0;
showModalEstado_Opcion(opcion:any):void{
  if (opcion.estado == 0) {
    this.estado = 1;
  }else{this.estado = 0;}
  this.opcionForm = { ...opcion};
  
  $("#modalEstadoOpcion").modal('show');
}
//*************************************************************************************************************************** 
//********************************************************  OPCIONES  *******************************************************
//***************************************************************************************************************************

//*************************************************** LISTAR OPCIONES  *******************************************************
p: number = 1; // Página actual
lista_opciones:any
lista_insumo_opcion:any
listar_opciones(){
  this.productoService.getOpcionesApi()
  .subscribe(
    res => {
      this.lista_opciones = res[0];
      this.lista_insumo_opcion = res[1];
      // Reasignar el estado de la página después de actualizar la lista
      // this.p = this.p;
      console.log('Lista Opciones: ', this.lista_opciones); console.log('Lista Insumo-Opciones: ', this.lista_insumo_opcion);
      this.seleccionarOpcion(this.opcionSeleccionada);   
    },
    err => console.log('Error al obtener opciones')
  ) 
}

//*************************************************** AGREGAR OPCION *******************************************************
//***************************************************************************************************************************
//Insumo Seleccionado 
insumo_Seleccionado:any=null;
insumos_opcion:any[]=[]; 
insumo_opcion_Seleccionado={cod_insumo:0, nom_insumo:'',nom_medida:'', cod_opcion:0, cantidad:null as number | null, repetido:0};
opcionForm={cod_opcion:0, nombre:'', medida:0 , descripcion:'',habilitar_limite:false,vender_negativo:false,estado:0, cod_complemento:0};

//AGREGAMOS LOS INSUMOS-SUBRECETAS SELECCIONADOS
mostrarAdvertenciasInsumo: boolean = false;
adicionar_Insumo_Opcion(form:NgForm){
  //PRIMERO VERIFICAMOS EL FORMULARIO
  this.mostrarAdvertenciasInsumo = true; // Activa las advertencias cuando se presiona el botón
  if (!this.isFormIsumoValid()) {
    return;
  }
 
  //Agregamos insumo_Seleccionado a insumo_subreceta_Seleccionado
  this.insumo_opcion_Seleccionado.cod_insumo=this.insumo_Seleccionado.cod_insumo;
  this.insumo_opcion_Seleccionado.nom_insumo=this.insumo_Seleccionado.nombre;
  this.insumo_opcion_Seleccionado.nom_medida=this.insumo_Seleccionado.nom_medida;


  // Verificamos si el insumo ya existe en la lista
  if (this.existeInsumoSeleccionado()) {
    console.log('El insumo ya existe en la lista.');
    return;
  }

  //Agregamos a la lista de subrecetas
  console.log('Push:::::');
  this.insumos_opcion.push(this.insumo_opcion_Seleccionado);
  
  //Limpiamos los datos
  this.insumo_opcion_Seleccionado={cod_insumo:0, nom_insumo:'',nom_medida:'', cod_opcion:0, cantidad:null as number | null, repetido:0}
  // this.insumo_Seleccionado=null;
  form.resetForm();
  this.mostrarAdvertenciasInsumo = false; // Desactivamos las advertencias
}
eliminar_Insumo_Opcion(index: number) {
  this.insumos_opcion.splice(index, 1);
}

//*********************** AGREGAR OPCION **********************************
mostrarAdvertencias: boolean = false;
agregar_Opcion(){
  //PRIMERO VERIFICAMOS EL FORMULARIO
  this.mostrarAdvertencias = true; // Activa las advertencias cuando se presiona el botón
  if (!this.isFormValid()) {
    // Código para manejar el caso cuando el formulario no es válido
    return;
  }
  //AGREGAMOS EL COD_OPCION Y COD_COMPLEMENTO
  this.opcionForm.cod_opcion = this.obtener_CodOpcion();

  // this.lista_opciones.push(this.opcionForm);
  console.log('Insumos Opcion: ',this.insumos_opcion);
  console.log('Opcion Form: ',this.opcionForm);

  const datos=[this.opcionForm, this.insumos_opcion]

    this.productoService.postOpcionesApi(datos)
    .subscribe(
      res => {
        console.log(res);
        console.log('Página actual después de agregar:', this.p); // Verifica el valor de p
        this.limpiar_Datos();
        this.listar_opciones();
        this.mostrarToast('Opción agregada','verde');
      },
      err =>{ 
        console.log('Error al agregar la opcion:', err);
        this.mostrarToast('Error al agregar opción','rojo');
      }
    ) 
  $("#modalAgregarOpcion").modal('hide');
}

//**************************************************** MODIFICAR OPCION *****************************************************
//***************************************************************************************************************************
agregar_Datos_al_Formulario(opcion:any){
  //1RO: AGREGAMOS LOS DATOS DE LA OPCION SELECCIONADA AL FORMULARIO
  this.opcionForm = { ...opcion};
  //2DO: FILTRAMOS DE LA LISTA INSUMOS-OPCIONES DEL INSUMO RELACIONADO A LA OPCION SELECCIONADA A MODIFICAR
  const insumo_opcion = this.lista_insumo_opcion.filter((op: { cod_opcion: any; }) =>op.cod_opcion === opcion.cod_opcion);
  //3RO: AGREGAMOS LOS DATOS AL FORMULARIO INSUMO_OPCION
  this.insumos_opcion = insumo_opcion.map((op: any) => ({ ...op }));
}

modificar_Opcion(){
  //PRIMERO VERIFICAMOS EL FORMULARIO
  this.mostrarAdvertencias = true; // Activa las advertencias cuando se presiona el botón
  if (!this.isFormValid()) {
    // Código para manejar el caso cuando el formulario no es válido
    return;
  }

  // this.lista_opciones.push(this.opcionForm);
  console.log('Insumos Opcion: ',this.insumos_opcion);
  console.log('Opcion Form: ',this.opcionForm);

  const datos=[this.opcionForm, this.insumos_opcion]

    this.productoService.putOpcion(datos)
    .subscribe(
      res => {
        console.log(res);
        this.restearFormularios();
        this.limpiar_Datos();
        this.listar_opciones();
        this.mostrarToast('Opción modificada','verde');
      },
      err =>{ 
        console.log('Error al obtener opciones');
        this.mostrarToast('Error modificar la opción','rojo');
      }
    ) 
  $("#modalAgregarOpcion").modal('hide');
}
//**************************************************** ELIMINAR OPCION ******************************************************
//***************************************************************************************************************************
eliminar_Opcion(){
  this.productoService.deleteOpcionApi(this.opcionForm.cod_opcion)
  .subscribe(
    res => {
      this.limpiar_Datos();
      this.listar_opciones();
      this.mostrarToast('Opción eliminada','verde');
    },
    err =>{
      console.log('Error al eliminar opciones: ', err);
      this.mostrarToast('Error al eliminar la opción','rojo');
    } 
  ) 
  $("#modalEliminarOpcion").modal('hide');
}

estado_Opcion(){
  //VERIFICAMOS EL ESTADO PARA CAMBIARLO
  if (this.opcionForm.estado == 1) {
    this.opcionForm.estado = 0;
  }else{this.opcionForm.estado = 1;}
  //MODIFICAMOS EL ESTADO
  this.productoService.putEstadoOpcion(this.opcionForm)
  .subscribe(
    res => {
      //LIMPIAMOS LA OPCION FORM
      this.opcionForm={cod_opcion:0, nombre:'', medida:0 , descripcion:'',habilitar_limite:false,vender_negativo:false,estado:0, cod_complemento:1};
      this.listar_opciones();
      this.mostrarToast('Estado de la opción modificado','verde');
    },
    err =>{
      console.log('Error al modificar estado opciones: ', err);
      this.mostrarToast('Error al modificar el estado de la opción','rojo');
    } 
  ) 
  $("#modalEstadoOpcion").modal('hide');

}

//******************************************************* LISTAR INSUMOS ***************************************************
//************************************************************************************************************************** 
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
     
      console.log('Lista Insumos ::',this.lista_Insumos);
    },
    err => console.log('Error al obtener Productos')
  ) 
}



//*************************************************************************************************************************** 
//***************************************************  FUNCIONES EXTRAS  ****************************************************
//***************************************************************************************************************************
//********************* LIMPIAR DATOS *********************
limpiar_Datos(){
  this.insumo_Seleccionado=null;
  this.insumos_opcion=[]; 
  this.insumo_opcion_Seleccionado={cod_insumo:0, nom_insumo:'',nom_medida:'', cod_opcion:0, cantidad:null as number | null, repetido:0};
  this.opcionForm={cod_opcion:0, nombre:'', medida:0 , descripcion:'',habilitar_limite:false,vender_negativo:false,estado:0, cod_complemento:1};
}
//********************* SELECCIONAR LISTA *********************
opcionSeleccionada: number = 2; // Por defecto mostrar todo
lista_opciones_filtradas: any[] = [];
filtrarLista(){
  if (this.opcionSeleccionada === 2) {
    // Mostrar todos
    this.lista_opciones_filtradas = this.lista_opciones;
  } else {
    // Filtrar por estado (0 o 1)
    this.lista_opciones_filtradas = this.lista_opciones.filter((opcion: { estado: any; }) => opcion.estado === this.opcionSeleccionada);
  }
}

seleccionarOpcion(opcion: number) {
  this.opcionSeleccionada = opcion;
  this.filtrarLista();
}


//********************* RESETEAR FORMULARIO AL CERRAR EL MODAL *********************
resetForm() {
    this.formOpcion.resetForm();
    this.formInsumo.resetForm();
    this.mostrarAdvertencias = false;
    this.mostrarAdvertenciasInsumo = false;
    this.limpiar_Datos();
}
//********************* RESETEAR FORMULARIO AL MODIFICAR O AGREGAR UNA OPCION *********************
restearFormularios(){
  this.formInsumo.resetForm();
  this.formOpcion.resetForm();
  this.mostrarAdvertencias = false;
  this.mostrarAdvertenciasInsumo = false;
}
//********************* OBTENER COD_OPCION DE LA LISTA *********************
obtener_CodOpcion(){
  var cod_opcion
  if (this.lista_opciones.length>0) {
    cod_opcion = this.lista_opciones[this.lista_opciones.length-1].cod_opcion+1;
  }else{
    cod_opcion=1;
  }
  return cod_opcion;
}
//********************* VERIFICAR SI EL FORMULARIO FORM-OPCION ES VALIDO  *********************
isFormValid(): boolean {
  var insumo_opcion=true;
  if (this.lista_insumo_opcion.length >0) {
    this.insumos_opcion.forEach(insumo => {
      if (insumo.cantidad <=0) {
        insumo_opcion=false;
      }
    });
  }
  return this.opcionForm.nombre.trim().length > 0 && this.opcionForm.descripcion.trim().length >0 && insumo_opcion;
}
//********************* VERIFICAR SI EL FORM-INSUMO SELECCIONADO ES VALIDO *********************
isFormIsumoValid():boolean{
  // Retorna true solo si insumo_Seleccionado es válido y cantidad es mayor que 0
  const esValido = this.insumo_Seleccionado != null && this.insumo_opcion_Seleccionado.cantidad != null && this.insumo_opcion_Seleccionado.cantidad > 0;
    
  console.log('Sale:: ', esValido);
  return esValido;
}

//********************* VERIFICAR SI EL FORM-INSUMO SELECCIONADO ES VALIDO *********************
// hayInsumosRepetidos():boolean{
//   //PRIMERO PONEMOS TODOS A REPETIDO = 0
//   this.insumos_opcion.forEach(insumo => {
//     insumo.repetido = 0;
//   });
//   //SEGUNDO: FILTRAMOS LOS INSUMOS REPETIDOS
//   let repetidos = this.insumos_opcion.filter((insumo, index, self) =>
//     self.some((other, otherIndex) => otherIndex !== index && other.cod_insumo === insumo.cod_insumo)
//   );
//   //TERCERO: VERIFICAMOS SI HAY REPETIDOS Y CAMBIAMOS LA LISTA A REPETIDO = 1
//   if (repetidos.length > 0) {
//     console.log('ENTRAMOS');
    
//     //Si hay repetidos buscamos y modificamos la lista actual para que se activen las advertencias
//     repetidos.forEach(repetido => {
//       this.insumos_opcion.forEach(insumo => {
//         if (insumo.cod_insumo === repetido.cod_insumo) {
//           insumo.repetido = 1;
//           console.log(insumo.repetido); 
//         }
//       });
//     });
//     console.log('Existen insumos con cod_insumo repetidos:', this.insumos_opcion);
//     return true;
//   } else {
//     console.log('No hay cod_insumo repetidos.');
//     return false;
//   }
  
// }

//********************* VERIFICAR SI EL INSUMO SELECCIONADO YA ESTA AGREGADO *********************
existeInsumoSeleccionado(): boolean {
return this.insumos_opcion.some((ins: { cod_insumo: any; }) => ins.cod_insumo === this.insumo_opcion_Seleccionado.cod_insumo);
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
