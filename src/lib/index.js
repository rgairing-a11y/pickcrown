// index.js
// PickCrown UX & Safety Package - Main exports

// Utilities
export {
  EDIT_CONFIG,
  getEditStatus,
  formatEditStatus,
  validateEditRequest,
} from './lib/entry-editing';

export {
  validateEmail,
  validateEntryName,
  validatePoolName,
  validatePicksComplete,
  validateForm,
  sanitizeInput,
  sanitizeEmail,
} from './lib/validation';

// Components
export {
  default as ConfirmationModal,
  EditConfirmationModal,
  DeleteConfirmationModal,
} from './components/ConfirmationModal';

export {
  default as ErrorMessage,
  FieldError,
  ERROR_TYPES,
  parseError,
  getErrorTypeFromStatus,
} from './components/ErrorMessage';

export {
  default as PoolRulesPanel,
  PoolRulesInline,
} from './components/PoolRulesPanel';

export {
  SavedToast,
  SavedBanner,
  SavedStatus,
  SubmissionConfirmation,
} from './components/SavedConfirmation';

export {
  EntryCount,
  ResultsStatus,
  ResultsStatusBadge,
  PoolStatusHeader,
  LockCountdown,
  EventComplete,
} from './components/PoolStatusIndicators';
