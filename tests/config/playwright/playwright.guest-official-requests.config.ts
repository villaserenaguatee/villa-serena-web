import {defineConfig} from '@playwright/test';
import reception,{projectPath,reporters} from './playwright.config';
const server=reception.webServer;
if(!server||Array.isArray(server))throw Error('Expected one local Next server');
export default defineConfig({...reception,testMatch:'**/guest-official-requests.spec.ts',testIgnore:[],outputDir:projectPath('test-results/guest-official-requests'),reporter:reporters('guest-official-requests'),webServer:[
 {cwd:projectPath(),command:'node tests/integration/guest-read-api-server.mjs',url:'http://127.0.0.1:3049/health',reuseExistingServer:false,timeout:15_000,gracefulShutdown:{signal:'SIGTERM',timeout:5000}},
 {...server,command:'node node_modules/next/dist/bin/next dev --hostname localhost --port 3048',env:{...server.env,STAFF_AUTH_MODE:'spring',GUEST_AUTH_MODE:'spring',VILLA_SERENA_BFF_MODE:'api',API_URL:'http://127.0.0.1:3049'}},
]});
