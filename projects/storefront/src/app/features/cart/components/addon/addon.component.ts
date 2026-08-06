import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Input,
  Output,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  Addon,
  UpdateCartItemAddonRequest,
} from '@orange/core/models';
import { IconPipe } from '@orange/shared/pipes';
import { AddonInsuranceComponent } from '../addon-insurance/addon-insurance.component';
import { AddonTradeinComponent } from '../addon-tradein/addon-tradein.component';
import { AddonMobilePlanComponent } from '../addon-mobile-plan/addon-mobile-plan.component';
import { AddonDialogData } from './addon-dialog-data.model';
import { TranslatePipe } from '@ngx-translate/core';
import { CurrencyPipe } from '@angular/common';
import { ConfirmDialogComponent } from '@orange/ui/confirm-dialog';

interface UpsertAddonEvent {
  variantId: number;
  addonId: string;
  request: UpdateCartItemAddonRequest;
}

interface RemoveAddonEvent {
  variantId: number;
  addonId: string;
}

@Component({
  selector: 'app-addon',
  imports: [IconPipe, TranslatePipe, CurrencyPipe],
  templateUrl: './addon.component.html',
  styleUrl: './addon.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddonComponent {
  @Input({ required: true }) addon!: Addon;
  @Input({ required: true }) productId!: number;
  @Input({ required: true }) variantId!: number;
  @Input({ required: true }) currency!: string;
  @Output() upsertAddon = new EventEmitter<UpsertAddonEvent>();
  @Output() removeAddon = new EventEmitter<RemoveAddonEvent>();

  readonly dialog = inject(MatDialog);

  openAddonDialog(addonId: string): void {
    if (!addonId) return;

    const data: AddonDialogData = {
      productId: this.productId,
      addon: this.addon,
    };
    let dialogRef;

    switch (addonId) {
      case 'insurance':
        dialogRef = this.dialog.open(AddonInsuranceComponent, {
          data,
        });
        break;
      case 'trade-in':
        dialogRef = this.dialog.open(AddonTradeinComponent, {
          data,
          width: '720px',
          maxWidth: 'calc(100vw - 32px)',
          // maxHeight: 'none',
          panelClass: 'trade-in-dialog-panel',
        });
        break;
      case 'mobile-plan':
        dialogRef = this.dialog.open(AddonMobilePlanComponent, {
          data,
        });
        break;
    }

    dialogRef
      ?.afterClosed()
      .subscribe((request?: UpdateCartItemAddonRequest) => {
        if (!request) return;

        this.upsertAddon.emit({
          variantId: this.variantId,
          addonId,
          request,
        });
      });
  }

  removeSelectedAddon(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '520px',
      maxWidth: '90vw',
      data: {
        title: 'cart.addon.removeDialog.title',
        message: 'cart.addon.removeDialog.message',
        cancel: 'cart.addon.removeDialog.cancel',
        proceed: 'cart.addon.removeDialog.proceed',
        name: this.addon.title,
        titleName: this.addon.name,
      },
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res === 'proceed') {
        this.removeAddon.emit({
          variantId: this.variantId,
          addonId: this.addon.id,
        });
      }
    });
  }
}
