import { parseAbi } from "viem";

/**
 * Hand-written, read-only slice of ARITOHAMProtocol (main contract).
 * Includes the view functions the website needs and the events used to
 * look up Txn Hashes.
 */
export const protocolAbi = parseAbi([
  // structs
  "struct User { address referrer; bool isRegistered; bool isActive; uint256 totalInvestment; uint256 totalStaked; uint256 totalIncome; uint256 balance; uint256 remainingCap; uint256 totalReferralCount; uint256 activeReferralCount; uint256 qualifiedReferralCount; uint256 maxPayout; uint256 directIncome; uint256 generationIncome; uint256 daoIncome; uint256 currentRank; uint256 rewardIncome; uint256 rankIncentive; uint256 roiAccrued; uint256 totalStakeRoi; uint256 lastRoiUpdate; }",
  // views
  "function getUser(address user) view returns (User)",
  "function usdt() view returns (address)",
  "function aritoham() view returns (address)",
  "function paused() view returns (bool)",
  "function currentPrice() view returns (uint256)",
  "function getPrice() view returns (uint256)",
  "function totalUsers() view returns (uint256)",
  "function openLevels(address user) view returns (uint256)",
  "function isUserRegistered(address user) view returns (bool)",
  "function isUserActive(address user) view returns (bool)",
  "function getReferralCount(address user) view returns (uint256)",
  "function getSystemInfo() view returns (uint256 liquidityPool, uint256 totalSupply, uint256 totalBurnedTokens, uint256 currentPrice, uint256 contractUsdtBalance)",
  "function getDaoInfo() view returns (uint256 poolTotal, uint256 cycle, uint256 currentShares, uint256 lastCycleStart, uint256 payCycle, uint256 payCursor)",
  "function getUserInfo(address user) view returns (uint256 totalInvestment, uint256 totalIncome, uint256 balance, uint256 roiAccrued, uint256 stakeCount, bool isActive)",
  "function MIN_BUY() view returns (uint256)",
  "function MAX_BUY() view returns (uint256)",
  "function BUY_STEP() view returns (uint256)",
  "function MIN_WITHDRAW() view returns (uint256)",
  "function MAX_WITHDRAW() view returns (uint256)",
  "function DAILY_SELL_LIMIT() view returns (uint256)",
  "function SELL_PAYOUT_PCT() view returns (uint256)",
  // events (for Txn Hash lookup)
  "event TokensPurchased(address indexed user, uint256 usdtAmount, uint256 tokens, uint256 price)",
  "event TokensSold(address indexed user, uint256 tokens, uint256 usdtPayout, uint256 price)",
  "event Withdraw(address user, uint256 amount, uint256 tokens, uint256 fee, uint256 price)",
  "event StakeRoiClaimed(address indexed user, uint256 indexed stakeIndex, uint256 stakeAmount, uint256 roiReward, uint256 forPeriods)",
  "event DirectIncomeDistributed(address indexed from, address indexed to, uint256 amount)",
  "event GenerationIncomeDistributed(address indexed from, address indexed to, uint256 level, uint256 amount)",
  "event RewardIncomeUpdated(address user, uint256 amount, uint256 rank)",
  "event RankIncentiveUpdated(bytes32 indexed id, address indexed user, uint256 amount, uint256 rank, uint256 timestamp)",
  "event DaoRewardCredited(address indexed user, uint256 amount)",

  // write functions
  "function register(address _referrer)",
  "function stakeTokens(uint256 usdtAmount, uint256 minTokensOut)",
  "function sellTokens(uint256 tokenAmount)",
  "function claimRoi()",
  "function withdraw(uint256 amount)",

  // custom errors
  "error AlreadyRegistered()",
  "error ReferrerNotRegistered()",
  "error ReferrerNotActive()",
  "error NotRegistered()",
  "error NotActive()",
  "error NotAdmin()",
  "error NotChainKeeper()",
  "error ZeroAddress()",
  "error InvalidAmount()",
  "error InsufficientTokens()",
  "error InsufficientLiquidity()",
  "error NothingToWithdraw()",
  "error MaxPayoutReached()",
  "error LiquidityInvariantBroken()",
  "error DailySellLimitExceeded()",
  "error SlippageExceeded()",
  "error InsufficientBalance()",
]);

/** The few ERC-20 reads we need (USDT + ARITOHAM token). */
/** ERC-20 read + write functions (USDT + ARITOHAM token). */
export const erc20Abi = parseAbi([
  // Read functions
  "function balanceOf(address account) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "function owner() view returns (address)",
  "function minter() view returns (address)",

  // Standard ERC-20 write functions
  "function approve(address spender, uint256 value) returns (bool)",
  "function transfer(address to, uint256 value) returns (bool)",
  "function transferFrom(address from, address to, uint256 value) returns (bool)",

  // Burn functions
  "function burn(uint256 value)",
  "function burn(address from, uint256 amount)",
  "function burnFrom(address account, uint256 value)",

  // Mint function
  "function mint(address to, uint256 amount)",

  // Minter management
  "function setMinter(address _minter)",

  // Ownership management
  "function transferOwnership(address newOwner)",
  "function renounceOwnership()",
]);

/** Public getters of AritohamDataStore that the Readers do not wrap. */
export const dataStoreAbi = parseAbi([
  "function idToUser(uint32 id) view returns (address)",
  "function totalUsers() view returns (uint256)",
  "function totalDeposits() view returns (uint256)",
  "function currentCycle() view returns (uint256)",
  "function lastDistributedCycle() view returns (uint256)",
  "function cycleDeposit(uint256 cycle) view returns (uint256)",
  "function lifetimeHolders() view returns (uint256)",
  "function latestPrice() view returns (uint128)",
  "function dailyLimit() view returns (uint256)",
  "function daoBps() view returns (uint256)",
]);
