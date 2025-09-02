import { HostListener, Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Router} from "@angular/router";
import {configuration} from "./configuration"

@Injectable({
  providedIn: 'root'
})


export class AuthService {
  private URL = configuration.url; 

  public ci_usuario:any;
  public acceso_rol= false;
  public roles: any;

  constructor(
    private http: HttpClient,
    private router: Router
    ) {}

   ngOnInit(){
   }

   //Hace peticiion al servidor de NODEjs
   signUp(user:unknown){
    return this.http.post<any>(this.URL+'/usuarios',user)
   }

   signIn(user:unknown){
    return this.http.post<any>(this.URL+'/auth/signin',user)
   }

   loggedIn(){
    return !!localStorage.getItem('token'); //Si el token existe retorna true, sino false
   }

   getToken(){
    return localStorage.getItem('token');
   }

   logout(){
    localStorage.removeItem('token');
    localStorage.removeItem('ci_usuario');
    localStorage.removeItem('ruta');
    localStorage.removeItem('roles');
    localStorage.removeItem('usuario');
    localStorage.setItem('ruta','signin');
    this.router.navigate(['/signin'])

   }


  //Obtiene los roles asignados a un usuario
   getUsuarioRoles(user:unknown){
    return this.http.get<any>(this.URL+'/usuarios/usu_roles/' + user)
   }



  //  cargarUsuarioRoles(roles:any){
  //   this.roles = roles;
  //   console.log("roles service:: "+roles); 
  //   }


    verificarRolUsuario(enlace:any){
      this.roles = localStorage.getItem('roles');
      var rol= JSON.parse(this.roles);
      //console.log("storage:: "+this.roles);
      
      if (!(typeof rol === 'undefined') ) {
          rol.forEach((item: any) => {
          if (enlace === item.enlace.trim()) {
            //console.log(enlace + " === " + item.enlace);
            this.acceso_rol = true;
            //console.log("acceso 1:: ", this.acceso_rol);
            }
          });
      }else{
        console.log("rol vacio");    
      }

      //console.log("acceso 2:: ", this.acceso_rol);
      return this.acceso_rol
    }



  //  verificarRolUsuario(enlace: any):boolean {
  //   this.ci_usuario = localStorage.getItem('ci_usuario');
  //   var roles: any;
 
  //   // Obtenemos los roles del usuario que inició sesión
  //   this.getUsuarioRoles(this.ci_usuario)
  //     .subscribe(
  //       res => {
  //         roles = res;
  //         console.log("roles :: ", roles);
  
  //         roles.forEach((item: any) => {
  //           if (enlace === item.enlace.trim()) {
  //             console.log(enlace + " === " + item.enlace);
  //             this.acceso_rol = true;
  //           }
  //         });
  
  //         console.log("acceso 1:: ", this.acceso_rol);
  //       },
  //       error => {
  //         console.log('Error al obtener Roles de Usuario');
  //       }
  //     );
  //     console.log("acceso 2:: ", this.acceso_rol);
  //   return this.acceso_rol;
  // }



}
 
