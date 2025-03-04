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

    firstName: {
        errorMessage: 'First name is required',
        notEmpty: true,
        trim: true,
    },

    lastName: {
        errorMessage: 'Last name is required',
        notEmpty: true,
        trim: true,
    },

    password: {
        trim: true,
        notEmpty: true,
        errorMessage: 'Password is required',
        isLength: {
            options: { min: 8 },
            errorMessage: 'Password length should be at least 8 characters',
        },
    },
});
