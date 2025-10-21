const fs = require("fs");
const path = require("path");
const { pool } = require("../db");

const RATE_CONFIG_PATH = path.join(__dirname, "..", "config", "rate_rules.json");
const MS_PER_DAY = 24 * 60 * 60 * 1000;
let cachedConfig = null;
let cachedAt = 0;
const CACHE_TTL_MS = 60_000;

function loadConfig() {
  const now = Date.now();
  if (cachedConfig && now - cachedAt < CACHE_TTL_MS) {
    return cachedConfig;
  }
  try {
    const raw = fs.readFileSync(RATE_CONFIG_PATH, "utf8");
    cachedConfig = JSON.parse(raw);
  } catch (err) {
    cachedConfig = {
      default_plan: "BAR",
      plans: [],
      seasons: [],
      promos: [],
      blackouts: [],
      day_of_week: {},
      lead_time_rules: {},
    };
  }
  cachedAt = now;
  return cachedConfig;
}

function parseISO(input) {
  if (!input) return null;
  const date = new Date(input);
  return Number.isNaN(date.valueOf()) ? null : date;
}

function diffDays(start, end) {
  return Math.round((end - start) / MS_PER_DAY);
}

function floorDiffDays(start, end) {
  return Math.floor((end - start) / MS_PER_DAY);
}

function enumerateNights(start, nights) {
  const list = [];
  for (let i = 0; i < nights; i += 1) {
    list.push(new Date(start.getTime() + i * MS_PER_DAY));
  }
  return list;
}

function isWithin(date, from, to) {
  if (!date) return false;
  const start = from ? new Date(from) : null;
  const end = to ? new Date(to) : null;
  if (start && Number.isNaN(start.valueOf())) return false;
  if (end && Number.isNaN(end.valueOf())) return false;
  if (start && date < start) return false;
  if (end && date > end) return false;
  return true;
}

function normalizeChannel(channel) {
  return String(channel || "direct").trim().toLowerCase();
}

function matchesRoomType(roomTypeList, targetId) {
  if (!roomTypeList || roomTypeList === "ALL") return true;
  const candidates = Array.isArray(roomTypeList) ? roomTypeList : [roomTypeList];
  return candidates
    .map((id) => Number(id))
    .filter((id) => Number.isInteger(id))
    .includes(Number(targetId));
}

function roundCurrency(amount) {
  return Math.round(Number(amount || 0) * 100) / 100;
}

function dayKey(date) {
  return ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][date.getUTCDay()];
}

function findPlan(config, code) {
  if (!Array.isArray(config.plans)) return null;
  const wanted = String(code || "").toUpperCase();
  return config.plans.find(
    (plan) => String(plan.code || "").toUpperCase() === wanted,
  );
}

function findPromo(config, code) {
  if (!code || !Array.isArray(config.promos)) return null;
  const wanted = String(code).toUpperCase();
  return config.promos.find(
    (promo) => String(promo.code || "").toUpperCase() === wanted,
  );
}

function findBlackout(blackouts, date, roomTypeId) {
  if (!Array.isArray(blackouts)) return null;
  for (const blackout of blackouts) {
    if (!matchesRoomType(blackout.room_type_ids, roomTypeId)) continue;
    if (isWithin(date, blackout.from, blackout.to)) {
      return blackout;
    }
  }
  return null;
}

