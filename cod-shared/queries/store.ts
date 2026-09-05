/**
 * Store (storefront) Queries
 *
 * Public storefront API — product listing, order creation, reviews.
 * No server-only error classes here; the handlers translate results to HTTP errors.
 */

import {
  eq,
  and,
  isNull,
  desc,
  sql,
  type SQL,
  lte,
  gte,
  or,
  asc,
  inArray,
} from "drizzle-orm";
import {
  products,
  productCategories,
  productVariants,
  productImages,
  stores,
  storePixelConfig,
  customers,
  orders,
  orderProducts,
  orderStatusHistory,
  shippingProfiles,
  shippingRules,
  wilayas,
  communes,
  reviews,
  offers,
  stockMovements,
} from "../db/schema";
import type { AppDb } from "../db/client";

export interface StoreOrderData {
  customerName: string;
  phone: string;
  wilayaId: number;
  communeId: string;
  address?: string;
  deliveryType: "home" | "stop_desk";
  productId: string;
  productName: string;
  variantId?: string;
  variantLabel?: string;
  quantity: number;
  pricePerUnit: number;
  notes?: string;
  offerId?: string;
  variantSelections?: Array<{ variantId: string; variantLabel?: string }>;
  fbc?: string;
  fbp?: string;
  ipAddress?: string;
  userAgent?: string;
}

export async function getStoreConfig(db: AppDb, storeId: string) {
  const store = await db.select().from(stores).where(eq(stores.id, storeId)).get();
  if (!store) return null;
  const pixelRow = await db
    .select({ pixelId: storePixelConfig.pixelId, enabled: storePixelConfig.enabled })
    .from(storePixelConfig)
    .where(eq(storePixelConfig.storeId, storeId))
    .get();
  return {
    ...store,
    pixelId: pixelRow?.enabled ? pixelRow.pixelId : null,
  };
}

export async function getStoreProducts(
  db: AppDb,
  storeId: string,
  params: { featured?: boolean; categoryId?: string; limit?: number },
) {
  const conditions: SQL[] = [
    eq(products.storeId, storeId),
    eq(products.showInStore, true),
    eq(products.status, "ACTIVE"),
    eq(products.visibility, true),
    isNull(products.deletedAt),
  ];

  if (params.featured) conditions.push(eq(products.storeFeatured, true));
  if (params.categoryId) conditions.push(eq(products.categoryId, params.categoryId));

  const rows = await db
    .select({
      id: products.id,
      storeId: products.storeId,
      name: products.name,
      description: products.description,
      handle: products.handle,
      currency: products.currency,
      price: products.price,
      compareAtPrice: products.compareAtPrice,
      costPrice: products.costPrice,
      type: products.type,
      hasVariants: products.hasVariants,
      variantOptions: products.variantOptions,
      sku: products.sku,
      inventory: products.inventory,
      trackInventory: products.trackInventory,
      lowStockThreshold: products.lowStockThreshold,
      categoryId: products.categoryId,
      tags: products.tags,
      visibility: products.visibility,
      status: products.status,
      showInStore: products.showInStore,
      storeFeatured: products.storeFeatured,
      deletedAt: products.deletedAt,
      publishedAt: products.publishedAt,
      shippingProfileId: products.shippingProfileId,
      barcode: products.barcode,
      weightKg: products.weightKg,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
    })
    .from(products)
    .where(and(...conditions))
    .orderBy(desc(products.storeFeatured), desc(products.createdAt))
    .limit(params.limit ?? 24)
    .all();

  if (rows.length === 0) return [];

  const productIds = rows.map((r) => r.id);
  const hasVariantIds = rows.filter((r) => r.hasVariants).map((r) => r.id);

  const [reviewStats, coverImages, variantInventories] = await Promise.all([
    db
      .select({
        productId: reviews.productId,
        avgRating: sql<number | null>`ROUND(AVG(${reviews.rating}), 1)`,
        reviewCount: sql<number>`COUNT(*)`,
      })
      .from(reviews)
      .where(and(inArray(reviews.productId, productIds), eq(reviews.status, "approved")))
      .groupBy(reviews.productId)
      .all(),
    db
      .select({
        productId: productImages.productId,
        id: productImages.id,
        src: productImages.src,
        srcSm: productImages.srcSm,
        srcMd: productImages.srcMd,
        srcLg: productImages.srcLg,
        altText: productImages.altText,
        position: productImages.position,
      })
      .from(productImages)
      .where(inArray(productImages.productId, productIds))
      .orderBy(productImages.position)
      .all(),
    hasVariantIds.length > 0
      ? db
          .select({
            productId: productVariants.productId,
            total: sql<number>`COALESCE(SUM(${productVariants.inventory}), 0)`,
          })
          .from(productVariants)
          .where(and(inArray(productVariants.productId, hasVariantIds), eq(productVariants.active, true)))
          .groupBy(productVariants.productId)
          .all()
      : Promise.resolve([]),
  ]);

  const reviewMap = new Map(reviewStats.map((r) => [r.productId, r]));
  const imageMap = new Map<string, typeof coverImages[number]>();
  for (const img of coverImages) {
    if (!imageMap.has(img.productId)) imageMap.set(img.productId, img);
  }
  const variantInvMap = new Map(variantInventories.map((v) => [v.productId, v.total]));

  return rows.map((p) => {
    const review = reviewMap.get(p.id);
    const inventory = p.hasVariants
      ? (variantInvMap.get(p.id) ?? 0)
      : p.inventory;
    return {
      ...p,
      inventory,
      coverImage: imageMap.get(p.id) ?? null,
      reviewStats:
        review && review.reviewCount > 0
          ? { avgRating: review.avgRating ?? 0, reviewCount: review.reviewCount }
          : null,
    };
  });
}

