import { Pipe, PipeTransform } from '@angular/core';

interface ColorOptionGroup {
  code: string;
  options: ColorOption[];
}

interface ColorOption {
  code: string;
  hex?: string;
}

@Pipe({
  name: 'variantColor',
})
export class VariantColorPipe implements PipeTransform {
  transform(
    selectedOptions: Record<string, string> | null | undefined,
    optionGroups: ColorOptionGroup[] | null | undefined,
    groupCode = 'color',
  ): string | null {
    const selectedOptionCode = selectedOptions?.[groupCode];

    if (!selectedOptionCode || !optionGroups) {
      return null;
    }

    const normalizedGroupCode = groupCode.toLowerCase();
    const normalizedOptionCode = selectedOptionCode.toLowerCase();
    const colorOption = optionGroups
      .find((group) => group.code.toLowerCase() === normalizedGroupCode)
      ?.options.find(
        (option) => option.code.toLowerCase() === normalizedOptionCode,
      );

    return colorOption?.hex ?? null;
  }
}
