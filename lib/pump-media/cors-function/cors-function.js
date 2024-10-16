function handler(event) {
    var response = event.response;
    var request = event.request;

    // List of allowed origins
    var allowedOrigins = ['https://devnet.pump.fun', 'http://localhost:3000', 'https://localnet.pump.fun', 'https://pump.fun'];
    
    // Get the origin of the request
    var requestOrigin = request.headers['origin'] ? request.headers['origin'].value : '';
    
    if (request.method === 'OPTIONS') {
        // Handle preflight request
        response.statusCode = 200;
        response.statusDescription = 'OK';
        response.headers = response.headers || {};
        
        // Set Access-Control-Allow-Origin based on the request origin or default to 'https://localhost.pump.fun'
        if (allowedOrigins.includes(requestOrigin)) {
            response.headers['access-control-allow-origin'] = { value: requestOrigin };
        } else {
            response.headers['access-control-allow-origin'] = { value: 'https://localhost.pump.fun' };
        }
        
        response.headers['access-control-allow-methods'] = { value: 'GET, POST, OPTIONS' };
        response.headers['access-control-allow-headers'] = { value: 'Content-Type, Authorization, X-Aws-Waf-Token, X-Aws-Proxy-Token' };
        response.headers['access-control-allow-credentials'] = { value: 'true' };

        return response;
    }

    // Check if response.headers is defined before logging it
    if (!response.headers) {
        // Initialize headers if needed
        response.headers = {};
    }

    // Set Access-Control-Allow-Origin based on the request origin or default to 'https://localhost.pump.fun'
    if (allowedOrigins.includes(requestOrigin)) {
        response.headers['access-control-allow-origin'] = { value: requestOrigin };
    } else {
        response.headers['access-control-allow-origin'] = { value: 'https://localhost.pump.fun' };
    }

    response.headers['access-control-allow-methods'] = { value: 'GET, POST, OPTIONS' };
    response.headers['access-control-allow-headers'] = { value: 'Content-Type, Authorization, X-Aws-Waf-Token, X-Aws-Proxy-Token' };
    response.headers['access-control-allow-credentials'] = { value: 'true' };


     // Add cache control headers
    //  response.headers['cache-control'] = { value: 'no-store, no-cache, must-revalidate, proxy-revalidate' };
    //  response.headers['pragma'] = { value: 'no-cache' };
    //  response.headers['expires'] = { value: '0' };

    response.statusCode = 200;
    response.statusDescription = 'OK';

    return response;
}