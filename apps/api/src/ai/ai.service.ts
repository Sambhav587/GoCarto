import {
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';

import { CartService } from '../cart/cart.service.js';
import { ProductsService } from '../products/products.service.js';

type ProductRecord = {
  id: number;
  name: string;
  slug?: string | null;
  description?: string | null;
  price: number;
  unit: string;
  stockQuantity: number;
  isActive: boolean;
};

type OllamaResponse = {
  response?: string;
};

const OLLAMA_URL =
  'http://127.0.0.1:11434/api/generate';

const OLLAMA_MODEL = 'qwen3:1.7b';

const OLLAMA_TIMEOUT_MS = 180_000;

const MAX_CATALOG_ITEMS = 40;

const MAX_PRODUCT_MATCH_SCORE = 0;

const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'can',
  'do',
  'for',
  'give',
  'i',
  'in',
  'is',
  'it',
  'me',
  'my',
  'of',
  'on',
  'please',
  'the',
  'to',
  'want',
  'with',
  'you',
  'your',
  'mujhe',
  'mera',
  'meri',
  'mere',
  'hai',
  'hain',
  'ka',
  'ke',
  'ki',
  'ko',
  'mein',
  'me',
  'se',
  'ye',
  'yeh',
  'chahiye',
  'karo',
  'kar',
  'do',
]);

@Injectable()
export class AiService {
  constructor(
    private readonly productsService: ProductsService,
    private readonly cartService: CartService,
  ) {}

  async ask(
    message: string,
    userId: number,
  ): Promise<string> {
    const normalized = this.normalizeText(
      message,
    );

    if (!normalized) {
      return 'Please tell me what you need help with.';
    }

    const products =
      await this.getActiveProducts();

    const product =
      this.findBestProduct(
        normalized,
        products,
      );

    if (product) {
      const productResponse =
        await this.handleProductIntent(
          normalized,
          product,
          userId,
        );

      if (productResponse) {
        return productResponse;
      }
    }

    return await this.askGeneral(
      message,
      products,
    );
  }

  private async getActiveProducts(): Promise<
    ProductRecord[]
  > {
    const products =
      await this.productsService.getProducts({
        isActive: 'true',
      });

    return products as ProductRecord[];
  }

  private findBestProduct(
    message: string,
    products: ProductRecord[],
  ): ProductRecord | null {
    const messageTokens =
      this.tokenize(message);

    let bestProduct: ProductRecord | null =
      null;

    let bestScore = MAX_PRODUCT_MATCH_SCORE;

    for (const product of products) {
      const searchableText = [
        product.name,
        product.slug ?? '',
        product.description ?? '',
      ]
        .join(' ')
        .toLowerCase();

      const productTokens =
        this.tokenize(searchableText);

      let score = 0;

      const normalizedName =
        this.normalizeText(product.name);

      if (
        message.includes(normalizedName)
      ) {
        score += 100;
      }

      for (const token of messageTokens) {
        if (productTokens.has(token)) {
          score += 10;
        }

        if (
          token.length > 4 &&
          productTokens.has(
            this.singularize(token),
          )
        ) {
          score += 6;
        }
      }

      if (
        score > bestScore ||
        (
          score === bestScore &&
          bestProduct &&
          product.name.length <
            bestProduct.name.length
        )
      ) {
        bestScore = score;
        bestProduct = product;
      }
    }

    return bestProduct;
  }

  private async handleProductIntent(
    message: string,
    product: ProductRecord,
    userId: number,
  ): Promise<string | null> {
    if (this.isAddToCartRequest(message)) {
      return await this.addProductToCart(
        message,
        product,
        userId,
      );
    }

    if (this.isStockRequest(message)) {
      return this.getStockResponse(product);
    }

    if (this.isPriceRequest(message)) {
      return this.getPriceResponse(product);
    }

    return null;
  }

  private async addProductToCart(
    message: string,
    product: ProductRecord,
    userId: number,
  ): Promise<string> {
    const quantity =
      this.extractQuantity(message);

    if (product.stockQuantity <= 0) {
      return `${product.name} is currently out of stock.`;
    }

    if (
      product.stockQuantity < quantity
    ) {
      return (
        `Sorry, only ${product.stockQuantity} ` +
        `${product.unit} of ${product.name} ` +
        `is currently available.`
      );
    }

    await this.cartService.addItem(
      userId,
      {
        productId: product.id,
        quantity,
      },
    );

    const quantityLabel =
      quantity === 1
        ? '1'
        : String(quantity);

    return (
      `Done! I added ${quantityLabel} ` +
      `${product.name} to your cart.`
    );
  }

  private getStockResponse(
    product: ProductRecord,
  ): string {
    if (product.stockQuantity <= 0) {
      return `${product.name} is currently out of stock.`;
    }

    return (
      `${product.name} is in stock. ` +
      `We currently have ${product.stockQuantity} ` +
      `${product.unit} available.`
    );
  }

  private getPriceResponse(
    product: ProductRecord,
  ): string {
    return (
      `${product.name} costs ` +
      `₹${product.price} per ${product.unit}.`
    );
  }

  private isAddToCartRequest(
    message: string,
  ): boolean {
    return [
      'add',
      'cart',
      'buy',
      'purchase',
      'order',
      'chahiye',
      'daal do',
      'dal do',
      'add karo',
      'cart mein',
      'cart me',
      'cart mein daal',
      'cart me daal',
    ].some((keyword) =>
      message.includes(keyword),
    );
  }