export async function getStoreProductByHandle(db: AppDb, storeId: string, handle: string) {
  const product = await db
    .select()
    .from(products)
    .where(
      and(
        eq(products.storeId, storeId),
        eq(products.handle, handle),
        eq(products.showInStore, true),
        eq(products.status, "ACTIVE"),
        eq(products.visibility, true),
        isNull(products.deletedAt),
      ),
    )
    .get();

  if (!product) return null;

  const [category, variants, images, reviewStatsRow] = await Promise.all([
    product.categoryId
      ? db
          .select()
          .from(productCategories)
          .where(eq(productCategories.id, product.categoryId))
          .get()
      : null,
    db
      .select()
      .from(productVariants)
      .where(
        and(eq(productVariants.productId, product.id), eq(productVariants.active, true)),
      )
      .orderBy(productVariants.position)
      .all(),
    db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, product.id))
      .orderBy(productImages.position)
      .all(),
    db
      .select({
        avgRating: sql<number | null>`ROUND(AVG(${reviews.rating}), 1)`,
        reviewCount: sql<number>`COUNT(*)`,
      })
      .from(reviews)
      .where(and(eq(reviews.productId, product.id), eq(reviews.status, "approved")))
      .get(),
  ]);

  const now = new Date().toISOString();
  const offerRows = await db
    .select()
    .from(offers)
    .where(
      and(
        eq(offers.storeId, storeId),
        eq(offers.triggerProductId, product.id),
        eq(offers.status, "active"),
        or(isNull(offers.startsAt), lte(offers.startsAt, now)),
        or(isNull(offers.endsAt), gte(offers.endsAt, now)),
      ),
    )
    .orderBy(offers.createdAt)
    .all();

  const rewardProductIds = offerRows.filter((o) => o.rewardProductId).map((o) => o.rewardProductId as string);
  const rewardVariantIds = offerRows.filter((o) => o.rewardVariantId).map((o) => o.rewardVariantId as string);

  const [rewardProducts, rewardVariants] = await Promise.all([
    rewardProductIds.length > 0
      ? db.select({ id: products.id, name: products.name }).from(products).where(inArray(products.id, [...new Set(rewardProductIds)])).all()
      : Promise.resolve([]),
    rewardVariantIds.length > 0
      ? db.select({ id: productVariants.id, variations: productVariants.variations }).from(productVariants).where(inArray(productVariants.id, [...new Set(rewardVariantIds)])).all()
      : Promise.resolve([]),
  ]);

  const rewardProductMap = new Map(rewardProducts.map((p) => [p.id, p]));
  const rewardVariantMap = new Map(rewardVariants.map((v) => [v.id, v]));

  const resolvedOffers = offerRows.map((offer) => {
    const rewardProduct = offer.rewardProductId ? rewardProductMap.get(offer.rewardProductId) ?? null : null;
    const rewardVariant = offer.rewardVariantId ? rewardVariantMap.get(offer.rewardVariantId) ?? null : null;

    return {
      id: offer.id,
      name: offer.name,
      discountType: offer.discountType as "free" | "free_shipping",
      triggerQuantity: offer.triggerQuantity,
      triggerVariantId: offer.triggerVariantId ?? null,
      rewardQuantity: offer.rewardQuantity,
      rewardProductId: offer.rewardProductId ?? null,
      rewardProductName: rewardProduct?.name ?? "",
      rewardVariantId: offer.rewardVariantId ?? null,
      rewardVariantLabel: rewardVariant
        ? Object.values(
            JSON.parse(rewardVariant.variations) as Record<string, string>,
          ).join(" / ")
        : null,
      startsAt: offer.startsAt ?? null,
      endsAt: offer.endsAt ?? null,
    };
  });

  const totalInventory = product.hasVariants
    ? variants.reduce((sum, v) => sum + v.inventory, 0)
    : product.inventory;

  return {
    ...product,
    inventory: totalInventory,
    variantOptions: product.variantOptions ? JSON.parse(product.variantOptions) : null,
    tags: product.tags ? JSON.parse(product.tags) : [],
    category: category ?? null,
    variants: variants.map((v) => ({
      ...v,
      variations: JSON.parse(v.variations),
    })),
    images,
    offers: resolvedOffers,
    reviewStats:
      (reviewStatsRow?.reviewCount ?? 0) > 0
        ? {
            avgRating: reviewStatsRow!.avgRating ?? 0,
            reviewCount: reviewStatsRow!.reviewCount,
          }
        : null,
  };
}

