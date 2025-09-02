import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SharedservicesService {

  private ventasSubject = new BehaviorSubject<any[]>([]);
  ventas$ = this.ventasSubject.asObservable();
  constructor() { }




}
