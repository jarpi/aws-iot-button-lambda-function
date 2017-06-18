const http = require('http');
const reqOptions = { 
  hostname: process.env.host,
  port: process.env.port,
  headers: {}
};
const clientId = process.env.client_id;
const clientSecret = process.env.client_secret;
const username = process.env.username;
const userPwd = process.env.password;
const alertText = process.env.message;

exports.handler =  (event, context, callback) => {
    console.dir(event);
    return getCredentials()
    .then((clientCredentials) => {
        console.dir(clientCredentials);
        return getToken(clientCredentials);
    })  
    .then((token) => {
        return publishAlert(token);
    })  
    .then((statusResult) => {
            console.dir(statusResult);
            return;
    })  
    .then(() => {
        return callback(null, "Success!");
    })  
        .catch((err) => {
            console.dir('Error catch');
            console.dir(err);
        });
};

const doRequest = (options, body) =>  {
    return new Promise((resolve, reject)=>{
      const req = http.request(options, (response) => {
          var str = '';
          response.on('data', (chunk) => {
            str += chunk;
          });
          response.on('end', () => {
            return resolve(JSON.parse(str));
          });
      });
      req.end(body, 'utf8', ()=>{console.log('req ended')});
    });
};

const getCredentials = () => {
    if (clientId && clientSecret) return Promise.resolve({client_id: clientId, client_secret: clientSecret});
    reqOptions.headers['Accept'] = 'application/json';
    reqOptions.headers['Content-Type'] = 'application/json';
    reqOptions.method = 'POST';
    reqOptions.path = '/api/v1/apps';
    const body = JSON.stringify({
        client_name:"Test",
        redirect_uris:"urn:ietf:wg:oauth:2.0:oob",
        scopes:"read write follow"});
    return doRequest(reqOptions, body);
};

const getToken = (clientCredentials) => {
    reqOptions.headers['Accept'] = 'application/json';
    reqOptions.headers['Content-Type'] = 'application/json';
    reqOptions.method = 'POST';
    reqOptions.path = '/oauth/token';
    const body = JSON.stringify({
        client_id: clientCredentials.client_id,
        client_secret: clientCredentials.client_secret,
        grant_type: 'password',
        username: username,
        password: userPwd,
        scope: 'write'
    });
    return doRequest(reqOptions, body);
};

const publishAlert = (token) => {
    reqOptions.headers['Accept'] = 'application/json';
    reqOptions.headers['Content-Type'] = 'application/json';
    reqOptions.headers['Authorization'] = 'Bearer ' + token.access_token;
    reqOptions.method = 'POST';
    reqOptions.path = '/api/v1/statuses';
    const body = JSON.stringify({
        status: alertText
    });
    return doRequest(reqOptions, body);
};

