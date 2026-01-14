import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { shareReplay, tap } from 'rxjs/operators';
import { KpiService } from '../metrics/kpi.service';

export type Post = { userId: number; id: number; title: string; body: string; };
export type Comment = { postId: number; id: number; name: string; email: string; body: string; };

@Injectable({ providedIn: 'root' })
export class SocialBadService {
  // Cache simple en memoria
  private postsCache$: Observable<Post[]> | null = null;
  private commentsCache = new Map<number, Observable<Comment[]>>();

  constructor(private http: HttpClient, private kpi: KpiService) {}

  getPosts(forceRefresh = false): Observable<Post[]> {
    if (forceRefresh || !this.postsCache$) {
      this.postsCache$ = this.http.get<Post[]>('https://jsonplaceholder.typicode.com/posts').pipe(
        // Solo incrementamos KPI si realmente se hace la petición de red
        tap(() => this.kpi.incHttp()),
        // Compartir la respuesta y mantenerla en memoria (Cache)
        shareReplay(1)
      );
      // BP 8.1: Expiración de caché (TTL) a los 60 segundos
      setTimeout(() => this.postsCache$ = null, 60000);
    }
    return this.postsCache$;
  }

  getComments(postId: number): Observable<Comment[]> {
    if (!this.commentsCache.has(postId)) {
      const obs$ = this.http.get<Comment[]>(`https://jsonplaceholder.typicode.com/posts/${postId}/comments`).pipe(
        tap(() => this.kpi.incHttp()),
        shareReplay(1)
      );
      this.commentsCache.set(postId, obs$);
      // BP 8.1: Expiración de caché (TTL) a los 60 segundos
      setTimeout(() => this.commentsCache.delete(postId), 60000);
    }
    return this.commentsCache.get(postId)!;
  }
}
