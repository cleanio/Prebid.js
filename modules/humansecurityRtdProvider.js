/**
 * This module adds humansecurity provider to the real time data module
 *
 * The {@link module:modules/realTimeData} module is required
 * The module will inject the Human Security script into the context where Prebid.js is initialized, enriching bid requests with specific data to provide advanced protection against ad fraud and spoofing.
 * @module modules/humansecurityRtdProvider
 * @requires module:modules/realTimeData
 */

import { submodule } from '../src/hook.js';
import {
  logError,
  mergeDeep,
  generateUUID,
  getWindowSelf,
  getWindowLocation
} from '../src/utils';
import { getGlobal } from '../src/prebidGlobal';
import { loadExternalScript } from '../src/adloader.js';

/**
 * @typedef {import('../modules/rtdModule/index.js').RtdSubmodule} RtdSubmodule
 * @typedef {import('../modules/rtdModule/index.js').SubmoduleConfig} SubmoduleConfig
 * @typedef {import('../modules/rtdModule/index.js').UserConsentData} UserConsentData
 */

const SUBMODULE_NAME = 'humansecurity';
const SCRIPT_URL = 'https://sonar.script.ac/prebid/rtd.js';
const LOG_PREFIX = `[${SUBMODULE_NAME} RTD Submodule]:`;

let enrichmentData = { hmns: { } };
/**
 * The function is used to update the 'enrichmentData' variable with the enrichment data from the injected script.
 * @param {Object} data
 */
function updateEnrichmentData(data) {
  if (!data.hmns || typeof data.hmns !== 'object')
    return;

  enrichmentData = mergeDeep({}, { hmns: data.hmns });
}

/**
 * The function to be called upon module init.
 * Injects the Human Security script into the page to provide ad fraud protection.
 * @param {SubmoduleConfig} config
 */
function injectHumanSecurityScript(config) {
  const sid = generateUUID();
  const customerId = config?.params?.customerId;

  const scriptOnloadHandler = function () {
    const api = `${sid}_a`;
    const wnd = getWindowSelf();
    if (typeof wnd[api] === 'object' && typeof wnd[api].run === 'function')
      wnd[api].run({ dependencyRef: getGlobal() }, updateEnrichmentData);
  };
  const scriptUrl = `${SCRIPT_URL}?h=${getWindowLocation().hostname}${customerId ? `&c=${customerId}` : ''}`;
  const scriptAttributes = { 'data-sid': sid };

  loadExternalScript(scriptUrl, SUBMODULE_NAME, scriptOnloadHandler, null, scriptAttributes);
}

/**
 * The function to be called upon module init.
 * If config parameters are passed, the function validates them and throws an error if they are incorrectly provided.
 * @param {SubmoduleConfig} config
 */
function readConfig(config) {
  if (!config.params)
    return;

  if (config.params.customerId && typeof config.params.customerId !== 'string') {
    throw new Error(`${LOG_PREFIX} If specified, the 'customerId' parameter in the module configuration must be a string.`);
  }

  if (config.params.bidders) {
    if (!Array.isArray(config.params.bidders)) {
      throw new Error(`${LOG_PREFIX} If specified, the 'bidders' parameter in the module configuration must be an array.`);
    }

    if (config.params.bidders.length === 0) {
      throw new Error(`${LOG_PREFIX} If specified, the 'bidders' parameter array in the module configuration must contain at least one bidder code.`)
    }
  }
}

/**
 * onGetBidRequestData is called once per auction.
 * Update the `ortb2Fragments` object with the data from the injected script.
 *
 * @param {Object} reqBidsConfigObj
 * @param {function} callback
 * @param {SubmoduleConfig} config
 * @param {UserConsentData} userConsent
 */
function onGetBidRequestData(reqBidsConfigObj, callback, config, userConsent) {
  const fragment = { ext: enrichmentData };
  if (!config.params || !config.params.bidders) {
    mergeDeep(reqBidsConfigObj.ortb2Fragments.global, fragment);
  } else {
    config.params.bidders.forEach((bidderCode) => {
      mergeDeep(reqBidsConfigObj.ortb2Fragments.bidder, { [bidderCode]: fragment });
    });
  }
  callback();
}

/**
 * The function which performs submodule registration.
 */
function registerHumanMediaGuardSubmodule() {
  submodule('realTimeData', /** @type {RtdSubmodule} */ ({
    name: SUBMODULE_NAME,

    init: (config, userConsent) => {
      try {
        readConfig(config);
        injectHumanSecurityScript(config);

        return true;
      } catch (err) {
        logError(LOG_PREFIX, err.message);
        return false;
      }
    },
    getBidRequestData: onGetBidRequestData
  }));
}

/**
 * Exporting local (and otherwise encapsulated to this module) functions
 * for testing purposes
 */
export const __TEST__ = {
  SUBMODULE_NAME,
  SCRIPT_URL,
  updateEnrichmentData,
  onGetBidRequestData,
  readConfig,
  injectHumanSecurityScript,
  registerHumanMediaGuardSubmodule
}

registerHumanMediaGuardSubmodule();
