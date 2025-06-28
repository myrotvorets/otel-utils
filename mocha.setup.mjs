const env = { ...process.env };
process.env = {
    NODE_ENV: 'test',
};

/** @type {import('mocha').RootHookObject} */
export const mochaHooks = {
    afterEach() {
        process.env = { ...env };
    },
};
