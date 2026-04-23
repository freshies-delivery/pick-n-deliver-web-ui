# Pick N Deliver Web UI

Angular 19 standalone app with a production-focused `Client -> Outlet -> Category -> Item` management flow built using Angular Material.

## Implemented Feature Module

Feature path: `src/app/features/client/`

- Client list CRUD with row navigation to outlets
- Outlet list CRUD scoped to `clientId`
- Outlet detail page with 3 sections (Address, Categories, Ratings)
- Category navigation to item list route
- Item list CRUD scoped to `outletId` and `categoryId`
- Generic reusable table and dynamic form dialog
- Reusable confirmation dialog and breadcrumb component

## Route Structure

```text
/client/clients
/client/:clientId/outlets
/client/:clientId/outlets/:outletId
/client/:clientId/outlets/:outletId/categories/:categoryId/items
```

## Parent Mapping Rules Enforced

- Outlet save: `outlet.clientId = selectedClientId`
- Category save: `category.outletId = selectedOutletId`
- Item save: `item.categoryId = selectedCategoryId` and `item.outletId = selectedOutletId`
- Address save: `address.outletId = selectedOutletId`
- Rating save: `rating.targetType = 'OUTLET'` and `rating.targetId = selectedOutletId`

## Setup

```bash
npm install
```

## Run Locally

```bash
npm start
```

## Build

```bash
npm run build
```

## Test

```bash
npm test
```

## API Notes

- Services are wired to endpoints from `swagger.json`.
- Ratings update/delete endpoints are referenced as `/api/ratings/{id}` for full CRUD UI handling.
- If your backend currently supports only list/create for ratings, keep comments CRUD (`/api/rating-comments`) and disable rating edit/delete actions.
