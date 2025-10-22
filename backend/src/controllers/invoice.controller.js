const { pool } = require("../db");
const { formatMoney } = require("../utils/money");
const { formatDate, calculateNights } = require("../utils/dates");
const { calculateBookingTotals: _calculateBookingTotals } = require("../utils/totals"); // Reserved for future use

/**
 * Generate invoice data for a booking
 * GET /bookings/:id/invoice
 * Roles: Receptionist, Accountant, Manager, or Customer (own booking)
 */
async function generateInvoice(req, res) {
  const { id: bookingId } = req.params;

  try {
    // Get booking with all details
    const bookingQuery = `
      SELECT 
        b.booking_id,
        b.check_in_date,
        b.check_out_date,
        b.booked_rate,
        b.tax_rate_percent,
        b.discount_amount,
        b.late_fee_amount,
        b.advance_payment,
        b.status,
        b.created_at,
        g.guest_id,
        COALESCE(g.full_name, 'Unknown Guest') AS guest_name,
        COALESCE(g.email, '') AS email,
        COALESCE(g.phone, '') AS phone,
        COALESCE(g.address, '') AS address,
        r.room_id,
        COALESCE(r.room_number, 'Unknown Room') AS room_number,
        COALESCE(rt.name, 'Unknown Type') AS room_type,
        br.branch_id,
        COALESCE(br.branch_name, 'Unknown Branch') AS branch_name,
        COALESCE(br.address, '') AS branch_address,
        COALESCE(br.contact_number, '') AS branch_phone,
        'info@skynest.com' AS branch_email
      FROM booking b
      LEFT JOIN guest g ON b.guest_id = g.guest_id
      LEFT JOIN room r ON b.room_id = r.room_id
      LEFT JOIN room_type rt ON r.room_type_id = rt.room_type_id
      LEFT JOIN branch br ON r.branch_id = br.branch_id
      WHERE b.booking_id = $1
    `;

    const bookingRes = await pool.query(bookingQuery, [bookingId]);
    if (bookingRes.rows.length === 0) {
      return res.status(404).json({ error: "Booking not found" });
    }

    const booking = bookingRes.rows[0];

    // RBAC: Customer can only access own bookings (skip if no user context)
    if (req.user && req.user.role === "Customer") {
      const customerQuery = await pool.query(
        "SELECT guest_id FROM customer WHERE user_id = $1",
        [req.user.user_id]
      );
      if (customerQuery.rows.length === 0 || customerQuery.rows[0].guest_id !== booking.guest_id) {
        return res.status(403).json({ error: "Not authorized to access this booking" });
      }
    }

    // Get services
    const servicesQuery = `
      SELECT 
        s.code,
        s.name,
        s.category,
        su.qty AS quantity,
        su.unit_price_at_use AS unit_price,
        su.used_on,
        (su.qty * su.unit_price_at_use) AS line_total
      FROM service_usage su
      JOIN service_catalog s ON su.service_id = s.service_id
      WHERE su.booking_id = $1
      ORDER BY su.used_on, s.name
    `;

    const servicesRes = await pool.query(servicesQuery, [bookingId]);
    const services = servicesRes.rows;

    // Get payments
    const paymentsQuery = `
      SELECT 
        payment_id,
        amount,
        method,
        paid_at AS payment_date,
        payment_reference
      FROM payment
      WHERE booking_id = $1
      ORDER BY paid_at
    `;

    const paymentsRes = await pool.query(paymentsQuery, [bookingId]);
    const payments = paymentsRes.rows;

    // Get adjustments
    const adjustmentsQuery = `
      SELECT 
        adjustment_id,
        amount,
        type,
        reference_note AS reason,
        created_at
      FROM payment_adjustment
      WHERE booking_id = $1
      ORDER BY created_at
    `;

    const adjustmentsRes = await pool.query(adjustmentsQuery, [bookingId]);
    const adjustments = adjustmentsRes.rows;

    // Check if invoice already exists for this booking
    const existingInvoice = await pool.query(
      'SELECT invoice_id FROM invoice WHERE booking_id = $1',
      [bookingId]
    );

    // If invoice doesn't exist, create it
    if (existingInvoice.rows.length === 0) {
      await pool.query(
        `INSERT INTO invoice (booking_id, period_start, period_end, issued_at)
         VALUES ($1, $2, $3, NOW())`,
        [bookingId, booking.check_in_date, booking.check_out_date]
      );
    }

    // Calculate totals
    const nights = calculateNights(booking.check_in_date, booking.check_out_date);
    const roomSubtotal = nights * Number(booking.booked_rate);
    const servicesSubtotal = services.reduce((sum, s) => sum + Number(s.line_total), 0);
    const discount = Number(booking.discount_amount || 0);
    const lateFee = Number(booking.late_fee_amount || 0);
    const preTax = roomSubtotal + servicesSubtotal - discount + lateFee;
    const tax = preTax * (Number(booking.tax_rate_percent || 0) / 100);
    const grossTotal = preTax + tax;

    const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const totalAdjustments = adjustments.reduce((sum, a) => sum + Number(a.amount), 0);
    const advance = Number(booking.advance_payment || 0);
    const balance = grossTotal - (totalPaid + advance) + totalAdjustments;

    // Build invoice object
    const invoice = {
      invoice_number: `INV-${booking.booking_id.toString().padStart(6, "0")}`,
      invoice_date: formatDate(new Date()),
      booking_id: booking.booking_id,
      status: booking.status,
      
      // Branch details
      branch: {
        name: booking.branch_name,
        address: booking.branch_address,
        phone: booking.branch_phone,
        email: booking.branch_email
      },

      // Guest details
      guest: {
        guest_id: booking.guest_id,
        name: booking.guest_name,
        email: booking.email,
        phone: booking.phone,
        address: booking.address
      },

      // Stay details
      stay: {
        room_number: booking.room_number,
        room_type: booking.room_type,
        check_in: formatDate(booking.check_in_date),
        check_out: formatDate(booking.check_out_date),
        nights: nights,
        rate_per_night: formatMoney(booking.booked_rate)
      },

      // Line items
      charges: {
        room: {
          description: `Room ${booking.room_number} - ${booking.room_type} (${nights} night${nights > 1 ? 's' : ''})`,
          quantity: nights,
          unit_price: formatMoney(booking.booked_rate),
          amount: formatMoney(roomSubtotal)
        },
        services: services.map(s => ({
          description: `${s.name} (${s.category})`,
          date: formatDate(s.used_on),
          quantity: s.quantity,
          unit_price: formatMoney(s.unit_price),
          amount: formatMoney(s.line_total)
        })),
        discount: discount > 0 ? {
          description: "Discount",
          amount: formatMoney(-discount)
        } : null,
        late_fee: lateFee > 0 ? {
          description: "Late Fee",
          amount: formatMoney(lateFee)
        } : null
      },

      // Totals
      summary: {
        subtotal: formatMoney(roomSubtotal + servicesSubtotal),
        discount: discount > 0 ? formatMoney(-discount) : null,
        late_fee: lateFee > 0 ? formatMoney(lateFee) : null,
        pre_tax_total: formatMoney(preTax),
        tax_rate: `${booking.tax_rate_percent}%`,
        tax_amount: formatMoney(tax),
        gross_total: formatMoney(grossTotal),
        advance_payment: advance > 0 ? formatMoney(-advance) : null,
        payments: payments.map(p => ({
          date: formatDate(p.payment_date),
          method: p.method,
          reference: p.payment_reference,
          amount: formatMoney(-p.amount)
        })),
        adjustments: adjustments.length > 0 ? adjustments.map(a => ({
          date: formatDate(a.created_at),
          type: a.type,
          reason: a.reason,
          amount: formatMoney(a.amount)
        })) : null,
        balance_due: formatMoney(balance)
      },

      // Metadata
      metadata: {
        booking_created: formatDate(booking.created_at),
        generated_at: new Date().toISOString()
      }
    };

    res.json({ invoice });
  } catch (error) {
    console.error("Error generating invoice:", error);
    console.error("Error stack:", error.stack);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      detail: error.detail
    });
    res.status(500).json({ 
      error: "Failed to generate invoice",
      details: error.message 
    });
  }
}

