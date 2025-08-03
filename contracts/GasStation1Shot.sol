// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.27;
interface IERC20WithEIP3009 {
    function transferWithAuthorization(
        address from,
        address to,
        uint256 value,
        uint256 validAfter,
        uint256 validBefore,
        bytes32 nonce,
        bytes calldata signature
    ) external;

    function allowance(
        address owner,
        address spender
    ) external view returns (uint256);

    function approve(address spender, uint256 amount) external returns (bool);

    function balanceOf(address account) external view returns (uint256);
}

contract GasStation1Shot {
    address public immutable LIFI_DIAMOND;

    bytes4 private immutable MULTIPLE_V3_ERC20_TO_NATIVE_SELECTOR = 0x2c57e884;

    bytes4 private immutable SINGLE_V3_ERC20_TO_NATIVE_SELECTOR = 0x733214a3;

    /// Errors ///

    error CallToDiamondFailed(bytes);
    error InvalidDiamondFunctionSignature(bytes4 selector);
    error AuthorizingAddressNotReceiver(address from, address receiver);
    error UnspentUserFunds(
        address tokenAddress,
        uint256 amount,
        address receiver,
        address caller
    );

    constructor(address _lifiDiamond) {
        LIFI_DIAMOND = _lifiDiamond;
    }

    /// @notice Allows to bridge tokens of one type through a LI.FI diamond
    ///         contract using EIP-3009 signatures through self-sponsoshipt or a relayer.
    ///         The contract ensures the authorizer is the receiver of the native tokens
    ///         and that the function signature is one of the LI.FI functions that swaps to
    ///         native tokens. Lastly, it ensures that all user funds are spent. A malicious
    ///         relayer can still charge an excessive fee or an unoptimized swap route.
    /// @param tokenAddress the address of the token to swap
    /// @param from the address of the user who signed the EIP-3009 authorization
    /// @param value the amount of tokens to swap
    /// @param validAfter the timestamp after which the authorization is valid
    /// @param validBefore the timestamp before which the authorization is valid
    /// @param nonce the nonce of the EIP-3009 authorization
    /// @param signature the signature giving approval to transfer tokens
    /// @param diamondCalldata the calldata to execute
    function callDiamondWithEIP3009SignatureToNative(
        address tokenAddress,
        address from,
        uint256 value,
        uint256 validAfter,
        uint256 validBefore,
        bytes32 nonce,
        bytes calldata signature,
        bytes calldata diamondCalldata
    ) public returns (bytes memory) {
        // Check that the function selector is one that swaps to the native token
        bytes4 selector;
        assembly {
            selector := calldataload(diamondCalldata.offset)
        }
        if (
            selector != MULTIPLE_V3_ERC20_TO_NATIVE_SELECTOR &&
            selector != SINGLE_V3_ERC20_TO_NATIVE_SELECTOR
        ) {
            revert InvalidDiamondFunctionSignature(selector);
        }

        // Make sure the authorizing address will be the receiver of the tokens
        address receiver;
        assembly {
            // _receiver is at diamondCalldata.offset + 4 + (32 * 3)
            receiver := calldataload(add(diamondCalldata.offset, 100))
        }

        if (receiver != from) {
            revert AuthorizingAddressNotReceiver(from, receiver);
        }

        // first use the authorization to transfer tokens from the users wallet to this contract
        IERC20WithEIP3009(tokenAddress).transferWithAuthorization(
            from,
            address(this), // the authorization must have been for this contract address
            value,
            validAfter,
            validBefore,
            nonce,
            signature
        );

        // approve the Li.Fi diamond contract to spend the tokens
        if (
            IERC20WithEIP3009(tokenAddress).allowance(
                address(this),
                LIFI_DIAMOND
            ) < value
        ) {
            IERC20WithEIP3009(tokenAddress).approve(
                LIFI_DIAMOND,
                type(uint256).max
            );
        }

        bytes memory data = _executeCalldata(diamondCalldata);

        // ensure that no user funds were left unspent
        uint leftoverBalance = IERC20WithEIP3009(tokenAddress).balanceOf(
            address(this)
        );
        if (leftoverBalance > 0) {
            revert UnspentUserFunds(
                tokenAddress,
                leftoverBalance,
                receiver,
                tx.origin // blame the relayer
            );
        }

        return data;
    }

    function _executeCalldata(
        bytes memory diamondCalldata
    ) internal returns (bytes memory) {
        // call diamond with provided calldata
        // solhint-disable-next-line avoid-low-level-calls
        (bool success, bytes memory data) = LIFI_DIAMOND.call{value: msg.value}(
            diamondCalldata
        );

        if (!success) {
            revert CallToDiamondFailed(data);
        }
        return data;
    }
}
