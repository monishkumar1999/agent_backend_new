const AgentModel = require("../model/agent/agentModel");
const usersModel = require("../model/users/usersModel");

const getAgent = async (req, res) => {
    try {
        const { approve_status, fromDate, toDate, page = 1, limit = 5 } = req.body;

        // Construct the query
        let query = {};


        // Filter by approve_status if provided
        if (approve_status) {
            query.is_approval = approve_status;
        }

        // Filter by date range if provided
        if (fromDate && toDate) {
            query.createdAt = {
                $gte: new Date(fromDate),  // From date
                $lte: new Date(toDate)     // To date
            };
        }


        const skip = (page - 1) * limit;

        // Fetch agents with pagination
        const agents = await AgentModel.find(query)
            .select('id firstName email phone isSubscription is_approval profile_img ')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });  // Sorting by createdAt in descending order

        // Get the total count of matching agents for pagination purposes
        const totalAgents = await AgentModel.countDocuments(query);

        return res.status(200).json({
            agents,
            totalPages: Math.ceil(totalAgents / limit),
            currentPage: page,
            totalAgents
        });
    } catch (err) {
        console.error('Error fetching agent details:', err);
        return res.status(500).json({ message: 'Error fetching agent details' });
    }
};

const approveAgent = async (req, res) => {
    try {
        const { is_approval, id } = req.body; // Expect '0' (decline) or '1' (approve)

        if (!['0', '1'].includes(is_approval)) {
            return res.status(400).json({ message: 'Invalid value for is_approval. Use "0" to decline, "1" to approve.' });
        }

        const agent = await AgentModel.findById(id);
        if (!agent) {
            return res.status(404).json({ message: 'Agent not found' });
        }

        agent.is_approval = is_approval;
        await agent.save();

        return res.status(200).json({ message: `Agent ${is_approval === '1' ? 'approved' : 'declined'} successfully` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const agentDetails = async (req, res) => {
    const { id } = req.body;
    const agent = await AgentModel.findById(id);
    if (!agent) {
        return res.json({
            status: "false",
            message: "No user found"
        })
    }
    res.json({
        status: "true",
        data: agent
    })
}

const user = async (req, res) => {
    try {
        const { page = 1, limit = 10, searchQuery = "" } = req.query; // Default page 1, limit 10 per page, and searchQuery

        // Use a regular expression to perform case-insensitive partial match for search
        const query = { action: "0" };
        if (searchQuery) {
            query.$or = [
                { userName: { $regex: searchQuery, $options: "i" } }, // Case-insensitive search for userName
                { email: { $regex: searchQuery, $options: "i" } } // Case-insensitive search for email
            ];
        }

        const activeUsers = await usersModel
            .find(query)
            .select("_id userName email mobile profileImage") // Only required fields
            .skip((page - 1) * limit) // Skips previous pages
            .limit(parseInt(limit)); // Limits records per page

        const totalUsers = await usersModel.countDocuments(query); // Get total count considering the search filter

        res.status(200).json({
            success: true,
            data: activeUsers,
            totalPages: Math.ceil(totalUsers / limit), // Calculate total pages
            currentPage: parseInt(page),
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};

const userDetailsGet=async(req,res)=>{

   const {userid}= req.body;
   console.log(userid)
  const user=   await usersModel.findById(userid).select("userName")

 
   res.json({
    status:"true",
    data:user
   })
}

const userSidemenu=async()=>{
    
}
module.exports = { getAgent, approveAgent, agentDetails,user,userDetailsGet };
