const nodemailer = require("nodemailer");
const { pool } = require("../db");
const { formatMoney } = require("../utils/money");
const { formatDate, calculateNights } = require("../utils/dates");

/**
 * Email service for sending booking confirmations, invoices, and notifications
 * Configure email settings in .env:
 * EMAIL_HOST=smtp.gmail.com
 * EMAIL_PORT=587
 * EMAIL_USER=your-email@gmail.com
 * EMAIL_PASS=your-app-password
 * EMAIL_FROM=SkyNest Hotel <noreply@skynest.com>
 */

// Create reusable transporter
let transporter;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || "smtp.gmail.com",
      port: parseInt(process.env.EMAIL_PORT || "587", 10),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }
  return transporter;
}

/**
 * Send booking confirmation email
 */
async function sendBookingConfirmation(bookingId) {
  try {
    // Get booking details
    const query = `
      SELECT 
        b.booking_id,
        b.check_in_date,
        b.check_out_date,
        b.booked_rate,
        b.advance_payment,
        g.full_name AS guest_name,
        g.email,
        r.room_number,
        rt.name AS room_type,
        br.branch_name,
        br.address AS branch_address,
        br.contact_number AS branch_phone
      FROM booking b
      JOIN guest g ON b.guest_id = g.guest_id
      JOIN room r ON b.room_id = r.room_id
      JOIN room_type rt ON r.room_type_id = rt.room_type_id
      JOIN branch br ON r.branch_id = br.branch_id
      WHERE b.booking_id = $1
    `;

    const result = await pool.query(query, [bookingId]);
    if (result.rows.length === 0) {
      throw new Error("Booking not found");
    }

    const booking = result.rows[0];
    
    if (!booking.email) {
      console.log(`No email address for booking ${bookingId}, skipping confirmation email`);
      return { success: false, reason: "No email address" };
    }

    const nights = calculateNights(booking.check_in_date, booking.check_out_date);
    const total = nights * Number(booking.booked_rate);

    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
    .content { background: #f9fafb; padding: 20px; }
    .details { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; }
    .details h3 { color: #2563eb; margin-top: 0; }
    .details p { margin: 8px 0; }
    .footer { text-align: center; padding: 15px; color: #666; font-size: 12px; }
    .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏨 Booking Confirmation</h1>
      <p>Thank you for choosing ${booking.branch_name}!</p>
    </div>
    
    <div class="content">
      <h2>Dear ${booking.guest_name},</h2>
      <p>Your booking has been confirmed! Here are your reservation details:</p>
      
      <div class="details">
        <h3>Booking Information</h3>
        <p><strong>Booking ID:</strong> #${booking.booking_id}</p>
        <p><strong>Room:</strong> ${booking.room_number} - ${booking.room_type}</p>
        <p><strong>Check-In:</strong> ${formatDate(booking.check_in_date)}</p>
        <p><strong>Check-Out:</strong> ${formatDate(booking.check_out_date)}</p>
        <p><strong>Number of Nights:</strong> ${nights}</p>
      </div>
      
      <div class="details">
        <h3>Pricing</h3>
        <p><strong>Rate per Night:</strong> ${formatMoney(booking.booked_rate)}</p>
        <p><strong>Total Amount:</strong> ${formatMoney(total)}</p>
        ${booking.advance_payment ? `<p><strong>Advance Paid:</strong> ${formatMoney(booking.advance_payment)}</p>` : ''}
        <p><strong>Balance Due:</strong> ${formatMoney(total - Number(booking.advance_payment || 0))}</p>
      </div>
      
      <div class="details">
        <h3>Hotel Information</h3>
        <p><strong>${booking.branch_name}</strong></p>
        <p>${booking.branch_address}</p>
        <p>Phone: ${booking.branch_phone}</p>
      </div>
      
      <p><strong>Important:</strong> Please arrive after 2:00 PM for check-in. Check-out time is 12:00 PM.</p>
      
      <p>If you have any questions or need to modify your booking, please contact us.</p>
    </div>
    
    <div class="footer">
      <p>This is an automated message from SkyNest Hotel Management System.</p>
      <p>© ${new Date().getFullYear()} ${booking.branch_name}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"SkyNest Hotel" <noreply@skynest.com>',
      to: booking.email,
      subject: `Booking Confirmation - ${booking.branch_name} - Booking #${booking.booking_id}`,
      html: html
    };

    // Send email if configured
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const info = await getTransporter().sendMail(mailOptions);
      console.log(`Confirmation email sent for booking ${bookingId}:`, info.messageId);
      return { success: true, messageId: info.messageId };
    } else {
      console.log("Email not configured, skipping email send");
      console.log("Email HTML:", html);
      return { success: false, reason: "Email not configured", html };
    }
  } catch (error) {
    console.error("Error sending booking confirmation:", error);
    throw error;
  }
}

/**
 * Send check-in reminder (1 day before)
 */
async function sendCheckInReminder(bookingId) {
  try {
    const query = `
      SELECT 
        b.booking_id,
        b.check_in_date,
        g.full_name AS guest_name,
        g.email,
        r.room_number,
        rt.type_name AS room_type,
        br.branch_name,
        br.phone AS branch_phone
      FROM booking b
      JOIN guest g ON b.guest_id = g.guest_id
      JOIN room r ON b.room_id = r.room_id
      JOIN room_type rt ON r.type_id = rt.type_id
      JOIN branch br ON rt.branch_id = br.branch_id
      WHERE b.booking_id = $1 AND b.status = 'Booked'
    `;

    const result = await pool.query(query, [bookingId]);
    if (result.rows.length === 0) return { success: false, reason: "Booking not found or already checked-in" };

    const booking = result.rows[0];
    if (!booking.email) return { success: false, reason: "No email address" };

    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #16a34a; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
    .content { background: #f9fafb; padding: 20px; }
    .highlight { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #16a34a; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏨 Check-In Reminder</h1>
    </div>
    
    <div class="content">
      <h2>Dear ${booking.guest_name},</h2>
      <p>Your check-in is scheduled for tomorrow!</p>
      
      <div class="highlight">
        <p><strong>Check-In Date:</strong> ${formatDate(booking.check_in_date)}</p>
        <p><strong>Room:</strong> ${booking.room_number} - ${booking.room_type}</p>
        <p><strong>Booking ID:</strong> #${booking.booking_id}</p>
      </div>
      
      <p><strong>Check-In Time:</strong> After 2:00 PM</p>
      <p>We look forward to welcoming you at ${booking.branch_name}!</p>
      <p>If you need any assistance, please call us at ${booking.branch_phone}.</p>
    </div>
  </div>
</body>
</html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"SkyNest Hotel" <noreply@skynest.com>',
      to: booking.email,
      subject: `Check-In Reminder - Tomorrow at ${booking.branch_name}`,
      html: html
    };

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const info = await getTransporter().sendMail(mailOptions);
      return { success: true, messageId: info.messageId };
    } else {
      return { success: false, reason: "Email not configured", html };
    }
  } catch (error) {
    console.error("Error sending check-in reminder:", error);
    throw error;
  }
}

/**
 * Send invoice email
 */
async function sendInvoiceEmail(bookingId) {
  try {
    const query = `
      SELECT 
        b.booking_id,
        g.full_name AS guest_name,
        g.email
      FROM booking b
      JOIN guest g ON b.guest_id = g.guest_id
      WHERE b.booking_id = $1
    `;

    const result = await pool.query(query, [bookingId]);
    if (result.rows.length === 0) return { success: false, reason: "Booking not found" };

    const booking = result.rows[0];
    if (!booking.email) return { success: false, reason: "No email address" };

    const invoiceUrl = `${process.env.APP_URL || 'http://localhost:3000'}/bookings/${bookingId}/invoice/html`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📄 Your Invoice is Ready</h1>
    </div>
    
    <div class="content">
      <h2>Dear ${booking.guest_name},</h2>
      <p>Your invoice for booking #${booking.booking_id} is now available.</p>
      <p style="text-align: center;">
        <a href="${invoiceUrl}" class="button">View Invoice</a>
      </p>
      <p>Thank you for choosing SkyNest Hotel!</p>
    </div>
  </div>
</body>
</html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"SkyNest Hotel" <noreply@skynest.com>',
      to: booking.email,
      subject: `Invoice for Booking #${booking.booking_id}`,
      html: html
    };

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const info = await getTransporter().sendMail(mailOptions);
      return { success: true, messageId: info.messageId };
    } else {
      return { success: false, reason: "Email not configured", html };
    }
  } catch (error) {
    console.error("Error sending invoice email:", error);
    throw error;
  }
}

