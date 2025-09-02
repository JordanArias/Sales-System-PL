import { Component, Renderer2, ViewChild } from '@angular/core';
import {UsuariosService} from "../../services/usuarios.service";
import { DOCUMENT } from '@angular/common';
import * as bootstrap from 'bootstrap';


// This lets me use jquery
declare var $: any
@Component({
  selector: 'app-usuarios',
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.css']
})
export class UsuariosComponent {
  @ViewChild('formUsuario') formUsuario: any;
  @ViewChild('formContra') formContra: any;
  constructor(
    private usuarioService:UsuariosService,
    private renderer: Renderer2,
    // @Inject(DOCUMENT) private document: Document
    )
    { 
      this.ListarUsuarios();
      
    }

filterPost='';
page: number = 1; // Página inicial
//Variable para Listar usuarios
  usuarios:any = [{
    ci_usuario:0,
    nom_usu:'',
    ap_usu:'',
    am_usu:'',
    email:'',
    clave:'',
    cargo:0
  }]

//Variable para Manipular un usuario
  user = {
    ci_usuario:"",
    nom_usu:'',
    ap_usu:'',
    am_usu:'',
    clave:'',
    cod_rol:0,
    cargo:0
  }  
//Variables para eliminar un usuario
  id_user=0;
  nom_user='';

//Variables Roles
  usuario=0;
  producto=0;
  venta=0;
  caja=0;
  cocina=0;
  inventario=0;
  cliente=0;
  reporte=0;
//Variables de error
ciInvalid = false;
ciVacio= false;
formValido = false;

administrarUsuarios: boolean = false;
administrarProductos: boolean = false;
gestionarVentas: boolean = false;
gestionarCaja: boolean = false;
gestionarCocina: boolean = false;
gestionarInventario: boolean = false;
gestionarClientes: boolean = false;
gestionarReporteVentas: boolean = false;


resetCiUsuario: string = '';  // Número de cédula para recuperar contraseña
resetToken: string = '';     // Token de recuperación generado por el backend
newPassword: string = '';    // Nueva contraseña ingresada por el usuario
confirmPassword: string = ''; // Confirmación de la nueva contraseña
mostrarAdvertencia: boolean = false; // Advertencia en caso de error en el formulario


 ngOnInit(){
  this.ListarUsuarios()
 }


 limpiarUserForm(){
  this.user.ci_usuario='',
  this.user.nom_usu='',
  this.user.ap_usu='',
  this.user.am_usu='',
  this.user.clave='',
  this.user.cod_rol=0
 }

//**************************** MODALES DE USUARIO ****************************
  showModalAgregar(modal:any):void{
    this.limpiarUserForm();
    $("#modalAgregarUsuario").modal('show');
  }

  showModalEliminar(modal:any, ci_usuario:any, nom_usu:any):void{
    $("#modalEliminarUsuario").modal('show');
    this.id_user= ci_usuario;
    this.nom_user= nom_usu;
  }

  showModalModificar(usuario:any):void{
    $("#modalModificarUsuario").modal('show');
    //Guardamos los datos del Usuario que se selecciono
    this.user.ci_usuario = usuario.ci_usuario;
    this.user.nom_usu = usuario.nom_usu;
    this.user.ap_usu = usuario.ap_usu;
    this.user.cargo = usuario.cargo;
  }

  showModalRolesUsuario(modal:any,ci_usuario:any):void{
    this.limpiarRoles();
    this.user.ci_usuario = ci_usuario; //Guardamos el ci del usuario seleccionado
    this.ObtenerRolesUsuario();
    $("#modalRolesUsuario").modal('show');
  }

  showModalRecuperarContrasena(): void {
    this.resetCiUsuario = ''; // Limpiamos el campo
    $("#modalRecuperarContrasena").modal('show'); // Mostramos el modal
  }
  showModalRestablecerContrasena(token: string): void {
    this.resetToken = token; // Guardamos el token generado
    this.newPassword = ''; // Limpiamos el campo
    this.confirmPassword = ''; // Limpiamos el campo
    $("#modalRestablecerContrasena").modal('show'); // Mostramos el modal
  }


