import React, { useEffect, useState } from 'react';
import {
  Image,
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { getProductImage } from './src/api/productImages';

import {
  addToCart,
  getCart,
  removeCartItem,
  updateCartItem,
  type Cart,
} from './src/api/cart';

import {
  createOrder,
  type Order,
  type PaymentMethod,
} from './src/api/orders';

import {
  searchLocations,
  type LocationSuggestion,
} from './src/api/location';

import {
  getProducts,
  type Product,
} from './src/api/products';

import type { LoginResponse } from './src/api/auth';

import {
  AuthProvider,
  useAuth,
} from './src/auth/AuthProvider';

import LoginScreen from './src/screens/LoginScreen';
import { OrdersScreen } from './src/screens/OrdersScreen';
import { OrderDetailScreen } from './src/screens/OrderDetailScreen';
import { AIAssistantScreen } from './src/screens/AIAssistantScreen';

const categories = [
  { name: 'Fruits', icon: '🍎' },
  { name: 'Vegetables', icon: '🥦' },
  { name: 'Dairy', icon: '🥛' },
  { name: 'Bakery', icon: '🥖' },
  { name: 'Snacks', icon: '🍿' },
  { name: 'Beverages', icon: '🥤' },
];

function getProductIcon(product: Product) {
  const text =
    `${product.name} ${product.description ?? ''}`.toLowerCase();

  if (text.includes('banana')) return '🍌';
  if (text.includes('apple')) return '🍎';
  if (text.includes('milk')) return '🥛';
  if (text.includes('bread')) return '🍞';
  if (text.includes('vegetable')) return '🥦';
  if (text.includes('snack')) return '🍿';
  if (text.includes('coffee')) return '☕';
  if (text.includes('juice')) return '🧃';
  if (text.includes('water')) return '💧';
  if (text.includes('granola')) return '🍫';
  if (text.includes('yogurt')) return '🥣';
  if (text.includes('butter')) return '🧈';
  if (text.includes('croissant')) return '🥐';
  if (text.includes('almond')) return '🥜';
  if (text.includes('orange')) return '🍊';
  if (text.includes('tomato')) return '🍅';
  if (text.includes('potato')) return '🥔';
  if (text.includes('broccoli')) return '🥦';

  return '🛒';
}

function isCustomerProduct(product: Product) {
  const text =
    `${product.name} ${product.slug}`.toLowerCase();

  return !(
    text.includes('test product') ||
    text.includes('cart test') ||
    text.includes('order test') ||
    text.includes('e2e')
  );
}

type CartScreenProps = {
  userId: number;
  token: string;
  onBack: () => void;
  onCheckout: (cart: Cart) => void;
  onCartChanged: (cart: Cart) => void;
};

function CartScreen({
  userId,
  token,
  onBack,
  onCheckout,
  onCartChanged,
}: CartScreenProps) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingItemId, setUpdatingItemId] =
    useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadCart() {
    try {
      setLoading(true);
      setError(null);

      const data = await getCart(userId, token);

      setCart(data);
      onCartChanged(data);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Unable to load your cart.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCart();
  }, [userId, token]);

  async function changeQuantity(
    productId: number,
    quantity: number,
  ) {
    if (quantity < 1) {
      return;
    }

    try {
      setUpdatingItemId(productId);
      setError(null);

      const updatedCart = await updateCartItem(
        userId,
        productId,
        quantity,
        token,
      );

      setCart(updatedCart);
      onCartChanged(updatedCart);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Unable to update cart.',
      );
    } finally {
      setUpdatingItemId(null);
    }
  }

  async function handleRemove(productId: number) {
    try {
      setUpdatingItemId(productId);
      setError(null);

      await removeCartItem(
        userId,
        productId,
        token,
      );

      const updatedCart = await getCart(
        userId,
        token,
      );

      setCart(updatedCart);
      onCartChanged(updatedCart);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Unable to remove item.',
      );
    } finally {
      setUpdatingItemId(null);
    }
  }

  const subtotal =
    cart?.items?.reduce(
      (total, item) =>
        total +
        Number(item.product.price) *
        item.quantity,
      0,
    ) ?? 0;

  const deliveryFee =
    subtotal >= 500 ? 0 : subtotal > 0 ? 40 : 0;

  const total = subtotal + deliveryFee;

  const totalItems =
    cart?.items?.reduce(
      (sum, item) => sum + item.quantity,
      0,
    ) ?? 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.cartScreenHeader}>
        <Pressable
          style={styles.backButton}
          onPress={onBack}
        >
          <Text style={styles.backButtonText}>
            ‹
          </Text>
        </Pressable>

        <View style={styles.cartHeaderTitleWrap}>
          <Text style={styles.cartHeaderTitle}>
            Your Cart
          </Text>

          <Text style={styles.cartHeaderSubtitle}>
            {totalItems}{' '}
            {totalItems === 1 ? 'item' : 'items'}
          </Text>
        </View>

        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.cartState}>
          <ActivityIndicator size="large" />

          <Text style={styles.cartStateText}>
            Loading your cart...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.cartState}>
          <Text style={styles.cartEmptyEmoji}>
            ⚠️
          </Text>

          <Text style={styles.cartStateTitle}>
            Something went wrong
          </Text>

          <Text style={styles.cartStateText}>
            {error}
          </Text>

          <Pressable
            style={styles.retryButton}
            onPress={() => {
              void loadCart();
            }}
          >
            <Text style={styles.retryButtonText}>
              Try again
            </Text>
          </Pressable>
        </View>
      ) : !cart || cart.items.length === 0 ? (
        <View style={styles.cartState}>
          <Text style={styles.cartEmptyEmoji}>
            🛒
          </Text>

          <Text style={styles.cartStateTitle}>
            Your cart is empty
          </Text>

          <Text style={styles.cartStateText}>
            Add some fresh groceries and they will
            appear here.
          </Text>

          <Pressable
            style={styles.continueShoppingButton}
            onPress={onBack}
          >
            <Text
              style={
                styles.continueShoppingButtonText
              }
            >
              Continue shopping
            </Text>
          </Pressable>
        </View>
      ) : (
        <>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={
              styles.cartContent
            }
          >
            <View style={styles.cartDeliveryCard}>
              <Text style={styles.cartDeliveryIcon}>
                ⚡
              </Text>

              <View
                style={styles.cartDeliveryContent}
              >
                <Text
                  style={styles.cartDeliveryTitle}
                >
                  Fast delivery
                </Text>

                <Text
                  style={styles.cartDeliveryText}
                >
                  Your groceries will be prepared
                  for quick delivery.
                </Text>
              </View>
            </View>

            <Text style={styles.cartSectionTitle}>
              Cart items
            </Text>

            {cart.items.map((item) => {
              const isUpdating =
                updatingItemId ===
                item.productId;

              return (
                <View
                  key={item.id}
                  style={styles.cartItemCard}
                >
                  <View style={styles.cartProductImage}>
                    {getProductImage(
                      (item.product as Product).name,
                    ) ? (
                      <Image
                        source={getProductImage(
                          (item.product as Product).name,
                        )}
                        style={styles.cartProductImageAsset}
                        resizeMode="contain"
                      />
                    ) : (
                      <Text style={styles.productEmoji}>
                        {getProductIcon(
                          item.product as Product,
                        )}
                      </Text>
                    )}
                  </View>

                  <View
                    style={styles.cartItemMain}
                  >
                    <Text
                      style={styles.cartItemName}
                      numberOfLines={2}
                    >
                      {item.product.name}
                    </Text>

                    <Text
                      style={styles.cartItemUnit}
                    >
                      {item.product.unit}
                    </Text>

                    <Text
                      style={styles.cartItemPrice}
                    >
                      ₹{item.product.price}
                    </Text>

                    <View
                      style={styles.quantityRow}
                    >
                      <Pressable
                        style={[
                          styles.quantityButton,
                          isUpdating &&
                          styles.quantityButtonDisabled,
                        ]}
                        disabled={isUpdating}
                        onPress={() => {
                          if (
                            item.quantity === 1
                          ) {
                            void handleRemove(
                              item.productId,
                            );
                          } else {
                            void changeQuantity(
                              item.productId,
                              item.quantity - 1,
                            );
                          }
                        }}
                      >
                        <Text
                          style={
                            styles.quantityButtonText
                          }
                        >
                          −
                        </Text>
                      </Pressable>

                      <Text
                        style={
                          styles.quantityValue
                        }
                      >
                        {isUpdating
                          ? '...'
                          : item.quantity}
                      </Text>

                      <Pressable
                        style={[
                          styles.quantityButton,
                          isUpdating &&
                          styles.quantityButtonDisabled,
                        ]}
                        disabled={isUpdating}
                        onPress={() => {
                          void changeQuantity(
                            item.productId,
                            item.quantity + 1,
                          );
                        }}
                      >
                        <Text
                          style={
                            styles.quantityButtonText
                          }
                        >
                          +
                        </Text>
                      </Pressable>
                    </View>
                  </View>

                  <Pressable
                    style={styles.removeButton}
                    disabled={isUpdating}
                    onPress={() => {
                      void handleRemove(
                        item.productId,
                      );
                    }}
                  >
                    <Text
                      style={styles.removeButtonText}
                    >
                      Remove
                    </Text>
                  </Pressable>
                </View>
              );
            })}

            <View style={styles.billCard}>
              <Text style={styles.billTitle}>
                Bill details
              </Text>

              <View style={styles.billRow}>
                <Text style={styles.billLabel}>
                  Item total
                </Text>

                <Text style={styles.billValue}>
                  ₹{subtotal.toFixed(2)}
                </Text>
              </View>

              <View style={styles.billRow}>
                <Text style={styles.billLabel}>
                  Delivery fee
                </Text>

                {deliveryFee === 0 ? (
                  <Text style={styles.freeText}>
                    FREE
                  </Text>
                ) : (
                  <Text style={styles.billValue}>
                    ₹{deliveryFee.toFixed(2)}
                  </Text>
                )}
              </View>

              <View style={styles.billDivider} />

              <View style={styles.billRow}>
                <Text style={styles.totalLabel}>
                  Total
                </Text>

                <Text style={styles.totalValue}>
                  ₹{total.toFixed(2)}
                </Text>
              </View>
            </View>

            <View style={styles.bottomSpacing} />
          </ScrollView>

          <View style={styles.checkoutBar}>
            <View>
              <Text style={styles.checkoutLabel}>
                Total
              </Text>

              <Text style={styles.checkoutAmount}>
                ₹{total.toFixed(2)}
              </Text>
            </View>

            <Pressable
              style={styles.checkoutButton}
              onPress={() => onCheckout(cart)}
            >
              <Text
                style={styles.checkoutButtonText}
              >
                Proceed to checkout →
              </Text>
            </Pressable>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

type CheckoutScreenProps = {
  cart: Cart;
  userId: number;
  token: string;
  onBack: () => void;
  onSuccess: (order: Order) => void;
};

function CheckoutScreen({
  cart,
  userId,
  token,
  onBack,
  onSuccess,
}: CheckoutScreenProps) {
  const [locationQuery, setLocationQuery] = useState('');
  const [selectedLocation, setSelectedLocation] =
    useState<LocationSuggestion | null>(null);

  const [locationSuggestions, setLocationSuggestions] =
    useState<LocationSuggestion[]>([]);

  const [searchingLocations, setSearchingLocations] =
    useState(false);

  const [addressDetails, setAddressDetails] =
    useState('');

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>('cod');

  const [placingOrder, setPlacingOrder] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    const query = locationQuery.trim();

    if (query.length < 2) {
      setLocationSuggestions([]);
      setSearchingLocations(false);
      return;
    }

    let cancelled = false;

    const timer = setTimeout(async () => {
      try {
        setSearchingLocations(true);

        const results = await searchLocations(query);

        if (!cancelled) {
          setLocationSuggestions(results);
        }
      } catch (error) {
        if (!cancelled) {
          setLocationSuggestions([]);
          setError(
            error instanceof Error
              ? error.message
              : 'Unable to search locations.',
          );
        }
      } finally {
        if (!cancelled) {
          setSearchingLocations(false);
        }
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [locationQuery]);

  const subtotal =
    cart.items?.reduce(
      (total, item) =>
        total +
        Number(item.product.price) *
        item.quantity,
      0,
    ) ?? 0;

  const deliveryFee =
    subtotal >= 500 ? 0 : 40;

  const total = subtotal + deliveryFee;

  function handleSelectLocation(
    location: LocationSuggestion,
  ) {
    setSelectedLocation(location);
    setLocationQuery('');
    setLocationSuggestions([]);
    setAddressDetails('');
    setError(null);
  }

  function handleChangeLocation() {
    setSelectedLocation(null);
    setLocationQuery('');
    setLocationSuggestions([]);
    setAddressDetails('');
    setError(null);
  }

  function getFinalAddress() {
    if (!selectedLocation) {
      return '';
    }

    const baseAddress =
      selectedLocation.address ||
      selectedLocation.name;

    const details = addressDetails.trim();

    if (!details) {
      return baseAddress;
    }

    return `${details}, ${baseAddress}`;
  }

  async function handlePlaceOrder() {
    if (!selectedLocation) {
      setError(
        'Please search and select your delivery location.',
      );
      return;
    }

    const finalAddress = getFinalAddress();

    if (finalAddress.length < 10) {
      setError(
        'Please enter more delivery address details.',
      );
      return;
    }

    try {
      setPlacingOrder(true);
      setError(null);

      const order = await createOrder(
        userId,
        {
          deliveryAddress: finalAddress,
          latitude:
            selectedLocation.latitude,
          longitude:
            selectedLocation.longitude,
          paymentMethod,
        },
        token,
      );

      onSuccess(order);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Unable to place your order.',
      );
    } finally {
      setPlacingOrder(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.checkoutHeader}>
        <Pressable
          style={styles.backButton}
          onPress={onBack}
          disabled={placingOrder}
        >
          <Text style={styles.backButtonText}>
            ‹
          </Text>
        </Pressable>

        <Text style={styles.checkoutHeaderTitle}>
          Checkout
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          styles.checkoutContent
        }
      >
        <Text style={styles.checkoutSectionTitle}>
          Delivery location
        </Text>

        <View style={styles.addressCard}>
          <Text style={styles.addressIcon}>
            📍
          </Text>

          <View style={styles.addressContent}>
            <Text style={styles.addressLabel}>
              Deliver to
            </Text>

            <Text
              style={styles.addressText}
              numberOfLines={3}
            >
              {selectedLocation
                ? getFinalAddress()
                : 'Search and select your delivery location'}
            </Text>
          </View>
        </View>

        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>
            Search location
          </Text>

          <View style={styles.locationSearchRow}>
            <Text style={styles.locationSearchIcon}>
              🔎
            </Text>

            <TextInput
              value={locationQuery}
              onChangeText={(text) => {
                setLocationQuery(text);
                setError(null);
              }}
              placeholder="Area, street, landmark or pincode"
              placeholderTextColor="#999D95"
              style={styles.locationSearchInput}
              editable={!placingOrder}
              returnKeyType="search"
            />
          </View>

          {searchingLocations ? (
            <View
              style={styles.locationSearchLoading}
            >
              <ActivityIndicator
                size="small"
                color="#176B3A"
              />

              <Text
                style={
                  styles.locationSearchLoadingText
                }
              >
                Searching locations...
              </Text>
            </View>
          ) : null}

          {locationSuggestions.length > 0 ? (
            <View
              style={styles.locationSuggestions}
            >
              {locationSuggestions.map(
                (suggestion) => (
                  <Pressable
                    key={suggestion.id}
                    style={styles.locationSuggestion}
                    onPress={() => {
                      handleSelectLocation(
                        suggestion,
                      );
                    }}
                    disabled={placingOrder}
                  >
                    <View
                      style={
                        styles.locationSuggestionIcon
                      }
                    >
                      <Text>📍</Text>
                    </View>

                    <View
                      style={
                        styles.locationSuggestionContent
                      }
                    >
                      <Text
                        style={
                          styles.locationSuggestionName
                        }
                        numberOfLines={1}
                      >
                        {suggestion.name}
                      </Text>

                      <Text
                        style={
                          styles.locationSuggestionAddress
                        }
                        numberOfLines={2}
                      >
                        {suggestion.address}
                      </Text>
                    </View>
                  </Pressable>
                ),
              )}
            </View>
          ) : null}

          {selectedLocation ? (
            <View
              style={styles.locationSelectedCard}
            >
              <View
                style={styles.locationSelectedIcon}
              >
                <Text>✓</Text>
              </View>

              <View
                style={styles.locationSelectedContent}
              >
                <Text
                  style={
                    styles.locationSelectedLabel
                  }
                >
                  Location selected
                </Text>

                <Text
                  style={
                    styles.locationSelectedText
                  }
                  numberOfLines={2}
                >
                  {selectedLocation.address ||
                    selectedLocation.name}
                </Text>
              </View>

              <Pressable
                onPress={handleChangeLocation}
                disabled={placingOrder}
              >
                <Text
                  style={
                    styles.locationChangeButtonText
                  }
                >
                  Change
                </Text>
              </Pressable>
            </View>
          ) : null}

          <Text style={styles.inputLabel}>
            House / Flat / Floor / Landmark
          </Text>

          <TextInput
            value={addressDetails}
            onChangeText={(text) => {
              setAddressDetails(text);
              setError(null);
            }}
            placeholder="e.g. Flat 203, Green Park, near main gate"
            placeholderTextColor="#999D95"
            style={styles.addressDetailsInput}
            editable={
              !placingOrder && !!selectedLocation
            }
            multiline
            textAlignVertical="top"
          />

          {!selectedLocation ? (
            <Text style={styles.locationHint}>
              Select a location above first, then add
              your house or flat details.
            </Text>
          ) : null}
        </View>

        <Text style={styles.checkoutSectionTitle}>
          Payment method
        </Text>

        <View style={styles.paymentList}>
          <Pressable
            style={[
              styles.paymentOption,
              paymentMethod === 'cod' &&
              styles.paymentOptionSelected,
            ]}
            onPress={() => {
              setPaymentMethod('cod');
            }}
          >
            <View style={styles.paymentIcon}>
              <Text>💵</Text>
            </View>

            <View style={styles.paymentContent}>
              <Text style={styles.paymentTitle}>
                Cash on Delivery
              </Text>

              <Text style={styles.paymentSubtitle}>
                Pay when your order arrives
              </Text>
            </View>

            <View
              style={[
                styles.radio,
                paymentMethod === 'cod' &&
                styles.radioSelected,
              ]}
            >
              {paymentMethod === 'cod' ? (
                <View style={styles.radioDot} />
              ) : null}
            </View>
          </Pressable>

          <Pressable
            style={[
              styles.paymentOption,
              paymentMethod === 'upi' &&
              styles.paymentOptionSelected,
            ]}
            onPress={() => {
              setPaymentMethod('upi');
            }}
          >
            <View style={styles.paymentIcon}>
              <Text>📱</Text>
            </View>

            <View style={styles.paymentContent}>
              <Text style={styles.paymentTitle}>
                UPI
              </Text>

              <Text style={styles.paymentSubtitle}>
                Payment integration ready
              </Text>
            </View>

            <View
              style={[
                styles.radio,
                paymentMethod === 'upi' &&
                styles.radioSelected,
              ]}
            >
              {paymentMethod === 'upi' ? (
                <View style={styles.radioDot} />
              ) : null}
            </View>
          </Pressable>

          <Pressable
            style={[
              styles.paymentOption,
              paymentMethod === 'card' &&
              styles.paymentOptionSelected,
            ]}
            onPress={() => {
              setPaymentMethod('card');
            }}
          >
            <View style={styles.paymentIcon}>
              <Text>💳</Text>
            </View>

            <View style={styles.paymentContent}>
              <Text style={styles.paymentTitle}>
                Card
              </Text>

              <Text style={styles.paymentSubtitle}>
                Payment integration ready
              </Text>
            </View>

            <View
              style={[
                styles.radio,
                paymentMethod === 'card' &&
                styles.radioSelected,
              ]}
            >
              {paymentMethod === 'card' ? (
                <View style={styles.radioDot} />
              ) : null}
            </View>
          </Pressable>
        </View>

        <Text style={styles.checkoutSectionTitle}>
          Order summary
        </Text>

        <View style={styles.checkoutSummary}>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>
              Items
            </Text>

            <Text style={styles.billValue}>
              {cart.items.reduce(
                (sum, item) =>
                  sum + item.quantity,
                0,
              )}
            </Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>
              Item total
            </Text>

            <Text style={styles.billValue}>
              ₹{subtotal.toFixed(2)}
            </Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>
              Delivery
            </Text>

            {deliveryFee === 0 ? (
              <Text style={styles.freeText}>
                FREE
              </Text>
            ) : (
              <Text style={styles.billValue}>
                ₹{deliveryFee.toFixed(2)}
              </Text>
            )}
          </View>

          <View style={styles.billDivider} />

          <View style={styles.billRow}>
            <Text style={styles.totalLabel}>
              To pay
            </Text>

            <Text style={styles.totalValue}>
              ₹{total.toFixed(2)}
            </Text>
          </View>
        </View>

        {error ? (
          <View style={styles.checkoutError}>
            <Text style={styles.checkoutErrorText}>
              {error}
            </Text>
          </View>
        ) : null}

        <View style={styles.bottomSpacingLarge} />
      </ScrollView>

      <View style={styles.placeOrderBar}>
        <View>
          <Text style={styles.checkoutLabel}>
            To pay
          </Text>

          <Text style={styles.checkoutAmount}>
            ₹{total.toFixed(2)}
          </Text>
        </View>

        <Pressable
          style={[
            styles.placeOrderButton,
            placingOrder &&
            styles.placeOrderButtonDisabled,
          ]}
          onPress={() => {
            void handlePlaceOrder();
          }}
          disabled={placingOrder}
        >
          {placingOrder ? (
            <ActivityIndicator
              color="#FFFFFF"
            />
          ) : (
            <Text
              style={styles.placeOrderButtonText}
            >
              Place order
            </Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

type OrderSuccessScreenProps = {
  order: Order;
  onContinue: () => void;
};

function OrderSuccessScreen({
  order,
  onContinue,
}: OrderSuccessScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.successScreen}>
        <View style={styles.successIcon}>
          <Text style={styles.successIconText}>
            ✓
          </Text>
        </View>

        <Text style={styles.successTitle}>
          Order placed!
        </Text>

        <Text style={styles.successSubtitle}>
          Your groceries are on their way to being
          prepared.
        </Text>

        <View style={styles.successCard}>
          <View style={styles.successRow}>
            <Text style={styles.successLabel}>
              Order ID
            </Text>

            <Text style={styles.successValue}>
              #{order.id}
            </Text>
          </View>

          <View style={styles.successRow}>
            <Text style={styles.successLabel}>
              Payment
            </Text>

            <Text style={styles.successValue}>
              {order.paymentMethod.toUpperCase()}
            </Text>
          </View>

          <View style={styles.successRow}>
            <Text style={styles.successLabel}>
              Status
            </Text>

            <Text style={styles.successStatus}>
              {order.status}
            </Text>
          </View>

          <View style={styles.billDivider} />

          <View style={styles.successRow}>
            <Text style={styles.totalLabel}>
              Total
            </Text>

            <Text style={styles.totalValue}>
              ₹{Number(order.total).toFixed(2)}
            </Text>
          </View>
        </View>

        <Pressable
          style={styles.continueShoppingButton}
          onPress={onContinue}
        >
          <Text
            style={
              styles.continueShoppingButtonText
            }
          >
            Continue shopping
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function CustomerHome() {
  const {
    user,
    token,
    loading: authLoading,
    signIn,
    signOut,
  } = useAuth();

  type MainView =
    | 'home'
    | 'browse'
    | 'account';

  const [mainView, setMainView] =
    useState<MainView>('home');

  const [products, setProducts] =
    useState<Product[]>([]);

  const [loadingProducts, setLoadingProducts] =
    useState(true);

  const [productsError, setProductsError] =
    useState<string | null>(null);

  const [cartItemCount, setCartItemCount] =
    useState(0);

  const [customerCart, setCustomerCart] =
    useState<Cart | null>(null);

  const [addingProductId, setAddingProductId] =
    useState<number | null>(null);

  const [addedProductIds, setAddedProductIds] =
    useState<Set<number>>(new Set());

  const [showLogin, setShowLogin] =
    useState(false);

  const [showCart, setShowCart] =
    useState(false);

  const [showOrders, setShowOrders] =
    useState(false);

  const [showAI, setShowAI] =
    useState(false);

  const [aiReturnView, setAiReturnView] =
    useState<MainView>('home');

  const [selectedOrder, setSelectedOrder] =
    useState<Order | null>(null);

  const [checkoutCart, setCheckoutCart] =
    useState<Cart | null>(null);

  const [completedOrder, setCompletedOrder] =
    useState<Order | null>(null);

  const [cartError, setCartError] =
    useState<string | null>(null);

  const [searchQuery, setSearchQuery] =
    useState('');

  const [selectedCategory, setSelectedCategory] =
    useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadProducts() {
      try {
        setLoadingProducts(true);
        setProductsError(null);

        const data = await getProducts();

        if (!mounted) {
          return;
        }

        const customerProducts = data.filter(
          (product) =>
            product.isActive &&
            isCustomerProduct(product),
        );

        setProducts(customerProducts);
      } catch (error) {
        if (!mounted) {
          return;
        }

        setProductsError(
          error instanceof Error
            ? error.message
            : 'Unable to load products',
        );

        setProducts([]);
      } finally {
        if (mounted) {
          setLoadingProducts(false);
        }
      }
    }

    void loadProducts();

    const retryTimer = setTimeout(() => {
      void loadProducts();
    }, 1500);

    return () => {
      mounted = false;
      clearTimeout(retryTimer);
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadCart() {
      if (!user || !token) {
        if (mounted) {
          setCustomerCart(null);
          setCartItemCount(0);
        }

        return;
      }

      try {
        const cart = await getCart(
          user.id,
          token,
        );

        if (!mounted) {
          return;
        }

        setCustomerCart(cart);

        const totalQuantity =
          cart.items?.reduce(
            (total, item) =>
              total + item.quantity,
            0,
          ) ?? 0;

        setCartItemCount(totalQuantity);
      } catch {
        if (mounted) {
          setCustomerCart(null);
          setCartItemCount(0);
        }
      }
    }

    void loadCart();

    return () => {
      mounted = false;
    };
  }, [user, token]);

  async function handleLoginSuccess(
    response: LoginResponse,
  ) {
    await signIn(
      response.accessToken,
      response.user,
    );

    setShowLogin(false);
    setMainView('home');
  }

  async function handleAddProduct(
    product: Product,
  ) {
    if (!user || !token) {
      setShowLogin(true);
      return;
    }

    try {
      setAddingProductId(product.id);
      setCartError(null);

      const currentQuantity =
        customerCart?.items.find(
          (item) =>
            item.productId === product.id,
        )?.quantity ?? 0;

      const updatedCart = await addToCart(
        user.id,
        product.id,
        currentQuantity > 0 ? 1 : 1,
        token,
      );

      const refreshedCart =
        updatedCart ??
        (await getCart(user.id, token));

      setCustomerCart(refreshedCart);

      const totalQuantity =
        refreshedCart.items?.reduce(
          (total, item) =>
            total + item.quantity,
          0,
        ) ?? 0;

      setCartItemCount(totalQuantity);
    } catch (error) {
      setCartError(
        error instanceof Error
          ? error.message
          : 'Unable to add product to cart.',
      );
    } finally {
      setAddingProductId(null);
    }
  }

  function getProductQuantity(productId: number) {
    return (
      customerCart?.items.find(
        (item) => item.productId === productId,
      )?.quantity ?? 0
    );
  }

  async function increaseProductQuantity(
    product: Product,
  ) {
    if (!user || !token) {
      setShowLogin(true);
      return;
    }

    try {
      setAddingProductId(product.id);
      setCartError(null);

      const currentQuantity =
        getProductQuantity(product.id);

      await updateCartItem(
        user.id,
        product.id,
        currentQuantity + 1,
        token,
      );

      const refreshedCart = await getCart(
        user.id,
        token,
      );

      setCustomerCart(refreshedCart);

      const totalQuantity =
        refreshedCart.items?.reduce(
          (total, item) =>
            total + item.quantity,
          0,
        ) ?? 0;

      setCartItemCount(totalQuantity);
    } catch (error) {
      setCartError(
        error instanceof Error
          ? error.message
          : 'Unable to update cart.',
      );
    } finally {
      setAddingProductId(null);
    }
  }

  async function decreaseProductQuantity(
    product: Product,
  ) {
    if (!user || !token) {
      setShowLogin(true);
      return;
    }

    try {
      setAddingProductId(product.id);
      setCartError(null);

      const currentQuantity =
        getProductQuantity(product.id);

      if (currentQuantity <= 1) {
        await removeCartItem(
          user.id,
          product.id,
          token,
        );
      } else {
        await updateCartItem(
          user.id,
          product.id,
          currentQuantity - 1,
          token,
        );
      }

      const refreshedCart = await getCart(
        user.id,
        token,
      );

      setCustomerCart(refreshedCart);

      const totalQuantity =
        refreshedCart.items?.reduce(
          (total, item) =>
            total + item.quantity,
          0,
        ) ?? 0;

      setCartItemCount(totalQuantity);
    } catch (error) {
      setCartError(
        error instanceof Error
          ? error.message
          : 'Unable to update cart.',
      );
    } finally {
      setAddingProductId(null);
    }
  }

  function handleCartChanged(cart: Cart) {
    const totalQuantity =
      cart.items?.reduce(
        (total, item) =>
          total + item.quantity,
        0,
      ) ?? 0;

    setCartItemCount(totalQuantity);
  }

  function handleCheckout(cart: Cart) {
    setCartError(null);
    setShowCart(false);
    setCheckoutCart(cart);
  }

  function handleOrderSuccess(order: Order) {
    setCheckoutCart(null);
    setCartItemCount(0);
    setCompletedOrder(order);
  }

  function openAI() {
    setAiReturnView(mainView);
    setShowAI(true);
  }

  function closeAI() {
    setShowAI(false);
    setMainView(aiReturnView);
  }

  function openBrowse(category?: string) {
    setSelectedCategory(category ?? null);
    setSearchQuery('');
    setMainView('browse');
  }

  function openHome() {
    setSearchQuery('');
    setSelectedCategory(null);
    setMainView('home');
  }

  function openAccount() {
    if (!user || !token) {
      setShowLogin(true);
      return;
    }

    setMainView('account');
  }

  const normalizedSearch =
    searchQuery.trim().toLowerCase();

  const visibleProducts =
    products.filter((product) => {
      const searchableText =
        `${product.name} ${product.description ?? ''
          } ${product.slug}`.toLowerCase();

      const matchesSearch =
        !normalizedSearch ||
        searchableText.includes(
          normalizedSearch,
        );

      if (!selectedCategory) {
        return matchesSearch;
      }

      const categoryMap: Record<
        string,
        string[]
      > = {
        Fruits: [
          'apple',
          'banana',
          'orange',
          'fruit',
        ],
        Vegetables: [
          'broccoli',
          'tomato',
          'potato',
          'vegetable',
        ],
        Dairy: [
          'milk',
          'yogurt',
          'butter',
          'dairy',
        ],
        Bakery: [
          'bread',
          'croissant',
          'bakery',
        ],
        Snacks: [
          'chips',
          'granola',
          'almond',
          'snack',
        ],
        Beverages: [
          'coffee',
          'juice',
          'water',
          'beverage',
        ],
      };

      const keywords =
        categoryMap[selectedCategory] ?? [];

      const matchesCategory =
        keywords.some((keyword) =>
          searchableText.includes(keyword),
        );

      return (
        matchesSearch &&
        matchesCategory
      );
    });

  if (authLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.cartState}>
          <ActivityIndicator size="large" />

          <Text style={styles.cartStateText}>
            Restoring your session...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (showLogin) {
    return (
      <LoginScreen
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  if (completedOrder) {
    return (
      <OrderSuccessScreen
        order={completedOrder}
        onContinue={() => {
          setCompletedOrder(null);
          setMainView('home');
        }}
      />
    );
  }

  if (showAI) {
    return (
      <AIAssistantScreen
        onBack={closeAI}
      />
    );
  }

  if (selectedOrder && user && token) {
    return (
      <OrderDetailScreen
        order={selectedOrder}
        onBack={() => {
          setSelectedOrder(null);
          setShowOrders(true);
        }}
      />
    );
  }

  if (checkoutCart && user && token) {
    return (
      <CheckoutScreen
        cart={checkoutCart}
        userId={user.id}
        token={token}
        onBack={() => {
          setCheckoutCart(null);
          setShowCart(true);
        }}
        onSuccess={handleOrderSuccess}
      />
    );
  }

  if (showOrders && user && token) {
    return (
      <OrdersScreen
        userId={user.id}
        token={token}
        onBack={() => {
          setShowOrders(false);
          setMainView('home');
        }}
        onOpenOrder={(order) => {
          setSelectedOrder(order);
          setShowOrders(false);
        }}
      />
    );
  }

  if (showCart && user && token) {
    return (
      <CartScreen
        userId={user.id}
        token={token}
        onBack={() => {
          setShowCart(false);
          setCartError(null);
        }}
        onCheckout={handleCheckout}
        onCartChanged={handleCartChanged}
      />
    );
  }

  if (mainView === 'account') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />

        <View style={styles.cartScreenHeader}>
          <Pressable
            style={styles.backButton}
            onPress={() => {
              setMainView('home');
            }}
          >
            <Text style={styles.backButtonText}>
              ‹
            </Text>
          </Pressable>

          <View style={styles.cartHeaderTitleWrap}>
            <Text style={styles.cartHeaderTitle}>
              Account
            </Text>

            <Text style={styles.cartHeaderSubtitle}>
              Your GoCarto profile
            </Text>
          </View>

          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={
            styles.cartContent
          }
        >
          <View style={styles.accountProfileCard}>
            <View style={styles.accountAvatar}>
              <Text style={styles.accountAvatarText}>
                {(user?.name ??
                  user?.email ??
                  'U')
                  .charAt(0)
                  .toUpperCase()}
              </Text>
            </View>

            <Text style={styles.accountName}>
              {user?.name ??
                user?.username ??
                'GoCarto Customer'}
            </Text>

            <Text style={styles.accountEmail}>
              {user?.email}
            </Text>
          </View>

          <Pressable
            style={styles.accountMenuCard}
            onPress={() => {
              setMainView('home');
              setShowOrders(true);
            }}
          >
            <Text style={styles.accountMenuIcon}>
              ◷
            </Text>

            <View style={styles.accountMenuContent}>
              <Text style={styles.accountMenuTitle}>
                My orders
              </Text>

              <Text style={styles.accountMenuSubtitle}>
                View your recent orders
              </Text>
            </View>

            <Text style={styles.accountMenuArrow}>
              ›
            </Text>
          </Pressable>

          <Pressable
            style={styles.accountMenuCard}
            onPress={openAI}
          >
            <Text style={styles.accountMenuIcon}>
              ✨
            </Text>

            <View style={styles.accountMenuContent}>
              <Text style={styles.accountMenuTitle}>
                GoCarto AI
              </Text>

              <Text style={styles.accountMenuSubtitle}>
                Get help with shopping and orders
              </Text>
            </View>

            <Text style={styles.accountMenuArrow}>
              ›
            </Text>
          </Pressable>

          <Pressable
            style={styles.accountLogoutButton}
            onPress={() => {
              void signOut();
              setMainView('home');
              setCartItemCount(0);
            }}
          >
            <Text style={styles.accountLogoutText}>
              Sign out
            </Text>
          </Pressable>
        </ScrollView>

        <View style={styles.bottomNav}>
          <Pressable
            style={styles.navItem}
            onPress={openHome}
          >
            <Text style={styles.navIcon}>
              ⌂
            </Text>

            <Text style={styles.navLabel}>
              Home
            </Text>
          </Pressable>

          <Pressable
            style={styles.navItem}
            onPress={() => {
              openBrowse();
            }}
          >
            <Text style={styles.navIcon}>
              ▦
            </Text>

            <Text style={styles.navLabel}>
              Browse
            </Text>
          </Pressable>

          <Pressable
            style={styles.navItem}
            onPress={openAI}
          >
            <Text style={styles.navIcon}>
              ✨
            </Text>

            <Text style={styles.navLabel}>
              AI
            </Text>
          </Pressable>

          <Pressable
            style={styles.navItem}
            onPress={() => {
              if (!user || !token) {
                setShowLogin(true);
              } else {
                setShowOrders(true);
              }
            }}
          >
            <Text style={styles.navIcon}>
              ◷
            </Text>

            <Text style={styles.navLabel}>
              Orders
            </Text>
          </Pressable>

          <Pressable
            style={styles.navItem}
            onPress={openAccount}
          >
            <Text style={styles.navIconActive}>
              ◯
            </Text>

            <Text style={styles.navLabelActive}>
              Account
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (mainView === 'browse') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />

        <View style={styles.browseHeader}>
          <View>
            <Text style={styles.deliveryLabel}>
              GO CARTO
            </Text>

            <Text style={styles.browseTitle}>
              Browse groceries
            </Text>
          </View>

          <Pressable
            style={styles.cartButton}
            onPress={() => {
              if (!user || !token) {
                setShowLogin(true);
              } else {
                setShowCart(true);
              }
            }}
          >
            <Text style={styles.cartIcon}>
              🛒
            </Text>

            {cartItemCount > 0 ? (
              <View style={styles.cartBadge}>
                <Text
                  style={styles.cartBadgeText}
                >
                  {cartItemCount > 99
                    ? '99+'
                    : cartItemCount}
                </Text>
              </View>
            ) : null}
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            styles.container
          }
        >
          <View style={styles.searchBox}>
            <Text style={styles.searchIcon}>
              ⌕
            </Text>

            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search groceries, brands and more"
              placeholderTextColor="#8A8E85"
              style={styles.searchInput}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={
              styles.categoryFilterRow
            }
          >
            <Pressable
              style={[
                styles.categoryFilterChip,
                !selectedCategory &&
                styles.categoryFilterChipActive,
              ]}
              onPress={() => {
                setSelectedCategory(null);
              }}
            >
              <Text
                style={[
                  styles.categoryFilterText,
                  !selectedCategory &&
                  styles.categoryFilterTextActive,
                ]}
              >
                All
              </Text>
            </Pressable>

            {categories.map((category) => (
              <Pressable
                key={category.name}
                style={[
                  styles.categoryFilterChip,
                  selectedCategory ===
                  category.name &&
                  styles.categoryFilterChipActive,
                ]}
                onPress={() => {
                  setSelectedCategory(
                    category.name,
                  );
                }}
              >
                <Text
                  style={styles.categoryFilterEmoji}
                >
                  {category.icon}
                </Text>

                <Text
                  style={[
                    styles.categoryFilterText,
                    selectedCategory ===
                    category.name &&
                    styles.categoryFilterTextActive,
                  ]}
                >
                  {category.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {selectedCategory ??
                (searchQuery.trim()
                  ? 'Search results'
                  : 'All groceries')}
            </Text>

            <Text style={styles.productCountText}>
              {visibleProducts.length} items
            </Text>
          </View>

          {productsError ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorTitle}>
                Products unavailable
              </Text>

              <Text style={styles.errorText}>
                {productsError}
              </Text>
            </View>
          ) : loadingProducts ? (
            <View style={styles.stateContainer}>
              <ActivityIndicator size="large" />

              <Text style={styles.stateText}>
                Loading products...
              </Text>
            </View>
          ) : visibleProducts.length === 0 ? (
            <View style={styles.stateContainer}>
              <Text style={styles.emptyEmoji}>
                🔎
              </Text>

              <Text style={styles.stateText}>
                No products match your search.
              </Text>

              <Pressable
                style={
                  styles.continueShoppingButton
                }
                onPress={() => {
                  setSearchQuery('');
                  setSelectedCategory(null);
                }}
              >
                <Text
                  style={
                    styles.continueShoppingButtonText
                  }
                >
                  Clear filters
                </Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.productGrid}>
              {visibleProducts.map((product) => {
                const quantity = getProductQuantity(product.id);
                const isAdding = addingProductId === product.id;

                return (
                  <View
                    key={product.id}
                    style={styles.productCard}
                  >
                    <Pressable
                      onPress={() => {
                        setSearchQuery(product.name);
                      }}
                    >
                      <View style={styles.productImage}>
                        {getProductImage(product.name) ? (
                          <Image
                            source={getProductImage(product.name)}
                            style={styles.productImageAsset}
                            resizeMode="contain"
                          />
                        ) : (
                          <Text style={styles.productEmoji}>
                            {getProductIcon(product)}
                          </Text>
                        )}
                      </View>

                      <Text
                        style={styles.productName}
                        numberOfLines={2}
                      >
                        {product.name}
                      </Text>

                      <Text style={styles.productQuantity}>
                        {product.unit}
                      </Text>

                      <View style={styles.priceRow}>
                        <Text style={styles.productPrice}>
                          ₹{product.price}
                        </Text>
                      </View>
                    </Pressable>

                    {quantity === 0 ? (
                      <Pressable
                        style={[
                          styles.addButton,
                          isAdding &&
                          styles.addButtonDisabled,
                        ]}
                        onPress={() => {
                          void handleAddProduct(product);
                        }}
                        disabled={isAdding}
                      >
                        {isAdding ? (
                          <ActivityIndicator size="small" />
                        ) : (
                          <Text style={styles.addButtonText}>
                            ADD
                          </Text>
                        )}
                      </Pressable>
                    ) : (
                      <View style={styles.quantityControl}>
                        <Pressable
                          style={styles.quantityControlButton}
                          onPress={() => {
                            void decreaseProductQuantity(
                              product,
                            );
                          }}
                          disabled={isAdding}
                        >
                          <Text
                            style={styles.quantityControlText}
                          >
                            −
                          </Text>
                        </Pressable>

                        <Text
                          style={styles.quantityControlValue}
                        >
                          {quantity}
                        </Text>

                        <Pressable
                          style={styles.quantityControlButton}
                          onPress={() => {
                            void increaseProductQuantity(
                              product,
                            );
                          }}
                          disabled={isAdding}
                        >
                          <Text
                            style={styles.quantityControlText}
                          >
                            +
                          </Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          <View style={styles.bottomSpacing} />
        </ScrollView>

        <View style={styles.bottomNav}>
          <Pressable
            style={styles.navItem}
            onPress={openHome}
          >
            <Text style={styles.navIcon}>
              ⌂
            </Text>

            <Text style={styles.navLabel}>
              Home
            </Text>
          </Pressable>

          <Pressable style={styles.navItem}>
            <Text style={styles.navIconActive}>
              ▦
            </Text>

            <Text style={styles.navLabelActive}>
              Browse
            </Text>
          </Pressable>

          <Pressable
            style={styles.navItem}
            onPress={openAI}
          >
            <Text style={styles.navIcon}>
              ✨
            </Text>

            <Text style={styles.navLabel}>
              AI
            </Text>
          </Pressable>

          <Pressable
            style={styles.navItem}
            onPress={() => {
              if (!user || !token) {
                setShowLogin(true);
              } else {
                setShowOrders(true);
              }
            }}
          >
            <Text style={styles.navIcon}>
              ◷
            </Text>

            <Text style={styles.navLabel}>
              Orders
            </Text>
          </Pressable>

          <Pressable
            style={styles.navItem}
            onPress={openAccount}
          >
            <Text style={styles.navIcon}>
              ◯
            </Text>

            <Text style={styles.navLabel}>
              Account
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.deliveryLabel}>
              DELIVERING TO
            </Text>

            <Pressable style={styles.locationButton}>
              <Text style={styles.locationText}>
                📍 Home
              </Text>

              <Text style={styles.chevron}>
                ⌄
              </Text>
            </Pressable>
          </View>

          <Pressable
            style={styles.cartButton}
            onPress={() => {
              if (!user || !token) {
                setShowLogin(true);
              } else {
                setShowCart(true);
              }
            }}
          >
            <Text style={styles.cartIcon}>
              🛒
            </Text>

            {cartItemCount > 0 ? (
              <View style={styles.cartBadge}>
                <Text
                  style={styles.cartBadgeText}
                >
                  {cartItemCount > 99
                    ? '99+'
                    : cartItemCount}
                </Text>
              </View>
            ) : null}
          </Pressable>
        </View>

        <View style={styles.greetingSection}>
          <Text style={styles.greeting}>
            Good morning 👋
          </Text>

          <Text style={styles.subtitle}>
            Fresh groceries, delivered fast.
          </Text>
        </View>

        <Pressable
          style={styles.searchBox}
          onPress={() => {
            openBrowse();
          }}
        >
          <Text style={styles.searchIcon}>
            ⌕
          </Text>

          <Text style={styles.searchPlaceholder}>
            Search for groceries, brands and more
          </Text>
        </Pressable>

        <Pressable
          style={styles.aiCard}
          onPress={openAI}
        >
          <View style={styles.aiIconContainer}>
            <Text style={styles.aiIcon}>
              ✨
            </Text>
          </View>

          <View style={styles.aiContent}>
            <Text style={styles.aiTitle}>
              Ask GoCarto AI
            </Text>

            <Text style={styles.aiSubtitle}>
              “I need ingredients for pasta tonight”
            </Text>
          </View>

          <Text style={styles.aiArrow}>
            ›
          </Text>
        </Pressable>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Shop by category
          </Text>

          <Pressable
            onPress={() => {
              openBrowse();
            }}
          >
            <Text style={styles.seeAll}>
              See all
            </Text>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRow}
        >
          {categories.map((category) => (
            <Pressable
              key={category.name}
              style={styles.categoryCard}
              onPress={() => {
                openBrowse(category.name);
              }}
            >
              <View style={styles.categoryIcon}>
                <Text style={styles.categoryEmoji}>
                  {category.icon}
                </Text>
              </View>

              <Text style={styles.categoryName}>
                {category.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.offerCard}>
          <View style={styles.offerContent}>
            <Text style={styles.offerEyebrow}>
              TODAY'S OFFER
            </Text>

            <Text style={styles.offerTitle}>
              Fresh picks, better prices.
            </Text>

            <Text style={styles.offerSubtitle}>
              Save on everyday essentials.
            </Text>

            <Pressable
              style={styles.shopButton}
              onPress={() => {
                openBrowse();
              }}
            >
              <Text style={styles.shopButtonText}>
                Shop now
              </Text>
            </Pressable>
          </View>

          <Text style={styles.offerEmoji}>
            🥬
          </Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Popular near you
          </Text>

          <Pressable
            onPress={() => {
              openBrowse();
            }}
          >
            <Text style={styles.seeAll}>
              See all
            </Text>
          </Pressable>
        </View>

        {cartError ? (
          <View style={styles.cartSuccessCard}>
            <Text style={styles.cartSuccessText}>
              {cartError}
            </Text>
          </View>
        ) : null}

        {loadingProducts ? (
          <View style={styles.stateContainer}>
            <ActivityIndicator size="large" />

            <Text style={styles.stateText}>
              Loading fresh products...
            </Text>
          </View>
        ) : productsError ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>
              Products unavailable
            </Text>

            <Text style={styles.errorText}>
              {productsError}
            </Text>
          </View>
        ) : products.length === 0 ? (
          <View style={styles.stateContainer}>
            <Text style={styles.emptyEmoji}>
              🛒
            </Text>

            <Text style={styles.stateText}>
              No products are currently available.
            </Text>
          </View>
        ) : (
          <View style={styles.productGrid}>
            {products.map((product) => {
              const quantity = getProductQuantity(product.id);
              const isAdding =
                addingProductId === product.id;

              return (
                <View
                  key={product.id}
                  style={styles.productCard}
                >
                  <Pressable
                    onPress={() => {
                      openBrowse();
                      setSearchQuery(product.name);
                    }}
                  >
                    <View style={styles.productImage}>
                      {getProductImage(product.name) ? (
                        <Image
                          source={getProductImage(product.name)}
                          style={styles.productImageAsset}
                          resizeMode="contain"
                        />
                      ) : (
                        <Text style={styles.productEmoji}>
                          {getProductIcon(product)}
                        </Text>
                      )}
                    </View>

                    <Text
                      style={styles.productName}
                      numberOfLines={2}
                    >
                      {product.name}
                    </Text>

                    <Text style={styles.productQuantity}>
                      {product.unit}
                    </Text>

                    <View style={styles.priceRow}>
                      <Text style={styles.productPrice}>
                        ₹{product.price}
                      </Text>
                    </View>
                  </Pressable>

                  {quantity === 0 ? (
                    <Pressable
                      style={[
                        styles.addButton,
                        isAdding &&
                        styles.addButtonDisabled,
                      ]}
                      onPress={() => {
                        void handleAddProduct(product);
                      }}
                      disabled={isAdding}
                    >
                      {isAdding ? (
                        <ActivityIndicator size="small" />
                      ) : (
                        <Text style={styles.addButtonText}>
                          ADD
                        </Text>
                      )}
                    </Pressable>
                  ) : (
                    <View style={styles.quantityControl}>
                      <Pressable
                        style={styles.quantityControlButton}
                        onPress={() => {
                          void decreaseProductQuantity(
                            product,
                          );
                        }}
                        disabled={isAdding}
                      >
                        <Text
                          style={styles.quantityControlText}
                        >
                          −
                        </Text>
                      </Pressable>

                      <Text
                        style={styles.quantityControlValue}
                      >
                        {quantity}
                      </Text>

                      <Pressable
                        style={styles.quantityControlButton}
                        onPress={() => {
                          void increaseProductQuantity(
                            product,
                          );
                        }}
                        disabled={isAdding}
                      >
                        <Text
                          style={styles.quantityControlText}
                        >
                          +
                        </Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      <View style={styles.bottomNav}>
        <Pressable
          style={styles.navItem}
          onPress={openHome}
        >
          <Text style={styles.navIconActive}>
            ⌂
          </Text>

          <Text style={styles.navLabelActive}>
            Home
          </Text>
        </Pressable>

        <Pressable
          style={styles.navItem}
          onPress={() => {
            openBrowse();
          }}
        >
          <Text style={styles.navIcon}>
            ▦
          </Text>

          <Text style={styles.navLabel}>
            Browse
          </Text>
        </Pressable>

        <Pressable
          style={styles.navItem}
          onPress={openAI}
        >
          <Text style={styles.navIcon}>
            ✨
          </Text>

          <Text style={styles.navLabel}>
            AI
          </Text>
        </Pressable>

        <Pressable
          style={styles.navItem}
          onPress={() => {
            if (!user || !token) {
              setShowLogin(true);
            } else {
              setShowOrders(true);
            }
          }}
        >
          <Text style={styles.navIcon}>
            ◷
          </Text>

          <Text style={styles.navLabel}>
            Orders
          </Text>
        </Pressable>

        <Pressable
          style={styles.navItem}
          onPress={openAccount}
        >
          <Text style={styles.navIcon}>
            ◯
          </Text>

          <Text style={styles.navLabel}>
            Account
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CustomerHome />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F8F5',
  },

  container: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 110,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  deliveryLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#777A73',
    marginBottom: 3,
  },

  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  locationText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#20231F',
  },

  chevron: {
    fontSize: 18,
    marginLeft: 5,
    color: '#5E625A',
  },

  cartButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },

  cartIcon: {
    fontSize: 21,
  },

  cartBadge: {
    position: 'absolute',
    top: 3,
    right: 2,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: '#176B3A',
    alignItems: 'center',
    justifyContent: 'center',
  },

  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '800',
  },

  greetingSection: {
    marginTop: 28,
    marginBottom: 16,
  },

  greeting: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    color: '#191C18',
  },

  subtitle: {
    marginTop: 5,
    fontSize: 14,
    color: '#777A73',
  },

  searchBox: {
    height: 54,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7E1',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },

  searchIcon: {
    fontSize: 27,
    color: '#6E736A',
    marginRight: 9,
  },

  searchPlaceholder: {
    flex: 1,
    fontSize: 14,
    color: '#8A8E85',
  },

  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 14,
    color: '#20231F',
  },

  aiCard: {
    marginTop: 16,
    padding: 15,
    borderRadius: 18,
    backgroundColor: '#E9F4EC',
    flexDirection: 'row',
    alignItems: 'center',
  },

  aiIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  aiIcon: {
    fontSize: 21,
  },

  aiContent: {
    flex: 1,
    marginLeft: 12,
  },

  aiTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#173A25',
  },

  aiSubtitle: {
    marginTop: 3,
    fontSize: 12,
    color: '#56705E',
  },

  aiArrow: {
    fontSize: 27,
    color: '#376347',
    marginLeft: 8,
  },

  sectionHeader: {
    marginTop: 28,
    marginBottom: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#20231F',
  },

  seeAll: {
    fontSize: 13,
    fontWeight: '700',
    color: '#176B3A',
  },

  categoryRow: {
    gap: 12,
    paddingRight: 20,
  },

  categoryCard: {
    width: 76,
    alignItems: 'center',
  },

  categoryIcon: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E7E9E3',
  },

  categoryEmoji: {
    fontSize: 30,
  },

  categoryName: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
    color: '#4F534C',
  },

  categoryFilterRow: {
    gap: 8,
    paddingVertical: 14,
  },

  categoryFilterChip: {
    minHeight: 38,
    paddingHorizontal: 13,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E1E4DC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  categoryFilterChipActive: {
    backgroundColor: '#176B3A',
    borderColor: '#176B3A',
  },

  categoryFilterEmoji: {
    marginRight: 5,
    fontSize: 14,
  },

  categoryFilterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#555A52',
  },

  categoryFilterTextActive: {
    color: '#FFFFFF',
  },

  productCountText: {
    fontSize: 12,
    color: '#777A73',
    fontWeight: '600',
  },

  offerCard: {
    marginTop: 28,
    minHeight: 180,
    borderRadius: 22,
    backgroundColor: '#1C5934',
    padding: 22,
    overflow: 'hidden',
    flexDirection: 'row',
  },

  offerContent: {
    flex: 1,
    zIndex: 2,
  },

  offerEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#B8E4C3',
  },

  offerTitle: {
    marginTop: 7,
    maxWidth: 230,
    fontSize: 23,
    lineHeight: 28,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  offerSubtitle: {
    marginTop: 6,
    fontSize: 12,
    color: '#D1E8D6',
  },

  shopButton: {
    alignSelf: 'flex-start',
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },

  shopButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1C5934',
  },

  offerEmoji: {
    position: 'absolute',
    right: 15,
    bottom: -3,
    fontSize: 105,
  },

  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
  },

  productCard: {
    width: '48%',
    padding: 12,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7E9E3',
  },

  productImage: {
    height: 120,
    borderRadius: 14,
    backgroundColor: '#F3F5EF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 11,
  },

  productImageAsset: {
    width: '88%',
    height: '88%',
  },

  productEmoji: {
    fontSize: 58,
  },

  productName: {
    minHeight: 38,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '700',
    color: '#262923',
  },

  productQuantity: {
    marginTop: 3,
    fontSize: 11,
    color: '#8A8E85',
  },

  priceRow: {
    marginTop: 9,
    flexDirection: 'row',
    alignItems: 'center',
  },

  productPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1C5934',
  },

  addButton: {
    marginTop: 11,
    height: 34,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#1C7A43',
    alignItems: 'center',
    justifyContent: 'center',
  },

  addButtonDisabled: {
    opacity: 0.7,
  },

  addButtonAdded: {
    backgroundColor: '#E9F4EC',
    borderColor: '#176B3A',
  },

  addButtonText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#176B3A',
  },

  addButtonTextAdded: {
    color: '#176B3A',
  },

  quantityControl: {
    marginTop: 11,
    height: 34,
    borderRadius: 9,
    backgroundColor: '#E9F4EC',
    borderWidth: 1,
    borderColor: '#1C7A43',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },

  quantityControlButton: {
    width: 30,
    height: 28,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },

  quantityControlText: {
    fontSize: 18,
    lineHeight: 20,
    fontWeight: '800',
    color: '#176B3A',
  },

  quantityControlValue: {
    minWidth: 24,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '800',
    color: '#20231F',
  },

  cartSuccessCard: {
    marginBottom: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#E9F4EC',
    borderWidth: 1,
    borderColor: '#C8E3CF',
  },

  cartSuccessText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#176B3A',
  },

  stateContainer: {
    minHeight: 160,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E7E9E3',
    padding: 20,
  },

  stateText: {
    marginTop: 12,
    textAlign: 'center',
    fontSize: 13,
    color: '#777A73',
  },

  emptyEmoji: {
    fontSize: 38,
  },

  errorCard: {
    padding: 20,
    borderRadius: 18,
    backgroundColor: '#FFF5F3',
    borderWidth: 1,
    borderColor: '#F1D6D1',
  },

  errorTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#8B3025',
  },

  errorText: {
    marginTop: 5,
    fontSize: 12,
    color: '#9B625A',
  },

  cartScreenHeader: {
    height: 72,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E7E9E3',
    backgroundColor: '#FFFFFF',
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F3F5EF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  backButtonText: {
    fontSize: 32,
    lineHeight: 34,
    color: '#20231F',
    marginTop: -3,
  },

  cartHeaderTitleWrap: {
    alignItems: 'center',
  },

  cartHeaderTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#20231F',
  },

  cartHeaderSubtitle: {
    marginTop: 2,
    fontSize: 11,
    color: '#777A73',
  },

  headerSpacer: {
    width: 42,
  },

  cartContent: {
    padding: 20,
    paddingBottom: 125,
  },

  cartDeliveryCard: {
    padding: 15,
    borderRadius: 17,
    backgroundColor: '#E9F4EC',
    flexDirection: 'row',
    alignItems: 'center',
  },

  cartDeliveryIcon: {
    fontSize: 25,
  },

  cartDeliveryContent: {
    flex: 1,
    marginLeft: 11,
  },

  cartDeliveryTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#173A25',
  },

  cartDeliveryText: {
    marginTop: 3,
    fontSize: 11,
    lineHeight: 16,
    color: '#56705E',
  },

  cartSectionTitle: {
    marginTop: 25,
    marginBottom: 12,
    fontSize: 18,
    fontWeight: '800',
    color: '#20231F',
  },

  cartItemCard: {
    minHeight: 135,
    marginBottom: 12,
    padding: 12,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7E9E3',
    flexDirection: 'row',
  },

  cartProductImage: {
    width: 92,
    height: 105,
    borderRadius: 14,
    backgroundColor: '#F3F5EF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  cartProductEmoji: {
    fontSize: 45,
  },

  cartProductImageAsset: {
  width: '88%',
  height: '88%',
},

  cartItemMain: {
    flex: 1,
    marginLeft: 13,
  },

  cartItemName: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '700',
    color: '#262923',
  },

  cartItemUnit: {
    marginTop: 3,
    fontSize: 11,
    color: '#8A8E85',
  },

  cartItemPrice: {
    marginTop: 6,
    fontSize: 15,
    fontWeight: '800',
    color: '#1C5934',
  },

  quantityRow: {
    marginTop: 9,
    flexDirection: 'row',
    alignItems: 'center',
  },

  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: '#E9F4EC',
    alignItems: 'center',
    justifyContent: 'center',
  },

  quantityButtonDisabled: {
    opacity: 0.5,
  },

  quantityButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#176B3A',
  },

  quantityValue: {
    width: 32,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '800',
    color: '#20231F',
  },

  removeButton: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },

  removeButtonText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#A14B40',
  },

  billCard: {
    marginTop: 10,
    padding: 17,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7E9E3',
  },

  billTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#20231F',
    marginBottom: 13,
  },

  billRow: {
    marginTop: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  billLabel: {
    fontSize: 13,
    color: '#777A73',
  },

  billValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3F433C',
  },

  freeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#176B3A',
  },

  billDivider: {
    height: 1,
    marginTop: 15,
    backgroundColor: '#E7E9E3',
  },

  totalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#20231F',
  },

  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1C5934',
  },

  cartState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 35,
  },

  cartEmptyEmoji: {
    fontSize: 52,
  },

  cartStateTitle: {
    marginTop: 15,
    fontSize: 20,
    fontWeight: '800',
    color: '#20231F',
    textAlign: 'center',
  },

  cartStateText: {
    marginTop: 7,
    fontSize: 13,
    lineHeight: 19,
    color: '#777A73',
    textAlign: 'center',
  },

  retryButton: {
    marginTop: 20,
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 11,
    backgroundColor: '#176B3A',
  },

  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  continueShoppingButton: {
    marginTop: 22,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 11,
    backgroundColor: '#176B3A',
  },

  continueShoppingButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  checkoutBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: 88,
    paddingHorizontal: 20,
    paddingVertical: 13,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E7E9E3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  checkoutLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#777A73',
  },

  checkoutAmount: {
    marginTop: 2,
    fontSize: 20,
    fontWeight: '800',
    color: '#20231F',
  },

  checkoutButton: {
    minHeight: 48,
    paddingHorizontal: 18,
    borderRadius: 13,
    backgroundColor: '#176B3A',
    alignItems: 'center',
    justifyContent: 'center',
  },

  checkoutButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  checkoutHeader: {
    height: 72,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E7E9E3',
  },

  checkoutHeaderTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#20231F',
  },

  checkoutContent: {
    padding: 20,
    paddingBottom: 125,
  },

  checkoutSectionTitle: {
    marginTop: 5,
    marginBottom: 12,
    fontSize: 18,
    fontWeight: '800',
    color: '#20231F',
  },

  addressCard: {
    padding: 15,
    borderRadius: 17,
    backgroundColor: '#E9F4EC',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  addressIcon: {
    fontSize: 25,
  },

  addressContent: {
    flex: 1,
    marginLeft: 12,
  },

  addressLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#56705E',
  },

  addressText: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '700',
    color: '#173A25',
  },

  inputCard: {
    padding: 15,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7E9E3',
    marginBottom: 25,
  },

  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#777A73',
    marginBottom: 8,
  },

  fakeInput: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: '#DDE0D8',
    borderRadius: 12,
    paddingHorizontal: 13,
    justifyContent: 'center',
  },

  inputText: {
    fontSize: 13,
    color: '#20231F',
    fontWeight: '600',
  },

  inputPlaceholder: {
    color: '#999D95',
  },

  addressActions: {
    marginTop: 10,
  },

  addressActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#176B3A',
  },

  locationSearchRow: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: '#DDE0D8',
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },

  locationSearchIcon: {
    fontSize: 17,
    marginRight: 8,
  },

  locationSearchInput: {
    flex: 1,
    minHeight: 48,
    fontSize: 13,
    color: '#20231F',
    fontWeight: '600',
  },

  locationSearchLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },

  locationSearchLoadingText: {
    marginLeft: 8,
    fontSize: 11,
    color: '#777A73',
  },

  locationSuggestions: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E7E9E3',
    borderRadius: 13,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },

  locationSuggestion: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF0EB',
    flexDirection: 'row',
    alignItems: 'center',
  },

  locationSuggestionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F3F5EF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  locationSuggestionContent: {
    flex: 1,
    marginLeft: 10,
  },

  locationSuggestionName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#20231F',
  },

  locationSuggestionAddress: {
    marginTop: 3,
    fontSize: 11,
    lineHeight: 16,
    color: '#777A73',
  },

  locationSelectedCard: {
    marginTop: 10,
    padding: 12,
    borderRadius: 13,
    backgroundColor: '#E9F4EC',
    flexDirection: 'row',
    alignItems: 'center',
  },

  locationSelectedIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#176B3A',
    alignItems: 'center',
    justifyContent: 'center',
  },

  locationSelectedContent: {
    flex: 1,
    marginLeft: 10,
  },

  locationSelectedLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#56705E',
  },

  locationSelectedText: {
    marginTop: 2,
    fontSize: 11,
    lineHeight: 15,
    color: '#173A25',
    fontWeight: '600',
  },

  locationChangeButtonText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#176B3A',
  },

  addressDetailsInput: {
    minHeight: 75,
    borderWidth: 1,
    borderColor: '#DDE0D8',
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 11,
    fontSize: 13,
    lineHeight: 19,
    color: '#20231F',
    fontWeight: '600',
    backgroundColor: '#FFFFFF',
  },

  locationHint: {
    marginTop: 8,
    fontSize: 11,
    lineHeight: 16,
    color: '#777A73',
  },

  paymentList: {
    gap: 10,
    marginBottom: 25,
  },

  paymentOption: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7E9E3',
    flexDirection: 'row',
    alignItems: 'center',
  },

  paymentOptionSelected: {
    borderColor: '#176B3A',
    backgroundColor: '#F2F8F3',
  },

  paymentIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#F3F5EF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  paymentContent: {
    flex: 1,
    marginLeft: 12,
  },

  paymentTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#20231F',
  },

  paymentSubtitle: {
    marginTop: 3,
    fontSize: 11,
    color: '#777A73',
  },

  radio: {
    width: 21,
    height: 21,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#B5B9B0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  radioSelected: {
    borderColor: '#176B3A',
  },

  radioDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#176B3A',
  },

  checkoutSummary: {
    padding: 17,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7E9E3',
  },

  checkoutError: {
    marginTop: 14,
    padding: 13,
    borderRadius: 12,
    backgroundColor: '#FFF5F3',
    borderWidth: 1,
    borderColor: '#F1D6D1',
  },

  checkoutErrorText: {
    fontSize: 12,
    lineHeight: 17,
    color: '#8B3025',
    fontWeight: '600',
  },

  placeOrderBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: 88,
    paddingHorizontal: 20,
    paddingVertical: 13,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E7E9E3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  placeOrderButton: {
    minHeight: 48,
    minWidth: 150,
    paddingHorizontal: 18,
    borderRadius: 13,
    backgroundColor: '#176B3A',
    alignItems: 'center',
    justifyContent: 'center',
  },

  placeOrderButtonDisabled: {
    opacity: 0.65,
  },

  placeOrderButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  bottomSpacingLarge: {
    height: 30,
  },

  successScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 25,
  },

  successIcon: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: '#E9F4EC',
    alignItems: 'center',
    justifyContent: 'center',
  },

  successIconText: {
    fontSize: 42,
    fontWeight: '800',
    color: '#176B3A',
  },

  successTitle: {
    marginTop: 22,
    fontSize: 28,
    fontWeight: '800',
    color: '#20231F',
  },

  successSubtitle: {
    marginTop: 8,
    maxWidth: 300,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    color: '#777A73',
  },

  successCard: {
    width: '100%',
    marginTop: 28,
    padding: 18,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7E9E3',
  },

  successRow: {
    marginVertical: 7,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  successLabel: {
    fontSize: 13,
    color: '#777A73',
  },

  successValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#20231F',
  },

  successStatus: {
    fontSize: 12,
    fontWeight: '800',
    color: '#176B3A',
    textTransform: 'capitalize',
  },

  bottomSpacing: {
    height: 20,
  },

  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 76,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E7E9E3',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 7,
  },

  navItem: {
    width: 65,
    alignItems: 'center',
  },

  navIconActive: {
    fontSize: 21,
    color: '#176B3A',
  },

  navIcon: {
    fontSize: 20,
    color: '#7D8279',
  },

  navLabelActive: {
    marginTop: 3,
    fontSize: 10,
    fontWeight: '800',
    color: '#176B3A',
  },

  navLabel: {
    marginTop: 3,
    fontSize: 10,
    fontWeight: '600',
    color: '#7D8279',
  },

  accountProfileCard: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7E9E3',
    marginBottom: 15,
  },

  accountAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E9F4EC',
    alignItems: 'center',
    justifyContent: 'center',
  },

  accountAvatarText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#176B3A',
  },

  accountName: {
    marginTop: 13,
    fontSize: 19,
    fontWeight: '800',
    color: '#20231F',
  },

  accountEmail: {
    marginTop: 4,
    fontSize: 12,
    color: '#777A73',
  },

  accountMenuCard: {
    minHeight: 72,
    marginBottom: 10,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7E9E3',
    flexDirection: 'row',
    alignItems: 'center',
  },

  accountMenuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#E9F4EC',
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 20,
    color: '#176B3A',
  },

  accountMenuContent: {
    flex: 1,
    marginLeft: 12,
  },

  accountMenuTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#20231F',
  },

  accountMenuSubtitle: {
    marginTop: 3,
    fontSize: 11,
    color: '#777A73',
  },

  accountMenuArrow: {
    fontSize: 25,
    color: '#777A73',
  },

  accountLogoutButton: {
    marginTop: 15,
    minHeight: 50,
    borderRadius: 13,
    backgroundColor: '#FFF5F3',
    borderWidth: 1,
    borderColor: '#F1D6D1',
    alignItems: 'center',
    justifyContent: 'center',
  },

  accountLogoutText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#A14B40',
  },

  browseHeader: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  browseTitle: {
    marginTop: 3,
    fontSize: 22,
    fontWeight: '800',
    color: '#20231F',
  },
});