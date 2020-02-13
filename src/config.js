const dotenv = require('dotenv');

const port = '8080';
const host = 'localhost';
const staticPath = '../resources/html';
const accessType = 'Bearer';
const accessToken = 'eyJ0eXAiOiJKV1QiLCJub25jZSI6IndNVHZDYUp3aXY1NG44a1hDWW14d245bVhtZ1UzM0x5VlNhUFV0LVBOY0UiLCJhbGciOiJSUzI1NiIsIng1dCI6IkhsQzBSMTJza3hOWjFXUXdtak9GXzZ0X3RERSIsImtpZCI6IkhsQzBSMTJza3hOWjFXUXdtak9GXzZ0X3RERSJ9.eyJhdWQiOiIwMDAwMDAwMy0wMDAwLTAwMDAtYzAwMC0wMDAwMDAwMDAwMDAiLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC83NzU3NDNhMS03ZGEyLTQ3ODUtODMzZS1hOGVjYmYzN2M5MzcvIiwiaWF0IjoxNTgxNDI2NzQzLCJuYmYiOjE1ODE0MjY3NDMsImV4cCI6MTU4MTQzMDY0MywiYWNjdCI6MCwiYWNyIjoiMSIsImFpbyI6IjQyTmdZTkQ0WnZKMFcrZjJnMHdTdHNKdlBTMzNIOWxnZXpLaWY5TXRweDdOOThJU3VtVUEiLCJhbXIiOlsicHdkIl0sImFwcF9kaXNwbGF5bmFtZSI6IlRlYW0gTGluayIsImFwcGlkIjoiMzdiNjA0ZWItZGJiOC00OTVjLTk2MzgtODg0YjNiOWM1ZDcyIiwiYXBwaWRhY3IiOiIxIiwiZmFtaWx5X25hbWUiOiJBZG1pbiIsImdpdmVuX25hbWUiOiIyMTAiLCJpcGFkZHIiOiI4Ni4xMTAuMTk1LjEwNiIsIm5hbWUiOiIyMTAgQWRtaW4iLCJvaWQiOiJiY2NmZjY0Yi03N2ZjLTQwNGEtYTViOC1mMjA4YzdhMGYxYjYiLCJwbGF0ZiI6IjMiLCJwdWlkIjoiMTAwMzIwMDA5QUMwMzg1NiIsInNjcCI6IkNoYXQuUmVhZFdyaXRlIE1haWwuUmVhZCBVc2VyLlJlYWQgcHJvZmlsZSBvcGVuaWQgZW1haWwiLCJzdWIiOiItVXVxOC1oTzFqVW5PLXlxNkczbTUwUFpTZ0ZvTUpuNVNFR1hMSkdEMEFJIiwidGlkIjoiNzc1NzQzYTEtN2RhMi00Nzg1LTgzM2UtYThlY2JmMzdjOTM3IiwidW5pcXVlX25hbWUiOiIyMTBfYWRtaW5AZHhkZXZlbG9wZXIub25taWNyb3NvZnQuY29tIiwidXBuIjoiMjEwX2FkbWluQGR4ZGV2ZWxvcGVyLm9ubWljcm9zb2Z0LmNvbSIsInV0aSI6IkJRWjhleGdUSGtpLVNNTnlGYkdEQUEiLCJ2ZXIiOiIxLjAiLCJ3aWRzIjpbIjY5MDkxMjQ2LTIwZTgtNGE1Ni1hYTRkLTA2NjA3NWIyYTdhOCJdLCJ4bXNfc3QiOnsic3ViIjoicmZQQTVEanUtUjVqQkxaR1ZmYkFvUUQtbUd5MUFkTmxfNkNkTFpSU216MCJ9LCJ4bXNfdGNkdCI6MTU4MTQwOTIxMn0.Am2DkE-h-3WLB1xs9wXLJM1xUMom98f6Mn8B7sG2AKbHO6uxXTSG2SVcmVYH_gyvhUY-XrFsFiXezX7b-EMPfDJFzOg7t2qXVOW2kAystm7mtjKUn906jvhdHz0AWZkkrMBFhwMHOyzWFY0d7zJjrOurgMhhPLK5rYdL2HLjZT3J2o4ZBKahhaiQZlM2zSPrWGm4qyzKMkr0zBw7bKJVcUqEEF2s8EPLjyvYBtEm3dxmtHSp381PEen7Dld9SCK5lyeqJyU4OsuYogvN5CSOuP9SrNjZIye4T15V19UUY8DImQUU8m2Yaq0IndMn7J9mU_fnfhWek-dTDV7RU53HkQ';
const apiBaseURL = 'https://graph.microsoft.com/beta';

dotenv.config();

const config = () => {
    return {
        port: process.env.PORT? process.env.PORT : port,
        host: process.env.HOST? process.env.HOST : host,
        staticPath: process.env.STATIC_PATH? process.env.STATIC_PATH : staticPath,
        accessType: process.env.OAUTH_ACCESS_TYPE? process.env.OAUTH_ACCESS_TYPE : accessType,
        accessToken: process.env.OAUTH_ACCESS_TOKEN_USER? process.env.OAUTH_ACCESS_TOKEN_USER : accessToken,
        apiBaseURL: process.env.API_BASE_URL? process.env.API_BASE_URL : apiBaseURL
    }
}

module.exports = {
    config,
    defaults: {
        port, 
        host, 
        staticPath,
        accessType,
        accessToken,
        apiBaseURL
    }
}
