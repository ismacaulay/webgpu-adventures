module.exports = {
    collectCoverageFrom: [],
    coveragePathIgnorePatterns: ['<rootDir>/node_modules/'],
    transform: {
        '\\.(ts|tsx|js)$': 'ts-jest',
    },
    transformIgnorePatterns: [
        // Change MODULE_NAME_HERE to your module that isn't being compiled
        '/node_modules/(?!lodash).+\\.(js|tsx|ts)$',
    ],
    moduleFileExtensions: ['js', 'jsx', 'json', 'ts', 'tsx', 'glsl', 'vert', 'frag'],
    modulePathIgnorePatterns: ['/node_modules/'],
    testMatch: ['<rootDir>/src/**/*.test.(js|ts)'],
    testPathIgnorePatterns: ['/node_modules/'],
    testURL: 'http://localhost',
    globals: {
        'ts-jest': {
            isolatedModules: true,
            diagnostics: { pathRegex: '\\.(test)\\.ts$' },
        },
        GPUBufferUsage: {
            UNIFORM: 0,
            COPY_DST: 1,
        },
    },
    resetMocks: true,
    moduleDirectories: ['node_modules', 'src'],
};