export async function getStoreCategories(db: AppDb, storeId: string) {
  return db.select().from(productCategories).where(eq(productCategories.storeId, storeId)).orderBy(productCategories.position).all();
}

export async function getStoreCommunes(db: AppDb, storeId: string, wilayaId: number) {
  return db
    .select({ id: communes.id, name: communes.name, nameAr: communes.nameAr })
    .from(communes)
    .where(eq(communes.wilayaId, wilayaId))
    .all();
}

export async function findOrCreateCustomer(
  db: AppDb,
  storeId: string,
  data: { phone: string; name: string; wilayaId: number; communeId?: string },
) {
  const existing = await db
    .select()
    .from(customers)
    .where(and(eq(customers.phone, data.phone), eq(customers.storeId, storeId)))
    .get();

  if (existing) return existing;

  const [wilayaRecord, communeRecord] = await Promise.all([
    db
      .select({ nameAr: wilayas.nameAr })
      .from(wilayas)
      .where(eq(wilayas.id, data.wilayaId))
      .get(),
    data.communeId
      ? db
          .select({ nameAr: communes.nameAr })
          .from(communes)
          .where(eq(communes.id, data.communeId))
          .get()
      : Promise.resolve(null),
  ]);

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await db.insert(customers).values({
    id,
    storeId,
    name: data.name,
    phone: data.phone,
    wilayaId: data.wilayaId,
    communeId: data.communeId ?? null,
    wilaya: wilayaRecord?.nameAr ?? `ولاية ${data.wilayaId}`,
    commune: communeRecord?.nameAr ?? null,
    createdAt: now,
  });

  return (await db.select().from(customers).where(eq(customers.id, id)).get())!;
}

