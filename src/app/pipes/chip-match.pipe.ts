import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'chipMatch',
  standalone:false
})
export class ChipMatchPipe implements PipeTransform {

  transform(chip: string, search: string): boolean {
    if (!chip || !search) return false;
    return chip.toLowerCase().includes(search.toLowerCase());
  }
}
