// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.6;

import "@yield-protocol/utils-v2/contracts/token/ERC20Permit.sol";


contract BaseMock is ERC20Permit("Base", "BASE", 18) {
  function mint(address to, uint256 amount) public {
    _mint(to, amount);
  }
}