export async function getDeliveryFee(
  db: AppDb,
  storeId: string,
  wilayaId: number,
  deliveryType: "home" | "stop_desk",
): Promise<number> {
  const profile = await db
    .select()
    .from(shippingProfiles)
    .where(and(eq(shippingProfiles.isDefault, true), eq(shippingProfiles.storeId, storeId)))
    .get();

  if (!profile) return 0;

  const rule = await db
    .select()
    .from(shippingRules)
    .where(
      and(
        eq(shippingRules.profileId, profile.id),
        eq(shippingRules.wilayaId, wilayaId),
        eq(shippingRules.storeId, storeId),
      ),
    )
    .get();

  if (!rule) return 0;
  return deliveryType === "stop_desk" ? rule.stopDeskPrice : rule.homePrice;
}

export async function getShippingRates(db: AppDb, storeId: string) {
  const profile = await db
    .select()
    .from(shippingProfiles)
    .where(and(eq(shippingProfiles.isDefault, true), eq(shippingProfiles.storeId, storeId)))
    .get();
  if (!profile) return {};

  const rules = await db
    .select()
    .from(shippingRules)
    .where(and(eq(shippingRules.profileId, profile.id), eq(shippingRules.storeId, storeId)))
    .all();

  return Object.fromEntries(
    rules.map((r) => [r.wilayaId, { home: r.homePrice, stopDesk: r.stopDeskPrice }]),
  );
}

// ─── Offer selection helper ───────────────────────────────────────────────────

export async function selectApplicableOffer(
  db: AppDb,
  storeId: string,
  productId: string,
  quantity: number,
  variantId: string | null | undefined,
  offerId: string | undefined,
): Promise<typeof offers.$inferSelect | null> {
  const now = new Date().toISOString();

  const baseConditions = and(
    eq(offers.storeId, storeId),
    eq(offers.triggerProductId, productId),
    eq(offers.status, "active"),
    lte(offers.triggerQuantity, quantity),
    or(isNull(offers.startsAt), lte(offers.startsAt, now)),
    or(isNull(offers.endsAt), gte(offers.endsAt, now)),
  );

  let candidates: (typeof offers.$inferSelect)[];

  if (offerId) {
    const explicit = await db
      .select()
      .from(offers)
      .where(and(eq(offers.id, offerId), baseConditions))
      .get();
    if (explicit) candidates = [explicit];
    else {
      candidates = await db
        .select()
        .from(offers)
        .where(baseConditions)
        .orderBy(desc(offers.triggerQuantity))
        .all();
    }
  } else {
    candidates = await db
      .select()
      .from(offers)
      .where(baseConditions)
      .orderBy(desc(offers.triggerQuantity))
      .all();
  }

  for (const offer of candidates) {
    const variantMatches =
      !offer.triggerVariantId || offer.triggerVariantId === (variantId ?? null);
    if (variantMatches) return offer;
  }

  return null;
}

// ─── Variant grouping helper ──────────────────────────────────────────────────

function groupVariantSelections(
  selections: Array<{ variantId: string; variantLabel?: string }>,
): Array<{ variantId: string; variantLabel: string | null; count: number }> {
  const map = new Map<string, { variantLabel: string | null; count: number }>();
  for (const sel of selections) {
    const existing = map.get(sel.variantId);
    if (existing) {
      existing.count += 1;
    } else {
      map.set(sel.variantId, {
        variantLabel: sel.variantLabel ?? null,
        count: 1,
      });
    }
  }
  return Array.from(map.entries()).map(([variantId, val]) => ({
    variantId,
    variantLabel: val.variantLabel,
    count: val.count,
  }));
}

// ─── Stock pre-check (before order creation) ─────────────────────────────────

