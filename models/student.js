import mongoose from 'mongoose';
import Joi from 'joi';

const StudentSchema = new mongoose.Schema({
  stateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'State',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  status: {
    type: Number,
    enum: [0, 1, 2],
    default: 0,
  },
  wishedSpeed: {
    type: Number,
    min: 0,
    max: 100
  },
  courseHappiness: {
    type: Number,
    min: 1,
    max: 6
  }
}, { timestamps: true });

StudentSchema.index({ stateId: 1 });

function validateStudent(student) {
  const schema = Joi.object({
    stateId: Joi.string().required(),
    name: Joi.string().required(),
    status: Joi.number().valid(0, 1, 2),
    wishedSpeed: Joi.number().min(0).max(100),
    courseHappiness: Joi.number().min(1).max(6),
  });
  return schema.validate(student);
}

function validateStudentUpdate(student) {
  const schema = Joi.object({
    status: Joi.number().valid(0, 1, 2),
    wishedSpeed: Joi.number().min(0).max(100),
    courseHappiness: Joi.number().min(1).max(6),
  });
  return schema.validate(student);
}

const Student = mongoose.model('Student', StudentSchema);

export { Student, StudentSchema, validateStudent, validateStudentUpdate };