/**
 * Generate a temporary token for invoice access
 * POST /bookings/:id/invoice/token
 * Roles: Receptionist, Accountant, Manager, or Customer (own booking)
 */
async function generateInvoiceToken(req, res) {
  const { id: bookingId } = req.params;
  const jwt = require("jsonwebtoken");

  try {
    // Verify the user has access to this booking
    const bookingQuery = `
      SELECT b.booking_id, b.guest_id
      FROM booking b
      WHERE b.booking_id = $1
    `;
    const bookingRes = await pool.query(bookingQuery, [bookingId]);
    if (bookingRes.rows.length === 0) {
      return res.status(404).json({ error: "Booking not found" });
    }

    const booking = bookingRes.rows[0];

    // RBAC: Customer can only access own bookings (skip if no user context)
    if (req.user && req.user.role === "Customer") {
      const customerQuery = await pool.query(
        "SELECT guest_id FROM customer WHERE user_id = $1",
        [req.user.user_id]
      );
      if (customerQuery.rows.length === 0 || customerQuery.rows[0].guest_id !== booking.guest_id) {
        return res.status(403).json({ error: "Not authorized to access this booking" });
      }
    }

    // Generate a short-lived token for invoice access
    const tokenPayload = {
      type: 'invoice_access',
      booking_id: bookingId,
      user_id: req.user?.user_id || 'system',
      role: req.user?.role || 'system'
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '1h' });
    
    res.json({ 
      token,
      invoice_url: `/api/bookings/${bookingId}/invoice/html?token=${token}`
    });
  } catch (error) {
    console.error("Error generating invoice token:", error);
    res.status(500).json({ 
      error: "Failed to generate invoice token",
      details: error.message 
    });
  }
}

