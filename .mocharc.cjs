/** @type {import('mocha').MochaOptions} */
module.exports = {
    recursive: true,
    extension: ['.test.mts'],
    'node-option': ['loader=ts-node/esm', 'no-warnings'],
    require: 'mocha.setup.mjs',
    reporter: 'mocha-multi',
    'reporter-option': [
        'spec=-',
        process.env.GITHUB_ACTIONS === 'true' ? 'mocha-reporter-gha=-' : null,
        process.env.SONARSCANNER === 'true' ? 'mocha-reporter-sonarqube=test-report.xml' : null,
    ].filter(Boolean),
}
