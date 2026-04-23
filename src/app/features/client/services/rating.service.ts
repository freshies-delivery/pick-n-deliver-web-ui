import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiUrl } from '../../../core/api.config';

export interface RatingDto {
  ratingId?: number;
  userId?: number;
  targetType?: string;
  targetId?: number;
  score?: number;
  comment?: string;
  metadata?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RatingCommentDto {
  ratingCommentId?: number;
  targetType?: string;
  comment?: string;
}

@Injectable({ providedIn: 'root' })
export class RatingService {
  private readonly ratingsEndpoint = apiUrl('/api/ratings');
  private readonly commentsEndpoint = apiUrl('/api/rating-comments');

  constructor(private readonly http: HttpClient) {}

  listForOutlet(outletId: number): Observable<RatingDto[]> {
    const params = new HttpParams().set('targetType', 'OUTLET').set('targetId', String(outletId));
    return this.http.get<RatingDto[]>(this.ratingsEndpoint, { params });
  }

  createRating(payload: RatingDto): Observable<RatingDto> {
    return this.http.post<RatingDto>(this.ratingsEndpoint, payload);
  }

  updateRating(id: number, payload: RatingDto): Observable<RatingDto> {
    return this.http.put<RatingDto>(`${this.ratingsEndpoint}/${id}`, payload);
  }

  deleteRating(id: number): Observable<void> {
    return this.http.delete<void>(`${this.ratingsEndpoint}/${id}`);
  }

  listComments(targetType: string): Observable<RatingCommentDto[]> {
    const params = new HttpParams().set('targetType', targetType);
    return this.http.get<RatingCommentDto[]>(this.commentsEndpoint, { params });
  }

  createComment(payload: RatingCommentDto): Observable<RatingCommentDto> {
    return this.http.post<RatingCommentDto>(this.commentsEndpoint, payload);
  }

  updateComment(id: number, payload: RatingCommentDto): Observable<RatingCommentDto> {
    return this.http.put<RatingCommentDto>(`${this.commentsEndpoint}/${id}`, payload);
  }

  deleteComment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.commentsEndpoint}/${id}`);
  }
}


