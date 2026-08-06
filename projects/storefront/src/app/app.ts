import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AnalyticsService } from '@orange/core/services';
import { BackToTopComponent } from '@orange/ui/back-to-top';

@Component({
  selector: 'app-root',
  imports: [BackToTopComponent, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  private readonly analytics = inject(AnalyticsService);

  ngOnInit(): void {
    this.analytics.trackVisitor();
  }
}
