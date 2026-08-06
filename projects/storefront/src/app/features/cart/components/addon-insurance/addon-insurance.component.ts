import { AsyncPipe, CurrencyPipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AddonDialogData } from '../addon/addon-dialog-data.model';
import { ProductFacade } from 'src/app/features/products/store/products.facade';
import { TranslatePipe } from '@ngx-translate/core';
import { SiteService } from '@orange/core/services';

@Component({
  selector: 'app-addon-insurance',
  imports: [AsyncPipe, TranslatePipe, CurrencyPipe],
  templateUrl: './addon-insurance.component.html',
  styleUrl: './addon-insurance.component.scss',
})
export class AddonInsuranceComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<AddonInsuranceComponent>);
  private readonly productFacade = inject(ProductFacade);
  readonly siteService = inject(SiteService);
  readonly currency = this.siteService.currency;

  readonly data = inject<AddonDialogData>(MAT_DIALOG_DATA);
  readonly plans$ = this.productFacade.insurancePlans$(this.data.productId);
  readonly loading$ = this.productFacade.loadingInsurancePlans$(
    this.data.productId,
  );
  readonly error$ = this.productFacade.insurancePlansError$(
    this.data.productId,
  );

  selectedPlanCode: string | null = null;

  ngOnInit(): void {
    this.productFacade.loadProductInsurancePlans(this.data.productId);
  }

  selectPlan(code: string): void {
    this.selectedPlanCode = code;
  }

  confirm(): void {
    if (!this.selectedPlanCode) return;

    this.dialogRef.close({
      insurancePlanCode: this.selectedPlanCode,
    });
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
