# cake

A very simple Cloudflare subdomain generator. Use responsibly, CloudFlare will put you in timeout if you abuse this too much. You can make 1,200 API calls per 5 minutes, this app will attempt to manually wait if you make too many.

This uses the `random-words` package to generate subdomains that use everyday words. It will also generate a yml config file saved to the `data` folder that can be used with other apps.

## Requirements

- Node 16.x
- Yarn

## Installation

```bash
yarn install
cp config/default.json config/local.json
nano config/local.json
```

## Usage

```bash
yarn start
```

## Config

### `apiToken`

Your Cloudflare API Token. Visit [here](https://dash.cloudflare.com/profile/api-tokens) to generate one. It must have the ability to edit Zone.DNS for all zones.

### `dnsIpv4Address`

The IP address that you want your subdomains to point to.

### `subdomainCount`

The number of subdomains to generate.

### `clearOldDns`

Whether to clear old subdomains before generating new ones. (Recommended, but only if the domains are not being used for other purposes)

### `domains`

An array of domains to generate subdomains for.

### `logLevel`

The log level to use. Options are `error`, `warn`, `info`, `debug`, and `trace`.

## "Extra" Functionalities

### Clearing Existing Subdomains

- `clearOldDns` = `true`
- `subDomainCount` = `0`

This will only clear all subdomains for each of the domains in the `domains` array.

### Only Generating the YML File

- `clearOldDns` = `false`
- `subDomainCount` = `0`

This will only generate a yml config file for the existing subdomains.

### Updating IPs and Proxy Status

- `yarn update`

This will update the endpoint IP for all of the A records using the IP from the config. It will also set the proxy status to `true`.

### Add CF Mail

- `yarn mailer`

This will create CF mail records.