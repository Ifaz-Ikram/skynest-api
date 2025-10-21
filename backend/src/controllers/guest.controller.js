// src/controllers/guest.controller.js - Add ID proof update functionality
const { pool } = require("../db");
const { logAudit } = require("../middleware/audit");

// Update guest ID proof information
async function updateGuestIdProof(req, res) {
  try {
    const { guestId } = req.params;
    const { id_proof_type, id_proof_number } = req.body;

    if (!guestId) {
      return res.status(400).json({ error: "Guest ID is required" });
    }

    if (!id_proof_type || !id_proof_number) {
      return res.status(400).json({ 
        error: "Both id_proof_type and id_proof_number are required" 
      });
    }

    // Check if guest exists
    const guestResult = await pool.query(
      `SELECT guest_id, full_name FROM guest WHERE guest_id = $1`,
      [guestId]
    );

    if (guestResult.rows.length === 0) {
      return res.status(404).json({ error: "Guest not found" });
    }

    // Check if ID proof combination already exists (excluding current guest)
    const existingIdResult = await pool.query(
      `SELECT guest_id FROM guest 
       WHERE id_proof_type = $1 AND id_proof_number = $2 AND guest_id != $3`,
      [id_proof_type, id_proof_number, guestId]
    );

    if (existingIdResult.rows.length > 0) {
      return res.status(409).json({ 
        error: "This ID proof combination is already registered to another guest" 
      });
    }

    // Update guest ID proof
    const updateResult = await pool.query(
      `UPDATE guest 
       SET id_proof_type = $1, id_proof_number = $2 
       WHERE guest_id = $3
       RETURNING guest_id, full_name, id_proof_type, id_proof_number`,
      [id_proof_type, id_proof_number, guestId]
    );

    const updatedGuest = updateResult.rows[0];

    // Log audit
    logAudit(req, {
      action: 'update_guest_id_proof',
      entity: 'guest',
      entityId: guestId,
      details: {
        guest_name: updatedGuest.full_name,
        id_proof_type,
        id_proof_number
      },
    });

    return res.json({
      message: "Guest ID proof updated successfully",
      guest: updatedGuest
    });

  } catch (err) {
    console.error("updateGuestIdProof error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Get guest ID proof status
async function getGuestIdProofStatus(req, res) {
  try {
    const { guestId } = req.params;

    if (!guestId) {
      return res.status(400).json({ error: "Guest ID is required" });
    }

    const result = await pool.query(
      `SELECT guest_id, full_name, id_proof_type, id_proof_number,
              CASE 
                WHEN id_proof_type IS NOT NULL AND id_proof_number IS NOT NULL AND id_proof_number != '' 
                THEN true 
                ELSE false 
              END as has_valid_id_proof
       FROM guest WHERE guest_id = $1`,
      [guestId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Guest not found" });
    }

    const guest = result.rows[0];

    return res.json({
      guest_id: guest.guest_id,
      full_name: guest.full_name,
      id_proof_type: guest.id_proof_type,
      id_proof_number: guest.id_proof_number,
      has_valid_id_proof: guest.has_valid_id_proof,
      can_make_tour_booking: guest.has_valid_id_proof,
      can_make_group_booking: guest.has_valid_id_proof
    });

  } catch (err) {
    console.error("getGuestIdProofStatus error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = {
  updateGuestIdProof,
  getGuestIdProofStatus,
};
