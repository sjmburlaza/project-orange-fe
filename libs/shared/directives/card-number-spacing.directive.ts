import {
  Directive,
  ElementRef,
  forwardRef,
  HostListener,
  inject,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { NON_DIGIT_PATTERN } from '@orange/shared/constants';

@Directive({
  selector: 'input[appCardNumberSpacing]',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CardNumberSpacingDirective),
      multi: true,
    },
  ],
})
export class CardNumberSpacingDirective implements ControlValueAccessor {
  private readonly elementRef =
    inject<ElementRef<HTMLInputElement>>(ElementRef);
  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const cursorPosition = input.selectionStart ?? input.value.length;
    const digitsBeforeCursor = this.countDigits(
      input.value.slice(0, cursorPosition),
    );
    const formattedValue = this.formatCardNumber(input.value);

    this.writeInputValue(formattedValue);
    this.restoreCursorPosition(input, digitsBeforeCursor);
    this.onChange(formattedValue);
  }

  @HostListener('blur')
  onBlur(): void {
    this.onTouched();
  }

  writeValue(value: string | null): void {
    this.writeInputValue(this.formatCardNumber(value ?? ''));
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.elementRef.nativeElement.disabled = isDisabled;
  }

  private formatCardNumber(value: string): string {
    const digits = value.replace(NON_DIGIT_PATTERN, '').slice(0, 19);

    return digits.match(/.{1,4}/g)?.join(' ') ?? '';
  }

  private writeInputValue(value: string): void {
    this.elementRef.nativeElement.value = value;
  }

  private countDigits(value: string): number {
    return value.replace(NON_DIGIT_PATTERN, '').length;
  }

  private restoreCursorPosition(
    input: HTMLInputElement,
    digitsBeforeCursor: number,
  ): void {
    const position = this.getCursorPosition(input.value, digitsBeforeCursor);

    input.setSelectionRange(position, position);
  }

  private getCursorPosition(value: string, digitsBeforeCursor: number): number {
    if (digitsBeforeCursor === 0) {
      return 0;
    }

    let digitsSeen = 0;

    for (let index = 0; index < value.length; index += 1) {
      if (/\d/.test(value[index])) {
        digitsSeen += 1;
      }

      if (digitsSeen === digitsBeforeCursor) {
        return index + 1;
      }
    }

    return value.length;
  }
}
