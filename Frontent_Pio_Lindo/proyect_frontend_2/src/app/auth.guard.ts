import { Injectable, inject } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from "@angular/router";
import { AuthService } from './services/auth.service';

@Injectable({
  providedIn: 'root'
})
class PermissionsService {

  constructor(
    private authService: AuthService,
    private router: Router) {}

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
          //console.log("rol Guard:: "+ route.data['rol']); //le pasamos el rol al que desea entrar el usuario y verificamos y esta relacionado con el
    
    if (this.authService.verificarRolUsuario(next.data['rol']) && this.authService.loggedIn() ) {
      localStorage.setItem('ruta',next.data['rol']);
      return true
    }
    if (this.authService.loggedIn()) {
      // Si el usuario ya está autenticado pero no cumple el rol necesario, redirige a una página de acceso denegado
      console.log('Acceso Denegado');
    }
     else {
      // Si el usuario no está autenticado, redirige al inicio de sesión
      this.router.navigate(['/signin']);
      console.log('Acceso Denegado No inisiaste Sesión');
    }
      return false
  }
}

export const AuthGuard: CanActivateFn = (next: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean => {
  return inject(PermissionsService).canActivate(next, state);
}