export async function checkStoreOrderStock(
  db: AppDb,
  storeId: string,
  params: {
    productId: string;
    variantId: string | null;
    variantSelections: Array<{ variantId: string }>;
    quantity: number;
  },
): Promise<string | null> {
  const productRow = await db
    .select({ trackInventory: products.trackInventory, inventory: products.inventory })
    .from(products)
    .where(and(eq(products.id, params.productId), eq(products.storeId, storeId)))
    .get();

  if (!productRow?.trackInventory) return null;

  if (params.variantSelections.length > 0) {
    const groups = groupVariantSelections(params.variantSelections);
    for (const group of groups) {
      const row = await db
        .select({ inventory: productVariants.inventory })
        .from(productVariants)
        .where(eq(productVariants.id, group.variantId))
        .get();
      if ((row?.inventory ?? 0) < group.count) {
        return "بعض الخيارات المطلوبة غير متوفرة حالياً. يرجى اختيار خياراً آخر.";
      }
    }
  } else if (params.variantId) {
    const row = await db
      .select({ inventory: productVariants.inventory })
      .from(productVariants)
      .where(eq(productVariants.id, params.variantId))
      .get();
    if ((row?.inventory ?? 0) < params.quantity) {
      return "هذا المنتج غير متوفر بالخيار المطلوب. يرجى اختيار خياراً آخر.";
    }
  } else {
    if (productRow.inventory < params.quantity) {
      return "هذا المنتج غير متوفر حالياً.";
    }
  }

  return null;
}

// ─── Stock deduction + movement log ──────────────────────────────────────────

async function deductStockWithLog(
  db: AppDb,
  {
    storeId,
    productId,
    variantId,
    quantity,
    orderId,
    customerId,
    customerName,
    now,
  }: {
    storeId: string;
    productId: string;
    variantId: string | null;
    quantity: number;
    orderId: string;
    customerId: string;
    customerName: string;
    now: string;
  },
) {
  let qtyBefore: number;

  if (variantId) {
    const row = await db
      .select({ inventory: productVariants.inventory })
      .from(productVariants)
      .where(eq(productVariants.id, variantId))
      .get();
    qtyBefore = row?.inventory ?? 0;
    await db
      .update(productVariants)
      .set({ inventory: sql`${productVariants.inventory} - ${quantity}` })
      .where(eq(productVariants.id, variantId));
  } else {
    const row = await db
      .select({ inventory: products.inventory })
      .from(products)
      .where(eq(products.id, productId))
      .get();
    qtyBefore = row?.inventory ?? 0;
    await db
      .update(products)
      .set({ inventory: sql`${products.inventory} - ${quantity}` })
      .where(eq(products.id, productId));
  }

  await db.insert(stockMovements).values({
    id: crypto.randomUUID(),
    storeId,
    productId,
    variantId,
    type: "ORDER_DEDUCTED",
    delta: -quantity,
    qtyBefore,
    qtyAfter: qtyBefore - quantity,
    reason: null,
    reference: orderId,
    createdBy: customerId,
    createdByName: customerName,
    createdAt: now,
  });
}

