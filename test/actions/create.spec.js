/* eslint-disable no-unused-expressions */
import { expect } from 'chai';
import nock from 'nock';
import { RSAA, apiMiddleware } from 'redux-api-middleware';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import {
  CREATE_REQUEST,
  CREATE_SUCCESS,
  CREATE_ERROR,
  OBJECT_CREATED,
  REFERENCE_STATUS,
  apiStateMiddleware,
  JSON_API_SOURCE,
} from '../../src';
import {
  validationStatus,
  busyStatus,
} from '../../src/status';
import  { create } from '../../src/actions/create';

describe('Create action creator', () => {
  const middlewares = [thunk, apiMiddleware, apiStateMiddleware];
  let mockStore = configureMockStore(middlewares);

  beforeEach(() => {
    nock.cleanAll();
    mockStore = configureMockStore(middlewares);
  });

  it('creates a valid action', () => {
    const config = {
      headers: {
        'Content-Type': 'application/vnd.api+json',
      },
      endpoint: 'api.test',
    };

    const schema = 'schema_test';
    const item = {
      schema,
      id: '1',
      attributes: {
        name: 'Test1',
      },
    };
    const action = create(config, schema, item);

    expect(action[RSAA]).to.not.be.undefined;
    expect(action[RSAA].method).to.equal('POST');
    expect(action[RSAA].endpoint).to.equal(config.endpoint);
    expect(action[RSAA].headers).to.equal(config.headers);
    const expectedBody = JSON.stringify({
      data: item,
    });
    expect(action[RSAA].body).to.equal(expectedBody);
    expect(action[RSAA].types).to.not.be.undefined;

    const types = action[RSAA].types;
    const expectedMeta = {
      source: JSON_API_SOURCE,
      schema,
      timestamp: types[0].meta.timestamp,
    };
    expect(types[0].type).to.equal(CREATE_REQUEST);
    expect(types[0].meta).to.deep.equal(expectedMeta);
    expect(types[1].type).to.equal(CREATE_SUCCESS);
    expect(types[1].meta).to.deep.equal(expectedMeta);
    expect(types[2].type).to.equal(CREATE_ERROR);
    expect(types[2].meta).to.deep.equal(expectedMeta);
  });

  it('creates a valid action with item in config', () => {
    const schema = 'schema_test';
    const item = {
      schema,
      id: '1',
      attributes: {
        name: 'Test1',
      },
    };
    const config = {
      headers: {
        'Content-Type': 'application/vnd.api+json',
      },
      endpoint: 'api.test',
      body: item,
    };
    const action = create(config, schema);

    expect(action[RSAA]).to.not.be.undefined;
    expect(action[RSAA].method).to.equal('POST');
    expect(action[RSAA].endpoint).to.equal(config.endpoint);
    expect(action[RSAA].headers).to.equal(config.headers);
    expect(action[RSAA].body).to.equal(item);
    expect(action[RSAA].types).to.not.be.undefined;

    const types = action[RSAA].types;
    const expectedMeta = {
      source: JSON_API_SOURCE,
      schema,
      timestamp: types[0].meta.timestamp,
    };

    expect(types[0].type).to.equal(CREATE_REQUEST);
    expect(types[0].meta).to.deep.equal(expectedMeta);
    expect(types[1].type).to.equal(CREATE_SUCCESS);
    expect(types[1].meta).to.deep.equal(expectedMeta);
  });

  it('creates a valid action with item in argument has priority over item in config.body', () => {
    const schema = 'schema_test';
    const item = {
      schema,
      id: '1',
      attributes: {
        name: 'Test1',
      },
    };
    const config = {
      headers: {
        'Content-Type': 'application/vnd.api+json',
      },
      endpoint: 'api.test',
      body: item,
    };

    const action = create(config, schema, item);

    expect(action[RSAA]).to.not.be.undefined;
    expect(action[RSAA].method).to.equal('POST');
    expect(action[RSAA].endpoint).to.equal(config.endpoint);
    expect(action[RSAA].headers).to.equal(config.headers);
    expect(action[RSAA].body).to.equal(JSON.stringify({ data: item }));
    expect(action[RSAA].types).to.not.be.undefined;

    const types = action[RSAA].types;
    const expectedMeta = {
      source: JSON_API_SOURCE,
      schema,
      timestamp: types[0].meta.timestamp,
    };

    expect(types[0].type).to.equal(CREATE_REQUEST);
    expect(types[0].meta).to.deep.equal(expectedMeta);
    expect(types[1].type).to.equal(CREATE_SUCCESS);
    expect(types[1].meta).to.deep.equal(expectedMeta);
  });

  it('throws exception on action with undefined config', () => {
    const config = undefined;

    const schema = 'schema_test';
    const item = {
      schema,
      id: '1',
      attributes: {
        name: 'Test1',
      },
    };
    expect(() => create(config, schema, item)).to.throw('Config isn\'t an object.');
  });

  it('throws exception on action with invalid schema', () => {
    const config = {
      headers: {
        'Content-Type': 'application/vnd.api+json',
      },
      endpoint: 'api.test',
    };

    const schema = '';
    const item = {
      schema,
      id: '1',
      attributes: {
        name: 'Test1',
      },
    };
    expect(() => create(config, schema, item)).to.throw('Empty schema string.');
  });

  it('throws exception on action with invalid item', () => {
    const config = {
      headers: {
        'Content-Type': 'application/vnd.api+json',
      },
      endpoint: 'api.test',
    };

    const schema = 'app.builder';
    const item = 2;
    expect(() => create(config, schema, item))
      .to.throw('Item is not valid in method argument');
  });

  it('does not throw exception on action with missing item', () => {
    const config = {
      headers: {
        'Content-Type': 'application/vnd.api+json',
      },
      endpoint: 'api.test',
    };

    const schema = 'app.builder';
    expect(() => create(config, schema))
      .to.not.throw('Item is missing in method argument and in config.body');
  });

  it('produces valid storage and collection actions', done => {
    const schema = 'schema_test';
    const expectedPayload = {
      data: {
        schema,
        id: '1',
        type: schema,
        attributes: {
          name: 'Test1',
        },
      },
    };
    const expectedMeta = {
      source: JSON_API_SOURCE,
      schema,
    };

    const item = {
      schema,
      attributes: {
        name: 'Test1',
      },
    };
    nock('http://api.server.local')
      .post('/apps')
      .reply(200, expectedPayload, { 'Content-Type': 'vnd.api+json' });

    const config = {
      headers: {
        'Content-Type': 'application/vnd.api+json',
      },
      endpoint: 'http://api.server.local/apps',
    };

    const action = create(config, schema, item);
    const store = mockStore({});
    store.dispatch(action)
      .then(() => {
        const performedActions = store.getActions();
        expect(performedActions).to.have.length(4);

        const batchedActionsRequest = performedActions[0].payload;

        const actionCollStatusBusy = batchedActionsRequest[0];
        expect(actionCollStatusBusy.type).to.equal(REFERENCE_STATUS);
        expect(actionCollStatusBusy.meta).to.deep.equal({
          ...expectedMeta,
          tag: '*',
          timestamp: actionCollStatusBusy.meta.timestamp,
        });
        const expectedCollStatusBusyPayload = {
          busyStatus: busyStatus.BUSY,
          validationStatus: validationStatus.INVALID,
        };
        expect(actionCollStatusBusy.payload).to.deep.equal(expectedCollStatusBusyPayload);

        expect(performedActions[1].type).to.equal(CREATE_REQUEST);

        const batchedActionsSuccess = performedActions[2].payload;

        const actionObjCreated = batchedActionsSuccess[0];
        expect(actionObjCreated.type).to.equal(OBJECT_CREATED);
        expect(actionObjCreated.meta).to.deep.equal({
          ...expectedMeta,
          transformation: {},
          timestamp: actionObjCreated.meta.timestamp,
        });
        expect(actionObjCreated.payload).to.deep.equal(expectedPayload.data);

        const actionCollStatus = batchedActionsSuccess[1];
        expect(actionCollStatus.type).to.equal(REFERENCE_STATUS);
        expect(actionCollStatus.meta).to.deep.equal({
          ...expectedMeta,
          tag: '*',
          timestamp: actionCollStatus.meta.timestamp,
        });
        const expectedCollStatusPayload = {
          validationStatus: validationStatus.INVALID,
          busyStatus: busyStatus.IDLE,
        };
        expect(actionCollStatus.payload).to.deep.equal(expectedCollStatusPayload);

        const successAction = performedActions[3];
        expect(successAction.type).to.equal(CREATE_SUCCESS);
        expect(successAction.meta).to.deep.equal({
          ...expectedMeta,
          timestamp: successAction.meta.timestamp,
        });
        expect(successAction.payload).to.deep.equal(expectedPayload);
      }).then(done).catch(done);
  });
});

