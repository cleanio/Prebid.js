# Overview

```
Module Name: Human Security Rtd provider
Module Type: Rtd Provider
Maintainer: mykyta.kikot@humansecurity.com
```

The Human Security RTD submodule offers pre-bid signal collection, aimed to improve real-time protection against all sorts of invalid traffic, such as
bot-generated ad interactions or sophisticated ad fraud schemes. It generates Human Security token, which then can be consumed by vendors,
sent within bid requests, and used for bot detection on the backend.


## Build
First, make sure to add the Human Security submodule to your Prebid.js package with:

```bash
gulp build --modules="rtdModule,humansecurityRtdProvider,..."
```

> `rtdModule` is a required module to use Human Security RTD module.

## Configuration

Please refer to [Prebid Documentation](https://docs.prebid.org/dev-docs/publisher-api-reference/setConfig.html#setConfig-realTimeData) on RTD module configuration for details on required and optional parameters of `realTimeData`

This module is configured as part of the `realTimeData.dataProviders` object.
```javascript
pbjs.setConfig({
    realTimeData: {
        dataProviders: [{
            name: 'humansecurityRtd',
            params: {
                clientId: 'ABC123', // optional, can be omitted
                verbose: true, // optional, should be false in production
            }
        }]
    }
});
```

Parameters:

* `clientId` - optional, string. Contact Human Security to receive client ID if you need advanced reporting.
* `verbose` - optional, boolean. Only set to `true` if troubleshooting issues.
