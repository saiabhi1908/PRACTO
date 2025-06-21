import Insurance from '../models/Insurance.js';

// Add new insurance for a user
export const addInsurance = async (req, res) => {
  try {
    const { provider, policyNumber, coverageDetails, validTill } = req.body;
    const userId = req.user.id; // from auth middleware

    const newInsurance = new Insurance({
      provider,
      policyNumber,
      coverageDetails,
      validTill,
      userId,
    });

    const savedInsurance = await newInsurance.save();
    res.status(201).json(savedInsurance);
  } catch (error) {
    res.status(500).json({ message: 'Error adding insurance', error });
  }
};

// Get all insurance policies for a user
export const getUserInsurance = async (req, res) => {
  try {
    const userId = req.user.id;
    const insurances = await Insurance.find({ userId });
    res.status(200).json(insurances);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching insurance', error });
  }
};

// Update insurance policy
export const updateInsurance = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updatedInsurance = await Insurance.findByIdAndUpdate(id, updates, { new: true });
    res.status(200).json(updatedInsurance);
  } catch (error) {
    res.status(500).json({ message: 'Error updating insurance', error });
  }
};

// Delete insurance policy
export const deleteInsurance = async (req, res) => {
  try {
    const { id } = req.params;
    await Insurance.findByIdAndDelete(id);
    res.status(200).json({ message: 'Insurance deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting insurance', error });
  }
};
