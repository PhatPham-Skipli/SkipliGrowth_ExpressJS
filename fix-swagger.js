const fs = require('fs');
const YAML = require('yamljs');
const path = require('path');

const yamlPath = path.join(__dirname, 'swagger.yaml');
const doc = YAML.load(yamlPath);

// 1. Fix server URL
if (doc.servers && doc.servers[0]) {
    doc.servers[0].url = 'http://localhost:3000/api';
}

// 2. Fix token to accessToken in signin
try {
    const signinData = doc.paths['/auth/signin'].post.responses['200'].content['application/json'].schema.properties.data.properties;
    if (signinData.token) {
        signinData.accessToken = signinData.token;
        delete signinData.token;
    }
} catch(e) {}

// 3. Add message and statusCode to all responses
for (const p in doc.paths) {
    for (const method in doc.paths[p]) {
        const operation = doc.paths[p][method];
        if (operation.responses) {
            for (const status in operation.responses) {
                const response = operation.responses[status];
                
                // Ensure content and schema exist
                if (!response.content) {
                    response.content = {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    message: { type: 'string' },
                                    statusCode: { type: 'number' },
                                    data: { type: 'object', nullable: true }
                                }
                            }
                        }
                    };
                } else if (response.content['application/json']) {
                    let schema = response.content['application/json'].schema;
                    if (!schema) {
                        schema = { type: 'object', properties: {} };
                        response.content['application/json'].schema = schema;
                    }
                    if (!schema.properties) {
                        schema.properties = {};
                    }
                    
                    const oldProps = schema.properties;
                    if (!oldProps.message) {
                        // Create the new properties order
                        const newProps = {
                            message: { type: 'string' },
                            statusCode: { type: 'number' }
                        };
                        
                        // Copy over 'data' if it exists
                        if (oldProps.data) {
                            newProps.data = oldProps.data;
                        } else {
                            newProps.data = { type: 'object', nullable: true };
                        }
                        
                        schema.properties = newProps;
                    }
                }
            }
        }
    }
}

// YAML stringify
const yamlString = YAML.stringify(doc, 10, 2);
fs.writeFileSync(yamlPath, yamlString);
console.log('Swagger updated successfully!');
