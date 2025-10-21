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
        '' AS branch_email
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

    // RBAC: Customer can only access own bookings
    if (req.user.role === "Customer") {
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
 * Generate invoice in HTML format
 * GET /bookings/:id/invoice/html
 * Roles: Receptionist, Accountant, Manager, or Customer (own booking)
 */
async function generateInvoiceHTML(req, res) {
  const { id: bookingId } = req.params;

  try {
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
    body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; color: #333; }
    .invoice { max-width: 800px; margin: 0 auto; background: white; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #2563eb; padding-bottom: 20px; }
    .header h1 { color: #2563eb; margin-bottom: 10px; }
    .header p { color: #666; }
    .section { margin-bottom: 30px; }
    .section h2 { color: #2563eb; margin-bottom: 15px; font-size: 18px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .info-box { padding: 15px; background: #f9fafb; border-radius: 5px; }
    .info-box h3 { color: #2563eb; margin-bottom: 10px; font-size: 14px; }
    .info-box p { margin: 5px 0; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    thead th { background: #2563eb; color: white; padding: 12px; text-align: left; font-weight: 600; }
    tbody td { padding: 10px 12px; border-bottom: 1px solid #e5e7eb; }
    tbody tr:hover { background: #f9fafb; }
    .text-right { text-align: right; }
    .totals { margin-top: 20px; }
    .totals table { max-width: 400px; margin-left: auto; }
    .totals td { padding: 8px 12px; }
    .totals .total-row { font-weight: bold; font-size: 18px; background: #f0f9ff; border-top: 2px solid #2563eb; }
    .balance-due { color: ${invoice.summary.balance_due.startsWith('-') ? '#16a34a' : '#dc2626'}; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #666; font-size: 12px; }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
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

    <div class="section">
      <h2>Invoice ${invoice.invoice_number}</h2>
      <p><strong>Date:</strong> ${invoice.invoice_date}</p>
      <p><strong>Booking ID:</strong> #${invoice.booking_id}</p>
      <p><strong>Status:</strong> ${invoice.status}</p>
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
      <h2>Charges</h2>
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
            <td>${invoice.charges.room.description}</td>
            <td class="text-right">${invoice.charges.room.quantity}</td>
            <td class="text-right">${invoice.charges.room.unit_price}</td>
            <td class="text-right">${invoice.charges.room.amount}</td>
          </tr>
          ${invoice.charges.services.map(s => `
          <tr>
            <td>${s.description} <small style="color: #666;">(${s.date})</small></td>
            <td class="text-right">${s.quantity}</td>
            <td class="text-right">${s.unit_price}</td>
            <td class="text-right">${s.amount}</td>
          </tr>
          `).join('')}
          ${invoice.charges.discount ? `
          <tr>
            <td><strong>Discount</strong></td>
            <td class="text-right">-</td>
            <td class="text-right">-</td>
            <td class="text-right">${invoice.charges.discount.amount}</td>
          </tr>
          ` : ''}
          ${invoice.charges.late_fee ? `
          <tr>
            <td><strong>Late Fee</strong></td>
            <td class="text-right">-</td>
            <td class="text-right">-</td>
            <td class="text-right">${invoice.charges.late_fee.amount}</td>
          </tr>
          ` : ''}
        </tbody>
      </table>
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
      <p>Thank you for choosing ${invoice.branch.name}!</p>
      <p>Generated on ${invoice.metadata.generated_at}</p>
      <button class="no-print" onclick="window.print()" style="margin-top: 10px; padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 5px; cursor: pointer;">Print Invoice</button>
    </div>
  </div>
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
  generateInvoiceHTML
};
