const Cottage = require('../models/cottage');

exports.getAllCottages = async (req, res) => {
  try {
    const cottages = await Cottage.find();
    res.json({
      success: true,
      data: cottages,
      message: 'Cottages fetched successfully'
    });
  } catch (err) {
    console.error('Error fetching cottages:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch cottages',
      error: err.message 
    });
  }
}; 

exports.addCottage = async (req, res) => {
  try {
    const cottage = new Cottage(req.body);
    await cottage.save();
    res.status(201).json({
      success: true,
      data: cottage,
      message: 'Cottage added successfully'
    });
  } catch (err) {
    console.error('Error adding cottage:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to add cottage',
      error: err.message
    });
  }
};

exports.updateCottage = async (req, res) => {
  try {
    const cottage = await Cottage.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!cottage) {
      return res.status(404).json({ success: false, message: 'Cottage not found' });
    }
    res.json({
      success: true,
      data: cottage,
      message: 'Cottage updated successfully'
    });
  } catch (err) {
    console.error('Error updating cottage:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to update cottage',
      error: err.message
    });
  }
};

exports.updateCottageStatus = async (req, res) => {
  try {
    const { cottageNumber, status } = req.body;
    
    if (!cottageNumber || !status) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cottage number and status are required' 
      });
    }
    
    const cottage = await Cottage.findOneAndUpdate(
      { cottageNumber: cottageNumber },
      { status: status },
      { new: true }
    );
    
    if (!cottage) {
      return res.status(404).json({ 
        success: false, 
        message: `Cottage number ${cottageNumber} not found` 
      });
    }
    
    res.json({
      success: true,
      data: cottage,
      message: `Cottage ${cottageNumber} status updated to ${status}`
    });
  } catch (err) {
    console.error('Error updating cottage status:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to update cottage status',
      error: err.message
    });
  }
}; 