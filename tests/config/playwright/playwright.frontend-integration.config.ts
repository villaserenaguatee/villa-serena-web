import {defineConfig} from '@playwright/test';
import base,{projectPath,reporters} from './playwright.config';
const server=base.webServer;
if(!server||Array.isArray(server))throw Error('Expected one Next server');
export default defineConfig({...base,testMatch:['**/admin-indicators.spec.ts','**/admin-catalogs.spec.ts','**/admin-room-map.spec.ts','**/admin-room-offers.spec.ts','**/admin-rates-offers.spec.ts','**/amenities-wifi.spec.ts','**/guest-official-requests.spec.ts','**/frontend-integration.spec.ts'],testIgnore:[],outputDir:projectPath('test-results/frontend-integration'),reporter:reporters('frontend-integration'),webServer:[
 {cwd:projectPath(),command:'node tests/integration/hotel-facilities-api-server.mjs',url:'http://127.0.0.1:3049/health',reuseExistingServer:false,timeout:15000,gracefulShutdown:{signal:'SIGTERM',timeout:5000}},
 {...server,command:'node node_modules/next/dist/bin/next dev --hostname localhost --port 3048',env:{...server.env,STAFF_AUTH_MODE:'spring',GUEST_AUTH_MODE:'spring',VILLA_SERENA_BFF_MODE:'api',API_URL:'http://127.0.0.1:3049'}},
]});