  enviarSolicitudRecuperacion(user:any): void {
    // if (!this.resetCiUsuario) {
    //     this.mostrarAdvertencia = true; // Mostramos advertencia si el campo está vacío
    //     return;
    // }

    this.usuarioService.iniciarRecuperacion({ ci_usuario: user.ci_usuario })
        .subscribe({
            next: (res: any) => {
                this.resetToken = res.token; // Guardamos el token
                //this.mostrarToast('Token generado. Proceda a restablecer la contraseña.','verde');
                //alert('Token generado. Proceda a restablecer la contraseña.');
                $("#modalRecuperarContrasena").modal('hide'); // Cerramos el modal
                this.showModalRestablecerContrasena(this.resetToken); // Abrimos el modal de restablecimiento
            },
            error: (err) => {
                console.error(err);
                this.mostrarToast('Error al generar el token de recuperación','rojo');
                //alert('Error al generar el token de recuperación');
            }
        });
}


restablecerContrasena() {
  if (this.newPassword.length<=3) {
    this.mostrarAdvertencia=true;
    console.log('Menor a 3');
    
    return;
  }

  if (this.newPassword !== this.confirmPassword) {
    this.mostrarAdvertencia=true;
    console.log('No coinciden');
    //this.mostrarToast('Las contraseñas no coinciden.','rojo');
    //alert('Las contraseñas no coinciden'); // Validación local
    return;
  }

  this.usuarioService.restablecerContrasena({
      token: this.resetToken,
      newPassword: this.newPassword
  }).subscribe({
      next: () => {
          this.mostrarToast('Contraseña actualizada correctamente','verde');
          //alert('Contraseña actualizada correctamente');
          $("#modalRestablecerContrasena").modal('hide'); // Cerramos el modal
      },
      error: (err) => {
          console.error(err);
          alert('Error al restablecer contraseña');
      }
  });
}





  
//************************* VALIDAR FORMULARIO ****************************
  // validarUsuario(){
  //   if (!/^\d+$/.test(this.userPost.ci_usuario)) {
  //     this.ciInvalid = true;
  //   }if (this.userPost.ci_usuario == "") {
  //     this.ciVacio= true;
  //   }
  //   else{
  //     this.ciVacio= false;
  //     this.ciInvalid = false;
  //   }
    
  // }

//************************* CRUD DE USUARIOS ****************************

  ListarUsuarios(){   
    this.usuarioService.getUsuariosApi()
      .subscribe(
        res => {
          console.log('Lista Usuarios::: ',res)
          this.usuarios = res;
        },
        err => console.log('Error al obtener Usuarios')
      ) 
  }

  mostrarAdvertencias: boolean = false;
  AgregarUsuario(){
    if (!this.isValidUsuario()) {
      this.mostrarAdvertencias= true;
      console.log('Invalido');
      return; 
    }
    console.log("ENTRO::" +this.user);  
    this.usuarioService.postUsuarioApi(this.user)
      .subscribe(
        res => {
          console.log('Usuario Agregado');
          localStorage.setItem('token', res.token); //Guardamos en el localStorage el token que nos da al crear un usuario
          this.mostrarToast("Usuario agregado", "verde");
          this.ListarUsuarios(); 
        },
        err => {
          console.log(err);
          this.mostrarToast("Error al agregar usuario", "rojo");
        } 
      )
      $("#modalAgregarUsuario").modal('hide'); 
  }

  ModificarUsuario(){
    if (!this.isValidUsuarioMod()) {
      this.mostrarAdvertencias= true;
      console.log('Invalido');
      return; 
    }
    //Enviar a servidor
    console.log("ENTRO::" +this.user);  
    this.usuarioService.putUsuarioApi(this.user)
      .subscribe(
        res => {
          this.mostrarToast("Usuario modificado", "verde");
          localStorage.setItem('token', res.token); //Guardamos en el localStorage el token que nos da al crear un usuario
          this.ListarUsuarios();
        },
        err => {
          console.log(err);
          this.mostrarToast("Error al modificar usuario", "rojo");
        }
      )
      $("#modalModificarUsuario").modal('hide');   
  }

  EliminarUsuario(){
    //1ro Eliminamos los roles del Usuario
    this.EliminarRolesUsuario(this.id_user);
    //Despues Eliminamos al usuario
    this.usuarioService.deleteUsuarioApi(this.id_user)
    .subscribe(
      res => {
        console.log('Usuario eliminado');
        this.mostrarToast("Usuario eliminado", "verde");
        this.ListarUsuarios();
      },
      err => {
        console.log(err);
        this.mostrarToast("Error al eliminar usuario", "rojo");
      }
    )
    $("#modalEliminarUsuario").modal('hide'); 
  }

  AgregarRolesUsuario(){
    var rolesAdd=[];
    //Primero Eliminamos todos los roles del usuario para agregar los nuevos
    //this.EliminarRolesUsuario(this.user.ci_usuario);
    console.log("Administrar Usuarios:",this.administrarUsuarios);
    console.log("Administrar Producto:",this.administrarProductos);
    console.log("Administrar Ventas:",this.gestionarVentas);
    console.log("Administrar Caja:",this.gestionarCaja);
    if (this.administrarUsuarios) {
      rolesAdd.push(1);
    }
    if (this.administrarProductos) {
      rolesAdd.push(2);
    }
    if (this.gestionarVentas) {
      rolesAdd.push(3);
    }
    if (this.gestionarCaja) {
      rolesAdd.push(4);
    }
    if (this.gestionarCocina) {
      rolesAdd.push(5);
    }
    if (this.gestionarInventario) {
      rolesAdd.push(6);
    }
    if (this.gestionarClientes) {
      rolesAdd.push(7);
    }
    if (this.gestionarReporteVentas) {
      rolesAdd.push(8);
    }
    console.log("Roles Add::",rolesAdd);
    this.AgregarRolesUsuarioBackend(rolesAdd);  
    $("#modalRolesUsuario").modal('hide');
  }


