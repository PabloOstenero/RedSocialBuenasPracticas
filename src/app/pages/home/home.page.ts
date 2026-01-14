import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonItem, IonInput, IonList, IonLabel, IonButton, IonNote, IonSpinner
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { Subject, Observable, combineLatest, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, startWith, tap, catchError } from 'rxjs/operators';

import { SocialBadService, Post } from '../../core/services/social-bad.service';
import { KpiService } from '../../core/metrics/kpi.service';

@Component({
  standalone: true,
  selector: 'app-home',
  imports: [
    CommonModule, AsyncPipe,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonItem, IonInput, IonList, IonLabel, IonButton, IonNote, IonSpinner
  ],
  templateUrl: './home.page.html',
})
export class HomePage implements OnInit, OnDestroy {
  query = '';
  loading = false;
  error = '';

  filteredPosts$: Observable<Post[]> | null = null;

  private searchSubject = new Subject<string>();

  constructor(
    private api: SocialBadService,
    private router: Router,
    public kpi: KpiService
  ) {}

  ngOnInit() {
    const navStart = (performance.getEntriesByType('navigation')[0] as any)?.startTime ?? 0;
    this.kpi.setStartupMs(Math.round(performance.now() - navStart));

    this.loading = true;

    // Flujo de posts (limitado a 24)
    const posts$ = this.api.getPosts().pipe(
      map(data => data.slice(0, 24)),
      catchError(() => {
        this.error = 'Error cargando posts';
        this.loading = false;
        return of([]);
      })
    );

    // Flujo de búsqueda
    const search$ = this.searchSubject.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged()
    );

    // Combinación reactiva (BP 9.1 & 9.3)
    this.filteredPosts$ = combineLatest([posts$, search$]).pipe(
      map(([posts, term]) => {
        const q = term.toLowerCase();
        return posts.filter(p => (p.title + ' ' + p.body).toLowerCase().includes(q));
      }),
      tap(filtered => {
        this.kpi.setRenderItems(filtered.length);
        this.loading = false;
      })
    );
  }

  ngOnDestroy() {
  }

  onInput(ev: any) {
    const t0 = performance.now();
    const value = (ev?.target?.value ?? '').toString();
    this.query = value;
    
    // Enviamos al subject para debounce
    this.searchSubject.next(value);

    this.kpi.addInputSample(performance.now() - t0);
  }

  // BP 6.1: Función ligera para el template
  prettyTitle(p: Post): string {
    // Eliminado el bucle pesado
    return `[${p.id}] ${p.title.toUpperCase()}`;
  }

  // TrackBy para optimizar el renderizado de listas (BP 2.3.2)
  trackByPost(index: number, item: Post): number {
    return item.id;
  }

  openPost(p: Post) {
    this.router.navigate(['/detail'], { queryParams: { id: p.id, title: p.title } });
  }

  goSettings() {
    this.router.navigate(['/settings']);
  }
}