/**
 * Controller to trigger sending booking confirmation
 * POST /bookings/:id/send-confirmation
 * Roles: Receptionist, Manager
 */
async function triggerBookingConfirmation(req, res) {
  const { id: bookingId } = req.params;

  try {
    const result = await sendBookingConfirmation(bookingId);
    
    if (result.success) {
      res.json({ message: "Confirmation email sent successfully", messageId: result.messageId });
    } else {
      res.json({ message: "Email not sent", reason: result.reason });
    }
  } catch (error) {
    console.error("Error triggering confirmation:", error);
    res.status(500).json({ error: "Failed to send confirmation email" });
  }
}

/**
 * Controller to trigger sending invoice email
 * POST /bookings/:id/send-invoice
 * Roles: Accountant, Manager
 */
async function triggerInvoiceEmail(req, res) {
  const { id: bookingId } = req.params;

  try {
    const result = await sendInvoiceEmail(bookingId);
    
    if (result.success) {
      res.json({ message: "Invoice email sent successfully", messageId: result.messageId });
    } else {
      res.json({ message: "Email not sent", reason: result.reason });
    }
  } catch (error) {
    console.error("Error triggering invoice email:", error);
    res.status(500).json({ error: "Failed to send invoice email" });
  }
}

module.exports = {
  sendBookingConfirmation,
  sendCheckInReminder,
  sendInvoiceEmail,
  triggerBookingConfirmation,
  triggerInvoiceEmail
};
