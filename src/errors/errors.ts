export const invalidContractAddressError = new Error('Invalid contract address');
invalidContractAddressError.name = 'InvalidContractAddress';

export const subtractionOverflowError = new Error('Subtraction overflow');
subtractionOverflowError.name = 'SubtractionOverflow';

export const negativeIncrementError = new Error('Negative increment');
negativeIncrementError.name = 'NegativeIncrement';

export const negativeDecrementError = new Error('Negative decrement');
negativeDecrementError.name = 'NegativeDecrement';

export const resourceNotFoundError = new Error('Resource not found');
resourceNotFoundError.name = 'ResourceNotFound';

export const contractScanStatusNotFoundError = new Error('ContractScanStatus not found');
contractScanStatusNotFoundError.name = 'ContractScanStatusNotFound';
