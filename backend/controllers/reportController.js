// controllers/reportController.js
const reportModel = require('../models/reportModel');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
// Method to create a new report
const createReport = async (req, res) => {
    const { post_id, comment_id, promotion_id, reason } = req.body;

    if (!req.user || !req.user.user_id) {
        return res.status(401).json({ message: 'Unauthorized: Invalid user' });
    }

    if (!reason) {
        return res.status(400).json({ message: 'Reason is required.' });
    }

    if ((post_id && (comment_id || promotion_id)) || 
        (comment_id && (post_id || promotion_id)) || 
        (promotion_id && (post_id || comment_id))) {
        return res.status(400).json({ message: 'Only one of post_id, comment_id, or promotion_id can be provided at a time.' });
    }

    if (!(post_id || comment_id || promotion_id)) {
        return res.status(400).json({ message: 'At least one of post_id, comment_id, or promotion_id must be provided.' });
    }

    try {
        console.log("Input to createReport:", { 
            user_id: req.user.user_id, post_id, comment_id, promotion_id, reason 
        });
        
        const result = await reportModel.createReport(req.user.user_id, post_id, comment_id, promotion_id, reason);
        
        res.status(201).json({ message: 'Report created successfully', reportId: result.insertId });
    } catch (err) {
        console.error("Error in createReport:", err);
        res.status(500).json({ message: 'Error creating report', error: err.message });
    }
};

  

const getReportsByItem = async (req, res) => {
    const { item_id, item_type } = req.params;
  
    // Check if both item_id and item_type are provided in the request params
    if (!item_id || !item_type) {
      return res.status(400).json({ message: 'Item ID and type are required.' });
    }
  
    try {
      console.log("Fetching reports for:", { item_id, item_type });
  
      // Fetch reports using the model
      const reports = await reportModel.getReportsByItem(item_id, item_type);
  
      console.log("Reports fetched:", reports);
  
      if (reports.length > 0) {
        // If reports are found, return them
        res.status(200).json({ reports });
      } else {
        // If no reports are found, return 404
        res.status(404).json({ message: 'No reports found for the given item.' });
      }
    } catch (err) {
      console.error("Error fetching reports:", err.message);
      // Return a 500 error if something goes wrong in the model
      res.status(500).json({ message: 'Error fetching reports', error: err.message });
    }
  };

  const getReports = async (req, res) => {
    try {
      const { page = 1, limit = 5 } = req.query; // Default: page 1, 5 reports per page
      const offset = (page - 1) * limit;
  
      // Fetch reports with pagination
      const reports = await reportModel.getAllReports(parseInt(limit), parseInt(offset));
  
      // Fetch total count of reports
      const totalCount = await reportModel.getReportsCount();
  
      res.status(200).json({
        reports,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
      });
    } catch (error) {
      console.error("Error fetching reports:", error);
      res.status(500).json({ message: 'Failed to fetch reports', error: error.message });
    }
  };
  
  const updateStatus = async (req, res) => {
    const { reportId } = req.params; // Get the reportId from the URL parameter
    const { status } = req.body; // Get the new status from the request body
  
    // Validate the status value (optional, depending on your business logic)
    if (!status || !['Pending', 'Resolved', 'Ignored'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value.' });
    }
  
    try {
      // Update the status of the report in the database
      const query = 'UPDATE reports SET status = ? WHERE report_id = ?';
      const [result] = await db.promise().query(query, [status, reportId]);
  
      if (result.affectedRows === 0) {
        // If no rows were affected, the reportId doesn't exist
        return res.status(404).json({ message: 'Report not found.' });
      }
  
      // Send a success response
      res.status(200).json({ message: 'Report status updated successfully!' });
    } catch (error) {
      console.error('Error updating report status:', error);
      res.status(500).json({ message: 'Failed to update the report status.' });
    }
  };


module.exports = { createReport, getReportsByItem, getReports, updateStatus};
