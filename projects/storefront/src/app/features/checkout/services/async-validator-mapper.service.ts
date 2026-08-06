import { Injectable, inject } from '@angular/core';
import { AsyncValidatorFn, AbstractControl } from '@angular/forms';
import { of, map, catchError } from 'rxjs';
import { PostalCodeService } from '@orange/core/services';

@Injectable({ providedIn: 'root' })
export class AsyncValidatorMapperService {
  private readonly postalCodeService = inject(PostalCodeService);

  getValidator(name: string): AsyncValidatorFn | null {
    switch (name) {
      case 'serviceablePostalCode':
        return this.serviceablePostalCodeValidator();

      default:
        return null;
    }
  }

  private serviceablePostalCodeValidator(): AsyncValidatorFn {
    return (control: AbstractControl) => {
      if (!control.value) {
        return of(null);
      }

      return this.postalCodeService.validate(control.value).pipe(
        map((res) => {
          return res.isValid ? null : { serviceablePostalCode: res.message };
        }),
        catchError(() => {
          return of({
            serviceablePostalCode: 'Unable to validate postal code.',
          });
        }),
      );
    };
  }
}
