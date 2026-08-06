import { AsyncPipe, CurrencyPipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ProductFacade } from 'src/app/features/products/store/products.facade';
import { AddonDialogData } from '../addon/addon-dialog-data.model';
import { TranslatePipe } from '@ngx-translate/core';
import { SiteService } from '@orange/core/services';

@Component({
  selector: 'app-addon-mobile-plan',
  imports: [AsyncPipe, TranslatePipe, CurrencyPipe],
  templateUrl: './addon-mobile-plan.component.html',
  styleUrl: './addon-mobile-plan.component.scss',
})
export class AddonMobilePlanComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<AddonMobilePlanComponent>);
  private readonly productFacade = inject(ProductFacade);
  readonly siteService = inject(SiteService);
  readonly currency = this.siteService.currency;

  readonly data = inject<AddonDialogData>(MAT_DIALOG_DATA);
  readonly plans$ = this.productFacade.mobilePlans$(this.data.productId);
  readonly loading$ = this.productFacade.loadingMobilePlans$(
    this.data.productId,
  );
  readonly error$ = this.productFacade.mobilePlansError$(this.data.productId);

  selectedPlanCode: string | null = null;

  ngOnInit(): void {
    this.productFacade.loadProductMobilePlans(this.data.productId);
  }

  selectPlan(code: string): void {
    this.selectedPlanCode = code;
  }

  confirm(): void {
    if (!this.selectedPlanCode) return;

    this.dialogRef.close({
      mobilePlanCode: this.selectedPlanCode,
    });
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
