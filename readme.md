# DApp React Typescript Boiler

This boilerplate code provides a solid foundation for developing decentralized applications (dApps) using React. It is specifically designed to support multichain environments and simplifies the process of fetching data from various blockchain networks.

It has builtin support for `Mui5` with customizations and is using `Vite` with `SWC` which makes it super fast in developement

Redux store is managed with the architecture focused on multichain data handling and fetching, Tokens balance fetching is implemented and can be used as a reference for other data requirements.

## Features

- `Super Fast Development Server`
- Multichain Support
- Major Wallets Support
- Mui 5 (with theme customization)
- React
- Vite (SWC)
- Redux toolkit
- Pages Routing
- Wagmi
- Veim
- **Ocean Protocol Integration** - Publish finalized properties as NFTs on Ocean Protocol for data sharing and monetization
- Rainbowkit
- Notification System (reapop)
- Multichain Data Fetching
- Advance Architecture
- Smart Contract Integration
- Absolute Paths
- Prettier formating

## Demo

https://harmonious-khapse-d70151.netlify.app/

## Getting Started

#### Step 1: Clone

```
npx degit saqlain1020/dapp-react-typescript-boiler#main my-project
```

#### Step 2: Install Dependencies

```
yarn
```

#### Step 3: Run

```
yarn start
```

### Build

```
yarn build
```

## Ocean Protocol Integration

This application includes integrated Ocean Protocol functionality that allows users to publish finalized property investments as NFTs on the Ocean Protocol network.

### Features

- **Automatic NFT Creation**: Once a property is finalized, users can publish it as an NFT on Ocean Protocol
- **Data Monetization**: Properties published on Ocean Protocol can be monetized through data access
- **Multi-chain Support**: Works on Arbitrum and Arbitrum Sepolia networks
- **Rich Metadata**: NFTs include comprehensive property information including investment details, shares, and platform metadata

### Usage

1. Navigate to a finalized property page
2. Look for the "🌊 Ocean Protocol Publishing" section
3. Click "🚀 Publish on Ocean Protocol" to create an NFT
4. Once published, you can view the NFT on Ocean Market

### Technical Implementation

- **Service**: `src/services/oceanProtocol.ts` - Core Ocean Protocol integration
- **Component**: `src/components/OceanProtocolPublisher.tsx` - Reusable publisher component
- **Integration**: Property pages automatically show Ocean Protocol publishing options for finalized properties

The Ocean Protocol integration uses the official `@oceanprotocol/lib` SDK and supports the latest Ocean Protocol v4 features.

## License

[MIT](https://choosealicense.com/licenses/mit/)

## Authors

- [@saqlain1020](https://www.github.com/saqlain1020)

## Used By

This project is used by the following companies:

- [Dechains](https://dechains.com)

## Contributing

Contributions are always welcome!

- Fork the repo and make your changes then open the pull request.
- Maintain consistency with the existing codebase to ensure readability and maintainability.

