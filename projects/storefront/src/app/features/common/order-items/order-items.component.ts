import { Component, inject } from '@angular/core';
import { CartFacade } from '../../cart/store/cart.facade';
import { SiteService } from '@orange/core/services';
import { AsyncPipe, CurrencyPipe } from '@angular/common';
import { IconPipe } from '@orange/shared/pipes';
import { TranslatePipe } from '@ngx-translate/core';
import { IconColorPipe } from '@orange/shared/pipes';
import { ConfirmDialogComponent } from '@orange/ui/confirm-dialog';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';

@Component({
  selector: 'app-order-items',
  imports: [AsyncPipe, IconPipe, IconColorPipe, CurrencyPipe, TranslatePipe],
  templateUrl: './order-items.component.html',
  styleUrl: './order-items.component.scss',
})
export class OrderItemsComponent {
  private readonly cartFacade = inject(CartFacade);
  readonly siteService = inject(SiteService);
  readonly dialog = inject(MatDialog);
  readonly router = inject(Router);
  readonly items$ = this.cartFacade.items$;
  readonly itemCount$ = this.cartFacade.itemCount$;
  readonly currency = this.siteService.currency;

  onEdit(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '520px',
      maxWidth: '90vw',
      data: {
        title: 'common.exitDialog.title',
        message: 'common.exitDialog.message',
        cancel: 'common.exitDialog.cancel',
        proceed: 'common.exitDialog.proceed',
      },
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res === 'proceed') {
        this.router.navigate(['/', this.siteService.currentSite(), 'cart']);
      }
    });
  }
}