  EliminarRolesUsuario(ci:any){
    this.usuarioService.deleteRolesFromUsuario(ci)
    .subscribe(
      res => {
        console.log('Roles eliminados');
      },
      err => console.log(err)
    ) 
  }

  AgregarRolesUsuarioBackend(roles:any){ 
    //Peticion a servidor
    console.log("Ci::",this.user.ci_usuario);
    const data={rolesAdd:roles,ci_user:this.user.ci_usuario}
    //console.log(this.userRol.cod_rol+" a "+ this.userRol.ci_usuario);
    this.usuarioService.postRolesUsuarioApi(data)
      .subscribe(
        res => {
          console.log('Rol Agregado');
          this.mostrarToast("Roles agregados", "verde");
        },
        err =>{
          console.log(err);
          this.mostrarToast("Error al agregar roles", "rojo");
        } 
      )   
  }

  //Obtenemos los roles ya agregados del Usuario seleccionado
  ObtenerRolesUsuario(){
    this.usuarioService.getRolesUsuarioApi(this.user.ci_usuario)
      .subscribe(
        res => {
          console.log('Roles-Usu:',res);
          res.forEach((item:any) => {
          //console.log(this.userRol.ci_usuario+' tiene rol: ' + item.cod_rol);
              if (item.cod_rol == 1) {
                this.administrarUsuarios= true;
                this.usuario=1;
              }
              if (item.cod_rol == 2) {
                this.administrarProductos= true;
                this.producto=1;
              }
              if (item.cod_rol == 3) {
                this.gestionarVentas= true;
                this.venta=1;
              }
              if (item.cod_rol == 4) {
                this.gestionarCaja= true;
                this.caja=1;
              }
              if (item.cod_rol == 5) {
                this.gestionarCocina= true;
                this.cocina=1;
              }
              if (item.cod_rol == 6) {
                this.gestionarInventario= true;
                this.inventario=1;
              }
              if (item.cod_rol == 7) {
                this.gestionarClientes= true;
                this.cliente=1;
              }
              if (item.cod_rol == 8) {
                this.gestionarReporteVentas= true;
                this.reporte=1;
              }
          });
          
        },
        err => console.log(err)
      )   
  }

//Ponemos todos los roles a false para obtener los nuevos roles de siguiente Usuario
  limpiarRoles(){
    this.administrarUsuarios = false;
    this.administrarProductos = false;
    this.gestionarVentas = false;
    this.gestionarCaja = false;
    this.gestionarCocina = false;
    this.gestionarInventario = false;
    this.gestionarClientes = false;
    this.gestionarReporteVentas = false;

   //Tambien ponemos las varaibles a 0 como si no se habrian seleccionado
    this.usuario=0;
    this.producto=0;
    this.venta=0;
    this.caja=0;
    this.cocina=0;
    this.inventario=0;
    this.cliente=0;
    this.reporte=0;
  }



isValidUsuario():boolean{
  return this.user.ci_usuario.length != 0 && this.user.nom_usu.trim() !== '' && this.user.ap_usu.trim() !== '' &&
         this.user.clave.length != 0;
}
isValidUsuarioMod():boolean{
  return this.user.nom_usu.trim() !== '' && this.user.ap_usu.trim() !== '';
}


//********************* RESETEAR FORMULARIO AL CERRAR EL MODAL *********************
resetForm() {
  if (this.formUsuario) {
    this.formUsuario.resetForm();
  }
  this.mostrarAdvertencias=false;
  this.user = {ci_usuario:"", nom_usu:'', ap_usu:'', am_usu:'', clave:'', cod_rol:0, cargo:0};  
}

resetFormContra() {
  if (this.formContra) {
    this.formContra.resetForm();
  }
  this.mostrarAdvertencia=false;
  this.resetCiUsuario = '';  // Número de cédula para recuperar contraseña
  this.resetToken = '';     // Token de recuperación generado por el backend
  this.newPassword= '';    // Nueva contraseña ingresada por el usuario
  this.confirmPassword = ''; // Confirmación de la nueva contraseña
  this.mostrarAdvertencia = false; // Advertencia en caso de error en el formulario
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
