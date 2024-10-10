import mongoose from 'mongoose';
import Joi from 'joi';

const TicketSchema = new mongoose.Schema({
  systemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'System',
    required: true,
  },
  number: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['waiting', 'served'],
    default: 'waiting',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  servedAt: {
    type: Date,
  },
}, { timestamps: true });

// Add compound index for faster queries
TicketSchema.index({ systemId: 1, status: 1, createdAt: -1 });

// Add a method to mark ticket as served
TicketSchema.methods.markAsServed = function() {
  this.status = 'served';
  this.servedAt = new Date();
  return this.save();
};

// Add a static method to get the next ticket number
TicketSchema.statics.getNextTicketNumber = async function(systemId) {
  const lastTicket = await this.findOne({ systemId: systemId }).sort('-number');
  return lastTicket ? lastTicket.number + 1 : 1;
};

function validateTicket(ticket) {
  const schema = Joi.object({
    systemId: Joi.string().required(),
    status: Joi.string().valid('waiting', 'served'),
    createdAt: Joi.date(),
    servedAt: Joi.date(),
  });
  return schema.validate(ticket);
}

function validateTicketUpdate(ticket) {
  const schema = Joi.object({
    status: Joi.string().valid('waiting', 'served'),
    servedAt: Joi.date(),
  });
  return schema.validate(ticket);
}

const Ticket = mongoose.model('Ticket', TicketSchema);

export { Ticket, TicketSchema, validateTicket, validateTicketUpdate };
