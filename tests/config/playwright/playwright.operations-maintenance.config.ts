import {operationsConfig} from './playwright.operations.config';
const config=operationsConfig('maintenance');
if(!Array.isArray(config.webServer))throw Error('Expected isolated test servers');
config.webServer[1].command='node node_modules/next/dist/bin/next dev --hostname localhost --port 3048';
export default config;
