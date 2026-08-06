import { Injectable, inject, signal } from '@angular/core';
import { BrowserStorageService } from '@orange/core/services';

type CheckoutData = Record<string, Record<string, unknown>>;

@Injectable({ providedIn: 'root' })
export class CheckoutStorageService {
  private readonly key = 'checkoutData';
  private readonly browserStorage = inject(BrowserStorageService);

  readonly checkoutData = signal<CheckoutData>(this.load());

  getAll(): CheckoutData {
    return this.checkoutData();
  }

  saveStep(stepId: string, value: Record<string, unknown>): void {
    this.checkoutData.update((data) => {
      const updatedData = {
        ...data,
        [stepId]: value,
      };

      this.browserStorage.setItem(this.key, JSON.stringify(updatedData));

      return updatedData;
    });
  }

  clear(): void {
    this.checkoutData.set({});
    this.browserStorage.removeItem(this.key);
  }

  private load(): CheckoutData {
    const raw = this.browserStorage.getItem(this.key);

    if (!raw) return {};

    try {
      return JSON.parse(raw) as CheckoutData;
    } catch {
      this.browserStorage.removeItem(this.key);
      return {};
    }
  }
}
