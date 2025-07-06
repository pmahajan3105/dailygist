const timeout = require('express-timeout-handler');

const options = {
    timeout: 60000,
    //@ts-ignore
    onTimeout: (req: any, res: any) => {
        return res.status(408).send('Your request has timed out. Please try again')
    },
    disable: ['write', 'setHeaders', 'send', 'json', 'end'],
};

export const timeoutHandler = timeout.handler(options);
