import { loadExternalScriptStub } from 'test/mocks/adloaderStub.js';
import * as utils from '../../../src/utils.js';
import * as hook from '../../../src/hook.js';

import { __TEST__ } from '../../../modules/humansecurityRtdProvider.js';

const {
  SUBMODULE_NAME,
  SCRIPT_URL,
  updateEnrichmentData,
  onGetBidRequestData,
  readConfig,
  injectHumanSecurityScript,
  registerHumanMediaGuardSubmodule
} = __TEST__;

describe('humansecurity RTD module', function () {
  let sandbox;
  let ortb2Stub;

  const win = Object.create({}, {
    hostname: { value: 'example.com' }
  });
  const reqBidsConfig = {
    ortb2Fragments: {
      bidder: {},
      global: {}
    }
  };

  beforeEach(function() {
    sandbox = sinon.sandbox.create();
    sandbox.stub(utils, 'getWindowLocation').returns(win);
    sandbox.stub(utils, 'getWindowSelf').returns(win);
    sandbox.stub(utils, 'generateUUID').returns('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee');

    ortb2Stub = sandbox.stub(reqBidsConfig, 'ortb2Fragments').value({bidder: {}, global: {}});
  });
  afterEach(function() {
    sandbox.restore();
  });

  describe('Module initialization step', function () {
    it('should accept valid configurations', function () {
      expect(() => readConfig({})).to.not.throw();
      expect(() => readConfig({ params: {} })).to.not.throw();
      expect(() => readConfig({ params: { bidders: ['bidderCode'] } })).to.not.throw();
      expect(() => readConfig({ params: { customerId: 'ABC123' } })).to.not.throw();
    });

    it('should throw an Error on invalid configuration', function () {
      expect(() => readConfig({ params: { bidders: 'There should be an array, not a string' } })).to.throw();
      expect(() => readConfig({ params: { bidders: [] } })).to.throw();
      expect(() => readConfig({ params: { customerId: 123 } })).to.throw();
    });

    it('should insert external script element', () => {
      injectHumanSecurityScript({ });

      expect(loadExternalScriptStub.calledOnce).to.be.true;

      const args = loadExternalScriptStub.getCall(0).args;
      expect(args[0]).to.be.equal(`${SCRIPT_URL}?h=example.com`);
      expect(args[1]).to.be.equal(SUBMODULE_NAME);
      expect(args[2]).to.be.a('function');
      expect(args[3]).to.be.equal(null);
      expect(args[4]).to.be.deep.equal({ 'data-sid': 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' });
    });

    it('should insert external script element with "customerId" info from config', () => {
      injectHumanSecurityScript({ params: { customerId: 'ABC123' } });

      expect(loadExternalScriptStub.calledOnce).to.be.true;

      const args = loadExternalScriptStub.getCall(0).args;
      expect(args[0]).to.be.equal(`${SCRIPT_URL}?h=example.com&c=ABC123`);
    });
  });

  describe('Bid enrichment step', function () {
    const fragmentToCompare = { info: 'bot+' };
    let callbackSpy;
    beforeEach(function () {
      callbackSpy = sandbox.spy();
    });

    it('should add the default ext.hmns to global ortb2 when incorrect enrichment data comes from an external script', () => {
      updateEnrichmentData({ hmns: 'bot', foo: 'bar' });
      onGetBidRequestData(reqBidsConfig, callbackSpy, { params: {} }, {});

      expect(reqBidsConfig.ortb2Fragments.global).to.have.property('ext');
      expect(reqBidsConfig.ortb2Fragments.global.ext).to.have.own.property('hmns').which.is.an('object').that.deep.equals({});
      expect(reqBidsConfig.ortb2Fragments.global.ext).to.not.have.property('foo');
    });

    it('should add ext.hmns to global ortb2 when the bidders array is omitted in the configuration', () => {
      updateEnrichmentData({ hmns: { info: 'bot+' } });
      onGetBidRequestData(reqBidsConfig, callbackSpy, { params: {} }, {});

      expect(reqBidsConfig.ortb2Fragments.global).to.have.property('ext');
      expect(reqBidsConfig.ortb2Fragments.global.ext).to.have.property('hmns');
      expect(reqBidsConfig.ortb2Fragments.global.ext.hmns).to.be.deep.equal(fragmentToCompare);

      expect(reqBidsConfig.ortb2Fragments.bidder).to.be.deep.equal({});
      expect(callbackSpy.calledOnce).to.be.true;
    });

    it('should add ext.hmns to global ortb2 when the bidders array is included in the configuration', () => {
      updateEnrichmentData({ hmns: { info: 'bot+' } });
      onGetBidRequestData(reqBidsConfig, callbackSpy, { params: { bidders: ['bidderCode'] } }, {});

      const bidderCodeOrtb2Fragment = reqBidsConfig.ortb2Fragments.bidder['bidderCode'];
      expect(bidderCodeOrtb2Fragment).to.not.be.undefined;
      expect(bidderCodeOrtb2Fragment).to.have.property('ext');
      expect(bidderCodeOrtb2Fragment.ext).to.have.property('hmns');
      expect(bidderCodeOrtb2Fragment.ext.hmns).to.be.deep.equal(fragmentToCompare);

      expect(reqBidsConfig.ortb2Fragments.global).to.be.deep.equal({});
      expect(callbackSpy.calledOnce).to.be.true;
    });
  });

  describe('Sumbodule execution', function() {
    let submoduleStub;
    beforeEach(function () {
      submoduleStub = sandbox.stub(hook, 'submodule');
    });

    function getModule() {
      registerHumanMediaGuardSubmodule();

      expect(submoduleStub.calledOnceWith('realTimeData')).to.equal(true);

      const registeredSubmoduleDefinition = submoduleStub.getCall(0).args[1];
      expect(registeredSubmoduleDefinition).to.be.an('object');
      expect(registeredSubmoduleDefinition).to.have.own.property('name', SUBMODULE_NAME);
      expect(registeredSubmoduleDefinition).to.have.own.property('init').that.is.a('function');
      expect(registeredSubmoduleDefinition).to.have.own.property('getBidRequestData').that.is.a('function');

      return registeredSubmoduleDefinition;
    }

    it('should register humansecurity RTD submodule provider', function () {
      getModule();
    });

    it('should refuse initialization on invalid bidders configuration', function () {
      const { init } = getModule();
      expect(init({ params: { bidders: [] }})).to.equal(false);
      expect(loadExternalScriptStub.notCalled).to.be.true;
    });

    it('should refuse initialization on invalid customer id configuration', function () {
      const { init } = getModule();
      expect(init({ params: { customerId: 123 }})).to.equal(false);
      expect(loadExternalScriptStub.notCalled).to.be.true;
    });
  });
});
