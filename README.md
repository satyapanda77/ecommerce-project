# MiniShop

A small, complete full-stack e-commerce demo — React frontend + Django REST
Framework backend, JWT authentication, SQLite database. Intentionally kept
small: **4 database models**, **6 API endpoints**, **6 pages**.

Flow: **Register → Login → View Products → View Product Details → Add to
Cart → View Cart → Place Order → View Orders**. All data (products, cart,
orders) is stored in the database — nothing is hardcoded in React.

---

## 1. Project Folder Structure

```
E-Web/
│
├── backend/
│   ├── manage.py
│   ├── config/                 # project settings, root urls.py, wsgi/asgi
│   │   ├── settings.py
│   │   └── urls.py
│   │
│   ├── users/                  # custom User model + register/login
│   │   ├── models.py           #   User (extends AbstractUser)
│   │   ├── serializers.py      #   RegisterSerializer, UserSerializer
│   │   ├── views.py            #   RegisterView, LoginView (JWT)
│   │   └── urls.py
│   │
│   ├── products/                # Product model + list/detail
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   └── management/commands/seed_products.py   # sample data seeder
│   │
│   ├── cart/                    # CartItem model + cart endpoint
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   │
│   ├── orders/                  # Order model + orders endpoint
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   │
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/          # Navbar, Footer, ProductCard,
│   │   │                        # ProtectedRoute, Loading, Notification
│   │   ├── pages/                # Home, Products, ProductDetails,
│   │   │                        # Login, Register, MyAccount
│   │   ├── services/api.js      # single axios instance + all endpoint URLs
│   │   ├── context/              # AuthContext, CartContext, NotificationContext
│   │   ├── App.jsx               # routes
│   │   └── main.jsx
│   ├── .env.example
│   └── package.json
│
└── README.md
```

---

## 2. Installation Commands

**Backend**

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows  (use: source venv/bin/activate on macOS/Linux)
pip install -r requirements.txt
copy .env.example .env       # (Windows) — or: cp .env.example .env
```

**Frontend**

```bash
cd frontend
npm install
copy .env.example .env       # (Windows) — or: cp .env.example .env
```

---

## 3. Backend Run Commands

```bash
cd backend
venv\Scripts\activate
python manage.py migrate
python manage.py seed_products     # loads the 8 sample products
python manage.py createsuperuser   # optional, for /admin/
python manage.py runserver
```

The API is now live at **http://127.0.0.1:8000/api/**
(Django admin at http://127.0.0.1:8000/admin/)

---

## 4. Frontend Run Commands

```bash
cd frontend
npm run dev
```

The site is now live at **http://127.0.0.1:5173**

> Make sure `frontend/.env` points at the backend
> (`VITE_API_BASE_URL=http://127.0.0.1:8000/api`) and that the backend's
> `CORS_ALLOWED_ORIGINS` in `backend/.env` includes `http://127.0.0.1:5173`.

---

## 5. API List (exactly 6 endpoints)

| # | Method              | Endpoint                | Auth                   | Description                                              |
| - | ------------------- | ----------------------- | ---------------------- | -------------------------------------------------------- |
| 1 | POST                | `/api/register/`      | Public                 | Create a new user                                        |
| 2 | POST                | `/api/login/`         | Public                 | Authenticate, returns JWT`access` + `refresh` tokens |
| 3 | GET                 | `/api/products/`      | Public                 | List all products                                        |
| 4 | GET                 | `/api/products/<id>/` | Public                 | Retrieve one product                                     |
| 5 | GET / POST / DELETE | `/api/cart/`          | **JWT required** | View / add-to / remove-from the logged-in user's cart    |
| 6 | GET / POST          | `/api/orders/`        | **JWT required** | View orders / place an order                             |

**Cart details**

- `POST /api/cart/` body: `{ "product_id": 1, "quantity": 2 }` — adds the item, or increases quantity if it's already in the cart.
- `DELETE /api/cart/` body: `{ "product_id": 1 }` — removes that product from the cart.

**Orders details**

- `POST /api/orders/` body: `{ "product_id": 1, "quantity": 2 }` — orders that single product directly, **or**
- `POST /api/orders/` with an empty body `{}` — checks out everything currently in the cart (one `Order` row is created per cart item, `total_price` = `price × quantity`, stock is decremented, and the cart is emptied).