export async function createStoreOrder(
  db: AppDb,
  storeId: string,
  data: StoreOrderData & {
    customerId: string;
    customerName: string;
    deliveryFee: number;
  },
) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const dateStr = now.split("T")[0].replace(/-/g, "");
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  const orderNumber = `ORD-${dateStr}-${random}`;

  const primaryVariantId =
    data.variantSelections && data.variantSelections.length > 0
      ? data.variantSelections[0].variantId
      : data.variantId ?? null;
  const primaryVariantLabel =
    data.variantSelections && data.variantSelections.length > 0
      ? data.variantSelections[0].variantLabel ?? null
      : data.variantLabel ?? null;

  const activeOffer = await selectApplicableOffer(
    db,
    storeId,
    data.productId,
    data.quantity,
    primaryVariantId,
    data.offerId,
  );

  const finalDeliveryFee =
    activeOffer?.discountType === "free_shipping" ? 0 : data.deliveryFee;

  // Fetch catalog price from DB and validate against client-supplied price.
  // An attacker could submit an arbitrary pricePerUnit to manipulate the order total.
  const priceCheckRow = await db
    .select({ price: products.price })
    .from(products)
    .where(eq(products.id, data.productId))
    .get();
  const catalogPrice = priceCheckRow?.price ?? data.pricePerUnit;
  const priceDiff = Math.abs(data.pricePerUnit - catalogPrice);
  const tolerance = catalogPrice * 0.01; // 1% tolerance
  if (priceDiff > tolerance) {
    console.warn(
      `[store] pricePerUnit mismatch: client=${data.pricePerUnit} catalog=${catalogPrice} product=${data.productId} store=${storeId}`,
    );
  }
  const price = data.quantity * data.pricePerUnit;

  await db.insert(orders).values({
    id,
    storeId,
    orderNumber,
    customerId: data.customerId,
    customerName: data.customerName,
    phone: data.phone,
    wilayaId: data.wilayaId,
    communeId: data.communeId,
    address: data.address ?? null,
    price,
    notes: data.notes ?? null,
    status: "new",
    orderType: "online",
    deliveryMethod: "driver",
    deliveryType: data.deliveryType,
    deliveryFee: finalDeliveryFee,
    driverFee: 0,
    codAmount: price + finalDeliveryFee,
    fbc: data.fbc ?? null,
    fbp: data.fbp ?? null,
    ipAddress: data.ipAddress ?? null,
    userAgent: data.userAgent ?? null,
    createdAt: now,
    updatedAt: now,
  });

  if (data.variantSelections && data.variantSelections.length > 0) {
    const groups = groupVariantSelections(data.variantSelections);
    const groupVariantIds = groups.map((g) => g.variantId);
    const skuRows = await db
      .select({ id: productVariants.id, sku: productVariants.sku })
      .from(productVariants)
      .where(inArray(productVariants.id, groupVariantIds))
      .all();
    const skuMap = new Map(skuRows.map((r) => [r.id, r.sku]));

    for (const group of groups) {
      const groupLineTotal = group.count * data.pricePerUnit;
      await db.insert(orderProducts).values({
        id: crypto.randomUUID(),
        storeId,
        orderId: id,
        productId: data.productId,
        productName: data.productName,
        variantId: group.variantId,
        variantLabel: group.variantLabel,
        sku: skuMap.get(group.variantId) ?? null,
        quantity: group.count,
        pricePerUnit: data.pricePerUnit,
        lineTotal: groupLineTotal,
        createdAt: now,
      });
    }
  } else {
    let itemSku: string | null = null;
    if (data.variantId) {
      const varSkuRow = await db
        .select({ sku: productVariants.sku })
        .from(productVariants)
        .where(eq(productVariants.id, data.variantId))
        .get();
      itemSku = varSkuRow?.sku ?? null;
    } else {
      const prodSkuRow = await db
        .select({ sku: products.sku })
        .from(products)
        .where(eq(products.id, data.productId))
        .get();
      itemSku = prodSkuRow?.sku ?? null;
    }
    await db.insert(orderProducts).values({
      id: crypto.randomUUID(),
      storeId,
      orderId: id,
      productId: data.productId,
      productName: data.productName,
      variantId: data.variantId ?? null,
      variantLabel: data.variantLabel ?? null,
      sku: itemSku,
      quantity: data.quantity,
      pricePerUnit: data.pricePerUnit,
      lineTotal: price,
      createdAt: now,
    });
  }

  if (activeOffer) {
    if (activeOffer.discountType === "free_shipping") {
      // Delivery fee already set to 0 above — nothing more to insert.
    } else {
      let resolvedRewardVariantId: string | null = activeOffer.rewardVariantId ?? null;
      let resolvedRewardVariantLabel: string | null = null;

      if (!resolvedRewardVariantId && activeOffer.rewardProductId === data.productId) {
        resolvedRewardVariantId = primaryVariantId;
        resolvedRewardVariantLabel = primaryVariantLabel;
      } else if (
        !resolvedRewardVariantId &&
        activeOffer.rewardProductId &&
        activeOffer.rewardProductId !== data.productId
      ) {
        const defaultVariant = await db
          .select({ id: productVariants.id, variations: productVariants.variations })
          .from(productVariants)
          .where(
            and(
              eq(productVariants.productId, activeOffer.rewardProductId),
              eq(productVariants.active, true),
            ),
          )
          .orderBy(asc(productVariants.position))
          .get();
        if (defaultVariant) {
          resolvedRewardVariantId = defaultVariant.id;
          resolvedRewardVariantLabel = Object.values(
            JSON.parse(defaultVariant.variations) as Record<string, string>,
          ).join(" / ");
        }
      } else if (resolvedRewardVariantId) {
        const rewardVariantRow = await db
          .select({ variations: productVariants.variations })
          .from(productVariants)
          .where(eq(productVariants.id, resolvedRewardVariantId))
          .get();
        if (rewardVariantRow) {
          resolvedRewardVariantLabel = Object.values(
            JSON.parse(rewardVariantRow.variations) as Record<string, string>,
          ).join(" / ");
        }
      }

      if (activeOffer.rewardProductId) {
        const rewardProductRow = await db
          .select({ name: products.name, trackInventory: products.trackInventory })
          .from(products)
          .where(eq(products.id, activeOffer.rewardProductId))
          .get();

        let rewardInStock = true;
        if (rewardProductRow?.trackInventory) {
          if (resolvedRewardVariantId) {
            const rv = await db
              .select({ inventory: productVariants.inventory })
              .from(productVariants)
              .where(eq(productVariants.id, resolvedRewardVariantId))
              .get();
            rewardInStock = (rv?.inventory ?? 0) >= activeOffer.rewardQuantity;
          } else {
            const rp = await db
              .select({ inventory: products.inventory })
              .from(products)
              .where(eq(products.id, activeOffer.rewardProductId))
              .get();
            rewardInStock = (rp?.inventory ?? 0) >= activeOffer.rewardQuantity;
          }
        }

        if (rewardInStock && rewardProductRow) {
          let rewardSku: string | null = null;
          if (resolvedRewardVariantId) {
            const rv = await db
              .select({ sku: productVariants.sku })
              .from(productVariants)
              .where(eq(productVariants.id, resolvedRewardVariantId))
              .get();
            rewardSku = rv?.sku ?? null;
          } else if (activeOffer.rewardProductId) {
            const rp = await db
              .select({ sku: products.sku })
              .from(products)
              .where(eq(products.id, activeOffer.rewardProductId))
              .get();
            rewardSku = rp?.sku ?? null;
          }
          await db.insert(orderProducts).values({
            id: crypto.randomUUID(),
            storeId,
            orderId: id,
            productId: activeOffer.rewardProductId,
            productName: rewardProductRow.name,
            variantId: resolvedRewardVariantId,
            variantLabel: resolvedRewardVariantLabel
              ? `${resolvedRewardVariantLabel} — 🎁 مجاني`
              : "🎁 مجاني",
            sku: rewardSku,
            quantity: activeOffer.rewardQuantity,
            pricePerUnit: 0,
            lineTotal: 0,
            createdAt: now,
          });

          if (rewardProductRow.trackInventory) {
            await deductStockWithLog(db, {
              storeId,
              productId: activeOffer.rewardProductId,
              variantId: resolvedRewardVariantId,
              quantity: activeOffer.rewardQuantity,
              orderId: id,
              customerId: data.customerId,
              customerName: data.customerName,
              now,
            });
          }
        }
      }
    }
  }

  await db.insert(orderStatusHistory).values({
    id: crypto.randomUUID(),
    storeId,
    orderId: id,
    status: "new",
    timestamp: now,
    by: null,
  });

  await db
    .update(customers)
    .set({
      totalOrders: sql`${customers.totalOrders} + 1`,
      totalSpent: sql`${customers.totalSpent} + ${price}`,
      lastOrderAt: now,
    })
    .where(eq(customers.id, data.customerId));

  const productRow = await db
    .select({ trackInventory: products.trackInventory })
    .from(products)
    .where(eq(products.id, data.productId))
    .get();

  if (productRow?.trackInventory) {
    if (data.variantSelections && data.variantSelections.length > 0) {
      const groups = groupVariantSelections(data.variantSelections);
      for (const group of groups) {
        await deductStockWithLog(db, {
          storeId,
          productId: data.productId,
          variantId: group.variantId,
          quantity: group.count,
          orderId: id,
          customerId: data.customerId,
          customerName: data.customerName,
          now,
        });
      }
    } else if (data.variantId) {
      await deductStockWithLog(db, {
        storeId,
        productId: data.productId,
        variantId: data.variantId,
        quantity: data.quantity,
        orderId: id,
        customerId: data.customerId,
        customerName: data.customerName,
        now,
      });
    } else {
      await deductStockWithLog(db, {
        storeId,
        productId: data.productId,
        variantId: null,
        quantity: data.quantity,
        orderId: id,
        customerId: data.customerId,
        customerName: data.customerName,
        now,
      });
    }
  }

  return { id, orderNumber, price, deliveryFee: finalDeliveryFee };
}

