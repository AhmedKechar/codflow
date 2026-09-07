/**
 * English Content
 * 
 * All user-facing text in English.
 * Supports LTR layout and international English conventions.
 */

import type { StoreFrontContent } from "./types";

export const en: StoreFrontContent = {
  // ── Announcement bar ─────────────────────────────────────────────────────
  announcementText: "Cash on Delivery Available Across Algeria",

  // ── Hero ──────────────────────────────────────────────────────────────────
  heroEyebrow: "New Collection",
  heroTitle: "Discover amazing products",
  heroSubtitle: "Delivery to all wilayas in Algeria — Cash on delivery",
  heroPlaceholderTitle: "New Collection",
  heroPlaceholderSub: "Coming Soon",

  // ── Trust badges ──────────────────────────────────────────────────────────
  trust1Title: "Cash on Delivery",
  trust1Sub: "No prepayment",
  trust2Title: "Nationwide delivery",
  trust2Sub: "58 wilayas",
  trust3Title: "Fast confirmation",
  trust3Sub: "Within 24 hours",

  // ── Hero CTAs ────────────────────────────────────────────────────────────
  heroCtaPrimary: "Shop Now",
  heroCtaSecondary: "View Best Sellers",

  // ── Navigation ────────────────────────────────────────────────────────────
  navHome: "Home",
  navProducts: "Products",
  navNewArrivals: "New Arrivals",
  navBestSellers: "Best Sellers",
  navCategories: "Categories",

  // ── Section headings ──────────────────────────────────────────────────────
  categoriesSection: "Shop by Category",
  featuredSection: "Featured products",
  allProductsSection: "All products",
  bestSellersSection: "Best Sellers",
  bestSellersSub: "Our customers' top picks",
  newArrivalsSection: "New Arrivals",
  newArrivalsSub: "Fresh products just added",
  viewAllCta: "View all",

  // ── How It Works (COD trust) ────────────────────────────────────────────
  howItWorksTitle: "Cash on Delivery — Simple, Safe & Reliable",
  howItWorksSub: "Order today, pay when it arrives",
  howStep1Title: "Place Your Order",
  howStep1Sub: "Choose your products and fill in your details",
  howStep2Title: "Confirm via WhatsApp",
  howStep2Sub: "Our team will contact you to confirm",
  howStep3Title: "Pay Cash on Delivery",
  howStep3Sub: "Receive your order and pay the delivery agent",

  // ── Features bar ────────────────────────────────────────────────────────
  feature1Title: "Authentic Products",
  feature2Title: "Fast Delivery",
  feature3Title: "Cash on Delivery",
  feature5Title: "24/7 Support",

  // ── Promo banner ────────────────────────────────────────────────────────
  promoTitle: "New Products Every Week",
  promoSub: "Discover our latest arrivals and exclusive deals",
  promoCtaText: "Shop Now",

  // ── Testimonials ────────────────────────────────────────────────────────
  testimonialsTitle: "What Our Customers Say",
  testimonialsSub: "Real reviews from real customers",

  // ── Footer ──────────────────────────────────────────────────────────────
  footerAbout: "Your trusted online store in Algeria with cash on delivery",
  footerQuickLinks: "Quick Links",
  footerSupport: "Customer Support",
  footerShipping: "Shipping Info",
  footerReturns: "Returns & Exchange",
  footerRights: "All rights reserved",

  // ── Order form ────────────────────────────────────────────────────────────
  orderCta: "Order Now",
  orderCtaSubtext: "Cash on delivery",
  formTitle: "Complete your order",
  formDeliverySection: "Delivery information",
  formNameLabel: "Full name",
  formNamePlaceholder: "e.g. Ahmed Ben Ali",
  formPhoneLabel: "Phone number",
  formPhonePlaceholder: "0XX XX XX XX XX",
  formWilayaLabel: "Wilaya",
  formWilayaPlaceholder: "Select your wilaya",
  formCommuneLabel: "Commune",
  formCommunePlaceholder: "Select commune",
  formCommuneLoading: "Loading...",
  formCommuneDisabled: "Select a wilaya first",
  formAddressLabel: "Detailed address",
  formAddressPlaceholder: "Street, district, building...",
  formDeliveryLabel: "Delivery method",
  formHomeDelivery: "Home delivery",
  formStopDesk: "Post office pickup",
  formNotesLabel: "Notes",
  formNotesPlaceholder: "Any additional delivery details...",
  formSubmit: "Confirm order",
  formConfirmNote: "Our team will call to confirm your order within 24 hours",

  // ── Order summary ─────────────────────────────────────────────────────────
  qtyLabel: "Quantity",
  qtyUnit: "unit(s)",
  shippingLabel: "Delivery fee",
  shippingCalculated: "Calculated after selecting wilaya",
  shippingFree: "Free",
  totalLabel: "Total",
  itemsLabel: "Items",

  // ── Thank you page ────────────────────────────────────────────────────────
  thankYouTitle: "Order received!",
  thankYouSubtitle: "Thank you — we will contact you soon",
  orderNumberLabel: "Order number",
  totalAmountLabel: "Total amount",
  codNote: "Cash on delivery — no prepayment required",
  step1Title: "Order confirmation",
  step1Sub: "Within 24 hours",
  step2Title: "Preparation",
  step2Sub: "& packaging",
  step3Title: "Delivery",
  step3Sub: "To your door",
  backToStore: "Back to store",

  // ── Empty / error states ──────────────────────────────────────────────────
  noProductsTitle: "No products in this category",
  noProductsSub: "Browse another category",
  emptyStoreTitle: "Store under construction",
  emptyStoreSub: "Products coming soon",
  productNotFoundTitle: "Product not found",

  // ── Reviews ───────────────────────────────────────────────────────────────
  reviewsTitle: "Customer Reviews",
  reviewsNoReviews: "No reviews yet",
  reviewsBeFirst: "Be the first to review this product",
  reviewsVerifiedBuyer: "Verified Buyer",
  reviewFormTitle: "Write a Review",
  reviewFormOrderLabel: "Order number",
  reviewFormOrderPlaceholder: "e.g. ORD-20240101-0001",
  reviewFormOrderHelp: "You'll find your order number in the confirmation message",
  reviewFormRatingLabel: "Rating",
  reviewFormTitleLabel: "Review title",
  reviewFormTitlePlaceholder: "Summarize your experience",
  reviewFormBodyLabel: "Review",
  reviewFormBodyPlaceholder: "Share your experience with this product...",
  reviewFormSubmit: "Submit review",
  reviewFormSuccess: "Thank you! Your review has been submitted and will appear after moderation.",
  reviewFormErrorDuplicate: "You have already submitted a review for this order.",
  reviewFormErrorInvalidOrder: "Order number not found. Please check your order number and try again.",
  reviewFormErrorGeneric: "Something went wrong. Please try again.",

  // ── Offers ───────────────────────────────────────────────────────────────
  offerAutoApplied: "Automatically applied at checkout",
  offerFreeLabel: "Free",
  offerActive: "Active Deal!",
  offerUnlocked: "Deal Unlocked!",
  offerAddMore: "Add {n} more to get:",
  offerAddOne: "Add 1 more to get:",
  offerYouGet: "will be added free to your order",
  offerSectionTitle: "Choose Your Bundle",
  offerFreeShippingBadge: "Free Shipping",
  offerBuyOne: "Buy 1",
  offerFullPrice: "Full Price",
  offerMostPopular: "Most Popular",

  // ── Countdown ─────────────────────────────────────────────────────────────
  countdownLabel: "Ends in:",
  countdownExpired: "Offer expired",

  // ── Trust Seals ───────────────────────────────────────────────────────────
  sealCashOnDelivery: "Cash on Delivery",
  sealFreeReturns: "Free Returns (7 days)",
  sealSecureCheckout: "Secure Checkout",
  sealFastDelivery: "Fast Delivery",
  sealCustomerSupport: "24/7 Customer Support",
  sealQualityGuarantee: "Quality Guarantee",

  // ── Order form (email & summary) ──────────────────────────────────────────
  formEmailLabel: "Email address",
  formEmailPlaceholder: "Your email",
  formSummaryOpen: "Order Summary",
  formSummaryClosed: "Open order summary",

  // ── Misc ──────────────────────────────────────────────────────────────────
  breadcrumbHome: "Home",
  required: "*",
  viewProduct: "View product",
  featured: "Featured",
  lowStock: "{n} left",
  outOfStock: "Out of stock",
  qtyMaxStock: "Only {n} left",
  freeShippingBadge: "Free shipping",
  searchLabel: "Search...",
  noResultsLabel: "No results found",
  loadMoreLabel: "Load More",
  allLabel: "All",
  productCountLabel: "Products",
  reviewFormMinLengthError: "Please write a review of at least 10 characters",
  reviewFormRatingRequired: "Please select a rating from 1 to 5 stars",
  offerSaveBadge: "Save {n}%",
  offerSavingsText: "Save {amount} {currency}",
  offerUnitLabel: "Unit {n}",
  ariaMainNavigation: "Main navigation",
  ariaSocials: "Social media",
  ariaQuantity: "Quantity",
  ariaGoToImage: "Go to image {n} of {total}",
  ariaBrowseAllProducts: "Browse all products",
  ariaBrowseCategoryProducts: "Browse {category} products",
  ariaProductCard: "{name} - {price} {currency}",
  ariaStarRating: "{n} star{s}",
  navContact: "Contact",
  thankYouPageTitle: "Order Received",
  defaultMetaDescription: "Shop from {storeName} - Best products at great prices with delivery nationwide",

  // ── New CRO keys ──────────────────────────────────────────────────────────
  formTitleNew: "Fill in your details to order",
  stickyCtaText: "Order Now",
  orderSummaryTitle: "Order Summary",
  urgencyTitle: "Limited Offer!",
  urgencySubtitle: "Special discount for you",
  urgencyDescription: "Use the discount code when ordering to get an exclusive discount",
  urgencyCta: "Apply Discount",
  urgencyExpires: "Offer ends in",
  urgencyClose: "Later",
  viewedByText: "{x} people viewing now",
  orderedTimesText: "Ordered {n} times",
  lastPiecesText: "Only {n} left",

  // ── Content editor keys (Dashboard-editable section titles) ───────────────
  contentHeroEyebrow: "New Collection",
  contentHeroTitle: "Discover amazing products",
  contentHeroSubtitle: "Delivery to all wilayas in Algeria — Cash on delivery",
  contentHeroCtaPrimary: "Shop Now",
  contentHeroCtaSecondary: "View Best Sellers",
  contentBestSellersTitle: "Best Sellers",
  contentBestSellersSubtitle: "Our customers' top picks",
  contentNewArrivalsTitle: "New Arrivals",
  contentNewArrivalsSubtitle: "Fresh products just added",
  contentHowItWorksTitle: "Cash on Delivery — Simple, Safe & Reliable",
  contentHowItWorksSubtitle: "Order today, pay when it arrives",
  contentHowStep1Title: "Place Your Order",
  contentHowStep1Sub: "Choose your products and fill in your details",
  contentHowStep2Title: "Confirm via WhatsApp",
  contentHowStep2Sub: "Our team will contact you to confirm",
  contentHowStep3Title: "Pay Cash on Delivery",
  contentHowStep3Sub: "Receive your order and pay the delivery agent",
  contentFeature1: "Authentic Products",
  contentFeature2: "Fast Delivery",
  contentFeature3: "Cash on Delivery",
  contentFeature4: "24/7 Support",
  contentTestimonialsTitle: "What Our Customers Say",
  contentTestimonialsSubtitle: "Real reviews from real customers",
  contentWhatsappTitle: "Contact us via WhatsApp",
  contentWhatsappSubtitle: "We're here to help you anytime",
  contentWhatsappCta: "Start Chat",
  contentAnnouncement: "Cash on Delivery Available Across Algeria",
  contentFooterAbout: "Your trusted online store in Algeria with cash on delivery",
  contentFooterRights: "All rights reserved",
};
