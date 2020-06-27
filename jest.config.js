/* eslint-disable */
module.exports = {
    collectCoverageFrom: [],
    coveragePathIgnorePatterns: ['<rootDir>/node_modules/'],
    transform: {
        '\\.(ts|tsx|js)$': 'ts-jest',
        // '\\.(frag|vert|glsl)$':
        //     '<rootDir>/src/__tests__/config/glslTransform.js',
    },
    transformIgnorePatterns: [
        // Change MODULE_NAME_HERE to your module that isn't being compiled
        '/node_modules/(?!lodash).+\\.(js|tsx|ts)$',
    ],
    moduleFileExtensions: [
        'js',
        'jsx',
        'json',
        'ts',
        'tsx',
        'glsl',
        'vert',
        'frag',
    ],
    modulePathIgnorePatterns: ['/node_modules/'],
    testMatch: ['<rootDir>/src/**/*.test.(js|ts)'],
    testPathIgnorePatterns: ['/node_modules/'],
    testURL: 'http://localhost',
    globals: {
        'ts-jest': {
            isolatedModules: true,
            diagnostics: { pathRegex: '\\.(test)\\.ts$' },
        },
    },
    resetMocks: true,
    moduleDirectories: ['node_modules', 'src'],
};
