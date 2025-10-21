const { AuditLog, UserAccount, Booking, Room, Payment, Guest, PreBooking } = require('../models');
const { Op } = require('sequelize');

/**
 * Audit Log Controller
 * Provides comprehensive audit log functionality with filtering, pagination, and enrichment
 */

/**
 * List audit logs with pagination and filtering
 */
const listAuditLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      start_date,
      end_date,
      entity,
      action,
      actor,
      search,
      sort_by = 'created_at',
      sort_order = 'DESC'
    } = req.query;

    // Build where clause
    const whereClause = {};

    // Date range filter
    if (start_date || end_date) {
      whereClause.created_at = {};
      if (start_date) {
        whereClause.created_at[Op.gte] = new Date(start_date);
      }
      if (end_date) {
        whereClause.created_at[Op.lte] = new Date(end_date);
      }
    }

    // Entity filter
    if (entity && entity !== 'all') {
      whereClause.entity = entity;
    }

    // Action filter
    if (action && action !== 'all') {
      whereClause.action = action;
    }

    // Actor filter
    if (actor) {
      whereClause.actor = {
        [Op.iLike]: `%${actor}%`
      };
    }

    // Search filter (searches in entity_id and details)
    if (search) {
      whereClause[Op.or] = [
        { entity_id: { [Op.iLike]: `%${search}%` } },
        { details: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Calculate pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Get audit logs with pagination
    const { count, rows: auditLogs } = await AuditLog.findAndCountAll({
      where: whereClause,
      order: [[sort_by, sort_order.toUpperCase()]],
      limit: parseInt(limit),
      offset: offset
    });

    // Enrich audit logs with entity information
    const enrichedLogs = await Promise.all(
      auditLogs.map(async (log) => {
        const enrichedLog = log.toJSON();
        
        // Add user information
        try {
          const user = await UserAccount.findByPk(log.actor, {
            attributes: ['user_id', 'username', 'role']
          });
          if (user) {
            enrichedLog.user = user.toJSON();
          }
        } catch (error) {
          console.warn(`Failed to load user for audit log ${log.audit_id}:`, error.message);
        }
        
        // Add entity information based on entity type
        if (log.entity_id) {
          try {
            switch (log.entity) {
              case 'booking': {
                const booking = await Booking.findByPk(log.entity_id, {
                  attributes: ['booking_id', 'guest_id', 'status'],
                  include: [{
                    model: Guest,
                    as: 'guest',
                    attributes: ['guest_id', 'full_name']
                  }]
                });
                if (booking) {
                  enrichedLog.entity_info = {
                    id: booking.booking_id,
                    status: booking.status,
                    guest_name: booking.guest?.full_name
                  };
                }
                break;
              }
              case 'room': {
                const room = await Room.findByPk(log.entity_id, {
                  attributes: ['room_id', 'room_number', 'status']
                });
                if (room) {
                  enrichedLog.entity_info = {
                    id: room.room_id,
                    room_number: room.room_number,
                    status: room.status
                  };
                }
                break;
              }
              case 'payment': {
                const payment = await Payment.findByPk(log.entity_id, {
                  attributes: ['payment_id', 'amount', 'payment_method']
                });
                if (payment) {
                  enrichedLog.entity_info = {
                    id: payment.payment_id,
                    amount: payment.amount,
                    payment_method: payment.payment_method
                  };
                }
                break;
              }
              case 'guest': {
                const guest = await Guest.findByPk(log.entity_id, {
                  attributes: ['guest_id', 'full_name', 'email']
                });
                if (guest) {
                  enrichedLog.entity_info = {
                    id: guest.guest_id,
                    full_name: guest.full_name,
                    email: guest.email
                  };
                }
                break;
              }
              case 'pre_booking': {
                const preBooking = await PreBooking.findByPk(log.entity_id, {
                  attributes: ['pre_booking_id', 'status', 'guest_name']
                });
                if (preBooking) {
                  enrichedLog.entity_info = {
                    id: preBooking.pre_booking_id,
                    status: preBooking.status,
                    guest_name: preBooking.guest_name
                  };
                }
                break;
              }
            }
          } catch (error) {
            console.warn(`Failed to enrich audit log ${log.audit_id}:`, error.message);
          }
        }
        
        return enrichedLog;
      })
    );

    const totalPages = Math.ceil(count / parseInt(limit));

    res.json({
      success: true,
      data: enrichedLogs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch audit logs',
      message: error.message
    });
  }
};

/**
 * Get audit log statistics
 */
const getAuditLogStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get total events count
    const totalEvents = await AuditLog.count();

    // Get today's events count
    const todayEvents = await AuditLog.count({
      where: {
        created_at: {
          [Op.gte]: today,
          [Op.lt]: tomorrow
        }
      }
    });

    // Get critical events count (DELETE operations)
    const criticalEvents = await AuditLog.count({
      where: {
        action: 'DELETE'
      }
    });

    // Get events by entity type
    const eventsByEntity = await AuditLog.findAll({
      attributes: [
        'entity',
        [AuditLog.sequelize.fn('COUNT', '*'), 'count']
      ],
      group: ['entity'],
      order: [[AuditLog.sequelize.fn('COUNT', '*'), 'DESC']]
    });

    // Get events by action type
    const eventsByAction = await AuditLog.findAll({
      attributes: [
        'action',
        [AuditLog.sequelize.fn('COUNT', '*'), 'count']
      ],
      group: ['action'],
      order: [[AuditLog.sequelize.fn('COUNT', '*'), 'DESC']]
    });

    // Get recent activity (last 10 events)
    const recentActivity = await AuditLog.findAll({
      order: [['created_at', 'DESC']],
      limit: 10
    });

    // Enrich recent activity with user information
    const enrichedRecentActivity = await Promise.all(
      recentActivity.map(async (log) => {
        const enrichedLog = log.toJSON();
        try {
          const user = await UserAccount.findByPk(log.actor, {
            attributes: ['user_id', 'username', 'role']
          });
          if (user) {
            enrichedLog.user = user.toJSON();
          }
        } catch (error) {
          console.warn(`Failed to load user for recent activity log ${log.audit_id}:`, error.message);
        }
        return enrichedLog;
      })
    );

    // Get events by hour (for today)
    const hourlyActivity = await AuditLog.findAll({
      attributes: [
        [AuditLog.sequelize.fn('EXTRACT', AuditLog.sequelize.literal('HOUR FROM created_at')), 'hour'],
        [AuditLog.sequelize.fn('COUNT', '*'), 'count']
      ],
      where: {
        created_at: {
          [Op.gte]: today,
          [Op.lt]: tomorrow
        }
      },
      group: [AuditLog.sequelize.fn('EXTRACT', AuditLog.sequelize.literal('HOUR FROM created_at'))],
      order: [[AuditLog.sequelize.fn('EXTRACT', AuditLog.sequelize.literal('HOUR FROM created_at')), 'ASC']]
    });

    res.json({
      success: true,
      data: {
        totalEvents,
        todayEvents,
        criticalEvents,
        eventsByEntity: eventsByEntity.map(item => ({
          entity: item.entity,
          count: parseInt(item.dataValues.count)
        })),
        eventsByAction: eventsByAction.map(item => ({
          action: item.action,
          count: parseInt(item.dataValues.count)
        })),
        recentActivity: enrichedRecentActivity.map(log => ({
          audit_id: log.audit_id,
          actor: log.actor,
          action: log.action,
          entity: log.entity,
          entity_id: log.entity_id,
          created_at: log.created_at,
          user: log.user
        })),
        hourlyActivity: hourlyActivity.map(item => ({
          hour: parseInt(item.dataValues.hour),
          count: parseInt(item.dataValues.count)
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching audit log stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch audit log statistics',
      message: error.message
    });
  }
};

/**
 * Get single audit log entry by ID
 */
const getAuditLogById = async (req, res) => {
  try {
    const { id } = req.params;

    const auditLog = await AuditLog.findByPk(id);

    if (!auditLog) {
      return res.status(404).json({
        success: false,
        error: 'Audit log not found'
      });
    }

    // Enrich audit log with user information
    const enrichedLog = auditLog.toJSON();
    try {
      const user = await UserAccount.findByPk(auditLog.actor, {
        attributes: ['user_id', 'username', 'role']
      });
      if (user) {
        enrichedLog.user = user.toJSON();
      }
    } catch (error) {
      console.warn(`Failed to load user for audit log ${auditLog.audit_id}:`, error.message);
    }

    // Get related audit logs for the same entity
    const relatedLogs = await AuditLog.findAll({
      where: {
        entity: auditLog.entity,
        entity_id: auditLog.entity_id,
        audit_id: { [Op.ne]: auditLog.audit_id }
      },
      order: [['created_at', 'DESC']],
      limit: 10
    });

    // Enrich related logs with user information
    const enrichedRelatedLogs = await Promise.all(
      relatedLogs.map(async (log) => {
        const enrichedLog = log.toJSON();
        try {
          const user = await UserAccount.findByPk(log.actor, {
            attributes: ['user_id', 'username', 'role']
          });
          if (user) {
            enrichedLog.user = user.toJSON();
          }
        } catch (error) {
          console.warn(`Failed to load user for related log ${log.audit_id}:`, error.message);
        }
        return enrichedLog;
      })
    );

    res.json({
      success: true,
      data: {
        ...enrichedLog,
        relatedLogs: enrichedRelatedLogs.map(log => ({
          audit_id: log.audit_id,
          actor: log.actor,
          action: log.action,
          created_at: log.created_at,
          user: log.user
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching audit log by ID:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch audit log',
      message: error.message
    });
  }
};

/**
 * Export audit logs to CSV
 */
const exportAuditLogs = async (req, res) => {
  try {
    const {
      start_date,
      end_date,
      entity,
      action,
      actor,
      search
    } = req.query;

    // Build where clause (same as listAuditLogs)
    const whereClause = {};

    if (start_date || end_date) {
      whereClause.created_at = {};
      if (start_date) {
        whereClause.created_at[Op.gte] = new Date(start_date);
      }
      if (end_date) {
        whereClause.created_at[Op.lte] = new Date(end_date);
      }
    }

    if (entity && entity !== 'all') {
      whereClause.entity = entity;
    }

    if (action && action !== 'all') {
      whereClause.action = action;
    }

    if (actor) {
      whereClause.actor = {
        [Op.iLike]: `%${actor}%`
      };
    }

    if (search) {
      whereClause[Op.or] = [
        { entity_id: { [Op.iLike]: `%${search}%` } },
        { details: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Get all matching audit logs
    const auditLogs = await AuditLog.findAll({
      where: whereClause,
      order: [['created_at', 'DESC']]
    });

    // Convert to CSV format
    const csvHeader = 'ID,Timestamp,Actor,Action,Entity,Entity ID,Details\n';
    const csvRows = auditLogs.map(log => {
      const details = log.details ? JSON.stringify(log.details).replace(/"/g, '""') : '';
      return [
        log.audit_id,
        log.created_at.toISOString(),
        log.actor,
        log.action,
        log.entity,
        log.entity_id || '',
        `"${details}"`
      ].join(',');
    }).join('\n');

    const csvContent = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvContent);

  } catch (error) {
    console.error('Error exporting audit logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export audit logs',
      message: error.message
    });
  }
};

module.exports = {
  listAuditLogs,
  getAuditLogStats,
  getAuditLogById,
  exportAuditLogs
};
