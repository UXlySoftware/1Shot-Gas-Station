// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const LIFI_DIAMOND = "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE";

const GasStationModule = buildModule("GasStation", (m) => {

  const gasStation = m.contract("GasStation1Shot", [LIFI_DIAMOND]);

  return { gasStation };
});

export default GasStationModule;
