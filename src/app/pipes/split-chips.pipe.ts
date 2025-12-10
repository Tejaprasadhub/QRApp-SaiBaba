import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'splitChips',
  standalone:false
})
export class SplitChipsPipe implements PipeTransform {
  transform(value: string | null | undefined, delimiter: string = '/'): string[] {
    if (!value) return [];
    return value
      .split(delimiter)
      .map(v => v.trim())
      .filter(Boolean);
  }
}