// GET /rates/quote?room_type_id=&check_in=&check_out=&promo=&plan=&channel=&access_code=
exports.quote = async (req, res) => {
  try {
    const {
      room_type_id,
      check_in,
      check_out,
      promo,
      plan,
      channel = "direct",
      access_code,
    } = req.query;

    if (!room_type_id || !check_in || !check_out) {
      return res
        .status(400)
        .json({ error: "room_type_id, check_in, check_out required" });
    }

    const roomTypeId = Number(room_type_id);
    if (!Number.isInteger(roomTypeId)) {
      return res.status(400).json({ error: "room_type_id must be a number" });
    }

    const checkInDate = parseISO(check_in);
    const checkOutDate = parseISO(check_out);
    if (!checkInDate || !checkOutDate) {
      return res.status(400).json({ error: "Invalid check_in or check_out date" });
    }

    const nights = diffDays(checkInDate, checkOutDate);
    if (nights <= 0) {
      return res
        .status(400)
        .json({ error: "check_out must be after check_in" });
    }

    const config = loadConfig();
    const planCode = String(plan || config.default_plan || "BAR").toUpperCase();
    const ratePlan = findPlan(config, planCode);
    if (!ratePlan) {
      return res
        .status(404)
        .json({ error: `Rate plan ${planCode} is not configured` });
    }

    const normalizedChannel = normalizeChannel(channel);
    if (
      Array.isArray(ratePlan.channels) &&
      !ratePlan.channels
        .map((c) => String(c).toLowerCase())
        .includes(normalizedChannel)
    ) {
      return res.status(400).json({
        error: `Plan ${planCode} is not available on channel ${normalizedChannel}`,
        allowed_channels: ratePlan.channels,
      });
    }

    if (!matchesRoomType(ratePlan.room_type_ids, roomTypeId)) {
      return res.status(400).json({
        error: `Plan ${planCode} is not available for room type ${roomTypeId}`,
      });
    }

    if (
      ratePlan.requires_code &&
      String(ratePlan.requires_code) !== String(access_code || "")
    ) {
      return res.status(403).json({
        error: `Rate plan ${planCode} requires an access code`,
        requires_code: true,
      });
    }

    if (ratePlan.min_nights && nights < Number(ratePlan.min_nights)) {
      return res.status(422).json({
        error: "Minimum nights not met for rate plan",
        required_min_nights: Number(ratePlan.min_nights),
        actual_nights: nights,
      });
    }
    if (ratePlan.max_nights && nights > Number(ratePlan.max_nights)) {
      return res.status(422).json({
        error: "Maximum nights exceeded for rate plan",
        allowed_max_nights: Number(ratePlan.max_nights),
        actual_nights: nights,
      });
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const leadDays = floorDiffDays(today, checkInDate);
    const minLead = Number(config.lead_time_rules?.min_days ?? 0);
    const maxLead = Number(config.lead_time_rules?.max_days ?? 0);
    if (leadDays < minLead) {
      return res.status(422).json({
        error: "Minimum lead time not met",
        required_min_days: minLead,
        actual_lead_days: leadDays,
      });
    }
    if (maxLead && leadDays > maxLead) {
      return res.status(422).json({
        error: "Maximum lead time exceeded",
        allowed_max_days: maxLead,
        actual_lead_days: leadDays,
      });
    }

    const roomTypeResult = await pool.query(
      `SELECT room_type_id, name, daily_rate
         FROM room_type
        WHERE room_type_id = $1`,
      [roomTypeId],
    );
    if (!roomTypeResult.rowCount) {
      return res.status(404).json({ error: "room_type not found" });
    }
    const roomType = roomTypeResult.rows[0];
    const baseRate = Number(roomType.daily_rate) || 0;

    const promoCode = promo ? String(promo).toUpperCase() : null;
    let promoRule = promoCode ? findPromo(config, promoCode) : null;
    const warnings = [];

    if (promoCode && !promoRule) {
      warnings.push(`Promo code ${promoCode} not recognized`);
    }
    if (promoRule) {
      if (
        promoRule.channels &&
        !promoRule.channels
          .map((c) => String(c).toLowerCase())
          .includes(normalizedChannel)
      ) {
        warnings.push(
          `Promo code ${promoRule.code} not available on ${normalizedChannel}`,
        );
        promoRule = null;
      } else if (
        promoRule.requires_plan &&
        String(promoRule.requires_plan).toUpperCase() !== planCode
      ) {
        warnings.push(
          `Promo code ${promoRule.code} only applies to plan ${promoRule.requires_plan}`,
        );
        promoRule = null;
      } else if (
        promoRule.min_nights &&
        nights < Number(promoRule.min_nights)
      ) {
        warnings.push(
          `Promo code ${promoRule.code} requires minimum ${promoRule.min_nights} nights`,
        );
        promoRule = null;
      } else if (
        promoRule.max_nights &&
        nights > Number(promoRule.max_nights)
      ) {
        warnings.push(
          `Promo code ${promoRule.code} only valid up to ${promoRule.max_nights} nights`,
        );
        promoRule = null;
      }
    }

    const nightly = [];
    let total = 0;
    const nightsDates = enumerateNights(checkInDate, nights);

    for (const date of nightsDates) {
      const blackout = findBlackout(config.blackouts, date, roomTypeId);
      if (blackout) {
        return res.status(409).json({
          error: "Requested stay intersects blackout period",
          blackout,
          date: date.toISOString().slice(0, 10),
        });
      }

      let nightlyRate = baseRate;
      const adjustments = [
        { type: "base", amount: roundCurrency(baseRate) },
      ];

      if (ratePlan.multiplier && ratePlan.multiplier !== 1) {
        nightlyRate *= Number(ratePlan.multiplier);
        adjustments.push({
          type: "plan",
          label: ratePlan.code,
          factor: Number(ratePlan.multiplier),
        });
      }

      const dowMultiplier = config.day_of_week?.[dayKey(date)];
      if (dowMultiplier && dowMultiplier !== 1) {
        nightlyRate *= Number(dowMultiplier);
        adjustments.push({
          type: "day_of_week",
          label: dayKey(date),
          factor: Number(dowMultiplier),
        });
      }

      for (const season of config.seasons || []) {
        if (isWithin(date, season.from, season.to)) {
          const mult = Number(season.multiplier || 1);
          nightlyRate *= mult;
          adjustments.push({
            type: "season",
            label: season.name || "Seasonal",
            factor: mult,
          });
        }
      }

      if (promoRule && isWithin(date, promoRule.from, promoRule.to)) {
        if (String(promoRule.type).toLowerCase() === "percent") {
          const percent = Number(promoRule.value || 0);
          const delta = nightlyRate * (percent / 100);
          nightlyRate -= delta;
          adjustments.push({
            type: "promo",
            label: promoRule.code,
            percent,
            amount: -roundCurrency(delta),
          });
        } else {
          const flat = Number(promoRule.value || 0);
          nightlyRate = Math.max(0, nightlyRate - flat);
          adjustments.push({
            type: "promo",
            label: promoRule.code,
            amount: -roundCurrency(flat),
          });
        }
      }

      nightlyRate = roundCurrency(nightlyRate);
      total += nightlyRate;

      nightly.push({
        date: date.toISOString().slice(0, 10),
        rate: nightlyRate,
        adjustments,
      });
    }

    return res.json({
      room_type: { id: roomType.room_type_id, name: roomType.name },
      check_in,
      check_out,
      nights,
      channel: normalizedChannel,
      plan: {
        code: ratePlan.code,
        name: ratePlan.name,
        multiplier: ratePlan.multiplier || 1,
      },
      base_rate: roundCurrency(baseRate),
      nightly,
      total: roundCurrency(total),
      applied_promo: promoRule
        ? { code: promoRule.code, type: promoRule.type, value: promoRule.value }
        : null,
      restrictions: {
        min_nights: ratePlan.min_nights || null,
        max_nights: ratePlan.max_nights || null,
        lead_time: {
          min_days: config.lead_time_rules?.min_days ?? null,
          max_days: config.lead_time_rules?.max_days ?? null,
          actual_days: leadDays,
        },
      },
      warnings,
    });
  } catch (err) {
    console.error("rates.quote error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
