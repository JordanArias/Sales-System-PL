import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'numToWords'
})
export class NumToWordsPipe implements PipeTransform {
  private units: string[] = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
  private teens: string[] = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
  private tens: string[] = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
  private hundreds: string[] = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

  transform(value: number): string {
    if (value < 0 || value > 100000) return 'Número fuera de rango';
    if (value === 0) return 'cero';

    if (value < 10) return this.units[value];
    if (value < 20) return this.teens[value - 10];
    if (value < 100) {
      return this.tens[Math.floor(value / 10)] + (value % 10 !== 0 ? ' y ' + this.units[value % 10] : '');
    }
    if (value < 1000) {
      const hundredsPart = value === 100 ? 'cien' : this.hundreds[Math.floor(value / 100)];
      return hundredsPart + (value % 100 !== 0 ? ' ' + this.transform(value % 100) : '');
    }
    if (value < 100000) {
      const thousandsPart = Math.floor(value / 1000);
      const remainder = value % 1000;
      let thousandsText = thousandsPart === 1 ? 'mil' : this.transform(thousandsPart) + ' mil';

      return thousandsText + (remainder !== 0 ? ' ' + this.transform(remainder) : '');
    }

    return 'Número demasiado grande';
  }
}