---

## 6. Database Model Explanation (exactly 4 models)

**1. `User`** (`users/models.py`) — Django's custom auth user model
(`AUTH_USER_MODEL = 'users.User'`), extending `AbstractUser`. Fields:
`id`, `username`, `email` (unique), `password` (hashed by Django).

**2. `Product`** (`products/models.py`) — a single item for sale.
`id`, `name`, `description`, `price`, `image` (URL), `category`, `stock`.

**3. `CartItem`** (`cart/models.py`) — one row per (user, product) pair
sitting in a user's cart. `id`, `user` (FK → User), `product` (FK →
Product), `quantity`. `unique_together = (user, product)` so adding the
same product twice just increases its quantity instead of duplicating rows.

**4. `Order`** (`orders/models.py`) — one row per product ordered.
`id`, `user` (FK → User), `product` (FK → Product), `quantity`,
`total_price` (= `product.price × quantity`, computed server-side),
`status` (`Pending` / `Completed` / `Cancelled`), `created_at`.

Placing an order from the cart page creates **one `Order` row per cart
item** (there's no separate "line item" model — that's how the app stays
at exactly 4 tables) and clears the cart.

---

## 7. How React Communicates with DRF

- All API calls go through a single Axios instance: `frontend/src/services/api.js`. It reads `VITE_API_BASE_URL` from `.env` and exposes an `ENDPOINTS` object so every URL lives in one place.
- A **request interceptor** automatically attaches `Authorization: Bearer <access token>` to every outgoing request when the user is logged in.
- A **response interceptor** watches for `401 Unauthorized` responses — if the token is invalid/expired, it clears storage and redirects to `/login`.
- `AuthContext`, `CartContext`, and `NotificationContext` (in `src/context/`) wrap the app and expose `login()`, `register()`, `logout()`, `addToCart()`, `removeFromCart()`, and `notify()` — pages call these instead of touching Axios directly.
- Django REST Framework returns JSON; `django-cors-headers` (configured with `CORS_ALLOWED_ORIGINS`) allows the Vite dev server origin to call the API from the browser.

---

## 8. How JWT Authentication Works

```
React (Login form)
      │  POST /api/login/  { username, password }
      ▼
DRF (SimpleJWT LoginView)
      │  verifies credentials
      ▼
Returns { access, refresh, user }
      │
      ▼
React stores access + refresh tokens (and user info) in localStorage
      │
      ▼
Every subsequent request to /api/cart/ or /api/orders/ carries:
      Authorization: Bearer <access token>
      │
      ▼
DRF's JWTAuthentication class verifies the token signature/expiry
and attaches request.user — IsAuthenticated permission then allows
or rejects the request (401 if missing/invalid/expired).
```

- **Register** (`/api/register/`) just creates the `User` row — it does not log the user in. The frontend redirects to `/login` afterwards.
- **Login** (`/api/login/`) accepts either a username or an email in the `username` field and returns a JWT `access` token (1 hour) and `refresh` token (7 days), plus the user's `id`/`username`/`email`.
- **Logout** is client-side only — it clears the tokens from `localStorage`. There's no server-side blacklist endpoint, keeping the API surface at exactly 6 endpoints.
- **Protected routes**: `/api/cart/` and `/api/orders/` use DRF's `IsAuthenticated` permission. On the frontend, `<ProtectedRoute>` guards the `/account` page and redirects unauthenticated visitors to `/login`.

---

## Sample Data

`python manage.py seed_products` loads 8 products: Wireless Headphones,
Smart Watch, Laptop Backpack, Mechanical Keyboard, Wireless Mouse,
Bluetooth Speaker, USB-C Hub, and Phone Stand — each with a realistic
description, price, category, stock count, and photo.

## Tech Stack

- **Frontend:** React, React Router, Axios, plain CSS
- **Backend:** Django, Django REST Framework, djangorestframework-simplejwt, django-cors-headers
- **Database:** SQLite

## Scope

This is a deliberately small project. It does **not** include payments,
an admin dashboard, wishlists, reviews/ratings, coupons, multiple
addresses, email verification, password reset, social login, or any
extra models/pages/APIs beyond what's described above.
