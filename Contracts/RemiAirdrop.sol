pragma solidity ^0.5.0;

import "./ownable.sol";
import "./IERC20.sol";

contract RemiAirdrop is Ownable{
    // Notify when contract deployed
    event contractDeployed();
    

    // State Variable that affects to airdropToken function
    address public SOURCE_ADDRESS;
    uint public DEFAULT_AMOUNT;
    IERC20 public REMI_INTERFACE;
    

    // Set state variables simultaneously with construct
    constructor (address _tokenAddress, address _sourceAddress, uint _defaultAmount) public{
        REMI_INTERFACE = IERC20(_tokenAddress);
        SOURCE_ADDRESS = _sourceAddress;
        DEFAULT_AMOUNT = _defaultAmount;
        
        emit contractDeployed();
    }
    
    // Airdrop token from SOURCE_ADDRESS a _dropAmount per each _recipientList[i] via REMI_INTERFACE
    function airdropToken(address[] calldata _recipientList, uint _dropAmount) external onlyOwner{
        uint dropAmount = (_dropAmount > 0 ? _dropAmount : DEFAULT_AMOUNT) * 10**18;
        require(_recipientList.length * dropAmount <= REMI_INTERFACE.allowance(SOURCE_ADDRESS,address(this)), "Allowed authority insufficient");
        
        for(uint i = 0; i < _recipientList.length; i++){
            REMI_INTERFACE.transferFrom(SOURCE_ADDRESS, _recipientList[i], dropAmount);
        }
    }

    // Set each state variable manually
    function setTokenAddress(address _newToken) external onlyOwner{
        REMI_INTERFACE = IERC20(_newToken);
    }
    function setSourceAddress(address _newSource) external onlyOwner{
        SOURCE_ADDRESS = _newSource;
    }
    function setDefaultAmount(uint _newAmount) external onlyOwner{
        DEFAULT_AMOUNT = _newAmount;
    }

    // Self destruct and refund balance to owner. need to send owners address to check once again
    function _DESTROY_CONTRACT_(address _check) external onlyOwner{
        require(_check == owner, "Enter owners address correctly");
        selfdestruct(owner);
    }
}