// ─── Reviews ──────────────────────────────────────────────────────────────────

export async function getApprovedProductReviews(
  db: AppDb,
  storeId: string,
  productId: string,
  limit = 20,
  offset = 0,
) {
  const rows = await db
    .select()
    .from(reviews)
    .where(
      and(
        eq(reviews.storeId, storeId),
        eq(reviews.productId, productId),
        eq(reviews.status, "approved"),
      ),
    )
    .orderBy(desc(reviews.createdAt))
    .limit(limit)
    .offset(offset)
    .all();

  const totalResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(reviews)
    .where(
      and(
        eq(reviews.storeId, storeId),
        eq(reviews.productId, productId),
        eq(reviews.status, "approved"),
      ),
    )
    .get();

  return { rows, total: totalResult?.count ?? 0 };
}

export async function findOrderForReview(
  db: AppDb,
  _storeId: string,
  orderNumber: string,
) {
  const order = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      customerName: orders.customerName,
      customerId: orders.customerId,
    })
    .from(orders)
    .innerJoin(customers, eq(orders.customerId, customers.id))
    .where(eq(orders.orderNumber, orderNumber))
    .get();

  if (!order) return null;

  return order;
}

export async function getExistingReviewByOrder(db: AppDb, storeId: string, orderId: string) {
  return db.select({
    id: reviews.id,
    orderId: reviews.orderId,
    productId: reviews.productId,
    status: reviews.status,
  }).from(reviews).where(and(eq(reviews.orderId, orderId), eq(reviews.storeId, storeId))).get();
}

