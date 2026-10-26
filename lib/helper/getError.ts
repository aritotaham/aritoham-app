import { BaseError, ContractFunctionRevertedError } from "viem";

export function getError(error: unknown): string | null {
  if (!(error instanceof BaseError)) {
    return null;
  }

  const revertedError = error.walk(
    (err) => err instanceof ContractFunctionRevertedError
  );

  if (
    revertedError instanceof ContractFunctionRevertedError &&
    revertedError.data?.errorName === "InsufficientTokens"
  ) {
    return "InsufficientTokens";
  }

  return null;
}
