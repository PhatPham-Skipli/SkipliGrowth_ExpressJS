const fs = require('fs');
const YAML = require('yamljs');
const path = require('path');

const schemas = {
  User: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      email: { type: 'string' },
      avatarUrl: { type: 'string' },
      githubUsername: { type: 'string' },
      createdAt: { type: 'string', format: 'date-time' }
    }
  },
  Board: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      description: { type: 'string' },
      ownerId: { type: 'string' },
      memberIds: { type: 'array', items: { type: 'string' } },
      linkedRepositories: { type: 'array', items: { type: 'string' } },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' }
    }
  },
  Card: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      boardId: { type: 'string' },
      name: { type: 'string' },
      description: { type: 'string' },
      coverColor: { type: 'string' },
      position: { type: 'number' },
      taskCount: { type: 'number' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' }
    }
  },
  Task: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      cardId: { type: 'string' },
      title: { type: 'string' },
      description: { type: 'string' },
      position: { type: 'number' },
      priority: { type: 'string', enum: ['Low', 'Medium', 'High', 'Urgent'] },
      status: { type: 'string' },
      dueDate: { type: 'string', format: 'date-time', nullable: true },
      assigneeIds: { type: 'array', items: { type: 'string' } },
      assignees: { type: 'array', items: { $ref: '#/components/schemas/TaskAssignee' } },
      githubAttachments: { type: 'array', items: { $ref: '#/components/schemas/GithubAttachment' } },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' }
    }
  },
  TaskAssignee: {
    type: 'object',
    properties: {
      userId: { type: 'string' },
      role: { type: 'string' },
      assignedAt: { type: 'string', format: 'date-time' },
      assignedBy: { type: 'string' }
    }
  },
  GithubAttachment: {
    type: 'object',
    properties: {
      attachmentId: { type: 'string' },
      type: { type: 'string', enum: ['pull_request', 'commit', 'issue'] },
      repository: { type: 'string' },
      title: { type: 'string' },
      url: { type: 'string' },
      number: { type: 'string', nullable: true },
      sha: { type: 'string', nullable: true }
    }
  }
};

const reqData = (props) => ({
  required: true,
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          data: {
            type: 'object',
            properties: props
          }
        }
      }
    }
  }
});

const reqPlain = (props) => ({
  required: true,
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: props
      }
    }
  }
});

const resWrap = (dataSchema) => ({
  '200': {
    description: 'Success',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            statusCode: { type: 'number' },
            data: dataSchema
          }
        }
      }
    }
  }
});

const resWrap201 = (dataSchema) => ({
  '201': {
    description: 'Created',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            statusCode: { type: 'number' },
            data: dataSchema
          }
        }
      }
    }
  }
});

