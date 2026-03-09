// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/// @author MashaVaverova
contract EqualPayBadge is ERC721, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    string public baseTokenURI;

    constructor(string memory _baseTokenURI, address admin)
        ERC721("EqualPay Badge", "EPBADGE")
    {
        baseTokenURI = _baseTokenURI;
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    function setBaseTokenURI(string calldata _baseTokenURI)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        baseTokenURI = _baseTokenURI;
    }

    function mint(address to, uint256 tokenId)
        external
        onlyRole(MINTER_ROLE)
    {
        _safeMint(to, tokenId);
    }

    // Soulbound: block normal transfers
    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        returns (address)
    {
        address from = _ownerOf(tokenId);

        if (from != address(0) && to != address(0)) {
            revert("SBT: non-transferable");
        }

        return super._update(to, tokenId, auth);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override
        returns (string memory)
    {
        return string(abi.encodePacked(baseTokenURI, _toHex32(bytes32(tokenId))));
    }

function supportsInterface(bytes4 interfaceId)
    public
    view
    override(ERC721, AccessControl)
    returns (bool)
{
    return super.supportsInterface(interfaceId);
}
    function _toHex32(bytes32 data) internal pure returns (string memory) {
        bytes16 hexSymbols = "0123456789abcdef";
        bytes memory str = new bytes(66);
        str[0] = "0";
        str[1] = "x";

        for (uint256 i = 0; i < 32; i++) {
            uint8 b = uint8(data[i]);
            str[2 + i * 2] = bytes1(hexSymbols[b >> 4]);
            str[3 + i * 2] = bytes1(hexSymbols[b & 0x0f]);
        }

        return string(str);
    }
}