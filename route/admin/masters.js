const express = require('express');
const checkJwt = require('../../middleware/checkToken');
const Describe = require('../../model/describe');
const cors = require('cors');

const masterRouter = express.Router();




masterRouter.use("/add", checkJwt, async (req, res) => {
    const { name } = req.body;
    try {
        if (!name) {
            throw new Error("Describe name is required")
        }
        const existingDescribe = await Describe.findOne({ name, action: '0' });

        if (existingDescribe) {
            throw new Error("Name already existed")
        }
        const describeInstance = new Describe({ name });
        const savedDocument = await describeInstance.save();

        if (savedDocument) {
            res.status(200).json({
                status: "true",
                "message": "Successfully inserted the data"
            })
        }
    }
    catch (err) {
        return res.status(500).json({
            status: "false",
            "message": err.message
        })
    }
});

// View API
// GET request to fetch all Describes
masterRouter.get("/view", async (req, res) => {

    try {
        const describes = await Describe.find({ action: "0" });

        
        res.status(200).json({ status: "true", data: describes });
    } catch (err) {
        return res.status(500).json({ status: "false", message: err.message });
    }
});



masterRouter.put("/edit",checkJwt, async (req, res) => {
    const { name, newName } = req.body;

    try {
        // Check if the new name already exists in the database
        const existingDescribe = await Describe.findOne({ name: newName, action: "0" });

        if (existingDescribe) {
            return res.status(400).json({
                status: "false",
                message: "Describe with this name already exists."
            });
        }

        // Proceed with updating the describe if the name is unique
        const describeInstance = await Describe.findOne({ name });

        if (!describeInstance) {
            return res.status(404).json({
                status: "false",
                message: "Describe not found"
            });
        }

        // Update the describe name
        describeInstance.name = newName;
        await describeInstance.save();

        res.status(200).json({
            status: "true",
            message: "Describe updated successfully"
        });
    } catch (err) {
        return res.status(500).json({
            status: "false",
            message: err.message
        });
    }
});


// Delete API
masterRouter.delete("/delete", async (req, res) => {
    const { _id } = req.body;  // Get the _id from the request body 

    try {
        if (_id == null) {
            throw new Error("Describe ID is required");  // Validate that _id is provided
        }

        const describeInstance = await Describe.findOne({ _id });
        if (!describeInstance) {
            return res.status(404).json({
                status: "false",
                message: "Describe not found"
            });
        }

        // Change the action to '1' instead of deleting the document
        describeInstance.action = '1';  
        
        await describeInstance.save();  // Save the updated describe instance

        res.status(200).json({
            status: "true",
            message: "Successfully updated the action to '1'"
        });
    } catch (err) {
        return res.status(500).json({
            status: "false",
            message: err.message
        });
    }
});



module.exports = masterRouter;