/**
 * Generate invoice in HTML format
 * GET /bookings/:id/invoice/html?token=xxx OR with Bearer auth
 * Roles: Receptionist, Accountant, Manager, or Customer (own booking)
 */
async function generateInvoiceHTML(req, res) {
  const { id: bookingId } = req.params;
  const { token } = req.query;

  try {
    // Check if we have a token parameter for public access
    if (token) {
      const jwt = require("jsonwebtoken");
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.type !== 'invoice_access' || decoded.booking_id !== bookingId) {
          return res.status(403).json({ error: "Invalid invoice token" });
        }
        // Set a mock user for the invoice generation
        req.user = { user_id: decoded.user_id, role: decoded.role };
      } catch (jwtError) {
        return res.status(403).json({ error: "Invalid or expired invoice token" });
      }
    }

    // Reuse the invoice generation logic
    req.params.id = bookingId;
    const invoiceData = await new Promise((resolve, reject) => {
      const mockRes = {
        status: (code) => ({
          json: (data) => code === 200 ? resolve(data) : reject(data)
        }),
        json: (data) => resolve(data)
      };
      generateInvoice(req, mockRes);
    });

    const { invoice } = invoiceData;

    // Generate HTML
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${invoice.invoice_number}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      padding: 20px; 
      line-height: 1.6; 
      color: #333; 
      background: #f8fafc;
    }
    .invoice { 
      max-width: 900px; 
      margin: 0 auto; 
      background: white; 
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      border-radius: 8px;
      overflow: hidden;
    }
    .header { 
      background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
      color: white; 
      padding: 40px 30px; 
      text-align: center;
    }
    .header h1 { 
      font-size: 2.5rem; 
      margin-bottom: 10px; 
      font-weight: 700;
    }
    .header p { 
      font-size: 1.1rem; 
      opacity: 0.9;
      margin: 5px 0;
    }
    .invoice-info {
      background: #f1f5f9;
      padding: 30px;
      border-bottom: 1px solid #e2e8f0;
    }
    .invoice-title {
      font-size: 2rem;
      color: #1e40af;
      margin-bottom: 20px;
      font-weight: 600;
    }
    .invoice-details {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
    }
    .invoice-details p {
      margin: 8px 0;
      font-size: 1rem;
    }
    .invoice-details strong {
      color: #374151;
      font-weight: 600;
    }
    .section { 
      padding: 30px; 
    }
    .section h2 { 
      color: #1e40af; 
      margin-bottom: 20px; 
      font-size: 1.5rem; 
      font-weight: 600;
      border-bottom: 2px solid #e2e8f0; 
      padding-bottom: 10px; 
    }
    .info-grid { 
      display: grid; 
      grid-template-columns: 1fr 1fr; 
      gap: 30px; 
      margin-bottom: 30px;
    }
    .info-box { 
      padding: 25px; 
      background: #f8fafc; 
      border-radius: 8px; 
      border: 1px solid #e2e8f0;
    }
    .info-box h3 { 
      color: #1e40af; 
      margin-bottom: 15px; 
      font-size: 1.2rem; 
      font-weight: 600;
    }
    .info-box p { 
      margin: 8px 0; 
      font-size: 1rem;
      color: #374151;
    }
    .charges-table {
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    table { 
      width: 100%; 
      border-collapse: collapse; 
    }
    thead th { 
      background: #1e40af; 
      color: white; 
      padding: 15px; 
      text-align: left; 
      font-weight: 600;
      font-size: 1rem;
    }
    tbody td { 
      padding: 15px; 
      border-bottom: 1px solid #e2e8f0; 
      font-size: 1rem;
    }
    tbody tr:nth-child(even) { 
      background: #f8fafc; 
    }
    tbody tr:hover { 
      background: #f1f5f9; 
    }
    .text-right { 
      text-align: right; 
    }
    .totals { 
      margin-top: 30px; 
      background: #f8fafc;
      padding: 25px;
      border-radius: 8px;
    }
    .totals table { 
      max-width: 500px; 
      margin-left: auto; 
    }
    .totals td { 
      padding: 12px 15px; 
      font-size: 1rem;
    }
    .totals .total-row { 
      font-weight: bold; 
      font-size: 1.2rem; 
      background: #1e40af; 
      color: white;
      border-top: 2px solid #1e40af; 
    }
    .balance-due { 
      color: ${invoice.summary.balance_due.startsWith('-') ? '#16a34a' : '#dc2626'}; 
      font-weight: 700;
    }
    .footer { 
      margin-top: 40px; 
      padding: 30px; 
      border-top: 1px solid #e2e8f0; 
      text-align: center; 
      color: #6b7280; 
      font-size: 0.9rem;
      background: #f8fafc;
    }
    .print-btn {
      background: #1e40af;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 1rem;
      font-weight: 600;
      margin-top: 20px;
      transition: background 0.2s;
    }
    .print-btn:hover {
      background: #1d4ed8;
    }
    .print-btn:active {
      background: #1e3a8a;
    }
    @media print {
      body { 
        padding: 0; 
        background: white;
        font-size: 12px;
        line-height: 1.4;
      }
      .no-print { 
        display: none !important; 
      }
      .invoice {
        box-shadow: none;
        border-radius: 0;
        max-width: none;
        margin: 0;
      }
      .print-btn {
        display: none !important;
      }
      .header {
        background: #1e40af !important;
        -webkit-print-color-adjust: exact;
        color-adjust: exact;
      }
      .section {
        padding: 15px;
        page-break-inside: avoid;
      }
      .info-grid {
        page-break-inside: avoid;
      }
      .charges-table {
        page-break-inside: avoid;
      }
      .totals {
        page-break-inside: avoid;
      }
      table {
        page-break-inside: avoid;
      }
      thead th {
        background: #1e40af !important;
        -webkit-print-color-adjust: exact;
        color-adjust: exact;
      }
      .totals .total-row {
        background: #1e40af !important;
        -webkit-print-color-adjust: exact;
        color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  <div class="invoice">
    <div class="header">
      <h1>🏨 ${invoice.branch.name}</h1>
      <p>${invoice.branch.address}</p>
      <p>Phone: ${invoice.branch.phone} | Email: ${invoice.branch.email}</p>
    </div>

    <div class="invoice-info">
      <h2 class="invoice-title">Invoice ${invoice.invoice_number}</h2>
      <div class="invoice-details">
        <p><strong>Invoice Date:</strong> ${invoice.invoice_date}</p>
        <p><strong>Booking ID:</strong> #${invoice.booking_id}</p>
        <p><strong>Status:</strong> ${invoice.status}</p>
        <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
      </div>
    </div>

    <div class="info-grid">
      <div class="info-box">
        <h3>Guest Information</h3>
        <p><strong>${invoice.guest.name}</strong></p>
        <p>${invoice.guest.email || ''}</p>
        <p>${invoice.guest.phone || ''}</p>
        ${invoice.guest.address ? `<p>${invoice.guest.address}</p>` : ''}
      </div>
      <div class="info-box">
        <h3>Stay Details</h3>
        <p><strong>Room:</strong> ${invoice.stay.room_number} (${invoice.stay.room_type})</p>
        <p><strong>Check-In:</strong> ${invoice.stay.check_in}</p>
        <p><strong>Check-Out:</strong> ${invoice.stay.check_out}</p>
        <p><strong>Nights:</strong> ${invoice.stay.nights}</p>
      </div>
    </div>

    <div class="section">
      <h2>Charges & Services</h2>
      <div class="charges-table">
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th class="text-right">Qty</th>
              <th class="text-right">Rate</th>
              <th class="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>${invoice.charges.room.description}</strong></td>
              <td class="text-right">${invoice.charges.room.quantity}</td>
              <td class="text-right">${invoice.charges.room.unit_price}</td>
              <td class="text-right"><strong>${invoice.charges.room.amount}</strong></td>
            </tr>
            ${invoice.charges.services.map(s => `
            <tr>
              <td>${s.description} <small style="color: #6b7280;">(${s.date})</small></td>
              <td class="text-right">${s.quantity}</td>
              <td class="text-right">${s.unit_price}</td>
              <td class="text-right">${s.amount}</td>
            </tr>
            `).join('')}
            ${invoice.charges.discount ? `
            <tr style="color: #16a34a;">
              <td><strong>Discount Applied</strong></td>
              <td class="text-right">-</td>
              <td class="text-right">-</td>
              <td class="text-right"><strong>${invoice.charges.discount.amount}</strong></td>
            </tr>
            ` : ''}
            ${invoice.charges.late_fee ? `
            <tr style="color: #dc2626;">
              <td><strong>Late Fee</strong></td>
              <td class="text-right">-</td>
              <td class="text-right">-</td>
              <td class="text-right"><strong>${invoice.charges.late_fee.amount}</strong></td>
            </tr>
            ` : ''}
          </tbody>
        </table>
      </div>
    </div>

    <div class="totals">
      <table>
        <tr>
          <td>Subtotal:</td>
          <td class="text-right">${invoice.summary.subtotal}</td>
        </tr>
        ${invoice.summary.discount ? `
        <tr>
          <td>Discount:</td>
          <td class="text-right">${invoice.summary.discount}</td>
        </tr>
        ` : ''}
        ${invoice.summary.late_fee ? `
        <tr>
          <td>Late Fee:</td>
          <td class="text-right">${invoice.summary.late_fee}</td>
        </tr>
        ` : ''}
        <tr>
          <td>Pre-tax Total:</td>
          <td class="text-right">${invoice.summary.pre_tax_total}</td>
        </tr>
        <tr>
          <td>Tax (${invoice.summary.tax_rate}):</td>
          <td class="text-right">${invoice.summary.tax_amount}</td>
        </tr>
        <tr style="border-top: 2px solid #e5e7eb;">
          <td><strong>Gross Total:</strong></td>
          <td class="text-right"><strong>${invoice.summary.gross_total}</strong></td>
        </tr>
        ${invoice.summary.advance_payment ? `
        <tr>
          <td>Advance Payment:</td>
          <td class="text-right">${invoice.summary.advance_payment}</td>
        </tr>
        ` : ''}
        ${invoice.summary.payments.map(p => `
        <tr>
          <td>Payment (${p.method}) - ${p.date}:</td>
          <td class="text-right">${p.amount}</td>
        </tr>
        `).join('')}
        ${invoice.summary.adjustments ? invoice.summary.adjustments.map(a => `
        <tr>
          <td>Adjustment (${a.type}):</td>
          <td class="text-right">${a.amount}</td>
        </tr>
        `).join('') : ''}
        <tr class="total-row">
          <td>Balance Due:</td>
          <td class="text-right balance-due">${invoice.summary.balance_due}</td>
        </tr>
      </table>
    </div>

    <div class="footer">
      <p><strong>Thank you for choosing ${invoice.branch.name}!</strong></p>
      <p>This invoice was generated on ${new Date().toLocaleString()}</p>
      <p>For any questions regarding this invoice, please contact us at ${invoice.branch.phone}</p>
      <button class="print-btn no-print" onclick="printInvoice()">🖨️ Print Invoice</button>
    </div>
  </div>

  <script>
    function printInvoice() {
      try {
        // Hide the print button before printing
        const printBtn = document.querySelector('.print-btn');
        if (printBtn) {
          printBtn.style.display = 'none';
        }
        
        // Trigger print dialog
        window.print();
        
        // Show the button again after printing (in case user cancels)
        setTimeout(() => {
          if (printBtn) {
            printBtn.style.display = 'inline-block';
          }
        }, 1000);
      } catch (error) {
        console.error('Print error:', error);
        alert('Print function not available. Please use Ctrl+P or Cmd+P to print.');
      }
    }

    // Add keyboard shortcut for printing
    document.addEventListener('keydown', function(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        printInvoice();
      }
    });

    // Ensure the page is fully loaded before enabling print functionality
    document.addEventListener('DOMContentLoaded', function() {
      console.log('Invoice loaded and ready for printing');
    });
  </script>
</body>
</html>
    `;

    res.setHeader("Content-Type", "text/html");
    res.send(html);
  } catch (error) {
    console.error("Error generating HTML invoice:", error);
    res.status(500).send("<h1>Error generating invoice</h1>");
  }
}

module.exports = {
  generateInvoice,
  generateInvoiceHTML,
  generateInvoiceToken
};