const paths = {
  '/auth/signup': {
    post: {
      summary: 'Request sign up verification code',
      tags: ['Auth'],
      security: [],
      requestBody: reqPlain({ email: { type: 'string' } }),
      responses: resWrap201({ type: 'object', nullable: true })
    }
  },
  '/auth/signin': {
    post: {
      summary: 'Sign in user',
      tags: ['Auth'],
      security: [],
      requestBody: reqPlain({ email: { type: 'string' }, code: { type: 'string' } }),
      responses: resWrap({
        type: 'object',
        properties: {
          user: { $ref: '#/components/schemas/User' },
          accessToken: { type: 'string' }
        }
      })
    }
  },
  '/auth/github/init': {
    get: {
      summary: 'Initialize GitHub OAuth flow',
      tags: ['Auth'],
      security: [],
      responses: resWrap({ type: 'object', properties: { url: { type: 'string' } } })
    }
  },
  '/auth/github': {
    post: {
      summary: 'Handle GitHub OAuth callback',
      tags: ['Auth'],
      security: [],
      requestBody: reqPlain({ code: { type: 'string' } }),
      responses: resWrap({
        type: 'object',
        properties: {
          user: { $ref: '#/components/schemas/User' },
          accessToken: { type: 'string' }
        }
      })
    }
  },
  '/auth/github/link': {
    post: {
      summary: 'Link GitHub account to current authenticated user',
      tags: ['Auth'],
      requestBody: reqPlain({ code: { type: 'string' } }),
      responses: resWrap({ $ref: '#/components/schemas/User' })
    }
  },
  '/auth/github/unlink': {
    post: {
      summary: 'Unlink GitHub account from current authenticated user',
      tags: ['Auth'],
      responses: resWrap({ $ref: '#/components/schemas/User' })
    }
  },
  '/users/all': {
    get: {
      summary: 'Get all users',
      tags: ['Users'],
      responses: resWrap({ type: 'array', items: { $ref: '#/components/schemas/User' } })
    }
  },
  '/users/search': {
    get: {
      summary: 'Search user by email with pagination',
      tags: ['Users'],
      parameters: [
        { name: 'email', in: 'query', schema: { type: 'string' } },
        { name: 'page', in: 'query', schema: { type: 'number' } },
        { name: 'limit', in: 'query', schema: { type: 'number' } }
      ],
      responses: resWrap({
        type: 'object',
        properties: {
          items: { type: 'array', items: { $ref: '#/components/schemas/User' } },
          totalCount: { type: 'number' },
          currentPage: { type: 'number' },
          pageSize: { type: 'number' }
        }
      })
    }
  },
  '/users/add': {
    post: {
      summary: 'Add one user',
      tags: ['Users'],
      requestBody: reqPlain({ user: { $ref: '#/components/schemas/User' } }),
      responses: resWrap201({ type: 'object', nullable: true })
    }
  },
  '/users/update': {
    patch: {
      summary: 'Update one user',
      tags: ['Users'],
      requestBody: reqPlain({ user: { $ref: '#/components/schemas/User' } }),
      responses: resWrap({ type: 'object', nullable: true })
    }
  },
  '/users/delete/{id}': {
    delete: {
      summary: 'Delete one user',
      tags: ['Users'],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: resWrap({ type: 'object', nullable: true })
    }
  },
  '/boards': {
    get: {
      summary: 'Get all boards for current user',
      tags: ['Boards'],
      responses: resWrap({ type: 'array', items: { $ref: '#/components/schemas/Board' } })
    },
    post: {
      summary: 'Create a new board',
      tags: ['Boards'],
      requestBody: reqData({
        name: { type: 'string' },
        description: { type: 'string' }
      }),
      responses: resWrap201({ $ref: '#/components/schemas/Board' })
    }
  },
  '/boards/{boardId}': {
    get: {
      summary: 'Get board details',
      tags: ['Boards'],
      parameters: [{ name: 'boardId', in: 'path', required: true, schema: { type: 'string' } }],
      responses: resWrap({ $ref: '#/components/schemas/Board' })
    },
    put: {
      summary: 'Update a board',
      tags: ['Boards'],
      parameters: [{ name: 'boardId', in: 'path', required: true, schema: { type: 'string' } }],
      requestBody: reqData({
        name: { type: 'string' },
        description: { type: 'string' }
      }),
      responses: resWrap({ $ref: '#/components/schemas/Board' })
    },
    delete: {
      summary: 'Delete a board',
      tags: ['Boards'],
      parameters: [{ name: 'boardId', in: 'path', required: true, schema: { type: 'string' } }],
      responses: resWrap({ type: 'string', description: 'boardId' })
    }
  },
  '/boards/{boardId}/invite': {
    post: {
      summary: 'Invite a user to the board',
      tags: ['Boards'],
      parameters: [{ name: 'boardId', in: 'path', required: true, schema: { type: 'string' } }],
      requestBody: reqPlain({ email: { type: 'string' } }), // in BoardInvitationRoutes, wait I should use reqPlain or reqData? Let's assume reqPlain unless I see BoardInvitationRoutes. Wait, I'll check it later.
      responses: resWrap201({ type: 'object', properties: { id: { type: 'string' } } })
    }
  },
  '/boards/{boardId}/invite/{inviteId}/accept': {
    post: {
      summary: 'Accept a board invitation',
      tags: ['Boards'],
      parameters: [
        { name: 'boardId', in: 'path', required: true, schema: { type: 'string' } },
        { name: 'inviteId', in: 'path', required: true, schema: { type: 'string' } }
      ],
      responses: resWrap({ type: 'object', properties: { id: { type: 'string' } } })
    }
  },
  '/boards/{boardId}/leave': {
    post: {
      summary: 'Leave a board',
      tags: ['Boards'],
      parameters: [{ name: 'boardId', in: 'path', required: true, schema: { type: 'string' } }],
      responses: resWrap({ type: 'string', description: 'boardId' })
    }
  },
  '/boards/{boardId}/members': {
    get: {
      summary: 'Get all members of a board',
      tags: ['Boards'],
      parameters: [{ name: 'boardId', in: 'path', required: true, schema: { type: 'string' } }],
      responses: resWrap({
        type: 'object',
        properties: {
          board: { $ref: '#/components/schemas/Board' },
          users: { type: 'array', items: { $ref: '#/components/schemas/User' } }
        }
      })
    }
  },
  '/boards/{boardId}/members/{memberId}': {
    delete: {
      summary: 'Kick member from board',
      tags: ['Boards'],
      parameters: [
        { name: 'boardId', in: 'path', required: true, schema: { type: 'string' } },
        { name: 'memberId', in: 'path', required: true, schema: { type: 'string' } }
      ],
      responses: resWrap({ type: 'string', description: 'boardId' })
    }
  },
  '/boards/{boardId}/github/link': {
    post: {
      summary: 'Link GitHub repo',
      tags: ['Boards'],
      parameters: [{ name: 'boardId', in: 'path', required: true, schema: { type: 'string' } }],
      requestBody: reqData({ repoId: { type: 'string' } }),
      responses: resWrap({ $ref: '#/components/schemas/Board' })
    }
  },
  '/boards/{boardId}/github/unlink': {
    delete: {
      summary: 'Unlink GitHub repo',
      tags: ['Boards'],
      parameters: [{ name: 'boardId', in: 'path', required: true, schema: { type: 'string' } }],
      responses: resWrap({ $ref: '#/components/schemas/Board' })
    }
  },
  '/{boardId}/cards': {
    get: {
      summary: 'Get all cards for a board',
      tags: ['Cards'],
      parameters: [{ name: 'boardId', in: 'path', required: true, schema: { type: 'string' } }],
      responses: resWrap({
        type: 'object',
        properties: {
          board: { $ref: '#/components/schemas/Board' },
          cards: { type: 'array', items: { $ref: '#/components/schemas/Card' } }
        }
      })
    },
    post: {
      summary: 'Create a new card',
      tags: ['Cards'],
      parameters: [{ name: 'boardId', in: 'path', required: true, schema: { type: 'string' } }],
      requestBody: reqData({
        name: { type: 'string' },
        description: { type: 'string' },
        coverColor: { type: 'string' },
        taskCount: { type: 'number' },
        createdAt: { type: 'string', format: 'date-time' }
      }),
      responses: resWrap201({
        allOf: [
          { $ref: '#/components/schemas/Card' },
          { type: 'object', properties: { board: { $ref: '#/components/schemas/Board' } } }
        ]
      })
    }
  },
  '/{boardId}/cards/reorder': {
    put: {
      summary: 'Reorder cards',
      tags: ['Cards'],
      parameters: [{ name: 'boardId', in: 'path', required: true, schema: { type: 'string' } }],
      requestBody: reqData({
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: { id: { type: 'string' }, position: { type: 'number' } }
          }
        }
      }),
      responses: resWrap({
        type: 'object',
        properties: {
          board: { $ref: '#/components/schemas/Board' },
          cards: { type: 'array', items: { $ref: '#/components/schemas/Card' } }
        }
      })
    }
  },
  '/{boardId}/cards/{cardId}': {
    put: {
      summary: 'Update a card',
      tags: ['Cards'],
      parameters: [
        { name: 'boardId', in: 'path', required: true, schema: { type: 'string' } },
        { name: 'cardId', in: 'path', required: true, schema: { type: 'string' } }
      ],
      requestBody: reqData({
        name: { type: 'string' },
        description: { type: 'string' },
        coverColor: { type: 'string' }
      }),
      responses: resWrap({
        allOf: [
          { $ref: '#/components/schemas/Card' },
          { type: 'object', properties: { board: { $ref: '#/components/schemas/Board' } } }
        ]
      })
    },
    delete: {
      summary: 'Delete a card',
      tags: ['Cards'],
      parameters: [
        { name: 'boardId', in: 'path', required: true, schema: { type: 'string' } },
        { name: 'cardId', in: 'path', required: true, schema: { type: 'string' } }
      ],
      responses: resWrap({ type: 'string' })
    }
  },
  '/{cardId}/tasks': {
    get: {
      summary: 'Get all tasks for a card',
      tags: ['Tasks'],
      parameters: [{ name: 'cardId', in: 'path', required: true, schema: { type: 'string' } }],
      responses: resWrap({
        type: 'object',
        properties: {
          card: { $ref: '#/components/schemas/Card' },
          tasks: { type: 'array', items: { $ref: '#/components/schemas/Task' } }
        }
      })
    },
    post: {
      summary: 'Create a task',
      tags: ['Tasks'],
      parameters: [{ name: 'cardId', in: 'path', required: true, schema: { type: 'string' } }],
      requestBody: reqData({
        title: { type: 'string' },
        description: { type: 'string' },
        priority: { type: 'string', enum: ['Low', 'Medium', 'High', 'Urgent'] },
        status: { type: 'string' },
        dueDate: { type: 'string', format: 'date-time' },
        assigneeIds: { type: 'array', items: { type: 'string' } }
      }),
      responses: resWrap201({
        allOf: [
          { $ref: '#/components/schemas/Task' },
          { type: 'object', properties: { card: { $ref: '#/components/schemas/Card' } } }
        ]
      })
    }
  },
  '/{cardId}/tasks/reorder': {
    put: {
      summary: 'Reorder tasks',
      tags: ['Tasks'],
      parameters: [{ name: 'cardId', in: 'path', required: true, schema: { type: 'string' } }],
      requestBody: reqData({
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: { id: { type: 'string' }, position: { type: 'number' } }
          }
        }
      }),
      responses: resWrap({
        type: 'object',
        properties: {
          card: { $ref: '#/components/schemas/Card' },
          tasks: { type: 'array', items: { $ref: '#/components/schemas/Task' } }
        }
      })
    }
  },
  '/{cardId}/tasks/{taskId}': {
    put: {
      summary: 'Update a task',
      tags: ['Tasks'],
      parameters: [
        { name: 'cardId', in: 'path', required: true, schema: { type: 'string' } },
        { name: 'taskId', in: 'path', required: true, schema: { type: 'string' } }
      ],
      requestBody: reqData({
        title: { type: 'string' },
        description: { type: 'string' },
        priority: { type: 'string', enum: ['Low', 'Medium', 'High', 'Urgent'] },
        status: { type: 'string' },
        dueDate: { type: 'string', format: 'date-time' },
        assigneeIds: { type: 'array', items: { type: 'string' } }
      }),
      responses: resWrap({
        allOf: [
          { $ref: '#/components/schemas/Task' },
          { type: 'object', properties: { card: { $ref: '#/components/schemas/Card' } } }
        ]
      })
    },
    delete: {
      summary: 'Delete a task',
      tags: ['Tasks'],
      parameters: [
        { name: 'cardId', in: 'path', required: true, schema: { type: 'string' } },
        { name: 'taskId', in: 'path', required: true, schema: { type: 'string' } }
      ],
      responses: resWrap({ type: 'string' })
    }
  },
  '/{cardId}/tasks/{taskId}/assign': {
    get: {
      summary: 'Retrieve assignees of a task',
      tags: ['Tasks'],
      parameters: [
        { name: 'cardId', in: 'path', required: true, schema: { type: 'string' } },
        { name: 'taskId', in: 'path', required: true, schema: { type: 'string' } }
      ],
      responses: resWrap({ type: 'array', items: { $ref: '#/components/schemas/TaskAssignee' } })
    },
    post: {
      summary: 'Assign a member to a task',
      tags: ['Tasks'],
      parameters: [
        { name: 'cardId', in: 'path', required: true, schema: { type: 'string' } },
        { name: 'taskId', in: 'path', required: true, schema: { type: 'string' } }
      ],
      requestBody: reqData({ userId: { type: 'string' } }),
      responses: resWrap201({
        allOf: [
          { $ref: '#/components/schemas/Task' },
          { type: 'object', properties: { card: { $ref: '#/components/schemas/Card' } } }
        ]
      })
    }
  },
  '/{cardId}/tasks/{taskId}/assign/{memberId}': {
    delete: {
      summary: 'Remove assigned member from a task',
      tags: ['Tasks'],
      parameters: [
        { name: 'cardId', in: 'path', required: true, schema: { type: 'string' } },
        { name: 'taskId', in: 'path', required: true, schema: { type: 'string' } },
        { name: 'memberId', in: 'path', required: true, schema: { type: 'string' } }
      ],
      responses: resWrap({ type: 'object', properties: { taskId: { type: 'string' }, memberId: { type: 'string' } } })
    }
  },
  '/{cardId}/tasks/{taskId}/github-attach': {
    post: {
      summary: 'Attach a GitHub item to a task',
      tags: ['Tasks'],
      parameters: [
        { name: 'cardId', in: 'path', required: true, schema: { type: 'string' } },
        { name: 'taskId', in: 'path', required: true, schema: { type: 'string' } }
      ],
      requestBody: reqData({
        type: { type: 'string', enum: ['pull_request', 'commit', 'issue'] },
        repository: { type: 'string' },
        number: { type: 'string', nullable: true },
        sha: { type: 'string', nullable: true }
      }),
      responses: resWrap({
        allOf: [
          { $ref: '#/components/schemas/Task' },
          { type: 'object', properties: { card: { $ref: '#/components/schemas/Card' } } }
        ]
      })
    }
  },
  '/{cardId}/tasks/{taskId}/github-attachments': {
    get: {
      summary: 'Retrieve GitHub attachments of a task',
      tags: ['Tasks'],
      parameters: [
        { name: 'cardId', in: 'path', required: true, schema: { type: 'string' } },
        { name: 'taskId', in: 'path', required: true, schema: { type: 'string' } }
      ],
      responses: resWrap({ type: 'array', items: { $ref: '#/components/schemas/GithubAttachment' } })
    }
  },
  '/{cardId}/tasks/{taskId}/github-attachments/{attachmentId}': {
    delete: {
      summary: 'Remove GitHub attachment from a task',
      tags: ['Tasks'],
      parameters: [
        { name: 'cardId', in: 'path', required: true, schema: { type: 'string' } },
        { name: 'taskId', in: 'path', required: true, schema: { type: 'string' } },
        { name: 'attachmentId', in: 'path', required: true, schema: { type: 'string' } }
      ],
      responses: resWrap({ type: 'object', properties: { attachmentId: { type: 'string' } } })
    }
  },
  '/repositories': {
    get: {
      summary: 'Retrieve all GitHub repositories accessible to user',
      tags: ['Repositories'],
      responses: resWrap({ type: 'array', items: { type: 'object' } })
    }
  },
  '/repositories/{repositoryId}/github-info': {
    get: {
      summary: 'Retrieve details of a specific GitHub repository',
      tags: ['Repositories'],
      parameters: [{ name: 'repositoryId', in: 'path', required: true, schema: { type: 'string' } }],
      responses: resWrap({ type: 'object' })
    }
  }
};

const doc = {
  openapi: '3.0.0',
  info: {
    title: 'Mini Trello API',
    description: 'API documentation for Mini Trello backend.',
    version: '1.0.0'
  },
  servers: [{ url: 'http://localhost:3000/api', description: 'Development server' }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: schemas
  },
  security: [{ bearerAuth: [] }],
  paths: paths
};

const yamlString = YAML.stringify(doc, 10, 2);
fs.writeFileSync(path.join(__dirname, 'swagger.yaml'), yamlString);
console.log('Swagger perfectly regenerated!');
