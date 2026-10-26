// Single place to rename the product. The reference screenshots use "ARITOHAM";
// this build uses the Aritoham identity. Change these and everything follows.

import { config } from "./contract";

export const BRAND = {
  name: "ARITOHAM",
  sub: "Protocol",
  token: "ARI",
  userPrefix: "ARI",
  domain: "app.aritohamprotocol.com",
  protocolContract: config.addresses.protocol,
  tokenContract: config.addresses.aritoham,
};

export const DEMO_ADDRESS = "0x0000000000000000000000000000000000000000";
