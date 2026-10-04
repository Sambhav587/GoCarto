import {
  useEffect,
  useState,
  type FormEvent,
} from 'react';

import { login, type AdminUser } from './api/auth';
import {
  getAdminOrders,
  updateAdminOrderStatus,
  type AdminOrder,
} from './api/orders';

import './App.css';

const STATUS_OPTIONS = [
  'pending',
  'confirmed',
  'preparing',
  'out_for_delivery',
  'delivered',
  'cancelled',
];

function formatStatus(status: string) {
  return status
    .split('_')
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1),
    )
    .join(' ');
}

function App() {
  const [token, setToken] = useState<string | null>(
    null,
  );

  const [user, setUser] =
    useState<AdminUser | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [orders, setOrders] = useState<
    AdminOrder[]
  >([]);

  const [loading, setLoading] = useState(false);
  const [loadingOrders, setLoadingOrders] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [loginError, setLoginError] =
    useState<string | null>(null);

  useEffect(() => {
    const savedToken =
      localStorage.getItem(
        'gocarto.admin.accessToken',
      );

    const savedUser =
      localStorage.getItem(
        'gocarto.admin.user',
      );

    if (savedToken && savedUser) {
      try {
        const parsedUser =
          JSON.parse(savedUser) as AdminUser;

        setToken(savedToken);
        setUser(parsedUser);
      } catch {
        localStorage.removeItem(
          'gocarto.admin.accessToken',
        );

        localStorage.removeItem(
          'gocarto.admin.user',
        );
      }
    }
  }, []);

  useEffect(() => {
    if (!token || !user) {
      return;
    }

    if (user.role !== 'admin') {
      setError(
        'This account does not have admin access.',
      );
      return;
    }

    void loadOrders(token);
  }, [token, user]);

  async function loadOrders(
    accessToken: string,
  ) {
    try {
      setLoadingOrders(true);
      setError(null);

      const data =
        await getAdminOrders(accessToken);

      setOrders(data);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Unable to load orders.',
      );
    } finally {
      setLoadingOrders(false);
    }
  }

  async function handleLogin(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    try {
      setLoading(true);
      setLoginError(null);

      const result = await login(
        email.trim(),
        password,
      );

      if (result.user.role !== 'admin') {
        setLoginError(
          'This account does not have admin access.',
        );
        return;
      }

      localStorage.setItem(
        'gocarto.admin.accessToken',
        result.accessToken,
      );

      localStorage.setItem(
        'gocarto.admin.user',
        JSON.stringify(result.user),
      );

      setToken(result.accessToken);
      setUser(result.user);
      setPassword('');
    } catch (error) {
      setLoginError(
        error instanceof Error
          ? error.message
          : 'Unable to sign in.',
      );
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem(
      'gocarto.admin.accessToken',
    );

    localStorage.removeItem(
      'gocarto.admin.user',
    );

    setToken(null);
    setUser(null);
    setOrders([]);
    setError(null);
  }

  async function handleStatusChange(
    orderId: number,
    status: string,
  ) {
    if (!token) {
      return;
    }

    try {
      setError(null);

      const updated =
        await updateAdminOrderStatus(
          orderId,
          status,
          token,
        );

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order.id === updated.id
            ? {
                ...order,
                ...updated,
              }
            : order,
        ),
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Unable to update order status.',
      );
    }
  }

  if (!token || !user) {
    return (
      <main className="login-page">
        <section className="login-card">
          <div className="brand-mark">
            G
          </div>

          <div className="login-heading">
            <p className="eyebrow">
              GoCarto Operations
            </p>

            <h1>Admin Console</h1>

            <p>
              Manage orders and delivery
              operations from one place.
            </p>
          </div>

          <form
            className="login-form"
            onSubmit={handleLogin}
          >
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                }}
                placeholder="admin@example.com"
                autoComplete="email"
                required
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => {
                  setPassword(
                    event.target.value,
                  );
                }}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </label>

            {loginError ? (
              <div className="error-box">
                {loginError}
              </div>
            ) : null}

            <button
              className="primary-button"
              type="submit"
              disabled={loading}
            >
              {loading
                ? 'Signing in...'
                : 'Sign in to Admin'}
            </button>
          </form>
        </section>
      </main>
    );
  }

  const pendingCount =
    orders.filter(
      (order) => order.status === 'pending',
    ).length;

  const preparingCount =
    orders.filter(
      (order) => order.status === 'preparing',
    ).length;

  const deliveryCount =
    orders.filter(
      (order) =>
        order.status === 'out_for_delivery',
    ).length;

  const deliveredCount =
    orders.filter(
      (order) => order.status === 'delivered',
    ).length;

  return (
    <main className="dashboard-page">
      <header className="topbar">
        <div>
          <p className="eyebrow">
            GoCarto Operations
          </p>

          <h1>Order Dashboard</h1>
        </div>

        <div className="topbar-actions">
          <div className="admin-user">
            <strong>
              {user.name || 'Admin'}
            </strong>

            <span>{user.email}</span>
          </div>

          <button
            className="secondary-button"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </header>

      <section className="stats-grid">
        <article className="stat-card">
          <span>Pending</span>
          <strong>{pendingCount}</strong>
        </article>

        <article className="stat-card">
          <span>Preparing</span>
          <strong>{preparingCount}</strong>
        </article>

        <article className="stat-card">
          <span>Out for delivery</span>
          <strong>{deliveryCount}</strong>
        </article>

        <article className="stat-card">
          <span>Delivered</span>
          <strong>{deliveredCount}</strong>
        </article>
      </section>

      {error ? (
        <div className="error-box dashboard-error">
          {error}
        </div>
      ) : null}

      <section className="orders-section">
        <div className="section-header">
          <div>
            <p className="eyebrow">
              Live operations
            </p>

            <h2>Orders</h2>
          </div>

          <button
            className="secondary-button"
            onClick={() => {
              if (token) {
                void loadOrders(token);
              }
            }}
            disabled={loadingOrders}
          >
            {loadingOrders
              ? 'Refreshing...'
              : 'Refresh'}
          </button>
        </div>

        {loadingOrders && orders.length === 0 ? (
          <div className="empty-state">
            Loading orders...
          </div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            No orders found.
          </div>
        ) : (
          <div className="orders-table-wrap">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Delivery</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Update</th>
                </tr>
              </thead>

              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <strong>
                        #{order.id}
                      </strong>

                      <span className="muted">
                        {new Date(
                          order.createdAt,
                        ).toLocaleString()}
                      </span>
                    </td>

                    <td>
                      User #{order.userId}
                    </td>

                    <td className="address-cell">
                      {order.deliveryAddress}
                    </td>

                    <td>
                      ₹
                      {order.total.toFixed(2)}
                    </td>

                    <td>
                      <span
                        className={`status-badge status-${order.status}`}
                      >
                        {formatStatus(
                          order.status,
                        )}
                      </span>
                    </td>

                    <td>
                      <select
                        value={order.status}
                        onChange={(event) => {
                          void handleStatusChange(
                            order.id,
                            event.target.value,
                          );
                        }}
                      >
                        {STATUS_OPTIONS.map(
                          (status) => (
                            <option
                              key={status}
                              value={status}
                            >
                              {formatStatus(
                                status,
                              )}
                            </option>
                          ),
                        )}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

export default App;