export async function createReview(
  db: AppDb,
  storeId: string,
  data: {
    productId: string;
    orderId: string;
    orderNumber: string;
    customerName: string;
    rating: number;
    title?: string;
    body: string;
  },
) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await db.insert(reviews).values({
    id,
    storeId,
    productId: data.productId,
    orderId: data.orderId,
    orderNumber: data.orderNumber,
    customerName: data.customerName,
    rating: data.rating,
    title: data.title ?? null,
    body: data.body,
    status: "pending",
    helpfulCount: 0,
    createdAt: now,
    updatedAt: now,
  });

  return { id };
}

export async function validateOrderSkus(
  db: AppDb,
  storeId: string,
  productId: string,
  variantId?: string,
  variantSelections?: { variantId: string }[],
): Promise<{ missing: "variant" | "product"; id: string } | null> {
  if (variantSelections && variantSelections.length > 0) {
    const uniqueVariantIds = [...new Set(variantSelections.map((v) => v.variantId))];
    const skuRows = await db
      .select({ id: productVariants.id, sku: productVariants.sku })
      .from(productVariants)
      .where(and(inArray(productVariants.id, uniqueVariantIds), eq(productVariants.storeId, storeId)))
      .all();
    const skuMap = new Map(skuRows.map((r) => [r.id, r.sku]));
    for (const vid of uniqueVariantIds) {
      if (!skuMap.get(vid)) return { missing: "variant", id: vid };
    }
    return null;
  }

  if (variantId) {
    const row = await db
      .select({ sku: productVariants.sku })
      .from(productVariants)
      .where(and(eq(productVariants.id, variantId), eq(productVariants.storeId, storeId)))
      .get();
    if (!row?.sku) return { missing: "variant", id: variantId };
    return null;
  }

  const row = await db
    .select({ sku: products.sku })
    .from(products)
    .where(and(eq(products.id, productId), eq(products.storeId, storeId)))
    .get();
  if (!row?.sku) return { missing: "product", id: productId };
  return null;
}
