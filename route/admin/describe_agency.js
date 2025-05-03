const express = require('express');
const checkJwt = require('../../middleware/checkToken');  // Token validation middleware
const DescribesAgency = require('../../model/describes_agency');
const cors = require('cors');

const describeRouter = express.Router();



// API to add a new DescribesAgency
describeRouter.use("/add", checkJwt, async (req, res) => {
    const { name } = req.body;
    try {
        if (!name) {
            throw new Error("Describes Agency name is required");
        }

        // Check if describes agency with the same name exists
        const existingAgency = await DescribesAgency.findOne({ name, action: '0' });

        if (existingAgency) {
            throw new Error("Describes Agency with this name already exists");
        }

        const agencyInstance = new DescribesAgency({ name });
        const savedAgency = await agencyInstance.save();

        if (savedAgency) {
            res.status(200).json({
                status: "true",
                message: "Describes Agency added successfully"
            });
        }
    } catch (err) {
        return res.status(500).json({
            status: "false",
            message: err.message
        });
    }
});

// View all Describes Agencies
describeRouter.get("/view",async (req, res) => {
    try {
        const agencies = await DescribesAgency.find({ action: "0" });  // Fetch agencies with action '0' (active)
        res.status(200).json({ status: "true", data: agencies });
    } catch (err) {
        return res.status(500).json({ status: "false", message: err.message });
    }
});

// Edit an existing Describes Agency
describeRouter.put("/edit", checkJwt, async (req, res) => {
    const { name, newName } = req.body;

    try {
        // Check if the new name already exists in the database
        const existingAgency = await DescribesAgency.findOne({ name: newName, action: "0" });

        if (existingAgency) {
            return res.status(400).json({
                status: "false",
                message: "Describes Agency with this name already exists"
            });
        }

        // Proceed with updating the agency name
        const agencyInstance = await DescribesAgency.findOne({ name });

        if (!agencyInstance) {
            return res.status(404).json({
                status: "false",
                message: "Describes Agency not found"
            });
        }

        agencyInstance.name = newName;
        await agencyInstance.save();

        res.status(200).json({
            status: "true",
            message: "Describes Agency updated successfully"
        });
    } catch (err) {
        return res.status(500).json({
            status: "false",
            message: err.message
        });
    }
});

// Delete a Describes Agency (by setting action to '1' instead of actual deletion)
describeRouter.delete("/delete", checkJwt, async (req, res) => {
    const { _id } = req.body;

    try {
        if (!_id) {
            throw new Error("Describes Agency ID is required");
        }

        const agencyInstance = await DescribesAgency.findOne({ _id });

        if (!agencyInstance) {
            return res.status(404).json({
                status: "false",
                message: "Describes Agency not found"
            });
        }

        agencyInstance.action = '1';  // Mark the agency as inactive by setting action to '1'
        await agencyInstance.save();

        res.status(200).json({
            status: "true",
            message: "Describes Agency action updated to '1'"
        });
    } catch (err) {
        return res.status(500).json({
            status: "false",
            message: err.message
        });
    }
});

module.exports = describeRouter;
