# Overview

```
Module Name: Human Security Rtd provider
Module Type: Rtd Provider
Maintainer: mykyta.kikot@humansecurity.com
```

The Human Security RTD submodule offers a comprehensive defense against ad fraud and bot traffic for publishers. 
It ensures real-time protection by blocking invalid traffic, detecting and preventing bot-generated ad interactions, and safeguarding ad inventory from sophisticated fraud schemes.


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
            name: 'humansecurity',
            params: {
                clientId: 'ABC123', // optional, can be omitted
                bidders: ['appnexus'], // optional, can be omitted
            }
        }]
    }
});
```

## Configuration parameters

#### `clientId` - Optional, string
- The client ID is provided by Human Security only for specific clients. 

#### `bidders` - Optional, Array<string>
- When this parameter is included, it should be an array of strings that correspond to the bidder codes of the Prebid adapters, the ortb2 object of which will be modified. 
If this parameter is not included, the RTD module will default to updating the ortb2 object for all bid adapters used on the page.
