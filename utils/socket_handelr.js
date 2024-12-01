import { Server } from "socket.io";
import {
    accept_help_request,
    complete_help_request,
    create_help_request,
    get_help_request_status_and_candidates,
    get_other_user_mongo_id_for_active_help,
    reject_help_request,
} from "../controllers/help_request.js";

const socket_id_to_mongo_id = new Map();
const mongo_id_to_socket_id = new Map();
const socket_id_to_location = new Map();

export const socketHandelr = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
        },
    });

    io.on("connection", (socket) => {
        socket.on("register-user", (mongoId) => {
            socket_id_to_mongo_id.set(socket.id, mongoId);
            mongo_id_to_socket_id.set(mongoId, socket.id);
        });

        socket.on("update-location", async (location_info) => {
            socket_id_to_location.set(socket.id, location_info);

            const other_user__mongo_id =
                await get_other_user_mongo_id_for_active_help(
                    socket_id_to_mongo_id.get(socket.id)
                );

            if (other_user__mongo_id) {
                io.to(mongo_id_to_socket_id.get(other_user__mongo_id)).emit(
                    "other-user-location",
                    location_info
                );
            }
        });

        socket.on("send-help-request", async (help_data) => {
            const sender_id = socket_id_to_mongo_id.get(socket.id);
            const responder_candidates = findNearestUsers(sender_id);

            if (responder_candidates.length === 0) {
                socket.emit("help-request-failed", {
                    message: "No nearby users found",
                });
                return;
            }

            const helpRequest = await create_help_request(
                socket_id_to_mongo_id.get(socket.id),
                responder_candidates.map((candidate) => candidate.mongo_id),
                help_data
            );

            responder_candidates.forEach((candidate) => {
                io.to(candidate.socket_id).emit(
                    "new-help-request",
                    helpRequest
                );
            });

            socket.emit("help-request-sucess");
        });

        socket.on("accept-request", async ({ request_id }) => {
            const responder_id = socket_id_to_mongo_id.get(socket.id);

            const help_request = await get_help_request_status_and_candidates(
                request_id
            );

            if (
                help_request.status == "accepted" ||
                help_request.status == "completed"
            ) {
                socket.emit("request-already-accepted", {
                    request_id: request_id,
                });
                return;
            }

            await accept_help_request(request_id, responder_id);

            help_request.responder_candidates.forEach((candidate_id) => {
                if (candidate_id !== responder_id) {
                    io.to(mongo_id_to_socket_id.get(candidate_id)).emit(
                        "request-taken",
                        { request_id: request_id }
                    );
                }
            });

            io.to(mongo_id_to_socket_id.get(help_request.sender_id)).emit(
                "help-on-the-way",
                { request_id: request_id }
            );
            socket.emit("request-accepted", { request_id: request_id });
        });

        socket.on("deny-request", async ({ request_id }) => {
            const responder_id = socket_id_to_mongo_id.get(socket.id);

            const data = await reject_help_request(request_id, responder_id);

            if (data.responder_candidates_left === 0) {
                io.to(mongo_id_to_socket_id.get(data.sender_id)).emit(
                    "help-request-rejected"
                );
            }

            socket.emit("request-rejected", { request_id: request_id });
        });

        socket.on("complete-request", async ({ request_id, user_id }) => {
            const ids = await complete_help_request(request_id);

            ids.map((mongo_id) => {
                io.to(mongo_id_to_socket_id.get(mongo_id)).emit(
                    "request-completed"
                );
            });
        });

        socket.on("disconnect", () => {
            mongo_id_to_socket_id.delete(socket_id_to_mongo_id.get(socket.id));
            socket_id_to_location.delete(socket.id);
            socket_id_to_mongo_id.delete(socket.id);
        });
    });
};

const findNearestUsers = (sender_id) => {
    const sender_socket_id = mongo_id_to_socket_id.get(sender_id);

    const candidates = [];
    socket_id_to_location.forEach((value, key) => {
        if (key !== sender_socket_id) {
            candidates.push({
                socket_id: key,
                mongo_id: socket_id_to_mongo_id.get(key),
            });
        }
    });

    return candidates;
};
