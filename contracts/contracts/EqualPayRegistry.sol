// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
interface IEqualPayBadge {
    function mint(address to, uint256 tokenId) external;
}

/// @author MashaVaverova
contract EqualPayRegistry is AccessControl {
    bytes32 public constant ATTESTOR_ROLE = keccak256("ATTESTOR_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");

    enum ReportStatus {
        None,
        Submitted,
        Verified
    }

    struct Company {
        address owner;
        string metadataURI;
        bool exists;
    }

    struct Report {
        bytes32 companyId;
        uint32 periodStart; // YYYYMMDD packed
        uint32 periodEnd;   // YYYYMMDD packed
        bytes32 reportHash; // keccak256(canonicalJson)
        string dataURI;     // optional pointer to API/IPFS
        ReportStatus status;

        int32 scoreBps;         // e.g. 742 = 7.42%
        bytes32 methodologyId;  // keccak256("mean_gap_v1_fte")
        uint8 attestationCount;

        bool badgeMinted;
        bool equalityAchieved;
    }

    // --- Config set at deployment (traceable & verifiable) ---
    int32 public immutable equalityThresholdBps;
    bytes32 public immutable requiredMethodologyId;

    uint8 public attestorThreshold = 2;

    address public badgeContract;    

    mapping(bytes32 => Company) public companies;
    mapping(bytes32 => Report) public reports;
    mapping(bytes32 => mapping(address => bool)) public hasAttested;

    event CompanyRegistered(bytes32 indexed companyId, address indexed owner, string metadataURI);
    event ReportSubmitted(
        bytes32 indexed reportId,
        bytes32 indexed companyId,
        uint32 periodStart,
        uint32 periodEnd,
        bytes32 reportHash,
        string dataURI
    );
    event ScorePublished(bytes32 indexed reportId, int32 scoreBps, bytes32 methodologyId);
    event ReportAttested(bytes32 indexed reportId, address indexed attestor, uint8 attestationCount);
    event ReportVerified(bytes32 indexed reportId);
    event EqualityAchieved(bytes32 indexed reportId, int32 scoreBps, int32 thresholdBps);
    event BadgeIssued(bytes32 indexed reportId, bytes32 indexed companyId, address indexed owner, uint256 tokenId);
    constructor(int32 _equalityThresholdBps, bytes32 _requiredMethodologyId, address admin) {
        equalityThresholdBps = _equalityThresholdBps;
        requiredMethodologyId = _requiredMethodologyId;

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    function registerCompany(bytes32 companyId, string calldata metadataURI) external {
        require(companyId != bytes32(0), "companyId=0");
        require(!companies[companyId].exists, "company exists");

        companies[companyId] = Company({
            owner: msg.sender,
            metadataURI: metadataURI,
            exists: true
        });

        emit CompanyRegistered(companyId, msg.sender, metadataURI);
    }
    function submitReport(
    bytes32 companyId,
    uint32 periodStart,
    uint32 periodEnd,
    bytes32 reportHash,
    string calldata dataURI
) external {

    Company memory company = companies[companyId];

    require(company.exists, "company not found");
    require(company.owner == msg.sender, "not company owner");
    require(reportHash != bytes32(0), "invalid reportHash");

    bytes32 reportId = keccak256(
        abi.encode(companyId, periodStart, periodEnd, reportHash)
    );

    require(reports[reportId].status == ReportStatus.None, "report exists");

    reports[reportId] = Report({
        companyId: companyId,
        periodStart: periodStart,
        periodEnd: periodEnd,
        reportHash: reportHash,
        dataURI: dataURI,
        status: ReportStatus.Submitted,
        scoreBps: 0,
        methodologyId: bytes32(0),
        attestationCount: 0,
        badgeMinted: false,
        equalityAchieved: false
    });

    emit ReportSubmitted(
        reportId,
        companyId,
        periodStart,
        periodEnd,
        reportHash,
        dataURI
    );
}
function publishScore(
    bytes32 reportId,
    int32 scoreBps,
    bytes32 methodologyId
) external onlyRole(ORACLE_ROLE) {
    Report storage report = reports[reportId];

    require(report.status != ReportStatus.None, "report not found");
    require(report.status == ReportStatus.Submitted, "invalid status");
    require(methodologyId != bytes32(0), "invalid methodology");

    report.scoreBps = scoreBps;
    report.methodologyId = methodologyId;

    if (
        methodologyId == requiredMethodologyId &&
        scoreBps <= equalityThresholdBps
    ) {
        report.equalityAchieved = true;
        emit EqualityAchieved(reportId, scoreBps, equalityThresholdBps);
    }
_tryMintBadge(reportId);
    emit ScorePublished(reportId, scoreBps, methodologyId);
}
function attest(bytes32 reportId) external onlyRole(ATTESTOR_ROLE) {
    Report storage report = reports[reportId];

    require(report.status == ReportStatus.Submitted, "invalid status");
    require(!hasAttested[reportId][msg.sender], "already attested");

    hasAttested[reportId][msg.sender] = true;

    report.attestationCount += 1;

    emit ReportAttested(reportId, msg.sender, report.attestationCount);

    if (report.attestationCount >= attestorThreshold) {
        report.status = ReportStatus.Verified;
        emit ReportVerified(reportId);
        _tryMintBadge(reportId);
    }
}

function getCompany(bytes32 companyId) external view returns (Company memory) {
    return companies[companyId];
}

function getReport(bytes32 reportId) external view returns (Report memory) {
    return reports[reportId];
}

function setBadgeContract(address _badgeContract) external onlyRole(DEFAULT_ADMIN_ROLE) {
    require(_badgeContract != address(0), "invalid badge contract");
    badgeContract = _badgeContract;
}
function _tryMintBadge(bytes32 reportId) internal {
    Report storage report = reports[reportId];

    if (report.badgeMinted) return;
    if (badgeContract == address(0)) return;
    if (report.status != ReportStatus.Verified) return;
    if (report.methodologyId == bytes32(0)) return;

    Company memory company = companies[report.companyId];
    if (!company.exists || company.owner == address(0)) return;

    uint256 tokenId = uint256(reportId);

    report.badgeMinted = true;
    IEqualPayBadge(badgeContract).mint(company.owner, tokenId);

    emit BadgeIssued(reportId, report.companyId, company.owner, tokenId);
}
}