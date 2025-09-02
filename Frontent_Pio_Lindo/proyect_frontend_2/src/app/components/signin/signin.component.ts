import { Component } from '@angular/core';
import {AuthService} from "../../services/auth.service";
import {UsuariosService} from "../../services/usuarios.service";
import {Router} from "@angular/router";
import {AppComponent} from "../../app.component"
import * as bootstrap from 'bootstrap';

@Component({
  selector: 'app-signin',
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.css']
})
export class SigninComponent {
  user = {
    ci_usuario: '',
    clave: ''
  }
  user_logged={
    ci_usuario: '',
    clave: '',
    nom_usu:'',
    ap_usu:'',
    cargo:0
  }

constructor(
  public authService:AuthService,
  public usuarioService:UsuariosService,
  private router: Router,
  public appComponent:AppComponent
){

}

signIn(){
  var miToast = document.getElementById('toast');   let toast:any;
  if (miToast) {
    toast = new bootstrap.Toast(miToast);
  }
  console.log(this.user.ci_usuario);
  console.log(this.user.clave);
  if (this.user.ci_usuario=='' || this.user.clave=='') {
    toast.show()
  }
  else{
  this.authService.signIn(this.user)
      .subscribe(
        res => {
          console.log(res);
          let id =this.user.ci_usuario;
          console.log("Signin : "+id);
          localStorage.setItem('token', res.token); //Guardamos en el localStorage el token que nos da al crear un usuario
          localStorage.setItem('ci_usuario', id);
          this.getUser_Logged(id);
          //this.router.navigate(['/pedidos']); //Nos redirecciona automaticamente al modulo /private
        },
        err =>   toast.show()
      );

      this.appComponent.CargarMenu(this.user.ci_usuario);
    }
}

  getUser_Logged(ci_usuario:any){
    // console.log('User Getted:',ci_usuario);
    this.usuarioService.getUsuario_By_Api(ci_usuario)
    .subscribe(
      res =>{
        console.log('Usuario Getted: ',res);
        this.user_logged=res;
        localStorage.setItem('usuario', JSON.stringify(this.user_logged)); //Convertimos el objeto usuario a Json para guardarlo en el localStorage
        this.usuarioService.actualizarUsuario(this.user_logged); //Notificamos el ingreso del nuevo usuario a appComponent(enviamos el usuario)
      },
      err => console.log(err)
    );
  }





//SI PRESIONAMOS ENTER NOS NAVEGA OTRO LADO PERO YA SOLICIONAMOS, AL LOGUEARNOS DESAPAREMOS EL CONTENIDO DEL SIGNIN HTML
// onKeyPress(event: KeyboardEvent) {
//   if (event.key === 'Enter') {
//     console.log("Presiono Enter");
    
//     // Acciones que deseas realizar cuando se presiona Enter
//     this.router.navigate(['/pedidos']); //Nos redirecciona automaticamente al modulo /private
//   }
// }

}
