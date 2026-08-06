import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
  Input,
  OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { distinctUntilChanged, Subject, switchMap } from 'rxjs';
import { DynamicField, Option } from '@orange/core/models';
import { OptionsService } from 'src/app/features/checkout/services/options.service';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-select-search-field',
  imports: [
    MatFormFieldModule,
    MatSelectModule,
    ReactiveFormsModule,
    MatInputModule,
    MatIconModule,
    TranslatePipe,
  ],
  templateUrl: './select-search-field.component.html',
  styleUrl: './select-search-field.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectSearchFieldComponent implements OnInit {
  private readonly optionsService = inject(OptionsService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly searchTerm$ = new Subject<string>();

  @Input() field!: DynamicField;
  @Input() form!: FormGroup;

  options: Option[] = [];

  compareOptions = (a: string | number, b: string | number) => a === b;

  ngOnInit(): void {
    this.initializeSearch();
    this.initializeOptions();
  }

  private initializeSearch(): void {
    this.searchTerm$
      .pipe(
        distinctUntilChanged(),
        switchMap((term) => {
          const params: Record<string, string | number> = {
            search: term,
          };

          if (this.field.dependsOn) {
            const parentValue = this.form.get(this.field.dependsOn)?.value;

            if (parentValue) {
              params['parent'] = parentValue;
            }
          }

          return this.optionsService.getOptions(this.field.optionsApi!, params);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((res) => {
        this.options = res;
      });
  }

  private initializeOptions(): void {
    const control = this.form.get(this.field.name);

    if (this.field.dependsOn) {
      const parent = this.form.get(this.field.dependsOn)!;
      const parentValue = parent.value;

      if (parentValue) {
        control?.enable({ emitEvent: false });
        this.load(parentValue);
      } else {
        control?.disable({ emitEvent: false });
      }

      parent.valueChanges
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((value) => {
          control?.reset(null); // allow child fields to react

          if (value) {
            control?.enable({ emitEvent: false });
            this.load(value);
          } else {
            control?.disable({ emitEvent: false });
            this.options = [];
          }
        });

      return;
    }

    this.load();
  }

  load(parentValue?: string | number): void {
    const control = this.form.get(this.field.name);
    const currentValue = control?.value;

    const params: Record<string, string | number> = {};

    if (
      parentValue !== undefined &&
      parentValue !== null &&
      parentValue !== ''
    ) {
      params['parent'] = parentValue;
    }

    this.optionsService
      .getOptions(this.field.optionsApi!, params)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.options = res;

        // important: refresh mat-select display after options exist
        if (currentValue) {
          control?.setValue(currentValue, { emitEvent: false });
        }

        this.cdr.detectChanges();
      });
  }

  search(term: string): void {
    this.searchTerm$.next(term);
  }

  onSearchClick(event: Event) {
    event.stopPropagation();
  }

  onSearchKeydown(event: KeyboardEvent) {
    event.stopPropagation();
  }
}
