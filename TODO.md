# TODO: Fix Pack Price Calculations and Display

## Current Issues
- When creating new packs, bundle_price is set to 0 instead of calculated value
- "Precio individual" should be "Precio total" (sum of individual prices)
- Pack price should be total minus discount percentage
- "Ahorras" savings display is missing for new packs

## Tasks
- [x] Modify PackManagement.tsx to calculate total price and discounted price
- [x] Update savePack function to set bundle_price and original_total correctly
- [x] Ensure Bundles.tsx displays prices correctly
- [x] Test the changes with a new pack creation

## Files to Edit
- src/pages/admin/PackManagement.tsx
- Possibly src/pages/Bundles.tsx (if needed for display adjustments)

## Changes Made
- Updated PackManagement.tsx savePack function to calculate total price from selected products and apply discount
- Changed "Precio individual" to "Precio total" in Bundles.tsx
- Added validation to ensure at least one product is selected
- Prices are now correctly calculated and saved to database
