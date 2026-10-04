import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { Order } from '../api/orders';

type OrderDetailScreenProps = {
  order: Order;
  onBack: () => void;
};

const STATUS_STEPS = [
  {
    key: 'pending',
    title: 'Order Placed',
    description: 'Your order has been received.',
  },
  {
    key: 'confirmed',
    title: 'Order Confirmed',
    description: 'The store has confirmed your order.',
  },
  {
    key: 'preparing',
    title: 'Preparing Order',
    description: 'Your groceries are being packed.',
  },
  {
    key: 'out_for_delivery',
    title: 'Out for Delivery',
    description: 'Your order is on the way.',
  },
  {
    key: 'delivered',
    title: 'Delivered',
    description: 'Your order has been delivered.',
  },
];

const STATUS_ORDER = [
  'pending',
  'confirmed',
  'preparing',
  'out_for_delivery',
  'delivered',
];

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

export function OrderDetailScreen({
  order,
  onBack,
}: OrderDetailScreenProps) {
  const currentIndex = STATUS_ORDER.indexOf(
    order.status,
  );

  const isCancelled = order.status === 'cancelled';

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
          <Text style={styles.title}>
            Order #{order.id}
          </Text>

          <Text style={styles.subtitle}>
            {formatDate(order.createdAt)}
          </Text>
        </View>
      </View>

      <View style={styles.statusCard}>
        <View style={styles.statusIcon}>
          <Text style={styles.statusIconText}>
            {isCancelled ? '×' : '✓'}
          </Text>
        </View>

        <View style={styles.statusContent}>
          <Text style={styles.statusTitle}>
            {isCancelled
              ? 'Order Cancelled'
              : formatStatus(order.status)}
          </Text>

          <Text style={styles.statusDescription}>
            {isCancelled
              ? 'This order is no longer active.'
              : 'We are keeping you updated every step of the way.'}
          </Text>
        </View>
      </View>

      {!isCancelled && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Delivery Tracking
          </Text>

          <View style={styles.timeline}>
            {STATUS_STEPS.map((step, index) => {
              const completed =
                currentIndex >= index;

              const active =
                currentIndex === index;

              const isLast =
                index === STATUS_STEPS.length - 1;

              return (
                <View
                  key={step.key}
                  style={styles.timelineRow}
                >
                  <View style={styles.timelineRail}>
                    <View
                      style={[
                        styles.dot,
                        completed &&
                          styles.dotCompleted,
                        active &&
                          styles.dotActive,
                      ]}
                    >
                      {completed && (
                        <Text
                          style={styles.check}
                        >
                          ✓
                        </Text>
                      )}
                    </View>

                    {!isLast && (
                      <View
                        style={[
                          styles.line,
                          currentIndex > index &&
                            styles.lineCompleted,
                        ]}
                      />
                    )}
                  </View>

                  <View style={styles.timelineContent}>
                    <Text
                      style={[
                        styles.stepTitle,
                        completed &&
                          styles.stepTitleCompleted,
                      ]}
                    >
                      {step.title}
                    </Text>

                    <Text style={styles.stepDescription}>
                      {step.description}
                    </Text>

                    {active && (
                      <Text style={styles.currentLabel}>
                        Current status
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          Order Summary
        </Text>

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
            Payment Status
          </Text>

          <Text style={styles.value}>
            {formatStatus(order.paymentStatus)}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.label}>
            Subtotal
          </Text>

          <Text style={styles.value}>
            ₹{Number(order.subtotal).toFixed(0)}
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
          <Text style={styles.totalLabel}>
            Total
          </Text>

          <Text style={styles.totalValue}>
            ₹{Number(order.total).toFixed(0)}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          Delivery Address
        </Text>

        <Text style={styles.address}>
          {order.deliveryAddress}
        </Text>
      </View>
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
    marginBottom: 22,
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
    fontSize: 25,
    fontWeight: '800',
    color: '#111827',
  },

  subtitle: {
    marginTop: 3,
    fontSize: 13,
    color: '#6b7280',
  },

  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 14,
  },

  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  statusIconText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#059669',
  },

  statusContent: {
    flex: 1,
  },

  statusTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },

  statusDescription: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
    color: '#6b7280',
  },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 14,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 18,
  },

  timeline: {
    paddingLeft: 2,
  },

  timelineRow: {
    flexDirection: 'row',
    minHeight: 74,
  },

  timelineRail: {
    width: 30,
    alignItems: 'center',
  },

  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },

  dotCompleted: {
    backgroundColor: '#d1fae5',
  },

  dotActive: {
    backgroundColor: '#059669',
  },

  check: {
    fontSize: 13,
    fontWeight: '800',
    color: '#047857',
  },

  line: {
    width: 2,
    flex: 1,
    backgroundColor: '#e5e7eb',
  },

  lineCompleted: {
    backgroundColor: '#10b981',
  },

  timelineContent: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 20,
  },

  stepTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#6b7280',
  },

  stepTitleCompleted: {
    color: '#111827',
  },

  stepDescription: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 18,
    color: '#9ca3af',
  },

  currentLabel: {
    alignSelf: 'flex-start',
    marginTop: 7,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#ecfdf5',
    color: '#047857',
    fontSize: 11,
    fontWeight: '700',
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 11,
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

  divider: {
    height: 1,
    backgroundColor: '#eef0f2',
    marginVertical: 7,
  },

  freeText: {
    color: '#059669',
  },

  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#eef0f2',
  },

  totalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },

  totalValue: {
    fontSize: 21,
    fontWeight: '800',
    color: '#111827',
  },

  address: {
    fontSize: 14,
    lineHeight: 21,
    color: '#374151',
  },
});