# Cloud Forge Application Overview

## In this project:

### Login/Sign Up
- Users can create a new account and securely log in.

### Inventory Management
- Users can view their full inventory catalog, add new inventory items, and edit existing ones.

### Build a Quote
- Users can browse their inventory catalog, add items to a new quote, and click **"Build Quote"** to generate a formal quote.

### Upload RFQ (Request for Quote)
- Users can upload an RFQ document. The system will automatically parse and present the RFQ information.
- Users then have the option to:
  - Manually build a quote based on the RFQ.
  - Use AI to automatically match RFQ items to inventory.
    - If no exact match is found, the AI will select the closest available material and note the substitution.

### Quotes Management
- Users can view all existing quotes.
- When a customer accepts a quote, users can click **"Accept Quote"** to automatically create a **Sales Order** and a **Shipment**.
- Upon acceptance:
  - Allocated stock increases by the ordered quantity.
  - On-hand stock decreases accordingly.

### Sales Orders
- Users can view all sales orders, including linked quotes and associated shipments.

### Shipments
- Users can view and edit shipment details.
- Executing a shipment:
  - Generates an invoice.
  - Decreases the allocated inventory.

### Invoices
- Users can view all invoices and download each invoice as a PDF.
