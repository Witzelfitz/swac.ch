import mongoose from 'mongoose';
import Joi from 'joi';
import crypto from 'crypto';

const SystemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  secret: {
    type: String,
    required: true,
    unique: true,
    default: () => crypto.randomBytes(16).toString('hex'),
  },
  currentNumber: {
    type: Number,
    default: 0,
  },
  averageWaitTime: {
    type: Number, // in minutes
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

// Add index for faster queries
SystemSchema.index({ name: 1 });

// Add a static method for finding active systems
SystemSchema.statics.findActive = function() {
  return this.find({ isActive: true });
};

function validateSystem(system) {
  const schema = Joi.object({
    name: Joi.string().required(),
    secret: Joi.string(),
    currentNumber: Joi.number(),
    averageWaitTime: Joi.number(),
    createdAt: Joi.date(),
    isActive: Joi.boolean()
  });
  return schema.validate(system);
}

function validateUpdateSystem(system) {
  const schema = Joi.object({
    currentNumber: Joi.number(),
    averageWaitTime: Joi.number(),
    isActive: Joi.boolean()
  });
  return schema.validate(system);
}

const System = mongoose.model('System', SystemSchema);

export { System, SystemSchema, validateSystem, validateUpdateSystem };
