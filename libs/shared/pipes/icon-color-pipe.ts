import { Pipe, PipeTransform } from '@angular/core';

interface ColorSpec {
  name: string;
  value: string;
}

@Pipe({
  name: 'iconColor',
})
export class IconColorPipe implements PipeTransform {
  transform(specs: ColorSpec[] | null | undefined): string {
    if (!specs) return '';

    return specs?.find((s) => s.name.toLowerCase() === 'color')?.value || '';
  }
}
