import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { EMAIL_ADDRESS_PATTERN } from '@orange/shared/constants';

export function emailValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (!value) {
      return null;
    }

    const email = String(value).trim();

    if (!EMAIL_ADDRESS_PATTERN.test(email)) {
      return {
        email: true,
      };
    }

    return null;
  };
}
