/*
 * Copyright Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const express = require('express');

const app = express();
app.disable('x-powered-by');

const port = 12345;
app.use(express.json());

const logRequest = req => {
  // eslint-disable-next-line no-console
  console.log('request: ', {
    originalUrl: req.originalUrl,
    method: req.method,
    headers: req.headers,
    body: req.body,
  });
};

app.get('/', (req, res) => {
  res.send('Hello World from Orchestrator HTTP test server!');
});

app.get('/chunk01', (req, res) => {
  logRequest(req);

  const testHeader = req.headers['test-header'];

  const chunk01 = {
    placeholderOne: {
      type: 'string',
      title: `This is input box for the placeholderOne supplied by chunk01 with HTTP test-header "${testHeader}"`,
    },
  };

  res.send(JSON.stringify(chunk01));
});

app.post('/chunk02', (req, res) => {
  logRequest(req);

  const nextField = req.body?.nextField;

  let chunk02 = {
    addressOrPassword: {
      type: 'string',
      'ui:widget': 'hidden',
    },
    placeholderThree: {
      type: 'string',
      'ui:widget': 'hidden',
    },
  };

  if (nextField === 'password') {
    chunk02 = {
      addressOrPassword: {
        type: 'string',
        title: `Let's use password input-field then.`,
        'ui:widget': 'password',
      },
      placeholderThree: {
        type: 'string',
        'ui:widget': 'hidden',
      },
    };
  }

  if (nextField === 'complex') {
    chunk02 = {
      placeholderThree: {
        type: 'object',
        title: `Let's use a complex set of new widgets then.`,
        properties: {
          name: {
            type: 'string',
            title: 'Name',
          },
          surname: {
            type: 'string',
            title: 'Surname',
          },
          myradio: {
            type: 'boolean',
            title: 'A radio button',
            oneOf: [
              { const: true, title: 'Custom label for true' },
              { const: false, title: 'Custom label for false' },
            ],
            'ui:widget': 'radio',
          },
        },
      },
      addressOrPassword: {
        type: 'string',
        title: 'Address via placeholder "addressOrPassword"',
      },
    };
  }

  res.send(JSON.stringify(chunk02));
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.info(
    `Simple HTTP server for orchestrator-form-widgets development only. Listening on ${port} port.`,
  );
});
