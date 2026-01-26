/**
 * SwarmShield Error Handling
 *
 * User-friendly error messages for common scenarios.
 * Converts technical errors into actionable guidance.
 */

export interface ParsedError {
  title: string;
  message: string;
  action?: string;
  actionUrl?: string;
  severity: "warning" | "error" | "info";
}

/**
 * Error patterns and their user-friendly translations
 */
const ERROR_PATTERNS: Array<{
  pattern: RegExp | string;
  result: Omit<ParsedError, "severity"> & { severity?: ParsedError["severity"] };
}> = [
  // Insufficient funds
  {
    pattern: /insufficient lamports|insufficient funds|not enough sol/i,
    result: {
      title: "Insufficient SOL",
      message: "You need more SOL to complete this transaction.",
      action: "Get Devnet SOL",
      actionUrl: "https://faucet.solana.com",
      severity: "warning",
    },
  },

  // Wallet not connected
  {
    pattern: /wallet not connected|no wallet/i,
    result: {
      title: "Wallet Not Connected",
      message: "Please connect your wallet to continue.",
      severity: "warning",
    },
  },

  // Transaction timeout
  {
    pattern: /timeout|timed out|blockhash expired/i,
    result: {
      title: "Transaction Timeout",
      message: "The transaction took too long. Please try again.",
      severity: "warning",
    },
  },

  // Already processed
  {
    pattern: /already been processed|already in use/i,
    result: {
      title: "Already Processed",
      message: "This action was already completed successfully.",
      severity: "info",
    },
  },

  // Network errors
  {
    pattern: /network error|failed to fetch|connection refused|ECONNREFUSED/i,
    result: {
      title: "Network Error",
      message: "Unable to connect to Solana. Please check your connection.",
      severity: "error",
    },
  },

  // RPC rate limit
  {
    pattern: /rate limit|429|too many requests/i,
    result: {
      title: "Rate Limited",
      message: "Too many requests. Please wait a moment and try again.",
      severity: "warning",
    },
  },

  // Account not found
  {
    pattern: /account.*not found|does not exist/i,
    result: {
      title: "Account Not Found",
      message: "The required account doesn't exist. You may need to initialize first.",
      severity: "warning",
    },
  },

  // Agent not registered
  {
    pattern: /agent not registered|not registered/i,
    result: {
      title: "Not Registered",
      message: "Please register as an agent before trading.",
      severity: "warning",
    },
  },

  // Slippage exceeded
  {
    pattern: /slippage|price movement|price changed/i,
    result: {
      title: "Slippage Exceeded",
      message: "Price moved too much. Try again or increase slippage tolerance.",
      severity: "warning",
    },
  },

  // User rejected
  {
    pattern: /user rejected|user denied|rejected by user|cancelled/i,
    result: {
      title: "Transaction Cancelled",
      message: "You cancelled the transaction in your wallet.",
      severity: "info",
    },
  },

  // Simulation failed
  {
    pattern: /simulation failed|preflight/i,
    result: {
      title: "Transaction Failed",
      message: "The transaction simulation failed. Please try again.",
      severity: "error",
    },
  },

  // Balance exceeded
  {
    pattern: /exceeds.*balance|insufficient.*balance/i,
    result: {
      title: "Insufficient Balance",
      message: "You don't have enough funds for this transaction.",
      severity: "warning",
    },
  },

  // Encryption error
  {
    pattern: /encryption failed|encrypt/i,
    result: {
      title: "Encryption Error",
      message: "Failed to encrypt your intent. Please try again.",
      severity: "error",
    },
  },
];

/**
 * Parse an error into a user-friendly format
 */
export function parseError(error: unknown): ParsedError {
  // Get error message
  let errorMessage = "Unknown error";

  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === "string") {
    errorMessage = error;
  } else if (error && typeof error === "object") {
    errorMessage = (error as any).message || JSON.stringify(error);
  }

  // Check against patterns
  for (const { pattern, result } of ERROR_PATTERNS) {
    const matches =
      typeof pattern === "string"
        ? errorMessage.toLowerCase().includes(pattern.toLowerCase())
        : pattern.test(errorMessage);

    if (matches) {
      return {
        severity: "error",
        ...result,
      };
    }
  }

  // Default error
  return {
    title: "Something Went Wrong",
    message: errorMessage.length > 100
      ? errorMessage.slice(0, 100) + "..."
      : errorMessage,
    severity: "error",
  };
}

/**
 * Format error for display in UI
 */
export function formatErrorForDisplay(error: unknown): string {
  const parsed = parseError(error);
  return parsed.message;
}

/**
 * Check if error is recoverable (user can retry)
 */
export function isRecoverableError(error: unknown): boolean {
  const parsed = parseError(error);
  return parsed.severity === "warning" || parsed.severity === "info";
}

/**
 * Get action button text if applicable
 */
export function getErrorAction(error: unknown): {
  text: string;
  url?: string;
} | null {
  const parsed = parseError(error);
  if (parsed.action) {
    return {
      text: parsed.action,
      url: parsed.actionUrl,
    };
  }
  return null;
}

/**
 * Error boundary component helper
 */
export function getErrorBoundaryMessage(error: Error): string {
  const parsed = parseError(error);
  return `${parsed.title}: ${parsed.message}`;
}

export default {
  parseError,
  formatErrorForDisplay,
  isRecoverableError,
  getErrorAction,
};
