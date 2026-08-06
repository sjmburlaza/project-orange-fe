import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { DynamicField } from '@orange/core/models';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-input-field',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    TranslatePipe,
  ],
  templateUrl: './input-field.component.html',
  styleUrl: './input-field.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputFieldComponent {
  @Input() field!: DynamicField;
  @Input() form!: FormGroup;

  getMaxLength(field: DynamicField): number | null {
    const validator = field.validators?.find((v) => v.name === 'maxLength');

    return validator?.value ? Number(validator.value) : null;
  }
}
