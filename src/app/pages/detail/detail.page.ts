import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonList, IonItem, IonLabel, IonButton, IonNote, IonSpinner
} from '@ionic/angular/standalone';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

import { SocialBadService, Comment } from '../../core/services/social-bad.service';
import { KpiService } from '../../core/metrics/kpi.service';

@Component({
  standalone: true,
  selector: 'app-detail',
  imports: [
    CommonModule, AsyncPipe,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonList, IonItem, IonLabel, IonButton, IonNote, IonSpinner
  ],
  templateUrl: './detail.page.html',
})
export class DetailPage implements OnInit, OnDestroy {
  postId = 0;
  title = '';

  loading = false;
  error = '';

  comments$: Observable<Comment[]> | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: SocialBadService,
    public kpi: KpiService
  ) {}

  ngOnInit() {
    this.postId = Number(this.route.snapshot.queryParamMap.get('id') ?? '0');
    this.title = this.route.snapshot.queryParamMap.get('title') ?? '';

    const t0 = performance.now();
    this.loading = true;

    // BP 2.4.1: Petición única y eficiente (cacheada en servicio)
    this.comments$ = this.api.getComments(this.postId).pipe(
      tap(data => {
        this.kpi.setRenderItems(data.length);
        this.kpi.setForecastDataMs(Math.round(performance.now() - t0));
        this.loading = false;
      }),
      catchError(() => {
        this.error = 'Error cargando comentarios';
        this.loading = false;
        return of([]);
      })
    );
  }

  ngOnDestroy() {
  }

  // BP 6.1: Función ligera
  prettyEmail(email: string): string {
    return email.toLowerCase();
  }

  trackByComment(index: number, item: Comment): number {
    return item.id;
  }

  back() {
    this.router.navigate(['/home']);
  }

  goSettings() {
    this.router.navigate(['/settings']);
  }
}
