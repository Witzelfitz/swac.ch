import mongoose from 'mongoose';
import Joi from 'joi';
import crypto from 'crypto';

const StateSchema = new mongoose.Schema({
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
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

// Add index for faster queries
StateSchema.index({ name: 1 });

// Add a static method for finding active states
StateSchema.statics.findActive = function() {
  return this.find({ isActive: true });
};

function validateState(state) {
  const schema = Joi.object({
    name: Joi.string().required(),
    secret: Joi.string(),
    isActive: Joi.boolean()
  });
  return schema.validate(state);
}

function validateUpdateState(state) {
  const schema = Joi.object({
    isActive: Joi.boolean()
  });
  return schema.validate(state);
}

const State = mongoose.model('State', StateSchema);

export { State, StateSchema, validateState, validateUpdateState };
