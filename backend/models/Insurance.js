import mongoose from 'mongoose';

const insuranceSchema = new mongoose.Schema({
  provider: {
    type: String,
    required: true,
  },
  policyNumber: {
    type: String,
    required: true,
    unique: true,
  },
  coverageDetails: {
    type: String,
  },
  validTill: {
    type: Date,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, { timestamps: true });

const Insurance = mongoose.model('Insurance', insuranceSchema);
export default Insurance;
