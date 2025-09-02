import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filter'
})
export class FilterPipe implements PipeTransform {

//Buscador Pipe Mas general para todos los modulos
//value(Array), args(texto del input), searchProperties(propiedades por los cuales hacemos la busqueda['nom_usu', 'ap_usu', 'ci_usuario'])
transform(value: any, args: any, searchProperties: string[]): any {
  if (!args || args.length < 2) {//si args es invalido o menor de 2
    return value; //retornamos la lista normal
  }

  const result = [];//Se almacenaran los elementos que coincidan con la busqueda
  for (const item of value) {//Recorrer cada item de del array value(Usuarios o Productos)
    for (const property of searchProperties) {//Dentro del bucle anterior, se realiza otro bucle for para cada propiedad especificada en searchProperties. 
      if (item[property].toString().toLowerCase().includes(args.toLowerCase())) {
        result.push(item);//Si alguna de las propiedades coincide con el término de búsqueda, el elemento se agrega al arreglo result.
        break; // se sale del segundo bucle for. Esto es para evitar agregar el mismo elemento varias veces si coincide con más de una propiedad.
      }
    }
  }
  return result;
}
//Buscador PIPE solo para el modulo USUARIOS
  // transform(value: any, args: any): any {
  //   if (args== '' || args.length < 3) {
  //     return value;
  //   }
  //   const resultUser = [];
  //   for(const usuario of value){
  //     if (usuario.nom_usu.toLowerCase().indexOf(args.toLowerCase())> -1 || usuario.ap_usu.toLowerCase().indexOf(args.toLowerCase())> -1 || usuario.ci_usuario.toString().includes(args)) {
  //       resultUser.push(usuario);
  //     }
  //   }
  //   return resultUser;
  // }

}
