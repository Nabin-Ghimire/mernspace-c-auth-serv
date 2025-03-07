import { checkSchema } from 'express-validator';

// export default [body('email').notEmpty().withMessage('Email is required')];
export default checkSchema({
    email: {
        trim: true,
        errorMessage: 'Email is required',
        notEmpty: true,
        isEmail: {
            errorMessage: 'Email should be valid email',
        },
    },

    password: {
        trim: true,
        notEmpty: true,
        errorMessage: 'Password is required',
    },
});
