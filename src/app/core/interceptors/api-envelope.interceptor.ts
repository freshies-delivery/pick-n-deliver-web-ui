import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
  HttpResponse
} from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';

interface ApiEnvelope<T = unknown> {
  status?: string;
  data?: T;
  errors?: unknown;
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isEnvelope = (body: unknown): body is ApiEnvelope =>
  isObject(body) && 'status' in body && ('data' in body || 'errors' in body);

export const apiEnvelopeInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  return next(req).pipe(
    map((event: HttpEvent<unknown>) => {
      if (!(event instanceof HttpResponse)) {
        return event;
      }

      const body = event.body;
      if (!isEnvelope(body)) {
        return event;
      }

      if (body.status === 'SUCCESS') {
        return event.clone({ body: body.data ?? null });
      }

      throw new HttpErrorResponse({
        url: event.url ?? req.url,
        status: event.status || 500,
        statusText: `API responded with status: ${body.status ?? 'UNKNOWN'}`,
        error: body.errors ?? body
      });
    }),
    // If backend sends an error envelope with non-2xx status, normalize the error body as well.
    // This keeps snackbar/error handlers consistent across the app.
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && isEnvelope(error.error)) {
        return throwError(
          () =>
            new HttpErrorResponse({
              headers: error.headers,
              status: error.status,
              statusText: error.statusText,
              url: error.url ?? undefined,
              error: error.error.errors ?? error.error
            })
        );
      }

      return throwError(() => error);
    })
  );
};


