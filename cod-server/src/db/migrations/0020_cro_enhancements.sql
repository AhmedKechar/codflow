-- Migration 0020: CRO Enhancements
-- Adds trustSeals and orderFormConfig JSON columns to stores table.

-- trustSeals: JSON object with enabled trust seal types.
-- Keys: cashOnDelivery, freeReturns, secureCheckout, fastDelivery, customerSupport, qualityGuarantee
-- NULL = no seals displayed.
ALTER TABLE stores ADD COLUMN trust_seals TEXT;

-- orderFormConfig: JSON object controlling order form field visibility.
-- Keys: showName, showPhone, showEmail, showAddress, showWilaya, showCommune,
--       showDeliveryType, showNotes, showQuantity, submitButtonText, summaryDisplay
-- NULL = use defaults (all standard fields visible, summary open).
ALTER TABLE stores ADD COLUMN order_form_config TEXT;
