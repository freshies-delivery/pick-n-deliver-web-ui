import { environment } from '../../environments/environment';

/**
 * Build an API URL. `path` arguments may still carry a leading `/api` prefix
 * from before the multi-module split — this helper strips it so the result
 * doesn't double-up with the base that environment.apiUrl already provides.
 *
 * Dev:  environment.apiUrl = '/api'         → proxy rewrites /api → /api/admin-app
 * Prod: environment.apiUrl = '<host>/api/admin-app'  → full absolute URL
 */
export const apiUrl = (path: string): string => {
  const withoutLeadingApi = path.replace(/^\/api\//, '/').replace(/^\/api$/, '');
  const cleanPath = withoutLeadingApi.startsWith('/') ? withoutLeadingApi.slice(1) : withoutLeadingApi;
  const base = environment.apiUrl.replace(/\/$/, '');
  return `${base}/${cleanPath}`;
};
