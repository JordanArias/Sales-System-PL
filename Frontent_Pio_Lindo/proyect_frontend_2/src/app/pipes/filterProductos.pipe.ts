import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterProductos'
})
export class FilterPipe implements PipeTransform {

  transform(value: any, args: any): any {
    if (args== '' || args.length < 3) {
      return value;
    }
    const resultUser = [];
    for(const usuario of value){
      if (usuario.nom_usu.toLowerCase().indexOf(args.toLowerCase())> -1 || usuario.ap_usu.toLowerCase().indexOf(args.toLowerCase())> -1 || usuario.ci_usuario.toString().includes(args)) {
        resultUser.push(usuario);
      }
    }
    return resultUser;
  }

}