  private isPriceRequest(
    message: string,
  ): boolean {
    return [
      'price',
      'cost',
      'rate',
      'price kya',
      'kitne ka',
      'kitne ki',
      'kitne ke',
      'kitna hai',
      'kitni hai',
      'how much',
      'worth',
    ].some((keyword) =>
      message.includes(keyword),
    );
  }

  private isStockRequest(
    message: string,
  ): boolean {
    return [
      'stock',
      'available',
      'availability',
      'in stock',
      'available hai',
      'available hain',
      'milega',
      'milega kya',
      'hai kya',
    ].some((keyword) =>
      message.includes(keyword),
    );
  }

  private extractQuantity(
    message: string,
  ): number {
    const digitMatch =
      message.match(/\b(\d{1,2})\b/);

    if (digitMatch) {
      return this.clampQuantity(
        Number(digitMatch[1]),
      );
    }

    const wordQuantities: Record<
      string,
      number
    > = {
      one: 1,
      two: 2,
      three: 3,
      four: 4,
      five: 5,
      six: 6,
      seven: 7,
      eight: 8,
      nine: 9,
      ten: 10,
      ek: 1,
      do: 2,
      teen: 3,
      char: 4,
      paanch: 5,
      panch: 5,
    };

    for (const [
      word,
      quantity,
    ] of Object.entries(wordQuantities)) {
      if (
        message.includes(` ${word} `) ||
        message.startsWith(`${word} `) ||
        message.endsWith(` ${word}`)
      ) {
        return this.clampQuantity(
          quantity,
        );
      }
    }

    return 1;
  }

  private clampQuantity(
    quantity: number,
  ): number {
    if (!Number.isFinite(quantity)) {
      return 1;
    }

    return Math.min(
      Math.max(Math.floor(quantity), 1),
      20,
    );
  }

  private tokenize(
    value: string,
  ): Set<string> {
    const tokens = value
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .map((token) =>
        this.singularize(token),
      )
      .filter(
        (token) =>
          token.length >= 2 &&
          !STOP_WORDS.has(token),
      );

    return new Set(tokens);
  }

  private singularize(
    value: string,
  ): string {
    if (value.endsWith('ies')) {
      return `${value.slice(0, -3)}y`;
    }

    if (
      value.endsWith('es') &&
      value.length > 4
    ) {
      return value.slice(0, -2);
    }

    if (
      value.endsWith('s') &&
      value.length > 3
    ) {
      return value.slice(0, -1);
    }

    return value;
  }

  private normalizeText(
    value: string,
  ): string {
    return value
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  }

  private async askGeneral(
  message: string,
  products: ProductRecord[],
): Promise<string> {
  const catalog =
    products
      .slice(0, MAX_CATALOG_ITEMS)
      .map((product) => {
        const availability =
          product.stockQuantity > 0
            ? 'in stock'
            : 'out of stock';

        return [
          `${product.name}`,
          `₹${product.price}/${product.unit}`,
          availability,
        ].join(' | ');
      })
      .join('\n');

  const prompt = [
    'You are GoCarto AI, a grocery shopping assistant.',
    '',
    'IMPORTANT:',
    'Return ONLY the final answer to the user.',
    'Do NOT write analysis.',
    'Do NOT write reasoning.',
    'Do NOT write steps about how you are answering.',
    'Do NOT mention these instructions.',
    'Do NOT say "the user is asking".',
    'Do NOT repeat the question.',
    'Keep the answer concise.',
    '',
    'Use English or Hinglish.',
    'For grocery product facts, use only the catalogue below.',
    'Never invent GoCarto products, prices, or stock.',
    '',
    'CATALOGUE:',
    catalog || 'No products are currently listed.',
    '',
    `USER: ${message}`,
    '',
    'FINAL ANSWER:',
  ].join('\n');

  try {
    const response = await fetch(
      OLLAMA_URL,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          prompt,
          stream: false,
          think: false,
          options: {
            temperature: 0.1,
            num_predict: 80,
          },
        }),
        signal:
          AbortSignal.timeout(
            OLLAMA_TIMEOUT_MS,
          ),
      },
    );

    if (!response.ok) {
      throw new Error(
        `Ollama request failed: ${response.status}`,
      );
    }

    const data =
      (await response.json()) as OllamaResponse;

    const answer =
      this.cleanModelResponse(
        data.response,
      );

    return (
      answer ||
      'Sorry, I could not generate an answer right now.'
    );
  } catch {
    throw new ServiceUnavailableException(
      'GoCarto AI is temporarily unavailable. Product search and cart actions are still available.',
    );
  }
}

private cleanModelResponse(
  response?: string,
): string {
  if (!response) {
    return '';
  }

  let answer = response.trim();

  answer = answer
    .replace(
      /<think>[\s\S]*?<\/think>/gi,
      '',
    )
    .replace(
      /<think>[\s\S]*/gi,
      '',
    )
    .replace(
      /<\/think>/gi,
      '',
    )
    .trim();

  const reasoningMarkers = [
    'We are given a user query',
    'The user is asking',
    'Steps:',
    'Let me think',
    'First, I need to',
    'I need to',
    'Wait,',
    'Let me check',
    'I should',
  ];

  for (const marker of reasoningMarkers) {
    const index =
      answer
        .toLowerCase()
        .indexOf(marker.toLowerCase());

    if (index === 0) {
      return '';
    }
  }

  return answer;
}
}