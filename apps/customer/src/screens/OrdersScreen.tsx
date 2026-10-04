import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  getOrders,
  type Order,
} from '../api/orders';

type OrdersScreenProps = {
  userId: number;
  token: string;
  onBack: () => void;
  onOpenOrder: (order: Order) => void;
};

function formatDate(value: string) {
  return new Date(value).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function formatStatus(status: string) {
  return status
    .split('_')
    .map(
      (part) =>
        part.charAt(0).toUpperCase() + part.slice(1),
    )
    .join(' ');
}

export function OrdersScreen({
  userId,
  token,
  onBack,
  onOpenOrder,
}: OrdersScreenProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(
    null,
  );

  useEffect(() => {
    let mounted = true;

    async function loadOrders() {
      try {
        setLoading(true);
        setError(null);

        const data = await getOrders(userId, token);

        if (mounted) {
          setOrders(data);
        }
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to load orders',
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadOrders();

    return () => {
      mounted = false;
    };
  }, [userId, token]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={onBack}
        >
          <Text style={styles.backText}>‹</Text>
        </Pressable>

        <View>
          <Text style={styles.title}>My Orders</Text>

          <Text style={styles.subtitle}>
            Track your grocery deliveries
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" />

          <Text style={styles.loadingText}>
            Loading your orders...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>!</Text>

          <Text style={styles.emptyTitle}>
            Couldn't load orders
          </Text>

          <Text style={styles.emptyText}>
            {error}
          </Text>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>🛍️</Text>

          <Text style={styles.emptyTitle}>
            No orders yet
          </Text>

          <Text style={styles.emptyText}>
            Your completed orders will appear here.
          </Text>
        </View>
      ) : (
        <View style={styles.ordersList}>
          {orders.map((order) => (
            <Pressable
              key={order.id}
              style={({ pressed }) => [
                styles.orderCard,
                pressed && styles.orderCardPressed,
              ]}
              onPress={() => onOpenOrder(order)}
            >
              <View style={styles.orderTop}>
                <View style={styles.orderHeading}>
                  <Text style={styles.orderNumber}>
                    Order #{order.id}
                  </Text>

                  <Text style={styles.date}>
                    {formatDate(order.createdAt)}
                  </Text>
                </View>

                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>
                    {formatStatus(order.status)}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <Text style={styles.label}>
                  Items
                </Text>

                <Text style={styles.value}>
                  {order.items.reduce(
                    (total, item) =>
                      total + item.quantity,
                    0,
                  )}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.label}>
                  Payment
                </Text>

                <Text style={styles.value}>
                  {order.paymentMethod.toUpperCase()}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.label}>
                  Delivery
                </Text>

                <Text
                  style={[
                    styles.value,
                    order.deliveryFee === 0 &&
                      styles.freeText,
                  ]}
                >
                  {order.deliveryFee === 0
                    ? 'FREE'
                    : `₹${Number(
                        order.deliveryFee,
                      ).toFixed(0)}`}
                </Text>
              </View>

              <View style={styles.totalRow}>
                <View>
                  <Text style={styles.totalLabel}>
                    Total
                  </Text>

                  <Text style={styles.tapHint}>
                    Tap to view tracking
                  </Text>
                </View>

                <View style={styles.totalRight}>
                  <Text style={styles.totalValue}>
                    ₹{Number(order.total).toFixed(0)}
                  </Text>

                  <Text style={styles.arrow}>
                    ›
                  </Text>
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f8fa',
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 24,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  backText: {
    fontSize: 30,
    lineHeight: 32,
    color: '#111827',
  },

  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  },

  subtitle: {
    marginTop: 3,
    fontSize: 14,
    color: '#6b7280',
  },

  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },

  ordersList: {
    gap: 14,
  },

  orderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  orderCardPressed: {
    opacity: 0.82,
  },

  orderTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },

  orderHeading: {
    flex: 1,
  },

  orderNumber: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },

  date: {
    marginTop: 5,
    fontSize: 12,
    color: '#6b7280',
  },

  statusBadge: {
    backgroundColor: '#ecfdf5',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#047857',
  },

  divider: {
    height: 1,
    backgroundColor: '#eef0f2',
    marginVertical: 16,
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  label: {
    fontSize: 14,
    color: '#6b7280',
  },

  value: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },

  freeText: {
    color: '#059669',
  },

  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#eef0f2',
  },

  totalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },

  tapHint: {
    marginTop: 3,
    fontSize: 11,
    color: '#9ca3af',
  },

  totalRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  totalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },

  arrow: {
    fontSize: 25,
    color: '#6b7280',
  },

  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  emptyIcon: {
    fontSize: 36,
    marginBottom: 12,
  },

  emptyTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#111827',
  },

  emptyText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    color: '#6b7280',
  },
});