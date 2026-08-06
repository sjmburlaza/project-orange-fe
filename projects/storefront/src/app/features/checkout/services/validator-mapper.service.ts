import { Injectable } from '@angular/core';
import { ValidatorFn, Validators } from '@angular/forms';
import { FieldValidator } from '@orange/core/models';

@Injectable({ providedIn: 'root' })
export class ValidatorMapperService {
  getValidators(validators: FieldValidator[]): ValidatorFn[] {
    return validators.map((validator) => {
      switch (validator.name) {
        case 'required':
          return Validators.required;

        case 'email':
          return Validators.email;

        case 'maxLength':
          return Validators.maxLength(Number(validator.value));

        case 'minLength':
          return Validators.minLength(Number(validator.value));

        default:
          return Validators.nullValidator;
      }
    });
  }
}
