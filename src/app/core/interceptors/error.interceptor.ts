import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);
  const auth  = inject(AuthService);

  return next(req).pipe(
    catchError(err => {
      if (err.status === 401) {
        auth.logout();
        window.location.href = '/login';
      } else if (err.status === 403) {
        toast.error('Access denied');
      } else if (err.status === 404) {
        // 404 is often expected (e.g. no address yet) — don't toast
      } else if (err.status >= 500) {
        toast.error('Server error — please try again');
      }
      return throwError(() => err);
    })
  );
};
