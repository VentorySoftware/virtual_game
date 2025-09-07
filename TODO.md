# Task: Complete Admin Orders Module Implementation

## Current Status
- Basic filters implemented (status, product, category, platform, user)
- Card-based layout
- Basic order display

## Steps

1. **Refactor to Table View** (src/pages/admin/Orders.tsx):
   - Replace card layout with sortable table
   - Add proper column headers with sorting indicators
   - Improve responsive design

2. **Implement Pagination**:
   - Add pagination state (page, pageSize)
   - Update fetchOrders to support pagination
   - Add pagination controls UI
   - Handle page changes and size selection

3. **Add Column Sorting**:
   - Add sort state (sortBy, sortOrder)
   - Implement sorting logic for order_number, created_at, total, status
   - Update table headers with sort buttons
   - Apply sorting to filtered orders

4. **Export Functionality**:
   - Add export buttons (CSV/Excel)
   - Implement data processing for export
   - Handle large datasets efficiently
   - Add loading states for export

5. **Detailed View Modal**:
   - Create OrderDetailModal component
   - Show full order information, items, billing details
   - Add modal trigger buttons
   - Handle modal state and data

6. **Notifications System**:
   - Add toast notifications for status updates
   - Show success/error messages
   - Add alerts for specific statuses (e.g., cancelled orders)

7. **Optimize Filtering**:
   - Ensure proper handling of orders with multiple products/categories/platforms
   - Improve query performance
   - Add loading states for filters

8. **Testing & Polish**:
   - Test all filters with complex orders
   - Verify export functionality
   - Test pagination with large datasets
   - Ensure mobile responsiveness
   - Add skeleton loading states

## Notes
- Maintain existing filter functionality
- Use existing UI components (Table, Pagination, Dialog, etc.)
- Ensure proper error handling
- Follow existing code patterns and styling
