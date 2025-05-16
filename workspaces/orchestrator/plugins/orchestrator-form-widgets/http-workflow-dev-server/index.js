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
    query: req.query,
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

app.get('/activeTextWhisperer', (req, res) => {
  logRequest(req);

  const mydata = req.query.mydata;

  const autocomplete = ['my option one', 'my option two', 'Jack', 'Joe'];
  if (mydata && mydata !== '___undefined___') {
    autocomplete.push(mydata);
  }

  const result = {
    myresult: { foo: { default: 'This is dynamically fetched default value' } },
    bar: { something: { myautocompleteoptions: autocomplete } },
  };

  res.send(JSON.stringify(result));
});

app.get('/activeTexts', (req, res) => {
  logRequest(req);
  res.send(
    JSON.stringify({
      example: {
        text0: 'Text 0',
        text1: 'Text 1',
      },
    }),
  );
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.info(
    `Simple HTTP server for orchestrator-form-widgets development only. Listening on ${port} port.`,
  );
});

app.post('/validate', (req, res) => {
  logRequest(req);

  const field = req.body?.field;
  const value = req.body?.value;
  const moreDataForMyValidator = req.body?.moreDataForMyValidator;

  if (
    field === 'mySimpleActiveText' &&
    moreDataForMyValidator !== 'ignoreerror'
  ) {
    if (!value || value.length < 5) {
      res.status(422);
      res.send({
        [field]: ['The field must be 5 or more characters long.'],
      });

      return;
    }
  }

  res.status(200);
  res.send('Valid');
});
