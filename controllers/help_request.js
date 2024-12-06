import HelpRequest from "../models/help_request.js";
import User from "../models/user.js";

export const create_help_request = async (
    sender_id,
    responder_candidates,
    help_data
) => {
    const helpRequest = new HelpRequest({
        sender: sender_id,
        responder_candidates,
        ...help_data,
    });

    await helpRequest.save();

    const sender = await User.findById(sender_id);

    return {
        id: helpRequest._id,
        sender: {
            id: sender._id,
            first_name: sender.first_name,
            last_name: sender.last_name,
        },
        hospital_name: helpRequest.hospital_name,
        issue: helpRequest.issue,
        urgency: helpRequest.urgency,
        latitude: helpRequest.latitude,
        longitude: helpRequest.longitude,
        created_at: helpRequest.createdAt,
    };
};

export const reject_help_request = async (help_request_id, candidate_id) => {
    const help_request = await HelpRequest.findByIdAndUpdate(
        help_request_id,
        {
            $pull: { responder_candidates: candidate_id },
        },
        { new: true }
    );

    if (help_request.responder_candidates.length == 0) {
        await HelpRequest.findByIdAndUpdate(help_request_id, {
            status: "rejected",
        });
    }

    return {
        sender_id: help_request.sender._id.toString(),
        responder_candidates_left: help_request.responder_candidates.length,
    };
};

export const get_help_request_status_and_candidates = async (request_id) => {
    try {
        const help_request = await HelpRequest.findById(request_id);
        return {
            status: help_request.status,
            responder_candidates: help_request.responder_candidates,
            sender_id: help_request.sender._id.toString(),
        };
    } catch (err) {
        next(err);
    }
};

export const accept_help_request = async (request_id, responder_id) => {
    try {
        await HelpRequest.findByIdAndUpdate(request_id, {
            status: "accepted",
            responder: responder_id,
        });
    } catch (err) {
        next(err);
    }
};

export const complete_help_request = async (request_id) => {
    try {
        const help_request = await HelpRequest.findByIdAndUpdate(request_id, {
            status: "completed",
        });

        return [
            help_request.sender._id.toString(),
            help_request.responder._id.toString(),
        ];
    } catch (err) {
        next(err);
    }
};

export const get_other_user_mongo_id_for_active_help = async (user_id) => {
    try {
        const help_request = await HelpRequest.findOne({
            status: "accepted",
            $or: [{ sender: user_id }, { responder: user_id }],
        });

        if (!help_request) {
            return null;
        }

        return help_request.sender.toString() === user_id
            ? help_request.responder.toString()
            : help_request.sender.toString();
    } catch (err) {
        console.log(err);
    }
};

export const get_help_history = async (req, res, next) => {
    try {
        const help_history = await HelpRequest.find({
            status: "completed",
            $or: [{ sender: req.user_id }, { responder: req.user_id }],
        }).populate(["sender", "responder"]);

        const public_help_history = help_history.map((data) => {
            return {
                id: data._id.toString(),
                sender: {
                    id: data.sender._id.toString(),
                    first_name: data.sender.first_name,
                    last_name: data.sender.last_name,
                    gender: data.sender.gender,
                    blood_type: data.sender.blood_type,
                },
                responder: {
                    id: data.responder._id.toString(),
                    first_name: data.responder.first_name,
                    last_name: data.responder.last_name,
                    gender: data.responder.gender,
                    blood_type: data.responder.blood_type,
                },
                latitude: data.latitude,
                longitude: data.longitude,
                hospital_name: data.hospital_name,
                issue: data.issue,
                urgency: data.urgency,
                tip: data.tip,
                created_at: data.createdAt,
            };
        });

        res.status(200).json({
            sucess: true,
            help_history: public_help_history,
        });
    } catch (err) {
        next(err);
    }
};

export const get_active_help_request = async (req, res, next) => {
    try {
        const help_request = await HelpRequest.findOne({
            status: "accepted",
            $or: [{ sender: req.user_id }, { responder: req.user_id }],
        }).populate(["sender", "responder"]);

        const data = !help_request
            ? null
            : {
                  id: help_request._id.toString(),
                  sender: {
                      id: help_request.sender._id.toString(),
                      first_name: help_request.sender.first_name,
                      last_name: help_request.sender.last_name,
                      gender: help_request.sender.gender,
                      blood_type: help_request.sender.blood_type,
                      phone_no: help_request.sender.phone_no,
                  },
                  responder: {
                      id: help_request.responder._id.toString(),
                      first_name: help_request.responder.first_name,
                      last_name: help_request.responder.last_name,
                      gender: help_request.responder.gender,
                      blood_type: help_request.responder.blood_type,
                      phone_no: help_request.responder.phone_no,
                  },
                  latitude: help_request.latitude,
                  longitude: help_request.longitude,
                  hospital_name: help_request.hospital_name,
                  issue: help_request.issue,
                  urgency: help_request.urgency,
                  tip: help_request.tip,
                  created_at: help_request.createdAt,
              };

        res.status(200).json({
            sucess: true,
            active_help_request: data,
        });
    } catch (err) {
        next(err);
    }
};

export const get_pending_help_requests = async (req, res, next) => {
    try {
        const pending_requests = await HelpRequest.find({
            status: "waiting",
            responder_candidates: req.user_id,
        }).populate(["sender"]);

        const public_pending_requests = pending_requests.map((help_request) => {
            return {
                id: help_request._id,
                sender: {
                    id: help_request.sender._id,
                    first_name: help_request.sender.first_name,
                    last_name: help_request.sender.last_name,
                },
                hospital_name: help_request.hospital_name,
                issue: help_request.issue,
                urgency: help_request.urgency,
                latitude: help_request.latitude,
                longitude: help_request.longitude,
                created_at: help_request.createdAt,
            };
        });

        res.status(200).json({
            sucess: true,
            pending_help_requests: public_pending_requests,
        });
    } catch (err) {
        next(err);
    }
};
