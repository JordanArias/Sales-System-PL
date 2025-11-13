import { Component, ElementRef, HostListener,Inject, Renderer2, ViewChild } from '@angular/core';
import {AuthService} from "./services/auth.service";
import {UsuariosService} from "./services/usuarios.service";
import {Router} from "@angular/router";
import { AppModule } from './app.module';
import { DOCUMENT } from '@angular/common';
import { ChangeDetectorRef } from '@angular/core';
import * as bootstrap from 'bootstrap';

declare var $: any
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  componentes:any =[{rol: '',enlace:'',cod_rol: 0}];
  usuario=[{ci_usuario: '', clave: '',nom_usu:'',ap_usu:'', cargo:0}];
  gestion='';
  Ausuario=false; Aproducto=false; Aventa=false; Acaja=false; Acocina=false; Acliente=false; Areporte=false;  Ainventario=false
  classUsu=false; classProd=false; classVenta=false; classCaja=false; classCocina=false; classCliente=false; classReporte=false; classInventario=false;

  constructor(
    public  authService:AuthService,
    private router: Router,
    private appModule:AppModule,
    private cdr: ChangeDetectorRef,
    private userService: UsuariosService,
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document
    ){ 
      if (window.innerWidth >= 1200) {
        this.sidebarActiva=true;
      }

      //Usamos BehaviorSubject para notificar al AppComponent sobre los cambios.
      this.userService.usuario$.subscribe((usuario) => {
        this.usuario = usuario;
        // this.tieneRolNecesario();    
        // console.log('Usuario recicibo de Login:', this.usuario);    
      });

      //Recuperamos el usuario que inicio sesion de local storage
      const usuarioString = localStorage.getItem('usuario');
      if (usuarioString !== null) {
        this.usuario = JSON.parse(usuarioString);
      }
      // console.log('User obtenido::',this.usuario[0].nom_usu);
      
  }

ngOnInit(){

}

mostrarSidebar: boolean = true; // Estado inicial: Sidebar completo visible

toggleSidebar() {
  this.mostrarSidebar = !this.mostrarSidebar; // Alternar entre visible/invisible
}

isNavbarOpen: boolean = false;

toggleNavbar() {
  this.isNavbarOpen = !this.isNavbarOpen;
  console.log(this.isNavbarOpen);
  
}
closeNavbar() {
  this.isNavbarOpen = false;
  console.log(this.isNavbarOpen);
}


 //Si el usuario recarga la pagina se cargara de nuevo los roles del usuario
 @HostListener('window:load', ['$event'])
 onload(event: Event) {
  // console.log('RECARGAMOS LA APP COMPONENT');
  
    this.CargarMenu(localStorage.getItem('ci_usuario'));  // Llama a tu función de cierre de sesión
    // Asegúrate de que tu función de cierre de sesión realice cualquier limpieza necesaria, como eliminar tokens o cookies de autenticación.
    let enlace=localStorage.getItem('ruta');
    if (enlace === null) {
      this.router.navigate(['/signin']);
    }
    else{ 
      if (enlace=='usuario') {this.seleccionarMenu(1);}
      if (enlace=='producto') {this.seleccionarMenu(2);}
      if (enlace=='venta') {this.seleccionarMenu(3);}
      if (enlace=='caja') {this.seleccionarMenu(4);}
      if (enlace=='cocina') {this.seleccionarMenu(5);}
      if (enlace=='inventario') {this.seleccionarMenu(6);}
      if (enlace=='cliente') {this.seleccionarMenu(7);}
      if (enlace=='reporte-ventas') {this.seleccionarMenu(8);}

      this.router.navigate(['/'+localStorage.getItem('ruta')]);
    }
  }

 CargarMenu(id:any){
    //var ci_usuario = localStorage.getItem('id');  
    this.authService.getUsuarioRoles(id)
      .subscribe(
        res => {
          //console.log(res)
          this.componentes = res;
          localStorage.setItem('roles',JSON.stringify(this.componentes));
          // console.log('Roles Autorizados:', this.componentes);
          this.Ausuario=false; this.Aproducto=false; this.Aventa=false; this.Acaja=false; this.Acocina=false; this.Ainventario=false; this.Acliente=false; this.Areporte=false;
          this.tieneRolNecesario();
        },
        err => console.log('ID vacion o incorrecto')
      ) 

  }


//Efecto del componente seleccionado para que se remarque
  opcionSeleccionada: any = null;

  seleccionarMenu(opcion: any): void {  
    if (opcion==1) {this.gestion='Gestión Usuarios';}
    if (opcion==2) {this.gestion='Gestión Productos';}
    if (opcion==3) {this.gestion='Gestión Ventas';}
    if (opcion==4) {this.gestion='Gestión Caja';}
    if (opcion==5) {this.gestion='Gestión Cocina';}
    if (opcion==6) {this.gestion='Gestión Inventario';}
    if (opcion==7) {this.gestion='Gestión Clientes';}
    if (opcion==8) {this.gestion='Gestión Reporte Ventas';}

    this.sidebarActiva = false;
    this.opcionSeleccionada = opcion; //Guardamos el componente seleccionado
 
  }

  tieneRolNecesario(){
    for(let roles of this.componentes){
      // console.log('recorremos:',roles.cod_rol);
      if (roles.cod_rol==1) {this.Ausuario=true}
      if (roles.cod_rol==2) {this.Aproducto=true} 
      if (roles.cod_rol==3) {this.Aventa=true}    
      if (roles.cod_rol==4) {this.Acaja=true}  
      if (roles.cod_rol==5) {this.Acocina=true}
      if (roles.cod_rol==6) {this.Ainventario=true}    
      if (roles.cod_rol==7) {this.Acliente=true}
      if (roles.cod_rol==8) {this.Areporte=true}  

    }
    console.log('No tiene Acceso al rol');
    console.log('Ausuario:',this.Ausuario);
    console.log('Aproducto:',this.Aproducto);  
    console.log('Aventa:',this.Aventa);     
    console.log('Acaja:',this.Acaja);   
    console.log('Acocina:',this.Acocina);   
    console.log('Ainventario:',this.Ainventario);     
    console.log('Acliente:',this.Acliente);   
    console.log('Areporte:',this.Areporte);   
  }

 

  sidebarActiva = false;
  openMenu() {
    this.sidebarActiva = true;
    // console.log("Open.-",this.sidebarActiva);
  }
  
  closeMenu() {
    this.sidebarActiva = false;
    // console.log("Close.-",this.sidebarActiva);
  }

}













