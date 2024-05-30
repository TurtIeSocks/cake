# cake

A very simple Cloudflare subdomain generator. Use responsibly, CloudFlare will put you in timeout if you abuse this too much. This uses the `random-words` package to generate subdomains that you use everyday words. It will also generate a yml config file saved to the `data` folder that can be used with other apps.

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

### `cloudflare.token`

Your Cloudflare API Token. Visit [here](https://dash.cloudflare.com/profile/api-tokens) to generate one. It must have the ability to edit Zone.DNS for all zones.

### `dns.ip`

The IP address that you want your subdomains to point to.

### `dns.count`

The number of subdomains to generate.

### `dns.clearOld`

Whether to clear old subdomains before generating new ones.

### `domains`

An array of domains to generate subdomains for.
