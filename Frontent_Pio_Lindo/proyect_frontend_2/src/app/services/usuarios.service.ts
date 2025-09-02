import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Router} from "@angular/router";
import { BehaviorSubject } from 'rxjs';
import {configuration} from "./configuration"

@Injectable({
  providedIn: 'root'
})
export class UsuariosService {
  private URL = configuration.url;


  private usuarioSubject = new BehaviorSubject<any[]>([]);
  usuario$ = this.usuarioSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
    ) {}
  //AGREGAMOS NUEVO USUARIO
  iniciarRecuperacion(data:unknown){
    return this.http.post<any>(this.URL+'/usuarios/iniciar-recuperacion', data);
  }

  restablecerContrasena(data: { token: string, newPassword: string }) {
    return this.http.post(this.URL+'/usuarios/reset-password', data);
}

  //OBTENEMOS LA LISTA DE USUARIOS
  getUsuariosApi(){
    return this.http.get<any>(this.URL+'/usuarios');
  }

  getUsuario_By_Api(ci_usuario:any){
    return this.http.get<any>(this.URL+'/usuarios/'+ci_usuario);
  }
  //AGREGAMOS NUEVO USUARIO
  postUsuarioApi(user:unknown){
    return this.http.post<any>(this.URL+'/usuarios',user);
  }

  //MODIFICAMOS USUARIO
  putUsuarioApi(user:unknown){
    return this.http.put<any>(this.URL+'/usuarios',user);
  }

  //ELIMINAMOS USUARIO
  deleteUsuarioApi(ci_usuario:unknown){
    return this.http.delete<any>(this.URL+'/usuarios/'+ci_usuario);
  }

  //ELIMINAMOS los roles que tiene el usuario en la tabla (roles_usuarios)
  deleteRolesFromUsuario(ci_usuario:unknown){
    return this.http.delete<any>(this.URL+'/usuarios/usu_roles/'+ci_usuario);
  }
  //ELIMINAMOS el role que tiene el usuario en la tabla (roles_usuarios)
  deleteRolFromUsuario(ci_usuario:unknown,rol:unknown){
    return this.http.delete<any>(this.URL+'/usu_rol/'+ci_usuario+'/'+rol);
  }

  //AGREGAMOS un Rol al Usuario
  postRolesUsuarioApi(data:unknown){
    return this.http.post<any>(this.URL+'/usu_rol',data);
  }

   //OBTENEMOS LA LISTA DE USUARIOS
  getRolesUsuarioApi(ci_usuario:any){
    return this.http.get<any>(this.URL+'/usu_rol/'+ci_usuario);
  }

  actualizarUsuario(usuario: any) {
    this.usuarioSubject.next(usuario);
  }

}
