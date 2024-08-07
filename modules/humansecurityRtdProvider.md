# Overview

```
Module Name: Human Security Rtd provider
Module Type: Rtd Provider
Maintainer: alexey@humansecurity.com
```

The Human Security RTD submodule offers pre-bid signal collection, aimed to improve real-time protection
against all sorts of invalid traffic, such as bot-generated ad interactions or sophisticated ad fraud schemes.
It generates Human Security token, which then can be consumed by vendors, sent within bid requests,
and used for bot detection on the backend.


# Build
First, make sure to add the Human Security submodule to your Prebid.js package with:

```bash
gulp build --modules="rtdModule,humansecurityRtdProvider,..."
```

> `rtdModule` is a required module to use Human Security RTD module.

# Configuration

Please refer to [Prebid Documentation](https://docs.prebid.org/dev-docs/publisher-api-reference/setConfig.html#setConfig-realTimeData)
on RTD module configuration for details on required and optional parameters of `realTimeData`

This module is configured as part of the `realTimeData.dataProviders` object.
```javascript
pbjs.setConfig({
    realTimeData: {
        dataProviders: [{
            name: 'humansecurity',
            params: {
                clientId: 'ABC123', // optional, can be omitted
                verbose: true, // optional, should be false in production
            }
        }]
    }
});
```

Parameters:

* `clientId` - optional, string. Should you need advanced reporting, contact prebid@humansecurity.com to receive client ID.
* `verbose` - optional, boolean. Only set to `true` if troubleshooting issues.


# Notes

## Rationale

Historically, IVT protection is achieved via dropping analytics scripts and/or pixels in the ads, which enriches impression
data with collected signals. Those signals, when analyzed by IVT protection vendors, allow distinguishing valid from invalid
traffic, but only retroactively - after the impression was served, and all the participant infrastructures has already
participated in serving the request. This not only leads to unnecessary infrastructure costs, but to uncomfortable processes
of reimbursement, or clawback.

MediaGuard from HUMAN solves this problem by making predictions at pre-bid stage on whether the traffic is fradulent, allowing
the platforms to knowingly not participate in the IVT-generated auctions.

However, the challenge in making those predictions is that it has to primarily rely on historical data, which introduces lag,
and typically might be less accurate, than direct decision making using the high-quality signals obtained from the pixels
and/or JS analytics scripts delivered in the ads.

This is where this RTD submodule bridges the gap by facilitating the very same signal collection that is typically performed
post-bid, and makes the signals available during bidding.

## Operation model

Together, the data flow looks like this:

* Prebid.js gets initialized, including HUMAN RTD submodule.
* Submodule loads the signal collection implementation script from high-performance, low latency endpoint.
* This script starts collecting the signals, and makes them available to the RTD submodule as soon as possible.
* The RTD submodule places the collected signals into the ORTB structure for bid adapters to pick up.
* Bid adapters are expected to retrieve `ortb2.ext.hmns` object and incorporate it into their bid requests.
* Bid requests having `ortb2.ext.hmns` data allow their backend to make more informative requests to HUMAN MediaGuard.
    * Should bid requests be passed to other platforms during the bidding process, it's encouraged to keep `ortb2.ext.hmns`
      so that, for example, a downstream DSP can also has have this data passed to Human.
* HUMAN MediaGuard uses the additional high-quality signal from `ortb2.ext.hmns`, and provides IVT classification response
  with improved quality and accuracy.


## Remarks on the collected signals

There are a few points that are worth being mentioned separately, to avoid confusion and suspicion:

* The nature of the collected signals is *exactly the same* as those already collected in analytics scripts that arrive in the ads.
* The signals themselves are even less verbose than those HUMAN collects post-bid, because of timing / performance requirements.
* No signals attempt to *identify* users, their only purpose is to classify traffic into valid / invalid.
* The signal collection script is external to Prebid.js, so that it can be constantly kept up to date with ever-evolving browser
  nature without the publishers having to re-build their Prebid.js frequently.
  * It's also obfuscated, as all similar scripts in the industry are, which is something that cannot be accommodated by Prebid.js.
