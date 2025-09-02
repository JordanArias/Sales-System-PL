import { Component,Inject, Renderer2 } from '@angular/core';
import { ProductosService } from "../../services/productos.service";
import { InsumosService } from "../../services/insumos.service";
import { DOCUMENT } from '@angular/common';

import * as bootstrap from 'bootstrap';

// This lets me use jquery
declare var $: any
@Component({
  selector: 'app-productos',
  templateUrl: './productos.component.html',
  styleUrls: ['./productos.component.css']
})
export class ProductosComponent {

  constructor(
    private insumoService:InsumosService,
    private productoService:ProductosService,
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document
  ){
    // this.listar_Insumos();
    // this.listar_Productos();
  }

//*************************** VARIABLES EXTRA  *************************** 



//************ FUNCION PARA CAMBIAR PANTALLAS ENTRE INSUMO Y STOCK DIARIO ************
//************************************************************************************
container_cards=true;
container_Insumos=false;
container_StockDiario=false;
cambiar_Pantalla=1;
 cambiar_Pantalla_Principal(pantalla:any){
  this.cambiar_Pantalla=pantalla;
 }   
 

//*****************************************************************************************************************
//**************************************************** SHOW MODALES ***********************************************
//*****************************************************************************************************************


}
