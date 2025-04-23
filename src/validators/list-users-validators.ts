import { checkSchema } from 'express-validator';

export default checkSchema(
    {
        currentPage: {
            customSanitizer: {
                options: (value) => {
                    // '2', 'undefined', 'sdlfhhdf' =>NaN
                    const parsedValue = Number(value);
                    return Number.isNaN(parsedValue) ? 1 : parsedValue;
                },
            },
        },
        perPage: {
            customSanitizer: {
                options: (value) => {
                    // '2', 'undefined', 'sdlfhhdf' =>NaN
                    const parsedValue = Number(value);
                    return Number.isNaN(parsedValue) ? 6 : parsedValue;
                },
            },
        },
    },
    ['query'],
); //This ['query'] will fetch the value from the request URL's params/query
