export const create_request_error = (status, message) => {
    const err = new Error();
    err.status = status;
    err.message = message;
    return err;
};
