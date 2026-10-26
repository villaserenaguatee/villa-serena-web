import {defineConfig} from '@playwright/test';
import {fileURLToPath} from 'node:url';
const cwd=fileURLToPath(new URL('../../../',import.meta.url));
export default defineConfig({testDir:'../../integration',testMatch:'hotel-editor.spec.ts',workers:1,retries:0,timeout:90000,expect:{timeout:15000},reporter:'list',outputDir:'../../../test-results/hotel',use:{actionTimeout:15000,baseURL:'http://localhost:3151',viewport:{width:1440,height:1000},screenshot:'only-on-failure',trace:'retain-on-failure'},webServer:[
 {cwd,command:'node tests/integration/hotel-api-server.mjs',url:'http://127.0.0.1:3150/health',reuseExistingServer:false},
 {cwd,command:'node node_modules/next/dist/bin/next start --hostname localhost --port 3151',url:'http://localhost:3151/panel/login',reuseExistingServer:false,env:{STAFF_AUTH_MODE:'spring',GUEST_AUTH_MODE:'spring',VILLA_SERENA_BFF_MODE:'api',API_URL:'http://127.0.0.1:3150',NEXT_PUBLIC_WS_URL:'',NEXT_TELEMETRY_DISABLED:'1'}}
]});
